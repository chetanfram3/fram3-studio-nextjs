'use client';

import logger from '@/utils/logger';
import { useMutation, useQuery, useQueryClient, UseQueryResult, QueryOptions } from '@tanstack/react-query';
import {
    findTask,
    getTaskStatus,
    getUserTasks,
    retryTask,
    deleteTask,
    getQueueStats,
    getQueueInfo,
    type Task,
    type TaskResponse,
    type UserTasksResponse,
    type QueueStats,
    type QueueInfo,
    TaskProgressInfo,
    StageProgressInfo,
    resumeTask,
    ResumeTaskResponse,
} from '@/services/taskService';

// ===========================
// TYPE DEFINITIONS
// ===========================

/**
 * Query key factory for task-related queries
 */
const taskKeys = {
    all: ['tasks'] as const,
    lists: () => [...taskKeys.all, 'list'] as const,
    list: (filters: { userId: string; limit?: number; status?: string }) =>
        [...taskKeys.lists(), filters] as const,
    details: () => [...taskKeys.all, 'detail'] as const,
    detail: (taskId: string) => [...taskKeys.details(), taskId] as const,
    find: (params: { userId: string; scriptId: string; versionId: string }) =>
        [...taskKeys.all, 'find', params] as const,
    stats: () => [...taskKeys.all, 'stats'] as const,
    queueInfo: (queueName?: string) => [...taskKeys.all, 'queueInfo', queueName] as const,
};

/**
 * Options for task queries
 */
export interface UseTaskOptions {
    enabled?: boolean;
    refetchInterval?: number | false;
    onSettled?: (data: TaskResponse | undefined, error: Error | null) => void;
    onError?: (error: Error) => void;
}

/**
 * Extended query options for task queries
 */
type TaskQueryOptions = Omit<QueryOptions<TaskResponse, Error>, 'queryKey' | 'queryFn'> & {
    enabled?: boolean;
    refetchInterval?: number | false;
    onSuccess?: (data: TaskResponse) => void;
    onError?: (error: Error) => void;
};

/**
 * Extended query options for user tasks queries
 */
type UserTasksQueryOptions = Omit<QueryOptions<UserTasksResponse, Error>, 'queryKey' | 'queryFn'> & {
    enabled?: boolean;
    onSuccess?: (data: UserTasksResponse) => void;
    onError?: (error: Error) => void;
};

/**
 * Options for mutation hooks
 */
export interface UseMutationOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

/**
 * Enhanced error interface for credit-aware error handling
 */
export interface CreditAwareError extends Error {
    response?: {
        status: number;
        data: {
            error?: string;
            errorType?: string;
            message?: string;
            details?: {
                required?: number;
                available?: number;
                shortfall?: number;
                percentageAvailable?: string;
                recommendedPackage?: {
                    recommended: string;
                    reason: string;
                    price: number;
                    credits: number;
                    bonus: number;
                };
            };
            resumeContext?: Record<string, unknown>;
            note?: string;
        };
    };
}

/**
 * Options for resume task mutation
 */
export interface UseResumeTaskOptions {
    onSuccess?: (data: ResumeTaskResponse) => void;
    onError?: (error: CreditAwareError) => void;
}

/**
 * Options for retry task mutation
 */
export interface UseRetryTaskOptions {
    onSuccess?: () => void;
    onError?: (error: CreditAwareError) => void;
}

/**
 * Generic mutation result interface
 */
export interface MutationResult<T> {
    mutate: (id: string) => void;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    isSuccess: boolean;
    data?: T;
}

/**
 * Task error type for error handling
 */
type LocalTaskError = string | { message: string } | { error: string } | undefined;

// ===========================
// QUERY HOOKS
// ===========================

/**
 * Hook to find a task by user, script, and version IDs
 * @param userId - User identifier
 * @param scriptId - Script identifier
 * @param versionId - Version identifier
 * @param options - Query options
 * @returns Query result with task data
 */
export function useFindTask(
    userId: string,
    scriptId: string,
    versionId: string,
    options?: TaskQueryOptions
): UseQueryResult<TaskResponse, Error> {
    return useQuery({
        queryKey: taskKeys.find({ userId, scriptId, versionId }),
        queryFn: () => findTask(userId, scriptId, versionId),
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchInterval: (query) => {
            const taskStatus = query.state.data?.task?.status;
            logger.debug('Task status check', { taskStatus });

            // Stop polling for completed, failed, or paused tasks
            if (taskStatus === 'completed' || taskStatus === 'failed' || taskStatus === 'paused') {
                return false;
            }

            // Only continue polling for pending or active tasks
            if (taskStatus === 'pending' || taskStatus === 'active') {
                return options?.refetchInterval ?? 3000;
            }

            // Stop polling for any other unexpected status
            return false;
        },
        enabled: options?.enabled ?? true,
        onSuccess: options?.onSuccess,
        onError: options?.onError,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        ...options
    });
}

/**
 * Hook to get task status by task ID
 * @param taskId - Task identifier
 * @param options - Query options
 * @returns Query result with task status
 */
