import React, { useState, useEffect } from 'react';
import ConditionsPage from './pages/ConditionsPage';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';
import Spinner from './components/Spinner';
import { LogoutIcon } from './components/icons/LogoutIcon';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeView, setActiveView] = useState<'conditions' | 'users'>('conditions');

    useEffect(() => {
        const token = sessionStorage.getItem('authToken');
        if (token) {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const handleLoginSuccess = (token: string) => {
        sessionStorage.setItem('authToken', token);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('authToken');
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
                                onClick={() => setActiveView('conditions')}
                                className={`${navButtonClasses} ${activeView === 'conditions' ? activeClasses : inactiveClasses}`}
                            >
                                شرایط فروش
                            </button>
                            <button 
                                onClick={() => setActiveView('users')}
                                className={`${navButtonClasses} ${activeView === 'users' ? activeClasses : inactiveClasses}`}
                            >
                                سرنخ‌های فروش
                            </button>
                        </nav>
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
            </header>

            {activeView === 'conditions' && <ConditionsPage />}
            {activeView === 'users' && <UsersPage />}
        </div>
    );
};

export default App;
