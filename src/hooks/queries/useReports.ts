import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';

export function useReportUser() {
    return useMutation({
        mutationFn: async ({ reporterId, reportedUserId, reason, details }: {
            reporterId: string,
            reportedUserId: string,
            reason: string,
            details?: string
        }) => {
            const { error } = await supabase
                .from('reports')
                .insert({
                    reporter_id: reporterId,
                    reported_user_id: reportedUserId,
                    reason,
                    details,
                    status: 'PENDING'
                });

            if (error) throw error;
        }
    });
}
