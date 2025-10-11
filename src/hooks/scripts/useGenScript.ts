// hooks/useGenScript.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchGeneratedScript,
    fetchGeneratedScriptDetails,
    updateGeneratedScript,
    analyzeGeneratedScript,
    GeneratedScriptData,
    GeneratedScriptDetailsData,
    UpdateGeneratedScriptParams,
    AnalyzeGeneratedScriptParams
} from '@/services/scriptService';

/**
 * Hook to fetch generated script with versions
 */
export function useGeneratedScript(genScriptId: string | undefined) {
    return useQuery<GeneratedScriptData>({
        queryKey: ['generatedScript', genScriptId],
        queryFn: () => fetchGeneratedScript(genScriptId!),
        enabled: Boolean(genScriptId),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to fetch generated script details (input/output data)
 */
export function useGeneratedScriptDetails(genScriptId: string | undefined) {
    return useQuery<GeneratedScriptDetailsData>({
        queryKey: ['generatedScriptDetails', genScriptId],
        queryFn: () => fetchGeneratedScriptDetails(genScriptId!),
        enabled: Boolean(genScriptId),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to update generated script
 */
export function useUpdateGeneratedScript() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: UpdateGeneratedScriptParams) => updateGeneratedScript(params),
        onSuccess: (data, variables) => {
            // Invalidate and refetch the generated script data
            queryClient.invalidateQueries({
                queryKey: ['generatedScript', variables.genScriptId]
            });
            queryClient.invalidateQueries({
                queryKey: ['generatedScriptDetails', variables.genScriptId]
            });
        },
    });
}

/**
 * Hook to trigger analysis for generated script
 */
export function useAnalyzeGeneratedScript() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: AnalyzeGeneratedScriptParams) => analyzeGeneratedScript(params),
        onSuccess: (data, variables) => {
            // Invalidate the generated script to reflect analysis status
            queryClient.invalidateQueries({
                queryKey: ['generatedScript', variables.genScriptId]
            });
        },
    });
}

/**
 * Combined hook for all generated script operations
 */
export function useGenScript(genScriptId: string | undefined) {
    const scriptQuery = useGeneratedScript(genScriptId);
    const detailsQuery = useGeneratedScriptDetails(genScriptId);
    const updateMutation = useUpdateGeneratedScript();
    const analyzeMutation = useAnalyzeGeneratedScript();

    return {
        // Queries
        script: scriptQuery.data,
        scriptLoading: scriptQuery.isLoading,
        scriptError: scriptQuery.error,
        details: detailsQuery.data,
        detailsLoading: detailsQuery.isLoading,
        detailsError: detailsQuery.error,

        // Mutations
        updateScript: updateMutation.mutate,
        updateScriptAsync: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        analyzeScript: analyzeMutation.mutate,
        analyzeScriptAsync: analyzeMutation.mutateAsync,
        isAnalyzing: analyzeMutation.isPending,

        // Refetch functions
        refetchScript: scriptQuery.refetch,
        refetchDetails: detailsQuery.refetch,
    };
}