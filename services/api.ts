import type { CarSaleCondition, User, ActiveLead, LeadMessage } from '../types';

const API_BASE_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1';
const ACTIVE_LEADS_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/users/active/';


const handleResponse = async (response: Response) => {
    if (response.status === 401) {
        sessionStorage.removeItem('authToken');
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
    const token = sessionStorage.getItem('authToken');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// --- Auth ---

export const login = async (username: string, password: string): Promise<{ token: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
        return response.json();
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
    const response = await fetch(`${API_BASE_URL}/auth/new`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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

export const createCondition = async (condition: Omit<CarSaleCondition, 'id'>): Promise<CarSaleCondition> => {
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(denormalizeCondition(condition)),
    });
    const newCondition = await handleResponse(response);
    return normalizeCondition(newCondition);
};

export const updateCondition = async (id: number, updatedCondition: CarSaleCondition): Promise<CarSaleCondition> => {
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(denormalizeCondition(updatedCondition)),
    });
    const resultCondition = await handleResponse(response);
    return resultCondition ? normalizeCondition(resultCondition) : updatedCondition;
};

export const deleteCondition = async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};

// --- Users (Sales Leads) ---
export const getUserByNumber = async (number: string): Promise<User | null> => {
    const response = await fetch(`${API_BASE_URL}/user?number=${number}`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return (Array.isArray(data) && data.length > 0) ? data[0] : null;
};

export const getActiveLeads = async (): Promise<ActiveLead[]> => {
    const response = await fetch(ACTIVE_LEADS_URL, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
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

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(user),
    });
    return handleResponse(response);
};

export const updateUser = async (id: number, updatedUser: User): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedUser),
    });
    const resultUser = await handleResponse(response);
    return resultUser ? resultUser : updatedUser;
};

export const deleteUser = async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};

// --- WhatsApp ---
export const sendMessage = async (number: string, message: string): Promise<{ Sent: string }> => {
    const response = await fetch(`${API_BASE_URL}/whatsapp/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ number, message }),
    });
    return handleResponse(response);
};