import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchQuickUsageStats, QuickUsageStatsResponse } from '@/services/scriptService';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

/**
 * Custom hook to fetch quick usage statistics with optimized caching
 * and protection against user-specific data leaks
 * @param userId The user ID to fetch statistics for (optional - defaults to current user)
 * @returns The query result with data, loading state, error, and refetch function
 */
export function useQuickUsageStats(userId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currentUserId = user?.uid || 'unauthenticated';
  const targetUserId = userId || currentUserId;

  // Clear cache when user ID changes (login/logout)
  useEffect(() => {
    return () => {
      // This cleanup function will run when the component unmounts or when userId changes
      if (!user) {
        // Clear all quick usage stats queries when user logs out
        queryClient.invalidateQueries({ queryKey: ['quickUsageStats'] });
      }
    };
  }, [currentUserId, queryClient]);

  return useQuery<QuickUsageStatsResponse>({
    // Include userId in the queryKey to ensure each user has their own cache
    queryKey: ['quickUsageStats', targetUserId],
    queryFn: async () => {
      const response = await fetchQuickUsageStats({ userId: targetUserId });
      return response;
    },
    enabled: Boolean(targetUserId && targetUserId !== 'unauthenticated'),
    staleTime: 1000 * 60 * 2, // 2 minutes - usage stats should be relatively fresh
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes (shorter than dashboard analysis since usage stats change frequently)
    refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes to keep stats current
  });
}