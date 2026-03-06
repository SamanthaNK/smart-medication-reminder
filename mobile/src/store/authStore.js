import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set) => ({
    token: null,
    user: null,
    isLoading: true,

    restoreSession: async () => {
        const token = await AsyncStorage.getItem('token');
        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        set({ token, user, isLoading: false });
    },

    setSession: async (token, user) => {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        set({ token, user });
    },

    clearSession: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        set({ token: null, user: null });
    },
}));