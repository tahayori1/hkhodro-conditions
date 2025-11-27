
import React, { useEffect, useState } from 'react';
import type { ActiveView } from '../App';
import { UsersIcon } from '../components/icons/UsersIcon';
import { ConditionsIcon } from '../components/icons/ConditionsIcon';
import { CarIcon } from '../components/icons/CarIcon';
import { PriceIcon } from '../components/icons/PriceIcon';
import { ExitFormIcon } from '../components/icons/ExitFormIcon';
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon';
import { HomeIcon } from '../components/icons/HomeIcon';
import { SecurityIcon } from '../components/icons/SecurityIcon';
import { PollIcon } from '../components/icons/PollIcon';
import { getCarPriceStats } from '../services/api';
import type { CarPriceStats } from '../types';
import Spinner from '../components/Spinner';

interface HomePageProps {
    onNavigate: (view: ActiveView) => void;
}

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode, gradient: string, onClick?: () => void }> = ({ label, value, icon, gradient, onClick }) => (
    <button onClick={onClick} disabled={!onClick} className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-32 hover:shadow-md transition-all text-right w-full group active:scale-[0.98]">
        <div className={`absolute top-0 left-0 w-full h-1 ${gradient}`}></div>
        <div className="flex justify-between items-start w-full">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient} text-white shadow-lg bg-opacity-90`}>
                {icon}
            </div>
            {onClick && <ArrowRightIcon className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors rotate-180" />}
        </div>
        <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">{label}</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">{value}</p>
        </div>
    </button>
);

const ActionCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void, bgClass: string, textClass: string }> = ({ icon, title, description, onClick, bgClass, textClass }) => (
    <button onClick={onClick} className={`group p-4 rounded-[24px] border border-transparent transition-all duration-300 text-right w-full flex flex-col justify-between h-full hover:shadow-lg active:scale-[0.98] bg-white dark:bg-slate-800 shadow-sm hover:border-slate-200 dark:hover:border-slate-600 relative overflow-hidden min-h-[140px]`}>
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity ${bgClass}`}></div>
        <div className="flex justify-between items-start z-10">
            <div className={`p-3 rounded-2xl ${bgClass} bg-opacity-10 dark:bg-opacity-20 group-hover:bg-opacity-20 dark:group-hover:bg-opacity-30 transition-all duration-300`}>
                <div className={textClass}>{icon}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <ArrowRightIcon className="w-4 h-4 text-slate-500 dark:text-slate-300 rotate-180" />
            </div>
        </div>
        <div className="mt-4 z-10">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">{title}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {description}
            </p>
        </div>
    </button>
);

const PriceTicker: React.FC = () => {
    const [stats, setStats] = useState<CarPriceStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCarPriceStats().then(data => {
            setStats(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="h-24 flex items-center justify-center"><Spinner /></div>;
    if (stats.length === 0) return null;

    return (
        <div className="mb-8 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
            <div className="flex gap-3 w-max">
                {stats.map(stat => (
                    <div key={stat.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm w-40 flex-shrink-0">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 truncate">{stat.model_name}</div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-slate-400 dark:text-slate-500">کف:</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{(stat.minimum / 1000000).toLocaleString('fa-IR')} م</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full">
                                <div className="bg-sky-500 h-1 rounded-full w-1/2"></div>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-slate-400 dark:text-slate-500">سقف:</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{(stat.maximum / 1000000).toLocaleString('fa-IR')} م</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    
    const today = new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="animate-fade-in pb-10 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">{today}</p>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">داشبورد</h2>
                </div>
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                    <HomeIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
            </div>

            {/* Market Watch Widget */}
            <div>
                 <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">خلاصه بازار (میلیون تومان)</h3>
                    <button onClick={() => onNavigate('car-prices')} className="text-xs text-sky-600 dark:text-sky-400 font-bold">مشاهده کامل</button>
                </div>
                <PriceTicker />
            </div>
            
            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 px-1">دسترسی سریع</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <ActionCard 
                        icon={<UsersIcon className="w-6 h-6" />}
                        title="مشتریان"
                        description="مدیریت لیست مشتریان"
                        onClick={() => onNavigate('users')}
                        bgClass="bg-sky-500"
                        textClass="text-sky-600 dark:text-sky-400"
                    />
                    <ActionCard 
                        icon={<ConditionsIcon className="w-6 h-6" />}
                        title="شرایط فروش"
                        description="بررسی و مدیریت بخشنامه‌ها"
                        onClick={() => onNavigate('conditions')}
                        bgClass="bg-green-500"
                        textClass="text-green-600 dark:text-green-400"
                    />
                     <ActionCard 
                        icon={<CarIcon className="w-6 h-6" />}
                        title="خودروها"
                        description="مدیریت لیست خودروهای نمایندگی"
                        onClick={() => onNavigate('cars')}
                        bgClass="bg-blue-500"
                        textClass="text-blue-600 dark:text-blue-400"
                    />
                    <ActionCard 
                        icon={<PriceIcon className="w-6 h-6" />}
                        title="قیمت روز"
                        description="رصد و مقایسه قیمت بازار"
                        onClick={() => onNavigate('car-prices')}
                        bgClass="bg-purple-500"
                        textClass="text-purple-600 dark:text-purple-400"
                    />
                    <ActionCard 
                        icon={<ExitFormIcon className="w-6 h-6" />}
                        title="خروج خودرو"
                        description="ثبت فرم تحویل نهایی"
                        onClick={() => onNavigate('vehicle-exit')}
                        bgClass="bg-teal-500"
                        textClass="text-teal-600 dark:text-teal-400"
                    />
                    <ActionCard 
                        icon={<SecurityIcon className="w-6 h-6" />}
                        title="مدیریت کاربران"
                        description="دسترسی و سطوح کاربری"
                        onClick={() => onNavigate('access-control')}
                        bgClass="bg-rose-500"
                        textClass="text-rose-600 dark:text-rose-400"
                    />
                     <ActionCard 
                        icon={<PollIcon className="w-6 h-6" />}
                        title="نتایج نظرسنجی"
                        description="مشاهده نتایج رضایت مشتریان"
                        onClick={() => onNavigate('poll')}
                        bgClass="bg-amber-500"
                        textClass="text-amber-600 dark:text-amber-400"
                    />
                </div>
            </div>
        </div>
    );
};

export default HomePage;
