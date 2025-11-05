import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getConditions, createCondition, updateCondition, deleteCondition } from '../services/api';
import type { CarSaleCondition, ConditionStatus, SaleType } from '../types';
import ConditionTable from '../components/ConditionTable';
import FilterPanel from '../components/FilterPanel';
import ConditionModal from '../components/ConditionModal';
import ConditionViewModal from '../components/ConditionViewModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import { PlusIcon } from '../components/icons/PlusIcon';

const ConditionsPage: React.FC = () => {
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [currentCondition, setCurrentCondition] = useState<CarSaleCondition | null>(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [conditionToView, setConditionToView] = useState<CarSaleCondition | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [conditionToDelete, setConditionToDelete] = useState<number | null>(null);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    const [filters, setFilters] = useState<{ status: ConditionStatus | 'all'; query: string; car_model: string | 'all'; sale_type: SaleType | 'all' }>({ status: 'all', query: '', car_model: 'all', sale_type: 'all' });

    const fetchAllConditions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getConditions();
            setConditions(data);
        } catch (err) {
            setError('خطا در دریافت اطلاعات');
            showToast('خطا در دریافت اطلاعات', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllConditions();
    }, [fetchAllConditions]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };
    
    const handleAddNew = () => {
        setCurrentCondition(null);
        setIsModalOpen(true);
    };

    const handleEdit = (condition: CarSaleCondition) => {
        setCurrentCondition(condition);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        setConditionToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleView = (condition: CarSaleCondition) => {
        setConditionToView(condition);
        setIsViewModalOpen(true);
    };
    
    const handleSave = async (conditionData: Omit<CarSaleCondition, 'id'>) => {
        try {
            if (currentCondition) {
                await updateCondition(currentCondition.id, { ...conditionData, id: currentCondition.id });
                showToast('شرط با موفقیت ویرایش شد', 'success');
            } else {
                await createCondition(conditionData);
                showToast('شرط جدید با موفقیت اضافه شد', 'success');
            }
            setIsModalOpen(false);
            setCurrentCondition(null);
            fetchAllConditions();
        } catch (err) {
            showToast('عملیات با خطا مواجه شد', 'error');
        }
    };
    
    const confirmDelete = async () => {
        if (conditionToDelete !== null) {
            try {
                await deleteCondition(conditionToDelete);
                showToast('شرط با موفقیت حذف شد', 'success');
                setIsDeleteModalOpen(false);
                setConditionToDelete(null);
                fetchAllConditions();
            } catch (err) {
                showToast('حذف شرط با خطا مواجه شد', 'error');
            }
        }
    };

    const filteredConditions = useMemo(() => {
        return conditions.filter(c => {
            const statusMatch = filters.status === 'all' || c.status === filters.status;
            const carModelMatch = filters.car_model === 'all' || c.car_model === filters.car_model;
            const saleTypeMatch = filters.sale_type === 'all' || c.sale_type === filters.sale_type;
            const queryMatch = filters.query === '' || 
                               (c.descriptions && c.descriptions.toLowerCase().includes(filters.query.toLowerCase()));
            return statusMatch && queryMatch && carModelMatch && saleTypeMatch;
        });
    }, [conditions, filters]);

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white p-6 rounded-lg shadow-md mb-8 space-y-4">
                     <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-700">فیلترها</h2>
                         <button
                            onClick={handleAddNew}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-sky-700 transition-colors duration-300 shadow"
                        >
                            <PlusIcon />
                            افزودن شرط جدید
                        </button>
                    </div>
                    <FilterPanel onFilterChange={setFilters} />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner />
                    </div>
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : (
                    <ConditionTable 
                        conditions={filteredConditions} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                        onView={handleView}
                    />
                )}
            </main>

            {isModalOpen && (
                <ConditionModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    condition={currentCondition}
                />
            )}

            {isViewModalOpen && (
                <ConditionViewModal 
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    condition={conditionToView}
                />
            )}
            
            {isDeleteModalOpen && (
                <DeleteConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="حذف شرط فروش"
                    message="آیا از حذف این شرط فروش اطمینان دارید؟ این عملیات قابل بازگشت نیست."
                />
            )}
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default ConditionsPage;