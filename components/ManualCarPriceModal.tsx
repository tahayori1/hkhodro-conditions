import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Edit3, Check, HelpCircle, Info } from 'lucide-react';

export interface ManualCarPrice {
    id: string;
    model_name: string;
    price_rial: number;
    updated_at: string;
}

interface ManualCarPriceModalProps {
    isOpen: boolean;
    onClose: () => void;
    manualPrices: ManualCarPrice[];
    knownModels: string[];
    onSave: (modelName: string, priceRial: number) => void;
    onDelete: (id: string) => void;
}

const formatPriceHelper = (value: number) => {
    if (!value || isNaN(value)) return { riyalStr: '۰ ریال', tomanStr: '۰ تومان', words: '' };
    
    const toman = Math.floor(value / 10);
    const riyalStr = `${value.toLocaleString('fa-IR')} ریال`;
    const tomanStr = `${toman.toLocaleString('fa-IR')} تومان`;
    
    let words = '';
    if (toman >= 1000000000) { // Billions of tomans (e.g. 1.5 Billion)
        const billions = toman / 1000000000;
        const formattedBillions = Number(billions.toFixed(2)).toLocaleString('fa-IR');
        words = `${formattedBillions} میلیارد تومان`;
    } else if (toman >= 1000000) { // Millions of tomans
        const millions = toman / 1000000;
        const formattedMillions = Number(millions.toFixed(1)).toLocaleString('fa-IR');
        words = `${formattedMillions} میلیون تومان`;
    } else if (toman >= 1000) {
        const thousands = Math.round(toman / 1000);
        words = `${thousands.toLocaleString('fa-IR')} هزار تومان`;
    } else {
        words = `${toman.toLocaleString('fa-IR')} تومان`;
    }
    return { riyalStr, tomanStr, words };
};

