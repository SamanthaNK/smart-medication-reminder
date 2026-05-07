import AsyncStorage from '@react-native-async-storage/async-storage';
import { speakMorningBriefing } from './voiceService';

const buildScript = (medications, userName) => {
    const greeting = userName ? `Good morning, ${userName}.` : 'Good morning.';
    const active = (medications || []).filter((m) => m.is_active);

    if (active.length === 0) {
        return `${greeting} You have no medications scheduled for today.`;
    }

    const lines = active.flatMap((m) =>
        m.times_of_day.map((t) => `${m.name}, ${m.dose_amount} ${m.dose_unit}, at ${t}`)
    );

    return (
        `${greeting} ` +
        `You have ${lines.length} dose${lines.length > 1 ? 's' : ''} today:\n\n` +
        lines.map((l, i) => `${i + 1}. ${l}`).join('\n')
    );
};

export const getMorningBriefingScript = async (userName) => {
    try {
        const cached = await AsyncStorage.getItem('cached_medications');
        const medications = cached ? JSON.parse(cached) : [];
        return buildScript(medications, userName);
    } catch {
        return `Good morning${userName ? ', ' + userName : ''}. Unable to load your schedule right now.`;
    }
};

export const playMorningBriefing = async (userName) => {
    try {
        const cached = await AsyncStorage.getItem('cached_medications');
        const medications = cached ? JSON.parse(cached) : [];
        await speakMorningBriefing(userName, medications);
    } catch (err) {
        console.error('[BRIEFING] Failed to play briefing:', err.message);
    }
};