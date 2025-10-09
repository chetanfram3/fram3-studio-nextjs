// src/hooks/useProfileQuery.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserProfile } from '@/types/profile';
import { fetchUserProfile, updateUserProfile } from '@/services/profileService';
import { normalizeProfile } from '@/utils/profileHelpers';
import logger from '@/utils/logger';

export const PROFILE_QUERY_KEY = ['user', 'profile'];

/**
 * Hook to fetch user profile with TanStack Query caching
 */
export function useProfileQuery() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      logger.debug('Fetching user profile');
      const data = await fetchUserProfile();
      return normalizeProfile(data);
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });
}

/**
 * Hook to update user profile with optimistic updates
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      logger.debug('Updating user profile');
      await updateUserProfile(updates);
      
      // Fetch fresh data after update
      const data = await fetchUserProfile();
      return normalizeProfile(data);
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: PROFILE_QUERY_KEY });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<UserProfile>(PROFILE_QUERY_KEY);

      // Optimistically update to the new value
      if (previousProfile) {
        queryClient.setQueryData<UserProfile>(PROFILE_QUERY_KEY, (old) => {
          if (!old) return old;
          return { ...old, ...updates };
        });
      }

      return { previousProfile };
    },
    onError: (err, updates, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(PROFILE_QUERY_KEY, context.previousProfile);
      }
      logger.error('Profile update error:', err);
    },
    onSuccess: (data) => {
      // Update cache with fresh server data
      queryClient.setQueryData(PROFILE_QUERY_KEY, data);
      logger.debug('Profile updated successfully');
    },
  });
}

/**
 * Hook to invalidate and refetch profile
 */
export function useRefreshProfile() {
  const queryClient = useQueryClient();

  return () => {
    logger.debug('Invalidating profile cache');
    return queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
  };
}