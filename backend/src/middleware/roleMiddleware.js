import { AppError } from './errorMiddleware.js';

export const authorise = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Not authenticated', 401, 'NOT_AUTHENTICATED'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new AppError(
                    `Access denied. Required role: ${allowedRoles.join(' or ')}`,
                    403,
                    'FORBIDDEN'
                )
            );
        }

        next();
    };
};