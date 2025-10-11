import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateScriptVersion } from '@/services/scriptService';

export function useScriptMutation() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updateScriptVersion,
    onSuccess: (_data, variables) => {
      // Invalidate and refetch the script details
      queryClient.invalidateQueries({ 
        queryKey: ['scriptDetails', variables.scriptId]
      });
    }
  });

  return {
    updateScript: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    error: updateMutation.error,
    reset: updateMutation.reset
  };
}