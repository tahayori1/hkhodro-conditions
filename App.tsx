
import React, { useState, useEffect, useRef } from 'react';
import ConditionsPage from './pages/ConditionsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import Spinner from './components/Spinner';
import { LogoutIcon } from './components/icons/LogoutIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { getActiveLeads } from './services/api';
import type { ActiveLead } from './types';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeView, setActiveView] = useState<'conditions' | 'users' | 'settings'>('users');
    const [onAddNew, setOnAddNew] = useState<(() => void) | null>(null);

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

                    // FIX: The 'renotify' property is not a standard part of NotificationOptions and causes a TypeScript error.
                    // It is also deprecated. Removing it to resolve the compilation error.
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

    return (
        <div className="bg-slate-100 min-h-screen text-slate-800">
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-sky-700">سامانه مدیریت فروش</h1>
                     <div className="flex items-center gap-4">
                        <nav className="flex items-center gap-2">
                            <button 
                                onClick={() => setActiveView('users')}
                                className={`${navButtonClasses} ${activeView === 'users' ? activeClasses : inactiveClasses}`}
                            >
                                سرنخ های فروش
                            </button>
                            <button 
                                onClick={() => setActiveView('conditions')}
                                className={`${navButtonClasses} ${activeView === 'conditions' ? activeClasses : inactiveClasses}`}
                            >
                                شرایط فروش
                            </button>
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
                </div>
            </header>

            {activeView === 'conditions' && <ConditionsPage setOnAddNew={setOnAddNew} />}
            {activeView === 'users' && <UsersPage setOnAddNew={setOnAddNew} />}
            {activeView === 'settings' && <SettingsPage />}

            {onAddNew && activeView !== 'settings' && (
                <button
                    onClick={onAddNew}
                    className="fixed bottom-6 left-6 bg-sky-600 text-white font-semibold px-5 py-3 rounded-full hover:bg-sky-700 transition-colors duration-300 shadow-lg flex items-center gap-2 z-20"
                >
                    <PlusIcon />
                    {activeView === 'users' ? 'افزودن سرنخ جدید' : 'افزودن شرط جدید'}
                </button>
            )}
        </div>
    );
};

export default App;