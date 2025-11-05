import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getActiveLeads, getLeadHistory, sendMessage, getUserByNumber } from '../services/api';
import type { User, ActiveLead, LeadMessage } from '../types';
import UserTable from '../components/UserTable';
import UserFilterPanel from '../components/UserFilterPanel';
import UserModal from '../components/UserModal';
import UserViewModal from '../components/UserViewModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import { PlusIcon } from '../components/icons/PlusIcon';
import HotLeadsPanel from '../components/HotLeadsPanel';
import LeadHistoryModal from '../components/LeadHistoryModal';


const ITEMS_PER_PAGE = 50;

type SortConfig = { key: keyof User; direction: 'ascending' | 'descending' } | null;

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [activeLeads, setActiveLeads] = useState<ActiveLead[]>([]);
    const [hotLeadsLoading, setHotLeadsLoading] = useState<boolean>(true);
    const [hotLeadsError, setHotLeadsError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [userToView, setUserToView] = useState<User | null>(null);
    
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
    const [historyLead, setHistoryLead] = useState<User | ActiveLead | null>(null);
    const [historyMessages, setHistoryMessages] = useState<LeadMessage[]>([]);
    const [historyLoading, setHistoryLoading] = useState<boolean>(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    const [query, setQuery] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'RegisterTime', direction: 'descending' });

    const fetchAllUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getUsers();
            setUsers(data); // Initial fetch, sorting happens in useMemo
        } catch (err) {
            setError('خطا در دریافت اطلاعات کاربران');
            showToast('خطا در دریافت اطلاعات کاربران', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

     const fetchActiveLeads = useCallback(async () => {
        setHotLeadsLoading(true);
        setHotLeadsError(null);
        try {
            const basicLeads = await getActiveLeads();
            const enrichedLeads = await Promise.all(
                basicLeads.map(async (lead) => {
                    try {
                        const userDetails = await getUserByNumber(lead.number);
                        return {
                            ...lead,
                            FullName: userDetails?.FullName || lead.number,
                            CarModel: userDetails?.CarModel,
                        };
                    } catch (e) {
                        return lead; // Return basic lead if details fetch fails
                    }
                })
            );
            setActiveLeads(enrichedLeads);
        } catch (err) {
            setHotLeadsError('خطا در دریافت سرنخ‌های داغ');
        } finally {
            setHotLeadsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllUsers();
        fetchActiveLeads();
    }, [fetchAllUsers, fetchActiveLeads]);

    useEffect(() => {
        setCurrentPage(1);
    }, [query, sortConfig]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };
    
    const handleAddNew = () => {
        setCurrentUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        setUserToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleView = (user: User) => {
        setUserToView(user);
        setIsViewModalOpen(true);
    };
    
    const handleViewDetailsFromLead = async (lead: ActiveLead) => {
        const fullUser = await getUserByNumber(lead.number);
        if (fullUser) {
            setUserToView(fullUser);
            setIsViewModalOpen(true);
        } else {
            showToast('جزئیات این سرنخ یافت نشد', 'error');
        }
    };

    const handleViewHistory = async (lead: User | ActiveLead) => {
        setIsHistoryModalOpen(true);
        setHistoryLead(lead);
        setHistoryLoading(true);
        setHistoryError(null);
        setHistoryMessages([]);
        try {
            const numberToFetch = 'number' in lead ? lead.number : lead.Number;
            const data = await getLeadHistory(numberToFetch);
            setHistoryMessages(data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        } catch (err) {
            setHistoryError('خطا در دریافت تاریخچه پیام‌ها');
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleCloseHistoryModal = () => {
        setIsHistoryModalOpen(false);
        setHistoryLead(null);
        setHistoryMessages([]);
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
            fetchAllUsers();
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
                fetchAllUsers();
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
        if (!historyLead) {
            throw new Error("No active lead selected for sending message.");
        }
        
        const number = 'number' in historyLead ? historyLead.number : historyLead.Number;

        try {
            await sendMessage(number, message);
            showToast('پیام با موفقیت ارسال شد', 'success');
            
            // Refetch history to show the sent message
            const data = await getLeadHistory(number);
            setHistoryMessages(data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        } catch (err) {
            showToast('ارسال پیام با خطا مواجه شد', 'error');
            // Re-throw to let the modal know the submission failed
            throw err;
        }
    };

    const sortedAndFilteredUsers = useMemo(() => {
        let filtered = users.filter(u => {
            const lowerCaseQuery = query.toLowerCase();
            return query === '' || 
                   u.FullName.toLowerCase().includes(lowerCaseQuery) ||
                   u.Number.toLowerCase().includes(lowerCaseQuery) ||
                   u.CarModel.toLowerCase().includes(lowerCaseQuery) ||
                   u.City.toLowerCase().includes(lowerCaseQuery) ||
                   (u.Province && u.Province.toLowerCase().includes(lowerCaseQuery)) ||
                   (u.Decription && u.Decription.toLowerCase().includes(lowerCaseQuery));
        });

        if (sortConfig !== null) {
            return [...filtered].sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (['RegisterTime', 'LastAction', 'createdAt', 'updatedAt'].includes(sortConfig.key)) {
                    const dateA = new Date(aValue as string).getTime();
                    const dateB = new Date(bValue as string).getTime();
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
        
        return filtered;
    }, [users, query, sortConfig]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedAndFilteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedAndFilteredUsers, currentPage]);

    const totalPages = Math.ceil(sortedAndFilteredUsers.length / ITEMS_PER_PAGE);

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <HotLeadsPanel 
                    leads={activeLeads} 
                    isLoading={hotLeadsLoading} 
                    error={hotLeadsError}
                    onViewHistory={handleViewHistory}
                    onViewDetails={handleViewDetailsFromLead}
                />
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <UserFilterPanel onFilterChange={setQuery} />
                        <button
                            onClick={handleAddNew}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-sky-700 transition-colors duration-300 shadow"
                        >
                            <PlusIcon />
                            افزودن سرنخ جدید
                        </button>
                    </div>
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
                            onView={handleView}
                            onViewHistory={handleViewHistory}
                            onSort={handleSort}
                            sortConfig={sortConfig}
                        />
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={sortedAndFilteredUsers.length}
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

            {isViewModalOpen && (
                <UserViewModal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    user={userToView}
                />
            )}

            {isHistoryModalOpen && (
                <LeadHistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={handleCloseHistoryModal}
                    lead={historyLead}
                    messages={historyMessages}
                    isLoading={historyLoading}
                    error={historyError}
                    onSendMessage={handleSendMessage}
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
        </>
    );
};

export default UsersPage;