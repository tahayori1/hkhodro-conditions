import React, { useState } from 'react';
import ConditionsPage from './ConditionsPage';
import AnnouncementsSubPage from '../components/AnnouncementsSubPage';
import { Tag } from 'lucide-react';

const AnnouncementsHubPage: React.FC<{ loggedInUser: any }> = ({ loggedInUser }) => {
    const [activeTab, setActiveTab] = useState<'ANNOUNCEMENTS' | 'CONDITIONS'>('ANNOUNCEMENTS');

    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-800 rounded-2xl p-8 mb-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-500/20 p-4 rounded-xl border border-indigo-400/30">
                            <Tag className="w-8 h-8 text-indigo-300" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">اطلاعیه‌ها و بخشنامه‌ها</h1>
                            <p className="text-indigo-200 text-sm font-medium">مشاهده آخرین اخبار داخلی و شرایط فروش فعال</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 flex mb-6">
                <button
                    onClick={() => setActiveTab('ANNOUNCEMENTS')}
                    className={`flex-1 py-3 px-6 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'ANNOUNCEMENTS'
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                    اطلاعیه‌های داخلی
                </button>
                <button
                    onClick={() => setActiveTab('CONDITIONS')}
                    className={`flex-1 py-3 px-6 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'CONDITIONS'
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                    بخشنامه‌های فروش خودرو
                </button>
            </div>

            {/* Content Area */}
            <div className="mt-6 border-t pt-6 border-slate-100 dark:border-slate-800">
                {activeTab === 'ANNOUNCEMENTS' && <AnnouncementsSubPage loggedInUser={loggedInUser} />}
                {activeTab === 'CONDITIONS' && <ConditionsPage isSubPage={true} />}
            </div>
        </main>
    );
};

export default AnnouncementsHubPage;
