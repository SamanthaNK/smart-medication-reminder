import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorMiddleware.js';
import {
    findUserByEmail,
    findUserByVerificationToken,
    findUserByResetToken,
    createUser,
    updateUserById,
} from '../repositories/userRepository.js';
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
} from './emailService.js';
import { encrypt, decrypt } from '../utils/encrypt.js';

const signToken = (userId, role) => {
    return jwt.sign(
        { sub: userId, role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
    );
};

const sanitiseUser = (user) => {
    const { password_hash, verification_token, reset_token, reset_token_expires_at, ...safe } = user;
    return {
        ...safe,
        name: decrypt(safe.name),
        city: safe.city ? decrypt(safe.city) : null,
    };
};

export const registerUser = async ({ name, email, password, role, preferred_language, city }) => {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new AppError('An account with this email already exists', 409, 'EMAIL_TAKEN');
    }

    const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    const verification_token = crypto.randomBytes(32).toString('hex');

    const newUser = await createUser({
        name: encrypt(name),
        email,
        password_hash,
        role,
        preferred_language: preferred_language || 'en',
        city: city ? encrypt(city) : null,
        is_verified: false,
        verification_token,
    });

    await sendVerificationEmail(email, name, verification_token);

    return { message: 'Registration successful. Please check your email to verify your account.' };
};

export const verifyEmail = async (token) => {
    const user = await findUserByVerificationToken(token);
    if (!user) {
        throw new AppError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
    }

    await updateUserById(user.id, {
        is_verified: true,
        verification_token: null,
    });

    return { message: 'Email verified successfully. You can now log in.' };
};

export const loginUser = async ({ email, password }) => {
    const user = await findUserByEmail(email);

    if (!user) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_verified) {
        throw new AppError('Please verify your email address before logging in', 401, 'EMAIL_NOT_VERIFIED');
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = signToken(user.id, user.role);

    return {
        token,
        user: sanitiseUser(user),
    };
};

export const forgotPassword = async (email) => {
    const user = await findUserByEmail(email);

    if (!user) {
        return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    const reset_token = crypto.randomBytes(32).toString('hex');
    const reset_token_expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await updateUserById(user.id, { reset_token, reset_token_expires_at });

    const userName = decrypt(user.name);
    await sendPasswordResetEmail(email, userName, reset_token);

    return { message: 'If an account with that email exists, a reset link has been sent.' };
};

export const resetPassword = async (token, newPassword) => {
    const user = await findUserByResetToken(token);

    if (!user) {
        throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    if (new Date() > new Date(user.reset_token_expires_at)) {
        throw new AppError('This reset link has expired. Please request a new one.', 400, 'TOKEN_EXPIRED');
    }

    const password_hash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

    await updateUserById(user.id, {
        password_hash,
        reset_token: null,
        reset_token_expires_at: null,
    });

    return { message: 'Password reset successfully. You can now log in.' };
};