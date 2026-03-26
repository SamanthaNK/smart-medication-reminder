import { db } from '../config/db.js';

export const findUserByEmail = async (email) => {
    const { data, error } = await db
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const findUserById = async (id) => {
    const { data, error } = await db
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const findUserByVerificationToken = async (token) => {
    const { data, error } = await db
        .from('users')
        .select('*')
        .eq('verification_token', token)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const findUserByResetToken = async (token) => {
    const { data, error } = await db
        .from('users')
        .select('*')
        .eq('reset_token', token)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const createUser = async (userData) => {
    const { data, error } = await db
        .from('users')
        .insert(userData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateUserById = async (id, updates) => {
    const { data, error } = await db
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const findUsersByIds = async (ids) => {
    if (ids.length === 0) return [];
    const { data, error } = await db
        .from('users')
        .select('id, name, email, role, city, preferred_language, created_at')
        .in('id', ids);
    if (error) throw error;
    return data;
};

export const findAllPatients = async () => {
    const { data, error } = await db
        .from('users')
        .select('id, name, email, city, created_at')
        .eq('role', 'patient');
    if (error) throw error;
    return data;
};

export const countUsersByRole = async () => {
    const { data, error } = await db
        .from('users')
        .select('role');
    if (error) throw error;
    return data.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
    }, {});
};