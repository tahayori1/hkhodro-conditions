
import React from 'react';
import { LeadStatus } from '../types';
import type { User, MyProfile } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SortIcon } from './icons/SortIcon';
import { ChatIcon } from './icons/ChatIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { UsersIcon } from './icons/UsersIcon';
import { SendToCrmIcon } from './icons/SendToCrmIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { SecurityIcon } from './icons/SecurityIcon';

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
    onSendToCrm: (user: User) => void;
    onRegisterOrder: (user: User) => void;
    onReserve: (user: User) => void;
    onTransfer: (user: User) => void;
    loggedInUser: MyProfile | null;
}

const UserTable: React.FC<UserTableProps> = ({ 
    users, onEdit, onDelete, onViewDetails, onSort, sortConfig, 
    selectedUserIds, onSelectionChange, onSelectAllChange, onSendToCrm,
    onRegisterOrder, onReserve, onTransfer, loggedInUser
}) => {
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
    
    const formatDateForTooltip = (dateString?: string) => {
        if (!dateString) return '';
        try {
            return new Date(dateString.replace(' ', 'T')).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' });
        } catch {
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
                                        checked={users.length > 0 && users.every(u => selectedUserIds.has(u.id))}
                                        onChange={(e) => onSelectAllChange(e.target.checked)}
                                    />
                                </div>
                            </th>
                            <SortableHeader title="کاربر" sortKey="FullName" />
                            <SortableHeader title="تماس" sortKey="Number" />
                            <SortableHeader title="خودرو" sortKey="CarModel" />
                            <SortableHeader title="رزرو" sortKey="reservedByUserId" />
                            <SortableHeader title="وضعیت سرنخ" sortKey="leadStatus" />
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
                                <td className="px-6 py-4">
                                    {user.reservedByUserId ? (
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                <SecurityIcon className="w-3 h-3" />
                                                <span className="text-[10px] font-bold">رزرو شده توسط:</span>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{user.reservedByUserName}</span>
                                            {(loggedInUser?.isAdmin || loggedInUser?.id === user.reservedByUserId) && (
                                                <button 
                                                    onClick={() => onTransfer(user)}
                                                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline text-right"
                                                >
                                                    انتقال به دیگری
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => onReserve(user)}
                                            className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors border border-amber-200 dark:border-amber-800"
                                        >
                                            رزرو مشتری
                                        </button>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {(() => {
                                        const status = user.leadStatus || LeadStatus.NEW;
                                        let badgeColor = "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600";
                                        let displayLabel = status as string;

                                        if (status === LeadStatus.NEW) {
                                            badgeColor = "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-600";
                                        } else if (status === LeadStatus.CONTACTED) {
                                            badgeColor = "bg-sky-50 text-sky-700 border-sky-250 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900";
                                        } else if (status === LeadStatus.MEETING) {
                                            badgeColor = "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900";
                                        } else if (status === LeadStatus.NEGOTIATION) {
                                            badgeColor = "bg-purple-50 text-purple-700 border-purple-250 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900";
                                        } else if (status === LeadStatus.WON) {
                                            badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-400 font-extrabold";
                                            displayLabel = "موفق";
                                        } else if (status === LeadStatus.LOST) {
                                            badgeColor = "bg-rose-50 text-rose-750 border-rose-250 dark:bg-rose-950/30 dark:text-rose-400 font-extrabold";
                                            displayLabel = "ناموفق";
                                        }

                                        return (
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
                                                {displayLabel}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{user.City || user.Province || '-'}</td>
                                <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500">{formatDate(user.updatedAt)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        {user.crmIsSend ? (
                                            <div className="p-2 text-emerald-500" title={`ارسال شده به CRM توسط ${user.crmPerson} در تاریخ ${formatDateForTooltip(user.crmDate)}`}>
                                                <CheckCircleIcon className="w-5 h-5" />
                                            </div>
                                        ) : (
                                            <button 
                                                disabled={!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin}
                                                onClick={() => onSendToCrm(user)} 
                                                className={`p-2 rounded-xl transition-colors ${!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                                                title="ارسال به CRM"
                                            >
                                                <SendToCrmIcon />
                                            </button>
                                        )}
                                        <button 
                                            disabled={!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin}
                                            onClick={() => onRegisterOrder(user)} 
                                            className={`p-2 rounded-xl transition-colors ${!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                                            title="ثبت سفارش فروش"
                                        >
                                            <ClipboardListIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            disabled={!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin}
                                            onClick={() => onViewDetails(user)} 
                                            className={`p-2 rounded-xl transition-colors ${!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30'}`}
                                            title="گفتگو"
                                        >
                                            <ChatIcon />
                                        </button>
                                        <button 
                                            disabled={!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin}
                                            onClick={() => onEdit(user)} 
                                            className={`p-2 rounded-xl transition-colors ${!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30'}`}
                                            title="ویرایش"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button 
                                            disabled={!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin}
                                            onClick={() => onDelete(user.id)} 
                                            className={`p-2 rounded-xl transition-colors ${!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
                                            title="حذف"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden flex flex-col gap-3 pb-20">
                {users.map((user) => (
                    <div 
                        key={user.id} 
                        className={`relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border transition-all 
                        ${selectedUserIds.has(user.id) ? 'border-sky-500 ring-1 ring-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-slate-100 dark:border-slate-700'}
                        `}
                    >
                        <div className="flex items-start gap-3">
                            <div 
                                onClick={(e) => { e.stopPropagation(); onSelectionChange(user.id); }}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors mt-1 ${selectedUserIds.has(user.id) ? 'bg-sky-500 border-sky-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'}`}
                            >
                                {selectedUserIds.has(user.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                            </div>

                            <div className="flex-1 min-w-0" onClick={() => onViewDetails(user)}>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{user.FullName}</h3>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded-full flex-shrink-0 font-mono">{formatDate(user.updatedAt)}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold truncate max-w-[100px]">
                                        {user.CarModel || 'بدون خودرو'}
                                    </span>
                                    {(() => {
                                        const status = user.leadStatus || LeadStatus.NEW;
                                        let badgeColor = "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600";
                                        let displayLabel = status as string;

                                        if (status === LeadStatus.NEW) {
                                            badgeColor = "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-600";
                                        } else if (status === LeadStatus.CONTACTED) {
                                            badgeColor = "bg-sky-50 text-sky-750 border-sky-250 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900";
                                        } else if (status === LeadStatus.MEETING) {
                                            badgeColor = "bg-yellow-50 text-yellow-850 border-yellow-250 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-900";
                                        } else if (status === LeadStatus.NEGOTIATION) {
                                            badgeColor = "bg-purple-50 text-purple-750 border-purple-250 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900";
                                        } else if (status === LeadStatus.WON) {
                                            badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-400 font-extrabold";
                                            displayLabel = "موفق";
                                        } else if (status === LeadStatus.LOST) {
                                            badgeColor = "bg-rose-50 text-rose-750 border-rose-250 dark:bg-rose-950/30 dark:text-rose-400 font-extrabold";
                                            displayLabel = "ناموفق";
                                        }

                                        return (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${badgeColor}`}>
                                                {displayLabel}
                                            </span>
                                        );
                                    })()}
                                    <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 font-mono" dir="ltr">
                                        <PhoneIcon className="w-3 h-3 mr-1" />
                                        {user.Number}
                                    </div>
                                </div>
                                {user.reservedByUserId && (
                                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg w-fit">
                                        <SecurityIcon className="w-3.5 h-3.5" />
                                        <span>رزرو شده توسط: <b>{user.reservedByUserName}</b></span>
                                    </div>
                                )}
                                {user.crmIsSend ? (
                                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                        <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                                        <div>
                                            <span className="font-semibold text-[10px]">ارسال به CRM توسط {user.crmPerson}</span>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <button 
                                    disabled={!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin}
                                    onClick={(e) => { e.stopPropagation(); onRegisterOrder(user); }} 
                                    className={`p-2 rounded-xl ${!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin ? 'text-slate-300 bg-slate-50 dark:bg-slate-800' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'}`} 
                                    title="ثبت سفارش"
                                >
                                    <ClipboardListIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    disabled={!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin}
                                    onClick={(e) => { e.stopPropagation(); onViewDetails(user); }} 
                                    className={`p-2 rounded-xl ${!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin ? 'text-slate-300 bg-slate-50 dark:bg-slate-800' : 'text-sky-600 bg-sky-50 dark:bg-sky-900/30'}`}
                                >
                                    <ChatIcon className="w-5 h-5" />
                                </button>
                                {!user.crmIsSend && (
                                    <button 
                                        disabled={!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin}
                                        onClick={(e) => { e.stopPropagation(); onSendToCrm(user); }} 
                                        className={`p-2 rounded-xl ${!!user.reservedByUserId && user.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin ? 'text-slate-300 bg-slate-50 dark:bg-slate-800' : 'text-blue-600 bg-blue-50 dark:bg-blue-900/30'}`}
                                        title="ارسال به CRM"
                                    >
                                        <SendToCrmIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserTable;
