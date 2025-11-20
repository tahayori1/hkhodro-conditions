import React from 'react';
import type { ActiveView } from '../App';
import { UsersIcon } from '../components/icons/UsersIcon';
import { BoltIcon } from '../components/icons/BoltIcon';
import { ConditionsIcon } from '../components/icons/ConditionsIcon';
import { CarIcon } from '../components/icons/CarIcon';
import { PriceIcon } from '../components/icons/PriceIcon';
import { DeliveryIcon } from '../components/icons/DeliveryIcon';
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon';

interface HomePageProps {
    onNavigate: (view: ActiveView) => void;
    unreadHotLeads: number;
}

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode, gradient: string, onClick?: () => void }> = ({ label, value, icon, gradient, onClick }) => (
    <button onClick={onClick} disabled={!onClick} className="relative overflow-hidden bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between h-32 md:h-36 hover:shadow-md transition-all text-right w-full group">
        <div className={`absolute top-0 left-0 w-full h-1 ${gradient}`}></div>
        <div className="flex justify-between items-start w-full">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${gradient} text-white shadow-lg bg-opacity-90`}>
                {icon}
            </div>
            {onClick && <ArrowRightIcon className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors rotate-180" />}
        </div>
        <div>
            <p className="text-slate-500 text-xs font-bold mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-800 font-mono tracking-tight">{value}</p>
        </div>
    </button>
);

const ActionCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void, bgClass: string, textClass: string }> = ({ icon, title, description, onClick, bgClass, textClass }) => (
    <button onClick={onClick} className={`group p-5 rounded-[24px] border border-transparent transition-all duration-300 text-right w-full flex flex-col justify-between h-full hover:shadow-lg hover:-translate-y-1 bg-white shadow-sm hover:border-slate-200 relative overflow-hidden`}>
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${bgClass}`}></div>
        <div className="flex justify-between items-start z-10">
            <div className={`p-3.5 rounded-2xl ${bgClass} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300`}>
                <div className={textClass}>{icon}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <ArrowRightIcon className="w-4 h-4 text-slate-500 rotate-180" />
            </div>
        </div>
        <div className="mt-5 z-10">
            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-sky-700 transition-colors">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                {description}
            </p>
        </div>
    </button>
);

const HomePage: React.FC<HomePageProps> = ({ onNavigate, unreadHotLeads }) => {
    
    const today = new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="space-y-10 animate-fade-in pb-10">
            {/* Header & Stats */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-500 shadow-sm border border-slate-100">{today}</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">داشبورد مدیریت</h2>
                        <p className="text-slate-500 mt-2 text-sm">به پنل مدیریت AutoLead خوش آمدید.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                     <StatCard 
                        label="سرنخ‌های داغ" 
                        value={unreadHotLeads} 
                        icon={<BoltIcon />} 
                        gradient="bg-gradient-to-br from-amber-400 to-orange-500"
                        onClick={() => onNavigate('hot-leads')}
                     />
                     <StatCard 
                        label="مشتریان هفته" 
                        value="۲۴" 
                        icon={<UsersIcon />} 
                        gradient="bg-gradient-to-br from-sky-400 to-blue-500"
                     />
                     <StatCard 
                        label="تحویل امروز" 
                        value="۳" 
                        icon={<DeliveryIcon />} 
                        gradient="bg-gradient-to-br from-teal-400 to-emerald-500"
                        onClick={() => onNavigate('delivery-process')}
                     />
                     <StatCard 
                        label="موجودی خودرو" 
                        value="۱۲" 
                        icon={<CarIcon />} 
                        gradient="bg-gradient-to-br from-indigo-400 to-purple-500"
                        onClick={() => onNavigate('cars')}
                     />
                </div>
            </div>
            
            {/* Quick Actions */}
            <div>
                <div className="flex items-center justify-between mb-6 px-1">
                    <h3 className="text-xl font-bold text-slate-800">دسترسی سریع</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <ActionCard 
                        icon={<BoltIcon className="w-7 h-7" />}
                        title="سرنخ های داغ"
                        description="مشاهده و پاسخگویی فوری به مشتریان در انتظار"
                        onClick={() => onNavigate('hot-leads')}
                        bgClass="bg-amber-500"
                        textClass="text-amber-600"
                    />
                    <ActionCard 
                        icon={<UsersIcon className="w-7 h-7" />}
                        title="مدیریت مشتریان"
                        description="لیست کامل سرنخ‌ها، فیلترها و ارسال پیام"
                        onClick={() => onNavigate('users')}
                        bgClass="bg-sky-500"
                        textClass="text-sky-600"
                    />
                    <ActionCard 
                        icon={<ConditionsIcon className="w-7 h-7" />}
                        title="شرایط فروش"
                        description="بروزرسانی بخشنامه‌ها و شرایط اقساطی"
                        onClick={() => onNavigate('conditions')}
                        bgClass="bg-green-500"
                        textClass="text-green-600"
                    />
                    <ActionCard 
                        icon={<DeliveryIcon className="w-7 h-7" />}
                        title="فرایند تحویل"
                        description="پیگیری وضعیت تحویل خودروها"
                        onClick={() => onNavigate('delivery-process')}
                        bgClass="bg-teal-500"
                        textClass="text-teal-600"
                    />
                    <ActionCard 
                        icon={<CarIcon className="w-7 h-7" />}
                        title="خودروها"
                        description="مدیریت کاتالوگ محصولات و تصاویر"
                        onClick={() => onNavigate('cars')}
                        bgClass="bg-indigo-500"
                        textClass="text-indigo-600"
                    />
                    <ActionCard 
                        icon={<PriceIcon className="w-7 h-7" />}
                        title="قیمت روز"
                        description="رصد قیمت بازار و کارخانه رقبا"
                        onClick={() => onNavigate('car-prices')}
                        bgClass="bg-purple-500"
                        textClass="text-purple-600"
                    />
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default HomePage;