
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
import { ExportIcon } from '../components/icons/ExportIcon';

type SortConfig = { key: keyof CarSaleCondition; direction: 'ascending' | 'descending' } | null;

interface ConditionsPageProps {
    // No props needed
}

const ConditionsPage: React.FC<ConditionsPageProps> = () => {
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [currentCondition, setCurrentCondition] = useState<CarSaleCondition | null>(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [conditionToView, setConditionToView] = useState<CarSaleCondition | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [conditionToDelete, setConditionToDelete] = useState<CarSaleCondition | null>(null);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    const [filters, setFilters] = useState<{ status: ConditionStatus | 'all'; car_model: string | 'all'; sale_type: SaleType | 'all' }>({ status: 'all', car_model: 'all', sale_type: 'all' });
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'descending' });


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
    
    const handleAddNew = useCallback(() => {
        setCurrentCondition(null);
        setIsModalOpen(true);
    }, []);

    const handleEdit = (condition: CarSaleCondition) => {
        setCurrentCondition(condition);
        setIsModalOpen(true);
    };

    const handleDelete = (condition: CarSaleCondition) => {
        setConditionToDelete(condition);
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
        if (conditionToDelete) {
            try {
                await deleteCondition(conditionToDelete.id);
                showToast('شرط با موفقیت حذف شد', 'success');
                setIsDeleteModalOpen(false);
                setConditionToDelete(null);
                fetchAllConditions();
            } catch (err) {
                showToast('حذف شرط با خطا مواجه شد', 'error');
            }
        }
    };

    const handleSort = (key: keyof CarSaleCondition) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredConditions = useMemo(() => {
        const filtered = conditions.filter(c => {
            const statusMatch = filters.status === 'all' || c.status === filters.status;
            const carModelMatch = filters.car_model === 'all' || (c.car_model && c.car_model.toLowerCase() === filters.car_model.toLowerCase());
            const saleTypeMatch = filters.sale_type === 'all' || c.sale_type === filters.sale_type;
            return statusMatch && carModelMatch && saleTypeMatch;
        });

        if (sortConfig !== null) {
            return [...filtered].sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                     if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }
                
                const aStr = String(aValue);
                const bStr = String(bValue);

                const comparison = aStr.localeCompare(bStr, 'fa-IR');
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return filtered;
    }, [conditions, filters, sortConfig]);

    const handleExportCSV = () => {
        if (sortedAndFilteredConditions.length === 0) {
            showToast('هیچ داده‌ای برای خروجی گرفتن وجود ندارد.', 'error');
            return;
        }

        const headers = [
            "شناسه", "وضعیت", "مدل خودرو", "سال مدل", "نوع فروش",
            "نحوه پرداخت", "وضعیت سند", "رنگ‌ها", "زمان تحویل",
            "پیش‌پرداخت", "توضیحات"
        ];

        const escapeCSV = (value: any): string => {
            const str = String(value ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvRows = sortedAndFilteredConditions.map(c => [
            c.id,
            c.status,
            c.car_model,
            c.model,
            c.sale_type,
            c.pay_type,
            c.document_status,
            c.colors.join(' - '),
            c.delivery_time,
            c.initial_deposit,
            c.descriptions,
        ].map(escapeCSV).join(','));

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        
        // Add BOM for Excel compatibility with Persian characters
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `conditions_export_${date}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('فایل CSV با موفقیت آماده شد.', 'success');
    };

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white p-6 rounded-lg shadow-md mb-8 space-y-4">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-700">شرایط فروش</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={handleExportCSV}
                                disabled={sortedAndFilteredConditions.length === 0 || loading}
                                className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-sm flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                <ExportIcon />
                                خروجی CSV
                            </button>
                            <button
                                onClick={handleAddNew}
                                className="bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors duration-300 shadow-sm flex items-center gap-2"
                            >
                                <PlusIcon />
                                افزودن شرط جدید
                            </button>
                        </div>
                    </div>
                    <FilterPanel
                        onFilterChange={setFilters}
                        resultCount={sortedAndFilteredConditions.length}
                        totalCount={conditions.length}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner />
                    </div>
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : (
                    <ConditionTable 
                        conditions={sortedAndFilteredConditions} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                        onView={handleView}
                        onSort={handleSort}
                        sortConfig={sortConfig}
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
                    message={`آیا از حذف شرط فروش برای خودروی "${conditionToDelete?.car_model}" اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
                />
            )}
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default ConditionsPage;