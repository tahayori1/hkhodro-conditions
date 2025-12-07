
import type { 
    Car, 
    CarSaleCondition, 
    User, 
    LeadMessage, 
    DealershipInfo, 
    CarPrice, 
    ScrapedCarPrice, 
    CarPriceSource, 
    CarPriceStats,
    ActiveLead,
    DeliveryProcess,
    DeliveryStatus,
    StaffUser,
    ApiSystemUser,
    Permission,
    PollApiResponseItem,
    ProcessedPollData,
    ZeroCarDelivery,
    CorrectiveAction,
    LeaveRequest,
    AnonymousFeedback,
    MeetingMinute,
    MyProfile
} from '../types';

const API_BASE_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1';

const handleResponse = async (response: Response) => {
    if (response.status === 401) {
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('authToken');
        window.location.reload();
        throw new Error('نشست شما منقضی شده است. لطفا دوباره وارد شوید.');
    }

    if (response.ok) {
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return;
        }
        return response.json();
    } else {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: `Request failed with status ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
};

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const ensureOnline = () => {
    if (!navigator.onLine) {
        throw new Error('این عملیات در حالت آفلاین امکان‌پذیر نیست.');
    }
};

// --- Auth ---

export const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

export const login = async (username: string, password: string): Promise<{ token: string; id: number }> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            return data[0];
        }
        if (data && typeof data === 'object' && !Array.isArray(data) && data.token && data.id) {
            return data;
        }
        throw new Error('فرمت پاسخ ورود نامعتبر است.');
    } else {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: 'نام کاربری یا رمز عبور اشتباه است.' };
        }
        throw new Error(errorData.message || `خطا در ورود: ${response.status}`);
    }
};

export const createUserAccount = async (username: string, password: string): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/auth/new`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
        return;
    } else {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: 'ایجاد کاربر با خطا مواجه شد. شاید این نام کاربری قبلا استفاده شده باشد.' };
        }
        throw new Error(errorData.message || `خطا در ایجاد کاربر: ${response.status}`);
    }
};

// --- Staff Management ---

const USER_MGMT_URL = `${API_BASE_URL}/auth/user`;

export const getStaffUsers = async (): Promise<StaffUser[]> => {
    ensureOnline();
    
    // Fetch users and permissions. We handle permissions failure gracefully.
    const usersPromise = (async () => {
        const response = await fetch(`${API_BASE_URL}/auth/userslist`, { headers: getAuthHeaders() });
        return handleResponse(response);
    })();

    const permissionsPromise = permissionsService.getAll().catch(() => []); // Return empty array on failure

    const [apiUsers, allPermissions] = await Promise.all([usersPromise, permissionsPromise]);
    
    let usersArray: ApiSystemUser[] = [];
    if (Array.isArray(apiUsers)) {
        usersArray = apiUsers;
    } else if (apiUsers && typeof apiUsers === 'object') {
        // Handle single object response
        usersArray = [apiUsers as ApiSystemUser];
    } else {
        console.error("Expected an array of users from API, but got:", apiUsers);
        return [];
    }

    return usersArray.map(user => {
        const isAdmin = user.isAdmin === 1;
        // Find permission record for this user (assuming username match)
        const permRecord = (allPermissions as any[]).find((p: any) => p.username === user.username);
        // If user is admin, they have implicit full permissions. Otherwise, use stored permissions.
        const permissions = isAdmin ? [] : (permRecord?.permissions || []);
        
        return {
            id: user.id,
            username: user.username,
            fullName: user.full_name || user.username,
            role: isAdmin ? 'ADMIN' : 'STAFF',
            permissions: permissions,
            lastLogin: user.last_update || user.register_time,
            isActive: true 
        };
    });
};

const addApiUser = async (payload: any) => {
    const response = await fetch(USER_MGMT_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
};

const updateApiUser = async (payload: any) => {
    const response = await fetch(USER_MGMT_URL, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
};

const deleteApiUser = async (id: number) => {
    const response = await fetch(USER_MGMT_URL, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id })
    });
    return handleResponse(response);
};

