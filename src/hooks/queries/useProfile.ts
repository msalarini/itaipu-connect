import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../../services/profileService';
import { UserProfile } from '../../types';

export const PROFILE_QUERY_KEY = (userId: string) => ['profile', userId];

export function useProfile(userId?: string) {
    return useQuery({
        queryKey: PROFILE_QUERY_KEY(userId || ''),
        queryFn: () => profileService.getProfile(userId!),
        enabled: !!userId,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, updates }: { userId: string, updates: Partial<UserProfile> }) => {
            return profileService.updateProfile(userId, updates);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(variables.userId) });
            // Optionally update cache directly
            queryClient.setQueryData(PROFILE_QUERY_KEY(variables.userId), data);
        },
    });
}
