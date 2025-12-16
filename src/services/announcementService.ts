import { supabase } from './supabaseClient';
import { Announcement } from '../types';

export const announcementService = {
    /**
     * List all global announcements and announcements for user's ministries
     */
    async listAnnouncements(userMinistryIds: string[] = []) {
        let query = supabase
            .from('announcements')
            .select(`
                *,
                author:profiles(name),
                ministry:ministries(name)
            `)
            .order('created_at', { ascending: false });

        // Logic: Get global announcements OR announcements for ministries the user is in.
        // Note: RLS should handle this securely, but we can filter here too.
        // For MVP, if userMinistryIds is empty, we just get global.

        // Supabase OR syntax: is_global.eq.true,ministry_id.in.(...ids)
        // However, complex OR with varying types can be tricky. 
        // Let's rely on valid simple query or RLS.

        // Simplified approach for MVP: Get all visible announcements ensuring RLS policies are good.
        // Assuming RLS allows SELECT if is_global=true OR ministry_id IN (my_ministries)

        const { data, error } = await query;

        if (error) {
            console.error('Error listing announcements:', error);
            throw error;
        }

        return data as Announcement[];
    },

    /**
     * Create a new announcement
     */
    async createAnnouncement(data: {
        title: string,
        content: string,
        author_id: string,
        is_global: boolean,
        ministry_id?: string | null
    }) {
        const { data: userData, error } = await supabase
            .from('announcements')
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error('Error creating announcement:', error);
            throw error;
        }

        return userData as Announcement;
    }
};
