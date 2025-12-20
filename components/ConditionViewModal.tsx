
import React from 'react';
import type { CarSaleCondition } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface ConditionViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    condition: CarSaleCondition | null;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
    <div className={`flex flex-col p-3 rounded-lg bg-slate-50 ${className}`}>
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
);

const ConditionViewModal: React.FC<ConditionViewModalProps> = ({ isOpen, onClose, condition }) => {
    if (!isOpen || !condition) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 print:bg-transparent print:p-0">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col print:shadow-none print:max-h-full print:rounded-none">
                <header className="p-4 border-b flex justify-between items-center print:hidden">
                    <h2 className="text-lg font-bold text-slate-800">نمایش جزئیات شرایط فروش</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </header>

                <main id="printable-area" className="p-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="p-4 border border-sky-200 bg-sky-50 rounded-lg text-center relative">
                            <h3 className="text-xl font-bold text-sky-800">{condition.car_model} - {condition.model}</h3>
                            <div className="absolute top-2 left-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${condition.is_public ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {condition.is_public ? 'نمایش عمومی' : 'عدم نمایش'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <DetailItem label="وضعیت" value={condition.status} />
                            <DetailItem label="موجودی انبار" value={`${condition.stock_quantity.toLocaleString('fa-IR')} عدد`} />
                            <DetailItem label="نوع فروش" value={condition.sale_type} />
                            <DetailItem label="نحوه پرداخت" value={condition.pay_type} />
                            <DetailItem label="وضعیت سند" value={condition.document_status} />
                            <DetailItem label="زمان تحویل" value={condition.delivery_time} />
                        </div>
                        
                        <DetailItem label="رنگ‌های مجاز" value={condition.colors.join('، ')} className="bg-sky-50/50" />

                        <DetailItem 
                            label="مبلغ پیش‌پرداخت"
                            value={<><span className="font-mono text-lg">{condition.initial_deposit.toLocaleString('fa-IR')}</span> تومان</>}
                            className="text-center bg-green-50 border-green-200"
                        />
                        
                        {condition.descriptions && (
                             <div className="p-3 rounded-lg bg-slate-50">
                                <span className="text-xs text-slate-500">توضیحات</span>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{condition.descriptions}</p>
                            </div>
                        )}
                    </div>
                </main>
                
                <footer className="p-4 border-t flex justify-end gap-3 bg-slate-50 print:hidden">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">بستن</button>
                    <button type="button" onClick={handlePrint} className="px-5 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">پرینت</button>
                </footer>
            </div>
            <style>
                {`
                    @media print {
                        body > *:not(.fixed) {
                            display: none;
                        }
                        .fixed {
                            position: static;
                        }
                        #printable-area {
                            display: block;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default ConditionViewModal;
