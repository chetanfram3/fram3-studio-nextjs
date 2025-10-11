'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPipelineStatus, type PipelineStatus } from '@/services/pipelineService';
import logger from '@/utils/logger';
import { useEffect } from 'react';

// ===========================
// TYPE DEFINITIONS
// ===========================

/**
 * Options for pipeline status hook
 */
interface UsePipelineStatusOptions {
  scriptId?: string;
  versionId?: string;
}

// ===========================
// MAIN HOOK
// ===========================

/**
 * Custom hook for fetching pipeline status
 * Monitors the current state and progress of pipeline execution
 * 
 * @param scriptId - Script identifier
 * @param versionId - Version identifier
 * @returns Query result with pipeline status
 * 
 * @example
 * ```tsx
 * const { data: status, isLoading } = usePipelineStatus(scriptId, versionId);
 * 
 * if (status) {
 *   console.log('Progress:', status.progress);
 * }
 * ```
 */
export function usePipelineStatus(scriptId?: string, versionId?: string) {
  const query = useQuery<PipelineStatus | null, Error>({
    queryKey: ['pipelineStatus', scriptId, versionId],
    queryFn: () => {
      if (!scriptId || !versionId) {
        logger.debug('Skipping pipeline status fetch - missing scriptId or versionId');
        return null;
      }
      logger.debug('Fetching pipeline status', { scriptId, versionId });
      return fetchPipelineStatus(scriptId, versionId);
    },
    enabled: !!scriptId && !!versionId,
    retry: 1,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 2, // 2 minutes
  });

  // Handle errors using useEffect (React Query v5 pattern)
  useEffect(() => {
    if (query.isError && query.error) {
      logger.error('Failed to load pipeline status:', query.error);
    }
  }, [query.isError, query.error]);

  return query;
}

// ===========================
// EXPORT TYPES
// ===========================

export type { UsePipelineStatusOptions };