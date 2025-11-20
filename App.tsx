
import React, { useState, useEffect, useRef } from 'react';
import HomePage from './pages/HomePage';
import ConditionsPage from './pages/ConditionsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import CarsPage from './pages/CarsPage';
import HotLeadsPage from './pages/HotLeadsPage';
import CarPricesPage from './pages/CarPricesPage';
import DeliveryProcessPage from './pages/DeliveryProcessPage';
import Spinner from './components/Spinner';
import { LogoutIcon } from './components/icons/LogoutIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { getActiveLeads } from './services/api';
import type { ActiveLead } from './types';
import { UsersIcon } from './components/icons/UsersIcon';
import { ConditionsIcon } from './components/icons/ConditionsIcon';
import { CarIcon } from './components/icons/CarIcon';
import { PriceIcon } from './components/icons/PriceIcon';
import { BoltIcon } from './components/icons/BoltIcon';
import { HomeIcon } from './components/icons/HomeIcon';
import { DeliveryIcon } from './components/icons/DeliveryIcon';
import { MoreIcon } from './components/icons/MoreIcon';
import { CloseIcon } from './components/icons/CloseIcon';

export type ActiveView = 'home' | 'hot-leads' | 'conditions' | 'users' | 'cars' | 'car-prices' | 'delivery-process' | 'settings';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeView, setActiveView] = useState<ActiveView>('home');
    const [userPageInitialFilters, setUserPageInitialFilters] = useState<{ carModel?: string }>({});
    const [unreadHotLeads, setUnreadHotLeads] = useState<number>(0);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    const knownLeadsRef = useRef<Set<string>>(new Set());
    const isInitialLoadRef = useRef(true);

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
            try {
                const activeLeads = await getActiveLeads();
                setUnreadHotLeads(activeLeads.length);
                
                // Notification logic
                if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
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
                }

            } catch (error) {
                console.error('Failed to check for new hot leads:', error);
            }
        };
        
        isInitialLoadRef.current = true;
        checkHotLeads();
        const intervalId = setInterval(checkHotLeads, 60000); 

        return () => clearInterval(intervalId);
    }, [isAuthenticated]);
    
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
        setActiveView('home');
    };

    const handleNavigateToUsersWithFilter = (carModel: string) => {
        setUserPageInitialFilters({ carModel });
        setActiveView('users');
    };

    if (isLoading) {
        return (
            <div className="bg-slate-50 min-h-screen flex justify-center items-center">
                <Spinner />
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    // --- Navigation Components ---

    const NavItem: React.FC<{ id: ActiveView | 'more', icon: React.ReactNode, label: string, isMobile?: boolean, badge?: number }> = ({ id, icon, label, isMobile, badge }) => {
        const isActive = activeView === id;
        
        const handleClick = () => {
            if (id === 'more') {
                setIsMoreMenuOpen(true);
            } else {
                setActiveView(id as ActiveView);
                window.scrollTo(0,0);
            }
        };

        if (isMobile) {
            return (
                <button 
                    onClick={handleClick}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="relative">
                        {icon}
                        {badge !== undefined && badge > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm min-w-[18px] text-center">
                                {badge > 99 ? '+99' : badge.toLocaleString('fa-IR')}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-medium truncate max-w-full px-1">{label}</span>
                </button>
            );
        }

        return (
            <button
                onClick={handleClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full ${
                    isActive 
                    ? 'bg-sky-100 text-sky-700 font-bold shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
                <div className="relative">
                     {icon}
                     {badge !== undefined && badge > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                            {badge > 99 ? '+99' : badge.toLocaleString('fa-IR')}
                        </span>
                    )}
                </div>
                <span className="text-sm">{label}</span>
            </button>
        );
    };

    const MobileBottomNav = () => (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 h-[68px] pb-[env(safe-area-inset-bottom)] z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-5 h-full">
                <NavItem id="home" icon={<HomeIcon className="w-6 h-6" />} label="خانه" isMobile />
                <NavItem id="hot-leads" icon={<BoltIcon className="w-6 h-6" />} label="داغ" isMobile badge={unreadHotLeads} />
                <NavItem id="users" icon={<UsersIcon className="w-6 h-6" />} label="مشتریان" isMobile />
                <NavItem id="cars" icon={<CarIcon className="w-6 h-6" />} label="خودروها" isMobile />
                <NavItem id="more" icon={<MoreIcon className="w-6 h-6" />} label="بیشتر" isMobile />
            </div>
        </div>
    );

    const DesktopSidebar = () => (
        <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-l border-slate-200 h-screen fixed right-0 top-0 z-40 shadow-xl">
            <div className="p-6 border-b border-slate-100">
                 <h1 className="text-2xl font-bold bg-gradient-to-l from-sky-600 to-sky-400 bg-clip-text text-transparent">AutoLead</h1>
                 <p className="text-xs text-slate-400 mt-1">سیستم مدیریت هوشمند سرنخ</p>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                <NavItem id="home" icon={<HomeIcon />} label="داشبورد" />
                <NavItem id="hot-leads" icon={<BoltIcon />} label="سرنخ های داغ" badge={unreadHotLeads} />
                <NavItem id="users" icon={<UsersIcon />} label="سرنخ های فروش" />
                
                <div className="pt-4 pb-2">
                    <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">مدیریت</p>
                </div>
                
                <NavItem id="cars" icon={<CarIcon />} label="خودروها" />
                <NavItem id="conditions" icon={<ConditionsIcon />} label="شرایط فروش" />
                <NavItem id="car-prices" icon={<PriceIcon />} label="قیمت روز" />
                <NavItem id="delivery-process" icon={<DeliveryIcon />} label="فرایند تحویل" />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <NavItem id="settings" icon={<SettingsIcon />} label="تنظیمات" />
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl transition-all duration-200 w-full text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                >
                    <LogoutIcon />
                    <span className="text-sm">خروج از حساب</span>
                </button>
            </div>
        </aside>
    );

    const MoreMenuDrawer = () => {
        if (!isMoreMenuOpen) return null;
        return (
            <div className="fixed inset-0 z-50 md:hidden">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMoreMenuOpen(false)}></div>
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 animate-slide-up-mobile pb-10 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">سایر بخش‌ها</h3>
                        <button onClick={() => setIsMoreMenuOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200">
                            <CloseIcon />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                        <DrawerItem id="conditions" icon={<ConditionsIcon className="w-7 h-7 text-green-500" />} label="شرایط فروش" />
                        <DrawerItem id="car-prices" icon={<PriceIcon className="w-7 h-7 text-purple-500" />} label="قیمت‌ها" />
                        <DrawerItem id="delivery-process" icon={<DeliveryIcon className="w-7 h-7 text-teal-500" />} label="تحویل" />
                        <DrawerItem id="settings" icon={<SettingsIcon className="w-7 h-7 text-slate-500" />} label="تنظیمات" />
                    </div>

                    <div className="mt-8 border-t pt-6">
                        <button 
                            onClick={() => { handleLogout(); setIsMoreMenuOpen(false); }}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold"
                        >
                            <LogoutIcon />
                            خروج
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const DrawerItem: React.FC<{ id: ActiveView, icon: React.ReactNode, label: string }> = ({ id, icon, label }) => (
        <button 
            onClick={() => { setActiveView(id); setIsMoreMenuOpen(false); }}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-50 active:scale-95 transition-all"
        >
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                {icon}
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">{label}</span>
        </button>
    );

    // --- Main Layout ---

    return (
        <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans selection:bg-sky-100 selection:text-sky-700">
            <DesktopSidebar />
            
            <div className="md:mr-64 lg:mr-72 min-h-screen flex flex-col">
                {/* Mobile Top Bar (Only visible on mobile) */}
                <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 h-14 flex items-center justify-between shadow-sm">
                    <h1 className="text-lg font-bold text-sky-700">AutoLead</h1>
                    {unreadHotLeads > 0 && activeView !== 'hot-leads' && (
                        <button onClick={() => setActiveView('hot-leads')} className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                            <BoltIcon className="w-3 h-3" />
                            {unreadHotLeads.toLocaleString('fa-IR')}
                        </button>
                    )}
                </header>

                {/* Main Content Area */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden max-w-7xl mx-auto w-full">
                    {activeView === 'home' && <HomePage onNavigate={setActiveView} unreadHotLeads={unreadHotLeads} />}
                    {activeView === 'hot-leads' && <HotLeadsPage />}
                    {activeView === 'conditions' && <ConditionsPage />}
                    {activeView === 'users' && <UsersPage initialFilters={userPageInitialFilters} onFiltersCleared={() => setUserPageInitialFilters({})} />}
                    {activeView === 'cars' && <CarsPage onNavigateToLeads={handleNavigateToUsersWithFilter} />}
                    {activeView === 'car-prices' && <CarPricesPage />}
                    {activeView === 'delivery-process' && <DeliveryProcessPage />}
                    {activeView === 'settings' && <SettingsPage />}
                </main>
            </div>

            <MobileBottomNav />
            <MoreMenuDrawer />
            
            <style>{`
                @keyframes slide-up-mobile {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up-mobile {
                    animation: slide-up-mobile 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default App;
