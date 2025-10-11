import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchScriptDetails } from '@/services/scriptService';

export function useScriptDetails(scriptId: string, versionId: string) {
  const queryClient = useQueryClient();

  const { 
    data: details,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['scriptDetails', scriptId, versionId],
    queryFn: () => fetchScriptDetails(scriptId, versionId),
    enabled: Boolean(scriptId && versionId),
    retry: 1
  });

  // Invalidate the query when returning from analysis
  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ['scriptDetails', scriptId, versionId] });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryClient, scriptId, versionId]);

  return {
    details,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch
  };
}