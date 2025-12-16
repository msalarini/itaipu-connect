import { supabase } from './supabaseClient';

import { Ministry } from '../types';

export interface CreateMinistryData {
    name: string;
    description?: string;
}

export interface UpdateMinistryData {
    name: string;
    description?: string;
}

/**
 * Create a new ministry
 */
export async function createMinistry(data: CreateMinistryData, userId: string): Promise<Ministry> {
    const { data: ministry, error } = await supabase
        .from('ministries')
        .insert({
            name: data.name.trim(),
            description: data.description?.trim() || null,
            created_by: userId,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating ministry:', error);
        throw new Error(error.message);
    }

    return ministry;
}

/**
 * Update an existing ministry
 */
export async function updateMinistry(id: string, data: UpdateMinistryData): Promise<Ministry> {
    const { data: ministry, error } = await supabase
        .from('ministries')
        .update({
            name: data.name.trim(),
            description: data.description?.trim() || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating ministry:', error);
        throw new Error(error.message);
    }

    return ministry;
}

/**
 * Delete a ministry
 */
export async function deleteMinistry(id: string): Promise<void> {
    const { error } = await supabase
        .from('ministries')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting ministry:', error);
        throw new Error(error.message);
    }
}

/**
 * Get a ministry by ID
 */
export async function getMinistryById(id: string): Promise<Ministry | null> {
    const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching ministry:', error);
        return null;
    }

    return data;
}

/**
 * List all ministries
 */
export async function listMinistries(): Promise<Ministry[]> {
    const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error listing ministries:', error);
        throw new Error(error.message);
    }

    return data || [];
}

/**
 * List ministries the user is a member of
 */
export async function listUserMinistries(userId: string): Promise<Ministry[]> {
    const { data, error } = await supabase
        .from('ministry_members')
        .select(`
            ministry:ministries (
                id,
                name,
                description,
                created_by,
                created_at
            )
        `)
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching user ministries:', error);
        throw new Error(error.message);
    }

    if (!data) return [];

    // Flatten the response
    return data.map((item: any) => item.ministry).filter(Boolean);
}
