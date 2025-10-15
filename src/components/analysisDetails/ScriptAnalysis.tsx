"use client";

import { Box, Typography, Paper, CircularProgress, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useScriptAnalysis } from "@/hooks/scripts/useScriptAnalysis";
import ModerationChart from "./ModerationChart";
import CategoryChips from "./CategoryChips";
import type { ModerationCategory, Category } from "@/types/analysis";

/**
 * ScriptAnalysis - Displays moderation and category analysis for a script
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Multiple data fetching hooks run in parallel
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - No hardcoded colors or spacing
 *
 * @param scriptId - The ID of the script to analyze
 * @param versionId - The version ID of the script
 */

interface ScriptAnalysisProps {
  scriptId: string;
  versionId: string;
}

// Type guard to check if data has moderationCategories
function hasModerationCategories(
  data: unknown
): data is { moderationCategories: ModerationCategory[] } {
  return (
    typeof data === "object" &&
    data !== null &&
    "moderationCategories" in data &&
    Array.isArray(
      (data as { moderationCategories: unknown }).moderationCategories
    )
  );
}

// Type guard to check if data has categories
function hasCategories(data: unknown): data is { categories: Category[] } {
  return (
    typeof data === "object" &&
    data !== null &&
    "categories" in data &&
    Array.isArray((data as { categories: unknown }).categories)
  );
}

export default function ScriptAnalysis({
  scriptId,
  versionId,
}: ScriptAnalysisProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const {
    data: moderationData,
    isLoading: isLoadingModeration,
    error: moderationError,
  } = useScriptAnalysis(scriptId, versionId, "moderation");

  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useScriptAnalysis(scriptId, versionId, "categories");

  if (isLoadingModeration || isLoadingCategories) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (moderationError || categoriesError) {
    return <Alert severity="error">Failed to load analysis data</Alert>;
  }

  // Access the data directly from the AnalysisItem using type guards
  const moderationCategories = hasModerationCategories(moderationData)
    ? moderationData.moderationCategories
    : [];

  const categories = hasCategories(categoriesData)
    ? categoriesData.categories
    : [];

  return (
    <>
      {/* Moderation Analysis */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: "primary.main",
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
          }}
        >
          Content Moderation Analysis
        </Typography>
        {moderationCategories.length > 0 ? (
          <ModerationChart moderationCategories={moderationCategories} />
        ) : (
          <Typography
            color="text.secondary"
            sx={{
              fontFamily: brand.fonts.body,
            }}
          >
            No moderation data available
          </Typography>
        )}
      </Paper>

      {/* Categories Analysis */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
        }}
      >
        {categories.length > 0 ? (
          <CategoryChips categories={categories} />
        ) : (
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontFamily: brand.fonts.heading,
                color: "text.primary",
              }}
            >
              Content Categories
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                fontFamily: brand.fonts.body,
              }}
            >
              No category data available
            </Typography>
          </Box>
        )}
      </Paper>
    </>
  );
}
