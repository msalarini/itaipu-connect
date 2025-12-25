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

const ROLE_PRIORITY = {
    'LEADER': 1,
    'MEMBER': 2
};

/**
 * List members of a ministry with role priority sorting
 */
export async function listMinistryMembers(ministryId: string) {
    const { data, error } = await supabase
        .from('ministry_members')
        .select(`
            id,
            user_id,
            ministry_role,
            profile:profiles (
                name,
                email
            )
        `)
        .eq('ministry_id', ministryId);

    if (error) {
        console.error('Error listing ministry members:', error);
        throw error;
    }

    // Sort by role priority locally to avoid magic string dependency in SQL
    // and flatten the profile object safely
    return data
        .map((m: any) => {
            const profileData = Array.isArray(m.profile) ? m.profile[0] : m.profile;
            return {
                ...m,
                profile: profileData
            };
        })
        .sort((a: any, b: any) => {
            const roleA = a.ministry_role as keyof typeof ROLE_PRIORITY;
            const roleB = b.ministry_role as keyof typeof ROLE_PRIORITY;
            return (ROLE_PRIORITY[roleA] || 99) - (ROLE_PRIORITY[roleB] || 99);
        });
}
