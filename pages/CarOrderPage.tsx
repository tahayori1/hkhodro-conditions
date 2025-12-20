
import React, { useState, useEffect, useCallback } from 'react';
import type { CarOrder, MyProfile, CarSaleCondition } from '../types';
import { OrderStatus } from '../types';
import { carOrdersService, getMyProfile, getConditions, updateCondition } from '../services/api';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import CarOrderModal from '../components/CarOrderModal';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import { EditIcon } from '../components/icons/EditIcon';

// Declare moment from global scope (loaded via CDN in index.html)
declare const moment: any;

const STATUS_CONFIG: Record<string, { label: string, color: string }> = {
    [OrderStatus.DRAFT]: { label: 'پیش‌نویس', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    [OrderStatus.PENDING_ADMIN]: { label: 'در انتظار تایید ادمین', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    [OrderStatus.REJECTED]: { label: 'رد شده / ابطال', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    [OrderStatus.PENDING_PAYMENT]: { label: 'منتظر پرداخت', color: 'bg-sky-100 text-sky-700 border-sky-200' },
    [OrderStatus.PENDING_FINANCE]: { label: 'تایید مالی', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    [OrderStatus.READY_FOR_DELIVERY]: { label: 'آماده تحویل', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    [OrderStatus.EXIT_PROCESS]: { label: 'در حال خروج', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    [OrderStatus.COMPLETED]: { label: 'تکمیل شده', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const DEFAULT_STATUS_CONFIG = { label: 'نامشخص', color: 'bg-slate-100 text-slate-500 border-slate-200' };

const CarOrderPage: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
    const [orders, setOrders] = useState<CarOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<CarOrder | null>(null);
    const [currentUser, setCurrentUser] = useState<MyProfile | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Review Form State
    const [reviewData, setReviewData] = useState({
        finalPrice: 0,
        adminNotes: '',
        deliveryDeadline: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersData, profileData] = await Promise.all([
                carOrdersService.getAll(),
                getMyProfile()
            ]);
            const validOrders = Array.isArray(ordersData) ? ordersData.filter(o => o && (o.id || o.status)) : [];
            setOrders(validOrders);
            if (profileData && 'id' in profileData) setCurrentUser(profileData as MyProfile);
        } catch (error) {
            setToast({ message: 'خطا در دریافت اطلاعات', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Stock Management Helpers ---

    const returnStockIfNecessary = async (order: CarOrder) => {
        // Statuses that have already subtracted from stock
        const activeStatuses = [
            OrderStatus.PENDING_PAYMENT,
            OrderStatus.PENDING_FINANCE,
            OrderStatus.READY_FOR_DELIVERY,
            OrderStatus.EXIT_PROCESS,
            OrderStatus.COMPLETED
        ];

        if (activeStatuses.includes(order.status)) {
            try {
                const allConditions = await getConditions();
                const cond = allConditions.find(c => c.id === order.conditionId);
                if (cond) {
                    await updateCondition(cond.id, {
                        ...cond,
                        stock_quantity: cond.stock_quantity + 1
                    });
                    console.log(`Stock returned for condition ${cond.id}. New stock: ${cond.stock_quantity + 1}`);
                }
            } catch (err) {
                console.error("Failed to return stock:", err);
                throw new Error("خطا در بازگرداندن موجودی به انبار");
            }
        }
    };

    const handleCreateOrUpdateOrder = async (data: any, status: OrderStatus) => {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        try {
            if (selectedOrder && selectedOrder.status === OrderStatus.DRAFT) {
                await carOrdersService.update({
                    ...selectedOrder,
                    ...data,
                    status,
                    updatedAt: now,
                });
                setToast({ message: status === OrderStatus.DRAFT ? 'پیش‌نویس بروزرسانی شد' : 'سفارش با موفقیت ثبت و ارسال شد', type: 'success' });
            } else {
                await carOrdersService.create({
                    ...data,
                    status,
                    createdBy: currentUser?.username || 'ناشناس',
                    createdAt: now,
                    updatedAt: now,
                });
                setToast({ message: status === OrderStatus.DRAFT ? 'سفارش در پیش‌نویس ذخیره شد' : 'سفارش با موفقیت ثبت و به کارتابل مدیریت ارسال شد', type: 'success' });
            }
            setIsCreateModalOpen(false);
            setSelectedOrder(null);
            fetchData();
        } catch (error) {
            setToast({ message: 'خطا در ثبت سفارش', type: 'error' });
        }
    };

    const handleOpenReview = (order: CarOrder) => {
        setSelectedOrder(order);
        setReviewData({
            finalPrice: order.proposedPrice,
            adminNotes: '',
            deliveryDeadline: ''
        });
        setIsReviewModalOpen(true);
    };

    const handleEditDraft = (order: CarOrder) => {
        setSelectedOrder(order);
        setIsCreateModalOpen(true);
    };

    const handleApprove = async () => {
        if (!selectedOrder) return;
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        
        try {
            const allConditions = await getConditions();
            const associatedCondition = allConditions.find(c => c.id === selectedOrder.conditionId);
            
            if (associatedCondition) {
                if (associatedCondition.stock_quantity <= 0) {
                    setToast({ message: 'موجودی انبار برای این بخشنامه به پایان رسیده است.', type: 'error' });
                    return;
                }
                await updateCondition(associatedCondition.id, {
                    ...associatedCondition,
                    stock_quantity: Math.max(0, associatedCondition.stock_quantity - 1)
                });
            }

            const trackingCode = `ACL-${Math.floor(100000 + Math.random() * 900000)}`;
            await carOrdersService.update({
                ...selectedOrder,
                ...reviewData,
                trackingCode,
                status: OrderStatus.PENDING_PAYMENT,
                updatedAt: now,
            });

            setToast({ message: `سفارش تایید و کد رهگیری ${trackingCode} صادر شد. موجودی کسر گردید.`, type: 'success' });
            setIsReviewModalOpen(false);
            fetchData();
        } catch (error) {
            setToast({ message: 'خطا در فرآیند تایید', type: 'error' });
        }
    };

    const handleReject = async () => {
        if (!selectedOrder) return;
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        try {
            // Return stock if it was already deducted (e.g. rejecting an already approved order)
            await returnStockIfNecessary(selectedOrder);

            await carOrdersService.update({
                ...selectedOrder,
                adminNotes: reviewData.adminNotes,
                status: OrderStatus.REJECTED,
                updatedAt: now,
            });
            setToast({ message: 'معامله رد/ابطال شد و موجودی انبار اصلاح گردید.', type: 'success' });
            setIsReviewModalOpen(false);
            fetchData();
        } catch (error) {
            setToast({ message: error instanceof Error ? error.message : 'خطا در رد سفارش', type: 'error' });
        }
    };

    const handleCancelAndReturn = async (order: CarOrder) => {
        if (!window.confirm('آیا از ابطال/مرجوع کردن این معامله و بازگرداندن خودرو به انبار اطمینان دارید؟')) return;
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        try {
            await returnStockIfNecessary(order);
            await carOrdersService.update({
                ...order,
                status: OrderStatus.REJECTED,
                updatedAt: now,
            });
            setToast({ message: 'معامله با موفقیت ابطال و واحد خودرو به انبار بازگشت.', type: 'success' });
            fetchData();
        } catch (error) {
            setToast({ message: error instanceof Error ? error.message : 'خطا در ابطال معامله', type: 'error' });
        }
    };

    const handleAction = async (order: CarOrder, nextStatus: OrderStatus) => {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        try {
            await carOrdersService.update({
                ...order,
                status: nextStatus,
                updatedAt: now,
            });
            setToast({ message: 'وضعیت سفارش به‌روزرسانی شد', type: 'success' });
            fetchData();
        } catch (error) {
            setToast({ message: 'خطا در به‌روزرسانی', type: 'error' });
        }
    };

    const handleDeleteOrder = async (id: number) => {
        const order = orders.find(o => o.id === id);
        if (!order) return;

        if (!window.confirm('آیا از حذف این سفارش اطمینان دارید؟ در صورت لزوم موجودی انبار بازگردانده می‌شود.')) return;
        
        try {
            // Return stock before deleting if the order was in an active state
            await returnStockIfNecessary(order);
            
            await carOrdersService.delete(id);
            setToast({ message: 'سفارش حذف و موجودی انبار اصلاح شد.', type: 'success' });
            fetchData();
        } catch (error) {
            setToast({ message: error instanceof Error ? error.message : 'خطا در حذف', type: 'error' });
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-sky-600 rounded-2xl text-white shadow-lg shadow-sky-200 dark:shadow-none">
                        <ClipboardListIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">سفارشات فروش خودرو</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">مدیریت چرخه فروش و موجودی انبار</p>
                    </div>
                </div>
                <button 
                    onClick={() => { setSelectedOrder(null); setIsCreateModalOpen(true); }} 
                    className="bg-sky-600 text-white px-6 py-3 rounded-xl hover:bg-sky-700 flex items-center gap-2 font-bold shadow-md transition-all active:scale-95"
                >
                    <PlusIcon className="w-5 h-5" /> ثبت سفارش جدید
                </button>
            </div>

            {loading ? <div className="flex justify-center p-20"><Spinner /></div> : (
                <div className="grid gap-6">
                    {orders.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                            <ClipboardListIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">هنوز سفارشی ثبت نشده است.</p>
                        </div>
                    ) : (
                        [...orders].reverse().map(order => {
                            const config = STATUS_CONFIG[order.status] || DEFAULT_STATUS_CONFIG;
                            const statusColor = config.color;
                            const sideBarColor = statusColor.split(' ')[0] || 'bg-slate-200';

                            return (
                                <div key={order.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
                                    <div className={`w-full md:w-2 ${sideBarColor}`}></div>
                                    
                                    <div className="p-6 flex-1">
                                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{order.carName} <span className="text-sm text-slate-400 font-medium">({order.selectedColor})</span></h3>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusColor}`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md line-clamp-1" title={order.conditionSummary}>{order.conditionSummary}</p>
                                            </div>
                                            <div className="text-left">
                                                {order.trackingCode && (
                                                    <div className="text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-900/30 px-2 py-1 rounded-md mb-2 border border-sky-100 dark:border-sky-800">
                                                        کد رهگیری: {order.trackingCode}
                                                    </div>
                                                )}
                                                <div className="font-mono text-sm text-slate-400">{order.createdAt}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                                            <div>
                                                <span className="block text-xs text-slate-400 mb-1">خریدار:</span>
                                                <span className="font-bold">{order.buyerName}</span>
                                                <span className="block text-[10px] text-slate-500 mt-0.5" dir="ltr">{order.buyerPhone}</span>
                                            </div>
                                            <div>
                                                <span className="block text-xs text-slate-400 mb-1">قیمت پیشنهادی:</span>
                                                <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{(order.proposedPrice || 0).toLocaleString('fa-IR')}</span>
                                            </div>
                                            <div>
                                                <span className="block text-xs text-slate-400 mb-1">قیمت نهایی:</span>
                                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{order.finalPrice ? order.finalPrice.toLocaleString('fa-IR') : '---'}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                            
                                            {/* Logic for returning stock on delete */}
                                            {[OrderStatus.DRAFT, OrderStatus.PENDING_ADMIN, OrderStatus.REJECTED].includes(order.status) ? (
                                                 <button onClick={() => handleDeleteOrder(order.id)} className="px-4 py-2 rounded-lg text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors">حذف قطعی</button>
                                            ) : (
                                                 <button onClick={() => handleCancelAndReturn(order)} className="px-4 py-2 rounded-lg text-sm font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors">ابطال معامله و بازگشت به انبار</button>
                                            )}

                                            {order.status === OrderStatus.DRAFT && (
                                                <button onClick={() => handleEditDraft(order)} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-700 flex items-center gap-2">
                                                    <EditIcon className="w-4 h-4" /> ویرایش و ارسال
                                                </button>
                                            )}

                                            {isAdmin && order.status === OrderStatus.PENDING_ADMIN && (
                                                <button onClick={() => handleOpenReview(order)} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-700 shadow-md">بررسی و تایید نهایی</button>
                                            )}
                                            
                                            {!isAdmin && order.status === OrderStatus.PENDING_PAYMENT && (
                                                <button onClick={() => handleAction(order, OrderStatus.PENDING_FINANCE)} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600">ثبت فیش واریزی</button>
                                            )}

                                            {isAdmin && order.status === OrderStatus.PENDING_FINANCE && (
                                                <button onClick={() => handleAction(order, OrderStatus.READY_FOR_DELIVERY)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700">تایید مالی نهایی</button>
                                            )}

                                            {order.status === OrderStatus.READY_FOR_DELIVERY && (
                                                <button onClick={() => handleAction(order, OrderStatus.EXIT_PROCESS)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700">ارسال به واحد خروج</button>
                                            )}

                                            <div className="mr-auto text-[10px] text-slate-400 flex items-center self-center">
                                                ثبت: @{order.createdBy}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isCreateModalOpen && (
                <CarOrderModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setSelectedOrder(null);
                    }} 
                    onSave={handleCreateOrUpdateOrder} 
                    username={currentUser?.username || ''}
                    editOrder={selectedOrder}
                />
            )}

            {/* Review Modal (Admin Only) */}
            {isReviewModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">بررسی و تایید نهایی سفارش</h3>
                            <button onClick={() => setIsReviewModalOpen(false)}><CloseIcon className="text-slate-500" /></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-xl text-xs space-y-2 mb-4">
                                <div className="flex justify-between"><span>درخواست کننده:</span><span className="font-bold">@{selectedOrder.createdBy}</span></div>
                                <div className="flex justify-between"><span>قیمت پیشنهادی کاربر:</span><span className="font-mono">{(selectedOrder.proposedPrice || 0).toLocaleString('fa-IR')}</span></div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">قیمت نهایی مصوب (تومان)</label>
                                <input type="number" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono text-lg font-bold" value={reviewData.finalPrice || ''} onChange={e => setReviewData({...reviewData, finalPrice: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">زمان تحویل (مثلاً ۴۵ روز)</label>
                                <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={reviewData.deliveryDeadline} onChange={e => setReviewData({...reviewData, deliveryDeadline: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">توضیحات مدیریت</label>
                                <textarea rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={reviewData.adminNotes} onChange={e => setReviewData({...reviewData, adminNotes: e.target.value})}></textarea>
                            </div>
                        </div>

                        <div className="flex justify-between gap-3 mt-8 pt-4 border-t dark:border-slate-700">
                            <button onClick={handleReject} className="px-6 py-2 bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 rounded-lg">رد درخواست / ابطال</button>
                            <div className="flex gap-3">
                                <button onClick={() => setIsReviewModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold">انصراف</button>
                                <button onClick={handleApprove} className="px-8 py-2 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 shadow-lg transition-all">تایید و کسر از انبار</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default CarOrderPage;
