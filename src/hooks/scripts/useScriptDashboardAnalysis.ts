import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchScriptDashboardAnalysis, fetchTokenAnalytics } from '@/services/scriptService';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

/**
 * Custom hook to fetch script dashboard analysis data with optimized caching
 * and protection against user-specific data leaks
 * Now supports token analytics endpoint
 * @param scriptId The ID of the script
 * @param versionId The version ID of the script
 * @param dashboardAnalysisType The type of analysis to fetch
 * @returns The query result with data, loading state, error, and refetch function
 */
export function useScriptDashboardAnalysis<T>(
  scriptId: string,
  versionId: string,
  dashboardAnalysisType: string
) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.uid || 'unauthenticated';

  // Clear cache when user ID changes (login/logout)
  useEffect(() => {
    return () => {
      // This cleanup function will run when the component unmounts or when userId changes
      if (!user) {
        // Clear all dashboard analysis queries when user logs out
        queryClient.invalidateQueries({ queryKey: ['scriptDashboardAnalysis'] });
        queryClient.invalidateQueries({ queryKey: ['tokenAnalytics'] });
      }
    };
  }, [userId, queryClient]);

  return useQuery<T>({
    // Include userId in the queryKey to ensure each user has their own cache
    queryKey: dashboardAnalysisType === 'tokenAnalytics'
      ? ['tokenAnalytics', userId, scriptId, versionId]
      : ['scriptDashboardAnalysis', userId, scriptId, versionId, dashboardAnalysisType],
    queryFn: async () => {
      if (dashboardAnalysisType === 'tokenAnalytics') {
        // Use the dedicated token analytics endpoint
        const response = await fetchTokenAnalytics({ scriptId, versionId });
        return response as T;
      } else {
        // Use the existing dashboard analysis endpoint
        const response = await fetchScriptDashboardAnalysis(scriptId, versionId, dashboardAnalysisType);
        return response.data as T;
      }
    },
    enabled: Boolean(scriptId && versionId && dashboardAnalysisType && userId !== 'unauthenticated'),
    staleTime: dashboardAnalysisType === 'tokenAnalytics' ? 1000 * 60 * 5 : 1000 * 60 * 2, // Analytics can be cached longer
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour (React Query v5 uses gcTime instead of cacheTime)
  });
}