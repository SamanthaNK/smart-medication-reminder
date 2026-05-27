import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/v1',
    timeout: 10000,
});

client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

client.interceptors.response.use(
    (res) => res.data.data,
    (err) => Promise.reject(err.response?.data || { message: 'Network error' })
);

export const login = (email, password) =>
    client.post('/auth/login', { email, password });

export const getClinicDashboard = () =>
    client.get('/clinic/dashboard');

export const getPlatformStats = () =>
    client.get('/admin/stats');

export const verifyUser = (userId) =>
    client.patch(`/admin/users/${userId}/verify`);

export const getDoseHistory = (patientId, filters = {}) => {
    const params = new URLSearchParams(filters);
    return client.get(`/dose-events/patients/${patientId}/history?${params}`);
};

export default client;