import { successResponse } from '../utils/response.js';
import { confirmDose, markDoseMissed, getDoseHistory } from '../services/doseEventService.js';

export const confirmDoseHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { confirmed_by_voice } = req.body;
        const result = await confirmDose(req.user.id, id, confirmed_by_voice === true);
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};

export const markMissedHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { missed_reason } = req.body;
        if (!missed_reason) {
            return res.status(400).json({
                status: 'error',
                errorCode: 'MISSING_FIELDS',
                message: 'missed_reason is required',
                fieldErrors: [],
            });
        }
        const result = await markDoseMissed(req.user.id, id, missed_reason);
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};

export const getDoseHistoryHandler = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const { status, medicationId, from, to, missedReason, limit } = req.query;
        const history = await getDoseHistory(req.user.id, req.user.role, patientId, {
            status,
            medicationId,
            from,
            to,
            missedReason,
            limit: limit ? parseInt(limit) : undefined,
        });
        return successResponse(res, { history });
    } catch (err) {
        next(err);
    }
};

export const getRiskScoreHandler = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const { getPatientRiskScore } = await import('../services/riskService.js');
        const result = await getPatientRiskScore(req.user.id, req.user.role, patientId);
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};