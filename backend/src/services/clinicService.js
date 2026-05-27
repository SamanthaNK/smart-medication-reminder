import { findAllPatients } from '../repositories/userRepository.js';
import { db } from '../config/db.js';
import { decrypt } from '../utils/encrypt.js';

export const getClinicDashboard = async () => {
    const patients = await findAllPatients();

    const patientIds = patients.map((p) => p.id);

    const { data: riskScores, error } = await db
        .from('risk_scores')
        .select('patient_id, score, tier, week_start')
        .in('patient_id', patientIds)
        .order('week_start', { ascending: false });

    if (error) throw error;

    const riskMap = {};
    for (const row of riskScores) {
        if (!riskMap[row.patient_id]) {
            riskMap[row.patient_id] = row;
        }
    }

    const dashboard = patients.map((p) => ({
        id: p.id,
        name: decrypt(p.name),
        email: p.email,
        city: p.city ? decrypt(p.city) : null,
        created_at: p.created_at,
        latestRisk: riskMap[p.id] || null,
    }));

    const summary = { total: patients.length, green: 0, amber: 0, red: 0, unscored: 0 };
    for (const p of dashboard) {
        if (!p.latestRisk) {
            summary.unscored++;
        }
        else {
            summary[p.latestRisk.tier]++;
        }
    }

    return { summary, patients: dashboard };
};