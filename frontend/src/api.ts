const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8010';

const getToken = () => localStorage.getItem('loom_token');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options?.headers,
    };

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        localStorage.removeItem('loom_token');
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || `Request failed with status ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
}

export interface ModuleDefinition {
    name: string;
    slug: string;
    ui: {
        show_in_sidebar?: boolean;
        icon?: string;
        default_view?: string;
    };
    views: {
        name: string;
        type: 'summary' | 'association' | 'comments' | 'history' | 'custom';
        target?: string;
    }[];
    overrides: {
        backend_router?: string;
        frontend_view?: string;
        frontend_analytics?: string;
    };
}

export const api = {
    // Auth
    login: async (email: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const data: any = await request('/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        localStorage.setItem('loom_token', data.access_token);
        return data;
    },
    logout: () => {
        localStorage.removeItem('loom_token');
        window.location.href = '/login';
    },

    // Module registry
    fetchModules: () => request<Record<string, ModuleDefinition[]>>('/v1/modules'),
    fetchModuleDefinition: (slug: string) => request<any>(`/v1/modules/${slug}`),

    // Records CRUD
    fetchRecords: (slug: string, filters?: Record<string, any>) => {
        const query = filters ? `?${new URLSearchParams(filters).toString()}` : '';
        return request<any[]>(`/v1/app/${slug}${query}`);
    },
    fetchRecord: (slug: string, id: number) => request<any>(`/v1/app/${slug}/${id}`),
    createRecord: (slug: string, data: Record<string, any>) =>
        request<any>(`/v1/app/${slug}`, { method: 'POST', body: JSON.stringify(data) }),
    updateRecord: (slug: string, id: number, data: Record<string, any>) =>
        request<any>(`/v1/app/${slug}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRecord: (slug: string, id: number) =>
        request<void>(`/v1/app/${slug}/${id}`, { method: 'DELETE' }),
};

