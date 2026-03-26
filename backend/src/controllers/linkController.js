import { successResponse } from '../utils/response.js';
import {
    requestLink,
    respondToLink,
    getPendingLinksForPatient,
    getLinkedPatients,
} from '../services/linkService.js';

export const requestLinkHandler = async (req, res, next) => {
    try {
        const { patient_email } = req.body;
        if (!patient_email) {
            return res.status(400).json({
                status: 'error',
                errorCode: 'MISSING_FIELDS',
                message: 'patient_email is required',
                fieldErrors: [],
            });
        }
        const result = await requestLink(req.user.id, patient_email.toLowerCase().trim());
        return successResponse(res, result, 201);
    } catch (err) {
        next(err);
    }
};

export const respondToLinkHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action } = req.body;
        if (!action) {
            return res.status(400).json({
                status: 'error',
                errorCode: 'MISSING_FIELDS',
                message: 'action is required ("approve" or "reject")',
                fieldErrors: [],
            });
        }
        const result = await respondToLink(req.user.id, id, action);
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};

export const getPendingLinksHandler = async (req, res, next) => {
    try {
        const links = await getPendingLinksForPatient(req.user.id);
        return successResponse(res, { links });
    } catch (err) {
        next(err);
    }
};

export const getLinkedPatientsHandler = async (req, res, next) => {
    try {
        const result = await getLinkedPatients(req.user.id);
        return successResponse(res, { patients: result });
    } catch (err) {
        next(err);
    }
};