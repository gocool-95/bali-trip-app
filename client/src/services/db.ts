import Dexie, { type Table } from 'dexie';

export interface LocalActivity {
  _id: string;
  dayNumber: number;
  date: string;
  time: string;
  endTime?: string;
  title: string;
  location: string;
  category: string;
  transport: string;
  notes?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  bookingRef?: string;
  confirmationNumber?: string;
  ticketImages?: string[];
  amount?: number;
  currency?: string;
  paymentStatus?: string;
  priority?: string; // 'must-pay' | 'book-ahead' | 'pay-there' | 'optional'
  completed?: boolean;
  timezone?: string; // 'Asia/Kolkata' | 'Asia/Makassar' (default: Bali)
  order: number;
  updatedAt: number;
}

export interface PendingSync {
  id?: number;
  activityId: string;
  action: 'create' | 'update' | 'delete';
  data?: Partial<LocalActivity>;
  createdAt: number;
}

export interface AppMeta {
  key: string;
  value: string | number;
}

class BaliTripDB extends Dexie {
  activities!: Table<LocalActivity, string>;
  pendingSync!: Table<PendingSync, number>;
  meta!: Table<AppMeta, string>;

  constructor() {
    super('BaliTripDB');
    this.version(1).stores({
      activities: '_id, dayNumber, date, order, updatedAt',
      pendingSync: '++id, activityId, action, createdAt',
      meta: 'key',
    });
    this.version(2).stores({
      activities: '_id, dayNumber, date, order, updatedAt, [dayNumber+order]',
      pendingSync: '++id, activityId, action, createdAt',
      meta: 'key',
    });
  }
}

const db = new BaliTripDB();
export default db;
