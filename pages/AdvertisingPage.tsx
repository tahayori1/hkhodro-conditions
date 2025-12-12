
import React, { useState, useEffect, useMemo } from 'react';
import type { AdCampaign, AdStatus, AdPlatform } from '../types';
import { adCampaignsService } from '../services/api';
import { RocketIcon } from '../components/icons/RocketIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

const PLATFORMS: { key: AdPlatform; label: string; color: string }[] = [
    { key: 'INSTAGRAM', label: 'اینستاگرام', color: 'bg-rose-100 text-rose-700' },
    { key: 'GOOGLE', label: 'گوگل ادز', color: 'bg-blue-100 text-blue-700' },
    { key: 'SMS', label: 'پیامک', color: 'bg-green-100 text-green-700' },
    { key: 'WEBSITE', label: 'سایت', color: 'bg-purple-100 text-purple-700' },
    { key: 'BILLBOARD', label: 'محیطی', color: 'bg-orange-100 text-orange-700' },
    { key: 'OTHER', label: 'سایر', color: 'bg-slate-100 text-slate-700' },
];

const STATUS_LABELS: Record<AdStatus, string> = {
    'ACTIVE': 'فعال',
    'PAUSED': 'متوقف',
    'COMPLETED': 'پایان یافته',
    'DRAFT': 'پیش‌نویس',
};

