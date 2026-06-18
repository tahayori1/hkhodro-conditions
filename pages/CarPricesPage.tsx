
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getScrapedCarPrices, getScrapedCarPriceSources, getCarPriceStats, getCustomPrices, createCustomPrice } from '../services/api';
import type { ScrapedCarPrice, CarPriceSource, CarPriceStats, CustomCarPrice } from '../types';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import { SortIcon } from '../components/icons/SortIcon';
import { CopyIcon } from '../components/icons/CopyIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import CarPriceCopySettingsModal from '../components/CarPriceCopySettingsModal';
import ManualCarPriceModal, { ManualCarPrice } from '../components/ManualCarPriceModal';
import { Sliders } from 'lucide-react';

const timeAgo = (dateString: string): string => {
    try {
        // API returns UTC in 'YYYY-MM-DD HH:MM:SS' format.
        // We parse it manually as UTC to avoid browser inconsistencies with `new Date(string)`.
        const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
        if (!parts) return dateString;

        const [_, year, month, day, hour, minute, second] = parts.map(Number);
        // Date.UTC expects month to be 0-indexed.
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

        if (isNaN(date.getTime())) return dateString;
        
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'همین الان';
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return new Intl.RelativeTimeFormat('fa-IR').format(-minutes, 'minute');

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return new Intl.RelativeTimeFormat('fa-IR').format(-hours, 'hour');

        const days = Math.floor(hours / 24);
        return new Intl.RelativeTimeFormat('fa-IR').format(-days, 'day');

    } catch(e) {
        return dateString;
    }
};

type TableRow = { 
    model_name: string;
    minPrice: number;
    maxPrice: number;
    [source: string]: number | string; 
};

interface CarPricesPageProps {}

