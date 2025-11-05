import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<User, 'id'>) => void;
    user: User | null;
}

// Re-using car models from the other modal. In a larger app, this would be in a shared constants file.
const CAR_MODELS = [
    'JAC J4', 'JAC S3', 'JAC S5', 'BAC X3pro', 'KMC T8', 'KMC T9', 'KMC A5',
    'KMC J7', 'KMC X5', 'KMC SR3', 'KMC EAGLE', 'KMC SHADOW', 'KMC SR6'
];

const initialFormState: Omit<User, 'id'> = {
    FullName: '',
    Number: '',
    CarModel: CAR_MODELS[0],
    Province: '',
    City: '',
    Decription: '',
    reference: '',
    // These fields are likely set by the server, so we send empty/null values.
    IP: null,
    RegisterTime: new Date().toISOString(),
    LastAction: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user }) => {
    const [formState, setFormState] = useState(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setFormState(user);
        } else {
            setFormState(initialFormState);
        }
        setErrors({});
    }, [user, isOpen]);

    const handleChange = <T extends keyof Omit<User, 'id'>> (field: T, value: Omit<User, 'id'>[T]) => {
        setFormState(prevState => ({ ...prevState, [field]: value }));
        if (errors[field]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formState.FullName.trim()) newErrors.FullName = 'نام کامل الزامی است.';
        if (!formState.Number.trim()) newErrors.Number = 'شماره تماس الزامی است.';
        if (!/^\d{10,11}$/.test(formState.Number)) newErrors.Number = 'شماره تماس معتبر نیست.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formState);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-slate-800">{user ? 'ویرایش سرنخ' : 'افزودن سرنخ جدید'}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="FullName" className="block text-sm font-medium text-slate-700 mb-1">نام کامل</label>
                            <input type="text" id="FullName" value={formState.FullName} onChange={(e) => handleChange('FullName', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md ${errors.FullName ? 'border-red-500' : 'border-slate-300'}`} />
                            {errors.FullName && <p className="text-red-500 text-xs mt-1">{errors.FullName}</p>}
                        </div>
                        <div>
                            <label htmlFor="Number" className="block text-sm font-medium text-slate-700 mb-1">شماره تماس</label>
                            <input type="tel" id="Number" value={formState.Number} onChange={(e) => handleChange('Number', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md ${errors.Number ? 'border-red-500' : 'border-slate-300'}`} dir="ltr" />
                            {errors.Number && <p className="text-red-500 text-xs mt-1">{errors.Number}</p>}
                        </div>
                        <div>
                            <label htmlFor="CarModel" className="block text-sm font-medium text-slate-700 mb-1">خودروی درخواستی</label>
                            <select id="CarModel" value={formState.CarModel} onChange={(e) => handleChange('CarModel', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md bg-white border-slate-300">
                                {CAR_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="reference" className="block text-sm font-medium text-slate-700 mb-1">مرجع</label>
                            <input type="text" id="reference" value={formState.reference} onChange={(e) => handleChange('reference', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md border-slate-300" />
                        </div>
                        <div>
                            <label htmlFor="Province" className="block text-sm font-medium text-slate-700 mb-1">استان</label>
                            <input type="text" id="Province" value={formState.Province} onChange={(e) => handleChange('Province', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md border-slate-300" />
                        </div>
                        <div>
                            <label htmlFor="City" className="block text-sm font-medium text-slate-700 mb-1">شهر</label>
                            <input type="text" id="City" value={formState.City} onChange={(e) => handleChange('City', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md border-slate-300" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="Decription" className="block text-sm font-medium text-slate-700 mb-1">توضیحات</label>
                            <textarea id="Decription" rows={3} value={formState.Decription} onChange={(e) => handleChange('Decription', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                        </div>
                    </div>
                    <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white py-4 px-6">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">انصراف</button>
                        <button type="submit" className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">ذخیره</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
