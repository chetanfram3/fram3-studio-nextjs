"use client";

import { Box, Divider, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { BackButton } from "@/components/storyMain/BackButton";
import {
  ANALYSIS_TITLES,
  ANALYSIS_SUB_TITLES,
  AnalysisType,
} from "@/config/analysisTypes";

/**
 * AnalysisHeader - Displays header for analysis view with title and back button
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Simple presentational component
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - No hardcoded colors or spacing
 *
 * @param analysisType - The type of analysis being displayed
 * @param onBack - Callback function for back navigation (not used, BackButton handles internally)
 */

interface AnalysisHeaderProps {
  analysisType: string;
  onBack: () => void;
}

export default function AnalysisHeader({ analysisType }: AnalysisHeaderProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
      <BackButton
        showHomeButton={false}
        sx={{
          color: "primary.main",
          borderColor: "primary.main",
          "&:hover": {
            bgcolor: "action.hover",
            borderColor: "primary.dark",
          },
        }}
      />
      <Divider
        orientation="vertical"
        flexItem
        sx={{
          borderRightWidth: 2,
          borderColor: "primary.main",
          height: "80px",
        }}
      />
      <Box>
        <Typography
          variant="h1"
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: "normal",
            fontStyle: "normal",
            textTransform: "uppercase",
            color: "text.primary",
          }}
        >
          {ANALYSIS_TITLES[analysisType as AnalysisType]}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            mt: 1,
            color: "text.secondary",
            fontStyle: "italic",
            fontFamily: brand.fonts.body,
          }}
        >
          {ANALYSIS_SUB_TITLES[analysisType as AnalysisType]}
        </Typography>
      </Box>
    </Box>
  );
}
