import React, { useState, useEffect } from 'react';
import type { ActiveLead } from '../types';
import Spinner from './Spinner';
import { PhoneIcon } from './icons/PhoneIcon';

const timeAgo = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) {
             return new Intl.RelativeTimeFormat('fa-IR').format(-seconds, 'second');
        }
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return new Intl.RelativeTimeFormat('fa-IR').format(-minutes, 'minute');
        }
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return new Intl.RelativeTimeFormat('fa-IR').format(-hours, 'hour');
        }
        const days = Math.floor(hours / 24);
        if (days < 30) {
             return new Intl.RelativeTimeFormat('fa-IR').format(-days, 'day');
        }
        const months = Math.floor(days / 30);
        if (months < 12) {
            return new Intl.RelativeTimeFormat('fa-IR').format(-months, 'month');
        }
        const years = Math.floor(days / 365);
        return new Intl.RelativeTimeFormat('fa-IR').format(-years, 'year');
    } catch(e) {
        return dateString;
    }
};

const useTimeAgo = (dateString: string) => {
    const [timeAgoText, setTimeAgoText] = useState(() => timeAgo(dateString));

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTimeAgoText(timeAgo(dateString));
        }, 60000); // Update every minute

        return () => clearInterval(intervalId);
    }, [dateString]);

    return timeAgoText;
};

interface HotLeadsPanelProps {
    leads: ActiveLead[];
    isLoading: boolean;
    error: string | null;
}

const HotLeadCard: React.FC<{ lead: ActiveLead }> = ({ lead }) => {
    const timeAgoText = useTimeAgo(lead.updatedAt);
    return (
        <div className="flex-shrink-0 w-64 bg-white rounded-xl shadow-md p-4 border border-slate-200 flex flex-col justify-between h-40">
            <p className="text-sm text-slate-700 leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                {lead.Message || <span className="italic text-slate-400">بدون پیام</span>}
            </p>
            <div>
                <a 
                    href={`tel:${lead.number}`}
                    className="flex items-center gap-2 text-sky-600 font-bold hover:text-sky-800 transition-colors"
                    dir="ltr"
                >
                    <PhoneIcon className="w-4 h-4" />
                    {lead.number}
                </a>
                <p className="text-xs text-slate-400 mt-1 text-left">{timeAgoText}</p>
            </div>
        </div>
    );
};

const HotLeadsPanel: React.FC<HotLeadsPanelProps> = ({ leads, isLoading, error }) => {
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-40">
                    <Spinner />
                </div>
            );
        }
        if (error) {
            return <p className="text-center text-red-600 font-semibold h-40 flex items-center justify-center">{error}</p>;
        }
        if (leads.length === 0) {
            return <p className="text-center text-slate-500 h-40 flex items-center justify-center">در حال حاضر سرنخ داغی وجود ندارد.</p>;
        }
        return (
            <div className="flex gap-4 overflow-x-auto p-2 -m-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                 <style>{`
                    .flex.gap-4.overflow-x-auto::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                 {leads.map((lead, index) => (
                    <HotLeadCard key={`${lead.number}-${index}`} lead={lead} />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg shadow-md mb-8 border border-amber-200">
            <h2 className="text-xl font-bold text-amber-800 mb-4">
                سرنخ‌های داغ 🔥
            </h2>
            {renderContent()}
        </div>
    );
};

export default HotLeadsPanel;
