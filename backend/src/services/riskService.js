import { db } from '../config/db.js';
import { findAllPatients } from '../repositories/userRepository.js';
import { countDosesByPatientAndDateRange } from '../repositories/doseEventRepository.js';

const calcRiskTier = (pct) => {
    if (pct >= 90) return 'green';
    if (pct >= 75) return 'amber';
    return 'red';
};

export const calculateWeeklyRiskScores = async () => {
    const now = new Date();

    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const patients = await findAllPatients();
    let processed = 0;

    for (const patient of patients) {
        const events = await countDosesByPatientAndDateRange(
            patient.id,
            weekStart.toISOString(),
            weekEnd.toISOString()
        );

        const total = events.length;
        if (total === 0) continue;

        const taken = events.filter((e) => e.status === 'taken' || e.status === 'late').length;
        const adherencePct = parseFloat(((taken / total) * 100).toFixed(2));
        const riskTier = calcRiskTier(adherencePct);

        const { error } = await db.from('risk_scores').upsert({
            patient_id: patient.id,
            week_start: weekStart.toISOString().split('T')[0],
            doses_scheduled: total,
            doses_taken: taken,
            score: adherencePct,
            tier: riskTier,
            calculated_at: now.toISOString(),
        }, { onConflict: 'patient_id,week_start' });

        if (error) {
            console.error(`[RISK] Failed to save risk score for patient ${patient.id}:`, error.message);
        } else {
            processed++;
        }
    }

    console.log(`[RISK] Weekly risk scores calculated for ${processed} patients.`);
};


export const getPatientRiskScore = async (requesterId, requesterRole, patientId) => {
    if (requesterRole === 'patient' && requesterId !== patientId) {
        const { AppError } = await import('../middleware/errorMiddleware.js');
        throw new AppError('You can only view your own risk score.', 403, 'FORBIDDEN');
    }
    if (requesterRole === 'caregiver') {
        const { findLinkByPair } = await import('../repositories/linkRepository.js');
        const link = await findLinkByPair(requesterId, patientId);
        if (!link || link.status !== 'active') {
            const { AppError } = await import('../middleware/errorMiddleware.js');
            throw new AppError('You do not have an active link with this patient.', 403, 'FORBIDDEN');
        }
    }

    const { data, error } = await db
        .from('risk_scores')
        .select('*')
        .eq('patient_id', patientId)
        .order('week_start', { ascending: false })
        .limit(4);

    if (error) throw error;
    return { scores: data };
};