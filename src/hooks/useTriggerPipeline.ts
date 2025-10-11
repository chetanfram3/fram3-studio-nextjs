// src/hooks/useTriggerPipeline.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerPipeline } from '@/services/pipelineService';
import CustomToast from '@/components/common/CustomToast';

interface TriggerPipelineParams {
  scriptId: string;
  versionId: string;
}

export function useTriggerPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scriptId, versionId }: TriggerPipelineParams) => 
      triggerPipeline(scriptId, versionId),
    onSuccess: (data, variables) => {
      // Show toast notification
      if (data.message === "Pipeline execution started successfully.") {
        CustomToast("success", "Pipeline triggered successfully");
      } else {
        CustomToast("info", data.message);
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['pipelineStatus', variables.scriptId, variables.versionId] 
      });
      
      // Also invalidate task queries if you're using them
      queryClient.invalidateQueries({ 
        queryKey: ['task', variables.scriptId, variables.versionId] 
      });
    },
    onError: (error) => {
      CustomToast("error", "Failed to trigger pipeline");
      console.error("Error triggering pipeline:", error);
    }
  });
}