import cron from 'node-cron';
import { findAllActiveMedications } from '../repositories/medicationRepository.js';
import { findDoseEventByMedicationAndTime, createManyDoseEvents, findOverduePendingEvents, updateDoseEventById } from '../repositories/doseEventRepository.js';
import { findActiveCaregiversByPatient } from '../repositories/linkRepository.js';
import { createAlert } from '../repositories/alertRepository.js';
import { findUserById } from '../repositories/userRepository.js';
import { calculateWeeklyRiskScores } from './riskService.js';
import { sendPushToCaregiver, buildMissedDoseMessages, shouldEscalateToEmail } from './notificationService.js';
import { db } from '../config/db.js';
import { mailer } from '../config/mailer.js';
import { env } from '../config/env.js';
import { decrypt } from '../utils/encrypt.js';
import { countConsecutiveMissedDoses, countMissedDosesInLastSevenDays } from '../repositories/alertRepository.js';
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
        try {
            await updateDoseEventById(event.id, {
                status: 'missed',
                missed_reason: 'no_response',
                confirmed_at: new Date().toISOString(),
            });
        } catch (err) {
            console.error(`[CRON] Could not update event ${event.id}:`, err.message);
            continue;
        }

        try {
            const patient = await findUserById(event.patient_id);
            const patientName = decrypt(patient.name);
            const medicationName = event.medication?.name || 'medication';

            const messages = buildMissedDoseMessages(patientName, medicationName, 'no_response');
            const caregiverLinks = await findActiveCaregiversByPatient(event.patient_id);
            const consecutiveMissed = await countConsecutiveMissedDoses(event.patient_id);
            const sevenDayMissed = await countMissedDosesInLastSevenDays(event.patient_id);
            const escalate = shouldEscalateToEmail(consecutiveMissed, sevenDayMissed);

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
                    ).catch((emailErr) => {
                        console.error(`[CRON] Escalation email failed for ${caregiver.email}:`, emailErr.message);
                    });
                }
            }
        } catch (err) {
            console.error(`[CRON] Failed to alert caregivers for event ${event.id}:`, err.message);
        }
    }
};

const sendWeeklyClinicDigest = async () => {
    console.log('[CRON] Sending weekly clinic staff digest...');

    const { data: redScores, error: scoreError } = await db
        .from('risk_scores')
        .select('patient_id, score, week_start')
        .eq('tier', 'red')
        .order('week_start', { ascending: false });

    if (scoreError) {
        console.error('[CRON] Failed to fetch red-tier scores:', scoreError.message);
        return;
    }

    const latestByPatient = {};
    for (const row of redScores) {
        if (!latestByPatient[row.patient_id]) {
            latestByPatient[row.patient_id] = row;
        }
    }

    const redPatientIds = Object.keys(latestByPatient);

    if (redPatientIds.length === 0) {
        console.log('[CRON] No red-tier patients this week — skipping digest.');
        return;
    }

    const { data: patients, error: patientError } = await db
        .from('users')
        .select('id, name, email')
        .in('id', redPatientIds);

    if (patientError) {
        console.error('[CRON] Failed to fetch patient details:', patientError.message);
        return;
    }

    const patientRows = patients.map((p) => {
        const row = latestByPatient[p.id];
        const name = decrypt(p.name);
        return `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${p.email}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;color:#9F1239;font-weight:bold;">
            ${row.score}%
          </td>
        </tr>`;
    }).join('');

    const emailHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#7C3AED;">MedMate — Weekly Adherence Digest</h2>
        <p>The following patients are currently in the <strong style="color:#9F1239;">Red</strong>
        risk tier (adherence below 75%) and may need follow-up:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#FFF1F2;">
              <th style="padding:8px;text-align:left;color:#9F1239;">Patient Name</th>
              <th style="padding:8px;text-align:left;color:#9F1239;">Email</th>
              <th style="padding:8px;text-align:left;color:#9F1239;">Adherence</th>
            </tr>
          </thead>
          <tbody>${patientRows}</tbody>
        </table>
        <p style="color:#6B7280;font-size:13px;">
          Log in to the MedMate clinic dashboard to view full history and export reports.
        </p>
      </div>`;

    const { data: staffList, error: staffError } = await db
        .from('users')
        .select('email, name')
        .eq('role', 'clinic_staff')
        .eq('is_verified', true);

    if (staffError) {
        console.error('[CRON] Failed to fetch clinic staff:', staffError.message);
        return;
    }

    let sent = 0;
    for (const staff of staffList) {
        try {
            await mailer.sendMail({
                from: `"MedMate" <${env.GMAIL_USER}>`,
                to: staff.email,
                subject: `MedMate Weekly Digest — ${redPatientIds.length} Red-tier patient(s) need attention`,
                html: emailHtml,
            });
            sent++;
        } catch (err) {
            console.error(`[CRON] Failed to email ${staff.email}:`, err.message);
        }
    }

    console.log(`[CRON] Weekly digest sent to ${sent} clinic staff members.`);
};

const keepAlive = async () => {
    try {
        await db.from('users').select('id').limit(1);
        console.log('[CRON] Supabase keep-alive ping OK.');
    } catch (err) {
        console.error('[CRON] Supabase keep-alive ping failed:', err.message);
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

    cron.schedule('57 23 * * 0', async () => {
        await sendWeeklyClinicDigest().catch((err) =>
            console.error('[CRON] sendWeeklyClinicDigest failed:', err.message)
        );
    });

    cron.schedule('0 12 */3 * *', async () => {
        await keepAlive();
    });

    console.log('[CRON] Scheduler started.');
};