import React, { useEffect, useRef, useState } from 'react';
import type { User, ActiveLead, LeadMessage } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import Spinner from './Spinner';
import { SendIcon } from './icons/SendIcon';

interface LeadHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: User | ActiveLead | null;
    messages: LeadMessage[];
    isLoading: boolean;
    error: string | null;
    onSendMessage: (message: string) => Promise<void>;
}

const LeadHistoryModal: React.FC<LeadHistoryModalProps> = ({ isOpen, onClose, lead, messages, isLoading, error, onSendMessage }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && messages.length > 0) {
            // Use timeout to ensure the DOM has been updated before scrolling
            setTimeout(scrollToBottom, 100);
        }
    }, [isOpen, messages]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await onSendMessage(newMessage);
            setNewMessage('');
        } catch (error) {
            // Error is handled in the parent component with a toast
        } finally {
            setIsSending(false);
        }
    };


    if (!isOpen || !lead) return null;

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            return new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(dateString));
        } catch (e) {
            return dateString;
        }
    };
    
    const leadName = 'FullName' in lead && lead.FullName ? lead.FullName : null;
    const leadNumber = 'number' in lead ? lead.number : lead.Number;
    const leadCarModel = 'CarModel' in lead && lead.CarModel ? lead.CarModel : null;


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            تاریخچه گفتگو {leadCarModel && <span className="text-sky-700">- {leadCarModel}</span>}
                        </h2>
                        <p className="text-sm text-slate-500" dir="ltr">
                            {leadNumber} {leadName && `(${leadName})`}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </header>

                <main className="p-4 flex-grow overflow-y-auto bg-slate-50">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Spinner />
                        </div>
                    ) : error ? (
                         <div className="flex justify-center items-center h-full">
                            <p className="text-red-500">{error}</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-slate-500">تاریخچه پیامی برای این شماره یافت نشد.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex items-end gap-2 ${msg.receive === 1 ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-xs md:max-w-md p-3 rounded-xl ${msg.receive === 1 ? 'bg-sky-100 text-slate-800' : 'bg-slate-200 text-slate-800'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.Message}</p>
                                        <div className={`text-xs mt-2 ${msg.receive === 1 ? 'text-slate-500' : 'text-slate-500'}`}>
                                            <span>{formatDate(msg.createdAt)}</span>
                                            {msg.media && <span className="font-semibold"> ({msg.media})</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                             <div ref={messagesEndRef} />
                        </div>
                    )}
                </main>
                
                <footer className="p-3 border-t bg-white flex-shrink-0">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="محل تایپ کردن پاسخ..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                            disabled={isSending}
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            disabled={isSending || !newMessage.trim()}
                            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors flex items-center justify-center disabled:bg-sky-400 disabled:cursor-not-allowed w-28"
                            aria-label="ارسال پیام"
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <SendIcon className="ml-2"/>
                                    ارسال
                                </>
                            )}
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default LeadHistoryModal;