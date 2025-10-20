// src/hooks/useStandaloneImages.ts

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth/useAuth';
import { listStandaloneImages } from '@/services/imageService';
import type {
    ListStandaloneImagesParams,
    ListStandaloneImagesResponse,
} from '@/types/image/types';
import logger from '@/utils/logger';

/**
 * Query key factory for standalone images
 */
export const standaloneImagesKeys = {
    all: ['standaloneImages'] as const,
    lists: () => [...standaloneImagesKeys.all, 'list'] as const,
    list: (filters: ListStandaloneImagesParams) =>
        [...standaloneImagesKeys.lists(), filters] as const,
};

/**
 * Hook for fetching standalone images with TanStack Query
 * 
 * Benefits:
 * - Automatic caching and background refetching
 * - Request deduplication
 * - Optimistic updates support
 * - Better loading and error states
 * - Automatic garbage collection
 * 
 * @param params - Query parameters for filtering and pagination
 * @param options - TanStack Query options
 * @returns Query result with data, loading, error states
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useStandaloneImages({
 *   page: 1,
 *   limit: 20,
 *   imageCategory: 'character',
 *   hasImage: true,
 * });
 * 
 * // Access data
 * const assets = data?.data.assets || [];
 * const pagination = data?.data.pagination;
 * const statistics = data?.data.statistics;
 * ```
 */
export function useStandaloneImages(
    params: ListStandaloneImagesParams = {},
    options?: {
        enabled?: boolean;
        refetchInterval?: number | false;
        onSuccess?: (data: ListStandaloneImagesResponse) => void;
        onError?: (error: Error) => void;
    }
) {
    const { user } = useAuth();

    return useQuery({
        queryKey: standaloneImagesKeys.list(params),
        queryFn: async () => {
            if (!user) {
                throw new Error('User not authenticated');
            }

            logger.info('Fetching standalone images', { params });

            const token = await user.getIdToken();
            const response = await listStandaloneImages(params, token);

            logger.info('Successfully fetched standalone images', {
                totalAssets: response.data.statistics.totalAssets,
                currentPage: response.data.pagination.currentPage,
            });

            return response;
        },
        enabled: !!user && (options?.enabled ?? true),
        staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        retry: 2,
        refetchOnWindowFocus: true, // Refresh when user returns to tab
        refetchOnMount: true, // Always refetch when component mounts
        ...options,
    });
}