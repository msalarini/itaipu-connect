import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// --- Members Hooks ---

import { supabase } from '../../services/supabaseClient';

export const MINISTRY_MEMBERS_QUERY_KEY = (ministryId: string) => ['ministries', ministryId, 'members'];

async function listMinistryMembers(ministryId: string) {
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
        .eq('ministry_id', ministryId)
        .order('ministry_role', { ascending: true }); // LEADER implies 'L', MEMBER implies 'M' -> Leader first if ascending? Yes L < M.

    if (error) throw error;

    // Supabase might return profile as an array for the join, flatten it to object
    return data.map((m: any) => ({
        ...m,
        profile: Array.isArray(m.profile) ? m.profile[0] : m.profile
    }));
}

export function useMinistryMembers(ministryId: string) {
    return useQuery({
        queryKey: MINISTRY_MEMBERS_QUERY_KEY(ministryId),
        queryFn: () => listMinistryMembers(ministryId),
        enabled: !!ministryId,
    });
}

export function useUpdateMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ministryId, userId, newRole }: { ministryId: string, userId: string, newRole: 'MEMBER' | 'LEADER' }) => {
            const { error } = await supabase
                .from('ministry_members')
                .update({ ministry_role: newRole })
                .eq('ministry_id', ministryId)
                .eq('user_id', userId);

            if (error) throw error;
        },
        onSuccess: (_, { ministryId }) => {
            queryClient.invalidateQueries({ queryKey: MINISTRY_MEMBERS_QUERY_KEY(ministryId) });
        }
    });
}

export function useRemoveMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ministryId, userId }: { ministryId: string, userId: string }) => {
            const { error } = await supabase
                .from('ministry_members')
                .delete()
                .eq('ministry_id', ministryId)
                .eq('user_id', userId);

            if (error) throw error;
        },
        onSuccess: (_, { ministryId }) => {
            queryClient.invalidateQueries({ queryKey: MINISTRY_MEMBERS_QUERY_KEY(ministryId) });
        }
    });
}
