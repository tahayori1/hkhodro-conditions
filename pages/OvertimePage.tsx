import React, { useState, useEffect, useMemo } from 'react';
import type { OvertimeRequest, MyProfile, OvertimeStatus } from '../types';
import { overtimeService, getMyProfile } from '../services/api';
import { 
    Clock, 
    Plus, 
    Trash2, 
    Check, 
    X, 
    Search, 
    Calendar,
    HelpCircle,
    FileText,
    TrendingUp,
    Users,
    AlertCircle
} from 'lucide-react';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

declare const moment: any;

const INITIAL_OVERTIME: OvertimeRequest[] = [
    {
        id: 1,
        requesterName: 'امیررضا محمودی',
        date: '1405/03/24',
        hours: 3.5,
        reason: 'حضور فوق‌العاده جهت نهایی‌سازی گزارش‌های مالی دوره و تطابق حساب‌های معوق بابت پایان ماه',
        status: 'PENDING',
        createdAt: '1405/03/23',
    },
    {
        id: 2,
        requesterName: 'مریم اکبری',
        date: '1405/03/22',
        hours: 4.5,
        reason: 'سرپرستی امور ترخیص و خروج خودروهای مشتریان در ساعات پایانی شیفت اداری دفتر فروش',
        status: 'APPROVED',
        createdAt: '1405/03/20',
        notes: 'مورد تایید سرپرست بخش و مدیریت مالی قرار گرفت.'
    },
    {
        id: 3,
        requesterName: 'سید رضا علوی',
        date: '1405/03/20',
        hours: 2,
        reason: 'بهبود زیرساخت شبکه و پشتیبان‌گیری دوره‌ای سیستم‌های اتوماسیون اداری هلدینگ حسینی خودرو',
        status: 'REJECTED',
        createdAt: '1405/03/19',
        notes: 'با عرض پوزش، به دلیل هماهنگ نکردن مکتوب با مدیر بخش انفورماتیک قبل از انجام کار امکانپذیر نیست.'
    },
    {
        id: 4,
        requesterName: 'محمد رضایی',
        date: '1405/03/18',
        hours: 6,
        reason: 'هماهنگی و آماده‌سازی غرفه نمایشگاهی نمایندگی فروش تهران بابت رویداد بزرگ فردا',
        status: 'APPROVED',
        createdAt: '1405/03/15',
        notes: 'توسط مدیریت فروش نمایندگی تایید و منظور شد.'
    },
];

