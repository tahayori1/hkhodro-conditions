import React, { useState } from 'react';
import ConditionsPage from './pages/ConditionsPage';
import UsersPage from './pages/UsersPage';

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<'conditions' | 'users'>('conditions');

    const navButtonClasses = "px-4 py-2 rounded-lg font-semibold transition-colors duration-200";
    const activeClasses = "bg-sky-600 text-white";
    const inactiveClasses = "bg-white text-sky-700 hover:bg-sky-100";

    return (
        <div className="bg-slate-100 min-h-screen text-slate-800">
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-sky-700">سامانه مدیریت فروش</h1>
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
                </div>
            </header>

            {activeView === 'conditions' && <ConditionsPage />}
            {activeView === 'users' && <UsersPage />}
        </div>
    );
};

export default App;
