import React from 'react';
import type { CarSaleCondition } from '../types';
import { ConditionStatus } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EyeIcon } from './icons/EyeIcon';
import { SortIcon } from './icons/SortIcon';

interface ConditionTableProps {
    conditions: CarSaleCondition[];
    onEdit: (condition: CarSaleCondition) => void;
    onDelete: (condition: CarSaleCondition) => void;
    onView: (condition: CarSaleCondition) => void;
    onSort: (key: keyof CarSaleCondition) => void;
    sortConfig: { key: keyof CarSaleCondition; direction: 'ascending' | 'descending' } | null;
}

const statusColorMap: Record<ConditionStatus, string> = {
    [ConditionStatus.AVAILABLE]: 'bg-green-100 text-green-800',
    [ConditionStatus.SOLD_OUT]: 'bg-red-100 text-red-800',
    [ConditionStatus.CAPACITY_FULL]: 'bg-yellow-100 text-yellow-800',
};

const ConditionTable: React.FC<ConditionTableProps> = ({ conditions, onEdit, onDelete, onView, onSort, sortConfig }) => {
    if (conditions.length === 0) {
        return <p className="text-center text-slate-500 py-10">هیچ شرایط فروشی یافت نشد.</p>;
    }

    const SortableHeader: React.FC<{ title: string; sortKey: keyof CarSaleCondition; }> = ({ title, sortKey }) => {
        const isSorted = sortConfig?.key === sortKey;
        const direction = isSorted ? sortConfig.direction : 'none';

        return (
            <th scope="col" className="px-6 py-3">
                <button
                    className="flex items-center gap-1 uppercase font-bold text-xs text-slate-700 group"
                    onClick={() => onSort(sortKey)}
                >
                    {title}
                    <SortIcon direction={direction} />
                </button>
            </th>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block">
                <table className="w-full text-sm text-right text-slate-600">
                    <thead className="text-xs text-slate-700 bg-slate-50">
                        <tr>
                            <SortableHeader title="وضعیت" sortKey="status" />
                            <SortableHeader title="مدل خودرو" sortKey="car_model" />
                            <SortableHeader title="سال" sortKey="model" />
                            <SortableHeader title="نوع فروش" sortKey="sale_type" />
                            <SortableHeader title="نحوه پرداخت" sortKey="pay_type" />
                            <SortableHeader title="زمان تحویل" sortKey="delivery_time" />
                            <SortableHeader title="پیش‌پرداخت (تومان)" sortKey="initial_deposit" />
                            <th scope="col" className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {conditions.map((condition) => (
                            <tr key={condition.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColorMap[condition.status]}`}>
                                        {condition.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{condition.car_model}</td>
                                <td className="px-6 py-4">{condition.model}</td>
                                <td className="px-6 py-4">{condition.sale_type}</td>
                                <td className="px-6 py-4">{condition.pay_type}</td>
                                <td className="px-6 py-4">{condition.delivery_time}</td>
                                <td className="px-6 py-4 font-mono">{condition.initial_deposit.toLocaleString('fa-IR')}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-4">
                                         <button onClick={() => onView(condition)} className="text-slate-500 hover:text-slate-800" title="نمایش">
                                            <EyeIcon />
                                        </button>
                                        <button onClick={() => onEdit(condition)} className="text-sky-600 hover:text-sky-800" title="ویرایش">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDelete(condition)} className="text-red-600 hover:text-red-800" title="حذف">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 md:hidden">
                {conditions.map((condition) => (
                    <div key={condition.id} className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-md">{condition.car_model} - {condition.model}</h3>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusColorMap[condition.status]}`}>
                                    {condition.status}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 flex-grow">
                            <div className="text-center mb-4">
                                <p className="text-xs text-slate-500">پیش‌پرداخت</p>
                                <p className="text-xl font-bold font-mono text-sky-700">{condition.initial_deposit.toLocaleString('fa-IR')} <span className="text-sm font-sans">تومان</span></p>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500">نوع فروش:</span>
                                    <span className="font-semibold">{condition.sale_type}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500">نحوه پرداخت:</span>
                                    <span className="font-semibold">{condition.pay_type}</span>
                                </div>
                                <div className="flex flex-col col-span-2">
                                    <span className="text-xs text-slate-500">زمان تحویل:</span>
                                    <span className="font-semibold">{condition.delivery_time}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 p-3 bg-slate-50 border-t border-slate-200 rounded-b-lg">
                            <button onClick={() => onView(condition)} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-semibold px-3 py-1.5 rounded-md hover:bg-slate-200 transition-colors">
                                <EyeIcon /> نمایش
                            </button>
                            <button onClick={() => onEdit(condition)} className="flex items-center gap-1.5 text-sky-600 hover:text-sky-800 text-sm font-semibold px-3 py-1.5 rounded-md hover:bg-sky-100 transition-colors">
                                <EditIcon /> ویرایش
                            </button>
                            <button onClick={() => onDelete(condition)} className="flex items-center gap-1.5 text-red-600 hover:text-red-800 text-sm font-semibold px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors">
                                <TrashIcon /> حذف
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConditionTable;