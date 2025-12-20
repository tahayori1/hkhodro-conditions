
import React, { useState, useEffect } from 'react';
import type { CarOrder, Car, CarSaleCondition } from '../types';
import { OrderStatus } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { getCars, getConditions } from '../services/api';
import Spinner from './Spinner';

interface CarOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: Omit<CarOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'status'>, status: OrderStatus) => void;
    username: string;
    initialBuyerData?: {
        name?: string;
        phone?: string;
        city?: string;
        nationalId?: string;
        address?: string;
        postalCode?: string;
    };
    editOrder?: CarOrder | null;
}

const CarOrderModal: React.FC<CarOrderModalProps> = ({ isOpen, onClose, onSave, username, initialBuyerData, editOrder }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cars, setCars] = useState<Car[]>([]);
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [selectedConditionObj, setSelectedConditionObj] = useState<CarSaleCondition | null>(null);

    const [formData, setFormData] = useState({
        buyerName: '',
        buyerNationalId: '',
        buyerPhone: '',
        buyerCity: '',
        buyerAddress: '',
        buyerPostalCode: '',
        carName: '',
        conditionId: 0,
        conditionSummary: '',
        selectedColor: '',
        proposedPrice: 0,
        userNotes: ''
    });

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setStep(1);
            
            // 1. If we are editing an existing order (draft), load its full data
            if (editOrder) {
                setFormData({
                    buyerName: editOrder.buyerName,
                    buyerNationalId: editOrder.buyerNationalId,
                    buyerPhone: editOrder.buyerPhone,
                    buyerCity: editOrder.buyerCity,
                    buyerAddress: editOrder.buyerAddress,
                    buyerPostalCode: editOrder.buyerPostalCode,
                    carName: editOrder.carName,
                    conditionId: editOrder.conditionId,
                    conditionSummary: editOrder.conditionSummary,
                    selectedColor: editOrder.selectedColor,
                    proposedPrice: editOrder.proposedPrice,
                    userNotes: editOrder.userNotes || ''
                });
            }
            // 2. Otherwise, if initial buyer data is provided (from Customers page)
            else if (initialBuyerData) {
                setFormData(prev => ({
                    ...prev,
                    buyerName: initialBuyerData.name || prev.buyerName,
                    buyerPhone: initialBuyerData.phone || prev.buyerPhone,
                    buyerCity: initialBuyerData.city || prev.buyerCity,
                    buyerNationalId: initialBuyerData.nationalId || prev.buyerNationalId,
                    buyerAddress: initialBuyerData.address || prev.buyerAddress,
                    buyerPostalCode: initialBuyerData.postalCode || prev.buyerPostalCode,
                }));
            } else {
                // Reset
                setFormData({
                    buyerName: '',
                    buyerNationalId: '',
                    buyerPhone: '',
                    buyerCity: '',
                    buyerAddress: '',
                    buyerPostalCode: '',
                    carName: '',
                    conditionId: 0,
                    conditionSummary: '',
                    selectedColor: '',
                    proposedPrice: 0,
                    userNotes: ''
                });
            }

            Promise.all([getCars(), getConditions()])
                .then(([carsData, conditionsData]) => {
                    setCars(carsData);
                    setConditions(conditionsData);
                    
                    // If editing, find and set the condition object
                    if (editOrder) {
                        const cond = conditionsData.find(c => c.id === editOrder.conditionId);
                        if (cond) setSelectedConditionObj(cond);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, initialBuyerData, editOrder]);

    const handleNext = () => {
        // Validation for each step
        if (step === 1 && (!formData.buyerName || !formData.buyerNationalId || !formData.buyerPhone || !formData.buyerCity)) return;
        if (step === 2 && (!formData.carName || !formData.conditionId)) return;
        
        setStep(prev => prev + 1);
    };
    
    const handleBack = () => setStep(prev => prev - 1);

    const handleSelectCondition = (c: CarSaleCondition) => {
        if (c.stock_quantity <= 0) return;
        
        setSelectedConditionObj(c);
        setFormData({
            ...formData, 
            conditionId: c.id, 
            conditionSummary: `بخشنامه ${c.id}: ${c.sale_type} - ${c.pay_type} | مدل ${c.model} | تحویل ${c.delivery_time} | پیش‌پرداخت ${c.initial_deposit.toLocaleString('fa-IR')}`,
            selectedColor: c.colors.length > 0 ? c.colors[0] : '',
            proposedPrice: c.initial_deposit // Automatically pre-fill proposedPrice with initial_deposit
        });
    };

    const handleFinalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, OrderStatus.PENDING_ADMIN);
    };

    const handleSaveAsDraft = (e: React.MouseEvent) => {
        e.preventDefault();
        onSave(formData, OrderStatus.DRAFT);
    };

    if (!isOpen) return null;

    const filteredConditions = conditions.filter(c => c.car_model === formData.carName);

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                            {editOrder ? 'ویرایش سفارش فروش' : 'ثبت سفارش فروش جدید'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">گام {step} از ۳ - تکمیل چرخه فروش</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><CloseIcon className="text-slate-500" /></button>
                </div>

                <div className="p-6 overflow-y-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-20 gap-4">
                            <Spinner />
                            <p className="text-sm text-slate-400">در حال فراخوانی داده‌ها...</p>
                        </div>
                    ) : (
                        <form className="space-y-6">
                            {/* Stepper Visual */}
                            <div className="flex items-center justify-center mb-8 gap-2">
                                {[1, 2, 3].map(i => (
                                    <React.Fragment key={i}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === i ? 'bg-sky-600 text-white shadow-lg shadow-sky-200' : step > i ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            {step > i ? '✓' : i}
                                        </div>
                                        {i < 3 && <div className={`w-12 h-0.5 ${step > i ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                                    </React.Fragment>
                                ))}
                            </div>

                            {step === 1 && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 border-r-4 border-sky-500 pr-3">۱. مشخصات و نشانی خریدار</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">نام کامل خریدار</label>
                                            <input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={formData.buyerName} onChange={e => setFormData({...formData, buyerName: e.target.value})} placeholder="نام و نام خانوادگی مطابق شناسنامه" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">کد ملی</label>
                                            <input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono" value={formData.buyerNationalId} onChange={e => setFormData({...formData, buyerNationalId: e.target.value})} dir="ltr" placeholder="1234567890" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">شماره تماس</label>
                                            <input required type="tel" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono" value={formData.buyerPhone} onChange={e => setFormData({...formData, buyerPhone: e.target.value})} dir="ltr" placeholder="09170000000" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">شهر محل سکونت</label>
                                            <input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={formData.buyerCity} onChange={e => setFormData({...formData, buyerCity: e.target.value})} placeholder="مثال: شیراز" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">کد پستی</label>
                                            <input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono" value={formData.buyerPostalCode} onChange={e => setFormData({...formData, buyerPostalCode: e.target.value})} dir="ltr" placeholder="7100000000" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">آدرس کامل پستی</label>
                                            <textarea required rows={2} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={formData.buyerAddress} onChange={e => setFormData({...formData, buyerAddress: e.target.value})} placeholder="خیابان، کوچه، پلاک، واحد..."></textarea>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 border-r-4 border-sky-500 pr-3">۲. انتخاب خودرو و شرایط فروش</h4>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">خودرو</label>
                                        <select required className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all font-bold" value={formData.carName} onChange={e => setFormData({...formData, carName: e.target.value, conditionId: 0})}>
                                            <option value="">یک خودرو انتخاب کنید...</option>
                                            {cars.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    {formData.carName && (
                                        <div className="mt-4">
                                            <label className="block text-xs font-bold text-slate-500 mb-2">انتخاب بخشنامه (شرایط فروش فعال)</label>
                                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                                {filteredConditions.length === 0 ? (
                                                    <div className="p-8 text-center bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800 text-rose-600 text-sm">
                                                        متاسفانه هیچ بخشنامه فعالی برای {formData.carName} ثبت نشده است.
                                                    </div>
                                                ) : (
                                                    filteredConditions.map(c => {
                                                        const isOutOfStock = c.stock_quantity <= 0;
                                                        return (
                                                            <label key={c.id} className={`block p-4 border rounded-xl transition-all ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/20 grayscale' : 'cursor-pointer'} ${formData.conditionId === c.id ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 ring-2 ring-sky-200 dark:ring-sky-800' : !isOutOfStock ? 'hover:bg-slate-50 dark:hover:bg-slate-700' : ''}`}>
                                                                <input 
                                                                    type="radio" 
                                                                    name="condition" 
                                                                    className="hidden" 
                                                                    disabled={isOutOfStock}
                                                                    onChange={() => handleSelectCondition(c)} 
                                                                />
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-sm font-black text-slate-800 dark:text-white">
                                                                        {c.sale_type} - {c.pay_type}
                                                                        {isOutOfStock && <span className="mr-2 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full">ناموجود</span>}
                                                                    </span>
                                                                    <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-400">{c.initial_deposit.toLocaleString('fa-IR')} تومان</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                                                    <span>مدل: {c.model} | تحویل: {c.delivery_time}</span>
                                                                    <span className={`${c.stock_quantity <= 3 && !isOutOfStock ? 'text-amber-600' : ''}`}>
                                                                        موجودی انبار: {c.stock_quantity.toLocaleString('fa-IR')} عدد
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4 animate-fade-in">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 border-r-4 border-sky-500 pr-3">۳. پیکربندی و پیشنهاد مالی</h4>
                                    
                                    {/* Snapshot review */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                                        <div className="flex justify-between"><span className="text-slate-400">خریدار:</span><span className="font-bold">{formData.buyerName} ({formData.buyerCity})</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">خودرو و بخشنامه:</span><span className="font-bold text-sky-600">{formData.carName} - {selectedConditionObj?.sale_type}</span></div>
                                        <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] italic text-slate-500">
                                            {formData.conditionSummary}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">انتخاب رنگ خودرو</label>
                                            <select required className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all font-bold" value={formData.selectedColor} onChange={e => setFormData({...formData, selectedColor: e.target.value})}>
                                                {selectedConditionObj?.colors.map(color => (
                                                    <option key={color} value={color}>{color}</option>
                                                ))}
                                                {(!selectedConditionObj || selectedConditionObj.colors.length === 0) && <option value="">بدون رنگ</option>}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">قیمت پیشنهادی نهایی (تومان)</label>
                                            <input required type="number" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono text-lg font-bold" value={formData.proposedPrice || ''} onChange={e => setFormData({...formData, proposedPrice: Number(e.target.value)})} />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">توضیحات اختصاصی سفارش</label>
                                            <textarea rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={formData.userNotes} onChange={e => setFormData({...formData, userNotes: e.target.value})} placeholder="مثلاً: هدیه روی ماشین، نصب آپشن‌های خاص و..."></textarea>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                <div className="p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap justify-between items-center gap-3 rounded-b-2xl">
                    <button onClick={step === 1 ? onClose : handleBack} className="px-6 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                        {step === 1 ? 'انصراف' : 'قبلی'}
                    </button>
                    <div className="flex gap-2">
                        {step < 3 ? (
                            <button 
                                disabled={loading || (step === 1 && (!formData.buyerPhone || !formData.buyerCity)) || (step === 2 && !formData.conditionId)} 
                                onClick={handleNext} 
                                className="px-8 py-2 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 disabled:opacity-30 shadow-md transition-all"
                            >
                                گام بعد
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={handleSaveAsDraft}
                                    className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-all"
                                >
                                    ذخیره پیش‌نویس
                                </button>
                                <button 
                                    onClick={handleFinalSubmit} 
                                    className="px-8 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all"
                                >
                                    {editOrder && editOrder.status === OrderStatus.DRAFT ? 'ارسال نهایی برای ادمین' : 'ثبت نهایی'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarOrderModal;
