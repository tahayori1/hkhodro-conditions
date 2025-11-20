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
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
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
            <th scope="col" className="px-6 py-4">
                <button
                    className="flex items-center gap-1 uppercase font-bold text-xs text-slate-700 group hover:text-sky-600 transition-colors"
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
        <div className="bg-transparent md:bg-white md:rounded-[24px] md:shadow-sm md:border md:border-slate-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-right text-slate-600">
                    <thead className="text-xs text-slate-700 bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th scope="col" className="p-4 w-4">
                                <div className="flex items-center">
                                    <input
                                        id="checkbox-all-desktop"
                                        type="checkbox"
                                        className="w-4 h-4 text-sky-600 bg-white border-gray-300 rounded focus:ring-sky-500 transition-all cursor-pointer"
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
                            <tr key={user.id} className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${selectedUserIds.has(user.id) ? 'bg-sky-50/60' : ''}`}>
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <input
                                            id={`checkbox-desktop-${user.id}`}
                                            type="checkbox"
                                            className="w-4 h-4 text-sky-600 bg-white border-gray-300 rounded focus:ring-sky-500 transition-all cursor-pointer"
                                            checked={selectedUserIds.has(user.id)}
                                            onChange={() => onSelectionChange(user.id)}
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 text-sky-700 flex items-center justify-center text-xs font-bold shadow-sm">
                                            {getInitials(user.FullName)}
                                        </div>
                                        <span className="font-bold text-slate-800">{user.FullName}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono font-medium text-slate-600" dir="ltr">{user.Number}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200">{user.CarModel || '-'}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">{user.City || user.Province || '-'}</td>
                                <td className="px-6 py-4 text-xs text-slate-400">{formatDate(user.RegisterTime)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                         <button onClick={() => onViewDetails(user)} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors" title="گفتگو">
                                            <ChatIcon />
                                        </button>
                                        <button onClick={() => onEdit(user)} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors" title="ویرایش">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => onDelete(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="حذف">
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
            <div className="md:hidden space-y-3">
                {users.map((user) => (
                    <div 
                        key={user.id} 
                        className={`relative bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:scale-[0.99] transition-transform ${selectedUserIds.has(user.id) ? 'ring-2 ring-sky-500 ring-offset-2' : ''}`}
                        onClick={() => onViewDetails(user)}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="flex-shrink-0"
                                    onClick={(e) => { e.stopPropagation(); onSelectionChange(user.id); }}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedUserIds.has(user.id) ? 'bg-sky-500 border-sky-500' : 'border-slate-300 bg-white'}`}>
                                        {selectedUserIds.has(user.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base leading-tight">{user.FullName}</h3>
                                    <div className="flex items-center text-xs text-slate-400 mt-1">
                                        <PhoneIcon className="w-3 h-3 ml-1" />
                                        <span dir="ltr" className="font-mono">{user.Number}</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{formatDate(user.RegisterTime)}</span>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-slate-100">
                             <div className="flex gap-2">
                                <span className="bg-sky-50 text-sky-700 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                                    {user.CarModel || 'نامشخص'}
                                </span>
                                {(user.City || user.Province) && (
                                    <span className="bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg text-[11px]">
                                        {user.City || user.Province}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                 <button onClick={(e) => { e.stopPropagation(); onEdit(user); }} className="text-slate-400 hover:text-sky-600 p-1">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                 <button onClick={(e) => { e.stopPropagation(); onDelete(user.id); }} className="text-slate-400 hover:text-red-600 p-1">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserTable;