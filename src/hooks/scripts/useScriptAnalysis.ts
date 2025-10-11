import { useQuery } from '@tanstack/react-query';
import { fetchScriptAnalysis } from '@/services/scriptService';

export function useScriptAnalysis(scriptId: string, versionId: string, analysisType: string) {
  return useQuery({
    queryKey: ['scriptAnalysis', scriptId, versionId, analysisType],
    queryFn: async () => {
      const response = await fetchScriptAnalysis(scriptId, versionId, analysisType);
      // Return the first analysis result directly
      return response.analyses?.[0] || null;
    },
    enabled: Boolean(scriptId && versionId && analysisType),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 1
  });
}