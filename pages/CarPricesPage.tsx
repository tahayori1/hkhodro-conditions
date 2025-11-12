
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getScrapedCarPrices, getScrapedCarPriceSources, getCarPriceStats } from '../services/api';
import type { ScrapedCarPrice, CarPriceSource, CarPriceStats } from '../types';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import { SortIcon } from '../components/icons/SortIcon';
import { CopyIcon } from '../components/icons/CopyIcon';

interface CarPricesPageProps {
    setOnAddNew: (handler: (() => void) | null) => void;
}

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

const CarPricesPage: React.FC<CarPricesPageProps> = ({ setOnAddNew }) => {
    const [prices, setPrices] = useState<ScrapedCarPrice[]>([]);
    const [sources, setSources] = useState<string[]>([]);
    const [priceStats, setPriceStats] = useState<CarPriceStats[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'model_name', direction: 'ascending' });
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);


    useEffect(() => {
        setOnAddNew(null);
    }, [setOnAddNew]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
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
            setPriceStats(statsData.sort((a, b) => a.model_name.localeCompare(b.model_name, 'fa-IR')));

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

    const tableData = useMemo((): TableRow[] => {
        const groupedByModel = prices.reduce((acc, price) => {
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

            sources.forEach(source => {
                row[source] = sourcePrices[source] ?? 0;
            });
            return row as TableRow;
        });
    }, [prices, sources]);

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
    
    const handleCopyStats = () => {
        if (priceStats.length === 0) {
            showToast('آماری برای کپی کردن وجود ندارد', 'error');
            return;
        }

        const header = "بازه قیمت محصولات کرمان موتور";
        const statsText = priceStats
            .map(stat => `*${stat.model_name}* ${stat.minimum.toLocaleString('fa-IR')} - ${stat.maximum.toLocaleString('fa-IR')}`)
            .join('\n');
        
        const fullText = `${header}\n\n${statsText}`;

        navigator.clipboard.writeText(fullText)
            .then(() => {
                showToast('آمار با موفقیت کپی شد', 'success');
            })
            .catch(err => {
                console.error('Failed to copy stats: ', err);
                showToast('کپی کردن با خطا مواجه شد', 'error');
            });
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
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-700">آمار خلاصه قیمت‌ها</h2>
                 <button 
                    onClick={handleCopyStats}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                    disabled={loading || !!error || priceStats.length === 0}
                >
                    <CopyIcon />
                    کپی
                </button>
            </div>
            {loading ? (
                <div className="flex justify-center items-center h-40 bg-white p-6 rounded-lg shadow-md">
                    <Spinner />
                </div>
            ) : error ? (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow-md">
                    <p>{error}</p>
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 -m-2 p-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`.flex.gap-4.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
                    {priceStats.map(stat => (
                        <div key={stat.id} className="flex-shrink-0 w-60 bg-white rounded-lg shadow-md p-4 border border-slate-200">
                            <h3 className="font-bold text-slate-800 text-md mb-3 truncate">{stat.model_name}</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center bg-red-50 p-2 rounded-md">
                                    <span className="text-slate-600">کمترین:</span>
                                    <span className="font-mono font-semibold text-red-700">{stat.minimum.toLocaleString('fa-IR')}</span>
                                </div>
                                <div className="flex justify-between items-center bg-green-50 p-2 rounded-md">
                                    <span className="text-slate-600">بیشترین:</span>
                                    <span className="font-mono font-semibold text-green-700">{stat.maximum.toLocaleString('fa-IR')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderComparisonTable = () => {
        if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
        if (error) return <p className="text-center text-red-500 py-10">{error}</p>;
        if (sortedTableData.length === 0) return <p className="text-center text-slate-500 py-10">هیچ قیمتی یافت نشد.</p>;

        return (
            <div className="overflow-x-auto rounded-lg shadow-md border border-slate-200" style={{maxHeight: '70vh'}}>
                <table className="w-full text-sm text-right text-slate-600 border-collapse">
                    <thead className="text-xs text-slate-700 bg-slate-100">
                        <tr>
                            <SortableHeader title="مدل خودرو" sortKey="model_name" className="sticky left-0 bg-slate-200 z-20" />
                            {sources.map(source => (
                                <SortableHeader key={source} title={source} sortKey={source} />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {sortedTableData.map((row, index) => {
                            const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                            return (
                                <tr key={row.model_name} className={`${rowBg}`}>
                                    <td className={`px-4 py-3 font-bold text-slate-900 whitespace-nowrap sticky left-0 z-10 border-b border-slate-200 ${rowBg}`}>
                                        {row.model_name}
                                    </td>
                                    {sources.map(source => {
                                        const price = row[source] as number;
                                        let cellClasses = 'px-4 py-3 text-center border-b border-slate-200 transition-colors duration-200 font-mono';
                                        
                                        if (price > 0 && row.minPrice !== row.maxPrice) {
                                            if (price === row.minPrice) {
                                                cellClasses += ' bg-green-100 text-green-800 font-bold';
                                            } else if (price === row.maxPrice) {
                                                cellClasses += ' bg-red-100 text-red-800 font-bold';
                                            }
                                        }

                                        return (
                                            <td key={source} className={cellClasses}>
                                                {price > 0 ? price.toLocaleString('fa-IR') : <span className="text-slate-400">-</span>}
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

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <h2 className="text-xl font-bold text-slate-700 mb-2 sm:mb-0">مقایسه قیمت روز خودروها</h2>
                        {lastUpdated && <p className="text-xs text-slate-500">آخرین بروزرسانی: {timeAgo(lastUpdated)}</p>}
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                        قیمت‌ها از منابع آنلاین جمع‌آوری شده‌اند (به تومان). خانه‌های <span className="text-green-600 font-semibold">سبز</span> کمترین و خانه‌های <span className="text-red-600 font-semibold">قرمز</span> بیشترین قیمت در هر ردیف هستند.
                    </p>
                </div>
                {renderComparisonTable()}
            </main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default CarPricesPage;
