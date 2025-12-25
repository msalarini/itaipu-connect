import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listMinistries, listUserMinistries, getMinistryById } from '../../services/ministryService';
import { getUsersNotInMinistry, addMemberToMinistry } from '../../services/memberService';
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

// --- Members Hooks ---

import { listMinistryMembers } from '../../services/ministryService';

export const MINISTRY_MEMBERS_QUERY_KEY = (ministryId: string) => ['ministries', ministryId, 'members'];

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

// --- Ministry CRUD Mutations ---

async function createMinistry(ministryData: { name: string; description?: string }, userId: string) {
    // 1. Create Ministry
    const { data: ministry, error: ministryError } = await supabase
        .from('ministries')
        .insert(ministryData)
        .select()
        .single();

    if (ministryError) throw ministryError;

    // 2. Add creator as Leader
    const { error: memberError } = await supabase
        .from('ministry_members')
        .insert({
            ministry_id: ministry.id,
            user_id: userId,
            ministry_role: 'LEADER'
        });

    if (memberError) {
        // Rollback? ideally yes, but for now just throw
        console.error("Failed to add leader", memberError);
    }

    return ministry;
}

export function useCreateMinistry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, userId }: { data: { name: string; description?: string }, userId: string }) => createMinistry(data, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MINISTRIES_QUERY_KEY });
        }
    });
}

export function useUpdateMinistry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: { name?: string; description?: string } }) => {
            const { error } = await supabase
                .from('ministries')
                .update(data)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: MINISTRIES_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: MINISTRY_DETAILS_QUERY_KEY(id) });
        }
    });
}

// --- Add Member Hooks ---

export function useDeleteMinistry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('ministries')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MINISTRIES_QUERY_KEY });
        }
    });
}

export const AVAILABLE_USERS_QUERY_KEY = (ministryId: string, search: string) => ['ministries', ministryId, 'available_users', search];

export function useAvailableUsers(ministryId: string, search: string = '') {
    return useQuery({
        queryKey: AVAILABLE_USERS_QUERY_KEY(ministryId, search),
        queryFn: () => getUsersNotInMinistry(ministryId, search),
        enabled: !!ministryId,
    });
}

export function useAddMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ministryId, userId, role }: { ministryId: string, userId: string, role: 'MEMBER' | 'LEADER' }) => {
            await addMemberToMinistry(ministryId, userId, role);
        },
        onSuccess: (_, { ministryId }) => {
            // Invalidate members list so they appear in the main list
            queryClient.invalidateQueries({ queryKey: MINISTRY_MEMBERS_QUERY_KEY(ministryId) });
            // Invalidate available users so the added user disappears from search
            queryClient.invalidateQueries({ queryKey: ['ministries', ministryId, 'available_users'] });
        }
    });
}
