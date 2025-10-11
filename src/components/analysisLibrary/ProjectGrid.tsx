// src/components/analysisLibrary/ProjectGrid.tsx
"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  Suspense,
  startTransition,
} from "react";
import { Box, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useScripts } from "@/hooks/scripts/useScripts";
import { GridList } from "./GridList";
import { GridNavigation } from "./GridNavigation";
import { Pagination } from "./Pagination";
import type { Script } from "@/types/scripts";
import { useAuthStore } from "@/store/authStore";
import CustomToast from "@/components/common/CustomToast";
import logger from "@/utils/logger";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface ProjectGridProps {
  selectedScript: Script | null;
  onScriptSelect: (script: Script | null) => void;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  sortField: string;
  sortOrder: string;
  isFavourite: boolean;
}

interface UserPreferences {
  pageSize?: number;
  sortField?: string;
  sortOrder?: string;
  isFavourite?: boolean;
}

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Get saved preferences from localStorage
 * Only runs on client-side
 */
const getSavedPreferences = (): Record<string, unknown> | null => {
  if (typeof window === "undefined") return null;

  try {
    const savedPrefs = localStorage.getItem("scriptGridPreferences");
    return savedPrefs ? JSON.parse(savedPrefs) : null;
  } catch (error) {
    logger.error("Error reading preferences from localStorage:", error);
    return null;
  }
};

/**
 * Save preferences to localStorage
 * Only runs on client-side
 */
const savePreferences = (prefs: UserPreferences): void => {
  if (typeof window === "undefined") return;

  try {
    const current = getSavedPreferences() || {};
    localStorage.setItem(
      "scriptGridPreferences",
      JSON.stringify({
        ...current,
        ...prefs,
      })
    );
    logger.debug("Preferences saved to localStorage:", prefs);
  } catch (error) {
    logger.error("Error saving preferences to localStorage:", error);
  }
};

// ===========================
// LOADING FALLBACK COMPONENT
// ===========================

function GridLoadingFallback() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 400,
        width: "100%",
      }}
    >
      <CircularProgress size={40} color="primary" />
    </Box>
  );
}

// ===========================
// MAIN COMPONENT
// ===========================

