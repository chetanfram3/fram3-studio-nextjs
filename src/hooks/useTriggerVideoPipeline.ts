'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import CustomToast from '@/components/common/CustomToast';
import logger from '@/utils/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ===========================
// TYPE DEFINITIONS
// ===========================

/**
 * Recommended package information
 */
interface RecommendedPackage {
  name: string;
  credits: number;
  price: number;
  [key: string]: unknown;
}

/**
 * Credit error details
 */
interface CreditErrorDetails {
  required?: number;
  available?: number;
  shortfall?: number;
  percentageAvailable?: string;
  recommendedPackage?: RecommendedPackage;
}

/**
 * Parameters for triggering video pipeline
 */
interface TriggerVideoPipelineParams {
  scriptId: string;
  versionId: string;
}

/**
 * Video pipeline response data
 */
interface VideoPipelineData {
  [key: string]: unknown;
}

/**
 * Video pipeline response interface
 */
interface VideoPipelineResponse {
  message: string;
  taskId: string;
  jobId: string;
  completedStandardAnalyses: string[];
  data?: VideoPipelineData;
  // Credit error properties
  error?: string;
  errorType?: string;
  details?: CreditErrorDetails;
  required?: number;
  available?: number;
  shortfall?: number;
  note?: string;
}

/**
 * Enhanced error type with response property
 */
interface EnhancedError extends Error {
  response?: {
    data: VideoPipelineResponse;
  };
}

/**
 * Video task data structure
 */
interface VideoTaskData {
  task: {
    id: string;
    status: string;
    progress: number;
    createdAt: string;
    updatedAt: string;
  };
  [key: string]: unknown;
}

// ===========================
// SERVICE FUNCTION
// ===========================

/**
 * Trigger video pipeline for a script version
 * @param params - Script ID and version ID
 * @returns Pipeline response with task information
 */
const triggerVideoPipeline = async (params: TriggerVideoPipelineParams): Promise<VideoPipelineResponse> => {
  const { scriptId, versionId } = params;

  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  logger.info('Triggering video pipeline', { scriptId, versionId });

  try {
    const response = await fetch(`${API_BASE_URL}/video/pipeline-queue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scriptId,
        versionId,
      })
    });

    if (!response.ok) {
      const error = await response.json();

      // Create enhanced error with response data for credit error handling
      const enhancedError = new Error(error.message || 'Failed to trigger video pipeline') as EnhancedError;
      enhancedError.response = { data: error };

      logger.error('Video pipeline trigger failed', error);
      throw enhancedError;
    }

    const data = await response.json();
    logger.info('Video pipeline triggered successfully', data);
    return data;
  } catch (error) {
    logger.error('Video pipeline trigger failed', error);
    throw error;
  }
};

// ===========================
// MAIN HOOK
// ===========================

/**
 * Hook for triggering video pipeline
 * Handles video generation queue submission and status updates
 * 
 * @returns Mutation object with trigger function and state
 * 
 * @example
 * ```tsx
 * const { mutate: triggerPipeline, isPending } = useTriggerVideoPipeline();
 * 
 * // Trigger pipeline
 * triggerPipeline({
 *   scriptId: 'script-123',
 *   versionId: 'version-456'
 * });
 * ```
 */
export const useTriggerVideoPipeline = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ scriptId, versionId }: TriggerVideoPipelineParams) =>
      triggerVideoPipeline({ scriptId, versionId }),
    onSuccess: (data, variables) => {
      logger.info('Video pipeline started successfully', data);

      // Show toast notification
      if (data.message === "Video pipeline execution queued successfully.") {
        CustomToast.success("Video pipeline triggered successfully");
      } else {
        CustomToast.info(data.message);
      }

      // Invalidate related queries to refresh task status
      queryClient.invalidateQueries({
        queryKey: ['videoTask', undefined, variables.scriptId, variables.versionId]
      });

      // Also invalidate video-specific task queries
      queryClient.invalidateQueries({
        queryKey: ['videoTask', variables.scriptId, variables.versionId]
      });

      // Invalidate pipeline status queries
      queryClient.invalidateQueries({
        queryKey: ['pipelineStatus', variables.scriptId, variables.versionId]
      });

      // Update query data with new task information
      queryClient.setQueryData<VideoTaskData>(
        ['videoTask', user?.uid, variables.scriptId, variables.versionId],
        (oldData) => ({
          ...oldData,
          task: {
            id: data.taskId,
            status: 'pending',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      );
    },
    onError: (error: EnhancedError) => {
      logger.error('Failed to trigger video pipeline', error);

      const errorMessage = error?.message || 'Failed to start video generation';

      // Don't show toast for credit errors - let the component handle it
      const errorData = error?.response?.data;
      const isCreditError = errorData?.errorType === "credit_insufficient" ||
        (errorData?.error && errorData?.details?.required && errorData?.details?.available);

      if (!isCreditError) {
        CustomToast.error(`Error: ${errorMessage}`);

        // Handle specific error cases
        if (errorMessage.includes('completed standard analyses')) {
          CustomToast.warning('Please complete the standard analysis pipeline first before generating videos.');
        } else if (errorMessage.includes('Pro subscription')) {
          CustomToast.warning('Video generation requires a Pro subscription or higher.');
        }
      } else {
        logger.info('Credit error detected - component will handle display', {
          errorType: errorData?.errorType,
          required: errorData?.details?.required,
          available: errorData?.details?.available
        });
      }
    }
  });
};

// ===========================
// EXPORT TYPES
// ===========================

export type {
  TriggerVideoPipelineParams,
  VideoPipelineResponse,
  EnhancedError,
  CreditErrorDetails,
  RecommendedPackage
};