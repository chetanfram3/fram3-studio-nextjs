import { useQuery } from '@tanstack/react-query';
import { fetchScriptAnalysis } from '@/services/scriptService';

export function useAnalysisData(scriptId: string, versionId: string, analysisType: string) {
  return useQuery({
    queryKey: ['scriptAnalysis', scriptId, versionId, analysisType],
    queryFn: () => fetchScriptAnalysis(scriptId, versionId, analysisType),
    enabled: Boolean(scriptId && versionId && analysisType)
  });
}