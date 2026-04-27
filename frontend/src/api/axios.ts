/**
 * Enhanced API client with proper error handling and TypeScript types.
 * Replaces the basic fetch-based api.ts
 */

import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import type {
  ModuleDefinition,
  ModuleGroup,
  PaginatedResponse,
  RecordData,
  User,
  AuditEntry,
  CommentEntry,
  SystemSetting,
  Role,
  Permission,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('loom_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ detail?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('loom_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Show error message
    const errorMessage = error.response?.data?.detail || error.message || 'An error occurred';
    message.error(errorMessage);

    return Promise.reject(error);
  }
);

// API endpoints with proper typing
export const authApi = {
  login: async (email: string, password: string): Promise<{ access_token: string; token_type: string }> => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const response = await apiClient.post('/v1/auth/login', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    localStorage.setItem('loom_token', response.data.access_token);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('loom_token');
    window.location.href = '/login';
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/v1/auth/me');
    return response.data;
  },

  updateMe: async (data: { full_name?: string; password?: string }): Promise<{ message: string }> => {
    const response = await apiClient.put('/v1/auth/me', data);
    return response.data;
  },
};

export const modulesApi = {
  fetchModules: async (): Promise<ModuleGroup> => {
    const response = await apiClient.get('/v1/modules');
    return response.data;
  },

  fetchModuleDefinition: async (slug: string): Promise<ModuleDefinition> => {
    const response = await apiClient.get(`/v1/modules/${slug}`);
    return response.data;
  },
};

export const recordsApi = {
  fetchRecords: async (
    slug: string,
    filters?: Record<string, string | number | boolean>
  ): Promise<PaginatedResponse<RecordData>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get(`/v1/app/${slug}?${params.toString()}`);
    return response.data;
  },

  fetchRecord: async (slug: string, id: number): Promise<RecordData> => {
    const response = await apiClient.get(`/v1/app/${slug}/${id}`);
    return response.data;
  },

  createRecord: async (slug: string, data: Record<string, unknown>): Promise<RecordData> => {
    const response = await apiClient.post(`/v1/app/${slug}`, data);
    return response.data;
  },

  updateRecord: async (slug: string, id: number, data: Record<string, unknown>): Promise<RecordData> => {
    const response = await apiClient.put(`/v1/app/${slug}/${id}`, data);
    return response.data;
  },

  deleteRecord: async (slug: string, id: number): Promise<void> => {
    await apiClient.delete(`/v1/app/${slug}/${id}`);
  },
};

export const commentsApi = {
  fetchComments: async (modelName: string, recordId: number): Promise<CommentEntry[]> => {
    const response = await apiClient.get('/v1/app/comment', {
      params: { model_name: modelName, record_id: recordId },
    });
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  },

  createComment: async (data: {
    model_name: string;
    record_id: number;
    content: string;
    author: string;
  }): Promise<CommentEntry> => {
    const response = await apiClient.post('/v1/app/comment', data);
    return response.data;
  },
};

export const auditApi = {
  fetchAuditLogs: async (modelName: string, recordId: number): Promise<AuditEntry[]> => {
    const response = await apiClient.get('/v1/app/history', {
      params: { model_name: modelName, record_id: recordId },
    });
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  },
};

export const adminApi = {
  fetchUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/v1/admin/users');
    return response.data;
  },

  updateUser: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/v1/admin/users/${id}`, data);
    return response.data;
  },

  fetchRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get('/v1/admin/roles');
    return response.data;
  },

  createRole: async (data: { name: string; permission_ids: number[] }): Promise<Role> => {
    const response = await apiClient.post('/v1/admin/roles', data);
    return response.data;
  },

  updateRole: async (id: number, data: { name: string; permission_ids: number[] }): Promise<Role> => {
    const response = await apiClient.put(`/v1/admin/roles/${id}`, data);
    return response.data;
  },

  fetchPermissions: async (): Promise<Permission[]> => {
    const response = await apiClient.get('/v1/admin/permissions');
    return response.data;
  },
};

export const settingsApi = {
  fetchSettings: async (): Promise<Record<string, string>> => {
    const response = await apiClient.get('/v1/settings');
    return response.data;
  },

  updateSetting: async (key: string, value: string): Promise<SystemSetting> => {
    const response = await apiClient.put(`/v1/settings/${key}?value=${encodeURIComponent(value)}`);
    return response.data;
  },
};

export const healthApi = {
  checkHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default apiClient;
