
import React, { useState, useEffect, useRef } from 'react';

// Make moment available from the global scope (loaded via CDN)
declare const moment: any;

interface PersianDateTimePickerProps {
    value: string; // YYYY-MM-DD HH:mm
    onChange: (date: string) => void;
    placeholder?: string;
}

const PersianDateTimePicker: React.FC<PersianDateTimePickerProps> = ({ value, onChange, placeholder }) => {
    const [displayDate, setDisplayDate] = useState(() => moment().locale('fa'));
    const [selectedDate, setSelectedDate] = useState<any>(null);
    const [time, setTime] = useState({ hour: '09', minute: '00' });
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const m = moment(value, 'YYYY-MM-DD HH:mm').locale('fa');
            if (m.isValid()) {
                setSelectedDate(m);
                setDisplayDate(m.clone());
                setTime({ hour: m.format('HH'), minute: m.format('mm') });
            }
        }
    }, [value]);

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
        const newDate = day.clone();
        // Preserve time if previously set or default to current state
        newDate.hour(parseInt(time.hour));
        newDate.minute(parseInt(time.minute));
        setSelectedDate(newDate);
    };

    const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
        const newTime = { ...time, [type]: val.padStart(2, '0') };
        setTime(newTime);
        if (selectedDate) {
            const updatedDate = selectedDate.clone();
            updatedDate.hour(parseInt(newTime.hour));
            updatedDate.minute(parseInt(newTime.minute));
            setSelectedDate(updatedDate);
        }
    };

    const handleConfirm = () => {
        if (selectedDate) {
            onChange(selectedDate.format('YYYY-MM-DD HH:mm'));
        }
        setIsOpen(false);
    };

    const renderCalendar = () => {
        const startOfMonth = displayDate.clone().startOf('jMonth');
        // const endOfMonth = displayDate.clone().endOf('jMonth');
        const days = [];
        let day = startOfMonth.clone().startOf('week');

        // Render 6 weeks
        for (let i = 0; i < 42; i++) {
             days.push(day.clone());
             day.add(1, 'day');
        }

        const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
        const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

        return (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl p-3 z-50 border border-slate-200">
                {/* Date Header */}
                <div className="flex justify-between items-center mb-2">
                    <button type="button" onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                    <div className="font-semibold text-slate-700 text-sm">{displayDate.format('jMMMM jYYYY')}</div>
                    <button type="button" onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 text-center text-[10px] text-slate-500 mb-1">
                    {moment.localeData('fa').weekdaysMin().map((wd: string) => <div key={wd} className="w-9 h-9 flex items-center justify-center">{wd}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 border-b border-slate-200 pb-3 mb-3">
                    {days.map((d, i) => {
                        const isCurrentMonth = d.isSame(displayDate, 'jMonth');
                        const isSelected = selectedDate && d.isSame(selectedDate, 'day');
                        const isToday = d.isSame(moment(), 'day');
                        
                        let classes = "w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition-colors text-xs ";
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

                {/* Time Picker */}
                <div className="flex items-center justify-between mb-3 px-2">
                    <span className="text-xs font-bold text-slate-600">ساعت:</span>
                    <div className="flex items-center gap-1 dir-ltr">
                        <select 
                            value={time.hour} 
                            onChange={(e) => handleTimeChange('hour', e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded focus:ring-sky-500 focus:border-sky-500 block p-1 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white"
                        >
                            {hours.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="font-bold">:</span>
                        <select 
                            value={time.minute} 
                            onChange={(e) => handleTimeChange('minute', e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded focus:ring-sky-500 focus:border-sky-500 block p-1 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white"
                        >
                            {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <button 
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                        انصراف
                    </button>
                    <button 
                        type="button"
                        onClick={handleConfirm}
                        className="px-3 py-1.5 text-xs text-white bg-sky-600 hover:bg-sky-700 rounded transition-colors"
                    >
                        تایید
                    </button>
                </div>
            </div>
        );
    };

    const formatDisplay = () => {
        if (!selectedDate) return '';
        return selectedDate.format('jYYYY/jMM/jDD HH:mm');
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                readOnly
                value={formatDisplay()}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder || "تاریخ و ساعت را انتخاب کنید"}
                className="w-full px-3 py-2 border rounded-md border-slate-300 bg-white cursor-pointer text-right focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-white ltr-placeholder"
                style={{ direction: 'ltr', textAlign: 'right' }}
            />
            {isOpen && renderCalendar()}
        </div>
    );
};

export default PersianDateTimePicker;
