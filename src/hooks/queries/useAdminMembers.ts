import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberService } from '../../services/memberService';

// Query Keys
export const ADMIN_MEMBERS_QUERY_KEY = ['admin', 'members'];

// Hooks
export function useAllUsers() {
    return useQuery({
        queryKey: ADMIN_MEMBERS_QUERY_KEY,
        queryFn: memberService.listAllMembers,
    });
}

export function useUpdateGlobalRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, newRole }: { userId: string, newRole: 'MEMBER' | 'LEADER' | 'PASTOR' }) => {
            await memberService.updateMemberRole(userId, newRole);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_MEMBERS_QUERY_KEY });
        }
    });
}
