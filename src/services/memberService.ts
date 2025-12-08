import { supabase } from './supabaseClient';

export interface MinistryMember {
    id: string;
    ministry_id: string;
    user_id: string;
    ministry_role: 'MEMBER' | 'LEADER';
    joined_at: string;
}

export interface UserSearchResult {
    id: string;
    name: string;
    email: string;
}

/**
 * Add a user to a ministry
 */
export async function addMemberToMinistry(
    ministryId: string,
    userId: string,
    role: 'MEMBER' | 'LEADER' = 'MEMBER'
): Promise<MinistryMember> {
    const { data, error } = await supabase
        .from('ministry_members')
        .insert({
            ministry_id: ministryId,
            user_id: userId,
            ministry_role: role,
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new Error('Este usuário já é membro do ministério.');
        }
        console.error('Error adding member:', error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Remove a member from a ministry
 */
export async function removeMemberFromMinistry(
    ministryId: string,
    userId: string
): Promise<void> {
    const { error } = await supabase
        .from('ministry_members')
        .delete()
        .eq('ministry_id', ministryId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error removing member:', error);
        throw new Error(error.message);
    }
}

/**
 * Update a member's role in a ministry
 */
export async function updateMemberRole(
    ministryId: string,
    userId: string,
    newRole: 'MEMBER' | 'LEADER'
): Promise<void> {
    const { error } = await supabase
        .from('ministry_members')
        .update({ ministry_role: newRole })
        .eq('ministry_id', ministryId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating member role:', error);
        throw new Error(error.message);
    }
}

/**
 * Search users by name or email
 */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
    if (!query || query.length < 2) {
        return [];
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

    if (error) {
        console.error('Error searching users:', error);
        throw new Error(error.message);
    }

    return data || [];
}

/**
 * Get members not in a specific ministry (for add member screen)
 */
export async function getUsersNotInMinistry(
    ministryId: string,
    searchQuery?: string
): Promise<UserSearchResult[]> {
    // First get users already in the ministry
    const { data: existingMembers, error: membersError } = await supabase
        .from('ministry_members')
        .select('user_id')
        .eq('ministry_id', ministryId);

    if (membersError) {
        console.error('Error fetching existing members:', membersError);
        throw new Error(membersError.message);
    }

    const existingUserIds = existingMembers?.map(m => m.user_id) || [];

    // Then get all users except those already in the ministry
    let query = supabase
        .from('profiles')
        .select('id, name, email');

    if (existingUserIds.length > 0) {
        query = query.not('id', 'in', `(${existingUserIds.join(',')})`);
    }

    if (searchQuery && searchQuery.length >= 2) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query.limit(20);

    if (error) {
        console.error('Error fetching users:', error);
        throw new Error(error.message);
    }

    return data || [];
}
