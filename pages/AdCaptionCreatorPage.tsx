import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCars } from '../services/api';
import type { Car } from '../types';
import { Sparkles, Copy, RefreshCw, Layers, Smartphone, FileText, Check, AlertCircle } from 'lucide-react';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

interface FormState {
    targetType: 'divar' | 'instagram' | 'sms';
    model_name: string;
    customModel: string;
    condition: 'NEW' | 'USED_LIKE_NEW' | 'USED';
    deliveryType: 'FORI' | 'HAVALEH' | 'PRE_SALE' | 'DAYS_30';
    color: string;
    paymentMode: 'CASH' | 'INSTALLMENT' | 'PARTIAL';
    customKeywords: string;
    companyDetails: string;
}

const AdCaptionCreatorPage: React.FC = () => {
    const [cars, setCars] = useState<Car[]>([]);
    const [loadingCars, setLoadingCars] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generatedText, setGeneratedText] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [copied, setCopied] = useState(false);

    const [form, setForm] = useState<FormState>({
        targetType: 'divar',
        model_name: 'KMC J7',
        customModel: '',
        condition: 'NEW',
        deliveryType: 'FORI',
        color: 'سفید و مشکی آماده تحویل',
        paymentMode: 'CASH',
        customKeywords: 'سند آزاد، گارانتی فعال، مانیتور بزرگ، دوربین ۳۶۰ درجه',
        companyDetails: 'مجموعه خودرویی حسینی - تلفن تماس: ۰۹۱۲۳۴۵۶۷۸۹ - عاملیت ۲۶۰۶ کرمان موتور'
    });

    const standardModels = [
        'KMC J7', 'KMC Eagle', 'KMC X5', 'KMC T8', 'KMC T9', 
        'Jac J4', 'KMC SR3', 'KMC SR6', 'Bac X3 Pro'
    ];

    useEffect(() => {
        const fetchCars = async () => {
            try {
                const data = await getCars();
                setCars(data || []);
            } catch (err) {
                console.warn("Could not load cars, using fallback defaults:", err);
            } finally {
                setLoadingCars(false);
            }
        };
        fetchCars();
    }, []);

    // Merge standard models with fetched models to prevent duplicates
    const availableModels = React.useMemo(() => {
        const set = new Set(standardModels);
        cars.forEach(car => {
            if (car.model_name) {
                set.add(car.model_name);
            }
        });
        return Array.from(set);
    }, [cars]);

    const handleGenerate = async () => {
        const selectedModel = form.model_name === 'OTHER' ? form.customModel : form.model_name;
        if (!selectedModel) {
            setToast({ message: 'لطفا مدل خودرو را تعیین کنید', type: 'error' });
            return;
        }

        setGenerating(true);
        try {
            // Build descriptions of settings to guide the AI beautifully
            const conditionText = 
                form.condition === 'NEW' ? 'صفر کیلومتر' :
                form.condition === 'USED_LIKE_NEW' ? 'کارکرده در حد نو (بسیار تمیز)' : 'کارکرده';
            
            const deliveryText =
                form.deliveryType === 'FORI' ? 'تحویل فوری روز' :
                form.deliveryType === 'HAVALEH' ? 'حواله با امکان صلح نمایندگی' :
                form.deliveryType === 'PRE_SALE' ? 'پیش‌فروش رسمی' : 'تحویل ۳۰ روزه کاری';

            const paymentText =
                form.paymentMode === 'CASH' ? 'فروش نقدی' :
                form.paymentMode === 'INSTALLMENT' ? 'فروش اقساطی با چک صیادی' : 'شرایط توافقی با مابقی اقساط';

            const customKeywordsEnriched = [
                `وضعیت: ${conditionText}`,
                `نوع تحویل: ${deliveryText}`,
                `رنگ: ${form.color}`,
                `نوع معامله: ${paymentText}`,
                form.customKeywords
            ].filter(Boolean).join('، ');

            const response = await fetch('/api/generate-ad', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_name: selectedModel,
                    targetType: form.targetType,
                    customKeywords: customKeywordsEnriched,
                    companyDetails: form.companyDetails
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'خطا در برقراری ارتباط با سرور هوش مصنوعی');
            }

            const data = await response.json();
            setGeneratedText(data.result);
            setToast({ message: 'متن با موفقیت توسط هوش مصنوعی تولید شد!', type: 'success' });
        } catch (error: any) {
            console.error(error);
            setToast({ message: error.message || 'خطا در ارتباط با سرور', type: 'error' });
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (!generatedText) return;
        navigator.clipboard.writeText(generatedText).then(() => {
            setCopied(true);
            setToast({ message: 'متن کپی شد', type: 'success' });
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="ad-caption-creator-root">
            {/* Header section with rich dark theme matching existing layout components */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8 flex justify-between items-center border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">آگهی ساز و کپشن ساز هوشمند</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">تولید محتوای تبلیغاتی حرفه‌ای برای همکاران فروش، دیوار، اینستاگرام و پیامک بر پایه هوش مصنوعی</p>
                    </div>
                </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Form Settings Panel - Covers 7 Cols */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                    <h3 className="text-md font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                        <span>تنظیمات و اطلاعات خودرو</span>
                    </h3>

                    {/* Format Target Mode Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">انتخاب قالب متن</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, targetType: 'divar' })}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                                    form.targetType === 'divar'
                                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                                        : 'border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                <Layers className="w-5 h-5 mb-1" />
                                <span className="text-xs font-bold">آگهی دیوار</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setForm({ ...form, targetType: 'instagram' })}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                                    form.targetType === 'instagram'
                                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                                        : 'border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                <Smartphone className="w-5 h-5 mb-1" />
                                <span className="text-xs font-bold">کپشن اینستاگرام</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setForm({ ...form, targetType: 'sms' })}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                                    form.targetType === 'sms'
                                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                                        : 'border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                <FileText className="w-5 h-5 mb-1" />
                                <span className="text-xs font-bold">متن پیامکی کوتاه</span>
                            </button>
                        </div>
                    </div>

                    {/* Car selection and customization */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">مدل یا نام خودرو</label>
                        <select
                            value={form.model_name}
                            onChange={(e) => setForm({ ...form, model_name: e.target.value })}
                            className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white text-sm font-bold focus:ring-indigo-500"
                        >
                            {availableModels.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                            <option value="OTHER">وارد کردن مدل سفارشی...</option>
                        </select>
                    </div>

                    {form.model_name === 'OTHER' && (
                        <div className="animate-fade-in">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">وارد کردن خودرو به صورت دستی</label>
                            <input
                                type="text"
                                placeholder="مثلا: فیدلیتی پرایم، تیگو ۸ پرو"
                                value={form.customModel}
                                onChange={(e) => setForm({ ...form, customModel: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white text-sm font-bold"
                            />
                        </div>
                    )}

                    {/* Basic specs & Status parameters */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">وضعیت خودرو</label>
                            <select
                                value={form.condition}
                                onChange={(e) => setForm({ ...form, condition: e.target.value as any })}
                                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white text-xs font-bold"
                            >
                                <option value="NEW">صفر کیلومتر</option>
                                <option value="USED_LIKE_NEW">کارکرده در حد نو</option>
                                <option value="USED">کارکرده</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">نوع واگذاری</label>
                            <select
                                value={form.deliveryType}
                                onChange={(e) => setForm({ ...form, deliveryType: e.target.value as any })}
                                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white text-xs font-bold"
                            >
                                <option value="FORI">تحویل فوری</option>
                                <option value="HAVALEH">حواله خودرو</option>
                                <option value="PRE_SALE">پیش فروش</option>
                                <option value="DAYS_30">تحویل ۳۰ روزه</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">شرایط معامله</label>
                            <select
                                value={form.paymentMode}
                                onChange={(e) => setForm({ ...form, paymentMode: e.target.value as any })}
                                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white text-xs font-bold"
                            >
                                <option value="CASH">نقدی</option>
                                <option value="INSTALLMENT">اقساطی با چک</option>
                                <option value="PARTIAL">معاوضه یا منعطف</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">رنگ بدنه و جزئیات آن</label>
                            <input
                                type="text"
                                value={form.color}
                                onChange={(e) => setForm({ ...form, color: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white text-xs font-bold"
                                placeholder="مثلا: مشکی متالیک زاپاس نخورده"
                            />
                        </div>
                    </div>

                    {/* Custom options / keywords for enriched context */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">آپشن‌ها و کلمات کلیدی ضروری (با کاما جدا کنید)</label>
                        <textarea
                            rows={2}
                            value={form.customKeywords}
                            onChange={(e) => setForm({ ...form, customKeywords: e.target.value })}
                            placeholder="مثال: سند دست اول، مانیتور، بیمه کامل، رادار نقطه کور"
                            className="w-full px-4 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white leading-relaxed"
                        />
                    </div>

                    {/* Dealer / Sales contact information to close the copy beautifully */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">مشخصات تماس و شرکت تبلیغاتی</label>
                        <textarea
                            rows={2}
                            value={form.companyDetails}
                            onChange={(e) => setForm({ ...form, companyDetails: e.target.value })}
                            placeholder="اطلاعات تماس، آدرس مغازه یا نمایندگی برای پاسخ دعوت با شماره تماس..."
                            className="w-full px-4 py-2 text-xs border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white leading-relaxed"
                        />
                    </div>

                    {/* Build Button */}
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
                    >
                        {generating ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                <span>درحال تحلیل و ساخت متن...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                <span>تولید خودکار متن آگهی / کپشن</span>
                            </>
                        )}
                    </button>
                </div>

                {/* AI Generative Output Panel - Covers 7 Cols */}
                <div className="lg:col-span-7 flex flex-col h-full min-h-[500px] bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-250 dark:border-slate-700 overflow-hidden relative">
                    
                    {/* Header bar of review window */}
                    <div className="bg-slate-100 dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full bg-indigo-505 bg-indigo-500 animate-pulse"></span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">خروجی هوش مصنوعی (پیش‌نما)</span>
                        </div>
                        {generatedText && (
                            <button
                                onClick={copyToClipboard}
                                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-650 hover:bg-slate-50 dark:hover:bg-slate-600 dark:text-white text-slate-700 px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                <span>{copied ? 'کپی شد!' : 'کپی متن'}</span>
                            </button>
                        )}
                    </div>

                    {/* Generated review paper body */}
                    <div className="p-6 flex-1 flex flex-col justify-center">
                        {generating ? (
                            <div className="flex flex-col items-center justify-center text-center space-y-4 py-16 animate-pulse">
                                <Spinner />
                                <div>
                                    <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">هوش مصنوعی در حال پردازش است...</p>
                                    <p className="text-xs text-slate-400 mt-1">تولید قالب اختصاصی بر اساس مشخصات خودرو، وضعیت پرداخت و کلمات کلیدی هدف</p>
                                </div>
                            </div>
                        ) : generatedText ? (
                            <textarea
                                value={generatedText}
                                onChange={(e) => setGeneratedText(e.target.value)}
                                className="w-full h-[500px] bg-white dark:bg-slate-850 p-6 rounded-lg text-slate-800 dark:text-slate-100 text-sm leading-relaxed border-0 focus:ring-0 resize-none font-vazir text-right shadow-inner select-all"
                                dir="rtl"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-20 text-slate-400 dark:text-slate-500 px-4">
                                <Sparkles className="w-12 h-12 text-indigo-400/50 mb-4 animate-bounce" />
                                <h4 className="font-bold text-slate-600 dark:text-slate-400 text-sm">هنوز متنی ایجاد نشده است</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 max-w-sm">
                                    تنظیمات خودرو را از بخش راست انتخاب نموده و روی دکمه «تولید خودکار متن آگهی» کلیک کنید تا هوش مصنوعی متن بازاریابی متمایز بسازد.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Disclaimer of generative outputs */}
                    <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 border-t border-slate-100 dark:border-slate-750 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <AlertCircle className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                        <p>
                            متن تولیدی توسط هوش مصنوعی بر اساس ورودی‌های انتخابی ساخته شده است. شما می‌توانید با کلیک مستقیم درون جعبه بالا، متن نهایی را به دلخواه خود ویرایش نمایید.
                        </p>
                    </div>

                </div>

            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AdCaptionCreatorPage;
