
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
            <div className="bg-[#F2F4F7] min-h-screen flex justify-center items-center">
                <Spinner />
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    // --- Components ---

    const NavItem: React.FC<{ id: ActiveView | 'more', icon: React.ReactNode, label: string, isMobile?: boolean, badge?: number }> = ({ id, icon, label, isMobile, badge }) => {
        const isActive = activeView === id;
        const handleClick = () => {
            if (id === 'more') {
                setIsMoreMenuOpen(true);
            } else {
                setActiveView(id as ActiveView);
                setIsMoreMenuOpen(false);
                window.scrollTo(0,0);
            }
        };

        if (isMobile) {
            return (
                <button 
                    onClick={handleClick}
                    className={`flex flex-col items-center justify-center w-full h-full relative group`}
                >
                    <div className={`relative p-1.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-sky-100 text-sky-600 -translate-y-2 shadow-sm' : 'text-slate-400'}`}>
                        {icon}
                        {badge !== undefined && badge > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                {badge > 99 ? '!' : badge.toLocaleString('fa-IR')}
                            </span>
                        )}
                    </div>
                    <span className={`text-[10px] mt-1 transition-colors ${isActive ? 'font-bold text-sky-700' : 'text-slate-400'}`}>{label}</span>
                </button>
            );
        }

        return (
            <button
                onClick={handleClick}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 w-full group ${
                    isActive 
                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-200' 
                    : 'text-slate-500 hover:bg-white hover:text-slate-700'
                }`}
            >
                <div className="relative">
                     {React.cloneElement(icon as React.ReactElement<any>, { className: `w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}` })}
                     {badge !== undefined && badge > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                            {badge > 99 ? '+99' : badge.toLocaleString('fa-IR')}
                        </span>
                    )}
                </div>
                <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
            </button>
        );
    };

    const MobileBottomNav = () => (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 pb-[env(safe-area-inset-bottom)] z-40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="grid grid-cols-5 h-16 items-end pb-2">
                <NavItem id="home" icon={<HomeIcon className="w-6 h-6" />} label="خانه" isMobile />
                <NavItem id="hot-leads" icon={<BoltIcon className="w-6 h-6" />} label="داغ" isMobile badge={unreadHotLeads} />
                <NavItem id="users" icon={<UsersIcon className="w-6 h-6" />} label="مشتریان" isMobile />
                <NavItem id="cars" icon={<CarIcon className="w-6 h-6" />} label="خودروها" isMobile />
                <NavItem id="more" icon={<MoreIcon className="w-6 h-6" />} label="منو" isMobile />
            </div>
        </div>
    );

    const DesktopSidebar = () => (
        <aside className="hidden md:flex flex-col w-72 bg-[#F2F4F7] border-l border-slate-200 h-screen fixed right-0 top-0 z-40">
            <div className="p-6 flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-200">
                    <CarIcon className="text-white w-6 h-6"/>
                 </div>
                 <div>
                     <h1 className="text-lg font-black text-slate-800 tracking-tight leading-tight">AutoLead</h1>
                     <p className="text-[10px] text-slate-400 font-bold">پنل مدیریت فروش</p>
                 </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 space-y-1 no-scrollbar">
                <p className="px-4 text-[11px] font-bold text-slate-400 mb-2 mt-2">اصلی</p>
                <NavItem id="home" icon={<HomeIcon />} label="داشبورد" />
                <NavItem id="hot-leads" icon={<BoltIcon />} label="سرنخ های داغ" badge={unreadHotLeads} />
                <NavItem id="users" icon={<UsersIcon />} label="مشتریان و سرنخ‌ها" />
                
                <p className="px-4 text-[11px] font-bold text-slate-400 mb-2 mt-6">مدیریت</p>
                <NavItem id="cars" icon={<CarIcon />} label="خودروها" />
                <NavItem id="conditions" icon={<ConditionsIcon />} label="شرایط فروش" />
                <NavItem id="car-prices" icon={<PriceIcon />} label="قیمت روز بازار" />
                <NavItem id="delivery-process" icon={<DeliveryIcon />} label="فرایند تحویل" />
            </div>

            <div className="p-4 m-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <NavItem id="settings" icon={<SettingsIcon />} label="تنظیمات" />
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl transition-all duration-200 w-full text-red-500 hover:bg-red-50 font-medium text-sm"
                >
                    <LogoutIcon className="w-5 h-5" />
                    <span>خروج</span>
                </button>
            </div>
        </aside>
    );

    const MoreMenuDrawer = () => {
        if (!isMoreMenuOpen) return null;
        return (
            <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
                <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setIsMoreMenuOpen(false)}></div>
                <div className="relative bg-[#F2F4F7] rounded-t-[32px] p-6 animate-slide-up shadow-2xl border-t border-white/50">
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6"></div>

                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <DrawerItem id="conditions" icon={<ConditionsIcon className="w-6 h-6 text-white" />} label="شرایط" color="bg-green-500" />
                        <DrawerItem id="car-prices" icon={<PriceIcon className="w-6 h-6 text-white" />} label="قیمت‌ها" color="bg-purple-500" />
                        <DrawerItem id="delivery-process" icon={<DeliveryIcon className="w-6 h-6 text-white" />} label="تحویل" color="bg-orange-500" />
                        <DrawerItem id="settings" icon={<SettingsIcon className="w-6 h-6 text-white" />} label="تنظیمات" color="bg-slate-500" />
                    </div>

                    <div className="bg-white rounded-2xl p-1">
                        <button 
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 w-full py-4 text-red-500 font-bold text-sm active:scale-95 transition-transform"
                        >
                            <LogoutIcon className="w-5 h-5" />
                            خروج از حساب کاربری
                        </button>
                    </div>
                     <div className="h-safe-bottom mt-4"></div>
                </div>
            </div>
        );
    };

    const DrawerItem: React.FC<{ id: ActiveView, icon: React.ReactNode, label: string, color: string }> = ({ id, icon, label, color }) => (
        <button 
            onClick={() => { setActiveView(id); setIsMoreMenuOpen(false); }}
            className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
        >
            <div className={`w-14 h-14 rounded-2xl ${color} shadow-lg shadow-slate-200 flex items-center justify-center`}>
                {icon}
            </div>
            <span className="text-xs font-bold text-slate-600">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-[#F2F4F7] text-slate-800 selection:bg-sky-100 selection:text-sky-700 font-vazir">
            <DesktopSidebar />
            
            <div className="md:mr-72 min-h-screen flex flex-col">
                {/* Mobile Header */}
                <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 h-14 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                         <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                            <CarIcon className="text-white w-4 h-4"/>
                         </div>
                        <h1 className="text-lg font-black text-slate-800 tracking-tight">AutoLead</h1>
                    </div>
                    {unreadHotLeads > 0 && activeView !== 'hot-leads' && (
                        <button onClick={() => setActiveView('hot-leads')} className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse shadow-sm border border-amber-200">
                            <BoltIcon className="w-3.5 h-3.5" />
                            <span>{unreadHotLeads.toLocaleString('fa-IR')}</span>
                        </button>
                    )}
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden w-full max-w-[1600px] mx-auto">
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
                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .h-safe-bottom {
                    height: env(safe-area-inset-bottom);
                }
            `}</style>
        </div>
    );
};

export default App;
