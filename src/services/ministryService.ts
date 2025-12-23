import { supabase } from './supabaseClient';

import { Ministry } from '../types';



// Unused create/update/delete functions removed.


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
