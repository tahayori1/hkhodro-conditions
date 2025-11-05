import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';
import type { User } from '../types';
import UserTable from '../components/UserTable';
import UserFilterPanel from '../components/UserFilterPanel';
import UserModal from '../components/UserModal';
import UserViewModal from '../components/UserViewModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import { PlusIcon } from '../components/icons/PlusIcon';

const ITEMS_PER_PAGE = 50;

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [userToView, setUserToView] = useState<User | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    const [query, setQuery] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchAllUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getUsers();
            setUsers(data.sort((a, b) => new Date(b.RegisterTime).getTime() - new Date(a.RegisterTime).getTime()));
        } catch (err) {
            setError('خطا در دریافت اطلاعات کاربران');
            showToast('خطا در دریافت اطلاعات کاربران', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllUsers();
    }, [fetchAllUsers]);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [query]);

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

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const lowerCaseQuery = query.toLowerCase();
            return query === '' || 
                   u.FullName.toLowerCase().includes(lowerCaseQuery) ||
                   u.Number.toLowerCase().includes(lowerCaseQuery) ||
                   u.CarModel.toLowerCase().includes(lowerCaseQuery) ||
                   u.City.toLowerCase().includes(lowerCaseQuery);
        });
    }, [users, query]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                        />
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={filteredUsers.length}
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