import { firebaseMessaging } from '../config/firebase.js';
import { decrypt } from '../utils/encrypt.js';

export const sendPushToCaregiver = async (caregiver, title, body, data = {}) => {
    if (!caregiver.fcm_token) {
        console.log(`[PUSH] Caregiver ${caregiver.id} has no push token — skipping`);
        return;
    }

    const token = caregiver.fcm_token;

    try {
        if (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) {
            await sendViaExpoPushApi(token, title, body, data);
        } else {
            await sendViaFirebaseAdmin(token, title, body, data, caregiver.id);
        }
    } catch (err) {
        console.error(`[PUSH] Unexpected error for caregiver ${caregiver.id}:`, err.message);
    }
};

const sendViaExpoPushApi = async (expoToken, title, body, data) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: expoToken,
                title,
                body,
                data,
                sound: 'default',
                priority: 'high',
                channelId: 'default',
            }),
        });

        clearTimeout(timeout);
        const result = await response.json();

        if (result.data?.status === 'error') {
            console.error('[EXPO PUSH] Delivery error:', result.data.message);
        } else {
            console.log('[EXPO PUSH] Sent successfully to token ending in',
                expoToken.slice(-8));
        }
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            console.error('[EXPO PUSH] Request timed out - Expo Push API unreachable (check internet connection)');
        } else {
            console.error('[EXPO PUSH] Request failed:', err.message);
        }
    }
};

const sendViaFirebaseAdmin = async (fcmToken, title, body, data, caregiverId) => {
    const message = {
        token: fcmToken,
        notification: { title, body },
        data: { ...Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])),
            click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        android: {
            priority: 'high',
            notification: { sound: 'default', channelId: 'default' },
        },
    };

    try {
        await firebaseMessaging.send(message);
        console.log(`[FCM] Push sent to caregiver ${caregiverId}`);
    } catch (err) {
        console.error(`[FCM] Failed to send to caregiver ${caregiverId}:`, err.message);
    }
};

export const buildMissedDoseMessages = (patientName, medicationName, missedReason) => {
    const reasonLabels = {
        forgot: { en: 'forgot', fr: 'a oublié' },
        feeling_sick: { en: 'is feeling sick', fr: 'ne se sent pas bien' },
        no_pills: { en: 'ran out of pills', fr: "n'a plus de médicaments" },
        no_response: { en: 'did not respond', fr: "n'a pas répondu" },
    };

    const reason = reasonLabels[missedReason] || reasonLabels.no_response;

    return {
        en: `${patientName} ${reason.en} and missed their ${medicationName} dose.`,
        fr: `${patientName} ${reason.fr} et a manqué sa dose de ${medicationName}.`,
    };
};

export const shouldEscalateToEmail = (consecutiveMissed, sevenDayMissed = 0) => {
    const escalateConsecutive = consecutiveMissed >= 3;
    const escalateSevenDay = sevenDayMissed >= 3;
    return escalateConsecutive || escalateSevenDay;
};