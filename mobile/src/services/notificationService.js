import AsyncStorage from '@react-native-async-storage/async-storage';

export const cacheMedications = async (medications) => {
    try {
        await AsyncStorage.setItem('cached_medications', JSON.stringify(medications));
        console.log(`[CACHE] Saved ${medications.length} medications to local cache.`);
    } catch (err) {
        console.error('[CACHE] Failed to cache medications:', err.message);
    }
};

export const getCachedMedications = async () => {
    try {
        const raw = await AsyncStorage.getItem('cached_medications');
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};