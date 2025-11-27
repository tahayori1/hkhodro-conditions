
import React, { useState, useEffect, useMemo } from 'react';
import { getPollAverages } from '../services/api';
import type { ProcessedPollData, PollCustomerResult } from '../types';
import Spinner from '../components/Spinner';
import { PollIcon } from '../components/icons/PollIcon';
import { ChatIcon } from '../components/icons/ChatIcon';

interface PollResult {
    question: string;
    score: number;
    key: string;
}

// --- Helpers ---

const calculateCustomerAverage = (fields: Record<string, any>): number => {
    const scores = Object.entries(fields)
        .filter(([key, value]) => key.startsWith('Field_') && typeof value === 'number')
        .map(([, value]) => value as number);
    
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
};

const parseInfo = (html: string) => {
    const getText = (marker: string) => {
        const match = html.match(new RegExp(`${marker}:?\\s*([^<]*)`));
        return match ? match[1].trim() : '';
    };
    return {
        car: getText('نام خودرو'),
        color: getText('رنگ خودرو'),
        chassis: getText('شماره شاسی'),
        deliveryDate: getText('تاریخ تحویل')
    };
};

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
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

// --- Components ---

const ChartBar: React.FC<PollResult> = ({ question, score }) => {
    const percentage = Math.min(100, (score / 10) * 100);
    
    const getBarColor = () => {
        if (score >= 9) return 'bg-emerald-500';
        if (score >= 7.5) return 'bg-emerald-400';
        if (score >= 6) return 'bg-amber-400';
        return 'bg-rose-500';
    };

    return (
        <div className="mb-6 animate-fade-in">
            <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[80%]">{question}</h4>
                <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">{score.toFixed(1)}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor()}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const StatusPieChart: React.FC<{ completed: number, inProgress: number, notAnswered: number }> = ({ completed, inProgress, notAnswered }) => {
    const total = completed + inProgress + notAnswered;
    if (total === 0) return null;

    const p1 = (completed / total) * 100;
    const p2 = (inProgress / total) * 100;
    // const p3 = (notAnswered / total) * 100; // Remaining

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center h-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">وضعیت کلی نظرسنجی‌ها</h3>
            <div className="relative w-40 h-40 rounded-full" style={{
                background: `conic-gradient(
                    #10b981 0% ${p1}%, 
                    #f59e0b ${p1}% ${p1 + p2}%, 
                    #f43f5e ${p1 + p2}% 100%
                )`
            }}>
                <div className="absolute inset-4 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center flex-col shadow-inner">
                    <span className="text-3xl font-black text-slate-700 dark:text-slate-200 font-mono">{total}</span>
                    <span className="text-xs text-slate-400 font-bold">کل موارد</span>
                </div>
            </div>
            <div className="mt-6 w-full space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">پاسخ داده شده</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{completed}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">در حال انجام</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{inProgress}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">پاسخ نداده</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{notAnswered}</span>
                </div>
            </div>
        </div>
    );
};

