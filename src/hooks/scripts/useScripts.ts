'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { fetchAllScripts } from '@/services/scriptService';
import type { ScriptsData } from '@/types/scripts';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useCallback } from 'react';
import logger from '@/utils/logger';

// ===========================
// TYPE DEFINITIONS
// ===========================

/**
 * Options for initializing the scripts hook
 */
interface ScriptHookOptions {
  initialPageSize?: number;
  initialPageNumber?: number;
  initialSortField?: string;
  initialSortOrder?: string;
  initialFilterTitle?: string | null;
  initialIsFavourite?: boolean;
}

/**
 * Return type for useScripts hook
 */
interface UseScriptsReturn {
  scripts: ScriptsData['scripts'];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  sortField: string;
  sortOrder: string;
  isFavourite: boolean;
  allCount: number;
  pageSize: number;
  pageNumber: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
  updateQueryParams: (newParams: Record<string, string | number | boolean | null>) => void;
}

// ===========================
// MAIN HOOK
// ===========================

/**
 * Custom hook for managing scripts with pagination, sorting, and filtering
 * Syncs state with URL query parameters for shareable URLs
 * 
 * @param options - Optional initial values for pagination and filtering
 * @returns Scripts data, loading state, and control functions
 * 
 * @example
 * ```tsx
 * const {
 *   scripts,
 *   isLoading,
 *   updateQueryParams
 * } = useScripts({
 *   initialPageSize: 10,
 *   initialSortField: 'title'
 * });
 * 
 * // Update pagination
 * updateQueryParams({ pageNumber: 2 });
 * ```
 */
export function useScripts(options?: ScriptHookOptions): UseScriptsReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.uid || 'unauthenticated';

  // ===========================
  // CACHE CLEANUP
  // ===========================

  /**
   * Clear scripts cache when user logs out
   */
  useEffect(() => {
    return () => {
      if (!user) {
        logger.debug('User logged out, clearing scripts cache');
        queryClient.invalidateQueries({ queryKey: ['scripts'] });
      }
    };
  }, [userId, queryClient, user]);

  // ===========================
  // QUERY PARAMETERS PARSING
  // ===========================

  /**
   * Parse query parameters from URL with fallbacks to options or defaults
   */
  const pageSize = Number(searchParams.get("pageSize")) || options?.initialPageSize || 4;
  const pageNumber = Number(searchParams.get("pageNumber")) || options?.initialPageNumber || 1;
  const sortField = searchParams.get("sortField") || options?.initialSortField || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || options?.initialSortOrder || "desc";
  const filterTitle = searchParams.get("filterTitle") || options?.initialFilterTitle || null;
  const isFavourite = searchParams.get("isFavourite") === "true" ||
    (searchParams.get("isFavourite") === null && options?.initialIsFavourite === true);

  // ===========================
  // URL UPDATE FUNCTION
  // ===========================

  /**
   * Update query parameters in the URL
   * Preserves existing params and only updates/removes specified ones
   * 
   * @param newParams - Object with parameter key-value pairs to update
   */
  const updateQueryParams = useCallback((
    newParams: Record<string, string | number | boolean | null>
  ) => {
    logger.debug('Updating query parameters', newParams);

    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        current.set(key, String(value));
      } else {
        current.delete(key);
      }
    });

    const search = current.toString();
    const query = search ? `?${search}` : '';

    router.push(`${pathname}${query}`, { scroll: false });
  }, [searchParams, pathname, router]);

  // ===========================
  // SCRIPTS QUERY
  // ===========================

  /**
   * Fetch scripts with current parameters
   */
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery<ScriptsData>({
    // Include userId in queryKey to ensure proper cache segmentation between users
    queryKey: ['scripts', userId, pageSize, pageNumber, sortField, sortOrder, filterTitle, isFavourite],
    queryFn: async () => {
      logger.debug('Fetching scripts', {
        userId,
        pageSize,
        pageNumber,
        sortField,
        sortOrder,
        filterTitle,
        isFavourite
      });

      const response = await fetchAllScripts({
        pageSize,
        pageNumber,
        sortField,
        sortOrder,
        filterTitle,
        isFavourite,
      });

      logger.debug('Scripts fetched successfully', {
        count: response.data.scripts.length,
        totalCount: response.data.pagination.totalCount
      });

      return response.data;
    },
    // Only enable the query if there's a valid userId
    enabled: userId !== 'unauthenticated',
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnMount: true, // Ensure data is fresh on mount
  });

  // ===========================
  // RETURN INTERFACE
  // ===========================

  return {
    // Scripts data
    scripts: data?.scripts || [],
    totalCount: data?.pagination?.totalCount || 0,
    totalPages: data?.pagination?.totalPages || 0,
    currentPage: data?.pagination?.currentPage || 1,
    sortField: data?.pagination?.sortField || sortField,
    sortOrder: data?.pagination?.sortOrder || sortOrder,
    isFavourite: data?.pagination?.isFavourite || isFavourite,
    allCount: data?.pagination?.allCount || 0,

    // Current parameters
    pageSize,
    pageNumber,

    // Query state
    isLoading,
    error: error instanceof Error ? error.message : null,

    // Actions
    refetch,
    updateQueryParams,
  };
}

// ===========================
// EXPORT TYPES
// ===========================

export type { ScriptHookOptions, UseScriptsReturn };