import { successResponse } from '../utils/response.js';
import {
    registerUser,
    verifyEmail,
    resendVerificationCode,
    loginUser,
    forgotPassword,
    resetPassword,
} from '../services/authService.js';

export const register = async (req, res, next) => {
    try {
        const { name, email, password, role, preferred_language, city } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                status: 'error',
                errorCode: 'MISSING_FIELDS',
                message: 'name, email, password and role are required',
                fieldErrors: [],
            });
        }
        const result = await registerUser({ name, email, password, role, preferred_language, city });
        return successResponse(res, result, 201);
    } catch (err) {
        next(err);
    }
};

export const verifyEmailAddress = async (req, res, next) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({
                status: 'error',
                errorCode: 'MISSING_FIELDS',
                message: 'email and code are required',
                fieldErrors: [],
            });
        }
        const result = await verifyEmail(email, code);
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};

export const resendCode = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                status: 'error',
                errorCode: 'MISSING_FIELDS',
                message: 'email is required',
                fieldErrors: [],
            });
        }
        const result = await resendVerificationCode(email);
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                errorCode: 'MISSING_FIELDS',
                message: 'email and password are required',
                fieldErrors: [],
            });
        }
        const result = await loginUser({ email, password });
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};

export const forgotPasswordRequest = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                status: 'error',
                errorCode: 'MISSING_FIELDS',
                message: 'email is required',
                fieldErrors: [],
            });
        }
        const result = await forgotPassword(email);
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};

export const resetPasswordRequest = async (req, res, next) => {
    try {
        const { email, code, password } = req.body;
        if (!email || !code || !password) {
            return res.status(400).json({
                status: 'error',
                errorCode: 'MISSING_FIELDS',
                message: 'email, code and new password are required',
                fieldErrors: [],
            });
        }
        const result = await resetPassword(email, code, password);
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};