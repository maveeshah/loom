const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8010';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || `Request failed with status ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
}

export const api = {
    // Module registry
    fetchModules: () => request<Record<string, { name: string; slug: string }[]>>('/v1/modules'),
    fetchModuleDefinition: (slug: string) => request<any>(`/v1/modules/${slug}`),

    // Records CRUD
    fetchRecords: (slug: string) => request<any[]>(`/v1/app/${slug}`),
    fetchRecord: (slug: string, id: number) => request<any>(`/v1/app/${slug}/${id}`),
    createRecord: (slug: string, data: Record<string, any>) =>
        request<any>(`/v1/app/${slug}`, { method: 'POST', body: JSON.stringify(data) }),
    updateRecord: (slug: string, id: number, data: Record<string, any>) =>
        request<any>(`/v1/app/${slug}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRecord: (slug: string, id: number) =>
        request<void>(`/v1/app/${slug}/${id}`, { method: 'DELETE' }),
};
