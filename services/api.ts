
import type { CarSaleCondition, User } from '../types';

const API_BASE_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1';

const handleResponse = async (response: Response) => {
    if (response.ok) {
        // Handle responses with no content (e.g., 204 for DELETE)
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

// --- Car Sale Conditions ---

const normalizeCondition = (condition: any): CarSaleCondition => {
    if (!condition) return condition;

    // Map API's 'indeed_status' to frontend's 'document_status'
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
    // Map frontend's 'document_status' back to API's 'indeed_status'
    const { document_status, ...restOfAppData } = condition;

    return {
        ...restOfAppData,
        indeed_status: document_status,
        colors: Array.isArray(condition.colors) ? condition.colors.join(',') : '',
    };
};

export const getConditions = async (): Promise<CarSaleCondition[]> => {
    const response = await fetch(`${API_BASE_URL}/conditions`);
    const data = await handleResponse(response);
    return Array.isArray(data) ? data.map(normalizeCondition) : [];
};

export const createCondition = async (condition: Omit<CarSaleCondition, 'id'>): Promise<CarSaleCondition> => {
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(denormalizeCondition(condition)),
    });
    const newCondition = await handleResponse(response);
    return normalizeCondition(newCondition);
};

export const updateCondition = async (id: number, updatedCondition: CarSaleCondition): Promise<CarSaleCondition> => {
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(denormalizeCondition(updatedCondition)),
    });
    const resultCondition = await handleResponse(response);
    return resultCondition ? normalizeCondition(resultCondition) : updatedCondition;
};

export const deleteCondition = async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/conditions`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};

// --- Users (Sales Leads) ---

export const getUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users`);
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : [];
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
    });
    return handleResponse(response);
};

export const updateUser = async (id: number, updatedUser: User): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
    });
    const resultUser = await handleResponse(response);
    return resultUser ? resultUser : updatedUser;
};

export const deleteUser = async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
    });
    return handleResponse(response);
};
