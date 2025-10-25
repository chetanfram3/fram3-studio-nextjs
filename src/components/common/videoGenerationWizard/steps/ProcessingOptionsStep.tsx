// src/components/videoGeneration/steps/ProcessingOptionsStep.tsx
"use client";

import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import ProcessingModeSelector from "@/components/common/ProcessingModeSelector";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import type { ProcessingOptionsStepProps } from "../types";

/**
 * ProcessingOptionsStep - Step for configuring processing options
 *
 * Features:
 * - Reuses existing ProcessingModeSelector component
 * - Supports back navigation
 * - Theme-aware styling
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts
 * - Consistent with existing patterns
 */
export function ProcessingOptionsStep({
  processingMode,
  aspectRatio,
  pauseBeforeSettings,
  modelTiers,
  onProcessingOptionsChange,
  onNext,
  onBack,
  onCancel,
  canGoBack,
}: ProcessingOptionsStepProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* Description */}
      <Box>
        <Typography
          variant="body1"
          sx={{
            color: "text.primary",
            fontFamily: brand.fonts.body,
            mb: 1,
          }}
        >
          Configure video generation settings
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontFamily: brand.fonts.body,
          }}
        >
          Choose your processing mode, aspect ratio, and quality settings.
          These options control how your video will be generated.
        </Typography>
      </Box>

      {/* Processing Mode Selector */}
      <ProcessingModeSelector
        onChange={onProcessingOptionsChange}
        initialMode={processingMode}
        initialAspectRatio={aspectRatio}
        initialPauseBefore={pauseBeforeSettings}
        initialModelTiers={modelTiers}
      />

      {/* Actions */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          pt: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          {canGoBack && (
            <Button
              variant="outlined"
              onClick={onBack}
              startIcon={<ArrowBackIcon />}
              sx={{
                fontFamily: brand.fonts.body,
                fontWeight: 600,
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              Back
            </Button>
          )}

          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{
              fontFamily: brand.fonts.body,
              fontWeight: 600,
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            Cancel
          </Button>
        </Box>

        <Button
          variant="contained"
          onClick={onNext}
          endIcon={<ArrowForwardIcon />}
          sx={{
            fontFamily: brand.fonts.body,
            fontWeight: 600,
            borderRadius: `${brand.borderRadius}px`,
          }}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
}

ProcessingOptionsStep.displayName = "ProcessingOptionsStep";
