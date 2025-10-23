"use client";

import { Box, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import ScriptAnalysis from "../ScriptAnalysis";

interface AnalysisListProps {
  scriptId: string;
  versionId: string;
}

/**
 * AnalysisList - Displays list of analysis results
 *
 * Currently wraps the existing ScriptAnalysis component
 * which handles moderation and category analysis.
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Delegates to existing optimized ScriptAnalysis component
 *
 * Theme integration:
 * - Uses theme.palette for colors
 * - Uses brand configuration for styling
 * - Respects light/dark mode automatically
 *
 * @param scriptId - The ID of the script
 * @param versionId - The version ID of the script
 */
export function AnalysisList({ scriptId, versionId }: AnalysisListProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box sx={{ mt: 2 }}>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
          transition: theme.transitions.create(["box-shadow"], {
            duration: theme.transitions.duration.standard,
          }),
          "&:hover": {
            boxShadow: theme.shadows[4],
          },
        }}
      >
        {/* 
          ScriptAnalysis handles moderation and category display
          This is the existing component that shows charts and chips
        */}
        <ScriptAnalysis scriptId={scriptId} versionId={versionId} />
      </Paper>
    </Box>
  );
}
