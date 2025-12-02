
import React, { useState } from 'react';
import { CalendarIcon } from '../components/icons/CalendarIcon';

const LeaveRequestsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
    const [requestType, setRequestType] = useState<'HOURLY' | 'DAILY'>('HOURLY');
    const [requests, setRequests] = useState([
        { id: 1, type: 'ساعتی', date: '1403/08/20', amount: '2 ساعت', reason: 'کار بانکی', status: 'APPROVED' },
        { id: 2, type: 'روزانه', date: '1403/08/10', amount: '1 روز', reason: 'کسالت', status: 'REJECTED' },
    ]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('درخواست شما ثبت شد و به کارتابل مدیر ارسال گردید.');
        setActiveTab('HISTORY');
    };

    return (
        <div className="container mx-auto px-4 py-8 pb-24">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                    <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">درخواست مرخصی</h2>
                    <p className="text-sm text-slate-500">مدیریت تردد و مرخصی‌ها</p>
                </div>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 w-full max-w-md mx-auto">
                <button onClick={() => setActiveTab('NEW')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'NEW' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500'}`}>ثبت درخواست جدید</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500'}`}>سوابق من</button>
            </div>

            {activeTab === 'NEW' ? (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm max-w-md mx-auto border border-slate-100 dark:border-slate-700">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نوع مرخصی</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={requestType === 'HOURLY'} onChange={() => setRequestType('HOURLY')} className="text-purple-600 focus:ring-purple-500" />
                                    <span className="text-slate-600 dark:text-slate-400">ساعتی</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={requestType === 'DAILY'} onChange={() => setRequestType('DAILY')} className="text-purple-600 focus:ring-purple-500" />
                                    <span className="text-slate-600 dark:text-slate-400">روزانه</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاریخ</label>
                            <input type="text" placeholder="۱۴۰۳/--/--" className="w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>

                        {requestType === 'HOURLY' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">از ساعت</label>
                                    <input type="time" className="w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-700 dark:border-slate-600 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">تا ساعت</label>
                                    <input type="time" className="w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-700 dark:border-slate-600 outline-none" />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تعداد روز</label>
                                <input type="number" className="w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-700 dark:border-slate-600 outline-none" placeholder="1" />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">علت مرخصی</label>
                            <textarea rows={3} className="w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-purple-500" placeholder="توضیحات..."></textarea>
                        </div>

                        <button type="submit" className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 dark:shadow-none">ارسال درخواست</button>
                    </form>
                </div>
            ) : (
                <div className="max-w-md mx-auto space-y-3">
                    {requests.map(req => (
                        <div key={req.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-slate-800 dark:text-white mb-1">{req.type} - {req.amount}</div>
                                <div className="text-xs text-slate-500">{req.date} | {req.reason}</div>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-xs font-bold ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {req.status === 'APPROVED' ? 'تایید شد' : 'رد شد'}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeaveRequestsPage;
