import { db } from '../config/db.js';

export const findAlertById = async (id) => {
    const { data, error } = await db
        .from('alerts')
        .select('*')
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const findAlertsByCaregiver = async (caregiverId) => {
    const { data, error } = await db
        .from('alerts')
        .select('*, patient:patient_id(id, name)')
        .eq('caregiver_id', caregiverId)
        .order('created_at', { ascending: false })
        .limit(100);
    if (error) throw error;
    return data;
};

export const countUnacknowledgedAlerts = async (caregiverId) => {
    const { count, error } = await db
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .eq('caregiver_id', caregiverId)
        .is('acknowledged_at', null);
    if (error) throw error;
    return count;
};

export const createAlert = async (alertData) => {
    const { data, error } = await db
        .from('alerts')
        .insert(alertData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateAlertById = async (id, updates) => {
    const { data, error } = await db
        .from('alerts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const countConsecutiveMissedDoses = async (patientId) => {
    const { data, error } = await db
        .from('dose_events')
        .select('status')
        .eq('patient_id', patientId)
        .in('status', ['missed', 'taken', 'late'])
        .order('scheduled_time', { ascending: false })
        .limit(10);
    if (error) throw error;

    let consecutive = 0;
    for (const event of data) {
        if (event.status === 'missed') {
            consecutive++;
        } else {
            break;
        }
    }
    return consecutive;
};

export const countMissedDosesInLastSevenDays = async (patientId) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await db
        .from('dose_events')
        .select('id')
        .eq('patient_id', patientId)
        .eq('status', 'missed')
        .gte('scheduled_time', sevenDaysAgo);
    if (error) throw error;
    return data.length;
};

export const findClinicStaffIds = async () => {
    const { data, error } = await db
        .from('users')
        .select('id')
        .eq('role', 'clinic_staff')
        .eq('is_verified', true);
    if (error) throw error;
    return data.map((u) => u.id);
};

export const findExistingHighRiskAlert = async (patientId) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await db
        .from('alerts')
        .select('id')
        .eq('patient_id', patientId)
        .eq('type', 'high_risk')
        .gte('created_at', sevenDaysAgo)
        .limit(1)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};