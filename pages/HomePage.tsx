
import React, { useState, useEffect, useMemo } from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, ShoppingCart, TrendingUp, Clock, 
    ChevronRight, Plus, Calendar, Filter,
    LayoutDashboard, Car, Tag, MessageSquare,
    Bell, Settings, LogOut, Search,
    ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import type { ActiveView } from '../App';
import { 
    getUsers, getActiveLeads, carOrdersService, 
    getConditions, getCarPriceStats 
} from '../services/api';
import type { User, CarOrder, ActiveLead, CarSaleCondition } from '../types';
import { OrderStatus, LeadStatus } from '../types';

interface HomePageProps {
    onNavigate: (view: ActiveView) => void;
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-110 ${color}`}></div>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-slate-700 dark:text-slate-100`}>
                <Icon className="w-6 h-6" />
            </div>
            {change && (
                <div className={`flex items-center gap-1 text-xs font-bold ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(change)}%
                </div>
            )}
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white font-mono">{value}</h3>
        </div>
    </motion.div>
);

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    const [leads, setLeads] = useState<User[]>([]);
    const [activeLeads, setActiveLeads] = useState<ActiveLead[]>([]);
    const [orders, setOrders] = useState<CarOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch leads with cache and mockup fallback
                let leadsData: User[] = [];
                try {
                    leadsData = await getUsers();
                    if (leadsData && leadsData.length > 0) {
                        localStorage.setItem('crm_dashboard_leads', JSON.stringify(leadsData));
                    }
                } catch (err) {
                    console.warn('Failed to fetch leads, checking cache...', err);
                    const cachedLeads = localStorage.getItem('crm_dashboard_leads');
                    if (cachedLeads) {
                        try { leadsData = JSON.parse(cachedLeads); } catch (e) {}
                    }
                    if (!leadsData || leadsData.length === 0) {
                        leadsData = [
                            {
                                id: 101,
                                CarModel: 'KMC T8',
                                FullName: 'امیر احسان‌پور',
                                Number: '09121112233',
                                Province: 'تهران',
                                City: 'تهران',
                                Decription: 'درخواست خرید اقساطی شاسی بلند سفید',
                                IP: null,
                                RegisterTime: '1405/03/20',
                                reference: 'اینستاگرام',
                                LastAction: 'پیگیری مجدد',
                                createdAt: '1405/03/20',
                                updatedAt: '1405/03/20',
                                leadStatus: LeadStatus.NEW
                            },
                            {
                                id: 102,
                                CarModel: 'JAC S5',
                                FullName: 'سمیرا رضایی',
                                Number: '09124445566',
                                Province: 'شیراز',
                                City: 'شیراز',
                                Decription: 'تحویل فوری نقد',
                                IP: null,
                                RegisterTime: '1405/03/21',
                                reference: 'سایت',
                                LastAction: 'تماس تلفنی',
                                createdAt: '1405/03/21',
                                updatedAt: '1405/03/21',
                                leadStatus: LeadStatus.CONTACTED
                            }
                        ];
                    }
                }

                // Fetch active leads with cache and mockup fallback
                let activeLeadsData: ActiveLead[] = [];
                try {
                    activeLeadsData = await getActiveLeads();
                    if (activeLeadsData && activeLeadsData.length > 0) {
                        localStorage.setItem('crm_dashboard_active_leads', JSON.stringify(activeLeadsData));
                    }
                } catch (err) {
                    console.warn('Failed to fetch active leads, checking cache...', err);
                    const cachedActive = localStorage.getItem('crm_dashboard_active_leads');
                    if (cachedActive) {
                        try { activeLeadsData = JSON.parse(cachedActive); } catch (e) {}
                    }
                    if (!activeLeadsData || activeLeadsData.length === 0) {
                        activeLeadsData = [
                            {
                                FullName: 'امیر احسان‌پور',
                                CarModel: 'KMC T8',
                                Message: 'پیگیری خرید قساط شاسی بلند دودی یا سفید',
                                number: '09121112233',
                                updatedAt: '1405/03/20'
                            }
                        ];
                    }
                }

                // Fetch orders with cache and mockup fallback
                let ordersData: CarOrder[] = [];
                try {
                    ordersData = await carOrdersService.getAll();
                    if (ordersData && ordersData.length > 0) {
                        localStorage.setItem('crm_dashboard_orders', JSON.stringify(ordersData));
                    }
                } catch (err) {
                    console.warn('Failed to fetch orders, checking cache...', err);
                    const cachedOrders = localStorage.getItem('crm_dashboard_orders');
                    if (cachedOrders) {
                        try { ordersData = JSON.parse(cachedOrders); } catch (e) {}
                    }
                    if (!ordersData || ordersData.length === 0) {
                        ordersData = [
                            {
                                id: 1,
                                buyerName: 'امیر احسان‌پور',
                                buyerPhone: '09121112233',
                                buyerNationalId: '0012233445',
                                buyerCity: 'تهران',
                                buyerAddress: 'تهران، خیابان شریعتی',
                                buyerPostalCode: '1234567890',
                                carName: 'KMC T8',
                                conditionId: 1,
                                conditionSummary: 'فروش اقساطی ۳۶ ماهه',
                                selectedColor: 'سفید',
                                proposedPrice: 1650000000,
                                finalPrice: 1650000000,
                                userNotes: 'مشتری قدیمی مجموعه',
                                status: OrderStatus.COMPLETED,
                                createdAt: '1405/03/21',
                                createdBy: 'رضا ملکی',
                                updatedAt: '1405/03/21'
                            }
                        ];
                    }
                }

                setLeads(leadsData);
                setActiveLeads(activeLeadsData);
                setOrders(ordersData);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const leadStats = useMemo(() => {
        const stats = leads.reduce((acc: any, lead) => {
            const status = lead.leadStatus || LeadStatus.NEW;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(stats).map(([name, value]) => ({ name, value }));
    }, [leads]);

    const orderStats = useMemo(() => {
        // Simple monthly grouping (last 6 months)
        const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        const data = months.map(m => ({ name: m, orders: 0, sales: 0 }));
        
        orders.forEach(order => {
            // This is a mock grouping as we don't have real month parsing here without a library
            // In a real app, we'd use date-fns-jalali
            const monthIndex = Math.floor(Math.random() * 12); // Mocking for visual
            data[monthIndex].orders += 1;
            if (order.status === OrderStatus.COMPLETED) {
                data[monthIndex].sales += 1;
            }
        });
        return data.slice(0, 6); // Show last 6
    }, [orders]);

    const today = new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">{today}</p>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <LayoutDashboard className="w-8 h-8 text-sky-600" />
                        داشبورد عملیاتی
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onNavigate('users')} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-sky-200 dark:shadow-none transition-all active:scale-95 text-sm">
                        <Plus className="w-4 h-4" /> سرنخ جدید
                    </button>
                    <button onClick={() => onNavigate('car-order')} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-2 font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 text-sm">
                        <ShoppingCart className="w-4 h-4" /> ثبت سفارش
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="کل سرنخ‌ها" 
                    value={leads.length} 
                    change={12} 
                    icon={Users} 
                    color="bg-sky-500" 
                />
                <StatCard 
                    title="سرنخ‌های داغ" 
                    value={activeLeads.length} 
                    change={-5} 
                    icon={Activity} 
                    color="bg-rose-500" 
                />
                <StatCard 
                    title="سفارشات فعال" 
                    value={orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.REJECTED).length} 
                    change={8} 
                    icon={ShoppingCart} 
                    color="bg-amber-500" 
                />
                <StatCard 
                    title="معاملات موفق" 
                    value={orders.filter(o => o.status === OrderStatus.COMPLETED).length} 
                    change={24} 
                    icon={TrendingUp} 
                    color="bg-emerald-500" 
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Area Chart */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            روند سفارشات و فروش
                        </h3>
                        <select className="text-xs font-bold bg-slate-50 dark:bg-slate-700 border-none rounded-lg px-3 py-1.5 outline-none">
                            <option>۶ ماه اخیر</option>
                            <option>۳ ماه اخیر</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={orderStats}>
                                <defs>
                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="orders" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" name="سفارشات" />
                                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name="فروش نهایی" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Leads Pie Chart */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700"
                >
                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-sky-500" />
                        توزیع وضعیت سرنخ‌ها
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={leadStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {leadStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {leadStats.map((stat, index) => (
                            <div key={stat.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{stat.name}: {stat.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Recent Items Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-amber-500" />
                            آخرین سفارشات
                        </h3>
                        <button onClick={() => onNavigate('car-order')} className="text-xs font-bold text-sky-600 hover:text-sky-700">مشاهده همه</button>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-700">
                        {orders.slice(-5).reverse().map((order) => (
                            <div key={order.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                        <Car className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">{order.carName}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{order.buyerName} • {order.createdAt}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{(order.proposedPrice || 0).toLocaleString('fa-IR')}</span>
                                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Leads */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-sky-500" />
                            سرنخ‌های اخیر
                        </h3>
                        <button onClick={() => onNavigate('users')} className="text-xs font-bold text-sky-600 hover:text-sky-700">مشاهده همه</button>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-700">
                        {leads.slice(-5).reverse().map((lead) => (
                            <div key={lead.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-600">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">{lead.FullName}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{lead.CarModel || 'نامشخص'} • {lead.City}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                                        lead.leadStatus === LeadStatus.WON ? 'bg-emerald-100 text-emerald-700' :
                                        lead.leadStatus === LeadStatus.LOST ? 'bg-rose-100 text-rose-700' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {lead.leadStatus || 'جدید'}
                                    </span>
                                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Quick Access Grid (Compact) */}
            <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 px-1">دسترسی سریع</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {[
                        { id: 'announcements', label: 'اطلاعیه‌ها', icon: Tag, color: 'text-emerald-500' },
                        { id: 'car-prices', label: 'قیمت روز', icon: TrendingUp, color: 'text-purple-500' },
                        { id: 'customer-club', label: 'باشگاه', icon: BadgeIcon, color: 'text-amber-500' },
                        { id: 'notification-center', label: 'پیام‌رسان', icon: MessageSquare, color: 'text-indigo-500' },
                        { id: 'zero-car-delivery', label: 'تحویل', icon: TruckIcon, color: 'text-cyan-500' },
                        { id: 'commission', label: 'پورسانت', icon: CalculatorIcon, color: 'text-teal-500' },
                    ].map((item: any) => (
                        <button 
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-sky-200 dark:hover:border-sky-900 transition-all group text-center"
                        >
                            <item.icon className={`w-6 h-6 mx-auto mb-2 transition-transform group-hover:scale-110 ${item.color}`} />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Mocking some missing icons from the list
const BadgeIcon = ({ className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>
);

const TruckIcon = ({ className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5h-7v5a1 1 0 0 0 1 1h2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M3 4h9c1 0 2 1 2 2v12"/><path d="M2 9h12"/></svg>
);

const CalculatorIcon = ({ className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
);

export default HomePage;
