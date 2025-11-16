
import React, { useState, useEffect, useRef } from 'react';
import ConditionsPage from './pages/ConditionsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import CarsPage from './pages/CarsPage';
import HotLeadsPage from './pages/HotLeadsPage';
import CarPricesPage from './pages/CarPricesPage';
import Spinner from './components/Spinner';
import { LogoutIcon } from './components/icons/LogoutIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { getActiveLeads } from './services/api';
import type { ActiveLead } from './types';
import { UsersIcon } from './components/icons/UsersIcon';
import { ConditionsIcon } from './components/icons/ConditionsIcon';
import { CarIcon } from './components/icons/CarIcon';
import { FireIcon } from './components/icons/FireIcon';
import { PriceIcon } from './components/icons/PriceIcon';
import { MoreIcon } from './components/icons/MoreIcon';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeView, setActiveView] = useState<'hot-leads' | 'conditions' | 'users' | 'cars' | 'car-prices' | 'settings'>('conditions');
    const [userPageInitialFilters, setUserPageInitialFilters] = useState<{ carModel?: string }>({});
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const knownLeadsRef = useRef<Set<string>>(new Set());
    const isInitialLoadRef = useRef(true);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        const checkHotLeads = async () => {
            if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
                return;
            }

            try {
                const activeLeads = await getActiveLeads();
                
                const newLeads: ActiveLead[] = [];
                const currentLeadIds = new Set<string>();

                activeLeads.forEach(lead => {
                    const leadId = `${lead.number}-${lead.updatedAt}`;
                    currentLeadIds.add(leadId);

                    if (!isInitialLoadRef.current && !knownLeadsRef.current.has(leadId)) {
                        newLeads.push(lead);
                    }
                });
                
                if (isInitialLoadRef.current) {
                    knownLeadsRef.current = currentLeadIds;
                    isInitialLoadRef.current = false;
                    return;
                }

                if (newLeads.length > 0) {
                    const registration = await navigator.serviceWorker.ready;
                    
                    const leadToShow = newLeads[0];
                    let notificationTitle = 'سرنخ داغ جدید';
                    let notificationBody = `یک سرنخ داغ جدید از ${leadToShow.FullName} دریافت شد.`;
                    
                    if (newLeads.length > 1) {
                        notificationTitle = `${newLeads.length.toLocaleString('fa-IR')} سرنخ داغ جدید`;
                        notificationBody = `شما ${newLeads.length.toLocaleString('fa-IR')} سرنخ داغ جدید پاسخ داده نشده دارید.`;
                    }

                    registration.showNotification(notificationTitle, {
                        body: notificationBody,
                        icon: '/vite.svg',
                        badge: '/vite.svg',
                        tag: 'new-hot-lead',
                    });
                }

                knownLeadsRef.current = currentLeadIds;

            } catch (error) {
                console.error('Failed to check for new hot leads:', error);
            }
        };
        
        isInitialLoadRef.current = true;
        checkHotLeads();
        const intervalId = setInterval(checkHotLeads, 60000); // Poll every 60 seconds

        return () => clearInterval(intervalId);
    }, [isAuthenticated]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLoginSuccess = (token: string, remember: boolean) => {
        if (remember) {
            localStorage.setItem('authToken', token);
        } else {
            sessionStorage.setItem('authToken', token);
        }
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
    };

    const handleNavigateToUsersWithFilter = (carModel: string) => {
        setUserPageInitialFilters({ carModel });
        setActiveView('users');
    };

    if (isLoading) {
        return (
            <div className="bg-slate-100 min-h-screen flex justify-center items-center">
                <Spinner />
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    const navButtonClasses = "px-4 py-2 rounded-lg font-semibold transition-colors duration-200";
    const activeClasses = "bg-sky-600 text-white";
    const inactiveClasses = "bg-white text-sky-700 hover:bg-sky-100";
    
    // FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
    const navItems: { id: 'hot-leads' | 'users' | 'conditions' | 'cars' | 'car-prices', title: string, icon: React.ReactElement }[] = [
        { id: 'hot-leads', title: 'سرنخ های داغ', icon: <FireIcon /> },
        { id: 'users', title: 'سرنخ های فروش', icon: <UsersIcon /> },
        { id: 'conditions', title: 'شرایط فروش', icon: <ConditionsIcon /> },
        { id: 'cars', title: 'خودروها', icon: <CarIcon /> },
        { id: 'car-prices', title: 'قیمت خودروها', icon: <PriceIcon /> },
    ];

    return (
        <div className="bg-slate-100 min-h-screen text-slate-800">
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-sky-700">AutoLead</h1>
                    
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        <nav className="flex items-center gap-2">
                           {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveView(item.id)}
                                    title={item.title}
                                    className={`${navButtonClasses} !p-2.5 ${activeView === item.id ? activeClasses : inactiveClasses}`}
                                >
                                    {item.icon}
                                </button>
                           ))}
                        </nav>
                         <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setActiveView('settings')}
                                title="تنظیمات"
                                className={`${navButtonClasses} !p-2.5 ${activeView === 'settings' ? activeClasses : inactiveClasses}`}
                            >
                                <SettingsIcon />
                            </button>
                            <button 
                                onClick={handleLogout}
                                title="خروج"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-colors duration-200 bg-red-100 text-red-700 hover:bg-red-200"
                            >
                                <LogoutIcon />
                                <span className="hidden sm:inline">خروج</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Mobile Navigation */}
                    <div className="md:hidden" ref={menuRef}>
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(prev => !prev)}
                                className="p-2 rounded-full hover:bg-slate-100"
                                aria-haspopup="true"
                                aria-expanded={isMenuOpen}
                                aria-label="Open menu"
                            >
                                <MoreIcon />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute left-0 mt-2 w-56 origin-top-left bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        {navItems.map(item => (
                                            <a
                                                key={item.id}
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setActiveView(item.id);
                                                    setIsMenuOpen(false);
                                                }}
                                                className={`flex items-center gap-3 px-4 py-2 text-sm ${activeView === item.id ? 'bg-sky-100 text-sky-700' : 'text-slate-700'} hover:bg-slate-100`}
                                                role="menuitem"
                                            >
                                                {item.icon}
                                                <span>{item.title}</span>
                                            </a>
                                        ))}
                                        <div className="border-t my-1"></div>
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setActiveView('settings');
                                                setIsMenuOpen(false);
                                            }}
                                            className={`flex items-center gap-3 px-4 py-2 text-sm ${activeView === 'settings' ? 'bg-sky-100 text-sky-700' : 'text-slate-700'} hover:bg-slate-100`}
                                            role="menuitem"
                                        >
                                           <SettingsIcon />
                                           <span>تنظیمات</span>
                                        </a>
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleLogout();
                                            }}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            role="menuitem"
                                        >
                                            <LogoutIcon />
                                            <span>خروج</span>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {activeView === 'hot-leads' && <HotLeadsPage />}
            {activeView === 'conditions' && <ConditionsPage />}
            {activeView === 'users' && <UsersPage initialFilters={userPageInitialFilters} onFiltersCleared={() => setUserPageInitialFilters({})} />}
            {activeView === 'cars' && <CarsPage onNavigateToLeads={handleNavigateToUsersWithFilter} />}
            {activeView === 'car-prices' && <CarPricesPage />}
            {activeView === 'settings' && <SettingsPage />}

        </div>
    );
};

export default App;