export function ProjectGrid({
  selectedScript,
  onScriptSelect,
}: ProjectGridProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  // Get saved preferences or defaults (client-side only)
  const savedPrefs = useMemo(() => getSavedPreferences(), []);

  // Initial query parameters with persistence
  const initialPageSize = (savedPrefs?.pageSize as number) || 4;
  const initialSortField = (savedPrefs?.sortField as string) || "createdAt";
  const initialSortOrder = (savedPrefs?.sortOrder as string) || "desc";
  const initialIsFavourite = (savedPrefs?.isFavourite as boolean) || false;

  // Use scripts hook with persisted defaults
  const {
    scripts = [],
    totalCount = 0,
    totalPages = 1,
    currentPage = 1,
    pageSize = initialPageSize,
    sortField = initialSortField,
    sortOrder = initialSortOrder,
    isFavourite = initialIsFavourite,
    allCount = 0,
    isLoading = false,
    updateQueryParams,
    refetch,
  } = useScripts({
    initialPageSize,
    initialSortField,
    initialSortOrder,
    initialIsFavourite,
  });

  // Pagination state management with useMemo for optimization
  const paginationState = useMemo<PaginationState>(
    () => ({
      currentPage,
      totalPages,
      totalCount,
      pageSize,
      sortField,
      sortOrder,
      isFavourite,
    }),
    [
      currentPage,
      totalPages,
      totalCount,
      pageSize,
      sortField,
      sortOrder,
      isFavourite,
    ]
  );

  // Check if the currently selected script still exists in the scripts list
  useEffect(() => {
    if (!isLoading && selectedScript) {
      const scriptStillExists = scripts.some(
        (script) => script.scriptId === selectedScript.scriptId
      );

      if (!scriptStillExists) {
        // Selected script no longer exists (probably deleted)
        // Select first available script or clear if none available
        startTransition(() => {
          if (scripts.length > 0) {
            onScriptSelect(scripts[0]);
          } else {
            onScriptSelect(null);
          }
        });
      }
    }
  }, [scripts, selectedScript, isLoading, onScriptSelect]);

  // Effect to handle script selection and navigation
  useEffect(() => {
    if (scripts.length === 0 && !isLoading) {
      if (allCount === 0) {
        router.push("/dashboard/script-analysis");
        return;
      }

      if (isFavourite && updateQueryParams) {
        updateQueryParams({
          isFavourite: false,
          pageNumber: 1,
        });
        CustomToast.info(
          "Please select some Favourites from your library first!"
        );
      }
    } else if (scripts.length > 0 && !selectedScript) {
      const firstScript = scripts[0];
      if (firstScript) {
        startTransition(() => {
          onScriptSelect(firstScript);
        });
      }
    }
  }, [
    scripts,
    selectedScript,
    currentPage,
    allCount,
    isFavourite,
    isLoading,
    onScriptSelect,
    router,
    updateQueryParams,
  ]);

  // Handler functions with type safety and optimization
  const handlePageChange = useCallback(
    (newPage: number): void => {
      if (updateQueryParams && newPage > 0) {
        startTransition(() => {
          updateQueryParams({ pageNumber: newPage });
        });
      }
    },
    [updateQueryParams]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number): void => {
      if (updateQueryParams && newPageSize > 0) {
        // Save preference to localStorage
        savePreferences({ pageSize: newPageSize });

        startTransition(() => {
          updateQueryParams({
            pageSize: newPageSize,
            pageNumber: 1,
          });
        });
      }
    },
    [updateQueryParams]
  );

  const handleSortChange = useCallback(
    (field: string, order: string): void => {
      if (updateQueryParams && field && order) {
        // Save preferences to localStorage
        savePreferences({
          sortField: field,
          sortOrder: order,
        });

        startTransition(() => {
          updateQueryParams({
            sortField: field,
            sortOrder: order,
            pageNumber: 1,
          });
        });
      }
    },
    [updateQueryParams]
  );

  const handleFavouriteChange = useCallback(
    (newIsFavourite: boolean): void => {
      if (updateQueryParams) {
        // Save preference to localStorage
        savePreferences({ isFavourite: newIsFavourite });

        startTransition(() => {
          updateQueryParams({
            isFavourite: newIsFavourite,
            pageNumber: 1,
          });
        });
      }
    },
    [updateQueryParams]
  );

  // Safe render with null checks
  if (!updateQueryParams) {
    logger.warn("ProjectGrid: updateQueryParams is undefined");
    return null;
  }

  return (
    <Box>
      <Suspense fallback={<GridLoadingFallback />}>
        <GridList
          scripts={scripts}
          isLoading={isLoading}
          selectedScript={selectedScript}
          onScriptSelect={onScriptSelect}
          pageSize={pageSize}
        />
      </Suspense>

      <Suspense fallback={null}>
        <Pagination
          currentPage={paginationState.currentPage}
          totalPages={Math.max(paginationState.totalPages, 1)}
          onPageChange={handlePageChange}
        />
      </Suspense>

      <Suspense fallback={null}>
        <GridNavigation
          isLoading={isLoading}
          currentPage={paginationState.currentPage}
          totalPages={paginationState.totalPages}
          totalCount={paginationState.totalCount}
          pageSize={paginationState.pageSize}
          sortField={paginationState.sortField}
          sortOrder={paginationState.sortOrder}
          isFavourite={paginationState.isFavourite}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortChange={handleSortChange}
          onFavouriteChange={handleFavouriteChange}
        />
      </Suspense>
    </Box>
  );
}

ProjectGrid.displayName = "ProjectGrid";

export default ProjectGrid;
