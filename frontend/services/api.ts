import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  User,
  CreateEntryInput,
  EntriesResponse,
  TrendsResponse,
  DistributionResponse,
  AdminUsersResponse,
  AdminUserReportResponse,
} from '../types';

export const TOKEN_STORAGE_KEY = 'mental_wellness_auth_token';
export const USER_STORAGE_KEY = 'mental_wellness_auth_user';
export const BIOMETRIC_SETTING_KEY = 'mental_wellness_biometric_enabled';

// In Expo on Android emulator, 10.0.2.2 points to host localhost; on iOS simulator localhost works.
const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  default: 'http://localhost:5000/api',
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

// Cross-platform Secure Storage Helper
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn(`[SecureStore] Error reading key "${key}":`, err);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn(`[SecureStore] Error saving key "${key}":`, err);
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn(`[SecureStore] Error deleting key "${key}":`, err);
    }
  },
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized Session Expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear expired stored credentials
      await secureStorage.deleteItem(TOKEN_STORAGE_KEY);
      await secureStorage.deleteItem(USER_STORAGE_KEY);
    }
    return Promise.reject(error);
  }
);

// Auth Service Endpoints
export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    privacySettings?: { shareNotesWithAdmin: boolean };
  }): Promise<{ success: boolean; token: string; user: User }> {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  async login(data: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; token: string; user: User }> {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },

  async getMe(): Promise<{ success: boolean; user: User }> {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  async updatePrivacy(shareNotesWithAdmin: boolean): Promise<{
    success: boolean;
    privacySettings: { shareNotesWithAdmin: boolean };
  }> {
    const res = await apiClient.patch('/auth/privacy', { shareNotesWithAdmin });
    return res.data;
  },
};

// Entries Service Endpoints
export const entriesService = {
  async create(data: CreateEntryInput) {
    const res = await apiClient.post('/entries', data);
    return res.data;
  },

  async getEntries(params?: {
    page?: number;
    limit?: number;
    tag?: string;
    emotion?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<EntriesResponse> {
    const res = await apiClient.get('/entries', { params });
    return res.data;
  },

  async getById(id: string) {
    const res = await apiClient.get(`/entries/${id}`);
    return res.data;
  },

  async delete(id: string) {
    const res = await apiClient.delete(`/entries/${id}`);
    return res.data;
  },
};

// Analytics Service Endpoints
export const analyticsService = {
  async getTrends(period: '7d' | '30d' = '7d'): Promise<TrendsResponse> {
    const res = await apiClient.get('/analytics/trends', {
      params: { period },
    });
    return res.data;
  },

  async getDistribution(): Promise<DistributionResponse> {
    const res = await apiClient.get('/analytics/distribution');
    return res.data;
  },
};

// Superadmin Service Endpoints
export const adminService = {
  async getUsers(): Promise<AdminUsersResponse> {
    const res = await apiClient.get('/admin/users');
    return res.data;
  },

  async getUserReport(
    targetUserId: string,
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<AdminUserReportResponse> {
    const res = await apiClient.get(`/admin/users/${targetUserId}/report`, {
      params: { period },
    });
    return res.data;
  },
};