export const saveStaffUser = async (user: Partial<StaffUser>): Promise<void> => {
    ensureOnline();
    
    // Prepare payload for API
    const apiPayload: any = {
        username: user.username,
        full_name: user.fullName,
        isAdmin: user.role === 'ADMIN' ? 1 : 0,
        permission_level: 1, // Default permission level
    };

    if (user.password) {
        apiPayload.password = user.password;
    }

    // Save User Data
    if (typeof user.id === 'number') {
        apiPayload.id = user.id;
        await updateApiUser(apiPayload);
    } else {
        await addApiUser(apiPayload);
    }
    
    // Save Permissions via API (for non-admin users)
    if (user.username && user.role === 'STAFF' && user.permissions) {
        const allPermissions = await permissionsService.getAll();
        const existingRecord = allPermissions.find((p: any) => p.username === user.username);

        if (existingRecord) {
            await permissionsService.update({
                id: existingRecord.id,
                username: user.username,
                permissions: user.permissions
            });
        } else {
            await permissionsService.create({
                username: user.username,
                permissions: user.permissions
            });
        }
    }
};

export const deleteStaffUser = async (id: number, username: string): Promise<void> => {
    ensureOnline();
    
    // Server-side deletion of user
    await deleteApiUser(id);

    // Delete permissions record
    const allPermissions = await permissionsService.getAll();
    const existingRecord = allPermissions.find((p: any) => p.username === username);
    if (existingRecord) {
        await permissionsService.delete(existingRecord.id);
    }
};


// --- Car Sale Conditions ---

const normalizeCondition = (condition: any): CarSaleCondition => {
    if (!condition) return condition;

    const { indeed_status, ...restOfApiData } = condition;
    
    const colorsArray = typeof condition.colors === 'string'
        ? condition.colors.split(',').map((c: string) => c.trim()).filter(Boolean)
        : Array.isArray(condition.colors)
            ? condition.colors
            : [];
            
    return { 
        ...restOfApiData, 
        document_status: indeed_status,
        colors: colorsArray 
    } as CarSaleCondition;
};

const denormalizeCondition = (condition: Omit<CarSaleCondition, 'id'> | CarSaleCondition) => {
    const { document_status, ...restOfAppData } = condition;

    return {
        ...restOfAppData,
        indeed_status: document_status,
        colors: Array.isArray(condition.colors) ? condition.colors.join(',') : '',
    };
};

export const getConditions = async (): Promise<CarSaleCondition[]> => {
    const response = await fetch(`${API_BASE_URL}/conditions`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data.map(normalizeCondition) : [];
};

export const getConditionsByCarModel = async (carModel: string): Promise<CarSaleCondition[]> => {
    const response = await fetch(`${API_BASE_URL}/conditions?CarModel=${encodeURIComponent(carModel)}`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data.map(normalizeCondition) : [];
};

export const createCondition = async (condition: Omit<CarSaleCondition, 'id'>): Promise<CarSaleCondition> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(denormalizeCondition(condition)),
    });
    const newCondition = await handleResponse(response);
    return normalizeCondition(newCondition);
};

export const updateCondition = async (id: number, updatedCondition: CarSaleCondition): Promise<CarSaleCondition> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(denormalizeCondition(updatedCondition)),
    });
    const resultCondition = await handleResponse(response);
    return resultCondition ? normalizeCondition(resultCondition) : updatedCondition;
};

export const deleteCondition = async (id: number): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};

// --- Users (Sales Leads) ---
export interface Reference {
    reference: string;
}

export const getUserByNumber = async (number: string): Promise<User | null> => {
    const response = await fetch(`${API_BASE_URL}/user?number=${number}`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return (Array.isArray(data) && data.length > 0) ? data[0] : null;
};

export const getLeadHistory = async (number: string): Promise<LeadMessage[]> => {
    const response = await fetch(`${API_BASE_URL}/users/history?number=${number}`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const getUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const getReferences = async (): Promise<Reference[]> => {
    const response = await fetch(`${API_BASE_URL}/users/refrences/`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const getUsersByCarModel = async (carModel: string): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users/cars?CarModel=${encodeURIComponent(carModel)}`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(user),
    });
    return handleResponse(response);
};

export const updateUser = async (id: number, updatedUser: User): Promise<User> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedUser),
    });
    const resultUser = await handleResponse(response);
    return resultUser ? resultUser : updatedUser;
};

export const deleteUser = async (id: number): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};

// --- Cars ---
export const getCars = async (): Promise<Car[]> => {
    const response = await fetch(`${API_BASE_URL}/cars`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const createCar = async (car: Omit<Car, 'id'>): Promise<Car> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/cars`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(car),
    });
    return handleResponse(response);
};

export const updateCar = async (id: number, updatedCar: Car): Promise<Car> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/cars`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedCar),
    });
    const resultCar = await handleResponse(response);
    return resultCar ?? updatedCar;
};

export const deleteCar = async (id: number): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/cars`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};

// --- Car Prices ---

export const getCarPrices = async (): Promise<CarPrice[]> => {
    const response = await fetch(`${API_BASE_URL}/prices`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const createCarPrice = async (price: Omit<CarPrice, 'id'>): Promise<CarPrice> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/prices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(price),
    });
    return handleResponse(response);
};