const ManualCarPriceModal: React.FC<ManualCarPriceModalProps> = ({
    isOpen,
    onClose,
    manualPrices,
    knownModels,
    onSave,
    onDelete
}) => {
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [customModelName, setCustomModelName] = useState<string>('');
    const [priceInput, setPriceInput] = useState<string>('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Filter out models that already have manual overrides unless we are editing
    const nonOverriddenModels = useMemo(() => {
        const currentManualModels = new Set(manualPrices.map(m => m.model_name));
        return knownModels.filter(model => !currentManualModels.has(model));
    }, [knownModels, manualPrices]);

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedModel(val);
        
        // If they select an existing manual price to edit/view, prefill price
        const existing = manualPrices.find(m => m.model_name === val);
        if (existing) {
            setPriceInput(existing.price_rial.toString());
            setEditingId(existing.id);
        } else {
            setPriceInput('');
            setEditingId(null);
        }
    };

    const parsedPrice = useMemo(() => {
        const clean = priceInput.replace(/[^0-9]/g, '');
        return clean ? parseInt(clean, 10) : 0;
    }, [priceInput]);

    const priceFormats = useMemo(() => {
        return formatPriceHelper(parsedPrice);
    }, [parsedPrice]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const finalModelName = selectedModel === 'CUSTOM' ? customModelName.trim() : selectedModel;
        
        if (!finalModelName) {
            alert('لطفاً نام مدل خودرو را انتخاب یا وارد کنید.');
            return;
        }
        
        if (parsedPrice <= 0) {
            alert('لطفاً قیمت معتبر بزرگتر از صفر وارد کنید.');
            return;
        }

        onSave(finalModelName, parsedPrice);
        
        // Reset form
        setSelectedModel('');
        setCustomModelName('');
        setPriceInput('');
        setEditingId(null);
    };

    const handleEditClick = (item: ManualCarPrice) => {
        if (knownModels.includes(item.model_name)) {
            setSelectedModel(item.model_name);
        } else {
            setSelectedModel('CUSTOM');
            setCustomModelName(item.model_name);
        }
        setPriceInput(item.price_rial.toString());
        setEditingId(item.id);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span>🛠️ مدیریت و ثبت قیمت‌های دستی</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            قیمت‌های وارد شده در این بخش، نسبت به استعلام‌های خودکار در اولویت بالاتری برای نمایش و کپی آمار قرار خواهند گرفت.
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Right: Add/Edit Form (5 cols) */}
                        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm h-fit">
                            <h4 className="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700/60 pb-3 mb-4 text-sm flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                <Plus className="w-4 h-4" />
                                {editingId ? 'ویرایش قیمت دستی' : 'ثبت قیمت دستی جدید'}
                            </h4>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Model Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">مدل خودرو</label>
                                    <select
                                        value={selectedModel}
                                        onChange={handleModelChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                                        required
                                    >
                                        <option value="">-- انتخاب مدل خودرو --</option>
                                        
                                        {/* Show currently editing model if it exists */}
                                        {editingId && selectedModel && selectedModel !== 'CUSTOM' && (
                                            <option value={selectedModel}>{selectedModel} (در حال ویرایش)</option>
                                        )}
                                        
                                        {/* List all other non-overridden models */}
                                        <optgroup label="مدل‌های موجود در سیستم">
                                            {nonOverriddenModels.map(model => (
                                                <option key={model} value={model}>{model}</option>
                                            ))}
                                        </optgroup>
                                        
                                        <option value="CUSTOM">➕ ثبت خودروی جدید / نام دلخواه</option>
                                    </select>
                                </div>

                                {/* Custom Model Name Input */}
                                {selectedModel === 'CUSTOM' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">نام خودروی جدید (دستی)</label>
                                        <input
                                            type="text"
                                            value={customModelName}
                                            onChange={e => setCustomModelName(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                                            placeholder="مثلاً: کی ام سی JS6 هیبرید"
                                            required
                                        />
                                    </div>
                                )}

                                {/* Price input in Rial */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">قیمت به ریال</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={priceInput}
                                            onChange={e => setPriceInput(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none font-mono"
                                            placeholder="مثلاً: ۱۵۵۰۰۰۰۰۰۰۰"
                                            required
                                        />
                                        <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">ریال</span>
                                    </div>
                                </div>

                                {/* Conversions and previews */}
                                {parsedPrice > 0 && (
                                    <div className="bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/40 space-y-1.5">
                                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                            <span>معادل به تومان:</span>
                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{priceFormats.tomanStr}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                            <span>خوانش فارسی:</span>
                                            <span className="font-bold text-amber-700 dark:text-amber-400">{priceFormats.words}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Options */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/10 dark:shadow-none transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Check className="w-4 h-4" />
                                        {editingId ? 'بروزرسانی تغییرات' : 'ثبت در سامانه'}
                                    </button>
                                    
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedModel('');
                                                setCustomModelName('');
                                                setPriceInput('');
                                                setEditingId(null);
                                            }}
                                            className="px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all"
                                        >
                                            انصراف
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Left: Active Manual Prices List (7 cols) */}
                        <div className="lg:col-span-7 space-y-4">
                            <h4 className="font-bold text-slate-750 dark:text-slate-205 text-sm flex items-center gap-1.5 border-b pb-2 dark:border-slate-800">
                                <Info className="w-4 h-4 text-sky-500" />
                                لیست قیمت‌های ثبت شده دستی ({manualPrices.length.toLocaleString('fa-IR')} مورد)
                            </h4>

                            {manualPrices.length === 0 ? (
                                <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <p className="text-sm text-slate-400 dark:text-slate-500">هیچ قیمت دستی در سیستم ثبت نشده است.</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">از پنل سمت راست اقدام به ثبت قیمت کنید.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                                    {manualPrices.map(item => {
                                        const formats = formatPriceHelper(item.price_rial);
                                        return (
                                            <div 
                                                key={item.id} 
                                                className="bg-white dark:bg-slate-800/80 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center hover:shadow-md transition-shadow group relative overflow-hidden"
                                            >
                                                {/* Visual Amber Strip */}
                                                <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
                                                
                                                <div className="pr-2 space-y-1">
                                                    <span className="font-black text-slate-800 dark:text-white text-sm">{item.model_name}</span>
                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                                            {item.price_rial.toLocaleString('fa-IR')} <span className="text-[10px] text-slate-400">ریال</span>
                                                        </span>
                                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                                            معادل: {formats.words || formats.tomanStr}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(item)}
                                                        className="p-1.5 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-slate-55 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                                                        title="ویرایش قیمت"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(item.id)}
                                                        className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-slate-55 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                                                        title="حذف قیمت"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-205 font-bold rounded-xl text-xs transition-colors"
                    >
                        بستن پنجره
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ManualCarPriceModal;
