import 'dotenv/config';

const required = (key) => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
};

export const env = {
    PORT: process.env.PORT || 3000,

    SUPABASE_URL: required('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),

    JWT_SECRET: required('JWT_SECRET'),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10'),

    ENCRYPTION_KEY: required('ENCRYPTION_KEY'),

    FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',

    GMAIL_USER: process.env.GMAIL_USER || '',
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || '',
};