export const updateCarPrice = async (id: number, updatedPrice: CarPrice): Promise<CarPrice> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/prices`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedPrice),
    });
    const resultPrice = await handleResponse(response);
    return resultPrice ?? updatedPrice;
};

export const deleteCarPrice = async (id: number): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/prices`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};

// --- Scraped Car Prices ---

const handleScrapedApiResponse = async (response: Response) => {
    if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } else {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: `Request failed with status ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
}

export const getScrapedCarPrices = async (): Promise<ScrapedCarPrice[]> => {
    const SCRAPED_PRICES_URL = `${API_BASE_URL}/car_price`;
    const response = await fetch(SCRAPED_PRICES_URL);
    return handleScrapedApiResponse(response);
};

export const getScrapedCarPriceSources = async (): Promise<CarPriceSource[]> => {
    const SCRAPED_SOURCES_URL = `${API_BASE_URL}/sources`;
    const response = await fetch(SCRAPED_SOURCES_URL);
    return handleScrapedApiResponse(response);
};

export const getCarPriceStats = async (): Promise<CarPriceStats[]> => {
    const STATS_URL = `${API_BASE_URL}/car_price_stats`;
    const response = await fetch(STATS_URL);
    const data = await handleScrapedApiResponse(response);
    if (!Array.isArray(data)) {
        return [];
    }
    return data.map((item: any, index: number) => ({
        id: index, // Synthetic ID for React keys
        model_name: item.model_name,
        minimum: item.min_price || 0,
        maximum: item.max_price || 0,
        average: parseFloat(item.avg_price) || 0,
        computed_at: new Date().toISOString(), // This is in the type but not the API
    }));
};

// --- Active Leads (for dashboard/hot leads) ---
export const getActiveLeads = async (): Promise<ActiveLead[]> => {
    const response = await fetch(`${API_BASE_URL}/users/active`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

// --- Delivery Process (Old/Simulated) ---
export const getDeliveryProcesses = async (): Promise<DeliveryProcess[]> => {
    const response = await fetch(`${API_BASE_URL}/deliveries`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const createDeliveryProcess = async (delivery: Omit<DeliveryProcess, 'id'>): Promise<DeliveryProcess> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/deliveries`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(delivery),
    });
    return handleResponse(response);
};

export const updateDeliveryProcessStatus = async (id: number, status: DeliveryStatus): Promise<DeliveryProcess> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
};


// --- WhatsApp ---
export const sendMessage = async (number: string, message: string): Promise<{ Sent: string }> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/whatsapp/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ number, message }),
    });
    return handleResponse(response);
};

// --- Poll / Survey ---
export const getPollAverages = async (): Promise<ProcessedPollData> => {
    const response = await fetch(`${API_BASE_URL}/poll/avg`, { headers: getAuthHeaders() });
    const rawData: PollApiResponseItem[] = await handleResponse(response);
    
    const result: ProcessedPollData = {
        averages: {},
        customers: [],
        inProgress: [],
        notAnswered: [],
        questions: {}
    };

    if (Array.isArray(rawData)) {
        rawData.forEach(item => {
            if (item.AverageAll) {
                result.averages = item.AverageAll;
            }
            if (item.perCustomerResults) {
                result.customers = item.perCustomerResults;
            }
            if (item.inProgress) {
                result.inProgress = item.inProgress;
            }
            if (item.NotAnswered) {
                result.notAnswered = item.NotAnswered;
            }
            if (item.fieldsGuid) {
                item.fieldsGuid.forEach(field => {
                    result.questions[field.Key] = field.Title;
                });
            }
        });
    }

    return result;
};


// --- Settings ---

