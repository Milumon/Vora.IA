import axios from 'axios';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach Supabase auth token to every request
api.interceptors.request.use(async (config) => {
    if (typeof window !== 'undefined') {
        try {
            const supabase = createClientComponentClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                config.headers.Authorization = `Bearer ${session.access_token}`;
            }
        } catch {
            // Silently fail — request proceeds without auth
        }
    }
    return config;
});

// ── Chat API ──────────────────────────────────────────────────────────────────

export const chatApi = {
    sendMessage: (
        message: string,
        threadId?: string,
        filters?: {
            currency?: string;
            budget_total?: number;
            check_in?: string;
            check_out?: string;
        },
    ) =>
        api.post('/api/v1/chat', {
            message,
            thread_id: threadId,
            ...filters,
        }),
};

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
    login: (email: string, password: string) =>
        api.post('/api/v1/auth/login', { email, password }),

    register: (email: string, password: string, fullName: string) =>
        api.post('/api/v1/auth/register', {
            email,
            password,
            full_name: fullName,
        }),

    logout: () => api.post('/api/v1/auth/logout'),
};

// ── Itineraries API ───────────────────────────────────────────────────────────

export const itinerariesApi = {
    list: () => api.get('/api/v1/itineraries'),

    get: (id: string) => api.get(`/api/v1/itineraries/${id}`),

    create: (data: {
        thread_id?: string;
        title?: string;
        destination?: string;
        [key: string]: any;
    }) => api.post('/api/v1/itineraries', data),

    delete: (id: string) => api.delete(`/api/v1/itineraries/${id}`),
};

export default api;
