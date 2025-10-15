"use client";

import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import type { AnalysisType } from "@/config/analysisTypes";

/**
 * AnalysisContent - Displays analysis data in formatted JSON
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Simple data transformation and rendering
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for border radius
 * - Respects light/dark mode automatically
 * - No hardcoded colors (except for code display background)
 *
 * @param analysisType - The type of analysis being displayed
 * @param data - The analysis data to display
 * @param scriptId - Optional script ID (for future use)
 * @param versionId - Optional version ID (for future use)
 * @param isRefetching - Whether data is currently being refetched
 * @param isStreaming - Whether data is being streamed
 */

interface AnalysisContentProps {
  analysisType: AnalysisType;
  data: unknown;
  scriptId?: string;
  versionId?: string;
  isRefetching?: boolean;
  isStreaming?: boolean;
}

export default function AnalysisContent({
  analysisType,
  data,
}: AnalysisContentProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Extract the actual analysis data
  const analysisData =
    (data as { analyses?: Array<{ data?: unknown }> })?.analyses?.[0]?.data ||
    data;

  switch (analysisType) {
    default:
      return (
        <Box
          component="pre"
          sx={{
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            bgcolor: "background.paper",
            color: "text.primary",
            p: 3,
            borderRadius: `${brand.borderRadius}px`,
            overflow: "auto",
            maxHeight: "70vh",
            fontSize: "14px",
            lineHeight: 1.5,
            margin: 0,
            border: 1,
            borderColor: "divider",
          }}
        >
          {JSON.stringify(analysisData, null, 2)}
        </Box>
      );
  }
}
