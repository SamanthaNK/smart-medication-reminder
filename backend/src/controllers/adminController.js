import { successResponse } from '../utils/response.js';
import { getPlatformStats } from '../services/adminService.js';
import { updateUserById, findUserById } from '../repositories/userRepository.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const platformStats = async (req, res, next) => {
    try {
        const result = await getPlatformStats();
        return successResponse(res, result);
    } catch (err) { next(err); }
};

export const verifyUserAccount = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await findUserById(id);
        if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');

        if (user.role !== 'clinic_staff') {
            throw new AppError('Only clinic_staff accounts require admin verification.', 400, 'INVALID_ROLE');
        }

        const updated = await updateUserById(id, { is_verified: true });

        return successResponse(res, { message: 'Account verified successfully.', userId: updated.id });
    } catch (err) { next(err); }
};