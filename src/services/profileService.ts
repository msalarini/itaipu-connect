import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

export const profileService = {
    /**
     * Get user profile by ID
     */
    async getProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }

        return data;
    },

    /**
     * Update user profile
     */
    async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            throw error;
        }

        return data;
    },

    /**
     * Delete own account
     */
    async deleteAccount(): Promise<void> {
        const { error } = await supabase.rpc('delete_own_account');

        if (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    }
};
