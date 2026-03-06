import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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
import { generateSixDigitCode } from '../utils/codeGenerator.js';

const signToken = (userId, role) => {
    return jwt.sign(
        { sub: userId, role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
    );
};

const sanitiseUser = (user) => {
    const {
        password_hash,
        verification_token,
        verification_code_expires_at,
        reset_token,
        reset_token_expires_at,
        ...safe
    } = user;
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

    const verification_token = generateSixDigitCode();
    const verification_code_expires_at = new Date(
        Date.now() + env.VERIFICATION_CODE_EXPIRES_MINUTES * 60 * 1000
    );

    await createUser({
        name: encrypt(name),
        email,
        password_hash,
        role,
        preferred_language: preferred_language || 'en',
        city: city ? encrypt(city) : null,
        is_verified: false,
        verification_token,
        verification_code_expires_at,
    });

    await sendVerificationEmail(email, name, verification_token);

    return {
        message: 'Registration successful. Please check your email for your 6-digit verification code.',
    };
};

export const verifyEmail = async (email, code) => {
    const user = await findUserByEmail(email);

    if (!user || user.verification_token !== code) {
        throw new AppError('Invalid verification code', 400, 'INVALID_CODE');
    }

    if (new Date() > new Date(user.verification_code_expires_at)) {
        throw new AppError(
            'This code has expired. Please register again to get a new code.',
            400,
            'CODE_EXPIRED'
        );
    }

    await updateUserById(user.id, {
        is_verified: true,
        verification_token: null,
        verification_code_expires_at: null,
    });

    return { message: 'Email verified successfully. You can now log in.' };
};

export const resendVerificationCode = async (email) => {
    const user = await findUserByEmail(email);

    if (!user || user.is_verified) {
        return { message: 'If that account exists and is unverified, a new code has been sent.' };
    }

    const verification_token = generateSixDigitCode();
    const verification_code_expires_at = new Date(
        Date.now() + env.VERIFICATION_CODE_EXPIRES_MINUTES * 60 * 1000
    );

    await updateUserById(user.id, { verification_token, verification_code_expires_at });

    const userName = decrypt(user.name);
    await sendVerificationEmail(email, userName, verification_token);

    return { message: 'If that account exists and is unverified, a new code has been sent.' };
};

export const loginUser = async ({ email, password }) => {
    const user = await findUserByEmail(email);

    if (!user) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_verified) {
        throw new AppError(
            'Please verify your email address before logging in',
            401,
            'EMAIL_NOT_VERIFIED'
        );
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = signToken(user.id, user.role);

    return { token, user: sanitiseUser(user) };
};

export const forgotPassword = async (email) => {
    const user = await findUserByEmail(email);

    if (!user) {
        return { message: 'If an account with that email exists, a reset code has been sent.' };
    }

    const reset_token = generateSixDigitCode();
    const reset_token_expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await updateUserById(user.id, { reset_token, reset_token_expires_at });

    const userName = decrypt(user.name);
    await sendPasswordResetEmail(email, userName, reset_token);

    return { message: 'If an account with that email exists, a reset code has been sent.' };
};

export const resetPassword = async (email, code, newPassword) => {
    const user = await findUserByEmail(email);

    if (!user || user.reset_token !== code) {
        throw new AppError('Invalid reset code', 400, 'INVALID_CODE');
    }

    if (new Date() > new Date(user.reset_token_expires_at)) {
        throw new AppError(
            'This code has expired. Please request a new one.',
            400,
            'CODE_EXPIRED'
        );
    }

    const password_hash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

    await updateUserById(user.id, {
        password_hash,
        reset_token: null,
        reset_token_expires_at: null,
    });

    return { message: 'Password reset successfully. You can now log in.' };
};