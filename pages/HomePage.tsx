import React from 'react';
import type { ActiveView } from '../App';
import { UsersIcon } from '../components/icons/UsersIcon';
import { BoltIcon } from '../components/icons/BoltIcon';
import { ConditionsIcon } from '../components/icons/ConditionsIcon';
import { CarIcon } from '../components/icons/CarIcon';
import { PriceIcon } from '../components/icons/PriceIcon';
import { SettingsIcon } from '../components/icons/SettingsIcon';
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon';
import { DeliveryIcon } from '../components/icons/DeliveryIcon';

interface HomePageProps {
    onNavigate: (view: ActiveView) => void;
}

const ActionCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void }> = ({ icon, title, description, onClick }) => (
    <button onClick={onClick} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-right w-full flex flex-col justify-between">
        <div>
            <div className="flex items-center gap-3 mb-2">
                {icon}
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            </div>
            <p className="text-sm text-slate-600">
                {description}
            </p>
        </div>
        <div className="flex items-center gap-2 text-sky-600 font-semibold mt-4 text-sm">
            <span>برو به صفحه</span>
            <ArrowRightIcon className="h-4 w-4 transform -rotate-180" />
        </div>
    </button>
);

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    
    const actionItems = [
        {
            id: 'hot-leads',
            icon: <BoltIcon className="text-amber-500" />,
            title: 'مدیریت سرنخ های داغ',
            description: 'مشاهده و پاسخگویی به سرنخ‌های جدید و فعال که نیاز به توجه فوری دارند.'
        },
        {
            id: 'users',
            icon: <UsersIcon className="text-sky-500" />,
            title: 'مدیریت سرنخ های فروش',
            description: 'دسترسی به لیست کامل سرنخ‌ها، ویرایش اطلاعات و ارسال پیام گروهی.'
        },
        {
            id: 'conditions',
            icon: <ConditionsIcon className="text-green-500" />,
            title: 'مدیریت شرایط فروش',
            description: 'ایجاد، ویرایش و مدیریت شرایط فروش مختلف برای انواع خودروها.'
        },
        {
            id: 'delivery-process',
            icon: <DeliveryIcon className="text-teal-500" />,
            title: 'فرایند تحویل خودرو',
            description: 'پیگیری وضعیت تحویل خودرو به مشتریان از مرحله آماده‌سازی تا تحویل نهایی.'
        },
        {
            id: 'cars',
            icon: <CarIcon className="text-indigo-500" />,
            title: 'مدیریت خودروها',
            description: 'افزودن و ویرایش اطلاعات و تصاویر مربوط به مدل‌های مختلف خودروها.'
        },
        {
            id: 'car-prices',
            icon: <PriceIcon className="text-purple-500" />,
            title: 'بررسی قیمت روز',
            description: 'مقایسه قیمت‌های روز خودروها از منابع مختلف و مشاهده آمار.'
        },
        {
            id: 'settings',
            icon: <SettingsIcon className="text-slate-500" />,
            title: 'تنظیمات',
            description: 'پیکربندی تنظیمات کلی برنامه، اطلاعات نمایندگی و کلیدهای API.'
        }
    ];

    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">داشبورد اصلی</h2>
                    <p className="text-slate-500 mt-1">به سامانه مدیریت سرنخ خوش آمدید.</p>
                </div>
                
                <div>
                    <h3 className="text-xl font-bold text-slate-700 mb-4">دسترسی سریع</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {actionItems.map(item => (
                             <ActionCard 
                                key={item.id}
                                icon={item.icon}
                                title={item.title}
                                description={item.description}
                                onClick={() => onNavigate(item.id as ActiveView)}
                             />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default HomePage;