import { AppError } from '../middleware/errorMiddleware.js';
import {
    findAlertById,
    findAlertsByCaregiver,
    countUnacknowledgedAlerts,
    updateAlertById,
} from '../repositories/alertRepository.js';
import { decrypt } from '../utils/encrypt.js';

export const getAlertsForCaregiver = async (caregiverId) => {
    const alerts = await findAlertsByCaregiver(caregiverId);
    const unreadCount = await countUnacknowledgedAlerts(caregiverId);

    const decryptedAlerts = alerts.map((a) => ({
        ...a,
        patient: a.patient
            ? { ...a.patient, name: decrypt(a.patient.name) }
            : null,
    }));

    return { alerts: decryptedAlerts, unreadCount };
};

export const acknowledgeAlert = async (caregiverId, alertId, note) => {
    const alert = await findAlertById(alertId);

    if (!alert) throw new AppError('Alert not found.', 404, 'NOT_FOUND');
    if (alert.caregiver_id !== caregiverId) throw new AppError('Access denied.', 403, 'FORBIDDEN');
    if (alert.acknowledged_at) {
        throw new AppError('This alert has already been acknowledged.', 400, 'ALREADY_ACKNOWLEDGED');
    }

    const updated = await updateAlertById(alertId, {
        acknowledged_at: new Date().toISOString(),
        note: note || null,
    });

    return { alert: updated };
};