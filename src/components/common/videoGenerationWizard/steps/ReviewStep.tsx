// src/components/videoGeneration/steps/ReviewStep.tsx
"use client";

import React from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Chip,
  Divider,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { ReviewStepProps } from "../types";

/**
 * ReviewStep - Optional review step before generation
 *
 * Features:
 * - Shows summary of all configuration
 * - Allows user to review before starting
 * - Theme-aware styling
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Consistent with existing patterns
 */
export function ReviewStep({
  config,
  urls,
  processingMode,
  aspectRatio,
  modelTiers,
  onStartGeneration,
  onBack,
  onCancel,
}: ReviewStepProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Processing mode labels
  const processingModeLabels: Record<string, string> = {
    normal: "Normal",
    preview: "Preview",
    detailed: "Detailed",
    custom: "Custom",
  };

  // Model tier labels
  const tierLabels: Record<number, string> = {
    1: "Basic",
    2: "Pro",
    3: "Premium",
    4: "Ultra",
  };

  // Model tier colors
  const tierColors: Record<number, string> = {
    1: theme.palette.grey[500],
    2: theme.palette.info.main,
    3: theme.palette.warning.main,
    4: theme.palette.success.main,
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* Header */}
      <Box>
        <Typography
          variant="h6"
          sx={{
            color: "text.primary",
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
            mb: 1,
          }}
        >
          Review Your Settings
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontFamily: brand.fonts.body,
          }}
        >
          Please review your configuration before starting video generation
        </Typography>
      </Box>

      {/* Settings Summary */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        {/* Script Information */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: "text.secondary",
              fontFamily: brand.fonts.body,
              fontWeight: 600,
              mb: 1,
            }}
          >
            Script
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.primary",
              fontFamily: brand.fonts.body,
            }}
          >
            {config.mode === "versioned"
              ? `Existing script: ${config.scriptId}`
              : config.title || "New Script"}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Processing Mode */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: "text.secondary",
              fontFamily: brand.fonts.body,
              fontWeight: 600,
              mb: 1,
            }}
          >
            Processing Mode
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Chip
              label={processingModeLabels[processingMode] || processingMode}
              size="small"
              color="primary"
              sx={{
                fontFamily: brand.fonts.body,
                fontWeight: 600,
              }}
            />
            <Chip
              label={aspectRatio}
              size="small"
              variant="outlined"
              sx={{
                fontFamily: brand.fonts.body,
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Model Tiers */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: "text.secondary",
              fontFamily: brand.fonts.body,
              fontWeight: 600,
              mb: 1,
            }}
          >
            Quality Settings
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={`Image: ${tierLabels[modelTiers.image]}`}
              size="small"
              sx={{
                fontFamily: brand.fonts.body,
                bgcolor: alpha(tierColors[modelTiers.image], 0.1),
                color: tierColors[modelTiers.image],
                fontWeight: 600,
              }}
            />
            <Chip
              label={`Audio: ${tierLabels[modelTiers.audio]}`}
              size="small"
              sx={{
                fontFamily: brand.fonts.body,
                bgcolor: alpha(tierColors[modelTiers.audio], 0.1),
                color: tierColors[modelTiers.audio],
                fontWeight: 600,
              }}
            />
            <Chip
              label={`Video: ${tierLabels[modelTiers.video]}`}
              size="small"
              sx={{
                fontFamily: brand.fonts.body,
                bgcolor: alpha(tierColors[modelTiers.video], 0.1),
                color: tierColors[modelTiers.video],
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>

        {/* Reference URLs */}
        {urls.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                Reference URLs
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.primary",
                  fontFamily: brand.fonts.body,
                }}
              >
                {urls.length} URL{urls.length !== 1 ? "s" : ""} configured
              </Typography>
            </Box>
          </>
        )}
      </Paper>

      {/* Confirmation Message */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: alpha(theme.palette.success.main, 0.05),
          borderColor: alpha(theme.palette.success.main, 0.3),
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <CheckCircleIcon
          sx={{
            color: "success.main",
            fontSize: 24,
          }}
        />
        <Typography
          variant="body2"
          sx={{
            color: "text.primary",
            fontFamily: brand.fonts.body,
          }}
        >
          Everything looks good! Click "Start Generation" to begin creating your
          video.
        </Typography>
      </Paper>

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
          onClick={onStartGeneration}
          startIcon={<PlayArrowIcon />}
          sx={{
            fontFamily: brand.fonts.body,
            fontWeight: 600,
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "success.main",
            "&:hover": {
              bgcolor: "success.dark",
            },
          }}
        >
          Start Generation
        </Button>
      </Box>
    </Box>
  );
}

ReviewStep.displayName = "ReviewStep";
