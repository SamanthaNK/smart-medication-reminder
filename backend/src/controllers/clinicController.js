import { successResponse } from '../utils/response.js';
import { getClinicDashboard } from '../services/clinicService.js';

export const clinicDashboard = async (req, res, next) => {
    try {
        const result = await getClinicDashboard();
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};