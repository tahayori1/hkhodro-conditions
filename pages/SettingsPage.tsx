import React, { useState, useEffect } from 'react';
import { getApiSettings, saveApiSettings, updateUserCredentials } from '../services/api';
import type { ApiSettings } from '../services/api';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const SettingsPage: React.FC = () => {
    // State for API settings form
    const [apiSettings, setApiSettings] = useState<ApiSettings>({ whatsappApiKey: '', smsApiKey: '' });
    const [apiLoading, setApiLoading] = useState(true);
    const [apiSaving, setApiSaving] = useState(false);

    // State for credentials form
    const [credForm, setCredForm] = useState({
        username: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [credSaving, setCredSaving] = useState(false);
    const [credErrors, setCredErrors] = useState<Record<string, string>>({});

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setApiLoading(true);
            try {
                const settings = await getApiSettings();
                setApiSettings(settings);
            } catch (err) {
                showToast('خطا در دریافت تنظیمات API', 'error');
            } finally {
                setApiLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleApiSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setApiSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleApiSettingsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiSaving(true);
        try {
            await saveApiSettings(apiSettings);
            showToast('تنظیمات API با موفقیت ذخیره شد', 'success');
        } catch (err) {
            showToast('خطا در ذخیره تنظیمات API', 'error');
        } finally {
            setApiSaving(false);
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

    const FormField: React.FC<{ label: string; name: string; type: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string; disabled?: boolean; }> = 
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

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-8">تنظیمات</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-3">تنظیمات API</h3>
                        {apiLoading ? <div className="flex justify-center p-8"><Spinner /></div> : (
                            <form onSubmit={handleApiSettingsSubmit} className="space-y-4">
                                <FormField label="کلید API واتساپ" name="whatsappApiKey" type="text" value={apiSettings.whatsappApiKey} onChange={handleApiSettingsChange} disabled={apiSaving} />
                                <FormField label="کلید API پیامک (SMS)" name="smsApiKey" type="text" value={apiSettings.smsApiKey} onChange={handleApiSettingsChange} disabled={apiSaving} />
                                <div className="pt-2 flex justify-end">
                                    <button type="submit" disabled={apiSaving} className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center w-28">
                                        {apiSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'ذخیره'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-3">تغییر اطلاعات کاربری</h3>
                        <form onSubmit={handleChangeCredentialsSubmit} className="space-y-4">
                            <FormField label="نام کاربری جدید (اختیاری)" name="username" type="text" value={credForm.username} onChange={handleCredFormChange} error={credErrors.username} disabled={credSaving} />
                            <FormField label="رمز عبور فعلی" name="currentPassword" type="password" value={credForm.currentPassword} onChange={handleCredFormChange} error={credErrors.currentPassword} disabled={credSaving} />
                            <FormField label="رمز عبور جدید (اختیاری)" name="newPassword" type="password" value={credForm.newPassword} onChange={handleCredFormChange} error={credErrors.newPassword} disabled={credSaving} />
                            <FormField label="تکرار رمز عبور جدید" name="confirmNewPassword" type="password" value={credForm.confirmNewPassword} onChange={handleCredFormChange} error={credErrors.confirmNewPassword} disabled={credSaving} />
                            {credErrors.general && <p className="text-red-500 text-sm text-center">{credErrors.general}</p>}
                            <div className="pt-2 flex justify-end">
                                <button type="submit" disabled={credSaving} className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-400 flex items-center justify-center w-36">
                                     {credSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'به‌روزرسانی'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default SettingsPage;
