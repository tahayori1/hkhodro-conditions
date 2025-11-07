import React, { useEffect, useRef, useState } from 'react';
import type { User, ActiveLead, LeadMessage, Car, CarSaleCondition } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import Spinner from './Spinner';
import { SendIcon } from './icons/SendIcon';

interface LeadDetailHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: User | ActiveLead | null;
    fullUserDetails: User | null;
    messages: LeadMessage[];
    isLoading: boolean;
    error: string | null;
    onSendMessage: (message: string) => Promise<void>;
    car: Car | null;
    conditions: CarSaleCondition[];
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
    <div>
        <span className="text-xs text-slate-500">{label}</span>
        <p className="text-sm font-semibold text-slate-800">{value || '-'}</p>
    </div>
);

const LeadDetailHistoryModal: React.FC<LeadDetailHistoryModalProps> = ({ isOpen, onClose, lead, fullUserDetails, messages, isLoading, error, onSendMessage, car, conditions }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && !isLoading && messages.length > 0) {
            setTimeout(scrollToBottom, 100);
        }
    }, [isOpen, isLoading, messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [newMessage]);
    
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
    
    const handleQuickSend = (text: string) => {
        setNewMessage(prev => prev ? `${prev}\n\n${text}`.trim() : text);
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    const formatConditions = (): string => {
        if (!car || conditions.length === 0) return '';
        let text = `شرایط فروش موجود برای ${car.name}:\n`;
        text += conditions.map(c => 
            `- ${c.sale_type} (${c.pay_type}): پیش پرداخت ${c.initial_deposit.toLocaleString('fa-IR')} تومان، تحویل ${c.delivery_time}`
        ).join('\n');
        return text;
    };

    const formatTechSpecs = (): string => {
        if (!car || !car.technical_specs) return '';
        return `مشخصات فنی خودرو ${car.name}:\n\n${car.technical_specs}`;
    };

    const formatComfortFeatures = (): string => {
        if (!car || !car.comfort_features) return '';
        return `امکانات رفاهی خودرو ${car.name}:\n\n${car.comfort_features}`;
    };

    if (!isOpen || !lead) return null;

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            return new Intl.DateTimeFormat('fa-IR', {
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
    
    const leadName = ('FullName' in lead && lead.FullName) || (fullUserDetails?.FullName);
    const leadNumber = 'number' in lead ? lead.number : lead.Number;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                           جزئیات و تاریخچه سرنخ
                        </h2>
                        <p className="text-sm text-slate-500" dir="ltr">
                            {leadNumber} {leadName && `(${leadName})`}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full"><Spinner /></div>
                    ) : error ? (
                         <div className="flex justify-center items-center h-full"><p className="text-red-500">{error}</p></div>
                    ) : (
                        <>
                            {/* User Details Section */}
                            <div className="p-4 bg-slate-50 border-b">
                                <h3 className="text-md font-bold text-slate-700 mb-3">اطلاعات سرنخ</h3>
                                {fullUserDetails ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <DetailItem label="خودروی درخواستی" value={fullUserDetails.CarModel} />
                                        <DetailItem label="استان" value={fullUserDetails.Province} />
                                        <DetailItem label="شهر" value={fullUserDetails.City} />
                                        <DetailItem label="مرجع" value={fullUserDetails.reference} />
                                        <DetailItem label="زمان ثبت" value={formatDate(fullUserDetails.RegisterTime)} />
                                        <DetailItem label="آخرین فعالیت" value={formatDate(fullUserDetails.LastAction)} />
                                        {fullUserDetails.Decription && (
                                            <div className="col-span-full">
                                                <DetailItem label="توضیحات" value={<span className="whitespace-pre-wrap">{fullUserDetails.Decription}</span>} />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                     <p className="text-slate-500 text-sm">جزئیات کامل کاربر یافت نشد.</p>
                                )}
                            </div>

                            {/* Messages Section */}
                            <div className="p-4">
                                {messages.length === 0 ? (
                                    <div className="flex justify-center items-center py-10">
                                        <p className="text-slate-500">تاریخچه پیامی برای این شماره یافت نشد.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((msg) => (
                                            <div key={msg.id} className={`flex items-end gap-2 ${msg.receive === 1 ? 'justify-start' : 'justify-end'}`}>
                                                <div className={`max-w-xs md:max-w-md p-3 rounded-xl ${msg.receive === 1 ? 'bg-sky-100 text-slate-800' : 'bg-slate-200 text-slate-800'}`}>
                                                    <div className="prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={{ __html: msg.Message }} />
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
                            </div>
                        </>
                    )}
                </main>
                
                <footer className="p-3 border-t bg-white flex-shrink-0">
                    {!isLoading && car && (
                        <div className="p-2 mb-2 border-b">
                            <p className="text-sm font-semibold text-slate-600 mb-2">ارسال سریع:</p>
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => handleQuickSend(formatConditions())}
                                    disabled={conditions.length === 0}
                                    className="text-xs px-3 py-1 bg-slate-200 text-slate-700 rounded-full hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    شرایط فروش
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => handleQuickSend(formatTechSpecs())}
                                    disabled={!car.technical_specs}
                                    className="text-xs px-3 py-1 bg-slate-200 text-slate-700 rounded-full hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    مشخصات فنی
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => handleQuickSend(formatComfortFeatures())}
                                    disabled={!car.comfort_features}
                                    className="text-xs px-3 py-1 bg-slate-200 text-slate-700 rounded-full hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    امکانات رفاهی
                                </button>
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        <textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="محل تایپ کردن پاسخ..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition resize-y min-h-[44px] max-h-36"
                            disabled={isSending || isLoading}
                            autoComplete="off"
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={isSending || isLoading || !newMessage.trim()}
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

export default LeadDetailHistoryModal;