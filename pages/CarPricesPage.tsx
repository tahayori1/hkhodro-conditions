
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getCarPrices, createCarPrice, updateCarPrice, deleteCarPrice } from '../services/api';
import type { CarPrice } from '../types';
import CarPriceTable from '../components/CarPriceTable';
import CarPriceModal from '../components/CarPriceModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

type SortConfig = { key: keyof CarPrice; direction: 'ascending' | 'descending' } | null;

interface CarPricesPageProps {
    setOnAddNew: (handler: (() => void) | null) => void;
}

const CarPricesPage: React.FC<CarPricesPageProps> = ({ setOnAddNew }) => {
    const [prices, setPrices] = useState<CarPrice[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [currentPrice, setCurrentPrice] = useState<CarPrice | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [priceToDelete, setPriceToDelete] = useState<number | null>(null);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'price_date', direction: 'descending' });

    const fetchAllPrices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getCarPrices();
            setPrices(data);
        } catch (err) {
            setError('خطا در دریافت اطلاعات قیمت‌ها');
            showToast('خطا در دریافت اطلاعات قیمت‌ها', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllPrices();
    }, [fetchAllPrices]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };
    
    const handleAddNew = useCallback(() => {
        setCurrentPrice(null);
        setIsModalOpen(true);
    }, []);

    useEffect(() => {
        setOnAddNew(() => handleAddNew);
        return () => setOnAddNew(null);
    }, [setOnAddNew, handleAddNew]);

    const handleEdit = (price: CarPrice) => {
        setCurrentPrice(price);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        setPriceToDelete(id);
        setIsDeleteModalOpen(true);
    };
    
    const handleSave = async (priceData: Omit<CarPrice, 'id'>) => {
        try {
            if (currentPrice) {
                await updateCarPrice(currentPrice.id, { ...priceData, id: currentPrice.id });
                showToast('قیمت با موفقیت ویرایش شد', 'success');
            } else {
                await createCarPrice(priceData);
                showToast('قیمت جدید با موفقیت اضافه شد', 'success');
            }
            setIsModalOpen(false);
            setCurrentPrice(null);
            fetchAllPrices();
        } catch (err) {
            showToast('عملیات با خطا مواجه شد', 'error');
        }
    };
    
    const confirmDelete = async () => {
        if (priceToDelete !== null) {
            try {
                await deleteCarPrice(priceToDelete);
                showToast('قیمت با موفقیت حذف شد', 'success');
                setIsDeleteModalOpen(false);
                setPriceToDelete(null);
                fetchAllPrices();
            } catch (err) {
                showToast('حذف قیمت با خطا مواجه شد', 'error');
            }
        }
    };

    const handleSort = (key: keyof CarPrice) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedPrices = useMemo(() => {
        if (sortConfig !== null) {
            return [...prices].sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (['factory_price', 'market_price', 'id'].includes(sortConfig.key)) {
                    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }
                
                if (sortConfig.key === 'price_date') {
                    const dateA = new Date(aValue as string).getTime();
                    const dateB = new Date(bValue as string).getTime();
                    if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }

                const aStr = String(aValue);
                const bStr = String(bValue);

                const comparison = aStr.localeCompare(bStr, 'fa-IR');
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return prices;
    }, [prices, sortConfig]);

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-bold text-slate-700">مدیریت قیمت خودروها</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner />
                    </div>
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : (
                    <CarPriceTable 
                        prices={sortedPrices} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                        onSort={handleSort}
                        sortConfig={sortConfig}
                    />
                )}
            </main>

            {isModalOpen && (
                <CarPriceModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    price={currentPrice}
                />
            )}
            
            {isDeleteModalOpen && (
                <DeleteConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="حذف قیمت"
                    message="آیا از حذف این قیمت اطمینان دارید؟ این عملیات قابل بازگشت نیست."
                />
            )}
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default CarPricesPage;
