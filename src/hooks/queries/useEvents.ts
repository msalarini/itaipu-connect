import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../../services/eventService';
import { Event, EventRSVP } from '../../types';

export const EVENTS_QUERY_KEY = ['events'];
export const EVENT_DETAILS_QUERY_KEY = (id: string) => ['events', id];
export const EVENT_ATTENDEES_QUERY_KEY = (id: string) => ['events', id, 'attendees'];
export const USER_RSVP_QUERY_KEY = (eventId: string, userId: string) => ['events', eventId, 'rsvp', userId];

export function useEvents() {
    return useQuery({
        queryKey: EVENTS_QUERY_KEY,
        queryFn: eventService.listEvents,
    });
}

export function useEventAttendees(eventId: string) {
    return useQuery({
        queryKey: EVENT_ATTENDEES_QUERY_KEY(eventId),
        queryFn: () => eventService.getEventAttendees(eventId),
        enabled: !!eventId,
    });
}

export function useUserRSVP(eventId: string, userId?: string) {
    return useQuery({
        queryKey: USER_RSVP_QUERY_KEY(eventId, userId || ''),
        queryFn: () => eventService.getUserRSVP(eventId, userId!),
        enabled: !!eventId && !!userId,
    });
}

export function useRSVPMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ eventId, userId, status }: { eventId: string, userId: string, status: 'CONFIRMED' | 'DECLINED' }) => {
            return eventService.setRSVP(eventId, userId, status);
        },
        onSuccess: (data, variables) => {
            // Invalidate RSVP query
            queryClient.invalidateQueries({ queryKey: USER_RSVP_QUERY_KEY(variables.eventId, variables.userId) });
            // Invalidate attendees query
            queryClient.invalidateQueries({ queryKey: EVENT_ATTENDEES_QUERY_KEY(variables.eventId) });
        },
    });
}
