import { db } from '../config/db.js';

export const findLinkById = async (id) => {
    const { data, error } = await db
        .from('caregiver_links')
        .select('*')
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const findLinkByPair = async (caregiverId, patientId) => {
    const { data, error } = await db
        .from('caregiver_links')
        .select('*')
        .eq('caregiver_id', caregiverId)
        .eq('patient_id', patientId)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const findActiveCaregiversByPatient = async (patientId) => {
    const { data, error } = await db
        .from('caregiver_links')
        .select('*, caregiver:caregiver_id(id, name, email)')
        .eq('patient_id', patientId)
        .eq('status', 'active');
    if (error) throw error;
    return data;
};

export const findActivePatientsByCaregiver = async (caregiverId) => {
    const { data, error } = await db
        .from('caregiver_links')
        .select('*, patient:patient_id(id, name, email, city)')
        .eq('caregiver_id', caregiverId)
        .eq('status', 'active');
    if (error) throw error;
    return data;
};

export const findPendingLinksForPatient = async (patientId) => {
    const { data, error } = await db
        .from('caregiver_links')
        .select('*, caregiver:caregiver_id(id, name, email)')
        .eq('patient_id', patientId)
        .eq('status', 'pending');
    if (error) throw error;
    return data;
};

export const createLink = async (linkData) => {
    const { data, error } = await db
        .from('caregiver_links')
        .insert(linkData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateLinkById = async (id, updates) => {
    const { data, error } = await db
        .from('caregiver_links')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};