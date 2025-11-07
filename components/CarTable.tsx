import React from 'react';
import type { Car } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';

interface CarTableProps {
    cars: Car[];
    onEdit: (car: Car) => void;
    onDelete: (id: number) => void;
}

const CarTable: React.FC<CarTableProps> = ({ cars, onEdit, onDelete }) => {
    if (cars.length === 0) {
        return <p className="text-center text-slate-500 py-10">هیچ خودرویی یافت نشد.</p>;
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block">
                <table className="w-full text-sm text-right text-slate-600">
                    <thead className="text-xs text-slate-700 bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 uppercase font-bold">نام خودرو</th>
                            <th scope="col" className="px-6 py-3 uppercase font-bold">برند</th>
                            <th scope="col" className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {cars.map((car) => (
                            <tr key={car.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{car.name}</td>
                                <td className="px-6 py-4">{car.brand}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-4">
                                        <button onClick={() => onEdit(car)} className="text-sky-600 hover:text-sky-800" title="ویرایش">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDelete(car.id)} className="text-red-600 hover:text-red-800" title="حذف">
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
                {cars.map((car) => (
                    <div key={car.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-slate-800">{car.name}</h3>
                            <p className="text-sm text-slate-600"><strong>برند:</strong> {car.brand}</p>
                        </div>
                        <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-slate-200">
                            <button onClick={() => onEdit(car)} className="flex items-center gap-1 text-sky-600 hover:text-sky-800 text-sm">
                                <EditIcon /> ویرایش
                            </button>
                            <button onClick={() => onDelete(car.id)} className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm">
                                <TrashIcon /> حذف
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CarTable;