'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPipelineConfiguration, type PipelineConfig } from '@/services/pipelineService';
import { PIPELINE_STAGES as FALLBACK_STAGES } from '@/config/analysisTypes';
import logger from '@/utils/logger';
import { useEffect } from 'react';

/**
 * Custom hook for fetching pipeline configuration
 * Provides fallback configuration if fetch fails
 */
export function usePipelineConfig(executionSubscription?: string) {
  const query = useQuery<PipelineConfig, Error>({
    queryKey: ['pipelineConfig', executionSubscription],
    queryFn: () => {
      logger.debug('Fetching pipeline configuration', { executionSubscription });
      return fetchPipelineConfiguration(executionSubscription);
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    placeholderData: {
      stages: JSON.parse(JSON.stringify(FALLBACK_STAGES)) as PipelineConfig['stages'],
      processingTypes: {},
      subscription: executionSubscription
    }
  });

  // Handle errors
  useEffect(() => {
    if (query.isError && query.error) {
      logger.error('Failed to load pipeline configuration:', query.error);
    }
  }, [query.isError, query.error]);

  return query;
}