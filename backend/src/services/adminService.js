import { countUsersByRole } from '../repositories/userRepository.js';
import { db } from '../config/db.js';

export const getPlatformStats = async () => {
    const userCounts = await countUsersByRole();

    const [medResult, doseResult, alertResult] = await Promise.all([
        db.from('medications').select('id', { count: 'exact', head: true }),
        db.from('dose_events').select('status'),
        db.from('alerts').select('acknowledged_at'),
    ]);

    if (medResult.error) throw medResult.error;
    if (doseResult.error) throw doseResult.error;
    if (alertResult.error) throw alertResult.error;

    const doseCounts = { pending: 0, taken: 0, missed: 0, late: 0 };
    for (const row of doseResult.data) {
        doseCounts[row.status] = (doseCounts[row.status] || 0) + 1;
    }

    const totalAlerts = alertResult.data.length;
    const unacknowledgedAlerts = alertResult.data.filter((a) => !a.acknowledged_at).length;

    return {
        users: userCounts,
        medications: { total: medResult.count },
        doseEvents: doseCounts,
        alerts: { total: totalAlerts, unacknowledged: unacknowledgedAlerts },
    };
};