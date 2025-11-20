

export enum ConditionStatus {
    AVAILABLE = 'موجود',
    SOLD_OUT = 'فروخته شد',
    CAPACITY_FULL = 'تکمیل ظرفیت',
}

export enum SaleType {
    FACTORY_REGISTRATION = 'ثبت‌نام کارخانه',
    TRANSFER = 'حواله',
    LEASING = 'لیزینگی',
    NEW_MARKET = 'صفر بازار',
    USED = 'کارکرده',
}

export enum PayType {
    INSTALLMENT = 'قسطی',
    CASH = 'نقدی',
    PRE_SALE = 'پیش فروش',
}

export enum DocumentStatus {
    FREE = 'آزاد',
    PLEDGED = 'در رهن',
}

export enum DeliveryStatus {
    AWAITING_DOCUMENTS = "در انتظار مدارک",
    PREPARING_VEHICLE = "آماده‌سازی خودرو",
    READY_FOR_PICKUP = "آماده تحویل",
    DELIVERED = "تحویل داده شد",
}

export interface CarSaleCondition {
    id: number;
    status: ConditionStatus;
    car_model: string;
    model: number; // Sale year
    sale_type: SaleType;
    pay_type: PayType;
    document_status: DocumentStatus;
    colors: string[];
    delivery_time: string; // e.g., '30 روز کاری'
    initial_deposit: number;
    descriptions?: string;
}

export interface User {
    id: number;
    CarModel: string;
    FullName: string;
    Number: string;
    Province: string;
    City: string;
    Decription: string;
    IP: string | null;
    RegisterTime: string;
    reference: string;
    LastAction: string;
    createdAt: string;
    updatedAt: string;
}

export interface ActiveLead {
    number: string;
    Message: string;
    media: string | null;
    receive: 0 | 1;
    updatedAt: string;
    Province: string;
    City: string;
    Decription: string;
    RegisterTime: string;
    reference: string;
    CarModel: string;
    FullName: string;
}

export interface LeadMessage {
    id: number;
    number: string;
    Message: string;
    media: string | null;
    receive: 0 | 1; // 1 for incoming (customer), 0 for outgoing (agent/system)
    createdAt: string;
    updatedAt: string;
}

export interface Car {
    id: number;
    name: string;
    brand: string;
    technical_specs: string;
    comfort_features: string;
    main_image_url: string;
    front_image_url: string;
    side_image_url: string;
    rear_image_url: string;
    dashboard_image_url: string;
    interior_image_1_url: string;
    interior_image_2_url: string;
}

export interface DealershipInfo {
    dealership_name: string;
    company_name: string;
    logo_url: string;
    establishment_year: number | string;
    activity_area: string;
    address: string;
    google_maps_url: string;
    neshan_maps_url: string;
    contact_phones: string;
    mobile_numbers: string;
    instagram_url: string;
    youtube_url: string;
    telegram_channel_url: string;
    whatsapp_channel_url: string;
    threads_url: string;
    competitive_advantages: string;
    description: string;
}

export interface CarPrice {
    id: number;
    car_model: string;
    price_date: string;
    factory_price: number;
    market_price: number;
}

export interface ScrapedCarPrice {
    id: number;
    source_name: string;
    model_name: string;
    price_text: string;
    price_rial: number;
    status: string;
    captured_at: string;
}

export interface CarPriceSource {
    source_name: string;
}

export interface CarPriceStats {
    id: number;
    model_name: string;
    minimum: number;
    maximum: number;
    average: number;
    computed_at: string;
}

export interface DeliveryProcess {
    id: number;
    customerName: string;
    carModel: string;
    chassisNumber: string;
    status: DeliveryStatus;
    scheduledDate: string; // ISO date string
    deliveredDate: string | null;
    notes: string;
}

// --- TransferPaks (Secure Transaction) Types ---

export type TransactionType = 'ZERO' | 'USED' | 'HAVALEH';

export type TransactionRole = 'ADMIN' | 'TECH_EXPERT' | 'LEGAL_EXPERT' | 'FINANCE_EXPERT' | 'CUSTOMER';

export enum TransactionStatus {
    DRAFT = 'پیش‌نویس',
    TECH_CHECK = 'کارشناسی فنی',
    LEGAL_CHECK = 'استعلام حقوقی',
    FINANCE_CHECK = 'تایید مالی',
    CONTRACT_SIGN = 'امضای قرارداد',
    COMPLETED = 'تکمیل شده',
    REJECTED = 'رد شده',
}

export interface TransactionStep {
    id: number;
    title: string;
    roleRequired: TransactionRole[];
    isCompleted: boolean;
    data?: any;
}

export interface SecureTransaction {
    id: string;
    type: TransactionType;
    status: TransactionStatus;
    carModel: string;
    sellerName: string;
    buyerName: string;
    price: number;
    currentStep: number;
    createdAt: string;
    steps: TransactionStep[];
}