export function useTaskStatus(
    taskId: string,
    options?: TaskQueryOptions
): UseQueryResult<TaskResponse, Error> {
    return useQuery({
        queryKey: taskKeys.detail(taskId),
        queryFn: () => getTaskStatus(taskId),
        staleTime: 1000 * 30,
        refetchInterval: (query) => {
            // Early return if no data
            if (!query.state.data?.task) {
                return false;
            }

            // Strict status check
            const status = query.state.data.task.status;
            if (status === 'completed' || status === 'failed') {
                return false;
            }

            // Only continue polling for active/pending tasks
            if (status === 'active' || status === 'pending') {
                return options?.refetchInterval ?? 3000;
            }

            return false;
        },
        enabled: Boolean(taskId) && (options?.enabled ?? true),
        onSuccess: options?.onSuccess,
        onError: options?.onError,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        ...options
    });
}

/**
 * Hook to get user tasks with optional filtering
 * @param userId - User identifier
 * @param limit - Maximum number of tasks to return
 * @param status - Filter by task status
 * @param options - Query options
 * @returns Query result with user tasks
 */
export function useUserTasks(
    userId: string,
    limit?: number,
    status?: 'pending' | 'active' | 'completed' | 'failed',
    options?: UserTasksQueryOptions
): UseQueryResult<UserTasksResponse, Error> {
    return useQuery({
        queryKey: taskKeys.list({ userId, limit, status }),
        queryFn: () => getUserTasks(userId, limit, status),
        staleTime: 1000 * 60,
        enabled: options?.enabled ?? true,
        onSuccess: options?.onSuccess,
        onError: options?.onError,
        ...options
    });
}

/**
 * Hook to get queue statistics
 * @param options - Query options
 * @returns Query result with queue stats
 */
export function useQueueStats(options?: { enabled?: boolean }): UseQueryResult<{ stats: QueueStats }, Error> {
    return useQuery({
        queryKey: taskKeys.stats(),
        queryFn: () => getQueueStats(),
        staleTime: 1000 * 30,
        refetchInterval: 5000,
        enabled: options?.enabled ?? true,
        retry: 3,
    });
}

/**
 * Hook to get queue information
 * @param queueName - Optional queue name to filter
 * @param options - Query options
 * @returns Query result with queue info
 */
export function useQueueInfo(queueName?: string, options?: { enabled?: boolean }): UseQueryResult<QueueInfo, Error> {
    return useQuery({
        queryKey: taskKeys.queueInfo(queueName),
        queryFn: () => getQueueInfo(queueName),
        staleTime: 1000 * 30,
        refetchInterval: 10000, // Refresh every 10 seconds
        enabled: options?.enabled ?? true,
        retry: 3,
    });
}

// ===========================
// MUTATION HOOKS
// ===========================

/**
 * Hook to retry a failed task with conservative retry logic
 * @param options - Mutation options with callbacks
 * @returns Mutation result for retrying tasks
 */
export function useRetryTask(options?: UseRetryTaskOptions): MutationResult<{ message: string }> {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: retryTask,
        onSuccess: (_, taskId: string) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
            options?.onSuccess?.();
        },
        onError: (error: CreditAwareError, taskId: string) => {
            logger.error('Failed to retry task', {
                taskId,
                error: error.message
            });

            // Check if this is a credit error (403 status with credit error response)
            if (error.response?.status === 403 && error.response?.data?.errorType === 'credit_insufficient') {
                logger.warn('Credit insufficient error during task retry', {
                    taskId,
                    required: error.response.data.details?.required,
                    available: error.response.data.details?.available
                });
            }

            options?.onError?.(error);
        },
        // More conservative retry logic - only retry true network/server errors
        retry: (failureCount, error: CreditAwareError) => {
            // Never retry client errors (4xx) - these are usually permanent issues
            if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
                return false;
            }

            // Only retry server errors (5xx) and network errors, and only once
            if (error.response?.status && error.response.status >= 500) {
                return failureCount < 1; // Only 1 retry for server errors
            }

            // Retry network errors (no response) only once
            if (!error.response) {
                return failureCount < 1;
            }

            // Don't retry any other errors
            return false;
        },
        retryDelay: 2000, // Fixed 2-second delay for any retries
    });

    return {
        mutate: mutation.mutate,
        isLoading: mutation.isPending,
        isError: mutation.isError,
        error: mutation.error,
        isSuccess: mutation.isSuccess,
        data: mutation.data,
    };
}

/**
 * Hook to resume a paused task with NO automatic retries
 * @param options - Mutation options with callbacks
 * @returns Mutation result for resuming tasks
 */
