
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
import ReportsPage from './pages/ReportsPage';
import CommissionPage from './pages/CommissionPage';
import CorrectiveActionsPage from './pages/CorrectiveActionsPage';
import MeetingMinutesPage from './pages/MeetingMinutesPage';
import LeaveRequestsPage from './pages/LeaveRequestsPage';
import AnonymousFeedbackPage from './pages/AnonymousFeedbackPage';
import ZeroCarDeliveryPage from './pages/ZeroCarDeliveryPage';
import MyProfilePage from './pages/MyProfilePage';
import CustomerClubPage from './pages/CustomerClubPage';
import NotificationCenterPage from './pages/NotificationCenterPage';
import AdvertisingPage from './pages/AdvertisingPage';
import UsedCarPage from './pages/UsedCarPage';
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
import { ChartBarIcon } from './components/icons/ChartBarIcon';
import { CalculatorIcon } from './components/icons/CalculatorIcon';
import { ClipboardCheckIcon } from './components/icons/ClipboardCheckIcon';
import { CalendarIcon } from './components/icons/CalendarIcon';
import { UserMinusIcon } from './components/icons/UserMinusIcon';
import { SpeakerphoneIcon } from './components/icons/SpeakerphoneIcon';
import { TruckIcon } from './components/icons/TruckIcon';
import { UserIcon } from './components/icons/UserIcon';
import { BadgeIcon } from './components/icons/BadgeIcon';
import { ChatAltIcon } from './components/icons/ChatAltIcon';
import { RocketIcon } from './components/icons/RocketIcon';
import { ClipboardListIcon } from './components/icons/ClipboardListIcon';
import { getMyProfile } from './services/api';
import type { MyProfile } from './types';

export type ActiveView = 'home' | 'conditions' | 'users' | 'cars' | 'car-prices' | 'vehicle-exit' | 'settings' | 'access-control' | 'poll' | 'reports' | 'commission' | 'corrective-actions' | 'meeting-minutes' | 'leave-requests' | 'anonymous-feedback' | 'zero-car-delivery' | 'my-profile' | 'customer-club' | 'notification-center' | 'advertising' | 'used-cars';

