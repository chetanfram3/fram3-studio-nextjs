'use client';

// hooks/useAPICallHistory.ts - FULLY INTEGRATED VERSION (TypeScript Fixed)
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAPICallHistory, APICallHistoryResponse, APICallHistoryParams } from '@/services/scriptService';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useMemo } from 'react';
import logger from '@/utils/logger';

// ===========================
// TYPE DEFINITIONS
// ===========================

/**
 * API Call Item interface for type safety
 */
interface APICallItem {
    usageCategory: 'credit_operation' | 'api' | 'llm';
    usageType: string;
    analysisType?: string;
    timestamp: string;
    credits: number;
    status?: string;
    [key: string]: unknown;
}

/**
 * Hook options interface
 */
interface UseAPICallHistoryOptions {
    enabled?: boolean;
    refetchOnMount?: boolean;
    refetchOnWindowFocus?: boolean;
}

/**
 * Filter input interface
 */
interface APICallHistoryFilters {
    usageCategory?: 'api' | 'llm' | 'credit_operation';
    status?: 'success' | 'failed' | 'partial';
    sort?: string;
    days?: number;
    limit?: number;
    page?: number;
}

// ===========================
// MAIN HOOK
// ===========================

/**
 * Custom hook to fetch API call history with pagination and filtering
 * @param params - Query parameters including pagination, filtering, and sorting
 * @param options - Additional query options
 * @returns Query result with API call history data and utility functions
 */
export function useAPICallHistory(
    params: Omit<APICallHistoryParams, 'userId'> & { userId?: string },
    options: UseAPICallHistoryOptions = {}
) {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const currentUserId = user?.uid || 'unauthenticated';
    const targetUserId = params.userId || currentUserId;

    // Memoize query parameters to ensure stable reference
    const queryParams: APICallHistoryParams = useMemo(() => ({
        userId: targetUserId,
        days: params.days || 30,
        page: params.page || 1,
        limit: params.limit || 10,
        usageCategory: params.usageCategory,
        status: params.status,
        sortBy: params.sortBy || 'timestamp',
        sortOrder: params.sortOrder || 'desc',
    }), [
        targetUserId,
        params.days,
        params.page,
        params.limit,
        params.usageCategory,
        params.status,
        params.sortBy,
        params.sortOrder
    ]);

    // Clear cache when user changes (on logout)
    useEffect(() => {
        return () => {
            if (!user) {
                logger.debug('User logged out, clearing API call history cache');
                queryClient.invalidateQueries({ queryKey: ['apiCallHistory'] });
            }
        };
    }, [currentUserId, queryClient, user]);

    // Main query
    const query = useQuery<APICallHistoryResponse>({
        // Include all parameters in queryKey for proper caching
        queryKey: [
            'apiCallHistory',
            queryParams.userId,
            queryParams.days,
            queryParams.page,
            queryParams.limit,
            queryParams.usageCategory,
            queryParams.status,
            queryParams.sortBy,
            queryParams.sortOrder
        ],
        queryFn: async () => {
            logger.debug('Fetching API call history', {
                userId: queryParams.userId,
                page: queryParams.page,
                limit: queryParams.limit
            });

            const response = await fetchAPICallHistory(queryParams);

            logger.debug('API call history fetched successfully', {
                totalItems: response.data.pagination.totalItems,
                currentPage: response.data.pagination.currentPage
            });

            return response;
        },
        enabled: options.enabled !== false && Boolean(targetUserId && targetUserId !== 'unauthenticated'),
        staleTime: 1000 * 60 * 1, // 1 minute
        retry: 2,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
        refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
        refetchOnMount: options.refetchOnMount ?? true,
        gcTime: 1000 * 60 * 15, // 15 minutes
    });

    // ===========================
    // UTILITY FUNCTIONS
    // ===========================

    /**
     * Get user-friendly service type name based on usage category and type
     */
    const getServiceType = (item: APICallItem): string => {
        // Handle credit operations first
        if (item.usageCategory === 'credit_operation') {
            switch (item.usageType) {
                case 'load': return 'Credit Load';
                case 'refund': return 'Credit Refund';
                case 'adjustment': return 'Credit Adjustment';
                default: return 'Credit Operation';
            }
        }

        // Handle API category
        if (item.usageCategory === 'api') {
            switch (item.usageType) {
                case 'image_generation':
                    // Check analysisType to determine what kind of image generation
                    if (item.analysisType === 'processScenesAndShots') {
                        return 'Scene Image Generation';
                    } else if (item.analysisType === 'processActorImages') {
                        return 'Actor Image Generation';
                    } else if (item.analysisType === 'processLocationImages') {
                        return 'Location Image Generation';
                    } else if (item.analysisType === 'keyVisualProcessor') {
                        return 'KeyVisual Image Generation';
                    }
                    return 'Image Generation';

                case 'video_generation':
                    return 'Video Processing';

                case 'audio_generation':
                    if (item.analysisType === 'audioProcessor') {
                        return 'Audio Generation';
                    }
                    return 'Audio Processing';

                case 'tts':
                    return 'Text-to-Speech';

                case 'image_edit':
                case 'image_upscale':
                    return 'Image Editing';

                case 'lipsync':
                    return 'Lip Sync';

                default:
                    return item.usageType;
            }
        }

        // Handle LLM category  
        if (item.usageCategory === 'llm') {
            // Handle multimodal image operations (Nano Banana)
            if (item.usageType === 'multimodal_image_generation') {
                if (item.analysisType === 'imageEditor') {
                    return 'Image Editing';
                }
                return 'Image Generation';
            }

            // Handle voice and audio mapping
            if (item.usageType === 'voiceMapper' || item.analysisType === 'voiceMapper') {
                return 'Voice Analysis & Mapping';
            }

            if (item.usageType === 'audioMapper' || item.analysisType === 'audioMapper') {
                return 'Audio & Ambient Noise Mapping';
            }

            // Handle prompt optimization
            if (item.usageType === 'imagePromptOptimiser' || item.analysisType === 'imagePromptOptimiser') {
                return 'Vision Prompt Refinery';
            }

            if (item.analysisType === 'imageAnalysis') {
                return 'Pixel Prompt Forge';
            }

            // Handle prompt generation
            if (item.usageType === 'promptGenerator' || item.analysisType === 'promptGenerator') {
                return 'Pre Image Visualisation';
            }

            // Handle script generation
            if (item.analysisType === 'scriptGenerator') {
                return 'Script Generation';
            }

            // Handle benchmarking
            if (item.analysisType === 'ratingOne') {
                return 'Benchmarking - I';
            }
            if (item.analysisType === 'ratingTwo') {
                return 'Benchmarking - II';
            }

            // Handle analysis types
            if (item.analysisType === 'emotionAnalysis') {
                return 'Emotion Assessment & Tuning';
            }
            if (item.analysisType === 'brandAnalysis') {
                return 'Product & Brand Assessment';
            }

            // Default LLM fallback
            return 'AI Analysis';
        }

        // Final fallback
        return item.usageCategory;
    };

    /**
     * Format timestamp to localized string
     */
    const formatTimestamp = (timestamp: string): string => {
        try {
            return new Date(timestamp).toLocaleString();
        } catch (error) {
            logger.warn('Invalid timestamp format:', timestamp);
            return timestamp;
        }
    };

    /**
     * Format credits with K/M suffix for large numbers
     */
    const formatCredits = (credits: number): string => {
        if (credits >= 1000000) {
            return `${(credits / 1000000).toFixed(1)}M`;
        } else if (credits >= 1000) {
            return `${(credits / 1000).toFixed(1)}K`;
        }
        return credits.toString();
    };

    /**
     * Refresh the current query
     */
    const refresh = () => {
        logger.debug('Manually refreshing API call history');
        return query.refetch();
    };

    // ===========================
    // RETURN INTERFACE
    // ===========================

    return {
        // Query state
        data: query.data,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
        isSuccess: query.isSuccess,

        // Data accessors with safe defaults
        summary: query.data?.data.summary,
        items: query.data?.data.items || [],
        pagination: query.data?.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: queryParams.limit || 10,
            hasNext: false,
            hasPrev: false,
        },
        filters: query.data?.data.filters,

        // Current parameters for reference
        currentParams: queryParams,

        // Utility functions
        getServiceType,
        formatTimestamp,
        formatCredits,
        refresh,

        // Query methods
        refetch: query.refetch,
    };
}

