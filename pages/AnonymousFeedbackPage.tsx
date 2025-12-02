
import React, { useState } from 'react';
import { GhostIcon } from '../components/icons/GhostIcon';

const AnonymousFeedbackPage: React.FC = () => {
    // Mode toggle for demo purposes (Staff vs Manager)
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Mock Data
    const [feedbacks] = useState([
        { id: 1, text: 'لطفاً وضعیت تهویه سالن فروش را بررسی کنید، بعد از ظهرها خیلی گرم است.', date: '1403/08/21' },
        { id: 2, text: 'رفتار مدیر فروش با پرسنل جدید بسیار محترمانه و عالی است.', date: '1403/08/20' }
    ]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFeedbackText('');
            alert('پیام شما به صورت کاملاً ناشناس ثبت شد.');
        }, 1500);
    };

    return (
        <div className="container mx-auto px-4 py-8 pb-24">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-200 text-slate-600 rounded-xl">
                        <GhostIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">صندوق انتقادات و پیشنهادات</h2>
                        <p className="text-sm text-slate-500">ارسال پیام ناشناس و محرمانه</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => setIsAdminMode(!isAdminMode)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                >
                    {isAdminMode ? 'Switch to Staff' : 'Switch to Admin'}
                </button>
            </div>

            {!isAdminMode ? (
                <div className="max-w-lg mx-auto bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 text-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">ارسال پیام ناشناس</h3>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        هویت شما در این بخش کاملاً مخفی می‌ماند. لطفاً صادقانه نقد یا پیشنهاد خود را بنویسید تا به بهبود سازمان کمک کنید.
                    </p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                            placeholder="پیام خود را اینجا بنویسید..."
                            required
                        ></textarea>
                        <button 
                            type="submit" 
                            disabled={submitted || !feedbackText}
                            className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all disabled:opacity-50"
                        >
                            {submitted ? 'در حال ارسال...' : 'ارسال محرمانه'}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="grid gap-4 max-w-2xl mx-auto">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4 text-amber-800 text-sm">
                        شما در حال مشاهده صندوق پیام‌های دریافتی هستید (حالت مدیر).
                    </div>
                    {feedbacks.map(fb => (
                        <div key={fb.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative">
                            <div className="absolute top-4 left-4 text-slate-300">
                                <GhostIcon className="w-12 h-12 opacity-20" />
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 font-medium mb-4 relative z-10 leading-relaxed">
                                "{fb.text}"
                            </p>
                            <div className="text-xs text-slate-400 text-left font-mono">
                                دریافت شده در: {fb.date}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnonymousFeedbackPage;
