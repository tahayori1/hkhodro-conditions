
import React, { useEffect, useRef, useState } from 'react';
import type { User, LeadMessage, Car, CarSaleCondition } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import Spinner from './Spinner';
import { SendIcon } from './icons/SendIcon';
import ConditionSelectionModal from './ConditionSelectionModal';
import { SendToCrmIcon } from './icons/SendToCrmIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ChatIcon } from './icons/ChatIcon';
import { ChatAltIcon } from './icons/ChatAltIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import Toast from './Toast';

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
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
    <div>
        <span className="text-xs text-slate-500">{label}</span>
        <p className="text-sm font-semibold text-slate-800">{value || '-'}</p>
    </div>
);

const LeadDetailHistoryModal: React.FC<LeadDetailHistoryModalProps> = ({ 
    isOpen, onClose, lead, fullUserDetails, messages, isLoading, error, 
    onSendMessage, onSendToCrm, onRegisterOrder, cars, conditions 
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isCrmSending, setIsCrmSending] = useState(false);
    const [quickSendCarModel, setQuickSendCarModel] = useState('');
    const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && !isLoading && messages.length > 0) {
            setTimeout(scrollToBottom, 100);
        }
    }, [isOpen, isLoading, messages]);

    useEffect(() => {
        if (isOpen && (lead || fullUserDetails)) {
            const initialCarModel = fullUserDetails?.CarModel || lead?.CarModel || '';
            setQuickSendCarModel(initialCarModel);
        } else if (!isOpen) {
            setQuickSendCarModel('');
            setNewMessage('');
            setValidationError(null);
        }
    }, [isOpen, lead, fullUserDetails]);


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

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                               جزئیات و تاریخچه مشتری
                            </h2>
                            <p className="text-sm text-slate-500" dir="ltr">
                                {leadNumber} {leadName && `(${leadName})`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => fullUserDetails && onRegisterOrder(fullUserDetails)} 
                                className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors" 
                                title="ثبت سفارش فروش"
                            >
                                <ClipboardListIcon className="w-5 h-5" />
                            </button>
                            {fullUserDetails && !fullUserDetails.crmIsSend ? (
                                <button onClick={handleSendToCrm} disabled={isCrmSending} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-wait" title="ارسال به CRM">
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
                    </header>

                    <main className="flex-grow overflow-y-auto">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full"><Spinner /></div>
                        ) : error ? (
                             <div className="flex justify-center items-center h-full"><p className="text-red-500">{error}</p></div>
                        ) : (
                            <>
                                <div className="p-4 bg-slate-50 border-b">
                                    <h3 className="text-md font-bold text-slate-700 mb-3">اطلاعات مشتری</h3>
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

                                <div className="p-4">
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col justify-center items-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 mx-4 mt-4">
                                            <ChatIcon className="w-12 h-12 text-slate-300 mb-2" />
                                            <p className="text-slate-500 text-sm font-medium">هیچ پیام یا تاریخچه‌ای یافت نشد.</p>
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
                                placeholder="محل تایپ کردن پاسخ..."
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition resize-y min-h-[44px] max-h-36"
                                disabled={isSending || isLoading}
                                autoComplete="off"
                                rows={1}
                            />
                            <div className="flex flex-col gap-1">
                                <button
                                    type="button"
                                    onClick={handleSendWhatsApp}
                                    disabled={isSending || isLoading || !newMessage.trim()}
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
                                    disabled={isSending || isLoading || !newMessage.trim()}
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
