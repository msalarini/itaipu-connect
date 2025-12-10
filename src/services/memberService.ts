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
};