const AdvertisingPage: React.FC = () => {
    const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCampaign, setCurrentCampaign] = useState<Partial<AdCampaign>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [filterStatus, setFilterStatus] = useState<AdStatus | 'ALL'>('ALL');

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const data = await adCampaignsService.getAll();
            setCampaigns(data);
        } catch (error) {
            setToast({ message: 'خطا در دریافت اطلاعات', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentCampaign.title || !currentCampaign.platform) {
            setToast({ message: 'عنوان و پلتفرم الزامی است', type: 'error' });
            return;
        }

        try {
            if (currentCampaign.id) {
                await adCampaignsService.update(currentCampaign as AdCampaign);
                setToast({ message: 'کمپین ویرایش شد', type: 'success' });
            } else {
                await adCampaignsService.create({
                    ...currentCampaign,
                    status: currentCampaign.status || 'DRAFT',
                    startDate: currentCampaign.startDate || new Date().toLocaleDateString('fa-IR'),
                    budget: currentCampaign.budget || 0,
                    spent: currentCampaign.spent || 0,
                });
                setToast({ message: 'کمپین جدید ایجاد شد', type: 'success' });
            }
            setIsModalOpen(false);
            fetchCampaigns();
        } catch (error) {
            setToast({ message: 'خطا در ذخیره', type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('آیا از حذف این کمپین اطمینان دارید؟')) {
            try {
                await adCampaignsService.delete(id);
                setToast({ message: 'حذف شد', type: 'success' });
                fetchCampaigns();
            } catch (error) {
                setToast({ message: 'خطا در حذف', type: 'error' });
            }
        }
    };

    const filteredCampaigns = useMemo(() => {
        if (filterStatus === 'ALL') return campaigns;
        return campaigns.filter(c => c.status === filterStatus);
    }, [campaigns, filterStatus]);

    const stats = useMemo(() => {
        const active = campaigns.filter(c => c.status === 'ACTIVE').length;
        const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
        const totalSpent = campaigns.reduce((acc, c) => acc + (c.spent || 0), 0);
        return { active, totalBudget, totalSpent };
    }, [campaigns]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-800 p-6 rounded-2xl shadow-md mb-8 flex flex-col md:flex-row justify-between items-center gap-6 border border-purple-100 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-white dark:bg-slate-700 rounded-2xl text-pink-600 dark:text-pink-400 shadow-sm">
                        <RocketIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">امور تبلیغات</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">مدیریت کمپین‌ها، بودجه و عملکرد</p>
                    </div>
                </div>
                
                <div className="flex gap-4 items-center">
                    <div className="text-center px-4 border-l border-slate-300 dark:border-slate-600">
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">کمپین فعال</div>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.active}</div>
                    </div>
                    <div className="text-center px-4">
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">کل بودجه</div>
                        <div className="text-lg font-bold text-slate-800 dark:text-white font-mono">{(stats.totalBudget / 1000000).toFixed(0)} M</div>
                    </div>
                    <button onClick={() => { setCurrentCampaign({status: 'ACTIVE'}); setIsModalOpen(true); }} className="bg-pink-600 text-white px-5 py-3 rounded-xl hover:bg-pink-700 flex items-center gap-2 shadow-lg shadow-pink-200 dark:shadow-none transition-transform active:scale-95 font-bold">
                        <PlusIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">کمپین جدید</span>
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {(['ALL', 'ACTIVE', 'PAUSED', 'COMPLETED', 'DRAFT'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                            filterStatus === status 
                            ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' 
                            : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                        }`}
                    >
                        {status === 'ALL' ? 'همه' : STATUS_LABELS[status]}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center p-12"><Spinner /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCampaigns.map(campaign => {
                        const platform = PLATFORMS.find(p => p.key === campaign.platform) || PLATFORMS[5];
                        const progress = campaign.budget > 0 ? Math.min((campaign.spent / campaign.budget) * 100, 100) : 0;
                        
                        return (
                            <div key={campaign.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-1.5 h-full ${platform.color.split(' ')[0].replace('100', '500')}`}></div>
                                
                                <div className="flex justify-between items-start mb-4 pl-2">
                                    <div>
                                        <div className={`text-[10px] px-2 py-0.5 rounded inline-block mb-2 font-bold ${platform.color}`}>
                                            {platform.label}
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{campaign.title}</h3>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                                        campaign.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                                        campaign.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {STATUS_LABELS[campaign.status]}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                        <span>بودجه:</span>
                                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{campaign.budget.toLocaleString('fa-IR')}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                        <div className="bg-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400">
                                        <span>هزینه: {campaign.spent.toLocaleString('fa-IR')}</span>
                                        <span>{progress.toFixed(0)}%</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 grid grid-cols-2 gap-2 text-center mb-4">
                                    <div>
                                        <div className="text-[10px] text-slate-400 mb-1">بازدید (Impression)</div>
                                        <div className="font-bold text-slate-700 dark:text-white font-mono">{campaign.impressions?.toLocaleString('fa-IR') || '0'}</div>
                                    </div>
                                    <div className="border-r border-slate-200 dark:border-slate-600">
                                        <div className="text-[10px] text-slate-400 mb-1">لید (Lead)</div>
                                        <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{campaign.leads?.toLocaleString('fa-IR') || '0'}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <span className="text-xs text-slate-400 font-mono">{campaign.startDate}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setCurrentCampaign(campaign); setIsModalOpen(true); }} className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg transition-colors"><EditIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(campaign.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredCampaigns.length === 0 && (
                        <div className="col-span-full text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                            کمپینی یافت نشد.
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{currentCampaign.id ? 'ویرایش کمپین' : 'تعریف کمپین جدید'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><CloseIcon className="text-slate-500" /></button>
                        </div>
                        
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان کمپین</label>
                                <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentCampaign.title || ''} onChange={e => setCurrentCampaign({...currentCampaign, title: e.target.value})} placeholder="مثال: فروش ویژه تابستان" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">پلتفرم</label>
                                    <select className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentCampaign.platform || ''} onChange={e => setCurrentCampaign({...currentCampaign, platform: e.target.value as AdPlatform})}>
                                        <option value="">انتخاب...</option>
                                        {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">وضعیت</label>
                                    <select className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentCampaign.status || 'DRAFT'} onChange={e => setCurrentCampaign({...currentCampaign, status: e.target.value as AdStatus})}>
                                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">بودجه کل (تومان)</label>
                                    <input type="number" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentCampaign.budget || ''} onChange={e => setCurrentCampaign({...currentCampaign, budget: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">هزینه شده</label>
                                    <input type="number" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentCampaign.spent || ''} onChange={e => setCurrentCampaign({...currentCampaign, spent: Number(e.target.value)})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ شروع</label>
                                    <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-left" dir="ltr" placeholder="1403/xx/xx" value={currentCampaign.startDate || ''} onChange={e => setCurrentCampaign({...currentCampaign, startDate: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ پایان</label>
                                    <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-left" dir="ltr" placeholder="1403/xx/xx" value={currentCampaign.endDate || ''} onChange={e => setCurrentCampaign({...currentCampaign, endDate: e.target.value})} />
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase">نتایج (دستی)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">تعداد نمایش (Impression)</label>
                                        <input type="number" className="w-full px-3 py-1.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm" value={currentCampaign.impressions || ''} onChange={e => setCurrentCampaign({...currentCampaign, impressions: Number(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">تعداد لید (Lead)</label>
                                        <input type="number" className="w-full px-3 py-1.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm" value={currentCampaign.leads || ''} onChange={e => setCurrentCampaign({...currentCampaign, leads: Number(e.target.value)})} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">یادداشت</label>
                                <textarea rows={2} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentCampaign.notes || ''} onChange={e => setCurrentCampaign({...currentCampaign, notes: e.target.value})}></textarea>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">انصراف</button>
                            <button onClick={handleSave} className="px-8 py-2.5 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 shadow-lg shadow-pink-200 dark:shadow-none">ذخیره</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AdvertisingPage;
