
import React, { useState, useEffect } from 'react';
import type { ConditionStatus, SaleType } from '../types';
import { ConditionStatus as ConditionStatusEnum, SaleType as SaleTypeEnum } from '../types';

interface FilterPanelProps {
    onFilterChange: (filters: { status: ConditionStatus | 'all'; car_model: string | 'all', sale_type: SaleType | 'all' }) => void;
    resultCount: number;
    totalCount: number;
}

const CAR_MODELS = [
    'JAC J4', 'JAC S3', 'JAC S5', 'BAC X3PRO', 'KMC T8', 'KMC T9', 'KMC A5',
    'KMC J7', 'KMC X5', 'KMC SR3', 'KMC EAGLE', 'KMC SHADOW', 'KMC SR6'
];

const FilterPanel: React.FC<FilterPanelProps> = ({ onFilterChange, resultCount, totalCount }) => {
    const [status, setStatus] = useState<ConditionStatus | 'all'>('all');
    const [carModel, setCarModel] = useState<string | 'all'>('all');
    const [saleType, setSaleType] = useState<SaleType | 'all'>('all');

    useEffect(() => {
        const handler = setTimeout(() => {
            onFilterChange({ status, car_model: carModel, sale_type: saleType });
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [status, carModel, saleType, onFilterChange]);

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
            >
                <option value="all">همه مدل‌ها</option>
                {CAR_MODELS.map(model => (
                    <option key={model} value={model}>{model}</option>
                ))}
            </select>
             <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                value={saleType}
                onChange={(e) => setSaleType(e.target.value as SaleType | 'all')}
            >
                <option value="all">همه انواع فروش</option>
                {Object.values(SaleTypeEnum).map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
            <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                value={status}
                onChange={(e) => setStatus(e.target.value as ConditionStatus | 'all')}
            >
                <option value="all">همه وضعیت‌ها</option>
                {Object.values(ConditionStatusEnum).map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
            <div className="text-right lg:text-left">
                <p className="text-sm font-medium text-slate-600 whitespace-nowrap">
                    <span className="font-bold text-sky-700">{resultCount.toLocaleString('fa-IR')}</span> / {totalCount.toLocaleString('fa-IR')} نتیجه
                </p>
            </div>
        </div>
    );
};

export default FilterPanel;
