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