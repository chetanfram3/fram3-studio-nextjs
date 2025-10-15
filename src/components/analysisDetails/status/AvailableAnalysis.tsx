"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  ANALYSIS_TITLES,
  ANALYSIS_DEPENDENCIES,
  AnalysisType,
  PROCESSOR_TYPES,
  INDEPENDENT_TYPES,
  VIDEO_PIPELINE_TYPES,
  BATCH_GENERATOR_TYPES,
} from "@/config/analysisTypes";

/**
 * AvailableAnalysis - Displays and manages available script analyses
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Uses startTransition for non-urgent navigation updates
 * - Efficient filtering and grouping of analyses
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - Uses theme transitions for smooth interactions
 * - No hardcoded colors or spacing
 *
 * @param scriptId - The ID of the script
 * @param versionId - The version ID of the script
 * @param completedAnalyses - Array of completed analysis type keys
 */

interface AvailableAnalysisProps {
  scriptId: string;
  versionId: string;
  completedAnalyses: string[];
}

export default function AvailableAnalysis({
  scriptId,
  versionId,
  completedAnalyses,
}: AvailableAnalysisProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleAnalysisClick = (analysisType: AnalysisType) => {
    setIsNavigating(true);
    startTransition(() => {
      router.push(
        `/scripts/${scriptId}/version/${versionId}/analysis/run/${analysisType}`
      );
    });
  };

  const isAnalysisDisabled = (analysisType: AnalysisType): boolean => {
    const dependencies = ANALYSIS_DEPENDENCIES[analysisType];
    return (
      Array.isArray(dependencies) &&
      dependencies.some((dep) => !completedAnalyses?.includes(dep))
    );
  };

  const getDependencyMessage = (analysisType: AnalysisType): string => {
    const dependencies = ANALYSIS_DEPENDENCIES[analysisType];

    if (!dependencies || !dependencies.length) return "";

    const missingDeps = dependencies.filter(
      (dep) => !completedAnalyses.includes(dep)
    );

    if (!missingDeps.length) return "";

    return `Requires ${missingDeps
      .map((dep) => ANALYSIS_TITLES[dep])
      .join(" and ")} to be completed first`;
  };

  const getAllBackendAnalysisTypes = (): AnalysisType[] => {
    return Object.keys(ANALYSIS_TITLES).filter((analysis) => {
      const excludedTypes = [...PROCESSOR_TYPES, ...BATCH_GENERATOR_TYPES];

      return !excludedTypes.includes(analysis);
    }) as AnalysisType[];
  };

  const availableAnalyses = getAllBackendAnalysisTypes().filter((analysis) => {
    if (completedAnalyses.includes(analysis)) {
      return false;
    }

    return true;
  });

  const groupedAnalyses = {
    core: availableAnalyses.filter(
      (analysis) =>
        !INDEPENDENT_TYPES.includes(analysis as AnalysisType) &&
        !VIDEO_PIPELINE_TYPES.includes(analysis as AnalysisType)
    ),
    independent: availableAnalyses.filter((analysis) =>
      INDEPENDENT_TYPES.includes(analysis as AnalysisType)
    ),
    video: availableAnalyses.filter((analysis) =>
      VIDEO_PIPELINE_TYPES.includes(analysis as AnalysisType)
    ),
  };

  const renderAnalysisGroup = (
    analyses: AnalysisType[],
    title: string,
    description?: string
  ) => {
    if (!analyses.length) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{
            mb: 1,
            fontWeight: 600,
            color: "primary.main",
            fontFamily: brand.fonts.heading,
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mb: 2,
              display: "block",
              fontFamily: brand.fonts.body,
            }}
          >
            {description}
          </Typography>
        )}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {analyses.map((analysisType) => {
            const isDisabled = isAnalysisDisabled(analysisType);
            const dependencyMessage = getDependencyMessage(analysisType);

            return (
              <Tooltip
                key={analysisType}
                title={dependencyMessage || "Click to run analysis"}
                placement="top"
                arrow
              >
                <span>
                  <Chip
                    label={ANALYSIS_TITLES[analysisType]}
                    onClick={() =>
                      !isDisabled && handleAnalysisClick(analysisType)
                    }
                    disabled={isDisabled || isNavigating}
                    color="primary"
                    variant={isDisabled ? "outlined" : "filled"}
                    sx={{
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      fontFamily: brand.fonts.body,
                      borderRadius: `${brand.borderRadius}px`,
                      transition: theme.transitions.create(
                        ["background-color", "transform"],
                        { duration: theme.transitions.duration.shorter }
                      ),
                      "&:hover": {
                        bgcolor: isDisabled ? undefined : "primary.dark",
                        transform: isDisabled ? "none" : "translateY(-1px)",
                      },
                      "&:active": {
                        transform: isDisabled ? "none" : "translateY(0)",
                      },
                    }}
                  />
                </span>
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    );
  };

  if (!availableAnalyses.length) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mt: 3,
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
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
          Available Analysis
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          All available analyses have been completed. Use the batch generators
          above for image and prompt generation.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mt: 3,
        bgcolor: "background.paper",
        borderRadius: `${brand.borderRadius}px`,
        border: 1,
        borderColor: "divider",
        transition: theme.transitions.create(["box-shadow"], {
          duration: theme.transitions.duration.standard,
        }),
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
        Available Analysis
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 3,
          fontFamily: brand.fonts.body,
        }}
      >
        Click on an analysis type to run it. Some analyses require dependencies
        to be completed first.
      </Typography>

      {renderAnalysisGroup(
        groupedAnalyses.core,
        "Core Pipeline Analysis",
        "Main script analysis pipeline following the standard workflow"
      )}

      {renderAnalysisGroup(
        groupedAnalyses.independent,
        "Independent Analysis",
        "Standalone analysis that can run without dependencies"
      )}

      {renderAnalysisGroup(
        groupedAnalyses.video,
        "Video Pipeline Analysis",
        "Video generation and analysis workflow"
      )}

      {isNavigating && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mt: 2,
          }}
        >
          <CircularProgress
            size={20}
            sx={{
              color: "primary.main",
            }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Starting analysis...
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
