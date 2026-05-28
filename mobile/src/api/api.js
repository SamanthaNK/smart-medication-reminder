import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const client = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 10000,
});

client.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

client.interceptors.response.use(
    (response) => response.data.data,
    (error) => {
        const apiError = error.response?.data || {
            errorCode: 'NETWORK_ERROR',
            message: 'Could not reach the server. Please check your connection.',
        };
        return Promise.reject(apiError);
    }
);

// Auth
export const register = (userData) =>
    client.post('/auth/register', userData);

export const verifyEmail = (email, code) =>
    client.post('/auth/verify-email', { email, code });

export const resendCode = (email) =>
    client.post('/auth/resend-code', { email });

export const login = (email, password) =>
    client.post('/auth/login', { email, password });

export const forgotPassword = (email) =>
    client.post('/auth/forgot-password', { email });

export const resetPassword = (email, code, password) =>
    client.post('/auth/reset-password', { email, code, password });

// User profile
export const getMyProfile = () =>
    client.get('/users/me');

export const registerFcmToken = (fcmToken) =>
    client.patch('/users/me/fcm-token', { fcm_token: fcmToken });

// Links between patients and caregivers
export const getPendingLinks = () =>
    client.get('/links/pending');

export const respondToLink = (linkId, action) =>
    client.patch(`/links/${linkId}/respond`, { action });

export const requestLink = (patientEmail) =>
    client.post('/links/request', { patient_email: patientEmail });

export const getLinkedPatients = () =>
    client.get('/links/patients');

// Medications & dose events
export const getMedications = (patientId) =>
    client.get(`/medications/patients/${patientId}`);

export const createMedication = (patientId, medicationData) =>
    client.post(`/medications/patients/${patientId}`, medicationData);

export const getDoseHistory = (patientId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.medicationId) params.append('medicationId', filters.medicationId);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.missedReason) params.append('missedReason', filters.missedReason);
    if (filters.limit) params.append('limit', String(filters.limit));
    return client.get(`/dose-events/patients/${patientId}/history?${params.toString()}`);
};

export const confirmDose = (doseEventId, confirmedByVoice = false) =>
    client.post(`/dose-events/${doseEventId}/confirm`, {
        confirmed_by_voice: confirmedByVoice,
    });

export const markDoseMissed = (doseEventId, missedReason) =>
    client.post(`/dose-events/${doseEventId}/miss`, { missed_reason: missedReason });

export const getRiskScore = (patientId) =>
    client.get(`/dose-events/patients/${patientId}/risk`);

// Alerts
export const getAlerts = () =>
    client.get('/alerts');

export const getHighRiskAlerts = () =>
    client.get('/alerts');

export default client;