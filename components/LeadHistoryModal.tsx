
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LeadStatus } from '../types';
import type { User, LeadMessage, Car, CarSaleCondition, CustomerJournal, MyProfile } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import Spinner from './Spinner';
import { SendIcon } from './icons/SendIcon';
import ConditionSelectionModal from './ConditionSelectionModal';
import { SendToCrmIcon } from './icons/SendToCrmIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ChatIcon } from './icons/ChatIcon';
import { ChatAltIcon } from './icons/ChatAltIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { SecurityIcon } from './icons/SecurityIcon';
import Toast from './Toast';
import { getCustomerJournals, createCustomerJournal, getMyProfile } from '../services/api';

interface LeadDetailHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: User | null;
    fullUserDetails: User | null;
    messages: LeadMessage[];
    isLoading: boolean;
    error: string | null;
    onSendMessage: (message: string, type: 'SMS' | 'WHATSAPP') => Promise<void>;
    onSendToCrm: (user: User) => Promise<void>;
    onRegisterOrder: (user: User) => void;
    cars: Car[];
    conditions: CarSaleCondition[];
    loggedInUser: MyProfile | null;
    onStatusChange?: (userId: number, newStatus: LeadStatus) => Promise<void>;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
    <div>
        <span className="text-xs text-slate-500">{label}</span>
        <p className="text-sm font-semibold text-slate-800">{value || '-'}</p>
    </div>
);

