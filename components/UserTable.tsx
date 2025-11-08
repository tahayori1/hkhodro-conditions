import React from 'react';
import type { User } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SortIcon } from './icons/SortIcon';
import { ChatIcon } from './icons/ChatIcon';


interface UserTableProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (id: number) => void;
    onViewDetails: (user: User) => void;
    onSort: (key: keyof User) => void;
    sortConfig: { key: keyof User; direction: 'ascending' | 'descending' } | null;
    selectedUserIds: Set<number>;
    onSelectionChange: (userId: number) => void;
    onSelectAllChange: (selectAll: boolean) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete, onViewDetails, onSort, sortConfig, selectedUserIds, onSelectionChange, onSelectAllChange }) => {
    if (users.length === 0) {
        return <p className="text-center text-slate-500 py-10">هیچ سرنخی یافت نشد.</p>;
    }

    const formatDate = (dateString: string) => {
        try {
            const parsableDateString = dateString.replace(' ', 'T');
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(parsableDateString));
        } catch (e) {
            return dateString;
        }
    };
    
    const SortableHeader: React.FC<{ title: string; sortKey: keyof User; }> = ({ title, sortKey }) => {
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
                            <th scope="col" className="p-4">
                                <div className="flex items-center">
                                    <input
                                        id="checkbox-all-desktop"
                                        type="checkbox"
                                        className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                                        checked={users.length > 0 && selectedUserIds.size === users.length}
                                        onChange={(e) => onSelectAllChange(e.target.checked)}
                                        aria-label="Select all users on this page"
                                    />
                                </div>
                            </th>
                            <SortableHeader title="نام کامل" sortKey="FullName" />
                            <SortableHeader title="شماره تماس" sortKey="Number" />
                            <SortableHeader title="خودروی درخواستی" sortKey="CarModel" />
                            <SortableHeader title="استان / شهر" sortKey="Province" />
                            <SortableHeader title="زمان ثبت" sortKey="RegisterTime" />
                            <th scope="col" className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className={`bg-white border-b hover:bg-slate-50 ${selectedUserIds.has(user.id) ? 'bg-sky-50' : ''}`}>
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <input
                                            id={`checkbox-desktop-${user.id}`}
                                            type="checkbox"
                                            className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                                            checked={selectedUserIds.has(user.id)}
                                            onChange={() => onSelectionChange(user.id)}
                                            aria-labelledby={`user-name-${user.id}`}
                                        />
                                    </div>
                                </td>
                                <td id={`user-name-${user.id}`} className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{user.FullName}</td>
                                <td className="px-6 py-4" dir="ltr">{user.Number}</td>
                                <td className="px-6 py-4">{user.CarModel}</td>
                                <td className="px-6 py-4">{user.Province} / {user.City}</td>
                                <td className="px-6 py-4">{formatDate(user.RegisterTime)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-4">
                                         <button onClick={() => onViewDetails(user)} className="text-slate-500 hover:text-slate-800" title="جزئیات و تاریخچه گفتگو">
                                            <ChatIcon />
                                        </button>
                                        <button onClick={() => onEdit(user)} className="text-sky-600 hover:text-sky-800" title="ویرایش">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDelete(user.id)} className="text-red-600 hover:text-red-800" title="حذف">
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
                {users.map((user) => (
                    <div key={user.id} className={`relative bg-slate-50 border rounded-lg p-4 flex flex-col justify-between ${selectedUserIds.has(user.id) ? 'border-sky-400 ring-2 ring-sky-200' : 'border-slate-200'}`}>
                        <div className="absolute top-3 left-3 z-10">
                            <input
                                type="checkbox"
                                className="w-5 h-5 text-sky-600 bg-white border-slate-300 rounded focus:ring-sky-500"
                                checked={selectedUserIds.has(user.id)}
                                onChange={() => onSelectionChange(user.id)}
                                aria-label={`Select ${user.FullName}`}
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-start mb-2 pr-8">
                                <h3 className="font-bold text-slate-800">{user.FullName}</h3>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                                <p><strong>شماره تماس:</strong> <span dir="ltr">{user.Number}</span></p>
                                <p><strong>خودرو:</strong> {user.CarModel}</p>
                                <p><strong>محل:</strong> {user.Province} / {user.City}</p>
                                <p><strong>زمان ثبت:</strong> {formatDate(user.RegisterTime)}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-slate-200">
                             <button onClick={() => onViewDetails(user)} className="flex items-center gap-1 text-slate-600 hover:text-slate-800 text-sm">
                                <ChatIcon /> جزئیات
                            </button>
                            <button onClick={() => onEdit(user)} className="flex items-center gap-1 text-sky-600 hover:text-sky-800 text-sm">
                                <EditIcon /> ویرایش
                            </button>
                            <button onClick={() => onDelete(user.id)} className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm">
                                <TrashIcon /> حذف
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserTable;