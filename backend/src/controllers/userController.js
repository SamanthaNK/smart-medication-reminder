import { successResponse } from '../utils/response.js';
import { getMyProfile, updateFcmToken } from '../services/userService.js';

export const getProfile = async (req, res, next) => {
    try {
        const profile = await getMyProfile(req.user.id);
        return successResponse(res, { user: profile });
    } catch (err) {
        next(err);
    }
};

export const registerFcmToken = async (req, res, next) => {
    try {
        const { fcm_token } = req.body;
        const result = await updateFcmToken(req.user.id, fcm_token);
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};