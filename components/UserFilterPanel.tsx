import React, { useState, useEffect } from 'react';

interface UserFilterPanelProps {
    onFilterChange: (query: string) => void;
}

const UserFilterPanel: React.FC<UserFilterPanelProps> = ({ onFilterChange }) => {
    const [query, setQuery] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            onFilterChange(query);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [query, onFilterChange]);

    return (
        <div className="w-full flex">
            <input
                type="text"
                placeholder="جستجو بر اساس نام، شماره، خودرو، استان، شهر، توضیحات..."
                className="w-full md:w-96 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </div>
    );
};

export default UserFilterPanel;