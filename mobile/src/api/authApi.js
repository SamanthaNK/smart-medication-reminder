import client from './client';

export const register = (userData) => client.post('/auth/register', userData);

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