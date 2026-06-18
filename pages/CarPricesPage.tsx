
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getScrapedCarPrices, getScrapedCarPriceSources, getCarPriceStats } from '../services/api';
import type { ScrapedCarPrice, CarPriceSource, CarPriceStats } from '../types';
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

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleSaveManualPrice = (modelName: string, priceRial: number) => {
        setManualPrices(prev => {
            const existingIndex = prev.findIndex(p => p.model_name === modelName);
            const updated = [...prev];
            const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
            
            if (existingIndex !== -1) {
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    price_rial: priceRial,
                    updated_at: now
                };
                showToast(`قیمت دستی خودروی ${modelName} بر اساس سیاست کل به روز شد`, 'success');
            } else {
                updated.push({
                    id: Math.random().toString(36).substring(2, 9),
                    model_name: modelName,
                    price_rial: priceRial,
                    updated_at: now
                });
                showToast(`قیمت خودروی ${modelName} به صورت دستی ثبت شد`, 'success');
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
            const [pricesData, sourcesData, statsData] = await Promise.all([
                getScrapedCarPrices(),
                getScrapedCarPriceSources(),
                getCarPriceStats()
            ]);
            
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
            ) : error ? (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow-md">
                    <p>{error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mergedPriceStats.map(stat => {
                        const isManual = (stat as any).isManual;
                        // Change: Highest limit is now +2% instead of +7%
                        const highestLimit = stat.maximum * 1.02;
                        
                        // Havaleh Calculations
                        // 1 Month: Max - 5% (Min), Max - 3% (Max)
                        const havaleh1Min = stat.maximum * 0.95; 
                        const havaleh1Max = stat.maximum * 0.97;

                        // 2 Month: Max - 10% (Min), Max - 6% (Max)
                        const havaleh2Min = stat.maximum * 0.90;
                        const havaleh2Max = stat.maximum * 0.94;

                        return (
                        <div 
                            key={stat.id} 
                            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 border flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden ${
                                isManual 
                                ? 'border-amber-400 dark:border-amber-600/40 bg-gradient-to-tr from-white to-amber-50/20 dark:from-slate-800 dark:to-amber-950/10 shadow-md' 
                                : 'border-slate-100 dark:border-slate-700'
                            }`}
                        >
                            {isManual && (
                                <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500"></div>
                            )}
                            <div>
                                {isManual && (
                                    <div className="flex items-center gap-1 mb-2">
                                        <span className="text-[10px] bg-amber-100 dark:bg-amber-955/80 text-amber-800 dark:text-amber-300 px-2 rounded-full font-black border border-amber-200 dark:border-amber-900/40 shadow-sm animate-pulse">
                                            👑 قیمت اعلامی دفتر (دارای اولویت)
                                        </span>
                                    </div>
                                )}
                                <h3 className="font-black text-slate-800 dark:text-white text-lg mb-4 truncate">{stat.model_name}</h3>
                                <div className="space-y-4 text-sm">
                                    
                                    {/* Base Price */}
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-blue-605 dark:text-blue-405 font-bold">قیمت مبنا:</span>
                                        <span className="font-mono font-black text-blue-700 dark:text-blue-300 text-lg">{stat.maximum.toLocaleString('fa-IR')}</span>
                                    </div>

                                    {/* Havaleh 1 Month */}
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800">
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
                                    <div className="bg-cyan-50 dark:bg-cyan-900/20 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-800">
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
