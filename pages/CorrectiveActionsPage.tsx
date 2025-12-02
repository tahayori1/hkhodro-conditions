
import React, { useState } from 'react';
import { ClipboardIcon } from '../components/icons/ClipboardIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { CloseIcon } from '../components/icons/CloseIcon';

interface ActionItem {
    id: number;
    title: string;
    description: string;
    rootCause: string;
    solution: string;
    status: 'OPEN' | 'DONE';
    date: string;
}

const CorrectiveActionsPage: React.FC = () => {
    const [actions, setActions] = useState<ActionItem[]>([
        { id: 1, title: 'تاخیر در تحویل خودروهای T8', description: 'مشتریان از تاخیر ۲ هفته‌ای شاکی هستند', rootCause: 'تاخیر در صدور پلاک', solution: 'پیگیری روزانه از راهور توسط آقای حسینی', status: 'OPEN', date: '1403/08/20' },
        { id: 2, title: 'عدم تطابق موجودی انبار', description: 'تعداد فیلترهای هوا با سیستم نمی‌خواند', rootCause: 'عدم ثبت خروج کالا توسط مکانیک', solution: 'الزام به امضای برگه خروج', status: 'DONE', date: '1403/08/15' },
    ]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItem, setNewItem] = useState<Partial<ActionItem>>({});

    const handleSave = () => {
        if (!newItem.title || !newItem.rootCause) return;
        const action: ActionItem = {
            id: Date.now(),
            title: newItem.title,
            description: newItem.description || '',
            rootCause: newItem.rootCause,
            solution: newItem.solution || '',
            status: 'OPEN',
            date: new Date().toLocaleDateString('fa-IR')
        };
        setActions([action, ...actions]);
        setIsModalOpen(false);
        setNewItem({});
    };

    const toggleStatus = (id: number) => {
        setActions(actions.map(a => a.id === id ? { ...a, status: a.status === 'OPEN' ? 'DONE' : 'OPEN' } : a));
    };

    return (
        <div className="container mx-auto px-4 py-8 pb-24">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                        <ClipboardIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">اقدامات اصلاحی (ISO)</h2>
                        <p className="text-sm text-slate-500">ثبت عدم انطباق‌ها و راهکارها</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-700">
                    <PlusIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">ثبت مورد جدید</span>
                </button>
            </div>

            <div className="grid gap-4">
                {actions.map(action => (
                    <div key={action.id} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border-r-4 shadow-sm ${action.status === 'DONE' ? 'border-green-500 opacity-80' : 'border-rose-500'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{action.title}</h3>
                            <span className="text-xs text-slate-400 font-mono">{action.date}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{action.description}</p>
                        
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg mb-4 text-sm">
                            <div className="mb-2">
                                <span className="font-bold text-rose-600 dark:text-rose-400">علت ریشه‌ای: </span>
                                <span className="text-slate-700 dark:text-slate-200">{action.rootCause}</span>
                            </div>
                            <div>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">راهکار: </span>
                                <span className="text-slate-700 dark:text-slate-200">{action.solution}</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => toggleStatus(action.id)} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${action.status === 'DONE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-green-50'}`}>
                                {action.status === 'DONE' ? 'انجام شده ✅' : 'باز (در حال پیگیری)'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">ثبت اقدام اصلاحی جدید</h3>
                            <button onClick={() => setIsModalOpen(false)}><CloseIcon className="text-slate-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <input placeholder="عنوان مشکل" className="w-full p-3 border rounded-lg bg-transparent dark:border-slate-600 dark:text-white" onChange={e => setNewItem({...newItem, title: e.target.value})} />
                            <textarea placeholder="شرح ماجرا" className="w-full p-3 border rounded-lg bg-transparent dark:border-slate-600 dark:text-white" rows={2} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                            <textarea placeholder="علت ریشه‌ای (Root Cause)" className="w-full p-3 border border-rose-300 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-800 rounded-lg text-rose-900 dark:text-rose-200" rows={2} onChange={e => setNewItem({...newItem, rootCause: e.target.value})} />
                            <textarea placeholder="راهکار پیشنهادی / اقدام" className="w-full p-3 border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800 rounded-lg text-emerald-900 dark:text-emerald-200" rows={2} onChange={e => setNewItem({...newItem, solution: e.target.value})} />
                            <button onClick={handleSave} className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700">ثبت و ذخیره</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CorrectiveActionsPage;