// ===========================
// HELPER HOOK FOR FILTERS
// ===========================

/**
 * Hook to manage API call history filters
 * Provides filter options and helper functions
 */
export function useAPICallHistoryFilters() {
    const usageCategoryOptions = [
        { value: 'api' as const, label: 'API Calls' },
        { value: 'llm' as const, label: 'LLM Analysis' },
        { value: 'credit_operation' as const, label: 'Credit Operations' },
    ];

    const statusOptions = [
        { value: 'success' as const, label: 'Success' },
        { value: 'failed' as const, label: 'Failed' },
        { value: 'partial' as const, label: 'Partial' },
    ];

    const sortOptions = [
        { value: 'timestamp-desc', label: 'Newest First', sortBy: 'timestamp' as const, sortOrder: 'desc' as const },
        { value: 'timestamp-asc', label: 'Oldest First', sortBy: 'timestamp' as const, sortOrder: 'asc' as const },
        { value: 'credits-desc', label: 'Highest Credits', sortBy: 'credits' as const, sortOrder: 'desc' as const },
        { value: 'credits-asc', label: 'Lowest Credits', sortBy: 'credits' as const, sortOrder: 'asc' as const },
    ];

    const daysOptions = [
        { value: 7, label: 'Last 7 days' },
        { value: 30, label: 'Last 30 days' },
        { value: 90, label: 'Last 90 days' },
        { value: 365, label: 'Last year' },
    ];

    const limitOptions = [
        { value: 10, label: '10 per page' },
        { value: 25, label: '25 per page' },
        { value: 50, label: '50 per page' },
        { value: 100, label: '100 per page' },
    ];

    return {
        usageCategoryOptions,
        statusOptions,
        sortOptions,
        daysOptions,
        limitOptions,

        /**
         * Build query params from filter selections with proper type safety
         */
        buildParams: (filters: APICallHistoryFilters): Partial<APICallHistoryParams> => {
            const sortOption = sortOptions.find(opt => opt.value === filters.sort);

            return {
                usageCategory: filters.usageCategory,
                status: filters.status,
                sortBy: sortOption?.sortBy ?? 'timestamp',
                sortOrder: sortOption?.sortOrder ?? 'desc',
                days: filters.days ?? 30,
                limit: filters.limit ?? 10,
                page: filters.page ?? 1,
            };
        },
    };
}

// ===========================
// EXPORT TYPES
// ===========================

export type { APICallItem, UseAPICallHistoryOptions, APICallHistoryFilters };