
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
    crmIsSend?: 0 | 1;
    crmPerson?: string;
    crmDate?: string;
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

export interface ActiveLead {
    FullName: string;
    CarModel: string | null;
    Message: string;
    number: string;
    updatedAt: string;
}

export enum DeliveryStatus {
    AWAITING_DOCUMENTS = 'در انتظار مدارک',
    PREPARING_VEHICLE = 'آماده‌سازی خودرو',
    READY_FOR_PICKUP = 'آماده تحویل',
    DELIVERED = 'تحویل داده شد',
}

export interface DeliveryProcess {
    id: number;
    customerName: string;
    carModel: string;
    chassisNumber: string;
    status: DeliveryStatus;
    scheduledDate: string; // ISO date string
    deliveredDate: string | null; // ISO date string
    notes?: string;
}


export enum TransactionStatus {
    DRAFT = 'پیش‌نویس',
    TECH_CHECK = 'در انتظار کارشناسی',
    LEGAL_CHECK = 'در انتظار حقوقی',
    FINANCE_CHECK = 'در انتظار مالی',
    CONTRACT_SIGN = 'آماده امضا',
    COMPLETED = 'تکمیل شده',
    CANCELLED = 'لغو شده',
}

export type TransactionType = 'ZERO' | 'USED' | 'HAVALEH';
export type TransactionRole = 'ADMIN' | 'TECH_EXPERT' | 'LEGAL_EXPERT' | 'FINANCE_EXPERT' | 'CUSTOMER';

export interface TransactionStep {
    id: number;
    title: string;
    roleRequired: TransactionRole[];
    isCompleted: boolean;
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


// --- Access Control Types ---

export type AppModule = 'users' | 'conditions' | 'cars' | 'prices' | 'vehicle-exit' | 'settings';
export type ActionType = 'view' | 'add' | 'edit' | 'delete';

export interface Permission {
    module: AppModule;
    actions: ActionType[];
}

export interface ApiSystemUser {
    id: number;
    username: string;
    full_name: string | null;
    whatsapp_apikey: string | null;
    permission_level: number; // 0 or 1
    isAdmin: number; // 0 or 1
    register_time: string;
    last_update: string;
    mobile: string | null;
    email: string | null;
    password?: string; // Optional for request payloads
    // Expanded Profile Fields
    personality_type?: string;
    birth_date?: string;
    org_phone?: string;
    org_email?: string;
    didar_username?: string;
}

export interface MyProfile {
    id: number;
    username: string;
    full_name: string | null;
    whatsapp_apikey: string | null;
    permission_level: number;
    isAdmin: 0 | 1;
    register_time: string;
    last_update: string;
    mobile: string | null;
    email: string | null;
    mbti: string | null;
    description: string | null;
    last_login: string | null;
    birth_date: string | null;
}

export interface StaffUser {
    id: number | string; // string for new users
    username: string;
    password?: string; // Optional, used only for creation
    fullName: string;
    role: 'ADMIN' | 'STAFF';
    permissions: Permission[];
    lastLogin?: string;
    isActive: boolean;
}

// --- Poll Types ---

export interface PollQuestionMap {
    Title: string;
    Key: string;
}

export interface PollCustomerFields {
    [key: string]: string | number;
}

export interface PollCustomerContact {
    DisplayName: string;
    MobilePhone: string;
}

export interface PollCustomerResult {
    Fields: PollCustomerFields;
    Description: string; // HTML string with car info
    Contact: PollCustomerContact;
    PipelineChangeTime: string;
    DeliveryDate?: string;
}

export interface PollAverages {
    [key: string]: number;
}

export interface PollApiResponseItem {
    AverageAll?: PollAverages;
    perCustomerResults?: PollCustomerResult[];
    inProgress?: PollCustomerResult[];
    NotAnswered?: PollCustomerResult[];
    fieldsGuid?: PollQuestionMap[];
}

export interface ProcessedPollData {
    averages: PollAverages;
    customers: PollCustomerResult[]; // Completed
    inProgress: PollCustomerResult[]; // In Progress
    notAnswered: PollCustomerResult[]; // Not Answered
    questions: Record<string, string>; // Key -> Title Mapping
}

// --- HR & Admin Types ---

export interface CorrectiveAction {
    id: number;
    title: string;
    description: string;
    responsiblePerson: string;
    dueDate: string;
    isCompleted: boolean;
    createdAt: string;
}

export interface MeetingMinute {
    id: number;
    title: string;
    date: string;
    attendees: string;
    decisions: string;
}

export type LeaveType = 'HOURLY' | 'DAILY';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
    id: number;
    requesterName: string;
    type: LeaveType;
    startDate: string;
    endDate?: string; // For daily
    hours?: number; // For hourly
    reason: string;
    status: LeaveStatus;
    createdAt: string;
}

export interface AnonymousFeedback {
    id: number;
    subject: string;
    message: string;
    createdAt: string;
    isRead: boolean;
}

// --- Zero Car Delivery Types ---

export interface ZeroCarDelivery {
    id: number;
    // Section 1: Verification
    customerName: string;
    carModel: string;
    color: string;
    chassisNumber: string;
    documentDate: string;
    phoneNumber: string;
    status: 'VERIFICATION' | 'PROCESSING' | 'DELIVERED';
    secondOwnerName?: string;
    verificationNotes?: string;

    // Section 2: Delivery Process (Dates include times)
    arrivalDateTime?: string;
    contactDateTime?: string;
    deliveryDateTime?: string;
    installedOptions?: string;
    deliveryNotes?: string;
}
