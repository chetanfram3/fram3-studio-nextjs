// src/components/videoGeneration/steps/UrlConfigurationStep.tsx
"use client";

import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { UrlManager } from "@/components/common/UrlManager";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import type { UrlConfigurationStepProps } from "../types";

/**
 * UrlConfigurationStep - Step for configuring reference URLs
 *
 * Features:
 * - Reuses existing UrlManager component
 * - Optional step (can skip with no URLs)
 * - Theme-aware styling
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts
 * - Consistent with existing patterns
 */
export function UrlConfigurationStep({
  urls,
  onUrlsChange,
  onNext,
  onCancel,
}: UrlConfigurationStepProps) {
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
          Add reference URLs to enhance AI analysis
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontFamily: brand.fonts.body,
          }}
        >
          Include links to products, brands, social media profiles, or other
          references that will help the AI understand your content better.
          This step is optional.
        </Typography>
      </Box>

      {/* URL Manager */}
      <UrlManager
        value={urls}
        onChange={onUrlsChange}
        label="Reference URLs"
        helperText="Add URLs for products, brands, social media, or other references"
        config={{
          maxUrls: 12,
          allowCustomTypes: true,
          enforceHttps: true,
          showLabels: true,
        }}
      />

      {/* Actions */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "flex-end",
          pt: 2,
        }}
      >
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

UrlConfigurationStep.displayName = "UrlConfigurationStep";
