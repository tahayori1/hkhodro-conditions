import React, { useState, useEffect, useCallback } from 'react';
import type { Car } from '../types';
import CarTable from '../components/CarTable';
import CarModal from '../components/CarModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

interface CarsPageProps {
    setOnAddNew: (handler: (() => void) | null) => void;
}

const MOCK_CARS: Car[] = [
    { id: 1, name: 'JAC J4', brand: 'JAC', technical_specs: '1.5L Engine, Automatic', comfort_features: 'Sunroof, Leather seats', main_image_url: '', front_image_url: '', side_image_url: '', rear_image_url: '', dashboard_image_url: '', interior_image_1_url: '', interior_image_2_url: '' },
    { id: 2, name: 'KMC T8', brand: 'KMC', technical_specs: '2.0L Turbo, Manual', comfort_features: '4x4, Touchscreen', main_image_url: '', front_image_url: '', side_image_url: '', rear_image_url: '', dashboard_image_url: '', interior_image_1_url: '', interior_image_2_url: '' }
];

const CarsPage: React.FC<CarsPageProps> = ({ setOnAddNew }) => {
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [currentCar, setCurrentCar] = useState<Car | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [carToDelete, setCarToDelete] = useState<number | null>(null);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        // Simulate fetching data
        setTimeout(() => {
            setCars(MOCK_CARS);
            setLoading(false);
        }, 500);
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleAddNew = useCallback(() => {
        setCurrentCar(null);
        setIsModalOpen(true);
    }, []);

    useEffect(() => {
        setOnAddNew(() => handleAddNew);
        return () => setOnAddNew(null);
    }, [setOnAddNew, handleAddNew]);

    const handleEdit = (car: Car) => {
        setCurrentCar(car);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        setCarToDelete(id);
        setIsDeleteModalOpen(true);
    };
    
    const handleSave = async (carData: Omit<Car, 'id'>) => {
        // UI-only logic
        if (currentCar) {
            setCars(cars.map(c => c.id === currentCar.id ? { ...c, ...carData } : c));
            showToast('خودرو با موفقیت ویرایش شد', 'success');
        } else {
            const newCar = { ...carData, id: Date.now() }; // Use timestamp for unique ID in mock
            setCars([...cars, newCar]);
            showToast('خودرو جدید با موفقیت اضافه شد', 'success');
        }
        setIsModalOpen(false);
        setCurrentCar(null);
    };
    
    const confirmDelete = async () => {
        if (carToDelete !== null) {
            setCars(cars.filter(c => c.id !== carToDelete));
            showToast('خودرو با موفقیت حذف شد', 'success');
            setIsDeleteModalOpen(false);
            setCarToDelete(null);
        }
    };

    return (
        <>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-bold text-slate-700">مدیریت خودروها</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner />
                    </div>
                ) : (
                    <CarTable 
                        cars={cars} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                    />
                )}
            </main>

            {isModalOpen && (
                <CarModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    car={currentCar}
                />
            )}
            
            {isDeleteModalOpen && (
                <DeleteConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="حذف خودرو"
                    message="آیا از حذف این خودرو اطمینان دارید؟ این عملیات قابل بازگشت نیست."
                />
            )}
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default CarsPage;