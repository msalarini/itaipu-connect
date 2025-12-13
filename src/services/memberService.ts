import { supabase } from './supabaseClient';

export interface Member {
    id: string;
    email: string;
    name: string;
    global_role: 'MEMBER' | 'LEADER' | 'PASTOR';
    avatar_url?: string;
    created_at: string;
}

export const memberService = {
    /**
     * List all members (for admins)
     * Supports simple search filtering on client or server
     */
    async listAllMembers(): Promise<Member[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, name, global_role, avatar_url, created_at')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error listing members:', error);
            throw new Error(error.message);
        }

        return data as Member[];
    },

    /**
     * Update a user's global role
     */
    async updateMemberRole(userId: string, newRole: 'MEMBER' | 'LEADER' | 'PASTOR'): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ global_role: newRole })
            .eq('id', userId);

        if (error) {
            console.error('Error updating member role:', error);
            throw new Error(error.message);
        }
    },

    /**
     * Delete/Ban a user (Optional, requires improved RLS)
     */
    async deleteMember(userId: string): Promise<void> {
        // Warning: This physically deletes the profile.
        // In a real app, you might want a "banned" flag instead.
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) {
            console.error('Error deleting member:', error);
            throw new Error(error.message);
        }
    }
}


export interface UserSearchResult {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
}

/**
 * Get users not in a specific ministry (for adding members)
 */
export const getUsersNotInMinistry = async (ministryId: string, searchQuery: string = ''): Promise<UserSearchResult[]> => {
    // 1. Get all profiles
    let query = supabase
        .from('profiles')
        .select('id, email, name, avatar_url');

    if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
        throw new Error(profilesError.message);
    }

    // 2. Get members of this ministry
    const { data: existingMembers, error: membersError } = await supabase
        .from('ministry_members')
        .select('user_id')
        .eq('ministry_id', ministryId);

    if (membersError) {
        throw new Error(membersError.message);
    }

    const existingIds = new Set(existingMembers?.map(m => m.user_id));

    // 3. Filter out existing members
    return profiles
        ?.filter(p => !existingIds.has(p.id))
        .map(p => ({
            id: p.id,
            email: p.email,
            name: p.name,
            avatar_url: p.avatar_url
        })) || [];
};

export const addMemberToMinistry = async (ministryId: string, userId: string, role: 'MEMBER' | 'LEADER'): Promise<void> => {
    const { error } = await supabase
        .from('ministry_members')
        .insert({
            ministry_id: ministryId,
            user_id: userId,
            role: role
        });

    if (error) {
        throw new Error(error.message);
    }
};
