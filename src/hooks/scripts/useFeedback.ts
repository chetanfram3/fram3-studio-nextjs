'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  submitFeedback,
  getFeedbackStats,
  deleteTabFeedback,
  SubmitFeedbackParams,
  FeedbackStatsParams,
  DeleteTabFeedbackParams,
  FeedbackStatus,
  FeedbackData
} from '@/services/scriptService';
import { useAuthStore } from '@/store/authStore';
import CustomToast from '@/components/common/CustomToast';
import logger from '@/utils/logger';

// ===========================
// TYPE DEFINITIONS
// ===========================

/**
 * Valid feedback page types
 */
type FeedbackPage = 'overview' | 'market' | 'visuals' | 'editor';

/**
 * Hook return type
 */
interface UseFeedbackReturn {
  // Status
  feedbackStatus: FeedbackStatus | undefined;
  isLoading: boolean;
  error: Error | null;

  // Queries
  usePageFeedback: (page: FeedbackPage) => ReturnType<typeof useQuery>;
  useTabFeedback: (page: FeedbackPage, tab: string) => ReturnType<typeof useQuery>;
  refetchStatus: () => Promise<unknown>;

  // Mutations
  submitFeedback: (params: Omit<SubmitFeedbackParams, 'scriptId' | 'versionId'>) => void;
  submitFeedbackAsync: (params: Omit<SubmitFeedbackParams, 'scriptId' | 'versionId'>) => Promise<unknown>;
  isSubmitting: boolean;

  deleteTabFeedback: (params: Omit<DeleteTabFeedbackParams, 'scriptId' | 'versionId'>) => void;
  deleteTabFeedbackAsync: (params: Omit<DeleteTabFeedbackParams, 'scriptId' | 'versionId'>) => Promise<unknown>;
  isDeleting: boolean;

  // Helpers
  prepareUploads: (files: File[]) => Promise<FeedbackData['uploads']>;
  extractTags: (comment: string) => string[];

  // Computed values
  overallProgress: FeedbackStatus['overallProgress'] | undefined;
  nextTab: FeedbackStatus['nextTab'] | undefined;
  hasFeedback: boolean;
  isComplete: boolean;
}

// ===========================
// MAIN HOOK
// ===========================

/**
 * Custom hook for managing feedback operations
 * Handles feedback submission, retrieval, and deletion
 * 
 * @param scriptId - Script identifier
 * @param versionId - Version identifier
 * @returns Feedback operations and status
 * 
 * @example
 * ```tsx
 * const {
 *   feedbackStatus,
 *   submitFeedback,
 *   usePageFeedback
 * } = useFeedback(scriptId, versionId);
 * 
 * // Submit feedback
 * submitFeedback({
 *   page: 'overview',
 *   tab: 'summary',
 *   status: 'approved',
 *   data: { comment: 'Looks good!' }
 * });
 * ```
 */
