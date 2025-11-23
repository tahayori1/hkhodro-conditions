import React from 'react';
import type { User } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SortIcon } from './icons/SortIcon';
import { ChatIcon } from './icons/ChatIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { UsersIcon } from './icons/UsersIcon';

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
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 border-dashed mx-4">
                <UsersIcon className="w-16 h-16 mb-4 opacity-30" />
                <p className="font-medium">هیچ سرنخی یافت نشد.</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        try {
            const parsableDateString = dateString.replace(' ', 'T');
            return new Intl.DateTimeFormat('fa-IR', {
                month: 'short',
                day: 'numeric',
            }).format(new Date(parsableDateString));
        } catch (e) {
            return dateString;
        }
    };
    
    const SortableHeader: React.FC<{ title: string; sortKey: keyof User; }> = ({ title, sortKey }) => {
        const isSorted = sortConfig?.key === sortKey;
        const direction = isSorted ? sortConfig.direction : 'none';

        return (
            <th scope="col" className="px-6 py-4">
                <button
                    className="flex items-center gap-1 uppercase font-bold text-xs text-slate-700 dark:text-slate-300 group hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
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
        <div className="bg-transparent md:bg-white md:dark:bg-slate-800 md:rounded-[24px] md:shadow-sm md:border md:border-slate-200 md:dark:border-slate-700 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-right text-slate-600 dark:text-slate-300">
                    <thead className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                        <tr>
                            <th scope="col" className="p-4 w-4">
                                <div className="flex items-center">
                                    <input
                                        id="checkbox-all-desktop"
                                        type="checkbox"
                                        className="w-4 h-4 text-sky-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-sky-500 dark:focus:ring-sky-600 transition-all cursor-pointer"
                                        checked={users.length > 0 && selectedUserIds.size === users.length}
                                        onChange={(e) => onSelectAllChange(e.target.checked)}
                                    />
                                </div>
                            </th>
                            <SortableHeader title="کاربر" sortKey="FullName" />
                            <SortableHeader title="تماس" sortKey="Number" />
                            <SortableHeader title="خودرو" sortKey="CarModel" />
                            <SortableHeader title="موقعیت" sortKey="Province" />
                            <SortableHeader title="آخرین بروزرسانی" sortKey="updatedAt" />
                            <th scope="col" className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className={`border-b border-slate-50 dark:border-slate-700/50 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/50 
                                ${selectedUserIds.has(user.id) ? 'bg-sky-50/60 dark:bg-sky-900/20' : ''}
                            `}>
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <input
                                            id={`checkbox-desktop-${user.id}`}
                                            type="checkbox"
                                            className="w-4 h-4 text-sky-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-sky-500 dark:focus:ring-sky-600 transition-all cursor-pointer"
                                            checked={selectedUserIds.has(user.id)}
                                            onChange={() => onSelectionChange(user.id)}
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900 dark:to-blue-900 text-sky-700 dark:text-sky-300 flex items-center justify-center text-xs font-bold shadow-sm">
                                            {getInitials(user.FullName)}
                                        </div>
                                        <span className="font-bold text-slate-800 dark:text-slate-100">{user.FullName}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono font-medium text-slate-600 dark:text-slate-400" dir="ltr">{user.Number}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600">{user.CarModel || '-'}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{user.City || user.Province || '-'}</td>
                                <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500">{formatDate(user.updatedAt)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                         <button onClick={() => onViewDetails(user)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-xl transition-colors" title="گفتگو">
                                            <ChatIcon />
                                        </button>
                                        <button onClick={() => onEdit(user)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-xl transition-colors" title="ویرایش">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDelete(user.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors" title="حذف">
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
            <div className="md:hidden flex flex-col gap-3 pb-20">
                {users.map((user) => (
                    <div 
                        key={user.id} 
                        onClick={() => onViewDetails(user)}
                        className={`relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border transition-all active:scale-[0.98] 
                        ${selectedUserIds.has(user.id) ? 'border-sky-500 ring-1 ring-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-slate-100 dark:border-slate-700'}
                        `}
                    >
                        <div className="flex items-center gap-3">
                            {/* Selection Circle */}
                            <div 
                                onClick={(e) => { e.stopPropagation(); onSelectionChange(user.id); }}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedUserIds.has(user.id) ? 'bg-sky-500 border-sky-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'}`}
                            >
                                {selectedUserIds.has(user.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{user.FullName}</h3>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded-full flex-shrink-0 font-mono">{formatDate(user.updatedAt)}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold truncate max-w-[100px]">
                                        {user.CarModel || 'بدون خودرو'}
                                    </span>
                                    <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 font-mono" dir="ltr">
                                        <PhoneIcon className="w-3 h-3 mr-1" />
                                        {user.Number}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserTable;