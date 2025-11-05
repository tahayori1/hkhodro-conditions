import React, { useState, useEffect } from 'react';
import type { CarSaleCondition } from '../types';
import { ConditionStatus, SaleType, PayType, DocumentStatus } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface ConditionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (condition: Omit<CarSaleCondition, 'id'>) => void;
    condition: CarSaleCondition | null;
}

const CAR_MODELS = [
    'JAC J4', 'JAC S3', 'JAC S5', 'BAC X3PRO', 'KMC T8', 'KMC T9', 'KMC A5',
    'KMC J7', 'KMC X5', 'KMC SR3', 'KMC EAGLE', 'KMC SHADOW', 'KMC SR6'
];

const MODEL_YEARS = Array.from({ length: 1407 - 1396 + 1 }, (_, i) => 1407 - i);

const initialFormState: Omit<CarSaleCondition, 'id'> = {
    car_model: CAR_MODELS[0],
    model: MODEL_YEARS[0],
    status: ConditionStatus.AVAILABLE,
    sale_type: SaleType.FACTORY_REGISTRATION,
    pay_type: PayType.CASH,
    document_status: DocumentStatus.FREE,
    colors: [],
    delivery_time: '',
    initial_deposit: 0,
    descriptions: '',
};

const ConditionModal: React.FC<ConditionModalProps> = ({ isOpen, onClose, onSave, condition }) => {
    const [formState, setFormState] = useState(initialFormState);
    const [colorsInput, setColorsInput] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (condition) {
            setFormState(condition);
            setColorsInput(condition.colors.join(', '));
        } else {
            setFormState(initialFormState);
            setColorsInput('');
        }
        setErrors({});
    }, [condition, isOpen]);

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

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formState.car_model.trim()) newErrors.car_model = 'مدل خودرو الزامی است.';
        if (!formState.delivery_time.trim()) newErrors.delivery_time = 'زمان تحویل الزامی است.';
        if (formState.initial_deposit <= 0) newErrors.initial_deposit = 'مبلغ پیش‌پرداخت باید بزرگتر از صفر باشد.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const colorsArray = colorsInput.split(',').map(c => c.trim()).filter(c => c);
            onSave({ ...formState, colors: colorsArray });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-slate-800">{condition ? 'ویرایش شرط فروش' : 'افزودن شرط فروش جدید'}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="car_model" className="block text-sm font-medium text-slate-700 mb-1">مدل خودرو</label>
                            <select id="car_model" value={formState.car_model} onChange={(e) => handleChange('car_model', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md bg-white ${errors.car_model ? 'border-red-500' : 'border-slate-300'}`}>
                                {CAR_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
                            </select>
                            {errors.car_model && <p className="text-red-500 text-xs mt-1">{errors.car_model}</p>}
                        </div>
                        <div>
                            <label htmlFor="model" className="block text-sm font-medium text-slate-700 mb-1">سال مدل</label>
                            <select id="model" value={formState.model} onChange={(e) => handleChange('model', parseInt(e.target.value, 10) || 0)}
                                className={`w-full px-3 py-2 border rounded-md bg-white ${errors.model ? 'border-red-500' : 'border-slate-300'}`}>
                                {MODEL_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                            {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">وضعیت</label>
                            <select id="status" value={formState.status} onChange={(e) => handleChange('status', e.target.value as ConditionStatus)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
                                {Object.values(ConditionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="sale_type" className="block text-sm font-medium text-slate-700 mb-1">نوع فروش</label>
                            <select id="sale_type" value={formState.sale_type} onChange={(e) => handleChange('sale_type', e.target.value as SaleType)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
                                {Object.values(SaleType).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="pay_type" className="block text-sm font-medium text-slate-700 mb-1">نحوه پرداخت</label>
                             <select id="pay_type" value={formState.pay_type} onChange={(e) => handleChange('pay_type', e.target.value as PayType)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
                                {Object.values(PayType).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="document_status" className="block text-sm font-medium text-slate-700 mb-1">وضعیت سند</label>
                             <select id="document_status" value={formState.document_status} onChange={(e) => handleChange('document_status', e.target.value as DocumentStatus)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
                                {Object.values(DocumentStatus).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="delivery_time" className="block text-sm font-medium text-slate-700 mb-1">زمان تحویل</label>
                            <input type="text" id="delivery_time" value={formState.delivery_time} onChange={(e) => handleChange('delivery_time', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md ${errors.delivery_time ? 'border-red-500' : 'border-slate-300'}`} />
                            {errors.delivery_time && <p className="text-red-500 text-xs mt-1">{errors.delivery_time}</p>}
                        </div>
                         <div>
                            <label htmlFor="initial_deposit" className="block text-sm font-medium text-slate-700 mb-1">مبلغ پیش‌پرداخت (تومان)</label>
                            <input type="number" id="initial_deposit" value={formState.initial_deposit} onChange={(e) => handleChange('initial_deposit', parseInt(e.target.value, 10) || 0)}
                                className={`w-full px-3 py-2 border rounded-md ${errors.initial_deposit ? 'border-red-500' : 'border-slate-300'}`} />
                            {errors.initial_deposit && <p className="text-red-500 text-xs mt-1">{errors.initial_deposit}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="colors" className="block text-sm font-medium text-slate-700 mb-1">رنگ‌ها (با ویرگول جدا کنید)</label>
                            <input type="text" id="colors" value={colorsInput} placeholder="سفید, مشکی, خاکستری..." onChange={(e) => setColorsInput(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                        </div>
                    </div>
                     <div className="md:col-span-2">
                        <label htmlFor="descriptions" className="block text-sm font-medium text-slate-700 mb-1">توضیحات</label>
                        <textarea id="descriptions" rows={3} value={formState.descriptions} onChange={(e) => handleChange('descriptions', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                    </div>

                    <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white py-4 px-6">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">انصراف</button>
                        <button type="submit" className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">ذخیره</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConditionModal;
