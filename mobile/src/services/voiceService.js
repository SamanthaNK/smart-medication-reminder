import * as Speech from 'expo-speech';

let _currentSound = null;

const tryLoadAudio = async () => {
    try {
        const av = await import('expo-av');
        if (!av.Audio) return null;
        return av.Audio;
    } catch {
        return null;
    }
};

export const stopSpeaking = async () => {
    if (_currentSound) {
        try { await _currentSound.stopAsync(); } catch (_) { }
        try { await _currentSound.unloadAsync(); } catch (_) { }
        _currentSound = null;
    }
    try {
        const isSpeaking = await Speech.isSpeakingAsync();
        if (isSpeaking) Speech.stop();
    } catch (_) { }
};

export const speak = async (text, audioKey = null, options = {}) => {
    await stopSpeaking();

    if (audioKey) {
        const Audio = await tryLoadAudio();

        if (Audio) {
            const AUDIO_FILES = {
                morning_briefing: require('../../assets/audio/morning_briefing.mp3'),
                dose_reminder: require('../../assets/audio/dose_reminder.mp3'),
                dose_confirmed: require('../../assets/audio/dose_confirmed.mp3'),
                missed_dose_prompt: require('../../assets/audio/missed_dose_prompt.mp3'),
            };

            const source = AUDIO_FILES[audioKey];
            if (source) {
                try {
                    const { sound } = await Audio.Sound.createAsync(source);
                    _currentSound = sound;
                    await sound.playAsync();
                    sound.setOnPlaybackStatusUpdate((status) => {
                        if (status.didJustFinish) {
                            sound.unloadAsync();
                            _currentSound = null;
                        }
                    });
                    return;
                } catch (err) {
                    console.warn('[VOICE] MP3 playback failed, falling back to TTS:', err.message);
                }
            }
        }
    }

    try {
        Speech.speak(text, {
            language: options.language || 'en-US',
            rate: options.rate || 0.9,
            pitch: options.pitch || 1.0,
            ...options,
        });
    } catch (err) {
        console.warn('[VOICE] TTS failed:', err.message);
    }
};

export const speakMorningBriefing = async (userName, medications) => {
    const greeting = userName ? `Good morning, ${userName}.` : 'Good morning.';
    const active = (medications || []).filter((m) => m.is_active);

    if (active.length === 0) {
        await speak(`${greeting} You have no medications scheduled for today.`, 'morning_briefing');
        return;
    }

    const lines = active.flatMap((m) =>
        m.times_of_day.map((t) => {
            const [hourStr, minuteStr] = t.split(':');
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);
            const period = hour < 12 ? 'am' : 'pm';
            const displayHour = hour % 12 === 0 ? 12 : hour % 12;
            const displayMinute = minute > 0 ? `:${minuteStr}` : '';
            const readableTime = `${displayHour}${displayMinute}${period}`;
            return `${m.name}, ${m.dose_amount} ${m.dose_unit}, at ${readableTime}`;
        })
    );

    const script =
        `${greeting} ` +
        `You have ${lines.length} dose${lines.length > 1 ? 's' : ''} today. ` +
        lines.join('. ') + '.';

    await speak(script, 'morning_briefing');
};

export const speakDoseReminder = async (medication, scheduledTime) => {
    const text =
        `It is time to take your ${medication.name}. ` +
        `${medication.dose_amount} ${medication.dose_unit}. ` +
        `Scheduled for ${scheduledTime}. ` +
        `Say yes or tap the button to confirm you have taken it.`;
    await speak(text, 'dose_reminder');
};

export const speakMissedDosePrompt = async (medicationName) => {
    const text =
        `You missed your ${medicationName} dose. ` +
        `Please tell us why: did you forget, are you feeling sick, or have you run out of pills?`;
    await speak(text, 'missed_dose_prompt');
};

export const listenForConfirmation = async () => {
    console.log('[VOICE] Speech recognition removed for production build');
    return null;
};