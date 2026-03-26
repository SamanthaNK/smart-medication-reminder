import { successResponse } from '../utils/response.js';
import {
    getMedications,
    createMedicationForPatient,
    editMedication,
    deactivateMedication,
} from '../services/medicationService.js';

export const listMedications = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const medications = await getMedications(req.user.id, req.user.role, patientId);
        return successResponse(res, { medications });
    } catch (err) {
        next(err);
    }
};

export const createMedication = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const result = await createMedicationForPatient(req.user.id, req.user.role, patientId, req.body);
        return successResponse(res, result, 201);
    } catch (err) {
        next(err);
    }
};

export const updateMedication = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await editMedication(req.user.id, req.user.role, id, req.body);
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};

export const deleteMedication = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await deactivateMedication(req.user.id, req.user.role, id);
        return successResponse(res, result);
    } catch (err) {
        next(err);
    }
};