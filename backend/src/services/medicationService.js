import { AppError } from '../middleware/errorMiddleware.js';
import {
    findMedicationById,
    findActiveMedicationsByPatient,
    createMedication,
    updateMedicationById,
} from '../repositories/medicationRepository.js';
import { findLinkByPair } from '../repositories/linkRepository.js';

const assertAccess = async (requesterId, requesterRole, patientId) => {
    if (requesterRole === 'patient') {
        if (requesterId !== patientId) {
            throw new AppError('You can only manage your own medications.', 403, 'FORBIDDEN');
        }
        return;
    }
    if (requesterRole === 'caregiver') {
        const link = await findLinkByPair(requesterId, patientId);
        if (!link || link.status !== 'active') {
            throw new AppError(
                'You do not have an active link with this patient.',
                403,
                'FORBIDDEN'
            );
        }
        return;
    }
    if (!['clinic_staff', 'admin'].includes(requesterRole)) {
        throw new AppError('Access denied.', 403, 'FORBIDDEN');
    }
};

export const getMedications = async (requesterId, requesterRole, patientId) => {
    await assertAccess(requesterId, requesterRole, patientId);
    return findActiveMedicationsByPatient(patientId);
};

export const createMedicationForPatient = async (requesterId, requesterRole, patientId, body) => {
    await assertAccess(requesterId, requesterRole, patientId);

    const {
        name, dose_amount, dose_unit, frequency,
        times_of_day, start_date, end_date,
        notes, pill_colour, pill_shape, pill_notes,
    } = body;

    if (!name || !dose_amount || !dose_unit || !frequency || !times_of_day || !start_date) {
        throw new AppError(
            'name, dose_amount, dose_unit, frequency, times_of_day, and start_date are required.',
            400,
            'MISSING_FIELDS'
        );
    }

    if (!Array.isArray(times_of_day) || times_of_day.length === 0) {
        throw new AppError('times_of_day must be a non-empty array of HH:MM strings.', 400, 'INVALID_TIMES');
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    for (const t of times_of_day) {
        if (!timeRegex.test(t)) {
            throw new AppError(`Invalid time format "${t}". Use HH:MM (24-hour).`, 400, 'INVALID_TIME_FORMAT');
        }
    }

    const medication = await createMedication({
        patient_id: patientId,
        created_by: requesterId,
        name,
        dose_amount,
        dose_unit,
        frequency,
        times_of_day,
        start_date,
        end_date: end_date || null,
        notes: notes || null,
        is_active: true,
        pill_colour: pill_colour || null,
        pill_shape: pill_shape || null,
        pill_notes: pill_notes || null,
    });

    return { medication };
};

export const editMedication = async (requesterId, requesterRole, medicationId, body) => {
    const medication = await findMedicationById(medicationId);
    if (!medication) {
        throw new AppError('Medication not found.', 404, 'NOT_FOUND');
    }

    await assertAccess(requesterId, requesterRole, medication.patient_id);

    const allowedUpdates = [
        'name', 'dose_amount', 'dose_unit', 'frequency',
        'times_of_day', 'start_date', 'end_date', 'notes',
        'is_active', 'pill_colour', 'pill_shape', 'pill_notes',
    ];
    const updates = {};
    for (const key of allowedUpdates) {
        if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
        throw new AppError('No valid fields provided for update.', 400, 'NO_CHANGES');
    }

    if (updates.times_of_day) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        for (const t of updates.times_of_day) {
            if (!timeRegex.test(t)) {
                throw new AppError(`Invalid time format "${t}". Use HH:MM (24-hour).`, 400, 'INVALID_TIME_FORMAT');
            }
        }
    }

    const updated = await updateMedicationById(medicationId, updates);
    return { medication: updated };
};

export const deactivateMedication = async (requesterId, requesterRole, medicationId) => {
    const medication = await findMedicationById(medicationId);
    if (!medication) {
        throw new AppError('Medication not found.', 404, 'NOT_FOUND');
    }

    await assertAccess(requesterId, requesterRole, medication.patient_id);

    const updated = await updateMedicationById(medicationId, { is_active: false });
    return { medication: updated };
};