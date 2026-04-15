import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
const AUTH_ROUTES = new Set(['/login']);

export const authStorage = {
    getToken: () => localStorage.getItem('token'),
    isAuthenticated: () => Boolean(localStorage.getItem('token')),
    setSession: (token: string, profile?: { name?: string; email?: string }) => {
        localStorage.setItem('token', token);
        if (profile?.name) localStorage.setItem('userName', profile.name);
        if (profile?.email) localStorage.setItem('userEmail', profile.email);
    },
    clearSession: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
    },
};

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000, // 5 minutes for heavy AI processing
});

// Request interceptor for adding JWT token
api.interceptors.request.use(
    (config) => {
        const token = authStorage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            authStorage.clearSession();
            if (!AUTH_ROUTES.has(window.location.pathname)) {
                window.location.replace('/login');
            }
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: (credentials: any) => {
        const params = new URLSearchParams();
        params.append('username', credentials.email || credentials.username);
        params.append('password', credentials.password);
        return api.post('/auth/login', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
    },
    me: () => api.get('/auth/me'),
};

export const studentApi = {
    getAll: (classId?: string) => api.get('/students/', { params: classId ? { class_id: classId } : {} }),
    create: (student: any) => api.post('/students/', student),
    update: (id: string, student: any) => api.put(`/students/${id}`, student),
    delete: (id: string) => api.delete(`/students/${id}`),
    uploadFace: (studentId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/students/${studentId}/faces`, formData);
    },
    clearFaces: (studentId: string) => api.delete(`/students/${studentId}/faces`),
    purgeAllFaces: () => api.delete('/students/all-faces'),
};

export const attendanceApi = {
    uploadPhoto: (file: File, classId?: string, period?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        const params = new URLSearchParams();
        if (classId) params.append('class_id', classId);
        if (period) params.append('period', period);
        const query = params.toString();
        const url = `/attendance/upload-photo${query ? `?${query}` : ''}`;
        return api.post(url, formData);
    },
    getToday: (classId?: string) => api.get('/attendance/today', { params: classId ? { class_id: classId } : {} }),
    getHistory: (params?: any) => api.get('/attendance/history', { params }),
    finalize: (payload: { class_id?: string; period?: string; present_student_ids: string[]; absent_student_ids: string[] }) =>
        api.post('/attendance/finalize', payload),
};

export const reportsApi = {
    getStats: () => api.get('/reports/stats'),
    getReport: (params?: any) => api.get('/reports/', { params }),
    downloadCsv: (params?: any) => api.get('/reports/download/csv', { params, responseType: 'blob' }),
    downloadPdf: (params?: any) => api.get('/reports/download/pdf', { params, responseType: 'blob' }),
};

export const classroomApi = {
    getAll: () => api.get('/classrooms/'),
    get: (id: string) => api.get(`/classrooms/${id}`),
    create: (data: any) => api.post('/classrooms/', data),
    update: (id: string, data: any) => api.put(`/classrooms/${id}`, data),
    delete: (id: string) => api.delete(`/classrooms/${id}`),
};

export const notificationApi = {
    getAll: (studentId?: string) => api.get('/notifications/', { params: studentId ? { student_id: studentId } : {} }),
    send: (data: any) => api.post('/notifications/send', data),
    sendAbsent: () => api.post('/notifications/send-absent'),
};

export const insightsApi = {
    frequentlyAbsent: (days?: number, threshold?: number) => api.get('/insights/frequently-absent', { params: { days, threshold } }),
    trends: (days?: number, classId?: string) => api.get('/insights/trends', { params: { days, class_id: classId } }),
    riskAlerts: (days?: number) => api.get('/insights/risk-alerts', { params: { days } }),
    attendanceSummary: (classId?: string) => api.get('/insights/attendance-summary', { params: classId ? { class_id: classId } : {} }),
};

export default api;
