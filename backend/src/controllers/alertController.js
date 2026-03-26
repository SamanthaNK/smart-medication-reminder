import { successResponse } from '../utils/response.js';
import { getAlertsForCaregiver, acknowledgeAlert } from '../services/alertService.js';

export const listAlerts = async (req, res, next) => {
    try {
        const result = await getAlertsForCaregiver(req.user.id);
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};

export const acknowledgeAlertHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        const result = await acknowledgeAlert(req.user.id, id, note);
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};