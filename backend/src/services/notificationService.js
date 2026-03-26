import { firebaseMessaging } from '../config/firebase.js';
import { sendMissedDoseAlertEmail } from './emailService.js';
import { decrypt } from '../utils/encrypt.js';

export const sendPushToCaregiver = async (caregiver, title, body, data = {}) => {
    if (!caregiver.fcm_token) {
        console.log(`[FCM] Caregiver ${caregiver.id} has no FCM token — skipping push`);
        return;
    }

    const message = {
        token: caregiver.fcm_token,
        notification: { title, body },
        data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        android: {
            priority: 'high',
            notification: { sound: 'default' },
        },
    };

    try {
        await firebaseMessaging.send(message);
        console.log(`[FCM] Push sent to caregiver ${caregiver.id}`);
    } catch (err) {
        console.error(`[FCM] Failed to send push to caregiver ${caregiver.id}:`, err.message);
    }
};

export const buildMissedDoseMessages = (patientName, medicationName, missedReason) => {
    const reasonLabels = {
        forgot: { en: 'forgot', fr: 'a oublié' },
        feeling_sick: { en: 'is feeling sick', fr: 'ne se sent pas bien' },
        no_pills: { en: 'ran out of pills', fr: 'n\'a plus de médicaments' },
        no_response: { en: 'did not respond', fr: 'n\'a pas répondu' },
    };

    const reason = reasonLabels[missedReason] || reasonLabels.no_response;

    return {
        en: `${patientName} ${reason.en} and missed their ${medicationName} dose.`,
        fr: `${patientName} ${reason.fr} et a manqué sa dose de ${medicationName}.`,
    };
};

export const shouldEscalateToEmail = (consecutiveMissed) => consecutiveMissed >= 3;