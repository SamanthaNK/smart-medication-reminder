import client from './client.js';

export const register = (userData) => client.post('/auth/register', userData);

export const login = (email, password) =>
    client.post('/auth/login', { email, password });

export const forgotPassword = (email) =>
    client.post('/auth/forgot-password', { email });