import { db } from '../config/db.js';

export const findDoseEventById = async (id) => {
    const { data, error } = await db
        .from('dose_events')
        .select('*, medication:medication_id(name, dose_amount, dose_unit)')
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const findDoseEventByMedicationAndTime = async (medicationId, scheduledTime) => {
    const { data, error } = await db
        .from('dose_events')
        .select('id')
        .eq('medication_id', medicationId)
        .eq('scheduled_time', scheduledTime)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const findDoseEventsByPatient = async (patientId, filters = {}) => {
    let query = db
        .from('dose_events')
        .select('*, medication:medication_id(name, dose_amount, dose_unit, pill_colour, pill_shape)')
        .eq('patient_id', patientId)
        .order('scheduled_time', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.medicationId) query = query.eq('medication_id', filters.medicationId);
    if (filters.from) query = query.gte('scheduled_time', filters.from);
    if (filters.to) query = query.lte('scheduled_time', filters.to);
    if (filters.missedReason) query = query.eq('missed_reason', filters.missedReason);

    query = query.limit(filters.limit || 200);

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const countDosesByPatientAndDateRange = async (patientId, from, to) => {
    const { data, error } = await db
        .from('dose_events')
        .select('status')
        .eq('patient_id', patientId)
        .gte('scheduled_time', from)
        .lte('scheduled_time', to);
    if (error) throw error;
    return data;
};

export const findOverduePendingEvents = async (beforeTime) => {
    const { data, error } = await db
        .from('dose_events')
        .select('*, medication:medication_id(name)')
        .eq('status', 'pending')
        .lt('scheduled_time', beforeTime);
    if (error) throw error;
    return data;
};

export const createDoseEvent = async (eventData) => {
    const { data, error } = await db
        .from('dose_events')
        .insert(eventData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const createManyDoseEvents = async (events) => {
    if (events.length === 0) return [];
    const { data, error } = await db
        .from('dose_events')
        .insert(events)
        .select();
    if (error) throw error;
    return data;
};

export const updateDoseEventById = async (id, updates) => {
    const { data, error } = await db
        .from('dose_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};