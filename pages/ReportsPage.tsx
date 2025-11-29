
import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, getCars } from '../services/api';
import type { User, Car } from '../types';
import Spinner from '../components/Spinner';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { CarIcon } from '../components/icons/CarIcon';
import { MapIcon } from '../components/icons/MapIcon';
import { MegaphoneIcon } from '../components/icons/MegaphoneIcon';

// Declare moment from global scope
declare const moment: any;

const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

type TimeRange = 'all' | 'today' | 'week' | '28days';

const ReportsPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filters
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedDay, setSelectedDay] = useState<string>('all');
    const [timeRange, setTimeRange] = useState<TimeRange>('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [usersData, carsData] = await Promise.all([
                    getUsers(),
                    getCars()
                ]);
                setUsers(usersData);
                setCars(carsData);
            } catch (err) {
                setError('خطا در دریافت اطلاعات گزارشات');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleTimeRangeChange = (range: TimeRange) => {
        setTimeRange(range);
        // Reset manual filters when using quick filters
        setSelectedMonth('all');
        setSelectedDay('all');
    };

    const handleManualFilterChange = (type: 'month' | 'day', value: string) => {
        if (type === 'month') {
            setSelectedMonth(value);
            if (value === 'all') setSelectedDay('all');
        } else {
            setSelectedDay(value);
        }
        // Reset quick filter when using manual filters
        setTimeRange('all');
    };

    // --- Filter Users based on Date ---
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const dateStr = u.RegisterTime || u.createdAt;
            if (!dateStr) return false;
            
            let m;
            try {
                // Parse as Gregorian then convert to Jalali context
                m = moment(dateStr.replace(' ', 'T')).locale('fa');
            } catch (e) {
                return false;
            }

            // 1. Quick Filters
            if (timeRange !== 'all') {
                const now = moment().locale('fa');
                
                if (timeRange === 'today') {
                    return m.isSame(now, 'day');
                }
                if (timeRange === 'week') {
                    // Last 7 days
                    const lastWeek = now.clone().subtract(6, 'days').startOf('day');
                    return m.isSameOrAfter(lastWeek);
                }
                if (timeRange === '28days') {
                    // Last 28 days
                    const last28 = now.clone().subtract(27, 'days').startOf('day');
                    return m.isSameOrAfter(last28);
                }
            }

            // 2. Manual Date Filter (Persian)
            if (selectedMonth !== 'all') {
                if (m.jMonth() !== parseInt(selectedMonth)) return false;
                if (selectedDay !== 'all') {
                    if (m.jDate() !== parseInt(selectedDay)) return false;
                }
            }

            return true;
        });
    }, [users, selectedMonth, selectedDay, timeRange]);

    // --- Process Data for Registration Trend ---
    const dailyRegistrations = useMemo(() => {
        const counts: Record<string, number> = {};
        let chartData: { date: string, label: string, count: number }[] = [];

        if (selectedMonth !== 'all') {
            // MODE: Monthly View (Show all days of the selected month)
            const monthIndex = parseInt(selectedMonth);
            const currentYear = moment().jYear();
            const daysInMonth = moment.jDaysInMonth(currentYear, monthIndex);

            for (let i = 1; i <= daysInMonth; i++) {
                counts[i] = 0;
            }

            filteredUsers.forEach(user => {
                const dateStr = user.RegisterTime || user.createdAt;
                if (!dateStr) return;
                try {
                    const m = moment(dateStr.replace(' ', 'T')).locale('fa');
                    const d = m.jDate();
                    if (counts[d] !== undefined) counts[d]++;
                } catch(e) {}
            });

            chartData = Object.keys(counts).map(day => ({
                date: day,
                label: `${day} ${PERSIAN_MONTHS[monthIndex]}`,
                count: counts[day]
            })).sort((a, b) => parseInt(a.date) - parseInt(b.date));

        } else if (timeRange === 'today') {
             // MODE: Today (Show hours?) - For now simple single bar or hourly if needed. 
             // Let's show just one bar for "Today" to keep it simple, or maybe breakdown by hour later.
             // For consistency with the chart type, let's show just the single day.
             chartData = [{
                 date: moment().format('YYYY-MM-DD'),
                 label: 'امروز',
                 count: filteredUsers.length
             }];
        } else {
            // MODE: Last N Days (Default or Week or 28 Days)
            let daysToShow = 14; // Default 'all'
            if (timeRange === 'week') daysToShow = 7;
            if (timeRange === '28days') daysToShow = 28;

            const today = new Date();
            const dates = Array.from({ length: daysToShow }, (_, i) => {
                const d = new Date();
                d.setDate(today.getDate() - ((daysToShow - 1) - i)); 
                return d.toISOString().split('T')[0];
            });

            dates.forEach(date => counts[date] = 0);

            filteredUsers.forEach(user => {
                try {
                    const dateStr = (user.RegisterTime || user.createdAt || '').replace(' ', 'T').split('T')[0];
                    if (counts[dateStr] !== undefined) counts[dateStr]++;
                } catch (e) {}
            });

            chartData = dates.map(date => {
                const label = new Intl.DateTimeFormat('fa-IR', { month: 'numeric', day: 'numeric' }).format(new Date(date));
                return { date, label, count: counts[date] };
            });
        }

        return chartData;
    }, [filteredUsers, selectedMonth, timeRange]);

    // --- Process Data for Car Demand ---
    const carDemand = useMemo(() => {
        const counts: Record<string, number> = {};
        cars.forEach(car => { counts[car.name] = 0; });
        
        filteredUsers.forEach(user => {
            const userCar = user.CarModel ? user.CarModel.trim() : '';
            if (userCar && counts.hasOwnProperty(userCar)) {
                counts[userCar]++;
            }
        });

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [filteredUsers, cars]);

    // --- Process Data for Province Distribution ---
    const provinceStats = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredUsers.forEach(user => {
            let pname = user.Province?.trim();
            if (!pname || pname === '-' || pname === 'undefined') pname = 'نامشخص';
            counts[pname] = (counts[pname] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [filteredUsers]);

    // --- Process Data for Reference (Source) Distribution ---
    const referenceStats = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredUsers.forEach(user => {
            let ref = user.reference ? user.reference.trim() : '';
            if (!ref || ref === '-' || ref === 'undefined' || ref === 'null') {
                ref = 'نامشخص';
            }
            if (ref === 'صفحه شرایط' || ref === 'صفحه خام شرایط' || ref === 'سایت') {
                ref = 'سایت و لندینگ‌پیج';
            }
            counts[ref] = (counts[ref] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [filteredUsers]);

    // --- Summary Stats ---
    const stats = useMemo(() => {
        const isFiltered = selectedMonth !== 'all' || selectedDay !== 'all' || timeRange !== 'all';
        
        const todayStr = new Date().toISOString().split('T')[0];
        let todayCount = 0;
        
        filteredUsers.forEach(user => {
             const dateStr = (user.RegisterTime || user.createdAt || '').replace(' ', 'T').split('T')[0];
             if (dateStr === todayStr) todayCount++;
        });

        const activeProvincesCount = new Set(filteredUsers.map(u => u.Province?.trim()).filter(p => p && p !== '-' && p !== 'undefined')).size;

        return {
            totalUsers: filteredUsers.length,
            todayRegistrations: todayCount,
            topCar: carDemand.length > 0 && carDemand[0].count > 0 ? carDemand[0].name : '---',
            activeProvinces: activeProvincesCount,
            isFiltered
        };
    }, [filteredUsers, carDemand, selectedMonth, selectedDay, timeRange]);

    if (loading) return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;

    const maxDaily = Math.max(...dailyRegistrations.map(d => d.count), 1);
    const maxDemand = Math.max(...carDemand.map(d => d.count), 1);
    const maxProvince = Math.max(...provinceStats.map(p => p.count), 1);
    const maxReference = Math.max(...referenceStats.map(r => r.count), 1);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-20">
            {/* Header & Filters */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl text-indigo-600 dark:text-indigo-300">
                        <ChartBarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">گزارشات و آمار</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">تحلیل داده‌های مشتریان و فروش</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center">
                    {/* Quick Filters */}
                    <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-xl flex">
                        <button 
                            onClick={() => handleTimeRangeChange('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === 'all' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                        >
                            کل
                        </button>
                        <button 
                            onClick={() => handleTimeRangeChange('today')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === 'today' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                        >
                            امروز
                        </button>
                        <button 
                            onClick={() => handleTimeRangeChange('week')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === 'week' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                        >
                            هفته
                        </button>
                        <button 
                            onClick={() => handleTimeRangeChange('28days')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === '28days' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                        >
                            ۲۸ روز
                        </button>
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                        {/* Month Filter */}
                        <div className="w-full sm:w-32">
                            <select
                                value={selectedMonth}
                                onChange={(e) => handleManualFilterChange('month', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                            >
                                <option value="all">ماه (همه)</option>
                                {PERSIAN_MONTHS.map((m, idx) => (
                                    <option key={idx} value={idx}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Day Filter */}
                        <div className="w-full sm:w-24">
                            <select
                                value={selectedDay}
                                onChange={(e) => handleManualFilterChange('day', e.target.value)}
                                disabled={selectedMonth === 'all'}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="all">روز (همه)</option>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                {stats.isFiltered ? 'تعداد در بازه انتخابی' : 'کل مشتریان'}
                            </p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white font-mono mt-1">{stats.totalUsers.toLocaleString('fa-IR')}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <UsersIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">ثبت نام امروز</p>
                            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{stats.todayRegistrations.toLocaleString('fa-IR')}</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <ChartBarIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">محبوب‌ترین خودرو</p>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mt-2 truncate">{stats.topCar}</h3>
                        </div>
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                            <CarIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">استان‌های فعال</p>
                            <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">{stats.activeProvinces.toLocaleString('fa-IR')}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                            <MapIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Daily Registrations Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 flex flex-col h-[400px]">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
                        {selectedMonth !== 'all' 
                            ? `روند ثبت نام در ${PERSIAN_MONTHS[parseInt(selectedMonth)]}` 
                            : timeRange === 'today' 
                                ? 'آمار امروز'
                                : timeRange === 'week'
                                    ? 'روند ثبت نام (هفته جاری)'
                                    : timeRange === '28days'
                                        ? 'روند ثبت نام (۲۸ روز گذشته)'
                                        : 'روند ثبت نام (۱۴ روز گذشته)'
                        }
                    </h3>
                    <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 pb-2 overflow-x-auto custom-scrollbar">
                        {dailyRegistrations.map((item, idx) => {
                            const heightPercent = Math.max((item.count / maxDaily) * 100, 4); // Min height 4%
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative min-w-[10px]">
                                    {/* Tooltip */}
                                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                                        {item.date}: {item.count.toLocaleString('fa-IR')} نفر
                                    </div>
                                    {/* Bar */}
                                    <div 
                                        className="w-full rounded-t-sm sm:rounded-t-md bg-indigo-500 dark:bg-indigo-600 opacity-80 hover:opacity-100 transition-all duration-500 ease-out"
                                        style={{ height: `${heightPercent}%` }}
                                    ></div>
                                    {/* Label */}
                                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 rotate-90 sm:rotate-45 md:rotate-0 origin-center mt-4 sm:mt-2 whitespace-nowrap">{item.label.split(' ')[0]}</span>
                                </div>
                            );
                        })}
                        {dailyRegistrations.length === 0 && <p className="text-center text-slate-400 w-full self-center">داده‌ای یافت نشد</p>}
                    </div>
                </div>

                {/* Car Demand Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 flex flex-col h-[400px]">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">میزان تقاضا (خودروهای موجود)</h3>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-4">
                            {carDemand.length === 0 ? (
                                <p className="text-center text-slate-400 mt-10">اطلاعاتی یافت نشد</p>
                            ) : (
                                carDemand.map((item, idx) => {
                                    const widthPercent = (item.count / maxDemand) * 100;
                                    return (
                                        <div key={idx} className="group">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                                                <span className="text-sm font-mono font-bold text-slate-500 dark:text-slate-400">{item.count.toLocaleString('fa-IR')}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${item.count > 0 ? 'bg-emerald-500 group-hover:bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                    style={{ width: `${Math.max(widthPercent, item.count > 0 ? 0 : 0)}%` }} 
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Province Distribution Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <MapIcon className="w-5 h-5 text-purple-600" />
                        پراکندگی جغرافیایی
                    </h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {provinceStats.length === 0 ? (
                             <p className="text-center text-slate-400 mt-10">اطلاعاتی یافت نشد</p>
                        ) : (
                            provinceStats.map((item, idx) => {
                                const percent = Math.round((item.count / stats.totalUsers) * 100) || 0;
                                const barWidth = (item.count / maxProvince) * 100;
                                
                                return (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{item.count.toLocaleString('fa-IR')}</span>
                                                <span className="text-[10px] text-slate-400">({percent}%)</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-purple-500 h-full rounded-full"
                                                style={{ width: `${barWidth}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Reference/Source Statistics Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <MegaphoneIcon className="w-5 h-5 text-orange-500" />
                        آمار مراجع ورودی
                    </h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {referenceStats.map((item, idx) => {
                            const percent = Math.round((item.count / stats.totalUsers) * 100) || 0;
                            const barWidth = (item.count / maxReference) * 100;
                            
                            return (
                                <div key={idx} className="group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{item.count.toLocaleString('fa-IR')}</span>
                                            <span className="text-[10px] text-slate-400">({percent}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-orange-500 h-full rounded-full"
                                            style={{ width: `${barWidth}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                        {referenceStats.length === 0 && (
                            <p className="text-center text-slate-400 mt-10">اطلاعاتی یافت نشد</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