export function useFeedback(scriptId: string, versionId: string): UseFeedbackReturn {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.uid;

  // ===========================
  // QUERY KEY FACTORY
  // ===========================

  const feedbackKeys = {
    all: ['feedback'] as const,
    status: (scriptId: string, versionId: string) =>
      ['feedback', 'status', userId, scriptId, versionId] as const,
    page: (scriptId: string, versionId: string, page: string) =>
      ['feedback', 'page', userId, scriptId, versionId, page] as const,
    tab: (scriptId: string, versionId: string, page: string, tab: string) =>
      ['feedback', 'tab', userId, scriptId, versionId, page, tab] as const,
  };

  // ===========================
  // QUERIES
  // ===========================

  /**
   * Get overall feedback status for the script version
   */
  const feedbackStatusQuery = useQuery({
    queryKey: feedbackKeys.status(scriptId, versionId),
    queryFn: async () => {
      logger.debug('Fetching feedback status', { scriptId, versionId, userId });
      const response = await getFeedbackStats({ scriptId, versionId });
      logger.debug('Feedback status fetched successfully');
      return response;
    },
    enabled: Boolean(scriptId && versionId && userId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  /**
   * Get page-specific feedback
   * @param page - The feedback page to query
   */
  const usePageFeedback = (page: FeedbackPage) => {
    return useQuery({
      queryKey: feedbackKeys.page(scriptId, versionId, page),
      queryFn: async () => {
        logger.debug('Fetching page feedback', { scriptId, versionId, page });
        const response = await getFeedbackStats({ scriptId, versionId, page });
        return response;
      },
      enabled: Boolean(scriptId && versionId && userId && page),
      staleTime: 1000 * 60 * 2,
    });
  };

  /**
   * Get tab-specific feedback
   * @param page - The feedback page
   * @param tab - The specific tab within the page
   */
  const useTabFeedback = (page: FeedbackPage, tab: string) => {
    return useQuery({
      queryKey: feedbackKeys.tab(scriptId, versionId, page, tab),
      queryFn: async () => {
        logger.debug('Fetching tab feedback', { scriptId, versionId, page, tab });
        const response = await getFeedbackStats({
          scriptId,
          versionId,
          page: page as FeedbackPage, // Type assertion to fix the error
          tab
        });
        return response;
      },
      enabled: Boolean(scriptId && versionId && userId && page && tab),
      staleTime: 1000 * 60 * 2,
    });
  };

  // ===========================
  // MUTATIONS
  // ===========================

  /**
   * Submit feedback mutation
   */
  const submitFeedbackMutation = useMutation({
    mutationFn: (params: Omit<SubmitFeedbackParams, 'scriptId' | 'versionId'>) => {
      logger.info('Submitting feedback', {
        scriptId,
        versionId,
        page: params.page,
        tab: params.tab
      });
      return submitFeedback({ ...params, scriptId, versionId });
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: feedbackKeys.status(scriptId, versionId) });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.page(scriptId, versionId, variables.page) });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.tab(scriptId, versionId, variables.page, variables.tab) });

      logger.info('Feedback submitted successfully', {
        scriptId,
        versionId,
        page: variables.page,
        tab: variables.tab
      });

      // Show success message
      CustomToast.success(data.message || 'Feedback saved successfully');

      // If final submission was successful
      if (data.data.finalSubmissionResult?.success) {
        CustomToast.success('All feedback submitted successfully!');
      }
    },
    onError: (error: Error, variables) => {
      logger.error('Failed to submit feedback', {
        scriptId,
        versionId,
        page: variables.page,
        tab: variables.tab,
        error: error.message
      });
      CustomToast.error(error.message || 'Failed to submit feedback');
    },
  });

  /**
   * Delete tab feedback mutation
   */
  const deleteTabFeedbackMutation = useMutation({
    mutationFn: (params: Omit<DeleteTabFeedbackParams, 'scriptId' | 'versionId'>) => {
      logger.info('Deleting tab feedback', {
        scriptId,
        versionId,
        page: params.page,
        tab: params.tab
      });
      return deleteTabFeedback({ ...params, scriptId, versionId });
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: feedbackKeys.status(scriptId, versionId) });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.page(scriptId, versionId, variables.page) });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.tab(scriptId, versionId, variables.page, variables.tab) });

      logger.info('Tab feedback deleted successfully', {
        scriptId,
        versionId,
        page: variables.page,
        tab: variables.tab
      });

      CustomToast.success(data.message || 'Feedback deleted successfully');
    },
    onError: (error: Error, variables) => {
      logger.error('Failed to delete tab feedback', {
        scriptId,
        versionId,
        page: variables.page,
        tab: variables.tab,
        error: error.message
      });
      CustomToast.error(error.message || 'Failed to delete feedback');
    },
  });

  // ===========================
  // HELPER FUNCTIONS
  // ===========================

  /**
   * Prepare file uploads by converting to base64
   * @param files - Array of files to upload
   * @returns Promise resolving to upload data array
   */
  const prepareUploads = async (files: File[]): Promise<FeedbackData['uploads']> => {
    logger.debug('Preparing file uploads', { fileCount: files.length });

    const uploads = await Promise.all(
      files.map(async (file) => {
        try {
          const base64 = await fileToBase64(file);
          return {
            fileId: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileUrl: base64,
          };
        } catch (error) {
          logger.error('Failed to convert file to base64', {
            fileName: file.name,
            error
          });
          throw error;
        }
      })
    );

    logger.debug('Files prepared successfully', { uploadCount: uploads.length });
    return uploads;
  };

  /**
   * Convert file to base64 string
   * @param file - File to convert
   * @returns Promise resolving to base64 string
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => {
        logger.error('FileReader error', { fileName: file.name, error });
        reject(error);
      };
    });
  };

  /**
   * Extract tags from comment text
   * Supports @mentions, #hashtags, and /categories
   * @param comment - Comment text to extract tags from
   * @returns Array of unique tags
   */
  const extractTags = (comment: string): string[] => {
    const tags: string[] = [];

    // Extract @mentions
    const mentions = comment.match(/@\w+/g) || [];
    tags.push(...mentions);

    // Extract #hashtags
    const hashtags = comment.match(/#\w+/g) || [];
    tags.push(...hashtags);

    // Extract /categories
    const categories = comment.match(/\/\w+/g) || [];
    tags.push(...categories);

    return [...new Set(tags)]; // Remove duplicates
  };

  // ===========================
  // COMPUTED VALUES
  // ===========================

  const feedbackStatus = feedbackStatusQuery.data?.data as FeedbackStatus | undefined;
  const isLoading = feedbackStatusQuery.isLoading;
  const error = feedbackStatusQuery.error;

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    // Status
    feedbackStatus,
    isLoading,
    error,

    // Queries
    usePageFeedback,
    useTabFeedback,
    refetchStatus: feedbackStatusQuery.refetch,

    // Mutations
    submitFeedback: submitFeedbackMutation.mutate,
    submitFeedbackAsync: submitFeedbackMutation.mutateAsync,
    isSubmitting: submitFeedbackMutation.isPending,

    deleteTabFeedback: deleteTabFeedbackMutation.mutate,
    deleteTabFeedbackAsync: deleteTabFeedbackMutation.mutateAsync,
    isDeleting: deleteTabFeedbackMutation.isPending,

    // Helpers
    prepareUploads,
    extractTags,

    // Computed values
    overallProgress: feedbackStatus?.overallProgress,
    nextTab: feedbackStatus?.nextTab,
    hasFeedback: feedbackStatus?.exists || false,
    isComplete: feedbackStatus?.overallProgress?.status === 'completed',
  };
}

// ===========================
// EXPORT TYPES
// ===========================

export type { FeedbackStatus, FeedbackData } from '@/services/scriptService';
export type { FeedbackPage, UseFeedbackReturn };