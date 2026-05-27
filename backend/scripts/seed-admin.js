import 'dotenv/config';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const ADMIN_NAME = 'Samantha Ngong';
const ADMIN_EMAIL = 'admin@medmate-app.com';
const ADMIN_PASSWORD = 'Admin@MedMate2026!';
const ADMIN_CITY = 'Yaounde';

const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ENCRYPTION_KEY'];
for (const v of requiredVars) {
    if (!process.env[v]) {
        console.error(`ERROR: Missing required env var: ${v}`);
        console.error('Make sure you have a .env file in your backend directory.');
        process.exit(1);
    }
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (Buffer.from(ENCRYPTION_KEY, 'utf8').length !== 32) {
    console.error(`ERROR: ENCRYPTION_KEY must be exactly 32 characters long.`);
    console.error(`Yours is ${Buffer.from(ENCRYPTION_KEY, 'utf8').length} characters.`);
    process.exit(1);
}

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');
const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(ENCRYPTION_KEY, 'utf8');

const encrypt = (plainText) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    const encrypted = Buffer.concat([
        cipher.update(String(plainText), 'utf8'),
        cipher.final(),
    ]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedAdmin() {
    console.log('\nMedMate Admin Seed Script');
    console.log('----------------------------------------');

    const { data: existing } = await db
        .from('users')
        .select('id, role')
        .eq('email', ADMIN_EMAIL)
        .single();

    if (existing) {
        if (existing.role === 'admin') {
            console.log(`An admin with email "${ADMIN_EMAIL}" already exists.`);
            console.log(`User ID: ${existing.id}`);
            console.log('Nothing was changed. Exiting.');
        } else {
            console.log(`A user with email "${ADMIN_EMAIL}" already exists with role: ${existing.role}`);
            console.log('To promote them to admin, update the role column directly in Supabase.');
        }
        process.exit(0);
    }

    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log(`Name:     ${ADMIN_NAME}`);
    console.log(`City:     ${ADMIN_CITY}`);
    console.log(`Hashing password with bcrypt (${BCRYPT_ROUNDS} rounds)...`);

    const password_hash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

    console.log('Encrypting name and city...');

    const encryptedName = encrypt(ADMIN_NAME);
    const encryptedCity = encrypt(ADMIN_CITY);

    console.log('Inserting into database...');

    const { data, error } = await db
        .from('users')
        .insert({
            name: encryptedName,
            email: ADMIN_EMAIL,
            password_hash: password_hash,
            role: 'admin',
            preferred_language: 'en',
            city: encryptedCity,
            is_verified: true,
            verification_token: null,
            verification_code_expires_at: null,
        })
        .select('id, email, role, created_at')
        .single();

    if (error) {
        console.error('\nERROR: Database insert failed:');
        console.error(error.message);
        process.exit(1);
    }

    console.log('\nAdmin account created successfully.');
    console.log('----------------------------------------');
    console.log(`ID:         ${data.id}`);
    console.log(`Email:      ${data.email}`);
    console.log(`Role:       ${data.role}`);
    console.log(`Created at: ${data.created_at}`);
    console.log('----------------------------------------');
    console.log('\nLogin credentials:');
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log('\nIMPORTANT: Change this password after first login.');
    console.log('The admin can log in via the mobile app or the web portal at /login\n');
}

seedAdmin().catch((err) => {
    console.error('\nUnexpected error:', err.message);
    process.exit(1);
});