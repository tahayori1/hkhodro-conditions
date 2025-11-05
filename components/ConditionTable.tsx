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
    onDelete: (id: number) => void;
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
                                        <button onClick={() => onDelete(condition.id)} className="text-red-600 hover:text-red-800" title="حذف">
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
                    <div key={condition.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-800">{condition.car_model} - {condition.model}</h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColorMap[condition.status]}`}>
                                    {condition.status}
                                </span>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                                <p><strong>نوع فروش:</strong> {condition.sale_type}</p>
                                <p><strong>نحوه پرداخت:</strong> {condition.pay_type}</p>
                                <p><strong>زمان تحویل:</strong> {condition.delivery_time}</p>
                                <p><strong>پیش‌پرداخت:</strong> <span className="font-mono">{condition.initial_deposit.toLocaleString('fa-IR')} تومان</span></p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-slate-200">
                             <button onClick={() => onView(condition)} className="flex items-center gap-1 text-slate-600 hover:text-slate-800 text-sm">
                                <EyeIcon /> نمایش
                            </button>
                            <button onClick={() => onEdit(condition)} className="flex items-center gap-1 text-sky-600 hover:text-sky-800 text-sm">
                                <EditIcon /> ویرایش
                            </button>
                            <button onClick={() => onDelete(condition.id)} className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm">
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
