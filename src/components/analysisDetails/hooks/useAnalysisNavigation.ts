// src/components/analysisDetails/hooks/useAnalysisNavigation.ts

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import logger from "@/utils/logger";
import type { AnalysisType } from "@/config/analysisTypes";
import type { UseAnalysisNavigationOptions, UseAnalysisNavigationReturn } from "./types";

/**
 * useAnalysisNavigation - Manages navigation to analysis pages
 * 
 * Uses startTransition for non-blocking navigation
 */
export function useAnalysisNavigation({
  scriptId,
  versionId,
}: UseAnalysisNavigationOptions): UseAnalysisNavigationReturn {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const navigateToAnalysis = useCallback(
    (analysisType: AnalysisType) => {
      setIsNavigating(true);

      startTransition(() => {
        const path = `/scripts/${scriptId}/version/${versionId}/analysis/view/${analysisType}`;
        logger.debug("Navigating to analysis", { analysisType, path });
        router.push(path);
      });

      // Reset after transition
      setTimeout(() => setIsNavigating(false), 500);
    },
    [scriptId, versionId, router]
  );

  return {
    navigateToAnalysis,
    isNavigating: isNavigating || isPending,
  };
}