interface MenuItemProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive 
            ? 'bg-sky-600 text-white shadow-md shadow-sky-200 dark:shadow-none font-bold' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeView, setActiveView] = useState<ActiveView>('home');
    const [userPageInitialFilters, setUserPageInitialFilters] = useState<{ carModel?: string }>({});
    const [carPageInitialFilters, setCarPageInitialFilters] = useState<{ carModel?: string }>({});
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<MyProfile | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (token && userId) {
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

    useEffect(() => {
        if (isAuthenticated) {
            getMyProfile()
                .then(data => {
                    if(data && 'id' in data) setCurrentUser(data as MyProfile);
                })
                .catch(err => console.error("Failed to load profile", err));
        } else {
            setCurrentUser(null);
        }
    }, [isAuthenticated]);
    
    const handleLoginSuccess = async (token: string, id: number, remember: boolean) => {
        if (remember) {
            localStorage.setItem('authToken', token);
            localStorage.setItem('userId', id.toString());
        } else {
            sessionStorage.setItem('authToken', token);
            sessionStorage.setItem('userId', id.toString());
        }
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userId');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setActiveView('home');
    };

    const handleNavigate = (view: ActiveView) => {
        setActiveView(view);
        setIsMoreMenuOpen(false);
    };

    const handleNavigateToLeads = (carModel: string) => {
        setUserPageInitialFilters({ carModel });
        setActiveView('users');
    };

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
            setIsDarkMode(true);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen justify-center items-center bg-slate-100 dark:bg-slate-900">
                <Spinner />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    // Organized Menu Items
    const menuItems = [
        { view: 'home' as ActiveView, label: 'داشبورد', icon: <HomeIcon className="w-5 h-5" /> },
        
        // Sales Information
        { view: 'conditions' as ActiveView, label: 'شرایط فروش', icon: <ConditionsIcon className="w-5 h-5" /> },
        { view: 'cars' as ActiveView, label: 'خودروها', icon: <CarIcon className="w-5 h-5" /> },
        { view: 'car-prices' as ActiveView, label: 'قیمت روز', icon: <PriceIcon className="w-5 h-5" /> },
        
        // CRM
        { view: 'users' as ActiveView, label: 'مشتریان', icon: <UsersIcon className="w-5 h-5" /> },
        { view: 'customer-club' as ActiveView, label: 'باشگاه مشتریان', icon: <BadgeIcon className="w-5 h-5" /> },
        { view: 'notification-center' as ActiveView, label: 'مرکز اطلاع‌رسانی', icon: <ChatAltIcon className="w-5 h-5" /> },
        { view: 'advertising' as ActiveView, label: 'امور تبلیغات', icon: <RocketIcon className="w-5 h-5" /> },
        
        // Operations
        { view: 'zero-car-delivery' as ActiveView, label: 'تحویل صفر', icon: <TruckIcon className="w-5 h-5" /> },
        { view: 'used-cars' as ActiveView, label: 'خودرو کارکرده', icon: <ClipboardListIcon className="w-5 h-5" /> },
        { view: 'vehicle-exit' as ActiveView, label: 'خروج خودرو', icon: <ExitFormIcon className="w-5 h-5" /> },
        
        // Finance & Reports
        { view: 'commission' as ActiveView, label: 'پورسانت', icon: <CalculatorIcon className="w-5 h-5" /> },
        { view: 'poll' as ActiveView, label: 'نظرسنجی', icon: <PollIcon className="w-5 h-5" /> },
        { view: 'reports' as ActiveView, label: 'گزارشات', icon: <ChartBarIcon className="w-5 h-5" /> },
    ];

    const adminItems = [
        { view: 'access-control' as ActiveView, label: 'مدیریت کاربران', icon: <SecurityIcon className="w-5 h-5" /> },
        { view: 'corrective-actions' as ActiveView, label: 'اقدامات اصلاحی', icon: <ClipboardCheckIcon className="w-5 h-5" /> },
        { view: 'meeting-minutes' as ActiveView, label: 'صورت‌جلسات', icon: <CalendarIcon className="w-5 h-5" /> },
        { view: 'leave-requests' as ActiveView, label: 'مرخصی‌ها', icon: <UserMinusIcon className="w-5 h-5" /> },
        { view: 'anonymous-feedback' as ActiveView, label: 'صندوق انتقادات', icon: <SpeakerphoneIcon className="w-5 h-5" /> },
        { view: 'settings' as ActiveView, label: 'تنظیمات', icon: <SettingsIcon className="w-5 h-5" /> },
    ];

    return (
        <div className="flex h-screen bg-[#F2F4F7] dark:bg-[#0f172a] font-vazir text-right overflow-hidden">
            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 bg-[#F2F4F7] dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 p-4 overflow-y-auto">
                <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                    <img src="/vite.svg" alt="Logo" className="w-8 h-8" />
                    <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">AutoLead</h1>
                </div>

                <nav className="flex-1 space-y-1">
                    {menuItems.map((item, index) => (
                        <React.Fragment key={item.view}>
                            {/* Separators for logical grouping */}
                            {index === 1 && <div className="text-[10px] font-bold text-slate-400 px-4 pt-4 pb-2">اطلاعات پایه</div>}
                            {index === 4 && <div className="text-[10px] font-bold text-slate-400 px-4 pt-4 pb-2">مدیریت مشتریان</div>}
                            {index === 8 && <div className="text-[10px] font-bold text-slate-400 px-4 pt-4 pb-2">عملیات</div>}
                            {index === 11 && <div className="text-[10px] font-bold text-slate-400 px-4 pt-4 pb-2">مالی و آمار</div>}
                            
                            <MenuItem 
                                label={item.label} 
                                icon={item.icon} 
                                isActive={activeView === item.view} 
                                onClick={() => handleNavigate(item.view)}
                            />
                        </React.Fragment>
                    ))}
                    
                    {currentUser?.isAdmin === 1 && (
                        <>
                            <div className="text-[10px] font-bold text-slate-400 px-4 pt-4 pb-2">پنل مدیریت</div>
                            {adminItems.map(item => (
                                <MenuItem 
                                    key={item.view} 
                                    label={item.label} 
                                    icon={item.icon} 
                                    isActive={activeView === item.view} 
                                    onClick={() => handleNavigate(item.view)}
                                />
                            ))}
                        </>
                    )}
                </nav>

                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <button 
                        onClick={toggleTheme}
                        className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all mb-2"
                    >
                        {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                        <span>{isDarkMode ? 'حالت روز' : 'حالت شب'}</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                    >
                        <LogoutIcon className="w-5 h-5" />
                        <span>خروج</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Bottom Nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-50 px-6 py-2 flex justify-between items-center shadow-2xl pb-safe">
                <button onClick={() => setActiveView('home')} className={`flex flex-col items-center p-2 ${activeView === 'home' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>
                    <HomeIcon className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-bold">خانه</span>
                </button>
                <button onClick={() => setActiveView('users')} className={`flex flex-col items-center p-2 ${activeView === 'users' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>
                    <UsersIcon className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-bold">مشتریان</span>
                </button>
                <button onClick={() => setActiveView('cars')} className={`flex flex-col items-center p-2 ${activeView === 'cars' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>
                    <CarIcon className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-bold">خودروها</span>
                </button>
                <button onClick={() => setIsMoreMenuOpen(true)} className={`flex flex-col items-center p-2 ${isMoreMenuOpen ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>
                    <MoreIcon className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-bold">بیشتر</span>
                </button>
            </div>

            {/* Mobile More Menu */}
            {isMoreMenuOpen && (
                <div className="lg:hidden fixed inset-0 bg-slate-900/90 z-50 backdrop-blur-sm animate-fade-in" onClick={() => setIsMoreMenuOpen(false)}>
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-24 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center mb-6">
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {[...menuItems, ...(currentUser?.isAdmin === 1 ? adminItems : [])].filter(i => !['home','users','cars'].includes(i.view)).map(item => (
                                <button key={item.view} onClick={() => handleNavigate(item.view)} className="flex flex-col items-center p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className={`p-3 rounded-2xl mb-2 ${activeView === item.view ? 'bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">{item.label}</span>
                                </button>
                            ))}
                            <button onClick={toggleTheme} className="flex flex-col items-center p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <div className="p-3 rounded-2xl mb-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">تم</span>
                            </button>
                            <button onClick={handleLogout} className="flex flex-col items-center p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <div className="p-3 rounded-2xl mb-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                    <LogoutIcon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">خروج</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Header (Top Bar) */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-40 backdrop-blur-md pt-safe">
                <div className="flex items-center gap-2">
                    <img src="/vite.svg" alt="Logo" className="w-7 h-7" />
                    <span className="font-black text-lg text-slate-800 dark:text-white">AutoLead</span>
                </div>
                <button onClick={() => setActiveView('my-profile')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                        {currentUser?.username?.substring(0, 2).toUpperCase() || <UserIcon className="w-4 h-4"/>}
                    </div>
                </button>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0 pb-20 lg:pb-0">
                {activeView === 'home' && <HomePage onNavigate={handleNavigate} />}
                {activeView === 'conditions' && <ConditionsPage />}
                {activeView === 'users' && (
                    <UsersPage 
                        initialFilters={userPageInitialFilters} 
                        onFiltersCleared={() => setUserPageInitialFilters({})} 
                        loggedInUser={currentUser}
                    />
                )}
                {activeView === 'cars' && (
                    <CarsPage 
                        onNavigateToLeads={handleNavigateToLeads} 
                        initialFilters={carPageInitialFilters}
                        onFiltersCleared={() => setCarPageInitialFilters({})}
                    />
                )}
                {activeView === 'car-prices' && <CarPricesPage />}
                {activeView === 'vehicle-exit' && <VehicleExitPage />}
                {activeView === 'access-control' && <AccessControlPage />}
                {activeView === 'poll' && <PollPage />}
                {activeView === 'reports' && <ReportsPage />}
                {activeView === 'settings' && <SettingsPage />}
                {activeView === 'commission' && <CommissionPage />}
                {activeView === 'corrective-actions' && <CorrectiveActionsPage />}
                {activeView === 'meeting-minutes' && <MeetingMinutesPage />}
                {activeView === 'leave-requests' && <LeaveRequestsPage />}
                {activeView === 'anonymous-feedback' && <AnonymousFeedbackPage />}
                {activeView === 'zero-car-delivery' && <ZeroCarDeliveryPage />}
                {activeView === 'my-profile' && <MyProfilePage />}
                {activeView === 'customer-club' && <CustomerClubPage />}
                {activeView === 'notification-center' && <NotificationCenterPage />}
                {activeView === 'advertising' && <AdvertisingPage />}
                {activeView === 'used-cars' && <UsedCarPage />}
            </main>
        </div>
    );
};

export default App;
