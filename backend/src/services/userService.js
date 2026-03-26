import { updateUserById, findUserById } from '../repositories/userRepository.js';
import { decrypt } from '../utils/encrypt.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const getMyProfile = async (userId) => {
    const user = await findUserById(userId);
    if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');

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

export const updateFcmToken = async (userId, fcmToken) => {
    if (!fcmToken || typeof fcmToken !== 'string') {
        throw new AppError('fcm_token is required and must be a string.', 400, 'INVALID_TOKEN');
    }
    await updateUserById(userId, { fcm_token: fcmToken });
    return { message: 'FCM token updated.' };
};