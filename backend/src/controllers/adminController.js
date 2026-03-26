import { successResponse } from '../utils/response.js';
import { getPlatformStats } from '../services/adminService.js';

export const platformStats = async (req, res, next) => {
    try {
        const result = await getPlatformStats();
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};