export interface ApiSettings {
    whatsappApiKey: string;
    smsApiKey: string;
    didarApiKey: string;
}

export type AppSettings = ApiSettings & DealershipInfo;

export const getSettings = async (): Promise<Partial<AppSettings>> => {
    const response = await fetch(`${API_BASE_URL}/settings`, { headers: getAuthHeaders() });
    if (response.status === 204) {
        return {};
    }
    const data = await handleResponse(response);
    // API returns an array with a single settings object
    if (Array.isArray(data) && data.length > 0) {
        return data[0];
    }
    // Fallback for empty array or other unexpected format
    return {};
};

export const updateSettings = async (settings: Partial<AppSettings>): Promise<void> => {
    ensureOnline();
    const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
    });
    return handleResponse(response);
};

export const updateUserCredentials = async (
    currentPasswordHash: string,
    newUsername: string,
    newPasswordHash?: string
): Promise<void> => {
    ensureOnline();
    const payload: any = {
        currentPassword: currentPasswordHash,
    };
    if (newUsername) payload.username = newUsername;
    if (newPasswordHash) payload.password = newPasswordHash;

    // Do not send if no changes are requested besides current password
    if (!newUsername && !newPasswordHash) {
        return Promise.resolve();
    }

    const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    
    return handleResponse(response);
};

// --- New Service Endpoints ---

const ZERO_CAR_DELIVERY_URL = `${API_BASE_URL}/ZeroCarDelivery`;
const CORRECTIVE_ACTIONS_URL = `${API_BASE_URL}/CorrectiveActions`;
const LEAVE_REQUESTS_URL = `${API_BASE_URL}/LeaveReguests`; // Matches provided typo
const ANONYMOUS_SUGGESTIONS_URL = `${API_BASE_URL}/AnonymousSuggestions`;
const MY_PROFILE_URL = `${API_BASE_URL}/MyProfile`;
const PERMISSIONS_URL = `${API_BASE_URL}/Permissions`;
const MEETING_MINUTES_URL = `${API_BASE_URL}/MeetingMinutes`;

// Generic CRUD helper
const createCrudService = <T>(url: string) => ({
    getAll: async (): Promise<T[]> => {
        const response = await fetch(url, { headers: getAuthHeaders() });
        const data = await handleResponse(response);
        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object') return [data] as T[];
        return [];
    },
    create: async (item: Partial<T>): Promise<T> => {
        ensureOnline();
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(item),
        });
        return handleResponse(response);
    },
    update: async (item: Partial<T> & { id: number }): Promise<T> => {
        ensureOnline();
        const response = await fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(item),
        });
        return handleResponse(response);
    },
    delete: async (id: number): Promise<void> => {
        ensureOnline();
        const response = await fetch(url, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id }),
        });
        return handleResponse(response);
    }
});

export const zeroCarDeliveryService = createCrudService<ZeroCarDelivery>(ZERO_CAR_DELIVERY_URL);
export const correctiveActionsService = createCrudService<CorrectiveAction>(CORRECTIVE_ACTIONS_URL);
export const leaveRequestsService = createCrudService<LeaveRequest>(LEAVE_REQUESTS_URL);
export const anonymousSuggestionsService = createCrudService<AnonymousFeedback>(ANONYMOUS_SUGGESTIONS_URL);
export const permissionsService = createCrudService<any>(PERMISSIONS_URL);
export const meetingMinutesService = createCrudService<MeetingMinute>(MEETING_MINUTES_URL);

// My Profile Service
export const getMyProfile = async (): Promise<MyProfile | {}> => {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!userId) {
        console.warn("User ID not found, cannot fetch profile.");
        return {};
    }

    try {
        const response = await fetch(MY_PROFILE_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id: Number(userId) })
        });
        
        const data = await handleResponse(response);
        
        if (!data) return {};
        
        if (Array.isArray(data)) {
            return data.length > 0 ? data[0] : {};
        }
        
        return data;
    } catch (error) {
        console.warn("Could not fetch user profile, proceeding without it:", error);
        return {};
    }
};

export const updateMyProfile = async (profile: Partial<MyProfile>): Promise<MyProfile> => {
    ensureOnline();
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!userId) {
        throw new Error("User ID not found");
    }
    
    const payload = { ...profile, id: Number(userId) };
    
    const response = await fetch(MY_PROFILE_URL, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};
