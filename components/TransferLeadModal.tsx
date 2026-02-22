
import React, { useState } from 'react';
import { User, StaffUser } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface TransferLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTransfer: (userId: number, newOwnerId: number, newOwnerName: string) => void;
    user: User | null;
    staffUsers: StaffUser[];
}

const TransferLeadModal: React.FC<TransferLeadModalProps> = ({ isOpen, onClose, onTransfer, user, staffUsers }) => {
    const [selectedStaffId, setSelectedStaffId] = useState<string | number>('');

    if (!isOpen || !user) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const staff = staffUsers.find(s => s.id.toString() === selectedStaffId.toString());
        if (staff) {
            onTransfer(user.id, Number(staff.id), staff.fullName);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">انتقال مشتری</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            مشتری <span className="font-bold text-slate-900 dark:text-white">{user.FullName}</span> به کدام کاربر منتقل شود؟
                        </p>
                        <label htmlFor="staffSelect" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">انتخاب کاربر مقصد</label>
                        <select 
                            id="staffSelect" 
                            value={selectedStaffId} 
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                            required
                        >
                            <option value="">انتخاب کنید...</option>
                            {staffUsers.map(staff => (
                                <option key={staff.id} value={staff.id}>{staff.fullName} ({staff.username})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-6 py-2.5 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 font-bold transition-colors"
                        >
                            انصراف
                        </button>
                        <button 
                            type="submit" 
                            disabled={!selectedStaffId}
                            className={`px-8 py-2.5 bg-sky-600 text-white rounded-xl font-bold transition-all shadow-md shadow-sky-200 dark:shadow-none ${!selectedStaffId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sky-700 active:scale-95'}`}
                        >
                            تایید انتقال
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransferLeadModal;
