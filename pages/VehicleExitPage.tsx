import React, { useState } from 'react';

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="bg-slate-100 border border-slate-300 px-3 py-2 font-bold text-slate-800 text-sm mb-3 mt-6 rounded-sm print:bg-slate-100 print:text-black">
        {title}
    </div>
);

const InputField: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string; className?: string }> = ({ label, value, onChange, placeholder, className = "" }) => (
    <div className={`flex items-center gap-2 mb-2 ${className}`}>
        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap min-w-fit">{label}:</span>
        <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-grow border-b border-dotted border-slate-400 focus:border-sky-500 outline-none px-2 py-0.5 text-sm bg-transparent font-mono text-slate-900 print:placeholder-transparent"
        />
    </div>
);

const CheckboxField: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer mb-1 print:cursor-default">
        <input 
            type="checkbox" 
            checked={checked} 
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 text-slate-800 border-slate-300 rounded focus:ring-slate-500"
        />
        <span className="text-sm text-slate-800">{label}</span>
    </label>
);

const SignatureBox: React.FC<{ label: string; title: string }> = ({ label, title }) => (
    <div className="mt-4 flex flex-col items-center justify-end h-28 border border-slate-300 rounded p-2 relative page-break-inside-avoid bg-white">
        <span className="absolute top-2 right-2 text-xs font-bold text-slate-500">{title}</span>
        <div className="w-full border-b border-slate-300 mb-6"></div>
        <span className="text-sm font-bold text-slate-800">{label}</span>
    </div>
);

