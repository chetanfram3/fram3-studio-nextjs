// src/components/analysisLibrary/ProjectGrid.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
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
const savePreferences = (prefs: {
  pageSize?: number;
  sortField?: string;
  sortOrder?: string;
  isFavourite?: boolean;
}): void => {
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
  } catch (error) {
    logger.error("Error saving preferences to localStorage:", error);
  }
};

// ===========================
// MAIN COMPONENT
// ===========================

export const ProjectGrid: React.FC<ProjectGridProps> = React.memo(
  ({ selectedScript, onScriptSelect }) => {
    const router = useRouter();

    // Get saved preferences or defaults (client-side only)
    const savedPrefs = getSavedPreferences();

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

    // Pagination state management
    const [paginationState, setPaginationState] = useState<PaginationState>({
      currentPage,
      totalPages,
      totalCount,
      pageSize,
      sortField,
      sortOrder,
      isFavourite,
    });

    // Effect to update pagination state
    useEffect(() => {
      if (!isLoading) {
        setPaginationState({
          currentPage,
          totalPages,
          totalCount,
          pageSize,
          sortField,
          sortOrder,
          isFavourite,
        });
      }
    }, [
      currentPage,
      totalPages,
      totalCount,
      pageSize,
      sortField,
      sortOrder,
      isFavourite,
      isLoading,
    ]);

    // CRITICAL FIX: Auto-select first script when scripts load
    useEffect(() => {
      logger.debug("ProjectGrid: Script selection effect", {
        scriptsLength: scripts.length,
        hasSelectedScript: !!selectedScript,
        isLoading,
        firstScriptId: scripts[0]?.scriptId,
      });

      // Only auto-select if we don't have a selection and scripts are loaded
      if (!isLoading && scripts.length > 0 && !selectedScript) {
        const firstScript = scripts[0];
        logger.debug("ProjectGrid: Auto-selecting first script", {
          scriptId: firstScript.scriptId,
          scriptTitle: firstScript.scriptTitle,
        });
        onScriptSelect(firstScript);
      }
    }, [scripts, selectedScript, isLoading, onScriptSelect]);

    // Check if the currently selected script still exists in the scripts list
    useEffect(() => {
      if (!isLoading && selectedScript) {
        const scriptStillExists = scripts.some(
          (script) => script.scriptId === selectedScript.scriptId
        );

        if (!scriptStillExists) {
          logger.debug(
            "ProjectGrid: Selected script no longer exists, selecting new one"
          );
          // Selected script no longer exists (probably deleted)
          if (scripts.length > 0) {
            onScriptSelect(scripts[0]);
          } else {
            onScriptSelect(null);
          }
        }
      }
    }, [scripts, selectedScript, isLoading, onScriptSelect]);

    // Effect to handle script selection and navigation
    useEffect(() => {
      if (scripts.length === 0 && !isLoading) {
        if (allCount === 0) {
          logger.debug(
            "ProjectGrid: No scripts available, redirecting to script analysis"
          );
          router.push("/dashboard/script-analysis");
          return;
        }

        if (isFavourite) {
          logger.debug("ProjectGrid: No favourites, switching to all scripts");
          updateQueryParams?.({
            isFavourite: false,
            pageNumber: 1,
          });
          CustomToast.info(
            "Please select some Favourites from your library first!"
          );
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

    // Handler functions with type safety
    const handlePageChange = (newPage: number): void => {
      if (updateQueryParams && newPage > 0) {
        updateQueryParams({ pageNumber: newPage });
      }
    };

    const handlePageSizeChange = (newPageSize: number): void => {
      if (updateQueryParams && newPageSize > 0) {
        // Save preference to localStorage
        savePreferences({ pageSize: newPageSize });

        updateQueryParams({
          pageSize: newPageSize,
          pageNumber: 1,
        });
      }
    };

    const handleSortChange = (field: string, order: string): void => {
      if (updateQueryParams && field && order) {
        // Save preferences to localStorage
        savePreferences({
          sortField: field,
          sortOrder: order,
        });

        updateQueryParams({
          sortField: field,
          sortOrder: order,
          pageNumber: 1,
        });
      }
    };

    const handleFavouriteChange = (newIsFavourite: boolean): void => {
      if (updateQueryParams) {
        // Save preference to localStorage
        savePreferences({ isFavourite: newIsFavourite });

        updateQueryParams({
          isFavourite: newIsFavourite,
          pageNumber: 1,
        });
      }
    };

    // Safe render with null checks
    if (!updateQueryParams) {
      return null;
    }

    return (
      <Box>
        <GridList
          scripts={scripts}
          isLoading={isLoading}
          selectedScript={selectedScript}
          onScriptSelect={onScriptSelect}
          pageSize={pageSize}
        />

        <Pagination
          currentPage={paginationState.currentPage}
          totalPages={Math.max(paginationState.totalPages, 1)}
          onPageChange={handlePageChange}
        />

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
      </Box>
    );
  }
);

ProjectGrid.displayName = "ProjectGrid";

export default ProjectGrid;
