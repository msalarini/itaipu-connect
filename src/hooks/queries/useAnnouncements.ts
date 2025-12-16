import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementService } from '../../services/announcementService';
import { Announcement } from '../../types';

export const ANNOUNCEMENTS_QUERY_KEY = ['announcements'];

export function useAnnouncements(userMinistryIds: string[] = []) {
    return useQuery({
        queryKey: [...ANNOUNCEMENTS_QUERY_KEY, { ministryIds: userMinistryIds }],
        // Pass ministry IDs if we need client-side filtering or advanced query logic later
        queryFn: () => announcementService.listAnnouncements(userMinistryIds),
    });
}

export function useCreateAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: announcementService.createAnnouncement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_QUERY_KEY });
        },
    });
}
