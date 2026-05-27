import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCHEDULED_IDS_KEY = 'scheduled_notification_ids';

export const rescheduleAllMedicationReminders = async (medications) => {
    await cancelAllMedicationReminders();

    const scheduledIds = [];
    const now = new Date();

    for (const med of medications) {
        if (!med.is_active) continue;

        for (const timeStr of med.times_of_day) {
            const [hours, minutes] = timeStr.split(':').map(Number);

            const trigger = {
                hour: hours,
                minute: minutes,
                repeats: true,
            };

            try {
                const id = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Time for your medication',
                        body: `Take ${med.name} — ${med.dose_amount} ${med.dose_unit}`,
                        data: {
                            type: 'dose_reminder',
                            medicationId: med.id,
                            medicationName: med.name,
                            doseAmount: med.dose_amount,
                            doseUnit: med.dose_unit,
                            pillColour: med.pill_colour || null,
                            pillShape: med.pill_shape || null,
                            pillNotes: med.pill_notes || null,
                            scheduledTime: timeStr,
                        },
                        sound: 'default',
                    },
                    trigger,
                });

                scheduledIds.push(id);
                console.log(`[LOCAL NOTIF] Scheduled ${med.name} at ${timeStr} — id: ${id}`);
            } catch (err) {
                console.error(`[LOCAL NOTIF] Failed to schedule ${med.name}:`, err.message);
            }
        }
    }

    await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(scheduledIds));
    console.log(`[LOCAL NOTIF] Total scheduled: ${scheduledIds.length}`);
};

export const scheduleMorningBriefing = async () => {
    const existing = await AsyncStorage.getItem('morning_briefing_notif_id');
    if (existing) {
        try { await Notifications.cancelScheduledNotificationAsync(existing); } catch (_) { }
    }

    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Good morning!',
            body: 'Tap to hear your medication schedule for today.',
            data: { type: 'morning_briefing' },
            sound: 'default',
        },
        trigger: {
            hour: 7,
            minute: 0,
            repeats: true,
        },
    });

    await AsyncStorage.setItem('morning_briefing_notif_id', id);
    console.log(`[LOCAL NOTIF] Morning briefing scheduled — id: ${id}`);
};

export const cancelAllMedicationReminders = async () => {
    const raw = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    for (const id of ids) {
        try { await Notifications.cancelScheduledNotificationAsync(id); } catch (_) { }
    }
    await AsyncStorage.removeItem(SCHEDULED_IDS_KEY);
    console.log(`[LOCAL NOTIF] Cancelled ${ids.length} scheduled notifications`);
};