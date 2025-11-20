
import React from 'react';
import type { User } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SortIcon } from './icons/SortIcon';
import { ChatIcon } from './icons/ChatIcon';
import { PhoneIcon } from './icons/PhoneIcon';


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
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <UsersIcon className="w-16 h-16 mb-4 opacity-50" />
                <p>هیچ سرنخی یافت نشد.</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        try {
            const parsableDateString = dateString.replace(' ', 'T');
            return new Intl.DateTimeFormat('fa-IR', {
                month: 'short',
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

    // Helper for avatar initials
    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-right text-slate-600">
                    <thead className="text-xs text-slate-700 bg-slate-50 border-b">
                        <tr>
                            <th scope="col" className="p-4 w-4">
                                <div className="flex items-center">
                                    <input
                                        id="checkbox-all-desktop"
                                        type="checkbox"
                                        className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                                        checked={users.length > 0 && selectedUserIds.size === users.length}
                                        onChange={(e) => onSelectAllChange(e.target.checked)}
                                    />
                                </div>
                            </th>
                            <SortableHeader title="کاربر" sortKey="FullName" />
                            <SortableHeader title="تماس" sortKey="Number" />
                            <SortableHeader title="خودرو" sortKey="CarModel" />
                            <SortableHeader title="موقعیت" sortKey="Province" />
                            <SortableHeader title="تاریخ" sortKey="RegisterTime" />
                            <th scope="col" className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className={`border-b hover:bg-slate-50 transition-colors ${selectedUserIds.has(user.id) ? 'bg-sky-50/60' : ''}`}>
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <input
                                            id={`checkbox-desktop-${user.id}`}
                                            type="checkbox"
                                            className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                                            checked={selectedUserIds.has(user.id)}
                                            onChange={() => onSelectionChange(user.id)}
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
                                            {getInitials(user.FullName)}
                                        </div>
                                        <span className="font-medium text-slate-900">{user.FullName}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono" dir="ltr">{user.Number}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">{user.CarModel || '-'}</span>
                                </td>
                                <td className="px-6 py-4">{user.City || user.Province || '-'}</td>
                                <td className="px-6 py-4 text-xs">{formatDate(user.RegisterTime)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                         <button onClick={() => onViewDetails(user)} className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="گفتگو">
                                            <ChatIcon />
                                        </button>
                                        <button onClick={() => onEdit(user)} className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="ویرایش">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDelete(user.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile List View (Native App Style) */}
            <div className="md:hidden divide-y divide-slate-100">
                {users.map((user) => (
                    <div 
                        key={user.id} 
                        className={`flex items-center p-4 active:bg-slate-50 transition-colors ${selectedUserIds.has(user.id) ? 'bg-sky-50' : ''}`}
                    >
                        {/* Checkbox (Left side) */}
                        <div className="ml-3 flex-shrink-0">
                             <input
                                type="checkbox"
                                className="w-5 h-5 text-sky-600 bg-white border-slate-300 rounded-full focus:ring-sky-500"
                                checked={selectedUserIds.has(user.id)}
                                onChange={() => onSelectionChange(user.id)}
                            />
                        </div>
                        
                        {/* Main Content (Click to View Details) */}
                        <div className="flex-grow min-w-0 cursor-pointer" onClick={() => onViewDetails(user)}>
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-bold text-slate-900 truncate text-base">{user.FullName}</h3>
                                <span className="text-[10px] text-slate-400 flex-shrink-0">{formatDate(user.RegisterTime)}</span>
                            </div>
                            <div className="flex items-center text-xs text-slate-500 mb-1">
                                <PhoneIcon className="w-3 h-3 ml-1" />
                                <span dir="ltr" className="font-mono">{user.Number}</span>
                            </div>
                             <div className="flex items-center justify-between">
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium">
                                    {user.CarModel || 'خودرو نامشخص'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    {user.City}
                                </span>
                            </div>
                        </div>

                        {/* Quick Actions (Right side) */}
                         <div className="mr-3 flex flex-col gap-3 border-r border-slate-100 pr-3">
                             <button onClick={(e) => { e.stopPropagation(); onEdit(user); }} className="text-slate-400 hover:text-sky-600">
                                <EditIcon className="w-5 h-5" />
                            </button>
                             <button onClick={(e) => { e.stopPropagation(); onDelete(user.id); }} className="text-slate-400 hover:text-red-600">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Import at the top needed
import { UsersIcon } from './icons/UsersIcon'; 

export default UserTable;
