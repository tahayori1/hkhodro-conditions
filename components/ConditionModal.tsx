
import React, { useState, useEffect } from 'react';
import type { CarSaleCondition, Car } from '../types';
import { ConditionStatus, SaleType, PayType, DocumentStatus } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface ConditionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (condition: Omit<CarSaleCondition, 'id'>) => void;
    condition: CarSaleCondition | null;
    cars: Car[];
}

const MODEL_YEARS = Array.from({ length: 1407 - 1396 + 1 }, (_, i) => 1407 - i);

const AVAILABLE_COLORS = ['سفید', 'مشکی', 'خاکستری', 'آبی', 'قرمز', 'قهوه ای', 'سایر'];

/**
 * Utility to convert numbers to Persian words
 */
const numberToPersianWords = (num: number): string => {
    if (num === 0) return 'صفر';
    if (!num) return '';

    const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
    const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
    const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
    const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
    const steps = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

    const convertThreeDigits = (n: number): string => {
        let res = '';
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (h > 0) res += hundreds[h];
        
        if (t > 0 || u > 0) {
            if (res !== '') res += ' و ';
            if (t === 1) {
                res += teens[u];
            } else {
                if (t > 1) res += tens[t];
                if (u > 0) {
                    if (t > 1) res += ' و ';
                    res += units[u];
                }
            }
        }
        return res;
    };

    let result = '';
    let stepCount = 0;

    while (num > 0) {
        const threeDigits = num % 1000;
        if (threeDigits > 0) {
            const word = convertThreeDigits(threeDigits);
            const stepName = steps[stepCount];
            result = word + (stepName ? ' ' + stepName : '') + (result !== '' ? ' و ' + result : '');
        }
        num = Math.floor(num / 1000);
        stepCount++;
    }

    return result.trim();
};

const ConditionModal: React.FC<ConditionModalProps> = ({ isOpen, onClose, onSave, condition, cars }) => {
    
    // Fallback to first car if available, or empty string
    const defaultCarModel = cars.length > 0 ? cars[0].name : '';

    const initialFormState: Omit<CarSaleCondition, 'id'> = {
        car_model: defaultCarModel,
        model: 1404, // Default to 1404 as requested
        status: ConditionStatus.AVAILABLE,
        sale_type: SaleType.FACTORY_REGISTRATION,
        pay_type: PayType.CASH,
        document_status: DocumentStatus.FREE,
        colors: ['سفید', 'مشکی'], // Default colors as requested
        delivery_time: '',
        initial_deposit: 600000000, // Default to 600 million as requested
        descriptions: '',
        is_public: true,
        stock_quantity: 0,
    };

    const [formState, setFormState] = useState(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (condition) {
            setFormState(condition);
        } else {
            // Reset to initial state when opening for "New"
            setFormState({
                ...initialFormState,
                car_model: cars.length > 0 ? cars[0].name : ''
            });
        }
        setErrors({});
    }, [condition, isOpen, cars]);

    const handleChange = <T extends keyof typeof initialFormState,>(field: T, value: (typeof initialFormState)[T]) => {
        setFormState(prevState => ({ ...prevState, [field]: value }));
        if (errors[field]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const toggleColor = (color: string) => {
        const currentColors = [...formState.colors];
        const index = currentColors.indexOf(color);
        if (index > -1) {
            currentColors.splice(index, 1);
        } else {
            currentColors.push(color);
        }
        handleChange('colors', currentColors);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formState.car_model.trim()) newErrors.car_model = 'مدل خودرو الزامی است.';
        if (!formState.delivery_time.trim()) newErrors.delivery_time = 'زمان تحویل الزامی است.';
        if (formState.initial_deposit <= 0) newErrors.initial_deposit = 'مبلغ پیش‌پرداخت باید بزرگتر از صفر باشد.';
        if (formState.colors.length === 0) newErrors.colors = 'حداقل یک رنگ باید انتخاب شود.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formState);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        {condition && condition.id !== 0 ? 'ویرایش شرط فروش' : 'افزودن شرط فروش جدید'}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="car_model" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">مدل خودرو</label>
                            <select id="car_model" value={formState.car_model} onChange={(e) => handleChange('car_model', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white ${errors.car_model ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                <option value="">انتخاب کنید...</option>
                                {cars.map(car => <option key={car.id} value={car.name}>{car.name}</option>)}
                            </select>
                            {errors.car_model && <p className="text-red-500 text-xs mt-1">{errors.car_model}</p>}
                        </div>
                        <div>
                            <label htmlFor="model" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">سال مدل (عددی)</label>
                            <input 
                                type="number" 
                                id="model" 
                                value={formState.model} 
                                onChange={(e) => handleChange('model', parseInt(e.target.value, 10) || 0)}
                                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white font-mono ${errors.model ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                            />
                            {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">وضعیت</label>
                            <select id="status" value={formState.status} onChange={(e) => handleChange('status', e.target.value as ConditionStatus)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-white">
                                {Object.values(ConditionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="stock_quantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تعداد موجود در انبار</label>
                            <input type="number" id="stock_quantity" value={formState.stock_quantity} onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value, 10) || 0)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="sale_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نوع فروش</label>
                            <select id="sale_type" value={formState.sale_type} onChange={(e) => handleChange('sale_type', e.target.value as SaleType)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-white">
                                {Object.values(SaleType).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="pay_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نحوه پرداخت</label>
                             <select id="pay_type" value={formState.pay_type} onChange={(e) => handleChange('pay_type', e.target.value as PayType)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-white">
                                {Object.values(PayType).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="document_status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">وضعیت سند</label>
                             <select id="document_status" value={formState.document_status} onChange={(e) => handleChange('document_status', e.target.value as DocumentStatus)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-white">
                                {Object.values(DocumentStatus).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="delivery_time" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">زمان تحویل</label>
                            <input type="text" id="delivery_time" value={formState.delivery_time} onChange={(e) => handleChange('delivery_time', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:text-white ${errors.delivery_time ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`} />
                            {errors.delivery_time && <p className="text-red-500 text-xs mt-1">{errors.delivery_time}</p>}
                        </div>
                         <div className="md:col-span-2">
                            <label htmlFor="initial_deposit" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">مبلغ پیش‌پرداخت (تومان)</label>
                            <input 
                                type="number" 
                                id="initial_deposit" 
                                value={formState.initial_deposit || ''} 
                                onChange={(e) => handleChange('initial_deposit', parseInt(e.target.value, 10) || 0)}
                                className={`w-full px-4 py-2.5 border rounded-lg dark:bg-slate-700 dark:text-white font-mono text-xl font-black ${errors.initial_deposit ? 'border-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500'}`} 
                            />
                            
                            {/* Real-time Number to Words Display */}
                            <div className={`mt-2 p-4 rounded-xl border transition-all duration-300 ${formState.initial_deposit > 0 ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800 scale-100 opacity-100' : 'bg-slate-50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800 scale-95 opacity-50'}`}>
                                <p className="text-[10px] font-black text-sky-600 dark:text-sky-400 mb-1 uppercase tracking-wider">معادل به حروف:</p>
                                <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-relaxed">
                                    {formState.initial_deposit > 0 ? `${numberToPersianWords(formState.initial_deposit)} تومان` : '---'}
                                </p>
                            </div>
                            
                            {errors.initial_deposit && <p className="text-red-500 text-xs mt-1 font-bold">{errors.initial_deposit}</p>}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="is_public" 
                                checked={formState.is_public} 
                                onChange={(e) => handleChange('is_public', e.target.checked)}
                                className="w-5 h-5 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                            />
                            <label htmlFor="is_public" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">نمایش عمومی در سایت</label>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">انتخاب رنگ‌های مجاز</label>
                            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                {AVAILABLE_COLORS.map(color => {
                                    const isSelected = formState.colors.includes(color);
                                    return (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => toggleColor(color)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                                isSelected 
                                                ? 'bg-sky-600 border-sky-600 text-white shadow-md' 
                                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-sky-400'
                                            }`}
                                        >
                                            {color}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.colors && <p className="text-red-500 text-xs mt-1">{errors.colors}</p>}
                        </div>
                    </div>
                     <div className="md:col-span-2">
                        <label htmlFor="descriptions" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">توضیحات</label>
                        <textarea id="descriptions" rows={3} value={formState.descriptions} onChange={(e) => handleChange('descriptions', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white" />
                    </div>

                    <div className="pt-4 border-t dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-800 py-4 px-6">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-bold">انصراف</button>
                        <button type="submit" className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-bold shadow-lg shadow-sky-200 dark:shadow-none">ذخیره</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConditionModal;
