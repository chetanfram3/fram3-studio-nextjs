"use client";

import { useParams, useRouter } from "next/navigation";
import { Paper, Alert, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useAnalysisData } from "@/hooks/scripts/analysis/useAnalysisData";
import AnalysisContent from "./AnalysisContent";
import LoadingAnimation from "@/components/common/LoadingAnimation";
import AnalysisHeader from "./AnalysisHeader";
import { useScriptDetails } from "@/hooks/scripts/useScriptDetails";
import type { AnalysisType } from "@/config/analysisTypes";

/**
 * StoredAnalysisView - Displays stored analysis data for a script version
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Uses React Query for efficient data fetching and caching
 * - Conditional rendering minimizes unnecessary updates
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - No hardcoded colors or spacing
 *
 * Navigation:
 * - Uses Next.js 15 router for navigation
 * - Handles route params from Next.js App Router
 */

export default function StoredAnalysisView() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const params = useParams();
  const router = useRouter();

  const scriptId = (params?.scriptId as string) || "";
  const versionId = (params?.versionId as string) || "";
  const analysisType = (params?.analysisType as string) || "";

  const { details } = useScriptDetails(scriptId, versionId);

  const {
    data: analysisData,
    isLoading,
    error,
    isFetching,
  } = useAnalysisData(scriptId, versionId, analysisType);

  const handleBack = () => {
    router.push(`/scripts/${scriptId}/version/${versionId}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingAnimation message="Loading Generated Raw analysis.." />;
    }

    if (error) {
      return (
        <Alert
          severity="error"
          sx={{
            bgcolor: "background.paper",
            color: "text.primary",
            borderRadius: `${brand.borderRadius}px`,
            borderLeft: 4,
            borderColor: "error.main",
            fontFamily: brand.fonts.body,
          }}
        >
          {error instanceof Error ? error.message : "Failed to load analysis"}
        </Alert>
      );
    }

    if (
      !analysisData?.analyses ||
      (Array.isArray(analysisData.analyses) &&
        analysisData.analyses.length === 0) ||
      (Array.isArray(analysisData.analyses) && !analysisData.analyses[0]?.data)
    ) {
      return (
        <Alert
          severity="info"
          sx={{
            bgcolor: "background.paper",
            color: "text.primary",
            borderRadius: `${brand.borderRadius}px`,
            borderLeft: 4,
            borderColor: "primary.main",
            fontFamily: brand.fonts.body,
          }}
        >
          No analysis data available
        </Alert>
      );
    }

    return (
      <AnalysisContent
        analysisType={analysisType as AnalysisType}
        data={analysisData}
        scriptId={scriptId}
        versionId={versionId}
        isRefetching={isFetching}
      />
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <AnalysisHeader analysisType={analysisType} onBack={handleBack} />

      <Paper
        elevation={3}
        sx={{
          p: 4,
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
        }}
      >
        {renderContent()}
      </Paper>
    </Box>
  );
}
