import { db } from '../config/db.js';

export const createAuditLog = async ({ actorId, entityType, entityId, action, details }) => {
    const { error } = await db
        .from('audit_logs')
        .insert({
            actor_id: actorId,
            entity_type: entityType,
            entity_id: entityId,
            action,
            details: details || {},
        });

    if (error) {
        console.error('[AUDIT] Failed to write audit log:', error.message);
    }
};