const CarPricesPage: React.FC<CarPricesPageProps> = () => {
    const [prices, setPrices] = useState<ScrapedCarPrice[]>([]);
    const [sources, setSources] = useState<string[]>([]);
    const [priceStats, setPriceStats] = useState<CarPriceStats[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'model_name', direction: 'ascending' });
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Copy Modal State
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

    // Manual Pricing States
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualPrices, setManualPrices] = useState<ManualCarPrice[]>(() => {
        const saved = localStorage.getItem('crm_manual_car_prices');
        return saved ? JSON.parse(saved) : [];
    });
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleSaveManualPrice = async (modelName: string, priceRial: number) => {
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const priceText = `${priceRial.toLocaleString('fa-IR')} ریال`;
        
        try {
            await createCustomPrice({
                source_name: 'custom',
                model_name: modelName,
                price_rial: priceRial,
                price_text: priceText,
                captured_at: now
            });
            showToast(`قیمت دستی خودروی ${modelName} با موفقیت در سرور ثبت شد`, 'success');
        } catch (err) {
            console.error(err);
            showToast(`خطا در ثبت روی سرور؛ به صورت محلی ذخیره شد.`, 'error');
        }

        setManualPrices(prev => {
            const existingIndex = prev.findIndex(p => p.model_name === modelName);
            const updated = [...prev];
            
            if (existingIndex !== -1) {
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    price_rial: priceRial,
                    updated_at: now
                };
            } else {
                updated.push({
                    id: Math.random().toString(36).substring(2, 9),
                    model_name: modelName,
                    price_rial: priceRial,
                    updated_at: now
                });
            }
            localStorage.setItem('crm_manual_car_prices', JSON.stringify(updated));
            return updated;
        });
    };

    const handleDeleteManualPrice = (id: string) => {
        setManualPrices(prev => {
            const item = prev.find(p => p.id === id);
            const updated = prev.filter(p => p.id !== id);
            localStorage.setItem('crm_manual_car_prices', JSON.stringify(updated));
            if (item) {
                showToast(`قیمت دستی برای ${item.model_name} برداشته شد`, 'success');
            }
            return updated;
        });
    };

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [pricesData, sourcesData, statsData, customPricesData] = await Promise.all([
                getScrapedCarPrices(),
                getScrapedCarPriceSources(),
                getCarPriceStats(),
                getCustomPrices().catch(err => {
                    console.error("Failed to fetch custom prices:", err);
                    return [];
                })
            ]);
            
            const mappedManualPrices: ManualCarPrice[] = (customPricesData || []).map((cp, idx) => ({
                id: cp.id?.toString() || `manual-${idx}`,
                model_name: cp.model_name,
                price_rial: cp.price_rial,
                updated_at: cp.captured_at
            }));

            if (mappedManualPrices.length > 0) {
                setManualPrices(mappedManualPrices);
                localStorage.setItem('crm_manual_car_prices', JSON.stringify(mappedManualPrices));
            } else {
                const saved = localStorage.getItem('crm_manual_car_prices');
                if (saved) {
                    setManualPrices(JSON.parse(saved));
                }
            }

            const latestPrices = new Map<string, ScrapedCarPrice>();
            pricesData.forEach(price => {
                const key = `${price.model_name}-${price.source_name}`;
                const existing = latestPrices.get(key);
                const priceDate = new Date(price.captured_at.replace(' ', 'T') + 'Z');
                if (!existing || priceDate > new Date(existing.captured_at.replace(' ', 'T') + 'Z')) {
                    latestPrices.set(key, price);
                }
            });

            const uniquePrices = Array.from(latestPrices.values());
            setPrices(uniquePrices);
            setSources(sourcesData.map((s: CarPriceSource) => s.source_name).sort());
            setPriceStats(statsData.sort((a, b) => b.maximum - a.maximum));

            if (uniquePrices.length > 0) {
                 const mostRecentDateString = uniquePrices.reduce((latest, current) => {
                    const latestDate = new Date(latest.captured_at.replace(' ', 'T') + 'Z');
                    const currentDate = new Date(current.captured_at.replace(' ', 'T') + 'Z');
                    return currentDate > latestDate ? current : latest;
                }).captured_at;
                
                setLastUpdated(mostRecentDateString);
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const mergedPrices = useMemo(() => {
        const manualScrapedFormat: ScrapedCarPrice[] = manualPrices.map((mp, index) => ({
            id: -(index + 1000),
            source_name: 'قیمت دستی',
            model_name: mp.model_name,
            price_text: mp.price_rial.toLocaleString('fa-IR'),
            price_rial: mp.price_rial,
            status: 'manual',
            captured_at: mp.updated_at
        }));
        return [...prices, ...manualScrapedFormat];
    }, [prices, manualPrices]);

    const orderedSources = useMemo(() => {
        const otherSources = sources.filter(s => s !== 'قیمت دستی');
        const hasManual = manualPrices.length > 0;
        return hasManual ? ['قیمت دستی', ...otherSources] : otherSources;
    }, [sources, manualPrices]);

    const mergedPriceStats = useMemo(() => {
        const updatedStats = [...priceStats];
        
        manualPrices.forEach(mp => {
            const existingIndex = updatedStats.findIndex(s => s.model_name === mp.model_name);
            
            if (existingIndex !== -1) {
                updatedStats[existingIndex] = {
                    ...updatedStats[existingIndex],
                    maximum: mp.price_rial,
                    average: mp.price_rial,
                    minimum: Math.min(updatedStats[existingIndex].minimum, mp.price_rial),
                    isManual: true as any
                };
            } else {
                updatedStats.push({
                    id: Math.floor(Math.random() * -100000),
                    model_name: mp.model_name,
                    minimum: mp.price_rial,
                    maximum: mp.price_rial,
                    average: mp.price_rial,
                    computed_at: mp.updated_at,
                    isManual: true as any
                });
            }
        });

        return updatedStats.sort((a, b) => {
            const aIsManual = (a as any).isManual ? 1 : 0;
            const bIsManual = (b as any).isManual ? 1 : 0;
            if (aIsManual !== bIsManual) {
                return bIsManual - aIsManual;
            }
            return b.maximum - a.maximum;
        });
    }, [priceStats, manualPrices]);

    const tableData = useMemo((): TableRow[] => {
        const groupedByModel = mergedPrices.reduce((acc, price) => {
            if (!acc[price.model_name]) {
                acc[price.model_name] = {};
            }
            acc[price.model_name][price.source_name] = price.price_rial;
            return acc;
        }, {} as Record<string, Record<string, number>>);

        return Object.entries(groupedByModel).map(([model_name, sourcePrices]) => {
            const numericPrices = Object.values(sourcePrices).filter(p => p > 0);
            
            const row: Partial<TableRow> = { 
                model_name,
                minPrice: numericPrices.length > 0 ? Math.min(...numericPrices) : 0,
                maxPrice: numericPrices.length > 0 ? Math.max(...numericPrices) : 0,
            };

            orderedSources.forEach(source => {
                row[source] = sourcePrices[source] ?? 0;
            });
            return row as TableRow;
        });
    }, [mergedPrices, orderedSources]);

    const sortedTableData = useMemo(() => {
        if (!sortConfig.key) return tableData;

        return [...tableData].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                if (aValue === 0 && bValue > 0) return 1;
                if (bValue === 0 && aValue > 0) return -1;
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            }
            
            const aStr = String(aValue);
            const bStr = String(bValue);

            const comparison = aStr.localeCompare(bStr, 'fa-IR');
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }, [tableData, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const handleCopyStatsClick = () => {
        if (mergedPriceStats.length === 0) {
            showToast('آماری برای کپی کردن وجود ندارد', 'error');
            return;
        }
        setIsCopyModalOpen(true);
    };

    const SortableHeader: React.FC<{ title: string; sortKey: string; className?: string }> = ({ title, sortKey, className='' }) => {
        const isSorted = sortConfig?.key === sortKey;
        const direction = isSorted ? sortConfig.direction : 'none';

        return (
            <th scope="col" className={`px-4 py-3 sticky top-0 bg-slate-100 z-10 ${className}`}>
                <button
                    className="flex items-center gap-1 uppercase font-bold text-xs text-slate-700 group whitespace-nowrap"
                    onClick={() => handleSort(sortKey)}
                >
                    {title}
                    <SortIcon direction={direction} />
                </button>
            </th>
        );
    };

    const renderPriceStats = () => (
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                 <div>
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">آمار خلاصه قیمت‌ها</h2>
                    {lastUpdated && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">آخرین بروزرسانی: {timeAgo(lastUpdated)}</p>}
                 </div>
                 <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                     <button 
                        onClick={() => setIsManualModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-lg transition-colors shadow-sm"
                     >
                        <Sliders className="w-3.5 h-3.5" />
                        ثبت و مدیریت قیمت‌های دستی
                     </button>
                     <button 
                        onClick={handleCopyStatsClick}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                        disabled={loading || !!error || mergedPriceStats.length === 0}
                     >
                        <CopyIcon />
                        کپی آمار
                     </button>
                 </div>
            </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                * بیشترین نرخ معامله برابر با قیمت + ۲٪ است. قیمت‌های اعلامی دستی دفتر مرکزی در صدر قرار دارند.
            </p>
            {loading ? (
                <div className="flex justify-center items-center h-40 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <Spinner />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mergedPriceStats.map(stat => {
                        const manualPrice = manualPrices.find(mp => mp.model_name === stat.model_name);
                        const isManual = !!manualPrice;
                        
                        // If manual exists, base maximum on manual price, otherwise original computed maximum
                        const basePrice = isManual ? manualPrice.price_rial : stat.maximum;
                        
                        // Change: Highest limit is now +2% instead of +7%
                        const highestLimit = basePrice * 1.02;
                        
                        // Havaleh Calculations
                        // 1 Month: Max - 5% (Min), Max - 3% (Max)
                        const havaleh1Min = basePrice * 0.95; 
                        const havaleh1Max = basePrice * 0.97;

                        // 2 Month: Max - 10% (Min), Max - 6% (Max)
                        const havaleh2Min = basePrice * 0.90;
                        const havaleh2Max = basePrice * 0.94;

                        const otherPricesForModel = prices.filter(p => p.model_name === stat.model_name && p.source_name !== 'قیمت دستی');
                        const isExpanded = !!expandedCards[stat.model_name];

                        return (
                        <div 
                            key={stat.id} 
                            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 sm:p-5 border flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden ${
                                isManual 
                                ? 'border-amber-400 dark:border-amber-600/40 bg-gradient-to-tr from-white to-amber-50/10 dark:from-slate-800 dark:to-amber-950/10 shadow-md' 
                                : 'border-slate-100 dark:border-slate-700'
                            }`}
                        >
                            {isManual && (
                                <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500"></div>
                            )}
                            <div>
                                {isManual && (
                                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-amber-100 dark:border-amber-900/30">
                                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-black border border-amber-250 dark:border-amber-900/30 shadow-sm animate-pulse flex items-center gap-1">
                                            👑 قیمت اعلامی دفتر (دارای اولویت)
                                        </span>
                                        <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold" dir="rtl">
                                            بروزرسانی: {timeAgo(manualPrice.updated_at)}
                                        </span>
                                    </div>
                                )}
                                <h3 className="font-black text-slate-800 dark:text-white text-lg mb-4 truncate">{stat.model_name}</h3>
                                <div className="space-y-4 text-sm">
                                    
                                    {/* Prominent / Larger Base Price for Manual */}
                                    <div className={`flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700 ${isManual ? 'bg-amber-50/45 dark:bg-amber-955/10 p-2 rounded-lg border-none mt-2' : ''}`}>
                                        <span className={`font-bold ${isManual ? 'text-amber-800 dark:text-amber-300 text-sm' : 'text-slate-500 dark:text-slate-400 text-xs'}`}>
                                            قیمت مبنا:
                                        </span>
                                        <span className={`font-mono font-black ${isManual ? 'text-amber-600 dark:text-amber-400 text-xl lg:text-2xl' : 'text-blue-700 dark:text-blue-300 text-lg'}`}>
                                            {basePrice.toLocaleString('fa-IR')} <span className="text-xs font-normal">ریال</span>
                                        </span>
                                    </div>

                                    {/* Havaleh 1 Month */}
                                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">حواله ۱ ماهه</span>
                                            <span className="text-[10px] text-emerald-600/70 font-mono">(۳٪ - ۵٪)</span>
                                        </div>
                                        <div className="flex justify-between items-center font-mono text-sm text-emerald-900 dark:text-emerald-100 font-bold">
                                            <span>{Math.round(havaleh1Min).toLocaleString('fa-IR')}</span>
                                            <span className="text-[10px] text-emerald-400 mx-1 font-sans">تا</span>
                                            <span>{Math.round(havaleh1Max).toLocaleString('fa-IR')}</span>
                                        </div>
                                    </div>

                                    {/* Havaleh 2 Month */}
                                    <div className="bg-cyan-50 dark:bg-cyan-950/20 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-800">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">حواله ۲ ماهه</span>
                                            <span className="text-[10px] text-cyan-600/70 font-mono">(۶٪ - ۱۰٪)</span>
                                        </div>
                                        <div className="flex justify-between items-center font-mono text-sm text-cyan-950 dark:text-cyan-100 font-bold">
                                            <span>{Math.round(havaleh2Min).toLocaleString('fa-IR')}</span>
                                            <span className="text-[10px] text-cyan-400 mx-1 font-sans">تا</span>
                                            <span>{Math.round(havaleh2Max).toLocaleString('fa-IR')}</span>
                                        </div>
                                    </div>

                                    {/* Limits */}
                                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-3">
                                        <span className="text-slate-500 dark:text-slate-400 font-bold text-xs">بیشترین نرخ معامله:</span>
                                        <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{Math.round(highestLimit).toLocaleString('fa-IR')}</span>
                                    </div>

                                    {/* Collapsible section for other sources */}
                                    {otherPricesForModel.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                                            <button
                                                onClick={() => setExpandedCards(prev => ({ ...prev, [stat.model_name]: !prev[stat.model_name] }))}
                                                className="w-full flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors focus:outline-none"
                                            >
                                                <span>استعلام‌های خودکار ({otherPricesForModel.length} منبع)</span>
                                                <span className="font-mono text-sm leading-none">{isExpanded ? '▲' : '▼'}</span>
                                            </button>
                                            {isExpanded && (
                                                <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-1">
                                                    {otherPricesForModel.map(p => (
                                                        <div key={p.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{p.source_name}</span>
                                                            <div className="text-left font-mono">
                                                                <span className="text-xs font-black text-slate-750 dark:text-slate-300">{p.price_rial.toLocaleString('fa-IR')}</span>
                                                                <span className="block text-[8px] text-slate-400 dark:text-slate-500 font-sans mt-0.5" dir="ltr">{timeAgo(p.captured_at)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </div>
    );

    const renderComparisonTable = () => {
        if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
        if (error) return <p className="text-center text-red-500 py-10">{error}</p>;
        if (sortedTableData.length === 0) return <p className="text-center text-slate-500 py-10">هیچ قیمتی یافت نشد.</p>;

        return (
            <div className="overflow-x-auto rounded-lg shadow-md border border-slate-200 dark:border-slate-700" style={{maxHeight: '70vh'}}>
                <table className="w-full text-sm text-right text-slate-600 dark:text-slate-300 border-collapse">
                    <thead className="text-xs text-slate-700 bg-slate-100 dark:bg-slate-800">
                        <tr>
                            <SortableHeader title="مدل خودرو" sortKey="model_name" className="sticky left-0 bg-slate-200 dark:bg-slate-900 z-20" />
                            {orderedSources.map(source => (
                                <SortableHeader key={source} title={source} sortKey={source} />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800">
                        {sortedTableData.map((row, index) => {
                            const rowBg = index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50';
                            return (
                                <tr key={row.model_name} className={`${rowBg}`}>
                                    <td className={`px-4 py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap sticky left-0 z-10 border-b border-slate-200 dark:border-slate-700 ${rowBg}`}>
                                        {row.model_name}
                                    </td>
                                    {orderedSources.map(source => {
                                        const price = row[source] as number;
                                        const isManualColumn = source === 'قیمت دستی';
                                        let cellClasses = 'px-4 py-3 text-center border-b border-slate-200 dark:border-slate-700 transition-colors duration-200 font-mono';
                                        
                                        if (isManualColumn && price > 0) {
                                            cellClasses += ' bg-amber-50 dark:bg-amber-955/40 text-amber-800 dark:text-amber-300 font-bold border-r border-l border-amber-100 dark:border-amber-900/40';
                                        } else if (price > 0 && row.minPrice !== row.maxPrice) {
                                            if (price === row.minPrice) {
                                                cellClasses += ' bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 font-bold';
                                            } else if (price === row.maxPrice) {
                                                cellClasses += ' bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 font-bold';
                                            }
                                        }

                                        return (
                                            <td key={source} className={cellClasses}>
                                                {price > 0 ? (
                                                    <span className="flex items-center justify-center gap-1">
                                                        {isManualColumn && <span>👑</span>}
                                                        <span>{price.toLocaleString('fa-IR')}</span>
                                                    </span>
                                                ) : <span className="text-slate-400 dark:text-slate-600">-</span>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderPriceStats()}
                {renderComparisonTable()}
            </main>
            
            <CarPriceCopySettingsModal 
                isOpen={isCopyModalOpen} 
                onClose={() => setIsCopyModalOpen(false)} 
                stats={mergedPriceStats}
                onCopySuccess={() => showToast('آمار با موفقیت کپی شد', 'success')}
            />

            <ManualCarPriceModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                manualPrices={manualPrices}
                knownModels={useMemo(() => Array.from(new Set(priceStats.map(s => s.model_name))).sort(), [priceStats])}
                onSave={handleSaveManualPrice}
                onDelete={handleDeleteManualPrice}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default CarPricesPage;
