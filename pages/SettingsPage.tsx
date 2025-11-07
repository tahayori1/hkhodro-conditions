import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, updateUserCredentials } from '../services/api';
import type { AppSettings } from '../services/api';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import { NotificationIcon } from '../components/icons/NotificationIcon';

const FormField: React.FC<{
    label: string,
    name: keyof AppSettings,
    value: string | number,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
    type?: string,
    rows?: number,
    placeholder?: string,
    disabled?: boolean
}> = ({ label, name, value, onChange, type = 'text', rows, placeholder, disabled = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        {type === 'textarea' ? (
            <textarea
                id={name} name={name} value={value} onChange={onChange} rows={rows || 3} placeholder={placeholder} disabled={disabled}
                className="w-full px-3 py-2 border rounded-md border-slate-300 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-50"
            />
        ) : (
            <input
                id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
                className="w-full px-3 py-2 border rounded-md border-slate-300 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-50"
            />
        )}
    </div>
);


const CredFormField: React.FC<{ label: string; name: string; type: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string; disabled?: boolean; }> = 
    ({ label, name, type, value, onChange, error, disabled = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : 'border-slate-300'}`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

const SettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<Partial<AppSettings>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [credForm, setCredForm] = useState({
        username: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [credSaving, setCredSaving] = useState(false);
    const [credErrors, setCredErrors] = useState<Record<string, string>>({});

    const [notificationPermission, setNotificationPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const [isSubscribing, setIsSubscribing] = useState(false);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const fetchedSettings = await getSettings();
                setSettings(fetchedSettings);
            } catch (err) {
                showToast('خطا در دریافت تنظیمات', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: (type === 'number' && name === 'establishment_year') ? parseInt(value, 10) || '' : value,
        }));
    };

    const handleSettingsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateSettings(settings);
            showToast('تنظیمات با موفقیت ذخیره شد', 'success');
        } catch (err) {
            showToast('خطا در ذخیره تنظیمات', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNotificationPermission = async () => {
        if (Notification.permission === 'default') {
            setIsSubscribing(true);
            try {
                const permission = await Notification.requestPermission();
                setNotificationPermission(permission);
                if (permission === 'granted') {
                    showToast('اعلان‌ها با موفقیت فعال شدند.', 'success');
                    const registration = await navigator.serviceWorker.ready;
                    registration.showNotification('اعلان‌ها فعال شدند', {
                        body: 'شما از این پس اعلان‌های سرنخ‌های داغ را دریافت خواهید کرد.',
                        icon: '/vite.svg'
                    });
                } else {
                    showToast('شما اجازه ارسال اعلان‌ها را ندادید.', 'error');
                }
            } catch (error) {
                showToast('خطا در فعال‌سازی اعلان‌ها', 'error');
            } finally {
                setIsSubscribing(false);
            }
        }
    };

    const hashPassword = async (password: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    };

    const handleCredFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredForm(prev => ({ ...prev, [name]: value }));
        if (credErrors[name]) {
            setCredErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateCredentials = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!credForm.currentPassword) {
            newErrors.currentPassword = 'رمز عبور فعلی الزامی است.';
        }
        if (credForm.newPassword && credForm.newPassword !== credForm.confirmNewPassword) {
            newErrors.confirmNewPassword = 'رمزهای عبور جدید مطابقت ندارند.';
        }
        if ((credForm.newPassword || credForm.username) && !credForm.currentPassword) {
             newErrors.currentPassword = 'برای ایجاد تغییر، رمز عبور فعلی الزامی است.';
        }
        if (!credForm.newPassword && !credForm.username) {
            newErrors.general = 'حداقل نام کاربری جدید یا رمز عبور جدید باید وارد شود.';
        }
        setCredErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChangeCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateCredentials()) return;
        
        setCredSaving(true);
        try {
            const currentPasswordHash = await hashPassword(credForm.currentPassword);
            const newPasswordHash = credForm.newPassword ? await hashPassword(credForm.newPassword) : undefined;
            await updateUserCredentials(currentPasswordHash, credForm.username, newPasswordHash);
            showToast('اطلاعات کاربری با موفقیت به‌روزرسانی شد. ممکن است لازم باشد دوباره وارد شوید.', 'success');
            setCredForm({ username: '', currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطا در به‌روزرسانی اطلاعات';
            showToast(errorMessage.includes('401') ? 'رمز عبور فعلی اشتباه است.' : errorMessage, 'error');
        } finally {
            setCredSaving(false);
        }
    };

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <form onSubmit={handleSettingsSubmit}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <h2 className="text-3xl font-bold text-slate-800">تنظیمات</h2>
                        <button
                            type="submit"
                            disabled={isSaving || loading}
                            className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center w-full sm:w-40"
                        >
                            {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'ذخیره تنظیمات'}
                        </button>
                    </div>

                    {loading ? (
                         <div className="flex justify-center p-8"><Spinner /></div>
                    ) : (
                        <div className="space-y-8">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-3 flex items-center gap-2">
                                    <NotificationIcon className="w-5 h-5" />
                                    تنظیمات اعلان‌ها
                                </h3>
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600">
                                        برای دریافت اعلان‌ها در مورد سرنخ‌های داغ جدید، لطفاً اجازه دسترسی را بدهید.
                                    </p>
                                    {notificationPermission === 'granted' && (
                                        <div className="p-3 bg-green-100 text-green-800 rounded-md text-center font-semibold">
                                            اعلان‌ها فعال هستند.
                                        </div>
                                    )}
                                    {notificationPermission === 'denied' && (
                                        <div className="p-3 bg-red-100 text-red-800 rounded-md text-center">
                                            <p className="font-semibold">اعلان‌ها مسدود شده‌اند.</p>
                                            <p className="text-xs mt-1">برای فعال‌سازی، لطفاً از تنظیمات مرورگر خود اقدام کنید.</p>
                                        </div>
                                    )}
                                    {notificationPermission === 'default' && (
                                        <div className="pt-2 flex justify-end">
                                            <button 
                                                onClick={handleNotificationPermission} 
                                                disabled={isSubscribing}
                                                type="button"
                                                className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center w-40"
                                            >
                                                {isSubscribing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'فعال‌سازی اعلان‌ها'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-3">اطلاعات نمایندگی</h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <FormField label="نام نمایندگی" name="dealership_name" value={settings.dealership_name || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                        <FormField label="نام شرکت" name="company_name" value={settings.company_name || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                        <FormField label="URL لوگو" name="logo_url" value={settings.logo_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="سال تاسیس" name="establishment_year" value={settings.establishment_year || ''} onChange={handleSettingsChange} type="number" disabled={isSaving} />
                                        <FormField label="حوزه فعالیت" name="activity_area" value={settings.activity_area || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                    </div>
                                    <FormField label="آدرس نمایندگی" name="address" value={settings.address || ''} onChange={handleSettingsChange} type="textarea" disabled={isSaving} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="نقشه گوگل" name="google_maps_url" value={settings.google_maps_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="نقشه نشان" name="neshan_maps_url" value={settings.neshan_maps_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="تلفن های تماس" name="contact_phones" value={settings.contact_phones || ''} onChange={handleSettingsChange} placeholder="شماره‌ها را با ویرگول جدا کنید" disabled={isSaving} />
                                        <FormField label="شماره موبایل‌ها" name="mobile_numbers" value={settings.mobile_numbers || ''} onChange={handleSettingsChange} placeholder="شماره‌ها را با ویرگول جدا کنید" disabled={isSaving} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <FormField label="اینستاگرام" name="instagram_url" value={settings.instagram_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="یوتیوب" name="youtube_url" value={settings.youtube_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="کانال تلگرام" name="telegram_channel_url" value={settings.telegram_channel_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="کانال واتساپ" name="whatsapp_channel_url" value={settings.whatsapp_channel_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                        <FormField label="تردز (Threads)" name="threads_url" value={settings.threads_url || ''} onChange={handleSettingsChange} type="url" disabled={isSaving} />
                                    </div>
                                    <FormField label="مزیت‌های رقابتی" name="competitive_advantages" value={settings.competitive_advantages || ''} onChange={handleSettingsChange} type="textarea" disabled={isSaving} />
                                    <FormField label="توضیحات" name="description" value={settings.description || ''} onChange={handleSettingsChange} type="textarea" disabled={isSaving} />
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-3">تنظیمات API</h3>
                                <div className="space-y-4">
                                    <FormField label="کلید API واتساپ" name="whatsappApiKey" type="text" value={settings.whatsappApiKey || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                    <FormField label="کلید API پیامک (SMS)" name="smsApiKey" type="text" value={settings.smsApiKey || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                    <FormField label="کلید API دیدار" name="didarApiKey" type="text" value={settings.didarApiKey || ''} onChange={handleSettingsChange} disabled={isSaving} />
                                </div>
                            </div>

                        </div>
                    )}
                </form>

                <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                    <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-3">تغییر اطلاعات کاربری</h3>
                    <form onSubmit={handleChangeCredentialsSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <CredFormField label="نام کاربری جدید (اختیاری)" name="username" type="text" value={credForm.username} onChange={handleCredFormChange} error={credErrors.username} disabled={credSaving} />
                           <CredFormField label="رمز عبور فعلی" name="currentPassword" type="password" value={credForm.currentPassword} onChange={handleCredFormChange} error={credErrors.currentPassword} disabled={credSaving} />
                           <CredFormField label="رمز عبور جدید (اختیاری)" name="newPassword" type="password" value={credForm.newPassword} onChange={handleCredFormChange} error={credErrors.newPassword} disabled={credSaving} />
                           <CredFormField label="تکرار رمز عبور جدید" name="confirmNewPassword" type="password" value={credForm.confirmNewPassword} onChange={handleCredFormChange} error={credErrors.confirmNewPassword} disabled={credSaving} />
                        </div>
                        {credErrors.general && <p className="text-red-500 text-sm text-center">{credErrors.general}</p>}
                        <div className="pt-2 flex justify-end">
                            <button type="submit" disabled={credSaving} className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center w-36">
                                 {credSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'به‌روزرسانی'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default SettingsPage;