const VehicleExitPage: React.FC = () => {
    // Form State
    const [formData, setFormData] = useState({
        // 1. Vehicle
        model: '',
        color: '',
        chassis: '',
        engine: '',
        plate: '',
        // 2. Customer
        customerName: '',
        nationalId: '',
        phone: '',
        // 3. Financial
        invoiceNumber: '',
        totalAmount: '',
        paidAmount: '',
        balance: '0',
        accountantName: '',
        // 4. Sales
        salesRepName: '',
        // 5. PDS
        bodyStatus: 'healthy', // healthy, damaged
        pdsNotes: '',
        pdsRepName: '',
        // 6. Delivery
        docsGreenLeaf: false,
        docsCard: false,
        docsInsurance: false,
        docsFuelCard: false,
        docsWarranty: false,
        docsOther: '',
        deliveryRepName: '',
        // 7. Manager
        managerName: '',
        // 8. Customer
        customerSignName: '',
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="w-full h-full flex flex-col items-center">
            {/* Page Controls - Hidden in Print */}
            <div className="w-full max-w-4xl mb-6 flex justify-between items-center print:hidden">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">فرم خروج خودرو</h2>
                <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-xl shadow-md hover:bg-sky-700 transition-colors font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    چاپ فرم
                </button>
            </div>

            {/* Printable Document */}
            <div id="printable-form" className="bg-white text-black w-full max-w-[210mm] min-h-[297mm] p-[20mm] shadow-xl print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 mx-auto rounded-none sm:rounded-lg">
                
                {/* Header Logo/Title */}
                <div className="text-center border-b-4 border-slate-800 pb-6 mb-6">
                    <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">نمایندگی حسین‌خودرو شیراز</h1>
                    <h2 className="text-xl font-bold text-slate-700 bg-slate-100 inline-block px-4 py-1 rounded">فرم خروج خودرو / سند تحویل نهایی</h2>
                    <p className="text-sm text-slate-600 mt-4 text-justify leading-relaxed px-4 font-medium">
                        این سند مطابق مقررات داخلی نمایندگی و الزامات قانونی تنظیم شده و هرگونه خروج خودرو از محوطه بدون تکمیل و امضای این فرم <span className="font-bold underline text-red-600 print:text-black">ممنوع</span> است. تمامی امضاکنندگان، مسئول صحت اطلاعات مرتبط با واحد خود هستند.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    {/* 1. Vehicle Info */}
                    <div className="col-span-full md:col-span-1">
                        <SectionHeader title="۱) مشخصات خودرو" />
                        <div className="pl-2">
                            <InputField label="مدل" value={formData.model} onChange={(v) => handleChange('model', v)} />
                            <InputField label="رنگ" value={formData.color} onChange={(v) => handleChange('color', v)} />
                            <InputField label="شماره شاسی" value={formData.chassis} onChange={(v) => handleChange('chassis', v)} className="font-mono" />
                            <InputField label="شماره موتور" value={formData.engine} onChange={(v) => handleChange('engine', v)} className="font-mono" />
                            <InputField label="شماره پلاک" value={formData.plate} onChange={(v) => handleChange('plate', v)} placeholder="(در صورت نصب)" />
                        </div>
                    </div>

                    {/* 2. Customer Info */}
                    <div className="col-span-full md:col-span-1">
                        <SectionHeader title="۲) اطلاعات مشتری" />
                        <div className="pl-2">
                            <InputField label="نام و نام خانوادگی" value={formData.customerName} onChange={(v) => handleChange('customerName', v)} />
                            <InputField label="کد ملی" value={formData.nationalId} onChange={(v) => handleChange('nationalId', v)} className="font-mono" />
                            <InputField label="شماره تماس" value={formData.phone} onChange={(v) => handleChange('phone', v)} className="font-mono" />
                        </div>
                    </div>

                    {/* 3. Accounting */}
                    <div className="col-span-full">
                        <SectionHeader title="۳) کنترل وضعیت مالی – (مسئولیت کامل با حسابداری)" />
                        <div className="text-xs text-slate-600 mb-4 leading-relaxed bg-slate-50 p-3 rounded print:bg-transparent print:p-0 border print:border-none">
                            با امضا و مهر این بخش، حسابداری تأیید می‌کند:
                            <ul className="list-disc list-inside mt-1 space-y-0.5 font-bold">
                                <li>هیچ‌گونه بدهی، چک معوق، مانده حساب یا تعهد پرداخت باقی نمانده است.</li>
                                <li>کلیه مبالغ واریزی مشتری با فاکتور و سیستم مالی تطبیق داده شده است.</li>
                                <li>خروج خودرو از نظر مالی بلامانع است.</li>
                            </ul>
                        </div>
                        <div className="grid grid-cols-2 gap-8 mb-4">
                            <InputField label="شماره فاکتور" value={formData.invoiceNumber} onChange={(v) => handleChange('invoiceNumber', v)} />
                            <InputField label="مبلغ کل" value={formData.totalAmount} onChange={(v) => handleChange('totalAmount', v)} />
                            <InputField label="مبلغ واریزی" value={formData.paidAmount} onChange={(v) => handleChange('paidAmount', v)} />
                            <InputField label="مانده حساب" value={formData.balance} onChange={(v) => handleChange('balance', v)} />
                        </div>
                        <div className="grid grid-cols-2 gap-8 mt-4">
                            <div className="flex items-end">
                                <InputField label="نام مسئول حسابداری" value={formData.accountantName} onChange={(v) => handleChange('accountantName', v)} className="w-full" />
                            </div>
                            <SignatureBox label="امضا و مهر حسابداری" title="تایید مالی" />
                        </div>
                    </div>

                    {/* 4. Sales */}
                    <div className="col-span-full md:col-span-1">
                        <SectionHeader title="۴) کنترل وضعیت فروش" />
                        <div className="text-xs text-slate-500 mb-2 italic">
                            صحت اطلاعات، کنترل مبالغ، تحویل مدارک فروش.
                        </div>
                        <InputField label="نام مسئول فروش" value={formData.salesRepName} onChange={(v) => handleChange('salesRepName', v)} />
                        <SignatureBox label="امضا مسئول فروش" title="تایید فروش" />
                    </div>

                    {/* 5. PDS */}
                    <div className="col-span-full md:col-span-1">
                        <SectionHeader title="۵) کنترل کیفیت / PDS" />
                        <div className="text-xs text-slate-500 mb-2 italic">
                            بررسی ظاهری، فنی و تجهیزاتی.
                        </div>
                        <div className="flex gap-4 mb-3">
                            <label className="flex items-center gap-1"><input type="radio" checked={formData.bodyStatus === 'healthy'} onChange={() => handleChange('bodyStatus', 'healthy')} /> <span className="text-sm font-bold">بدنه سالم</span></label>
                            <label className="flex items-center gap-1"><input type="radio" checked={formData.bodyStatus === 'damaged'} onChange={() => handleChange('bodyStatus', 'damaged')} /> <span className="text-sm font-bold">دارای آسیب</span></label>
                        </div>
                        <InputField label="توضیحات" value={formData.pdsNotes} onChange={(v) => handleChange('pdsNotes', v)} />
                        <InputField label="نام مسئول PDS" value={formData.pdsRepName} onChange={(v) => handleChange('pdsRepName', v)} />
                        <SignatureBox label="امضا مسئول PDS" title="تایید فنی" />
                    </div>

                    {/* 6. Delivery */}
                    <div className="col-span-full">
                        <SectionHeader title="۶) تحویل نهایی به مشتری – (مسئولیت کامل با کارشناس تحویل)" />
                        <div className="text-xs text-slate-500 mb-2 italic">
                            کارشناس تحویل تأیید می‌کند: هویت خریدار کنترل شد و مدارک زیر تحویل گردید:
                        </div>
                        <div className="grid grid-cols-3 gap-y-2 gap-x-4 mb-4">
                            <CheckboxField label="برگ سبز" checked={formData.docsGreenLeaf} onChange={(v) => handleChange('docsGreenLeaf', v)} />
                            <CheckboxField label="کارت خودرو" checked={formData.docsCard} onChange={(v) => handleChange('docsCard', v)} />
                            <CheckboxField label="بیمه‌نامه" checked={formData.docsInsurance} onChange={(v) => handleChange('docsInsurance', v)} />
                            <CheckboxField label="کارت سوخت" checked={formData.docsFuelCard} onChange={(v) => handleChange('docsFuelCard', v)} />
                            <CheckboxField label="دفترچه گارانتی" checked={formData.docsWarranty} onChange={(v) => handleChange('docsWarranty', v)} />
                            <InputField label="سایر" value={formData.docsOther} onChange={(v) => handleChange('docsOther', v)} />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                             <div className="flex items-end">
                                <InputField label="نام کارشناس تحویل" value={formData.deliveryRepName} onChange={(v) => handleChange('deliveryRepName', v)} className="w-full" />
                             </div>
                            <SignatureBox label="امضا کارشناس تحویل" title="تایید تحویل" />
                        </div>
                    </div>

                    {/* 7. Management */}
                    <div className="col-span-full md:col-span-1">
                        <SectionHeader title="۷) تأیید نهایی مدیریت / مسئول شیفت" />
                        <div className="text-xs text-slate-500 mb-2 italic">
                            تأیید نهایی کنترل تمام امضاها و مجوز خروج.
                        </div>
                        <InputField label="نام مدیر/مسئول" value={formData.managerName} onChange={(v) => handleChange('managerName', v)} />
                        <SignatureBox label="امضا و مهر مدیریت" title="مجوز خروج" />
                    </div>

                    {/* 8. Customer */}
                    <div className="col-span-full md:col-span-1">
                        <SectionHeader title="۸) تأیید نهایی مشتری" />
                        <div className="text-xs text-slate-800 mb-2 text-justify font-bold bg-slate-50 p-2 rounded print:bg-transparent print:p-0">
                            اینجانب کلیه مدارک، خودرو، وضعیت ظاهری، توضیحات فروش و خدمات پس از فروش را دریافت کرده‌ام.
                            هیچ ادعای مالی یا شکایتی در زمان تحویل ندارم.
                        </div>
                        <InputField label="نام مشتری" value={formData.customerSignName} onChange={(v) => handleChange('customerSignName', v)} />
                        <SignatureBox label="امضا و اثر انگشت مشتری" title="تایید مشتری" />
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono print:block hidden">
                     سیستم مدیریت یکپارچه AutoLead - چاپ شده در {new Date().toLocaleDateString('fa-IR')}
                </div>
            </div>
            
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-form, #printable-form * {
                        visibility: visible;
                    }
                    #printable-form {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 15mm;
                        background: white;
                        color: black;
                        box-shadow: none;
                    }
                    .page-break-inside-avoid {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
};

export default VehicleExitPage;