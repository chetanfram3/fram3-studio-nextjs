//src/components/analysisLibrary/ProjectGrid.tsx

"use client";

import {
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  startTransition,
} from "react";
import { Box, CircularProgress } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useScripts } from "@/hooks/scripts/useScripts";
import { GridList } from "./GridList";
import { GridNavigation } from "./GridNavigation";
import { Pagination } from "./Pagination";
import type { Script } from "@/types/scripts";
import { useAuthStore } from "@/store/authStore";
import CustomToast from "@/components/common/CustomToast";
import logger from "@/utils/logger";

interface ProjectGridProps {
  selectedScript: Script | null;
  onScriptSelect: (script: Script | null) => void;
  savedScriptId: string | null;
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

const getSavedPreferences = (): Record<string, unknown> | null => {
  if (typeof window === "undefined") return null;
  try {
    const savedPrefs = localStorage.getItem("scriptGridPreferences");
    return savedPrefs ? JSON.parse(savedPrefs) : null;
  } catch (error) {
    logger.error("Error reading preferences:", error);
    return null;
  }
};

const savePreferences = (prefs: UserPreferences): void => {
  if (typeof window === "undefined") return;
  try {
    const current = getSavedPreferences() || {};
    localStorage.setItem(
      "scriptGridPreferences",
      JSON.stringify({ ...current, ...prefs })
    );
  } catch (error) {
    logger.error("Error saving preferences:", error);
  }
};

const saveCurrentPage = (page: number): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("scriptGridCurrentPage", page.toString());
  } catch (error) {
    logger.error("Error saving page:", error);
  }
};

const getSavedCurrentPage = (): number | null => {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("scriptGridCurrentPage");
    return saved ? parseInt(saved, 10) : null;
  } catch (error) {
    return null;
  }
};

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

export function ProjectGrid({
  selectedScript,
  onScriptSelect,
  savedScriptId,
}: ProjectGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const savedPrefs = useMemo(() => getSavedPreferences(), []);
  const savedPage = useMemo(() => getSavedCurrentPage(), []);

  const initialPageSize = (savedPrefs?.pageSize as number) || 4;
  const initialSortField = (savedPrefs?.sortField as string) || "createdAt";
  const initialSortOrder = (savedPrefs?.sortOrder as string) || "desc";
  const initialIsFavourite = (savedPrefs?.isFavourite as boolean) || false;
  const initialPageNumber = savedPage || 1;

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
  } = useScripts({
    initialPageSize,
    initialPageNumber,
    initialSortField,
    initialSortOrder,
    initialIsFavourite,
  });

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

  // Restore URL params from localStorage
  useEffect(() => {
    if (!updateQueryParams) return;

    const hasUrlParams =
      searchParams.get("pageNumber") || searchParams.get("pageSize");
    if (!hasUrlParams && (savedPage || savedPrefs)) {
      const paramsToRestore: Record<string, string | number | boolean> = {};
      if (savedPage && savedPage > 1) paramsToRestore.pageNumber = savedPage;
      if (savedPrefs?.pageSize && savedPrefs.pageSize !== 4) {
        paramsToRestore.pageSize = savedPrefs.pageSize as number;
      }
      if (savedPrefs?.sortField && savedPrefs.sortField !== "createdAt") {
        paramsToRestore.sortField = savedPrefs.sortField as string;
      }
      if (savedPrefs?.sortOrder && savedPrefs.sortOrder !== "desc") {
        paramsToRestore.sortOrder = savedPrefs.sortOrder as string;
      }
      if (savedPrefs?.isFavourite) paramsToRestore.isFavourite = true;

      if (Object.keys(paramsToRestore).length > 0) {
        updateQueryParams(paramsToRestore);
      }
    }
  }, [searchParams, savedPage, savedPrefs, updateQueryParams]);

  // Save page to localStorage
  useEffect(() => {
    if (currentPage > 0) saveCurrentPage(currentPage);
  }, [currentPage]);

  // ✅ SINGLE UNIFIED EFFECT for script selection
  useEffect(() => {
    // Wait for scripts to load
    if (isLoading || scripts.length === 0) return;

    // If already have selection and it exists in current list, keep it
    if (selectedScript) {
      const exists = scripts.some(
        (s) => s.scriptId === selectedScript.scriptId
      );
      if (exists) return; // Keep current selection

      // Selected script deleted or not on this page - select first
      logger.debug("Selected script not found, selecting first");
      onScriptSelect(scripts[0]);
      return;
    }

    // No selection yet - try to restore or select first
    if (savedScriptId) {
      const savedScript = scripts.find((s) => s.scriptId === savedScriptId);
      if (savedScript) {
        logger.debug("Restoring saved script:", savedScriptId);
        onScriptSelect(savedScript);
        return;
      }
    }

    // Default: select first script
    logger.debug("Selecting first script");
    onScriptSelect(scripts[0]);
  }, [scripts, isLoading, selectedScript, savedScriptId, onScriptSelect]);

  // Edge case: no scripts
  useEffect(() => {
    if (scripts.length === 0 && !isLoading) {
      if (allCount === 0) {
        router.push("/create-now");
        return;
      }
      if (isFavourite && updateQueryParams) {
        updateQueryParams({ isFavourite: false, pageNumber: 1 });
        CustomToast.info(
          "Please select some Favourites from your library first!"
        );
      }
    }
  }, [
    scripts.length,
    isLoading,
    allCount,
    isFavourite,
    router,
    updateQueryParams,
  ]);

  // Handlers
  const handlePageChange = useCallback(
    (newPage: number): void => {
      if (updateQueryParams && newPage > 0) {
        startTransition(() => updateQueryParams({ pageNumber: newPage }));
      }
    },
    [updateQueryParams]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number): void => {
      if (updateQueryParams && newPageSize > 0) {
        savePreferences({ pageSize: newPageSize });
        startTransition(() =>
          updateQueryParams({ pageSize: newPageSize, pageNumber: 1 })
        );
      }
    },
    [updateQueryParams]
  );

  const handleSortChange = useCallback(
    (field: string, order: string): void => {
      if (updateQueryParams && field && order) {
        savePreferences({ sortField: field, sortOrder: order });
        startTransition(() =>
          updateQueryParams({
            sortField: field,
            sortOrder: order,
            pageNumber: 1,
          })
        );
      }
    },
    [updateQueryParams]
  );

  const handleFavouriteChange = useCallback(
    (newIsFavourite: boolean): void => {
      if (updateQueryParams) {
        savePreferences({ isFavourite: newIsFavourite });
        startTransition(() =>
          updateQueryParams({ isFavourite: newIsFavourite, pageNumber: 1 })
        );
      }
    },
    [updateQueryParams]
  );

  if (!updateQueryParams) return null;

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
