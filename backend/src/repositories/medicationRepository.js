import { db } from '../config/db.js';

export const findMedicationById = async (id) => {
    const { data, error } = await db
        .from('medications')
        .select('*')
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const findActiveMedicationsByPatient = async (patientId) => {
    const { data, error } = await db
        .from('medications')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const findAllMedicationsByPatient = async (patientId) => {
    const { data, error } = await db
        .from('medications')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const findAllActiveMedications = async () => {
    const { data, error } = await db
        .from('medications')
        .select('*')
        .eq('is_active', true);
    if (error) throw error;
    return data;
};

export const createMedication = async (medicationData) => {
    const { data, error } = await db
        .from('medications')
        .insert(medicationData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateMedicationById = async (id, updates) => {
    const { data, error } = await db
        .from('medications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};