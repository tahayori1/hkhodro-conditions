
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { CarOrder, MyProfile, CarSaleCondition, CarPriceStats } from '../types';
import { OrderStatus, SaleType } from '../types';
import { carOrdersService, getMyProfile, getConditions, updateCondition, getCarPriceStats } from '../services/api';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import CarOrderModal from '../components/CarOrderModal';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import { EditIcon } from '../components/icons/EditIcon';

// Declare moment from global scope (loaded via CDN in index.html)
declare const moment: any;

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

const PREDEFINED_DELIVERY_TIMES = [
    '۶۰ روز کاری',
    '۳۰ روز کاری',
    'احتمال تحویل زودتر ۴۵ روز',
    'احتمال تحویل زودتر ۳۰ روز'
];

const PREDEFINED_ADMIN_NOTES = [
    'قیمت پایین است',
    'مشتری مورد تایید نمی باشد',
    'مبلغ بیعانه تناسب ندارد',
    'توقف موقت فروش',
    'لطفا با من تماس بگیرید'
];

type TabType = 'DRAFT' | 'PENDING' | 'REJECTED';

const CarOrderPage: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
    const [orders, setOrders] = useState<CarOrder[]>([]);
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [priceStats, setPriceStats] = useState<CarPriceStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<CarOrder | null>(null);
    const [currentUser, setCurrentUser] = useState<MyProfile | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Tab State
    const [activeTab, setActiveTab] = useState<TabType>('DRAFT');

    // Review Form State
    const [reviewData, setReviewData] = useState({
        finalPrice: 0,
        adminNotes: '',
        deliveryDeadline: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersData, profileData, conditionsData, statsData] = await Promise.all([
                carOrdersService.getAll(),
                getMyProfile(),
                getConditions(),
                getCarPriceStats()
            ]);
            const validOrders = Array.isArray(ordersData) ? ordersData.filter(o => o && (o.id || o.status)) : [];
            setOrders(validOrders);
            setConditions(conditionsData);
            setPriceStats(statsData);
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

    // --- Price Analysis Logic for Review Modal ---
    const reviewPriceAnalysis = useMemo(() => {
        if (!selectedOrder || !conditions.length || !priceStats.length) return null;

        const cond = conditions.find(c => c.id === selectedOrder.conditionId);
        const stat = priceStats.find(s => s.model_name === selectedOrder.carName);
        const maxMarketPrice = stat ? stat.maximum : 0;
        
        // If condition or stats not found, return null or minimal
        if (!cond) return null;

        const isHavaleh = cond.sale_type === SaleType.TRANSFER;
        const isZeroMarket = cond.sale_type === SaleType.NEW_MARKET;

        let info = null;

        if (isHavaleh && maxMarketPrice > 0) {
             const h1Min = maxMarketPrice * 0.95;
             const h1Max = maxMarketPrice * 0.97;
             const h1Avg = (h1Min + h1Max) / 2;

             const h2Min = maxMarketPrice * 0.90;
             const h2Max = maxMarketPrice * 0.94;
             const h2Avg = (h2Min + h2Max) / 2;

             const warnH1 = selectedOrder.proposedPrice > 0 && selectedOrder.proposedPrice < (h1Avg * 0.98);
             const warnH2 = selectedOrder.proposedPrice > 0 && selectedOrder.proposedPrice < (h2Avg * 0.98);

             info = {
                 type: 'HAVALEH',
                 h1Range: `${Math.round(h1Min).toLocaleString('fa-IR')} تا ${Math.round(h1Max).toLocaleString('fa-IR')}`,
                 h2Range: `${Math.round(h2Min).toLocaleString('fa-IR')} تا ${Math.round(h2Max).toLocaleString('fa-IR')}`,
                 warnH1,
                 warnH2
             };
        } else if (isZeroMarket && maxMarketPrice > 0) {
             const warningThreshold = maxMarketPrice * 0.98;
             const isUnderSelling = selectedOrder.proposedPrice > 0 && selectedOrder.proposedPrice < warningThreshold;
             info = {
                 type: 'ZERO_MARKET',
                 maxLabel: 'بالاترین قیمت روز (بازار)',
                 maxValue: maxMarketPrice.toLocaleString('fa-IR'),
                 isUnderSelling
             };
        }

        return { info };
    }, [selectedOrder, conditions, priceStats]);

    // --- Filter Logic ---
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (activeTab === 'DRAFT') {
                return order.status === OrderStatus.DRAFT;
            }
            if (activeTab === 'REJECTED') {
                return order.status === OrderStatus.REJECTED;
            }
            // PENDING Tab includes all active workflows (not draft, not rejected)
            return order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.REJECTED;
        });
    }, [orders, activeTab]);

    const counts = useMemo(() => {
        const draft = orders.filter(o => o.status === OrderStatus.DRAFT).length;
        const rejected = orders.filter(o => o.status === OrderStatus.REJECTED).length;
        const pending = orders.length - draft - rejected;
        return { draft, pending, rejected };
    }, [orders]);

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
            if (selectedOrder) {
                await carOrdersService.update({
                    ...selectedOrder,
                    ...data,
                    status,
                    updatedAt: now,
                });
                setToast({ message: 'سفارش با موفقیت بروزرسانی شد', type: 'success' });
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
            // Switch to relevant tab (if rejected, moving to pending means switching tab)
            if (activeTab === 'REJECTED' && status === OrderStatus.PENDING_ADMIN) {
                setActiveTab('PENDING');
            } else if (status === OrderStatus.DRAFT) {
                setActiveTab('DRAFT');
            } else {
                setActiveTab('PENDING');
            }
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
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
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

            {/* Tabs */}
            <div className="bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl flex gap-2 mb-6 overflow-x-auto shadow-inner">
                <button 
                    onClick={() => setActiveTab('DRAFT')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'DRAFT' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    پیش‌نویس
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'DRAFT' ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>{counts.draft}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('PENDING')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'PENDING' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    در انتظار
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'PENDING' ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>{counts.pending}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('REJECTED')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'REJECTED' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    رد شده
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>{counts.rejected}</span>
                </button>
            </div>

            {loading ? <div className="flex justify-center p-20"><Spinner /></div> : (
                <div className="grid gap-6">
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                            <ClipboardListIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">موردی یافت نشد.</p>
                        </div>
                    ) : (
                        [...filteredOrders].reverse().map(order => {
                            const config = STATUS_CONFIG[order.status] || DEFAULT_STATUS_CONFIG;
                            const statusColor = config.color;
                            const sideBarColor = statusColor.split(' ')[0] || 'bg-slate-200';

                            return (
                                <div key={order.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md animate-fade-in">
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

                                            {order.status === OrderStatus.REJECTED && (
                                                <button onClick={() => handleEditDraft(order)} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 flex items-center gap-2">
                                                    <EditIcon className="w-4 h-4" /> اصلاح و ارسال مجدد
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
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-sky-100 dark:bg-sky-900 p-2 rounded-xl text-sky-600 dark:text-sky-400">
                                    <ClipboardListIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">بررسی و تایید نهایی</h3>
                                    <p className="text-xs text-slate-500 font-bold">کد رهگیری: {selectedOrder.trackingCode || '---'}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><CloseIcon /></button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                
                                {/* LEFT COLUMN: INFORMATION (Context) */}
                                <div className="space-y-6">
                                    
                                    {/* 1. Customer Info */}
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
                                        <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">اطلاعات خریدار</h4>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-lg font-black text-slate-800 dark:text-white mb-1">{selectedOrder.buyerName}</div>
                                                <div className="text-sm text-slate-500 font-mono font-bold" dir="ltr">{selectedOrder.buyerPhone}</div>
                                            </div>
                                            <div className="text-right text-xs text-slate-400">
                                                <div>کد ملی: <span className="font-mono">{selectedOrder.buyerNationalId}</span></div>
                                                <div className="mt-1">{selectedOrder.buyerCity}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Order Details */}
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500"></div>
                                        <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">مشخصات سفارش</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-slate-700 pb-2">
                                                <span className="text-sm text-slate-600 dark:text-slate-300">خودرو:</span>
                                                <span className="text-sm font-black text-slate-800 dark:text-white">{selectedOrder.carName} <span className="text-xs font-medium text-slate-400">({selectedOrder.selectedColor})</span></span>
                                            </div>
                                            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                <span className="block text-xs text-slate-400 mb-1">شرایط:</span>
                                                {selectedOrder.conditionSummary}
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl mt-2">
                                                <span className="text-xs font-bold text-slate-500">قیمت پیشنهادی کاربر:</span>
                                                <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">{selectedOrder.proposedPrice?.toLocaleString('fa-IR')} <span className="text-xs">تومان</span></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Sales Notes */}
                                    {selectedOrder.userNotes && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-5">
                                            <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                                                <span className="text-lg">💬</span>
                                                توضیحات کارشناس فروش
                                            </h4>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                                "{selectedOrder.userNotes}"
                                            </p>
                                        </div>
                                    )}
                                    
                                    {/* 4. Market Analysis (Moved to left for better flow, or keep right? Let's put Analysis on Left to compare with User Price) */}
                                    {reviewPriceAnalysis && reviewPriceAnalysis.info && (
                                        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                                            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 border-b pb-2 dark:border-slate-700">
                                                📊 تحلیل هوشمند بازار
                                            </h4>
                                            
                                            {reviewPriceAnalysis.info.type === 'HAVALEH' && (
                                                <div className="space-y-2">
                                                    <div className={`flex flex-col sm:flex-row justify-between items-center p-2 rounded ${reviewPriceAnalysis.info.warnH1 ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-300' : ''}`}>
                                                        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">حواله ۱ ماهه:</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">{reviewPriceAnalysis.info.h1Range}</span>
                                                            {reviewPriceAnalysis.info.warnH1 && <span className="font-bold text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded">⚠️ زیر قیمت</span>}
                                                        </div>
                                                    </div>
                                                    <div className={`flex flex-col sm:flex-row justify-between items-center p-2 rounded ${reviewPriceAnalysis.info.warnH2 ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-300' : ''}`}>
                                                        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">حواله ۲ ماهه:</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">{reviewPriceAnalysis.info.h2Range}</span>
                                                            {reviewPriceAnalysis.info.warnH2 && <span className="font-bold text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded">⚠️ زیر قیمت</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {reviewPriceAnalysis.info.type === 'ZERO_MARKET' && (
                                                <div>
                                                    <div className="flex justify-between mb-1 items-center">
                                                        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">{reviewPriceAnalysis.info.maxLabel}:</span>
                                                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">{reviewPriceAnalysis.info.maxValue}</span>
                                                    </div>
                                                    {reviewPriceAnalysis.info.isUnderSelling && (
                                                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded font-bold flex items-center justify-center gap-2 text-xs">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            هشدار: قیمت پیشنهادی پایین‌تر از عرف بازار است
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>

                                {/* RIGHT COLUMN: DECISION (Actions) */}
                                <div className="flex flex-col h-full">
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg flex-1">
                                        <h4 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                            <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                                            تصمیم‌گیری مدیریت
                                        </h4>

                                        <div className="space-y-6">
                                            {/* Final Price Input */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">قیمت نهایی مصوب</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        className="w-full px-4 py-3 text-xl font-black font-mono border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:bg-slate-700 dark:text-white"
                                                        value={reviewData.finalPrice || ''}
                                                        onChange={e => setReviewData({...reviewData, finalPrice: Number(e.target.value)})}
                                                        placeholder="مبلغ را وارد کنید"
                                                    />
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">تومان</div>
                                                </div>
                                                {reviewData.finalPrice > 0 && (
                                                    <div className="mt-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                                                        {numberToPersianWords(reviewData.finalPrice)} تومان
                                                    </div>
                                                )}
                                            </div>

                                            {/* Delivery Time */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">زمان تحویل</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all mb-3"
                                                    value={reviewData.deliveryDeadline}
                                                    onChange={e => setReviewData({...reviewData, deliveryDeadline: e.target.value})}
                                                    placeholder="مثلاً: ۳۰ روز کاری"
                                                />
                                                <div className="flex flex-wrap gap-2">
                                                    {PREDEFINED_DELIVERY_TIMES.map(time => (
                                                        <button 
                                                            key={time} 
                                                            onClick={() => setReviewData({...reviewData, deliveryDeadline: time})}
                                                            className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg transition-colors font-bold"
                                                        >
                                                            {time}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Admin Notes */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">توضیحات (علت رد/تایید)</label>
                                                <textarea 
                                                    rows={4} 
                                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all mb-3 resize-none"
                                                    value={reviewData.adminNotes}
                                                    onChange={e => setReviewData({...reviewData, adminNotes: e.target.value})}
                                                    placeholder="توضیحات تکمیلی برای مشتری..."
                                                ></textarea>
                                                <div className="flex flex-wrap gap-2">
                                                    {PREDEFINED_ADMIN_NOTES.map(note => (
                                                        <button 
                                                            key={note} 
                                                            onClick={() => setReviewData({...reviewData, adminNotes: note})}
                                                            className="text-[10px] border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            {note}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <button 
                                onClick={handleReject} 
                                className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-rose-100 text-rose-600 font-black rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm active:scale-95"
                            >
                                رد درخواست / ابطال
                            </button>
                            <div className="flex w-full sm:w-auto gap-3">
                                <button 
                                    onClick={() => setIsReviewModalOpen(false)} 
                                    className="flex-1 sm:flex-none px-6 py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                                >
                                    انصراف
                                </button>
                                <button 
                                    onClick={handleApprove} 
                                    className="flex-1 sm:flex-none px-8 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    تایید نهایی و کسر موجودی
                                </button>
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