const OvertimePage: React.FC = () => {
    const [requests, setRequests] = useState<OvertimeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdminNotesModalOpen, setIsAdminNotesModalOpen] = useState(false);
    const [selectedRequestForReview, setSelectedRequestForReview] = useState<OvertimeRequest | null>(null);
    const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
    const [adminNotesText, setAdminNotesText] = useState('');

    // Form inputs
    const [formData, setFormData] = useState({
        date: '',
        hours: '',
        reason: ''
    });

    const [currentUserProfile, setCurrentUserProfile] = useState<Partial<MyProfile>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Filters and sub-tabs
    const [viewMode, setViewMode] = useState<'MY_REQUESTS' | 'ALL_REQUESTS'>('MY_REQUESTS');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch and sync data
    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Profile
            const profile = await getMyProfile() as MyProfile;
            setCurrentUserProfile(profile);
            
            if (profile.isAdmin === 1) {
                setViewMode('ALL_REQUESTS');
            } else {
                setViewMode('MY_REQUESTS');
            }

            // Overtime requests
            try {
                const apiData = await overtimeService.getAll();
                if (apiData && apiData.length > 0) {
                    setRequests(apiData);
                } else {
                    // Try to load from localStorage or use initial templates
                    const saved = localStorage.getItem('crm_overtime_requests');
                    if (saved) {
                        try {
                            setRequests(JSON.parse(saved));
                        } catch (e) {
                            setRequests(INITIAL_OVERTIME);
                        }
                    } else {
                        setRequests(INITIAL_OVERTIME);
                        localStorage.setItem('crm_overtime_requests', JSON.stringify(INITIAL_OVERTIME));
                    }
                }
            } catch (err) {
                // Network fail: use localstorage
                const saved = localStorage.getItem('crm_overtime_requests');
                if (saved) {
                    try {
                        setRequests(JSON.parse(saved));
                    } catch (e) {
                        setRequests(INITIAL_OVERTIME);
                    }
                } else {
                    setRequests(INITIAL_OVERTIME);
                }
            }
        } catch (error) {
            setToast({ message: 'خطا در بارگذاری اولیه اطلاعات اضافه کاری', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Save local cache whenever requests change
    const updateInternalState = (updater: (prev: OvertimeRequest[]) => OvertimeRequest[]) => {
        setRequests(prev => {
            const next = updater(prev);
            localStorage.setItem('crm_overtime_requests', JSON.stringify(next));
            return next;
        });
    };

    // Set Default date to today in Persian
    useEffect(() => {
        if (isModalOpen) {
            let pDate = '1405/03/25';
            try {
                if (typeof moment !== 'undefined') {
                    pDate = moment().locale('fa').format('jYYYY/jMM/jDD');
                }
            } catch (e) {}
            
            setFormData({
                date: pDate,
                hours: '',
                reason: ''
            });
        }
    }, [isModalOpen]);

    // Format hours (ensure valid decimal number)
    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allows numbers and a single optional decimal point
        if (/^\d*\.?\d*$/.test(val)) {
            setFormData(prev => ({ ...prev, hours: val }));
        }
    };

    // Save Overtime Request
    const handleSaveRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const rawHours = parseFloat(formData.hours);
        if (isNaN(rawHours) || rawHours <= 0 || rawHours > 24) {
            setToast({ message: 'لطفاً میزان ساعات معتبری بین ۰.۵ تا ۲۴ وارد کنید.', type: 'error' });
            return;
        }

        if (!formData.date.trim() || !formData.reason.trim()) {
            setToast({ message: 'لطفاً تمامی فیلدهای الزامی را تکمیل کنید.', type: 'error' });
            return;
        }

        let currentDateStr = '1405/03/25';
        try {
            if (typeof moment !== 'undefined') {
                currentDateStr = moment().locale('fa').format('jYYYY/jMM/jDD');
            }
        } catch (e) {}

        const newRequest: OvertimeRequest = {
            id: Date.now(),
            requesterName: currentUserProfile.full_name || 'کاربر سیستم',
            hours: rawHours,
            date: formData.date.trim(),
            reason: formData.reason.trim(),
            status: 'PENDING',
            createdAt: currentDateStr
        };

        try {
            // Attempt API call
            await overtimeService.create(newRequest);
            setToast({ message: 'درخواست اضافه کاری جدید با موفقیت در سامانه ابلاغ شد.', type: 'success' });
        } catch (apiError) {
            // Local fallback success
            setToast({ message: 'درخواست اضافه کاری جدید به صورت محلی ثبت شد.', type: 'success' });
        }

        updateInternalState(prev => [newRequest, ...prev]);
        setIsModalOpen(false);
    };

    // Delete request
    const handleDeleteRequest = async (id: number) => {
        if (window.confirm('آیا مایل به حذف و ابطال قطعی این درخواست اضافه کاری هستید؟')) {
            try {
                await overtimeService.delete(id);
                setToast({ message: 'درخواست اضافه کاری با موفقیت ابطال و حذف شد.', type: 'success' });
            } catch (err) {
                setToast({ message: 'درخواست اضافه کاری از روی حافظه محلی حذف شد.', type: 'success' });
            }
            updateInternalState(prev => prev.filter(req => req.id !== id));
        }
    };

    // Admin Review action triggers
    const openReviewModal = (request: OvertimeRequest, action: 'APPROVE' | 'REJECT') => {
        setSelectedRequestForReview(request);
        setReviewAction(action);
        setAdminNotesText('');
        setIsAdminNotesModalOpen(true);
    };

    const handleConfirmReview = async () => {
        if (!selectedRequestForReview) return;

        const updatedRequest: OvertimeRequest = {
            ...selectedRequestForReview,
            status: reviewAction === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            notes: adminNotesText.trim() || undefined
        };

        try {
            await overtimeService.update(updatedRequest);
            setToast({ 
                message: reviewAction === 'APPROVE' ? 'درخواست اضافه کاری مورد تایید رسمی قرار گرفت.' : 'درخواست به عنوان مورد غیرتایید بازنشانی شد.', 
                type: 'success' 
            });
        } catch (err) {
            setToast({ 
                message: 'تغییر وضعیت اضافه کاری روی دیتابیس محلی ذخیره شد.', 
                type: 'success' 
            });
        }

        updateInternalState(prev => prev.map(req => {
            if (req.id === selectedRequestForReview.id) {
                return updatedRequest;
            }
            return req;
        }));

        setIsAdminNotesModalOpen(false);
        setSelectedRequestForReview(null);
    };

    // Statistics Calculations
    const stats = useMemo(() => {
        const totalCount = requests.length;
        const myRequestsCount = requests.filter(r => r.requesterName === currentUserProfile.full_name).length;
        const pendingCount = requests.filter(r => r.status === 'PENDING').length;
        const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
        
        const totalApprovedHours = requests
            .filter(r => r.status === 'APPROVED')
            .reduce((sum, r) => sum + r.hours, 0);

        const totalPendingHours = requests
            .filter(r => r.status === 'PENDING')
            .reduce((sum, r) => sum + r.hours, 0);

        return {
            totalCount,
            myRequestsCount,
            pendingCount,
            approvedCount,
            totalApprovedHours,
            totalPendingHours
        };
    }, [requests, currentUserProfile]);

    // Filtering logic
    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            // View Mode
            if (viewMode === 'MY_REQUESTS') {
                if (req.requesterName !== currentUserProfile.full_name) return false;
            }

            // Status Filter
            if (statusFilter === 'PENDING' && req.status !== 'PENDING') return false;
            if (statusFilter === 'APPROVED' && req.status !== 'APPROVED') return false;
            if (statusFilter === 'REJECTED' && req.status !== 'REJECTED') return false;

            // Search query filter
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                return (
                    req.requesterName.toLowerCase().includes(q) ||
                    req.reason.toLowerCase().includes(q) ||
                    (req.notes && req.notes.toLowerCase().includes(q)) ||
                    req.hours.toString().includes(q)
                );
            }

            return true;
        });
    }, [requests, viewMode, statusFilter, searchQuery, currentUserProfile]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col space-y-6 animate-fade-in">
            {/* Header Area */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-950 rounded-2xl text-indigo-600 dark:text-indigo-300">
                        <Clock className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white font-extrabold flex items-center gap-2">
                          <span>درخواست‌ها و گزارشات اضافه کاری</span>
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full font-bold">اتوماسیون پرسنلی</span>
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">سامانه متمرکز ثبت، تایید و پیگیری اضافه کاری ها و کارکردهای مازاد بر شیفت رسمی شرکت</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>ثبت درخواست اضافه کاری جدید</span>
                </button>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block mb-1">جمع ساعات تایید شده</span>
                        <h4 className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {stats.totalApprovedHours.toLocaleString('fa-IR')} <span className="text-[10px] font-bold">ساعت</span>
                        </h4>
                    </div>
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <Check className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block mb-1">در دست بررسی فعلی</span>
                        <h4 className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                            {stats.totalPendingHours.toLocaleString('fa-IR')} <span className="text-[10px] font-bold">ساعت</span>
                        </h4>
                    </div>
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block mb-1">کل درخواست‌ها</span>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white font-mono">
                            {stats.totalCount.toLocaleString('fa-IR')} <span className="text-xs text-slate-400">مورد</span>
                        </h4>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-500 rounded-lg">
                        <FileText className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block mb-1">موارد ثبت شده من</span>
                        <h4 className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                            {stats.myRequestsCount.toLocaleString('fa-IR')} <span className="text-xs text-slate-400">مورد</span>
                        </h4>
                    </div>
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Users className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* List & Filters Container */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-5">
                {/* Visual Header Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-1 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('MY_REQUESTS')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                viewMode === 'MY_REQUESTS'
                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow font-black'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                        >
                            کارنامه اضافه کاری من
                        </button>
                        {currentUserProfile.isAdmin === 1 && (
                            <button
                                onClick={() => setViewMode('ALL_REQUESTS')}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                    viewMode === 'ALL_REQUESTS'
                                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow font-black'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                                }`}
                            >
                                کل درخواست‌ها (پنل اداری و مالی)
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {[
                            { id: 'ALL', label: 'همه موارد' },
                            { id: 'PENDING', label: '⏳ در انتظار تایید' },
                            { id: 'APPROVED', label: '✅ تایید شده' },
                            { id: 'REJECTED', label: '❌ رد شده' }
                        ].map(st => (
                            <button
                                key={st.id}
                                onClick={() => setStatusFilter(st.id as any)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    statusFilter === st.id
                                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/10'
                                        : 'bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Live Search bar */}
                <div className="relative">
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="جستجو در شرح اضافه کاری‌ها بر اساس نام پرسنل، علت یا ساعات مندرج..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pr-9 pl-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 font-bold"
                    />
                </div>

                {/* Table Data */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Spinner />
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                        <table className="w-full text-right border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                                    {viewMode === 'ALL_REQUESTS' && <th className="p-4">پرسنل متقاضی</th>}
                                    <th className="p-4">تاریخ اضافه کاری</th>
                                    <th className="p-4">میزان کارکرد (ساعت)</th>
                                    <th className="p-4">علت حضور و توجیه عملیاتی</th>
                                    <th className="p-4">تاریخ ثبت سیستم</th>
                                    <th className="p-4">وضعیت سیستمی</th>
                                    <th className="p-4">یادداشت اداری / ابلاغیه</th>
                                    <th className="p-4 text-center">اقدام اداری</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                {filteredRequests.map(req => {
                                    const isPending = req.status === 'PENDING';
                                    const isOwner = req.requesterName === currentUserProfile.full_name;
                                    const isAdmin = currentUserProfile.isAdmin === 1;

                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                            {viewMode === 'ALL_REQUESTS' && (
                                                <td className="p-4 font-bold text-slate-800 dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold leading-none text-[11px]">
                                                            {req.requesterName.charAt(0)}
                                                        </div>
                                                        <span>{req.requesterName}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{req.date}</td>
                                            <td className="p-4 font-bold font-mono text-indigo-700 dark:text-indigo-400">
                                                {req.hours.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-slate-400">ساعت</span>
                                            </td>
                                            <td className="p-4 max-w-sm">
                                                <p className="line-clamp-2 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed" title={req.reason}>
                                                    {req.reason}
                                                </p>
                                            </td>
                                            <td className="p-4 font-mono text-slate-400">{req.createdAt}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    req.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-990/25 text-emerald-600 dark:text-emerald-400' :
                                                    req.status === 'REJECTED' ? 'bg-rose-50 dark:bg-rose-990/25 text-rose-600 dark:text-rose-400' :
                                                    'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        req.status === 'APPROVED' ? 'bg-emerald-500' :
                                                        req.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                                                    }`} />
                                                    {req.status === 'APPROVED' ? 'تایید شده' : req.status === 'REJECTED' ? 'رد شده' : 'در انتظار بررسی'}
                                                </span>
                                            </td>
                                            <td className="p-4 max-w-xs">
                                                {req.notes ? (
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 border-r-2 border-slate-200 dark:border-slate-700 pr-2 italic line-clamp-2">
                                                        {req.notes}
                                                    </p>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 font-light">---</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* Admin verification action keys */}
                                                    {isAdmin && viewMode === 'ALL_REQUESTS' && isPending && (
                                                        <>
                                                            <button
                                                                onClick={() => openReviewModal(req, 'APPROVE')}
                                                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded text-[10px] flex items-center gap-1 transition-all"
                                                                title="تایید عملکرد"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                                تایید
                                                            </button>
                                                            <button
                                                                onClick={() => openReviewModal(req, 'REJECT')}
                                                                className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded text-[10px] flex items-center gap-1 transition-all"
                                                                title="عدم تایید"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                                عدم تایید
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Delete option - owners can delete pending, admin can delete any */}
                                                    {(isAdmin || (isOwner && isPending)) ? (
                                                        <button
                                                            onClick={() => handleDeleteRequest(req.id)}
                                                            className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                                                            title="حذف درخواست"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 dark:text-slate-600">غیرقابل حذف</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredRequests.length === 0 && (
                                    <tr>
                                        <td colSpan={viewMode === 'ALL_REQUESTS' ? 8 : 7} className="p-12 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/10">
                                            <AlertCircle className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
                                            <p className="text-sm font-bold">هیچ رکورد اضافه کار منطبقی بر پایه فیلترهای گزینش شده یافت نگردید.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Overtime Request Dialog */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4.5 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-100" />
                                <h3 className="font-extrabold text-sm">ثبت برگه جدید درخواست اضافه کاری</h3>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveRequest} className="p-6 space-y-4">
                            {/* LOCKED REQUESTER PROFILE NAME */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">نام و نام خانوادگی توجیه کادر اداری</label>
                                <input
                                    type="text"
                                    value={currentUserProfile.full_name || 'کاربر سیستم'}
                                    disabled
                                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 font-bold dark:disabled:text-slate-400"
                                />
                            </div>

                            {/* Overtime Target Date */}
                            <div>
                                <label htmlFor="ot-date-input" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تاریخ انجام کارکرد (جلالی)</label>
                                <div className="relative">
                                    <input
                                        id="ot-date-input"
                                        type="text"
                                        value={formData.date}
                                        onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                        placeholder="مثال: 1405/03/24"
                                        className="w-full pr-10 pl-3 py-2 text-xs font-bold font-mono text-left bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                        required
                                        dir="ltr"
                                    />
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                    </span>
                                </div>
                            </div>

                            {/* Hours Input */}
                            <div>
                                <label htmlFor="ot-hours-input" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">میزان کارکرد مورد نیاز (ساعت)</label>
                                <div className="relative">
                                    <input
                                        id="ot-hours-input"
                                        type="text"
                                        value={formData.hours}
                                        onChange={handleHoursChange}
                                        placeholder="مثال: 3.5 یا 4"
                                        className="w-full pr-10 pl-3 py-2.5 text-xs font-bold font-mono text-left bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                        required
                                        dir="ltr"
                                    />
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 font-bold text-[10px]">
                                        H
                                    </span>
                                </div>
                            </div>

                            {/* Reason for Overtime */}
                            <div>
                                <label htmlFor="ot-reason-textarea" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">شرح ماموریت / علت حضور فوق‌العاده</label>
                                <textarea
                                    id="ot-reason-textarea"
                                    rows={3}
                                    value={formData.reason}
                                    onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                                    placeholder="شرح کامل علت ضرورت و اقدامات صورت گرفته در بازه مازاد اداری را بنویسید..."
                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                    required
                                />
                            </div>

                            {/* Submit Row */}
                            <div className="flex gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                                >
                                    ارسال درخواست جهت بررسی
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-xs rounded-xl transition-all"
                                >
                                    برگشت
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Verification Modal */}
            {isAdminNotesModalOpen && selectedRequestForReview && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        
                        <div className={`px-6 py-4 text-white flex justify-between items-center ${reviewAction === 'APPROVE' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                            <h3 className="font-extrabold text-sm flex items-center gap-2">
                                {reviewAction === 'APPROVE' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                <span>ارزیابی نهایی درخواست اضافه کاری {selectedRequestForReview.requesterName}</span>
                            </h3>
                            <button
                                onClick={() => setIsAdminNotesModalOpen(false)}
                                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                                <p className="mb-1"><span className="font-bold">متقاضی اضافه کاری:</span> {selectedRequestForReview.requesterName}</p>
                                <p className="mb-1"><span className="font-bold">میزان کارکرد:</span> {selectedRequestForReview.hours} ساعت</p>
                                <p className="mb-1"><span className="font-bold">تاریخ کارکرد:</span> {selectedRequestForReview.date}</p>
                                <p><span className="font-bold">علت متقاضی:</span> {selectedRequestForReview.reason}</p>
                            </div>

                            <div>
                                <label htmlFor="ot-admin-notes" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                                    پیوست یادداشت سرپرست / ابلاغیه مالی و اداری (اختیاری)
                                </label>
                                <textarea
                                    id="ot-admin-notes"
                                    rows={3}
                                    value={adminNotesText}
                                    onChange={e => setAdminNotesText(e.target.value)}
                                    placeholder="یادداشت، تذکر، شرح دستور یا دلایل عدم تایید را بنویسید..."
                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                />
                            </div>

                            <div className="flex gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={handleConfirmReview}
                                    className={`flex-1 py-2.5 px-4 text-white font-bold text-xs rounded-xl transition-all shadow-sm ${
                                        reviewAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    {reviewAction === 'APPROVE' ? 'تایید نهایی و محاسبه در کارکرد' : 'رد قطعی درخواست اضافه کاری'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAdminNotesModalOpen(false)}
                                    className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-xs rounded-xl transition-all"
                                >
                                    انصراف
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

export default OvertimePage;
