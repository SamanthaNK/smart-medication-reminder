import admin from 'firebase-admin';
import { env } from './env.js';

const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export const firebaseMessaging = admin.messaging();