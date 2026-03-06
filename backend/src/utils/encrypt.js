import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'utf8');

export const encrypt = (plainText) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    const encrypted = Buffer.concat([
        cipher.update(String(plainText), 'utf8'),
        cipher.final(),
    ]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decrypt = (encryptedText) => {
    const [ivHex, encryptedHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedData = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
};