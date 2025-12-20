import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listInvites, createInvite, deleteInvite } from '../../services/inviteService';
import { Invite } from '../../types';

export const INVITES_QUERY_KEY = ['invites'];

export function useInvites() {
    return useQuery({
        queryKey: INVITES_QUERY_KEY,
        queryFn: listInvites,
    });
}

export function useCreateInvite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, userId }: { data: Parameters<typeof createInvite>[0], userId: string }) => createInvite(data, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INVITES_QUERY_KEY });
        },
    });
}

export function useDeleteInvite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteInvite,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INVITES_QUERY_KEY });
        },
    });
}

// --- Invite Validation ---

import { supabase } from '../../services/supabaseClient';

async function validateInvite(code: string) {
    const { data, error } = await supabase.rpc(
        'check_invite_code',
        { invite_code: code }
    );

    if (error) throw error;
    if (!data) throw new Error('Código de convite inválido ou expirado.');

    return data;
}

export function useValidateInvite() {
    return useMutation({
        mutationFn: validateInvite
    });
}
