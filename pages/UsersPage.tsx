
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getLeadHistory, sendMessage, getUserByNumber, getCars, getConditions, getReferences } from '../services/api';
import type { Reference } from '../services/api';
import type { User, ActiveLead, LeadMessage, Car, CarSaleCondition } from '../types';
import UserTable from '../components/UserTable';
import UserModal from '../components/UserModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import LeadDetailHistoryModal from '../components/LeadHistoryModal';
import BroadcastModal from '../components/BroadcastModal';
import { BroadcastIcon } from '../components/icons/BroadcastIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import UserFilterPanel from '../components/UserFilterPanel';
import { PlusIcon } from '../components/icons/PlusIcon';


const ITEMS_PER_PAGE = 50;

type SortConfig = { key: keyof User; direction: 'ascending' | 'descending' } | null;
type UserFilters = { query: string; carModel: string; reference: string };

interface UsersPageProps {
    initialFilters: { carModel?: string };
    onFiltersCleared: () => void;
}

const UsersPage: React.FC<UsersPageProps> = ({ initialFilters, onFiltersCleared }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [cars, setCars] = useState<Car[]>([]);
    const [conditions, setConditions] = useState<CarSaleCondition[]>([]);
    const [references, setReferences] = useState<Reference[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [selectedLead, setSelectedLead] = useState<User | ActiveLead | null>(null);
    const [modalMessages, setModalMessages] = useState<LeadMessage[]>([]);
    const [modalFullUser, setModalFullUser] = useState<User | null>(null);
    const [modalLoading, setModalLoading] = useState<boolean>(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'RegisterTime', direction: 'descending' });
    const [filters, setFilters] = useState<UserFilters>({ query: '', carModel: 'all', reference: 'all' });

    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

    useEffect(() => {
        setFilters(prev => ({ ...prev, carModel: initialFilters.carModel || 'all' }));
    }, [initialFilters]);


    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersData, carsData, conditionsData, referencesData] = await Promise.all([
                getUsers(),
                getCars(),
                getConditions(),
                getReferences()
            ]);
            setUsers(usersData);
            setCars(carsData);
            setConditions(conditionsData);
            setReferences(referencesData);
        } catch (err) {
            setError('خطا در دریافت اطلاعات');
            showToast('خطا در دریافت اطلاعات', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedUserIds(new Set());
    }, [sortConfig, filters]);
    
    const filteredUsers = useMemo(() => {
        const lowercasedQuery = filters.query.toLowerCase();
        return users.filter(user => {
            const queryMatch = filters.query === '' ||
                (user.FullName?.toLowerCase().includes(lowercasedQuery)) ||
                (user.Number?.includes(lowercasedQuery)) ||
                (user.CarModel?.toLowerCase().includes(lowercasedQuery)) ||
                (user.Province?.toLowerCase().includes(lowercasedQuery)) ||
                (user.City?.toLowerCase().includes(lowercasedQuery)) ||
                (user.Decription?.toLowerCase().includes(lowercasedQuery));

            const carModelMatch = filters.carModel === 'all' || user.CarModel === filters.carModel;
            const referenceMatch = filters.reference === 'all' || user.reference === filters.reference;
            return queryMatch && carModelMatch && referenceMatch;
        });
    }, [users, filters]);

    const sortedUsers = useMemo(() => {
        let usersCopy = [...filteredUsers];

        if (sortConfig !== null) {
            return usersCopy.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (['RegisterTime', 'LastAction', 'createdAt', 'updatedAt'].includes(sortConfig.key)) {
                    const dateA = new Date((aValue as string || '').replace(' ', 'T')).getTime();
                    const dateB = new Date((bValue as string || '').replace(' ', 'T')).getTime();
                    if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }

                const aStr = String(aValue ?? '');
                const bStr = String(bValue ?? '');
                const comparison = aStr.localeCompare(bStr, 'fa-IR');
                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        
        return usersCopy;
    }, [filteredUsers, sortConfig]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedUsers, currentPage]);
    
    useEffect(() => {
        setSelectedUserIds(new Set());
    }, [currentPage, paginatedUsers]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };
    
    const handleAddNew = useCallback(() => {
        setCurrentUser(null);
        setIsModalOpen(true);
    }, []);

    const handleEdit = (user: User) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        setUserToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleViewDetails = async (lead: User | ActiveLead) => {
        setIsDetailModalOpen(true);
        setSelectedLead(lead);
        setModalLoading(true);
        setModalError(null);
        setModalMessages([]);
        setModalFullUser(null);
        try {
            const numberToFetch = 'number' in lead ? lead.number : lead.Number;
            
            const historyPromise = getLeadHistory(numberToFetch);
            // If the lead is already a full User object, just use it. Otherwise, fetch it.
            const userPromise = 'id' in lead ? Promise.resolve(lead) : getUserByNumber(numberToFetch);

            const [historyData, userData] = await Promise.all([historyPromise, userPromise]);
            
            const parseDate = (dateString: string) => new Date(dateString.replace(' ', 'T'));
            setModalMessages(historyData.sort((a, b) => parseDate(a.createdAt).getTime() - parseDate(b.createdAt).getTime()));
            setModalFullUser(userData);

        } catch (err) {
            setModalError('خطا در دریافت اطلاعات کامل سرنخ');
        } finally {
            setModalLoading(false);
        }
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedLead(null);
        setModalMessages([]);
        setModalFullUser(null);
    };
    
    const handleSave = async (userData: Omit<User, 'id'>) => {
        try {
            if (currentUser) {
                await updateUser(currentUser.id, { ...userData, id: currentUser.id });
                showToast('کاربر با موفقیت ویرایش شد', 'success');
            } else {
                await createUser(userData);
                showToast('کاربر جدید با موفقیت اضافه شد', 'success');
            }
            setIsModalOpen(false);
            setCurrentUser(null);
            fetchAllData();
        } catch (err) {
            showToast('عملیات با خطا مواجه شد', 'error');
        }
    };
    
    const confirmDelete = async () => {
        if (userToDelete !== null) {
            try {
                await deleteUser(userToDelete);
                showToast('کاربر با موفقیت حذف شد', 'success');
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
                fetchAllData();
            } catch (err) {
                showToast('حذف کاربر با خطا مواجه شد', 'error');
            }
        }
    };
    
    const handleSort = (key: keyof User) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSendMessage = async (message: string) => {
        if (!selectedLead) {
            throw new Error("No active lead selected for sending message.");
        }
        
        const number = 'number' in selectedLead ? selectedLead.number : selectedLead.Number;

        try {
            await sendMessage(number, message);
            showToast('پیام با موفقیت ارسال شد', 'success');
            
            const data = await getLeadHistory(number);
            const parseDate = (dateString: string) => new Date(dateString.replace(' ', 'T'));
            setModalMessages(data.sort((a, b) => parseDate(a.createdAt).getTime() - parseDate(b.createdAt).getTime()));
        } catch (err) {
            showToast('ارسال پیام با خطا مواجه شد', 'error');
            throw err;
        }
    };

    const handleSelectionChange = (userId: number) => {
        setSelectedUserIds(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(userId)) {
                newSelection.delete(userId);
            } else {
                newSelection.add(userId);
            }
            return newSelection;
        });
    };

    const handleSelectAllChange = (selectAll: boolean) => {
        if (selectAll) {
            const allUserIdsOnPage = paginatedUsers.map(u => u.id);
            setSelectedUserIds(new Set(allUserIdsOnPage));
        } else {
            setSelectedUserIds(new Set());
        }
    };
    
    const handleSendBroadcast = async (
        message: string,
        onProgress: (progress: { sent: number; errors: number }) => void
    ): Promise<{finalSuccess: number, finalErrors: number}> => {
        const selectedUsers = users.filter(u => selectedUserIds.has(u.id));
        if (selectedUsers.length === 0 || !message.trim()) {
            return {finalSuccess: 0, finalErrors: 0};
        }

        let successCount = 0;
        let errorCount = 0;

        for (const user of selectedUsers) {
            try {
                await sendMessage(user.Number, message);
                successCount++;
            } catch (err) {
                console.error(`Failed to send message to ${user.Number}:`, err);
                errorCount++;
            }
            onProgress({ sent: successCount, errors: errorCount });
        }
        
        return {finalSuccess: successCount, finalErrors: errorCount};
    };

    const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white p-6 rounded-lg shadow-md mb-8 space-y-4">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-700">مدیریت سرنخ‌ها</h2>
                        <button
                            onClick={handleAddNew}
                            className="bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors duration-300 shadow-sm flex items-center gap-2"
                        >
                            <PlusIcon />
                            افزودن سرنخ جدید
                        </button>
                    </div>
                    <UserFilterPanel
                        filters={filters}
                        onFilterChange={setFilters}
                        references={references}
                        onClear={() => {
                            setFilters({ query: '', carModel: 'all', reference: 'all' });
                            onFiltersCleared();
                        }}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner />
                    </div>
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : (
                    <>
                        <UserTable 
                            users={paginatedUsers} 
                            onEdit={handleEdit} 
                            onDelete={handleDelete}
                            onViewDetails={handleViewDetails}
                            onSort={handleSort}
                            sortConfig={sortConfig}
                            selectedUserIds={selectedUserIds}
                            onSelectionChange={handleSelectionChange}
                            onSelectAllChange={handleSelectAllChange}
                        />
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={sortedUsers.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />
                        )}
                    </>
                )}
            </main>

            {isModalOpen && (
                <UserModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    user={currentUser}
                />
            )}

            {isDetailModalOpen && (
                <LeadDetailHistoryModal
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseDetailModal}
                    lead={selectedLead}
                    fullUserDetails={modalFullUser}
                    messages={modalMessages}
                    isLoading={modalLoading}
                    error={modalError}
                    onSendMessage={handleSendMessage}
                    cars={cars}
                    conditions={conditions}
                />
            )}
            
            {isBroadcastModalOpen && (
                 <BroadcastModal
                    isOpen={isBroadcastModalOpen}
                    onClose={() => {
                        setIsBroadcastModalOpen(false);
                        setSelectedUserIds(new Set());
                    }}
                    onSend={handleSendBroadcast}
                    recipientCount={selectedUserIds.size}
                    cars={cars}
                    conditions={conditions}
                />
            )}
            
            {isDeleteModalOpen && (
                <DeleteConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="حذف سرنخ فروش"
                    message="آیا از حذف این سرنخ فروش اطمینان دارید؟ این عملیات قابل بازگشت نیست."
                />
            )}
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {selectedUserIds.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-sky-700 text-white p-3 sm:p-4 shadow-lg z-30 flex justify-between items-center animate-slide-up">
                    <p className="text-sm sm:text-base">{selectedUserIds.size.toLocaleString('fa-IR')} کاربر انتخاب شده است</p>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => setIsBroadcastModalOpen(true)}
                            className="bg-white text-sky-700 font-semibold px-3 sm:px-4 py-2 rounded-lg hover:bg-sky-100 transition-colors flex items-center gap-2 text-sm sm:text-base"
                        >
                            <BroadcastIcon /> ارسال پیام گروهی
                        </button>
                        <button
                            onClick={() => setSelectedUserIds(new Set())}
                            className="text-white hover:bg-sky-600 p-2 rounded-full"
                            title="لغو انتخاب"
                        >
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out forwards;
                }
            `}</style>
        </>
    );
};

export default UsersPage;