const LeadDetailHistoryModal: React.FC<LeadDetailHistoryModalProps> = ({ 
    isOpen, onClose, lead, fullUserDetails, messages, isLoading, error, 
    onSendMessage, onSendToCrm, onRegisterOrder, cars, conditions, loggedInUser,
    onStatusChange
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [activeTab, setActiveTab] = useState<'MESSAGES' | 'JOURNALS'>('MESSAGES');
    
    // Message State
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isCrmSending, setIsCrmSending] = useState(false);
    const [quickSendCarModel, setQuickSendCarModel] = useState('');
    const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Journal State
    const [journals, setJournals] = useState<CustomerJournal[]>([]);
    const [newJournalContent, setNewJournalContent] = useState('');
    const [isJournalLoading, setIsJournalLoading] = useState(false);
    const [isJournalSending, setIsJournalSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && activeTab === 'MESSAGES' && !isLoading && messages.length > 0) {
            setTimeout(scrollToBottom, 100);
        }
    }, [isOpen, activeTab, isLoading, messages]);

    useEffect(() => {
        if (isOpen && (lead || fullUserDetails)) {
            const initialCarModel = fullUserDetails?.CarModel || lead?.CarModel || '';
            setQuickSendCarModel(initialCarModel);
            // Default to messages
            setActiveTab('MESSAGES');
            // Fetch current user for author name
            getMyProfile().then(p => setCurrentUser(p));
        } else if (!isOpen) {
            setQuickSendCarModel('');
            setNewMessage('');
            setNewJournalContent('');
            setValidationError(null);
        }
    }, [isOpen, lead, fullUserDetails]);

    const fetchJournals = useCallback(async () => {
        if (!fullUserDetails && !lead) return;
        setIsJournalLoading(true);
        try {
            const userId = fullUserDetails?.id || lead?.id;
            if (userId) {
                const data = await getCustomerJournals(userId);
                setJournals(data);
            }
        } catch (e) {
            console.error("Failed to fetch journals", e);
        } finally {
            setIsJournalLoading(false);
        }
    }, [fullUserDetails, lead]);

    useEffect(() => {
        if (activeTab === 'JOURNALS' && isOpen) {
            fetchJournals();
        }
    }, [activeTab, isOpen, fetchJournals]);


    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [newMessage]);
    
    const handleSendSMS = async () => {
        if (!newMessage.trim() || isSending) return;

        if (newMessage.length > 170) {
            setValidationError('متن پیامک نمی‌تواند بیشتر از ۱۷۰ کاراکتر باشد.');
            return;
        }
        
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i;
        if (urlRegex.test(newMessage)) {
            setValidationError('ارسال لینک در پیامک مجاز نیست.');
            return;
        }

        setIsSending(true);
        try {
            await onSendMessage(newMessage, 'SMS');
            setNewMessage('');
        } catch (error) {
        } finally {
            setIsSending(false);
        }
    };

    const handleSendWhatsApp = async () => {
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await onSendMessage(newMessage, 'WHATSAPP');
            setNewMessage('');
        } catch (error) {
        } finally {
            setIsSending(false);
        }
    };
    
    const handleSendToCrm = async () => {
        if (fullUserDetails && !isCrmSending) {
            setIsCrmSending(true);
            try {
                await onSendToCrm(fullUserDetails);
            } finally {
                setIsCrmSending(false);
            }
        }
    };

    const handleQuickSend = (text: string) => {
        setNewMessage(prev => prev ? `${prev}\n\n${text}`.trim() : text);
        setTimeout(() => textareaRef.current?.focus(), 0);
    };
    
    const handleAddJournal = async () => {
        if (!newJournalContent.trim() || isJournalSending) return;
        const userId = fullUserDetails?.id || lead?.id;
        if (!userId) return;

        setIsJournalSending(true);
        try {
            await createCustomerJournal({
                userId,
                content: newJournalContent,
                author: currentUser?.full_name || currentUser?.username || 'کاربر سیستم'
            });
            setNewJournalContent('');
            fetchJournals();
        } catch (e) {
            console.error("Failed to add journal", e);
        } finally {
            setIsJournalSending(false);
        }
    };

    const handleQuickStatusChange = async (newStatus: LeadStatus) => {
        const userId = fullUserDetails?.id || lead?.id;
        if (!userId || isJournalSending) return;

        setIsJournalSending(true);
        try {
            const authorName = currentUser?.full_name || currentUser?.username || 'کاربر سیستم';
            // 1. Submit the new journal report to record the status change
            await createCustomerJournal({
                userId,
                content: `تغییر وضعیت سرنخ به "${newStatus}"`,
                author: authorName
            });

            // 2. Trigger the callback to update the lead's status (PUT user)
            if (onStatusChange) {
                await onStatusChange(userId, newStatus);
            }

            // 3. Re-fetch journals so the list refreshes
            fetchJournals();
        } catch (e) {
            console.error("Failed to update status and register journal", e);
        } finally {
            setIsJournalSending(false);
        }
    };

    const handleConditionsSelected = (selectedConditions: CarSaleCondition[]) => {
        if (selectedConditions.length === 0) return;

        const textParts = selectedConditions.map(c => {
            const descriptionsText = c.descriptions ? c.descriptions : 'ندارد';
            return `*شرایط فروش خودروی ${c.car_model} - مدل ${c.model}*

- *نوع فروش:* ${c.sale_type} (${c.pay_type})
- *وضعیت:* ${c.status}
- *وضعیت سند:* ${c.document_status}
- *زمان تحویل:* ${c.delivery_time}
- *رنگ‌ها:* ${c.colors.join('، ')}
- *پیش پرداخت:* *${c.initial_deposit.toLocaleString('fa-IR')} تومان*

*توضیحات:*
${descriptionsText}`;
        });
        
        const text = textParts.join('\n\n--------------------------------\n\n');
        
        handleQuickSend(text);
        setIsConditionModalOpen(false);
    };

    const selectedCarForQuickSend = cars.find(c => c.name === quickSendCarModel);
    const conditionsForSelectedCar = conditions.filter(c => c.car_model === quickSendCarModel);

    const formatTechSpecs = (): string => {
        if (!selectedCarForQuickSend || !selectedCarForQuickSend.technical_specs) return '';
        return `مشخصات فنی خودرو ${selectedCarForQuickSend.name}:\n\n${selectedCarForQuickSend.technical_specs}`;
    };

    const formatComfortFeatures = (): string => {
        if (!selectedCarForQuickSend || !selectedCarForQuickSend.comfort_features) return '';
        return `امکانات رفاهی خودرو ${selectedCarForQuickSend.name}:\n\n${selectedCarForQuickSend.comfort_features}`;
    };

    if (!isOpen || !lead) return null;

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const parsableDateString = dateString.replace(' ', 'T');
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(parsableDateString));
        } catch (e) {
            return dateString;
        }
    };
    
    const leadName = lead.FullName || fullUserDetails?.FullName;
    const leadNumber = lead.Number;
    const isActionDisabled = !!fullUserDetails?.reservedByUserId && fullUserDetails.reservedByUserId !== loggedInUser?.id && !loggedInUser?.isAdmin;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <header className="p-4 border-b flex-shrink-0 bg-white z-10">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                   جزئیات و تاریخچه مشتری
                                </h2>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-slate-500" dir="ltr">
                                        {leadNumber} {leadName && `(${leadName})`}
                                    </p>
                                    {fullUserDetails?.reservedByUserId && (
                                        <div className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100">
                                            <SecurityIcon className="w-3 h-3" />
                                            <span>رزرو شده توسط: <b>{fullUserDetails.reservedByUserName}</b></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    disabled={isActionDisabled}
                                    onClick={() => fullUserDetails && onRegisterOrder(fullUserDetails)} 
                                    className={`p-2 rounded-lg transition-colors ${isActionDisabled ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`} 
                                    title="ثبت سفارش فروش"
                                >
                                    <ClipboardListIcon className="w-5 h-5" />
                                </button>
                                {fullUserDetails && !fullUserDetails.crmIsSend ? (
                                    <button 
                                        disabled={isCrmSending || isActionDisabled} 
                                        onClick={handleSendToCrm} 
                                        className={`p-2 rounded-lg transition-colors ${isActionDisabled ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-wait'}`} 
                                        title="ارسال به CRM"
                                    >
                                        {isCrmSending ? <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div> : <SendToCrmIcon />}
                                    </button>
                                ) : fullUserDetails && fullUserDetails.crmIsSend ? (
                                    <div className="p-2 text-emerald-500" title={`ارسال شده توسط ${fullUserDetails.crmPerson}`}>
                                        <CheckCircleIcon />
                                    </div>
                                ) : null}
                                <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>
                        
                        {/* Tabs */}
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab('MESSAGES')}
                                className={`flex-1 pb-2 text-sm font-bold transition-colors border-b-2 ${
                                    activeTab === 'MESSAGES' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                تاریخچه پیام‌ها
                            </button>
                            <button
                                onClick={() => setActiveTab('JOURNALS')}
                                className={`flex-1 pb-2 text-sm font-bold transition-colors border-b-2 ${
                                    activeTab === 'JOURNALS' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                دفترچه گزارشات CRM
                            </button>
                        </div>
                    </header>

                    <main className="flex-grow overflow-y-auto bg-slate-50">
                        {/* Customer Info (Visible in both tabs for context) */}
                        <div className="p-4 bg-white border-b mb-2">
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

                        {activeTab === 'MESSAGES' && (
                            <div className="p-4">
                                {isLoading ? (
                                    <div className="flex justify-center items-center py-10"><Spinner /></div>
                                ) : error ? (
                                     <div className="flex justify-center items-center py-10"><p className="text-red-500">{error}</p></div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col justify-center items-center py-12 border border-dashed border-slate-200 rounded-xl">
                                        <ChatIcon className="w-12 h-12 text-slate-300 mb-2" />
                                        <p className="text-slate-500 text-sm font-medium">هیچ پیام یا تاریخچه‌ای یافت نشد.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((msg) => (
                                            <div key={msg.id} className={`flex items-end gap-2 ${msg.receive === 1 ? 'justify-start' : 'justify-end'}`}>
                                                <div className={`max-w-xs md:max-w-md p-3 rounded-xl ${msg.receive === 1 ? 'bg-white border border-slate-200 text-slate-800' : 'bg-sky-100 text-slate-800'}`}>
                                                    <div className="prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={{ __html: msg.Message }} />
                                                    <div className={`text-xs mt-2 ${msg.receive === 1 ? 'text-slate-400' : 'text-slate-500'}`}>
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
                        )}

                        {activeTab === 'JOURNALS' && (
                            <div className="p-4 flex flex-col h-full">
                                {/* Quick Status Assignment */}
                                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl mb-4 flex-shrink-0">
                                    <p className="text-xs font-bold text-slate-500 mb-2">تعیین سریع وضعیت سرنخ (ثبت گزارش خودکار):</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {[
                                            { status: LeadStatus.NEW, label: 'جدید', activeClass: 'bg-slate-200 border-slate-300 text-slate-800 ring-2 ring-slate-400', normalClass: 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' },
                                            { status: LeadStatus.CONTACTED, label: 'تماس گرفته شده', activeClass: 'bg-sky-200 border-sky-300 text-sky-800 ring-2 ring-sky-400', normalClass: 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100' },
                                            { status: LeadStatus.MEETING, label: 'جلسه حضوری', activeClass: 'bg-purple-200 border-purple-300 text-purple-800 ring-2 ring-purple-400', normalClass: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' },
                                            { status: LeadStatus.NEGOTIATION, label: 'در حال مذاکره', activeClass: 'bg-amber-200 border-amber-300 text-amber-800 ring-2 ring-amber-400', normalClass: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' },
                                            { status: LeadStatus.WON, label: 'موفق (خرید)', activeClass: 'bg-emerald-200 border-emerald-300 text-emerald-800 ring-2 ring-emerald-400', normalClass: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
                                            { status: LeadStatus.LOST, label: 'ناموفق', activeClass: 'bg-rose-200 border-rose-300 text-rose-800 ring-2 ring-rose-400', normalClass: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' },
                                            { status: LeadStatus.NO_ANSWER, label: 'پاسخ نداد', activeClass: 'bg-orange-200 border-orange-300 text-orange-800 ring-2 ring-orange-400', normalClass: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' },
                                        ].map((item) => {
                                            const currentStatus = fullUserDetails?.leadStatus || lead?.leadStatus || LeadStatus.NEW;
                                            const isActive = currentStatus === item.status;
                                            return (
                                                <button
                                                    key={item.status}
                                                    type="button"
                                                    disabled={isJournalSending || isActionDisabled}
                                                    onClick={() => handleQuickStatusChange(item.status)}
                                                    className={`border py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex justify-center items-center ${isActive ? item.activeClass : item.normalClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    {item.label}
                                                    {isActive && <span className="mr-1 text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded-full">فعال</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Journal Input */}
                                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-4 flex-shrink-0">
                                    <textarea
                                        value={newJournalContent}
                                        onChange={(e) => setNewJournalContent(e.target.value)}
                                        placeholder="نوشتن گزارش جدید..."
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm resize-none mb-2"
                                        rows={3}
                                    ></textarea>
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={handleAddJournal} 
                                            disabled={!newJournalContent.trim() || isJournalSending}
                                            className="bg-sky-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isJournalSending ? 'در حال ثبت...' : 'ثبت گزارش'}
                                        </button>
                                    </div>
                                </div>

                                {/* Journal List */}
                                <div className="space-y-3 flex-grow overflow-y-auto">
                                    {isJournalLoading ? (
                                        <div className="flex justify-center py-10"><Spinner /></div>
                                    ) : journals.length === 0 ? (
                                        <div className="text-center text-slate-400 py-10 text-sm">هیچ گزارشی ثبت نشده است.</div>
                                    ) : (
                                        journals.map(journal => (
                                            <div key={journal.id} className="bg-white p-4 rounded-xl border-r-4 border-l border-y border-r-amber-400 border-l-slate-200 border-y-slate-200 shadow-sm">
                                                <p className="text-sm text-slate-800 whitespace-pre-wrap mb-2">{journal.content}</p>
                                                <div className="flex justify-between items-center text-xs text-slate-500 border-t pt-2 mt-2 border-slate-100">
                                                    <span className="font-bold text-slate-600">{journal.author}</span>
                                                    <span className="font-mono">{journal.createdAt}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
                    
                    {/* Footer - Only visible for Messages Tab */}
                    {activeTab === 'MESSAGES' && (
                        <footer className="p-3 border-t bg-white flex-shrink-0">
                            {!isLoading && (
                                <div className="p-2 mb-2 border-b">
                                    <p className="text-sm font-semibold text-slate-600 mb-2">ارسال سریع:</p>
                                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                         <select
                                            value={quickSendCarModel}
                                            onChange={(e) => setQuickSendCarModel(e.target.value)}
                                            className="w-full sm:w-48 px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm focus:ring-sky-500 focus:border-sky-500"
                                        >
                                            <option value="">انتخاب خودرو...</option>
                                            {cars.map(car => (
                                                <option key={car.id} value={car.name}>{car.name}</option>
                                            ))}
                                        </select>
                                        <div className="flex flex-wrap gap-2">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsConditionModalOpen(true)}
                                                disabled={!selectedCarForQuickSend || conditionsForSelectedCar.length === 0}
                                                className="text-xs px-3 py-1 bg-slate-200 text-slate-700 rounded-full hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                شرایط فروش
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => handleQuickSend(formatTechSpecs())}
                                                disabled={!selectedCarForQuickSend || !selectedCarForQuickSend.technical_specs}
                                                className="text-xs px-3 py-1 bg-slate-200 text-slate-700 rounded-full hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                مشخصات فنی
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => handleQuickSend(formatComfortFeatures())}
                                                disabled={!selectedCarForQuickSend || !selectedCarForQuickSend.comfort_features}
                                                className="text-xs px-3 py-1 bg-slate-200 text-slate-700 rounded-full hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                امکانات رفاهی
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-end gap-2">
                                <textarea
                                    ref={textareaRef}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={isActionDisabled ? "این مشتری توسط کاربر دیگری رزرو شده است" : "محل تایپ کردن پاسخ..."}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition resize-y min-h-[44px] max-h-36 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                    disabled={isSending || isLoading || isActionDisabled}
                                    autoComplete="off"
                                    rows={1}
                                />
                                <div className="flex flex-col gap-1">
                                    <button
                                        type="button"
                                        onClick={handleSendWhatsApp}
                                        disabled={isSending || isLoading || !newMessage.trim() || isActionDisabled}
                                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:bg-slate-300 disabled:cursor-not-allowed text-xs font-bold w-24"
                                        title="ارسال واتساپ"
                                    >
                                        {isSending ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <ChatIcon className="w-4 h-4" />
                                                <span>واتساپ</span>
                                            </div>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSendSMS}
                                        disabled={isSending || isLoading || !newMessage.trim() || isActionDisabled}
                                        className="px-3 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors flex items-center justify-center disabled:bg-slate-300 disabled:cursor-not-allowed text-xs font-bold w-24"
                                        title="ارسال پیامک"
                                    >
                                        {isSending ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <ChatAltIcon className="w-4 h-4" />
                                                <span>پیامک</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                            {newMessage.length > 0 && (
                                <div className="text-[10px] text-slate-400 mt-1 text-left">
                                    {newMessage.length} / 170 کاراکتر (برای پیامک)
                                </div>
                            )}
                        </footer>
                    )}
                </div>
            </div>
            {isConditionModalOpen && (
                <ConditionSelectionModal
                    isOpen={isConditionModalOpen}
                    onClose={() => setIsConditionModalOpen(false)}
                    conditions={conditionsForSelectedCar}
                    onConfirm={handleConditionsSelected}
                />
            )}
            {validationError && (
                <Toast 
                    message={validationError} 
                    type="error" 
                    onClose={() => setValidationError(null)} 
                />
            )}
        </>
    );
};

export default LeadDetailHistoryModal;
