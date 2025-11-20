
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

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode, color: string, onClick?: () => void }> = ({ label, value, icon, color, onClick }) => (
    <button onClick={onClick} disabled={!onClick} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all text-right w-full">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} text-white shadow-sm`}>
            {icon}
        </div>
        <div>
            <p className="text-slate-500 text-xs font-medium mb-0.5">{label}</p>
            <p className="text-xl font-bold text-slate-800 font-mono">{value}</p>
        </div>
    </button>
);

const ActionCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void, bgClass: string }> = ({ icon, title, description, onClick, bgClass }) => (
    <button onClick={onClick} className={`group p-5 rounded-2xl border transition-all duration-300 text-right w-full flex flex-col justify-between h-full hover:shadow-lg hover:-translate-y-1 ${bgClass}`}>
        <div className="flex justify-between items-start">
            <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <div className="bg-white/50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRightIcon className="w-4 h-4 text-slate-600 rotate-180" />
            </div>
        </div>
        <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed opacity-80">
                {description}
            </p>
        </div>
    </button>
);

const HomePage: React.FC<HomePageProps> = ({ onNavigate, unreadHotLeads }) => {
    
    const today = new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header & Stats */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">{today}</p>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">داشبورد مدیریت</h2>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     <StatCard 
                        label="سرنخ‌های داغ فعال" 
                        value={unreadHotLeads} 
                        icon={<BoltIcon />} 
                        color="bg-gradient-to-br from-amber-500 to-orange-600"
                        onClick={() => onNavigate('hot-leads')}
                     />
                     <StatCard 
                        label="مشتریان جدید (هفته)" 
                        value="۲۴" 
                        icon={<UsersIcon />} 
                        color="bg-gradient-to-br from-sky-500 to-blue-600"
                     />
                     <StatCard 
                        label="تحویل‌های امروز" 
                        value="۳" 
                        icon={<DeliveryIcon />} 
                        color="bg-gradient-to-br from-teal-500 to-emerald-600"
                        onClick={() => onNavigate('delivery-process')}
                     />
                     <StatCard 
                        label="خودروهای موجود" 
                        value="۱۲" 
                        icon={<CarIcon />} 
                        color="bg-gradient-to-br from-indigo-500 to-purple-600"
                        onClick={() => onNavigate('cars')}
                     />
                </div>
            </div>
            
            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 px-1">دسترسی سریع</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ActionCard 
                        icon={<BoltIcon className="text-amber-500 w-6 h-6" />}
                        title="سرنخ های داغ"
                        description="مشاهده و پاسخگویی فوری به مشتریان در انتظار"
                        onClick={() => onNavigate('hot-leads')}
                        bgClass="bg-amber-50/50 border-amber-100 hover:border-amber-200"
                    />
                    <ActionCard 
                        icon={<UsersIcon className="text-sky-500 w-6 h-6" />}
                        title="مدیریت مشتریان"
                        description="لیست کامل سرنخ‌ها، فیلترها و ارسال پیام"
                        onClick={() => onNavigate('users')}
                        bgClass="bg-sky-50/50 border-sky-100 hover:border-sky-200"
                    />
                    <ActionCard 
                        icon={<ConditionsIcon className="text-green-500 w-6 h-6" />}
                        title="شرایط فروش"
                        description="بروزرسانی بخشنامه‌ها و شرایط اقساطی"
                        onClick={() => onNavigate('conditions')}
                        bgClass="bg-green-50/50 border-green-100 hover:border-green-200"
                    />
                    <ActionCard 
                        icon={<DeliveryIcon className="text-teal-500 w-6 h-6" />}
                        title="فرایند تحویل"
                        description="پیگیری وضعیت تحویل خودروها"
                        onClick={() => onNavigate('delivery-process')}
                        bgClass="bg-teal-50/50 border-teal-100 hover:border-teal-200"
                    />
                    <ActionCard 
                        icon={<CarIcon className="text-indigo-500 w-6 h-6" />}
                        title="خودروها"
                        description="مدیریت کاتالوگ محصولات و تصاویر"
                        onClick={() => onNavigate('cars')}
                        bgClass="bg-indigo-50/50 border-indigo-100 hover:border-indigo-200"
                    />
                    <ActionCard 
                        icon={<PriceIcon className="text-purple-500 w-6 h-6" />}
                        title="قیمت روز"
                        description="رصد قیمت بازار و کارخانه رقبا"
                        onClick={() => onNavigate('car-prices')}
                        bgClass="bg-purple-50/50 border-purple-100 hover:border-purple-200"
                    />
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default HomePage;