const ScoreDistributionChart: React.FC<{ customers: PollCustomerResult[] }> = ({ customers }) => {
    const buckets = [0, 0, 0, 0]; // 0-5 (Poor), 5-7 (Weak), 7-9 (Good), 9-10 (Excellent)
    
    customers.forEach(c => {
        const avg = calculateCustomerAverage(c.Fields);
        if (avg < 5) buckets[0]++;
        else if (avg < 7) buckets[1]++;
        else if (avg < 9) buckets[2]++;
        else buckets[3]++;
    });

    const max = Math.max(...buckets, 1); // Avoid division by zero
    const labels = ['ناراضی (۰-۵)', 'متوسط (۵-۷)', 'خوب (۷-۹)', 'عالی (۹-۱۰)'];
    const colors = ['bg-rose-500', 'bg-orange-400', 'bg-sky-500', 'bg-emerald-500'];

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">توزیع نمرات رضایت</h3>
            <div className="flex items-end justify-between flex-grow gap-2 sm:gap-4 min-h-[160px] pb-2">
                {buckets.map((count, idx) => {
                    const height = Math.max((count / max) * 100, 2); // Min height 2%
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                            <div 
                                className={`w-full rounded-t-lg transition-all duration-700 ease-out relative ${colors[idx]} bg-opacity-90 hover:bg-opacity-100`} 
                                style={{ height: `${height}%` }}
                            >
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">{count}</div>
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center whitespace-nowrap">{labels[idx]}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CustomerFeedbackCard: React.FC<{ 
    result: PollCustomerResult, 
    questionMap: Record<string, string> 
}> = ({ result, questionMap }) => {
    
    const info = parseInfo(result.Description || '');
    const commentKey = "Field_8785_1_17"; // Known key for text comment
    const comment = result.Fields[commentKey];
    const averageScore = calculateCustomerAverage(result.Fields);

    // Filter out the comment field and non-question fields to get scores
    const scores = Object.entries(result.Fields)
        .filter(([key]) => key !== commentKey && key.startsWith('Field_'))
        .map(([key, value]) => ({
            key,
            score: Number(value)
        }));

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all relative overflow-hidden">
            {/* Overall Score Badge */}
            <div className={`absolute top-0 left-0 px-3 py-1.5 rounded-br-xl text-xs font-bold font-mono ${
                averageScore >= 9 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                averageScore >= 7 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' :
                'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
            }`}>
                میانگین: {averageScore.toFixed(1)}
            </div>

            <div className="flex justify-between items-start mb-4 mt-4">
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg">{result.Contact.DisplayName}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-mono mt-1" dir="ltr">{result.Contact.MobilePhone}</p>
                </div>
                <div className="text-right">
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold">
                        {info.car || 'خودرو نامشخص'}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">شاسی: {info.chassis}</div>
                </div>
            </div>

            {comment && comment !== '-' && (
                <div className="bg-sky-50 dark:bg-sky-900/20 p-3 rounded-lg mb-4 flex gap-3 items-start">
                    <ChatIcon className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed">"{comment}"</p>
                </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {scores.map(s => {
                    // Try to find a short label or just use index
                    const fullTitle = questionMap[s.key] || '';
                    // Extract a short keyword if possible
                    const shortLabel = fullTitle.includes('برخورد') ? 'برخورد' :
                                     fullTitle.includes('اطلاع‌رسانی') ? 'اطلاع‌رسانی' :
                                     fullTitle.includes('تحویل') ? 'تحویل' :
                                     fullTitle.includes('سرعت') ? 'سرعت' :
                                     fullTitle.includes('امکانات') ? 'امکانات' :
                                     fullTitle.includes('کیفیت') ? 'کیفیت' : 'سایر';

                    let colorClass = 'bg-slate-100 text-slate-600';
                    if (s.score >= 9) colorClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
                    else if (s.score <= 6) colorClass = 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';

                    return (
                        <div key={s.key} className={`flex flex-col items-center justify-center p-2 rounded-lg ${colorClass}`}>
                            <span className="text-lg font-bold font-mono">{s.score}</span>
                            <span className="text-[9px] opacity-80">{shortLabel}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PendingCustomerCard: React.FC<{ 
    result: PollCustomerResult, 
    type: 'IN_PROGRESS' | 'NOT_ANSWERED' 
}> = ({ result, type }) => {
    
    const info = parseInfo(result.Description || '');
    const isProgress = type === 'IN_PROGRESS';

    return (
        <div className={`rounded-xl p-5 shadow-sm border transition-all relative overflow-hidden ${
            isProgress 
                ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800' 
                : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
        }`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg">{result.Contact.DisplayName}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-mono mt-1" dir="ltr">{result.Contact.MobilePhone}</p>
                </div>
                <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${isProgress ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                        {isProgress ? 'در حال انجام' : 'پاسخ نداده'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-slate-600 dark:text-slate-400 border-t border-dashed border-slate-300 pt-3">
                <span className="font-bold">{info.car || 'خودرو نامشخص'}</span>
                <span>|</span>
                <span className="font-mono">{info.chassis}</span>
            </div>
            
            <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
               آخرین تغییر وضعیت: <span className="font-mono">{formatDate(result.PipelineChangeTime)}</span>
            </div>
        </div>
    );
};

const PollPage: React.FC = () => {
    const [data, setData] = useState<ProcessedPollData>({ averages: {}, customers: [], inProgress: [], notAnswered: [], questions: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'SUMMARY' | 'FEEDBACK' | 'IN_PROGRESS' | 'NOT_ANSWERED'>('SUMMARY');
    const [showDissatisfiedOnly, setShowDissatisfiedOnly] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await getPollAverages();
                setData(result);
            } catch (err) {
                setError('خطا در بارگذاری نتایج نظرسنجی');
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    const summaryResults = useMemo((): PollResult[] => {
        return Object.entries(data.averages)
            .map(([key, score]) => {
                const lookupKey = key.replace('average_', '');
                return {
                    key: lookupKey,
                    question: data.questions[lookupKey] || 'سوال نامشخص',
                    score: Number(score)
                };
            })
            .sort((a, b) => b.score - a.score);
    }, [data]);

    const overallAverage = useMemo(() => {
        if (summaryResults.length === 0) return 0;
        const totalScore = summaryResults.reduce((sum, item) => sum + item.score, 0);
        return totalScore / summaryResults.length;
    }, [summaryResults]);

    const filteredCustomers = useMemo(() => {
        let list = data.customers || [];
        if (showDissatisfiedOnly) {
            list = list.filter(c => calculateCustomerAverage(c.Fields) < 7);
        }
        return list;
    }, [data.customers, showDissatisfiedOnly]);

    const TabButton = ({ id, label, count, colorClass }: { id: typeof activeTab, label: string, count?: number, colorClass?: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`relative px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === id 
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'
            }`}
        >
            {label}
            {count !== undefined && count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${colorClass || 'bg-slate-200 text-slate-600'}`}>
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
                <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3 w-full xl:w-auto">
                        <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                            <PollIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">نتایج نظرسنجی مشتریان</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">تحلیل رضایت‌مندی و پیگیری وضعیت نظرسنجی‌ها</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto items-center">
                        {activeTab === 'FEEDBACK' && (
                            <button
                                onClick={() => setShowDissatisfiedOnly(!showDissatisfiedOnly)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all w-full sm:w-auto justify-center ${
                                    showDissatisfiedOnly 
                                    ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-300' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${showDissatisfiedOnly ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                فقط ناراضی‌ها
                            </button>
                        )}

                        {/* Tabs */}
                        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
                            <TabButton id="SUMMARY" label="خلاصه" />
                            <TabButton 
                                id="FEEDBACK" 
                                label="پاسخ‌ها" 
                                count={data.customers?.length} 
                                colorClass="bg-emerald-100 text-emerald-700"
                            />
                            <TabButton 
                                id="IN_PROGRESS" 
                                label="در جریان" 
                                count={data.inProgress?.length} 
                                colorClass="bg-amber-100 text-amber-700"
                            />
                            <TabButton 
                                id="NOT_ANSWERED" 
                                label="پاسخ نداده" 
                                count={data.notAnswered?.length} 
                                colorClass="bg-rose-100 text-rose-700"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><Spinner /></div>
            ) : error ? (
                <p className="text-center text-red-500 py-10">{error}</p>
            ) : (
                <>
                    {activeTab === 'SUMMARY' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Top Row: High Level Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* 1. Status Pie Chart */}
                                <StatusPieChart completed={data.customers.length} inProgress={data.inProgress.length} notAnswered={data.notAnswered.length} />
                                
                                {/* 2. Overall Gauge */}
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center h-full">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">شاخص کل رضایت</h3>
                                    <div className="relative w-40 h-40">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                            <path
                                                className="text-slate-100 dark:text-slate-700"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                            />
                                            <path
                                                className={`${overallAverage >= 9 ? 'text-emerald-500' : overallAverage >= 7.5 ? 'text-emerald-400' : 'text-amber-400'}`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeDasharray={`${(overallAverage / 10) * 100}, 100`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-4xl font-black text-slate-800 dark:text-white font-mono tracking-tighter">
                                                {overallAverage.toFixed(1)}
                                            </span>
                                            <span className="text-sm text-slate-400 font-bold">از ۱۰</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Score Distribution Bar Chart */}
                                <ScoreDistributionChart customers={data.customers} />
                            </div>

                            {/* Bottom Row: Question Breakdown */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b pb-2 dark:border-slate-700">تفکیک سوالات</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    {summaryResults.map(result => (
                                        <ChartBar key={result.key} {...result} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'FEEDBACK' && (
                        <div className="animate-fade-in">
                            {filteredCustomers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
                                    <PollIcon className="w-16 h-16 opacity-20 mb-4" />
                                    <p className="font-medium">
                                        {showDissatisfiedOnly ? 'مشتری ناراضی یافت نشد (خوشبختانه!)' : 'هیچ نظر ثبت‌شده‌ای موجود نیست.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredCustomers.map((customer, idx) => (
                                        <CustomerFeedbackCard 
                                            key={idx} 
                                            result={customer} 
                                            questionMap={data.questions} 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'IN_PROGRESS' && (
                        <div className="animate-fade-in">
                            {data.inProgress.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">هیچ نظرسنجی در حال انجامی وجود ندارد.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {data.inProgress.map((customer, idx) => (
                                        <PendingCustomerCard key={idx} result={customer} type="IN_PROGRESS" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'NOT_ANSWERED' && (
                        <div className="animate-fade-in">
                            {data.notAnswered.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">موردی یافت نشد.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {data.notAnswered.map((customer, idx) => (
                                        <PendingCustomerCard key={idx} result={customer} type="NOT_ANSWERED" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PollPage;
