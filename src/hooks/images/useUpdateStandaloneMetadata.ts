// src/hooks/useUpdateStandaloneMetadata.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth/useAuth';
import {
    updateStandaloneImageMetadata,
    validateMetadataUpdate,
} from '@/services/imageService';
import type {
    UpdateStandaloneMetadataRequest,
    UpdateStandaloneMetadataResponse,
} from '@/types/image/types';
import { standaloneImagesKeys } from './useStandaloneImages';
import logger from '@/utils/logger';

/**
 * Hook for updating standalone image metadata with TanStack Query
 * 
 * Benefits:
 * - Automatic cache invalidation
 * - Optimistic updates support
 * - Better error handling
 * - Request deduplication
 * 
 * @param options - Mutation options
 * @returns Mutation state and functions
 * 
 * @example
 * ```typescript
 * const { mutate, mutateAsync, isPending, isError, error } = useUpdateStandaloneMetadata({
 *   onSuccess: () => {
 *     console.log('Updated successfully!');
 *   },
 * });
 * 
 * // Use mutate for fire-and-forget
 * mutate({
 *   assetId: 'abc123',
 *   title: 'New Title',
 * });
 * 
 * // Use mutateAsync for awaiting result
 * const result = await mutateAsync({
 *   assetId: 'abc123',
 *   tags: ['tag1', 'tag2'],
 * });
 * ```
 */
export function useUpdateStandaloneMetadata(
    options?: {
        onSuccess?: (data: UpdateStandaloneMetadataResponse) => void;
        onError?: (error: Error) => void;
    }
) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            data: UpdateStandaloneMetadataRequest
        ): Promise<UpdateStandaloneMetadataResponse> => {
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Client-side validation
            const validation = validateMetadataUpdate(data);
            if (!validation.valid) {
                const errorMessage = validation.errors.join(', ');
                logger.warn('Metadata validation failed', { errors: validation.errors, data });
                throw new Error(errorMessage);
            }

            logger.info('Updating standalone image metadata', { assetId: data.assetId });

            const token = await user.getIdToken();
            const response = await updateStandaloneImageMetadata(data, token);

            logger.info('Successfully updated standalone image metadata', {
                assetId: data.assetId,
                updatedFields: response.data.updatedFields,
            });

            return response;
        },
        onSuccess: (data) => {
            // Invalidate all standalone images queries to refetch with updated data
            queryClient.invalidateQueries({
                queryKey: standaloneImagesKeys.lists()
            });

            logger.debug('Invalidated standalone images cache after update');

            // Call user's onSuccess callback
            options?.onSuccess?.(data);
        },
        onError: (error) => {
            logger.error('Error updating standalone image metadata', { error });

            // Call user's onError callback
            options?.onError?.(error as Error);
        },
    });
}