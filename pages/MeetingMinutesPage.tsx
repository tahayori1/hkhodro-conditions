
import React, { useState } from 'react';
import { UserGroupIcon } from '../components/icons/UserGroupIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { CloseIcon } from '../components/icons/CloseIcon';

interface Meeting {
    id: number;
    title: string;
    date: string;
    attendees: string;
    decisions: string;
}

const MeetingMinutesPage: React.FC = () => {
    const [meetings, setMeetings] = useState<Meeting[]>([
        { id: 1, title: 'جلسه هفتگی فروش', date: '1403/08/22', attendees: 'آقای حسینی، تیم فروش', decisions: '۱. افزایش تارگت T8 به ۱۵ عدد\n۲. برگزاری کمپین اینستاگرام' }
    ]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMeeting, setNewMeeting] = useState<Partial<Meeting>>({});

    const handleSave = () => {
        if (!newMeeting.title) return;
        const meeting: Meeting = {
            id: Date.now(),
            title: newMeeting.title,
            date: newMeeting.date || new Date().toLocaleDateString('fa-IR'),
            attendees: newMeeting.attendees || '',
            decisions: newMeeting.decisions || ''
        };
        setMeetings([meeting, ...meetings]);
        setIsModalOpen(false);
        setNewMeeting({});
    };

    return (
        <div className="container mx-auto px-4 py-8 pb-24">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <UserGroupIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">صورت‌جلسات</h2>
                        <p className="text-sm text-slate-500">آرشیو تصمیمات و جلسات داخلی</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    <PlusIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">ثبت جلسه جدید</span>
                </button>
            </div>

            <div className="grid gap-4">
                {meetings.map(m => (
                    <div key={m.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{m.title}</h3>
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono">{m.date}</span>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-slate-400">حاضرین: </span>
                                <span className="text-slate-700 dark:text-slate-200 font-medium">{m.attendees}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                <span className="block text-slate-400 mb-1 text-xs">مصوبات و تصمیمات:</span>
                                <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{m.decisions}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">ثبت صورت‌جلسه جدید</h3>
                            <button onClick={() => setIsModalOpen(false)}><CloseIcon className="text-slate-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <input placeholder="عنوان جلسه" className="w-full p-3 border rounded-lg bg-transparent dark:border-slate-600 dark:text-white" onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} />
                            <input placeholder="تاریخ (۱۴۰۳/--/--)" className="w-full p-3 border rounded-lg bg-transparent dark:border-slate-600 dark:text-white" onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} />
                            <input placeholder="اسامی حاضرین" className="w-full p-3 border rounded-lg bg-transparent dark:border-slate-600 dark:text-white" onChange={e => setNewMeeting({...newMeeting, attendees: e.target.value})} />
                            <textarea placeholder="شرح مصوبات و تصمیمات..." className="w-full p-3 border rounded-lg bg-transparent dark:border-slate-600 dark:text-white" rows={4} onChange={e => setNewMeeting({...newMeeting, decisions: e.target.value})} />
                            <button onClick={handleSave} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">ذخیره جلسه</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingMinutesPage;
