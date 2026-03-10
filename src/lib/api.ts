import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000, // 5 minutes for heavy AI processing
});

// Request interceptor for adding JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
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
    getAll: () => api.get('/students/'),
    create: (student: any) => api.post('/students/', student),
    update: (id: string, student: any) => api.put(`/students/${id}`, student),
    delete: (id: string) => api.delete(`/students/${id}`),
    uploadFace: (studentId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/students/${studentId}/faces`, formData);
    },
};

export const attendanceApi = {
    uploadPhoto: (file: File, classId?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        const url = classId ? `/attendance/upload-photo?class_id=${classId}` : '/attendance/upload-photo';
        return api.post(url, formData);
    },
    getToday: (classId?: string) => api.get('/attendance/today', { params: classId ? { class_id: classId } : {} }),
    getHistory: (params?: any) => api.get('/attendance/history', { params }),
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
};

export default api;

