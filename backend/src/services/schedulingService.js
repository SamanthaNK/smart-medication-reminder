import cron from 'node-cron';
import { findAllActiveMedications } from '../repositories/medicationRepository.js';
import {
    findDoseEventByMedicationAndTime,
    createManyDoseEvents,
    findOverduePendingEvents,
    updateDoseEventById,
} from '../repositories/doseEventRepository.js';
import { findActiveCaregiversByPatient } from '../repositories/linkRepository.js';
import { createAlert } from '../repositories/alertRepository.js';
import { findUserById } from '../repositories/userRepository.js';
import { calculateWeeklyRiskScores } from './riskService.js';
import {
    sendPushToCaregiver,
    buildMissedDoseMessages,
    shouldEscalateToEmail,
} from './notificationService.js';
import { decrypt } from '../utils/encrypt.js';
import { countConsecutiveMissedDoses } from '../repositories/alertRepository.js';
import { sendMissedDoseAlertEmail } from './emailService.js';

const generateDailyDoseEvents = async (targetDate) => {
    console.log(`[CRON] Generating dose events for ${targetDate.toISOString().split('T')[0]}`);

    const medications = await findAllActiveMedications();
    const dateStr = targetDate.toISOString().split('T')[0];

    const eventsToCreate = [];

    for (const med of medications) {
        if (dateStr < med.start_date) continue;
        if (med.end_date && dateStr > med.end_date) continue;

        for (const timeStr of med.times_of_day) {
            const scheduledTime = new Date(`${dateStr}T${timeStr}:00.000Z`).toISOString();

            const existing = await findDoseEventByMedicationAndTime(med.id, scheduledTime);
            if (existing) continue;

            eventsToCreate.push({
                medication_id: med.id,
                patient_id: med.patient_id,
                scheduled_time: scheduledTime,
                status: 'pending',
            });
        }
    }

    if (eventsToCreate.length > 0) {
        await createManyDoseEvents(eventsToCreate);
        console.log(`[CRON] Created ${eventsToCreate.length} dose events.`);
    } else {
        console.log('[CRON] No new dose events needed.');
    }
};

const processOverdueDoses = async () => {
    console.log('[CRON] Checking for overdue pending doses...');

    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const overdueEvents = await findOverduePendingEvents(cutoff);

    console.log(`[CRON] Found ${overdueEvents.length} overdue dose events.`);

    for (const event of overdueEvents) {
        await updateDoseEventById(event.id, {
            status: 'missed',
            missed_reason: 'no_response',
            confirmed_at: new Date().toISOString(),
        });

        try {
            const patient = await findUserById(event.patient_id);
            const patientName = decrypt(patient.name);
            const medicationName = event.medication?.name || 'medication';

            const messages = buildMissedDoseMessages(patientName, medicationName, 'no_response');
            const caregiverLinks = await findActiveCaregiversByPatient(event.patient_id);
            const consecutiveMissed = await countConsecutiveMissedDoses(event.patient_id);
            const escalate = shouldEscalateToEmail(consecutiveMissed);

            for (const link of caregiverLinks) {
                await createAlert({
                    patient_id: event.patient_id,
                    caregiver_id: link.caregiver_id,
                    type: 'missed_dose',
                    message_en: messages.en,
                    message_fr: messages.fr,
                    missed_reason: 'no_response',
                });

                const caregiver = await findUserById(link.caregiver_id);
                await sendPushToCaregiver(caregiver, 'Missed Dose Alert', messages.en, {
                    type: 'missed_dose',
                    patientId: event.patient_id,
                    eventId: event.id,
                });

                if (escalate) {
                    const caregiverName = decrypt(caregiver.name);
                    await sendMissedDoseAlertEmail(
                        caregiver.email,
                        caregiverName,
                        patientName,
                        medicationName,
                        'no_response',
                        consecutiveMissed
                    );
                }
            }
        } catch (err) {
            console.error(`[CRON] Failed to alert caregivers for event ${event.id}:`, err.message);
        }
    }
};

export const startScheduler = () => {
    cron.schedule('1 0 * * *', async () => {
        const tomorrow = new Date();
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        await generateDailyDoseEvents(tomorrow).catch((err) =>
            console.error('[CRON] generateDailyDoseEvents failed:', err.message)
        );
    });

    generateDailyDoseEvents(new Date()).catch((err) =>
        console.error('[CRON] Initial dose event generation failed:', err.message)
    );

    cron.schedule('*/15 * * * *', async () => {
        await processOverdueDoses().catch((err) =>
            console.error('[CRON] processOverdueDoses failed:', err.message)
        );
    });

    cron.schedule('55 23 * * 0', async () => {
        await calculateWeeklyRiskScores().catch((err) =>
            console.error('[CRON] calculateWeeklyRiskScores failed:', err.message)
        );
    });

    console.log('[CRON] Scheduler started.');
};