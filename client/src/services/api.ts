import axios from 'axios';

// Point to your Express server (update when using ngrok)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export interface Activity {
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
  order: number;
  updatedAt: number;
}

export interface SyncResponse {
  activities: Activity[];
  syncedAt: number;
}

export const fetchAllActivities = async (since?: number): Promise<Activity[]> => {
  const params = since ? { since } : {};
  const res = await api.get('/api/activities', { params });
  return res.data;
};

export const fetchDayActivities = async (dayNumber: number): Promise<Activity[]> => {
  const res = await api.get(`/api/activities/day/${dayNumber}`);
  return res.data;
};

export const createActivity = async (activity: Partial<Activity>): Promise<Activity> => {
  const res = await api.post('/api/activities', activity);
  return res.data;
};

export const updateActivity = async (id: string, updates: Partial<Activity>): Promise<Activity> => {
  const res = await api.put(`/api/activities/${id}`, updates);
  return res.data;
};

export const deleteActivity = async (id: string): Promise<void> => {
  await api.delete(`/api/activities/${id}`);
};

export const uploadTicket = async (id: string, file: File): Promise<Activity> => {
  const formData = new FormData();
  formData.append('ticket', file);
  const res = await api.post(`/api/activities/${id}/ticket`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const syncAll = async (): Promise<SyncResponse> => {
  const res = await api.get('/api/sync');
  return res.data;
};

export default api;
