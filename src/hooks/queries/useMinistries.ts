import { useQuery } from '@tanstack/react-query';
import { listMinistries, listUserMinistries, getMinistryById } from '../../services/ministryService';
import { Ministry } from '../../types';

export const MINISTRIES_QUERY_KEY = ['ministries'];
export const MINISTRY_DETAILS_QUERY_KEY = (id: string) => ['ministries', id];

export function useMinistries() {
    return useQuery({
        queryKey: MINISTRIES_QUERY_KEY,
        queryFn: listMinistries,
    });
}

export function useMinistryDetails(ministryId: string) {
    return useQuery({
        queryKey: MINISTRY_DETAILS_QUERY_KEY(ministryId),
        queryFn: () => getMinistryById(ministryId),
        enabled: !!ministryId,
    });
}

export function useMyMinistries(userId?: string) {
    return useQuery({
        queryKey: ['ministries', 'user', userId],
        queryFn: () => userId ? listUserMinistries(userId) : Promise.resolve([]),
        enabled: !!userId,
    });
}
