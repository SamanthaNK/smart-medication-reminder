import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const client = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 10000, //10s
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

export default client;