export function useResumeTask(options?: UseResumeTaskOptions): MutationResult<ResumeTaskResponse> {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: resumeTask,
        onSuccess: (data: ResumeTaskResponse, taskId: string) => {
            // Check if the "successful" response is actually a credit error response
            // Some APIs return 200 with error data instead of proper HTTP error codes
            const responseData = data as unknown as Record<string, unknown>;
            if (responseData.errorType === 'credit_insufficient') {
                logger.warn('Credit error in resume task success handler', { taskId });
            }

            // Invalidate specific task queries
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });

            // Invalidate all find queries to refresh task status
            queryClient.invalidateQueries({
                queryKey: taskKeys.all,
                predicate: (query) => query.queryKey[1] === 'find'
            });

            logger.info('Task resume response processed successfully', { taskId });

            // Pass the response data to the callback
            if (options?.onSuccess) {
                options.onSuccess(data);
            }
        },
        onError: (error: CreditAwareError, taskId: string) => {
            logger.error('Failed to resume task', {
                taskId,
                error: error.message
            });

            // Enhanced credit error logging
            if (error.response?.status === 403 && error.response?.data?.errorType === 'credit_insufficient') {
                logger.warn('Credit insufficient error during task resume', {
                    taskId,
                    required: error.response.data.details?.required,
                    available: error.response.data.details?.available,
                    shortfall: error.response.data.details?.shortfall,
                });
            }

            options?.onError?.(error);
        },
        // CRITICAL: Disable ALL automatic retries for resume operations
        retry: false,
    });

    return {
        mutate: mutation.mutate,
        isLoading: mutation.isPending,
        isError: mutation.isError,
        error: mutation.error,
        isSuccess: mutation.isSuccess,
        data: mutation.data,
    };
}

/**
 * Hook to delete a task
 * @param options - Mutation options with callbacks
 * @returns Mutation result for deleting tasks
 */
export function useDeleteTask(options?: UseMutationOptions): MutationResult<{ message: string }> {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: deleteTask,
        onSuccess: (_, taskId: string) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
            options?.onSuccess?.();
        },
        onError: options?.onError,
        retry: 1,
    });

    return {
        mutate: mutation.mutate,
        isLoading: mutation.isPending,
        isError: mutation.isError,
        error: mutation.error,
        isSuccess: mutation.isSuccess,
        data: mutation.data,
    };
}

// ===========================
// HELPER HOOKS
// ===========================

/**
 * Hook to get task progress information
 * @param queryResult - Query result from useFindTask or useTaskStatus
 * @returns Enhanced task progress information
 */
export function useTaskProgress(queryResult: UseQueryResult<TaskResponse, Error>): TaskProgressInfo & {
    isPaused: boolean;
    canResume: boolean;
    pausedAnalyses?: string[];
} {
    const task = queryResult.data?.task;

    const isComplete = task?.status === 'completed';
    const isFailed = task?.status === 'failed';
    const isActive = task?.status === 'active';
    const isPending = task?.status === 'pending';
    const isPaused = task?.status === 'paused';

    const currentStage = task?.stages ?
        Object.values(task.stages).find(stage => !stage.completed) :
        undefined;

    /**
     * Convert various error formats to string
     */
    const getErrorString = (error: LocalTaskError): string | undefined => {
        if (!error) return undefined;
        if (typeof error === 'string') return error;
        if (typeof error === 'object' && 'message' in error) return error.message;
        if (typeof error === 'object' && 'error' in error) return error.error;
        return String(error);
    };

    return {
        isComplete,
        isFailed,
        isActive,
        isPending,
        isPaused,
        progress: task?.progress || 0,
        canRetry: isFailed,
        canResume: isPaused,
        pausedAnalyses: task?.pausedAnalyses || [],
        stages: task?.stages || {},
        currentStage,
        error: getErrorString(task?.error as LocalTaskError),
        attempts: task?.attempts || 0,
        isLoading: queryResult.isLoading,
        isError: queryResult.isError,
        queryError: queryResult.error,
        task,
        queueInfo: task?.queueInfo,
    };
}

/**
 * Hook to get stage progress information
 * @param stages - Task stages object
 * @returns Stage progress metrics
 */
export function useStageProgress(stages: Task['stages'] = {}): StageProgressInfo {
    const totalStages = Object.keys(stages).length;
    const completedStages = Object.values(stages).filter(stage => stage.completed).length;
    const currentStageNumber = Math.min(completedStages + 1, totalStages);

    return {
        totalStages,
        completedStages,
        currentStageNumber,
        progress: totalStages > 0 ? (completedStages / totalStages) * 100 : 0,
    };
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Check if an error is a credit-related error
 * @param error - Error object to check
 * @returns True if error is credit-related
 */
export function isCreditError(error: unknown): boolean {
    const creditError = error as CreditAwareError;
    return creditError?.response?.data?.errorType === 'credit_insufficient' ||
        (creditError?.response?.status === 403 && !!creditError?.response?.data?.details?.required);
}

/**
 * Extract credit error details from an error object
 * @param error - Credit-aware error object
 * @returns Credit error details or null
 */
export function getCreditErrorDetails(error: CreditAwareError) {
    if (!isCreditError(error)) return null;

    return {
        message: error.response?.data?.message || 'Insufficient credits',
        required: error.response?.data?.details?.required || 0,
        available: error.response?.data?.details?.available || 0,
        shortfall: error.response?.data?.details?.shortfall || 0,
        recommendedPackage: error.response?.data?.details?.recommendedPackage,
        context: error.response?.data?.resumeContext,
    };
}