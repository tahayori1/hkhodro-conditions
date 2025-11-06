import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getActiveLeads, getLeadHistory, sendMessage, getUserByNumber } from '../services/api';
import type { User, ActiveLead, LeadMessage } from '../types';
import UserTable from '../components/UserTable';
import UserFilterPanel from '../components/UserFilterPanel';
import UserModal from '../components/UserModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import { PlusIcon } from '../components/icons/PlusIcon';
import HotLeadsPanel from '../components/HotLeadsPanel';
import LeadDetailHistoryModal from '../components/LeadHistoryModal';


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
    
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [selectedLead, setSelectedLead] = useState<User | ActiveLead | null>(null);
    const [modalMessages, setModalMessages] = useState<LeadMessage[]>([]);
    const [modalFullUser, setModalFullUser] = useState<User | null>(null);
    const [modalLoading, setModalLoading] = useState<boolean>(false);
    const [modalError, setModalError] = useState<string | null>(null);

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
            setUsers(data);
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
            const leads = await getActiveLeads();
            setActiveLeads(leads);
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

            setModalMessages(historyData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
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
        if (!selectedLead) {
            throw new Error("No active lead selected for sending message.");
        }
        
        const number = 'number' in selectedLead ? selectedLead.number : selectedLead.Number;

        try {
            await sendMessage(number, message);
            showToast('پیام با موفقیت ارسال شد', 'success');
            
            const data = await getLeadHistory(number);
            setModalMessages(data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        } catch (err) {
            showToast('ارسال پیام با خطا مواجه شد', 'error');
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
                    onViewDetails={handleViewDetails}
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
                            onViewDetails={handleViewDetails}
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