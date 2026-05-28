import AsyncStorage from '@react-native-async-storage/async-storage';
import { speakMorningBriefing } from './voiceService';

const formatTimeForSpeech = (timeStr) => {
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const period = hour < 12 ? 'am' : 'pm';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = minute > 0 ? `:${minuteStr}` : '';
    return `${displayHour}${displayMinute}${period}`;
};

const buildScript = (medications, userName) => {
    const greeting = userName ? `Good morning, ${userName}.` : 'Good morning.';
    const active = (medications || []).filter((m) => m.is_active);

    if (active.length === 0) {
        return `${greeting} You have no medications scheduled for today.`;
    }

    const lines = active.flatMap((m) =>
        m.times_of_day.map(
            (t) => `${m.name}, ${m.dose_amount} ${m.dose_unit}, at ${formatTimeForSpeech(t)}`
        )
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