import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findUserById } from '../repositories/userRepository.js';
import { AppError } from './errorMiddleware.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Authentication token is required', 401, 'MISSING_TOKEN');
        }

        const token = authHeader.split(' ')[1];

        let decoded;
        try {
            decoded = jwt.verify(token, env.JWT_SECRET);
        } catch (err) {
            throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
        }

        const user = await findUserById(decoded.sub);
        if (!user) {
            throw new AppError('Account not found', 401, 'USER_NOT_FOUND');
        }

        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};