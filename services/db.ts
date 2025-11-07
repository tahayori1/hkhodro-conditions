import Dexie, { type Table } from 'dexie';
import type { CarSaleCondition, User, ActiveLead, LeadMessage } from '../types';

// Create a synthetic interface for ActiveLead with an ID for Dexie
export interface IndexedActiveLead extends ActiveLead {
    id: string;
}

// FIX: The original Dexie subclassing was causing a TypeScript error where `this.version` was not found.
// This has been refactored to use direct instantiation with type casting, which is a more robust pattern
// and avoids potential issues with `this` context or class inheritance in some environments.
const db = new Dexie('AutoLeadDB') as Dexie & {
    conditions: Table<CarSaleCondition, number>;
    users: Table<User, number>;
    activeLeads: Table<IndexedActiveLead, string>;
    leadMessages: Table<LeadMessage, number>;
};

db.version(1).stores({
    conditions: '++id, status, car_model, sale_type',
    users: '++id, FullName, Number, CarModel, RegisterTime',
    activeLeads: 'id', // primary key: number-updatedAt
    leadMessages: '++id, number, createdAt',
});

export { db };
