import { AppError } from '../middleware/errorMiddleware.js';
import {
    findDoseEventById,
    updateDoseEventById,
    findDoseEventsByPatient,
} from '../repositories/doseEventRepository.js';
import { findLinkByPair } from '../repositories/linkRepository.js';
import { findActiveCaregiversByPatient } from '../repositories/linkRepository.js';
import { findUserById } from '../repositories/userRepository.js';
import { createAlert } from '../repositories/alertRepository.js';
import { countConsecutiveMissedDoses, countMissedDosesInLastSevenDays } from '../repositories/alertRepository.js';
import { decrypt } from '../utils/encrypt.js';
import {
    sendPushToCaregiver,
    buildMissedDoseMessages,
    shouldEscalateToEmail,
} from './notificationService.js';
import { sendMissedDoseAlertEmail } from './emailService.js';

export const confirmDose = async (patientId, eventId, confirmedByVoice = false) => {
    const event = await findDoseEventById(eventId);

    if (!event) throw new AppError('Dose event not found.', 404, 'NOT_FOUND');
    if (event.patient_id !== patientId) throw new AppError('Access denied.', 403, 'FORBIDDEN');
    if (event.status !== 'pending') {
        throw new AppError(
            `This dose has already been recorded as "${event.status}".`,
            400,
            'ALREADY_RESOLVED'
        );
    }

    const now = new Date();
    const scheduled = new Date(event.scheduled_time);
    const isLate = (now - scheduled) > 60 * 60 * 1000;

    const updated = await updateDoseEventById(eventId, {
        status: isLate ? 'late' : 'taken',
        confirmed_at: now.toISOString(),
        confirmed_by_voice: confirmedByVoice,
    });

    return { doseEvent: updated };
};

export const markDoseMissed = async (patientId, eventId, missedReason) => {
    const validReasons = ['forgot', 'feeling_sick', 'no_pills', 'no_response'];

    if (!validReasons.includes(missedReason)) {
        throw new AppError(
            `missed_reason must be one of: ${validReasons.join(', ')}`,
            400,
            'INVALID_REASON'
        );
    }

    const event = await findDoseEventById(eventId);
    if (!event) throw new AppError('Dose event not found.', 404, 'NOT_FOUND');
    if (event.patient_id !== patientId) throw new AppError('Access denied.', 403, 'FORBIDDEN');
    if (event.status !== 'pending') {
        throw new AppError(
            `This dose has already been recorded as "${event.status}".`,
            400,
            'ALREADY_RESOLVED'
        );
    }

    const updated = await updateDoseEventById(eventId, {
        status: 'missed',
        missed_reason: missedReason,
        confirmed_at: new Date().toISOString(),
    });

    notifyCaregiversOfMissedDose(patientId, event, missedReason).catch((err) => {
        console.error('[ALERT] Failed to notify caregivers:', err.message);
    });

    return { doseEvent: updated };
};

const notifyCaregiversOfMissedDose = async (patientId, event, missedReason) => {
    const patient = await findUserById(patientId);
    const patientName = decrypt(patient.name);
    const medicationName = event.medication?.name || 'medication';

    const messages = buildMissedDoseMessages(patientName, medicationName, missedReason);

    const caregiverLinks = await findActiveCaregiversByPatient(patientId);

    const consecutiveMissed = await countConsecutiveMissedDoses(patientId);
    const sevenDayMissed = await countMissedDosesInLastSevenDays(patientId);
    const escalate = shouldEscalateToEmail(consecutiveMissed, sevenDayMissed);

    for (const link of caregiverLinks) {
        await createAlert({
            patient_id: patientId,
            caregiver_id: link.caregiver_id,
            type: missedReason === 'no_pills' ? 'low_stock' : 'missed_dose',
            message_en: messages.en,
            message_fr: messages.fr,
            missed_reason: missedReason,
        });

        const caregiver = await findUserById(link.caregiver_id);
        await sendPushToCaregiver(
            caregiver,
            'Missed Dose Alert',
            messages.en,
            { type: 'missed_dose', patientId, eventId: event.id }
        );

        if (escalate) {
            const caregiverName = decrypt(caregiver.name);
            await sendMissedDoseAlertEmail(
                caregiver.email,
                caregiverName,
                patientName,
                medicationName,
                missedReason,
                consecutiveMissed
            );
        }
    }
};

export const getDoseHistory = async (requesterId, requesterRole, patientId, filters) => {
    if (requesterRole === 'patient' && requesterId !== patientId) {
        throw new AppError('You can only view your own history.', 403, 'FORBIDDEN');
    }

    if (requesterRole === 'caregiver') {
        const link = await findLinkByPair(requesterId, patientId);
        if (!link || link.status !== 'active') {
            throw new AppError('You do not have an active link with this patient.', 403, 'FORBIDDEN');
        }
    }

    return findDoseEventsByPatient(patientId, filters);
};