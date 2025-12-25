
import React, { useState, useEffect } from 'react';
import type { ZeroCarDelivery } from '../types';
import { zeroCarDeliveryService } from '../services/api';
import { TruckIcon } from '../components/icons/TruckIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import PersianDatePicker from '../components/PersianDatePicker';

const STATUS_LABELS = {
    'VERIFICATION': 'تایید مدارک',
    'PROCESSING': 'در حال آماده‌سازی',
    'DELIVERED': 'تحویل شده'
};

const STATUS_COLORS = {
    'VERIFICATION': 'bg-yellow-100 text-yellow-800',
    'PROCESSING': 'bg-blue-100 text-blue-800',
    'DELIVERED': 'bg-green-100 text-green-800'
};

const CAR_MODELS = [
    'JAC J4', 'JAC S3', 'JAC S5', 'BAC X3PRO', 'KMC T8', 'KMC T9', 'KMC A5',
    'KMC J7', 'KMC X5', 'KMC SR3', 'KMC EAGLE', 'KMC SHADOW', 'KMC SR6'
];

const ZeroCarDeliveryPage: React.FC = () => {
    const [deliveries, setDeliveries] = useState<ZeroCarDelivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<Partial<ZeroCarDelivery>>({});
    const [activeTab, setActiveTab] = useState<1 | 2>(1);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const data = await zeroCarDeliveryService.getAll();
            setDeliveries(data);
        } catch (error) {
            setToast({ message: 'خطا در بارگذاری اطلاعات', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const handleSave = async () => {
        if (!currentRecord.customerName || !currentRecord.chassisNumber) {
            setToast({ message: 'نام مشتری و شماره شاسی الزامی است', type: 'error' });
            return;
        }

        try {
            if (currentRecord.id) {
                await zeroCarDeliveryService.update(currentRecord as ZeroCarDelivery);
                setToast({ message: 'رکورد با موفقیت ویرایش شد', type: 'success' });
            } else {
                await zeroCarDeliveryService.create({
                    ...currentRecord,
                    status: currentRecord.status || 'VERIFICATION'
                });
                setToast({ message: 'رکورد جدید ثبت شد', type: 'success' });
            }
            setIsModalOpen(false);
            fetchDeliveries();
        } catch (error) {
            setToast({ message: 'خطا در ذخیره اطلاعات', type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('آیا از حذف این رکورد اطمینان دارید؟')) {
            try {
                await zeroCarDeliveryService.delete(id);
                setToast({ message: 'حذف شد', type: 'success' });
                fetchDeliveries();
            } catch (error) {
                setToast({ message: 'خطا در حذف رکورد', type: 'error' });
            }
        }
    };

    const openModal = (record?: ZeroCarDelivery) => {
        setCurrentRecord(record || { status: 'VERIFICATION' });
        setActiveTab(1);
        setIsModalOpen(true);
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-xl text-cyan-600 dark:text-cyan-300">
                        <TruckIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">تحویل خودرو صفر</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">مدیریت تایید مدارک و فرآیند تحویل</p>
                    </div>
                </div>
                <button onClick={() => openModal()} className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center gap-2">
                    <PlusIcon /> <span className="hidden sm:inline">ثبت جدید</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Spinner /></div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                <tr>
                                    <th className="p-4">مشتری</th>
                                    <th className="p-4">خودرو</th>
                                    <th className="p-4">شاسی</th>
                                    <th className="p-4">وضعیت</th>
                                    <th className="p-4">تماس</th>
                                    <th className="p-4">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {deliveries.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-800 dark:text-slate-200">
                                        <td className="p-4 font-bold">{item.customerName}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span>{item.carModel}</span>
                                                <span className="text-xs text-slate-400">{item.color}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono">{item.chassisNumber}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${STATUS_COLORS[item.status]}`}>
                                                {STATUS_LABELS[item.status]}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono">{item.phoneNumber}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openModal(item)} className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg"><EditIcon /></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {deliveries.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400">موردی یافت نشد</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">پرونده تحویل خودرو صفر</h3>
                            <button onClick={() => setIsModalOpen(false)}><CloseIcon className="text-slate-500" /></button>
                        </div>
                        
                        {/* Tabs */}
                        <div className="flex border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <button 
                                onClick={() => setActiveTab(1)}
                                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 1 ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                ۱- تایید مدارک و سلامت خودرو
                            </button>
                            <button 
                                onClick={() => setActiveTab(2)}
                                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 2 ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                ۲- روند تحویل به مشتری
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {activeTab === 1 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">نام و نام خانوادگی</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.customerName || ''} onChange={e => setCurrentRecord({...currentRecord, customerName: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">شماره تماس</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono" dir="ltr" value={currentRecord.phoneNumber || ''} onChange={e => setCurrentRecord({...currentRecord, phoneNumber: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">نوع خودرو</label>
                                            <select className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.carModel || ''} onChange={e => setCurrentRecord({...currentRecord, carModel: e.target.value})}>
                                                <option value="">انتخاب کنید</option>
                                                {CAR_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">رنگ خودرو</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.color || ''} onChange={e => setCurrentRecord({...currentRecord, color: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">شماره شاسی</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono" dir="ltr" value={currentRecord.chassisNumber || ''} onChange={e => setCurrentRecord({...currentRecord, chassisNumber: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">شماره پلاک</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono" value={currentRecord.plateNumber || ''} onChange={e => setCurrentRecord({...currentRecord, plateNumber: e.target.value})} placeholder="مثال: ۱۱ ع ۲۲۲ ایران ۳۳" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">شماره قرارداد</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono" dir="ltr" value={currentRecord.contractNumber || ''} onChange={e => setCurrentRecord({...currentRecord, contractNumber: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">شماره سند</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono" dir="ltr" value={currentRecord.documentNumber || ''} onChange={e => setCurrentRecord({...currentRecord, documentNumber: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">تاریخ سند</label>
                                            <PersianDatePicker 
                                                value={currentRecord.documentDate || ''}
                                                onChange={date => setCurrentRecord({...currentRecord, documentDate: date})}
                                                enableTime={false}
                                                placeholder="1403/xx/xx"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">نام مالک دوم (اختیاری)</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.secondOwnerName || ''} onChange={e => setCurrentRecord({...currentRecord, secondOwnerName: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">وضعیت فعلی</label>
                                            <select className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.status || 'VERIFICATION'} onChange={e => setCurrentRecord({...currentRecord, status: e.target.value as any})}>
                                                <option value="VERIFICATION">تایید مدارک</option>
                                                <option value="PROCESSING">در حال آماده‌سازی</option>
                                                <option value="DELIVERED">تحویل شده</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400">سایر توضیحات</label>
                                        <textarea rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.verificationNotes || ''} onChange={e => setCurrentRecord({...currentRecord, verificationNotes: e.target.value})}></textarea>
                                    </div>
                                </div>
                            )}

                            {activeTab === 2 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">تاریخ و ساعت ورود خودرو</label>
                                            <PersianDatePicker 
                                                value={currentRecord.arrivalDateTime || ''}
                                                onChange={date => setCurrentRecord({...currentRecord, arrivalDateTime: date})}
                                                enableTime={true}
                                                placeholder="1403/xx/xx xx:xx"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">تاریخ و ساعت تماس با مشتری</label>
                                            <PersianDatePicker 
                                                value={currentRecord.contactDateTime || ''}
                                                onChange={date => setCurrentRecord({...currentRecord, contactDateTime: date})}
                                                enableTime={true}
                                                placeholder="1403/xx/xx xx:xx"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">تاریخ و ساعت تحویل نهایی</label>
                                            <PersianDatePicker 
                                                value={currentRecord.deliveryDateTime || ''}
                                                onChange={date => setCurrentRecord({...currentRecord, deliveryDateTime: date})}
                                                enableTime={true}
                                                placeholder="1403/xx/xx xx:xx"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">آپشن‌های نصب شده</label>
                                            <input type="text" placeholder="کفی، شیشه دودی..." className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.installedOptions || ''} onChange={e => setCurrentRecord({...currentRecord, installedOptions: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400">توضیحات تکمیلی روند تحویل</label>
                                        <textarea rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={currentRecord.deliveryNotes || ''} onChange={e => setCurrentRecord({...currentRecord, deliveryNotes: e.target.value})}></textarea>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700">انصراف</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">ذخیره تغییرات</button>
                        </div>
                    </div>
                </div>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ZeroCarDeliveryPage;
