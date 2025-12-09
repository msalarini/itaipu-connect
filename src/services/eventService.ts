import { supabase } from './supabaseClient';

export interface EventRSVP {
    id: string;
    event_id: string;
    user_id: string;
    status: 'CONFIRMED' | 'DECLINED';
    created_at: string;
    profile?: {
        name: string;
        email: string;
    };
}

export const eventService = {
    /**
     * Get list of confirmed attendees for an event
     */
    async getEventAttendees(eventId: string) {
        const { data, error } = await supabase
            .from('event_rsvps')
            .select(`
                *,
                profile:profiles(name, email)
            `)
            .eq('event_id', eventId)
            .eq('status', 'CONFIRMED');

        if (error) {
            console.error('Error fetching attendees:', error);
            throw error;
        }

        return data as EventRSVP[];
    },

    /**
     * Get user's RSVP status for a specific event
     */
    async getUserRSVP(eventId: string, userId: string) {
        const { data, error } = await supabase
            .from('event_rsvps')
            .select('*')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned"
            console.error('Error fetching user RSVP:', error);
            throw error;
        }

        return data as EventRSVP | null;
    },

    /**
     * Upsert RSVP status (Create or Update)
     */
    async setRSVP(eventId: string, userId: string, status: 'CONFIRMED' | 'DECLINED') {
        const { data, error } = await supabase
            .from('event_rsvps')
            .upsert({
                event_id: eventId,
                user_id: userId,
                status: status,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'event_id,user_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Error setting RSVP:', error);
            throw error;
        }

        return data;
    },

    /**
     * Delete user's RSVP
     */
    async removeRSVP(eventId: string, userId: string) {
        const { error } = await supabase
            .from('event_rsvps')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error removing RSVP:', error);
            throw error;
        }
    }
};
