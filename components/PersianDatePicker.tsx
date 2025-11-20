import React, { useState, useEffect, useRef } from 'react';

// Make moment available from the global scope (loaded via CDN)
declare const moment: any;

interface PersianDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
}

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({ value, onChange }) => {
    // moment().locale('fa') will be the source of truth for display
    const [displayDate, setDisplayDate] = useState(() => moment().locale('fa'));
    // selectedDate will be a moment object representing the prop value
    const [selectedDate, setSelectedDate] = useState(() => value ? moment(value, 'YYYY-MM-DD').locale('fa') : null);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const m = value ? moment(value, 'YYYY-MM-DD').locale('fa') : null;
        setSelectedDate(m);
        // If a value is provided, set the calendar to that month
        if (m) {
            setDisplayDate(m.clone());
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);


    const changeMonth = (amount: number) => {
        setDisplayDate(displayDate.clone().add(amount, 'jMonth'));
    };

    const handleDayClick = (day: any) => {
        const newSelectedDate = day.clone();
        // The stored value should be Gregorian for API compatibility
        onChange(newSelectedDate.format('YYYY-MM-DD'));
        setIsOpen(false);
    };

    const renderCalendar = () => {
        const startOfMonth = displayDate.clone().startOf('jMonth');
        const endOfMonth = displayDate.clone().endOf('jMonth');
        const days = [];
        // The week in jalali-moment starts from Saturday (شنبه) which is what we want for a Persian calendar.
        let day = startOfMonth.clone().startOf('week');

        // Iterate through weeks to build the calendar grid
        const dayRunner = day.clone();
        for (let i = 0; i < 42; i++) { // Render 6 weeks to be safe
             days.push(dayRunner.clone());
             dayRunner.add(1, 'day');
        }


        return (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-lg p-3 z-10 border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                    <button type="button" onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                    <div className="font-semibold text-slate-700">{displayDate.format('jMMMM jYYYY')}</div>
                    <button type="button" onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                </div>
                <div className="grid grid-cols-7 text-center text-xs text-slate-500 mb-1">
                    {moment.localeData('fa').weekdaysMin().map((wd: string) => <div key={wd} className="w-9 h-9 flex items-center justify-center">{wd}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days.map((d, i) => {
                        const isCurrentMonth = d.isSame(displayDate, 'jMonth');
                        const isSelected = selectedDate && d.isSame(selectedDate, 'day');
                        const isToday = d.isSame(moment(), 'day');
                        
                        let classes = "w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition-colors ";
                        if (!isCurrentMonth) {
                            classes += "text-slate-300 cursor-default";
                        } else {
                            classes += "hover:bg-sky-100 ";
                            if (isSelected) {
                                classes += "bg-sky-600 text-white font-bold hover:bg-sky-700 ";
                            } else if (isToday) {
                                classes += "bg-slate-200 text-slate-800 ";
                            } else {
                                classes += "text-slate-700 ";
                            }
                        }
                        
                        return (
                            <div key={i} onClick={() => isCurrentMonth && handleDayClick(d)} className={classes}>
                                {d.format('jD')}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                readOnly
                value={selectedDate ? selectedDate.format('jYYYY/jMM/jDD') : ''}
                onFocus={() => setIsOpen(true)}
                placeholder="تاریخ را انتخاب کنید"
                className="w-full px-3 py-2 border rounded-md border-slate-300 bg-white cursor-pointer text-right focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
            />
            {isOpen && renderCalendar()}
        </div>
    );
};

export default PersianDatePicker;
