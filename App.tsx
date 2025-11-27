
import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import ConditionsPage from './pages/ConditionsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import CarsPage from './pages/CarsPage';
import CarPricesPage from './pages/CarPricesPage';
import VehicleExitPage from './pages/VehicleExitPage';
import AccessControlPage from './pages/AccessControlPage';
import PollPage from './pages/PollPage';
import Spinner from './components/Spinner';
import { LogoutIcon } from './components/icons/LogoutIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { UsersIcon } from './components/icons/UsersIcon';
import { ConditionsIcon } from './components/icons/ConditionsIcon';
import { CarIcon } from './components/icons/CarIcon';
import { PriceIcon } from './components/icons/PriceIcon';
import { HomeIcon } from './components/icons/HomeIcon';
import { MoreIcon } from './components/icons/MoreIcon';
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';
import { ExitFormIcon } from './components/icons/ExitFormIcon';
import { SecurityIcon } from './components/icons/SecurityIcon';
import { PollIcon } from './components/icons/PollIcon';

export type ActiveView = 'home' | 'conditions' | 'users' | 'cars' | 'car-prices' | 'vehicle-exit' | 'settings' | 'access-control' | 'poll';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeView, setActiveView] = useState<ActiveView>('home');
    const [userPageInitialFilters, setUserPageInitialFilters] = useState<{ carModel?: string }>({});
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

    useEffect(() => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
            setIsAuthenticated(true);
        }
        setIsLoading(false);

        // Initialize Theme
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
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
        setActiveView('home');
    };
    
    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#F2F4F7');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0f172a');
        }
    };

    const handleNavigateToUsersWithFilter = (carModel: string) => {
        setUserPageInitialFilters({ carModel });
        setActiveView('users');
    };

    if (isLoading) {
        return (
            <div className="bg-[#F2F4F7] dark:bg-slate-900 min-h-screen flex justify-center items-center transition-colors duration-300">
                <Spinner />
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    // --- Components ---

    const NavItem: React.FC<{ id: ActiveView | 'more', icon: React.ReactNode, label: string, isMobile?: boolean }> = ({ id, icon, label, isMobile }) => {
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
                    <div className={`relative p-1.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300 -translate-y-2 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>
                        {icon}
                    </div>
                    <span className={`text-[10px] mt-1 transition-colors ${isActive ? 'font-bold text-sky-700 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>{label}</span>
                </button>
            );
        }

        return (
            <button
                onClick={handleClick}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 w-full group ${
                    isActive 
                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-200 dark:shadow-none' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
                <div className="relative">
                     {React.cloneElement(icon as React.ReactElement<any>, { className: `w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}` })}
                </div>
                <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
            </button>
        );
    };

    const MobileBottomNav = () => (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/60 pb-[env(safe-area-inset-bottom)] z-40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="grid grid-cols-4 h-16 items-end pb-2">
                <NavItem id="home" icon={<HomeIcon className="w-6 h-6" />} label="خانه" isMobile />
                <NavItem id="users" icon={<UsersIcon className="w-6 h-6" />} label="مشتریان" isMobile />
                <NavItem id="vehicle-exit" icon={<ExitFormIcon className="w-6 h-6" />} label="خروج" isMobile />
                <NavItem id="more" icon={<MoreIcon className="w-6 h-6" />} label="منو" isMobile />
            </div>
        </div>
    );

    const DesktopSidebar = () => (
        <aside className="hidden md:flex flex-col w-72 bg-[#F2F4F7] dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-screen fixed right-0 top-0 z-40 transition-colors duration-300">
            <div className="p-6 flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-200 dark:shadow-none">
                    <CarIcon className="text-white w-6 h-6"/>
                 </div>
                 <div>
                     <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-tight">AutoLead</h1>
                     <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">پنل مدیریت فروش</p>
                 </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 space-y-1 no-scrollbar">
                <p className="px-4 text-[11px] font-bold text-slate-400 dark:text-slate-600 mb-2 mt-2">اصلی</p>
                <NavItem id="home" icon={<HomeIcon />} label="داشبورد" />
                <NavItem id="users" icon={<UsersIcon />} label="مشتریان" />
                <NavItem id="vehicle-exit" icon={<ExitFormIcon />} label="فرم خروج خودرو" />
                
                <p className="px-4 text-[11px] font-bold text-slate-400 dark:text-slate-600 mb-2 mt-6">مدیریت</p>
                <NavItem id="cars" icon={<CarIcon />} label="خودروها" />
                <NavItem id="conditions" icon={<ConditionsIcon />} label="شرایط فروش" />
                <NavItem id="car-prices" icon={<PriceIcon />} label="قیمت روز بازار" />
                <NavItem id="access-control" icon={<SecurityIcon />} label="کاربران و دسترسی" />
                <NavItem id="poll" icon={<PollIcon />} label="نظرسنجی" />
            </div>

            <div className="p-4 m-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <button 
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm mb-2"
                >
                    {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                    <span>{isDarkMode ? 'حالت روز' : 'حالت شب'}</span>
                </button>
                <NavItem id="settings" icon={<SettingsIcon />} label="تنظیمات" />
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl transition-all duration-200 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm"
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
                <div className="absolute inset-0 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsMoreMenuOpen(false)}></div>
                <div className="relative bg-[#F2F4F7] dark:bg-slate-900 rounded-t-[32px] p-6 animate-slide-up shadow-2xl border-t border-white/50 dark:border-slate-700">
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-6"></div>

                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <DrawerItem id="cars" icon={<CarIcon className="w-6 h-6 text-white" />} label="خودروها" color="bg-blue-500" />
                        <DrawerItem id="conditions" icon={<ConditionsIcon className="w-6 h-6 text-white" />} label="شرایط" color="bg-green-500" />
                        <DrawerItem id="car-prices" icon={<PriceIcon className="w-6 h-6 text-white" />} label="قیمت‌ها" color="bg-purple-500" />
                        <DrawerItem id="access-control" icon={<SecurityIcon className="w-6 h-6 text-white" />} label="دسترسی" color="bg-rose-500" />
                        <DrawerItem id="poll" icon={<PollIcon className="w-6 h-6 text-white" />} label="نظرسنجی" color="bg-amber-500" />
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 flex flex-col gap-2">
                         <button 
                            onClick={toggleTheme}
                            className="flex items-center justify-center gap-2 w-full py-3 text-slate-600 dark:text-slate-300 font-bold text-sm active:scale-95 transition-transform rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                            {isDarkMode ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
                        </button>
                        <button 
                            onClick={() => { setActiveView('settings'); setIsMoreMenuOpen(false); }}
                            className="flex items-center justify-center gap-2 w-full py-3 text-slate-600 dark:text-slate-300 font-bold text-sm active:scale-95 transition-transform rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            <SettingsIcon className="w-5 h-5" />
                            تنظیمات
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 w-full"></div>
                        <button 
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 w-full py-3 text-red-500 font-bold text-sm active:scale-95 transition-transform"
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
            <div className={`w-14 h-14 rounded-2xl ${color} shadow-lg shadow-slate-200 dark:shadow-none flex items-center justify-center`}>
                {icon}
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-[#F2F4F7] dark:bg-slate-900 text-slate-800 dark:text-slate-100 selection:bg-sky-100 dark:selection:bg-sky-900 selection:text-sky-700 dark:selection:text-sky-300 font-vazir transition-colors duration-300">
            <DesktopSidebar />
            
            <div className="md:mr-72 min-h-screen flex flex-col">
                {/* Mobile Header */}
                <header className="md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 h-14 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                         <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                            <CarIcon className="text-white w-4 h-4"/>
                         </div>
                        <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">AutoLead</h1>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden w-full max-w-[1600px] mx-auto">
                    {activeView === 'home' && <HomePage onNavigate={setActiveView} />}
                    {activeView === 'conditions' && <ConditionsPage />}
                    {activeView === 'users' && <UsersPage initialFilters={userPageInitialFilters} onFiltersCleared={() => setUserPageInitialFilters({})} />}
                    {activeView === 'cars' && <CarsPage onNavigateToLeads={handleNavigateToUsersWithFilter} />}
                    {activeView === 'car-prices' && <CarPricesPage />}
                    {activeView === 'vehicle-exit' && <VehicleExitPage />}
                    {activeView === 'settings' && <SettingsPage />}
                    {activeView === 'access-control' && <AccessControlPage />}
                    {activeView === 'poll' && <PollPage />}
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
