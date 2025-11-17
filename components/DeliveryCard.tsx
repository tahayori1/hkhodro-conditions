
import React from 'react';
import type { DeliveryProcess } from '../types';

interface DeliveryCardProps {
    delivery: DeliveryProcess;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, deliveryId: number) => void;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({ delivery, onDragStart }) => {

    const formatDate = (dateString: string) => {
        try {
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }).format(new Date(dateString));
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, delivery.id)}
            className="bg-white rounded-md shadow-sm p-3 border border-slate-200 cursor-grab active:cursor-grabbing"
        >
            <h4 className="font-bold text-sm text-slate-800">{delivery.customerName}</h4>
            <p className="text-xs text-slate-600 mb-2">{delivery.carModel}</p>
            <p className="text-xs text-slate-500 font-mono" dir="ltr">{delivery.chassisNumber}</p>
            <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                <span>تاریخ تحویل:</span>
                <span className="font-semibold">{formatDate(delivery.scheduledDate)}</span>
            </div>
             {delivery.notes && (
                <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded whitespace-pre-wrap">{delivery.notes}</p>
            )}
        </div>
    );
};

export default DeliveryCard;
