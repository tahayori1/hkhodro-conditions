
import React, { useState, useEffect, useMemo } from 'react';
import type { CarPriceStats } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { CopyIcon } from './icons/CopyIcon';

interface CarPriceCopySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: CarPriceStats[];
    onCopySuccess: () => void;
}

const CarPriceCopySettingsModal: React.FC<CarPriceCopySettingsModalProps> = ({ isOpen, onClose, stats, onCopySuccess }) => {
    const [headerText, setHeaderText] = useState('');
    const [footerText, setFooterText] = useState('https://t.me/kermanmotor2606');
    const [includeHavaleh1, setIncludeHavaleh1] = useState(true);
    const [includeHavaleh2, setIncludeHavaleh2] = useState(true);
    const [includeMaxLimit, setIncludeMaxLimit] = useState(false);
    
    // Model Selection State
    const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());

    // Initialize defaults
    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const date = now.toLocaleDateString('fa-IR');
            const time = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
            setHeaderText(`📋 لیست قیمت محصولات کرمان موتور در تاریخ ${date} ساعت ${time} بر اساس استعلام از سایتهای خودرویی`);
            
            // Select all models by default
            const allModels = new Set(stats.map(s => s.model_name));
            setSelectedModels(allModels);
        }
    }, [isOpen, stats]);

    const handleToggleModel = (modelName: string) => {
        setSelectedModels(prev => {
            const next = new Set(prev);
            if (next.has(modelName)) next.delete(modelName);
            else next.add(modelName);
            return next;
        });
    };

    const handleSelectAll = (select: boolean) => {
        if (select) {
            setSelectedModels(new Set(stats.map(s => s.model_name)));
        } else {
            setSelectedModels(new Set());
        }
    };

    const generatedText = useMemo(() => {
        const selectedStats = stats.filter(s => selectedModels.has(s.model_name));
        
        const rows = selectedStats.map(stat => {
            const price = stat.maximum;
            const havaleh1Min = Math.round(stat.maximum * 0.95);
            const havaleh1Max = Math.round(stat.maximum * 0.97);
            const havaleh2Min = Math.round(stat.maximum * 0.90);
            const havaleh2Max = Math.round(stat.maximum * 0.94);
            const maxLimit = Math.round(stat.maximum * 1.02);

            let line = `🚗 ${stat.model_name}\n💰 قیمت: ${price.toLocaleString('fa-IR')}`;
            
            if (includeHavaleh1) {
                line += `\n📄 حواله ۱ ماهه: ${havaleh1Min.toLocaleString('fa-IR')} تا ${havaleh1Max.toLocaleString('fa-IR')}`;
            }
            if (includeHavaleh2) {
                line += `\n📄 حواله ۲ ماهه: ${havaleh2Min.toLocaleString('fa-IR')} تا ${havaleh2Max.toLocaleString('fa-IR')}`;
            }
            if (includeMaxLimit) {
                line += `\n📈 سقف معامله: ${maxLimit.toLocaleString('fa-IR')}`;
            }
            
            return line;
        });

        return `${headerText}\n\n${rows.join('\n\n')}\n\n${footerText}`;
    }, [stats, selectedModels, headerText, footerText, includeHavaleh1, includeHavaleh2, includeMaxLimit]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedText).then(() => {
            onCopySuccess();
            onClose();
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">تنظیمات کپی آمار قیمت</h3>
                    <button onClick={onClose}><CloseIcon className="text-slate-500" /></button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Sidebar: Settings */}
                    <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-900/50 p-6 overflow-y-auto border-l dark:border-slate-700">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">متن سرتیتر</label>
                                <textarea 
                                    value={headerText}
                                    onChange={e => setHeaderText(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">اطلاعات نمایشی</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={includeHavaleh1} onChange={e => setIncludeHavaleh1(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500" />
                                        <span className="text-sm dark:text-slate-300">حواله ۱ ماهه (۳٪ - ۵٪)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={includeHavaleh2} onChange={e => setIncludeHavaleh2(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500" />
                                        <span className="text-sm dark:text-slate-300">حواله ۲ ماهه (۶٪ - ۱۰٪)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={includeMaxLimit} onChange={e => setIncludeMaxLimit(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500" />
                                        <span className="text-sm dark:text-slate-300">سقف نرخ معامله (+۲٪)</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-slate-500">انتخاب خودروها</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSelectAll(true)} className="text-[10px] text-sky-600 hover:underline">همه</button>
                                        <button onClick={() => handleSelectAll(false)} className="text-[10px] text-red-500 hover:underline">هیچکدام</button>
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {stats.map(s => (
                                        <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedModels.has(s.model_name)} 
                                                onChange={() => handleToggleModel(s.model_name)} 
                                                className="rounded text-sky-600 focus:ring-sky-500" 
                                            />
                                            <span className="text-sm dark:text-slate-300 truncate">{s.model_name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">متن پاورقی</label>
                                <input 
                                    type="text" 
                                    value={footerText}
                                    onChange={e => setFooterText(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 p-6 overflow-y-auto bg-slate-100 dark:bg-black/20">
                        <div className="max-w-xl mx-auto">
                            <label className="block text-xs font-bold text-slate-500 mb-2 text-center">پیش‌نمایش متن کپی شده</label>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm whitespace-pre-wrap text-sm leading-relaxed dark:text-slate-200 font-mono">
                                {generatedText}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t dark:border-slate-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">انصراف</button>
                    <button onClick={handleCopy} className="px-8 py-2.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 shadow-lg shadow-sky-200 dark:shadow-none transition-all flex items-center gap-2">
                        <CopyIcon className="w-5 h-5" />
                        کپی در حافظه
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CarPriceCopySettingsModal;
