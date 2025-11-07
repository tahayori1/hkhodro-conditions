import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { BroadcastIcon } from './icons/BroadcastIcon';

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string, onProgress: (progress: { sent: number; errors: number }) => void) => Promise<{finalSuccess: number, finalErrors: number}>;
    recipientCount: number;
}

const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose, onSend, recipientCount }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState<{ sent: number; errors: number } | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) return;

        setIsSending(true);
        setIsFinished(false);
        setProgress({ sent: 0, errors: 0 });

        await onSend(message, (p) => {
            setProgress(p);
        });
        
        setIsFinished(true);
        setIsSending(false);
    };
    
    const handleClose = () => {
        if (isSending) return;
        setMessage('');
        setIsSending(false);
        setIsFinished(false);
        setProgress(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={handleClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <BroadcastIcon className="w-6 h-6 text-sky-600" />
                        <div>
                             <h2 className="text-xl font-bold text-slate-800">ارسال پیام گروهی</h2>
                             <p className="text-sm text-slate-500">
                                به {recipientCount.toLocaleString('fa-IR')} گیرنده
                             </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-slate-500 hover:text-slate-800 disabled:opacity-50" disabled={isSending}>
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-6">
                    {isFinished ? (
                         <div className="text-center p-4 rounded-lg bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 mb-2">ارسال تکمیل شد</h3>
                            <p className="text-slate-600">
                                {progress?.sent.toLocaleString('fa-IR')} پیام با موفقیت ارسال شد.
                            </p>
                             {progress && progress.errors > 0 && (
                                <p className="text-red-600 mt-1">
                                    ارسال {progress.errors.toLocaleString('fa-IR')} پیام با خطا مواجه شد.
                                </p>
                             )}
                        </div>
                    ) : (
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            placeholder="پیام خود را اینجا بنویسید..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                            disabled={isSending}
                        />
                    )}

                    {isSending && progress && (
                        <div className="mt-4">
                            <div className="flex justify-between text-sm font-medium text-slate-600 mb-1">
                                <span>در حال ارسال...</span>
                                <span>{progress.sent.toLocaleString('fa-IR')} / {recipientCount.toLocaleString('fa-IR')}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                                <div 
                                    className="bg-sky-600 h-2.5 rounded-full transition-all duration-300" 
                                    style={{ width: `${(progress.sent / recipientCount) * 100}%` }}
                                ></div>
                            </div>
                            {progress.errors > 0 && <p className="text-red-500 text-xs mt-1 text-right">خطاها: {progress.errors}</p>}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
                    <button 
                        type="button" 
                        onClick={handleClose} 
                        disabled={isSending}
                        className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 disabled:opacity-50"
                    >
                        {isFinished ? 'بستن' : 'انصراف'}
                    </button>
                    {!isFinished && (
                        <button 
                            type="button" 
                            onClick={handleSend}
                            disabled={isSending || !message.trim()}
                            className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-400 disabled:cursor-not-allowed flex items-center justify-center w-32"
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'ارسال'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BroadcastModal;
