"use client";

// ImageUpscaleOverlay.tsx - Fully theme-compliant and performance-optimized
import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  IconButton,
  Button,
  Stack,
  Typography,
  Chip,
  Alert,
  Slider,
} from "@mui/material";
import {
  ImageUpscale as UpscaleIcon,
  CircleX as CloseIcon,
} from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  useImageEditor,
  type UpscaleImageParams,
} from "@/hooks/useImageEditor";
import { ImageType } from "@/types/image/types";

interface ImageUpscaleOverlayProps {
  // Required props
  scriptId: string;
  versionId: string;
  type: ImageType;
  viewingVersion?: { version: number };

  // Type-specific props
  sceneId?: number;
  shotId?: number;
  actorId?: number;
  actorVersionId?: number;
  locationId?: number;
  locationVersionId?: number;
  promptType?: string;

  // Image dimensions
  imageDimensions?: {
    width: number;
    height: number;
  } | null;

  // Callbacks
  onUpscaleComplete: (result: unknown) => void;
  onCancel?: () => void;
  onDataRefresh?: () => void;
  onUpscalingStateChange?: (isUpscaling: boolean) => void;

  // State control
  disabled?: boolean;

  // Optional styling
  buttonSx?: Record<string, unknown>;
}

// Constants
const UPSCALE_FACTORS = [1.5, 2, 3, 4, 6, 8];
const MAX_8K_WIDTH = 7680;
const MAX_8K_HEIGHT = 4320;

export function ImageUpscaleOverlay({
  scriptId,
  versionId,
  type,
  viewingVersion,
  sceneId,
  shotId,
  actorId,
  actorVersionId,
  locationId,
  locationVersionId,
  promptType,
  imageDimensions,
  onUpscaleComplete,
  onCancel,
  onUpscalingStateChange,
  disabled = false,
}: ImageUpscaleOverlayProps) {
  // Theme and brand
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Local state
  const [selectedUpscaleFactor, setSelectedUpscaleFactor] = useState<number>(2);

  // Hook parameters
  const hookParams = useMemo(() => {
    const baseParams = {
      scriptId,
      versionId,
      type,
    };

    if (type === "shots") {
      return { ...baseParams, sceneId, shotId };
    } else if (type === "actor") {
      return { ...baseParams, actorId, actorVersionId };
    } else if (type === "location") {
      return {
        ...baseParams,
        locationId,
        locationVersionId,
        promptType: promptType || "wideShotLocationSetPrompt",
      };
    } else if (type === "standalone") {
      // ✅ NEW: Standalone needs no additional params
      return baseParams;
    }
    return baseParams;
  }, [
    scriptId,
    versionId,
    type,
    sceneId,
    shotId,
    actorId,
    actorVersionId,
    locationId,
    locationVersionId,
    promptType,
  ]);

  // Hooks
  const {
    upscaleImageAsync,
    isUpscaling,
    error: upscaleError,
    resetUpscaleMutation,
  } = useImageEditor(hookParams);

  // Notify parent of upscaling state changes
  useEffect(() => {
    if (onUpscalingStateChange) {
      onUpscalingStateChange(isUpscaling);
    }
  }, [isUpscaling, onUpscalingStateChange]);

  // Calculate available upscale factors based on 8K limit
  const availableUpscaleFactors = useMemo(() => {
    if (!imageDimensions) {
      return UPSCALE_FACTORS;
    }

    const { width, height } = imageDimensions;

    return UPSCALE_FACTORS.filter((factor) => {
      const newWidth = Math.round(width * factor);
      const newHeight = Math.round(height * factor);
      return newWidth <= MAX_8K_WIDTH && newHeight <= MAX_8K_HEIGHT;
    });
  }, [imageDimensions]);

  // Update selected factor if it's no longer available
  useEffect(() => {
    if (!availableUpscaleFactors.includes(selectedUpscaleFactor)) {
      const maxAvailable = Math.max(...availableUpscaleFactors);
      setSelectedUpscaleFactor(maxAvailable);
    }
  }, [availableUpscaleFactors, selectedUpscaleFactor]);

  // Slider marks
  const sliderMarks = useMemo(
    () =>
      availableUpscaleFactors.map((factor) => ({
        value: factor,
        label: `${factor}x`,
      })),
    [availableUpscaleFactors]
  );

  // Helper functions - memoized where beneficial
  const getCurrentResolution = useMemo(() => {
    if (imageDimensions?.width && imageDimensions?.height) {
      return `${imageDimensions.width}×${imageDimensions.height}`;
    }
    return "Unknown";
  }, [imageDimensions]);

  const getResolutionEstimate = (factor: number) => {
    if (imageDimensions?.width && imageDimensions?.height) {
      const newWidth = Math.round(imageDimensions.width * factor);
      const newHeight = Math.round(imageDimensions.height * factor);
      return `${newWidth}×${newHeight}`;
    }

    const baseRes = 512;
    const newRes = Math.round(baseRes * factor);
    return `~${newRes}×${newRes}`;
  };

  const wouldExceed8K = (factor: number) => {
    if (!imageDimensions) return false;

    const newWidth = Math.round(imageDimensions.width * factor);
    const newHeight = Math.round(imageDimensions.height * factor);

    return newWidth > MAX_8K_WIDTH || newHeight > MAX_8K_HEIGHT;
  };

  const getMegapixels = (width: number, height: number) => {
    const megapixels = (width * height) / 1000000;
    return megapixels >= 1
      ? `${megapixels.toFixed(1)}MP`
      : `${(megapixels * 1000).toFixed(0)}KP`;
  };

  const handleUpscaleSubmit = async () => {
    // ✅ UPDATED: For standalone, versionId is not required
    if (!scriptId) {
      return;
    }

    // ✅ UPDATED: For non-standalone types, versionId is required
    if (type !== "standalone" && !versionId) {
      return;
    }

    // Type-specific validation
    if (type === "shots" && (!sceneId || !shotId)) {
      return;
    }
    if (type === "actor" && (!actorId || !actorVersionId)) {
      return;
    }
    if (type === "location" && (!locationId || !locationVersionId)) {
      return;
    }
    // ✅ standalone needs no additional validation

    // Check 8K limit
    if (wouldExceed8K(selectedUpscaleFactor)) {
      console.error("Upscale factor would exceed 8K resolution limit");
      return;
    }

    try {
      resetUpscaleMutation();

      const upscaleParams: UpscaleImageParams = {
        scriptId,
        versionId: versionId || "", // ✅ UPDATED: Empty string for standalone
        type,
        sourceVersion: viewingVersion?.version,
        upscaleFactor: selectedUpscaleFactor,
      };

      // Add type-specific parameters
      if (type === "shots") {
        upscaleParams.sceneId = sceneId;
        upscaleParams.shotId = shotId;
      } else if (type === "actor") {
        upscaleParams.actorId = actorId;
        upscaleParams.actorVersionId = actorVersionId;
      } else if (type === "location") {
        upscaleParams.locationId = locationId;
        upscaleParams.locationVersionId = locationVersionId;
        upscaleParams.promptType = promptType || "wideShotLocationSetPrompt";
      }
      // ✅ standalone needs no additional params

      const upscaleResult = await upscaleImageAsync(upscaleParams);
      onUpscaleComplete(upscaleResult);
    } catch (error) {
      console.error("Error upscaling image:", error);
    }
  };

  const handleCancel = () => {
    resetUpscaleMutation();
    if (onCancel) {
      onCancel();
    }
  };

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    setSelectedUpscaleFactor(newValue as number);
  };

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: `linear-gradient(to top, ${theme.palette.background.paper}f2 0%, ${theme.palette.background.paper}d9 70%, ${theme.palette.background.paper}99 100%)`,
        p: 3,
        pb: 7,
        zIndex: 10,
      }}
    >
      <Stack spacing={1}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="body2"
              color="text.primary"
              fontWeight="medium"
              component="div"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Upscale Version {viewingVersion?.version}
            </Typography>
            <Chip
              label={`${selectedUpscaleFactor}x`}
              size="small"
              color="primary"
              sx={{
                height: 20,
                fontSize: "0.75rem",
                fontFamily: brand.fonts.body,
              }}
            />
            <Chip
              label={getResolutionEstimate(selectedUpscaleFactor)}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.75rem",
                bgcolor: theme.palette.action.selected,
                color: "text.primary",
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: brand.fonts.body,
              }}
            />
          </Stack>
          <IconButton onClick={handleCancel} color="primary" sx={{ p: 0.5 }}>
            <CloseIcon size={16} />
          </IconButton>
        </Stack>

        {/* Error Alert */}
        {upscaleError && (
          <Alert
            severity="error"
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              "& .MuiAlert-message": {
                fontFamily: brand.fonts.body,
              },
            }}
          >
            {upscaleError.message}
          </Alert>
        )}

        {/* Current and Target Resolution Display */}
        <Stack spacing={0}>
          <Stack direction="row" alignItems="center" justifyContent="left">
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Current Resolution:
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Chip
                label={getCurrentResolution}
                size="small"
                sx={{
                  bgcolor: theme.palette.action.hover,
                  color: "text.primary",
                  fontSize: "0.75rem",
                  fontFamily: brand.fonts.body,
                }}
              />
              {imageDimensions && (
                <Chip
                  label={getMegapixels(
                    imageDimensions.width,
                    imageDimensions.height
                  )}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.action.selected,
                    color: "text.secondary",
                    fontSize: "0.7rem",
                    fontFamily: brand.fonts.body,
                  }}
                />
              )}
            </Stack>
          </Stack>
          <Stack direction="row" alignItems="center" justifyContent="left">
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Target Resolution:
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Chip
                label={getResolutionEstimate(selectedUpscaleFactor)}
                size="small"
                color="primary"
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  fontFamily: brand.fonts.body,
                }}
              />
              {imageDimensions && (
                <Chip
                  label={getMegapixels(
                    Math.round(imageDimensions.width * selectedUpscaleFactor),
                    Math.round(imageDimensions.height * selectedUpscaleFactor)
                  )}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.primary.dark,
                    color: theme.palette.getContrastText(
                      theme.palette.primary.dark
                    ),
                    fontSize: "0.7rem",
                    fontFamily: brand.fonts.body,
                  }}
                />
              )}
            </Stack>
          </Stack>
        </Stack>

        {/* 8K Limit Warning */}
        {availableUpscaleFactors.length < UPSCALE_FACTORS.length && (
          <Alert
            severity="warning"
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              "& .MuiAlert-message": {
                fontFamily: brand.fonts.body,
              },
            }}
          >
            <Typography variant="caption" sx={{ fontFamily: brand.fonts.body }}>
              Some upscale factors are disabled to stay within 8K resolution
              limit (7680×4320). Current maximum available:{" "}
              {Math.max(...availableUpscaleFactors)}x
            </Typography>
          </Alert>
        )}

        {/* Info Alert */}
        <Alert
          severity="info"
          sx={{
            borderRadius: `${brand.borderRadius}px`,
            "& .MuiAlert-message": {
              fontFamily: brand.fonts.body,
            },
          }}
        >
          <Typography variant="caption" sx={{ fontFamily: brand.fonts.body }}>
            Upscaling will enhance image resolution from {getCurrentResolution}{" "}
            to {getResolutionEstimate(selectedUpscaleFactor)} (
            {selectedUpscaleFactor}x enlargement).
            {selectedUpscaleFactor >= 4 &&
              " Large factors may take longer to process."}
            {selectedUpscaleFactor >= 6 &&
              " Very high factors may consume significant resources."}
          </Typography>
        </Alert>

        {/* Upscale Factor Slider */}
        <Stack spacing={2}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography
              variant="body2"
              color="text.primary"
              fontWeight="medium"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Upscale Factor
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                label={`${selectedUpscaleFactor}x`}
                size="small"
                color="primary"
                sx={{
                  fontWeight: "bold",
                  fontFamily: brand.fonts.body,
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Max: {Math.max(...availableUpscaleFactors)}x
              </Typography>
            </Stack>
          </Stack>

          <Box sx={{ px: 1 }}>
            <Slider
              value={selectedUpscaleFactor}
              onChange={handleSliderChange}
              min={availableUpscaleFactors[0]}
              max={availableUpscaleFactors[availableUpscaleFactors.length - 1]}
              step={null}
              marks={sliderMarks}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}x`}
              sx={{
                color: "primary.main",
                height: 8,
                "& .MuiSlider-track": {
                  backgroundColor: "primary.main",
                  border: "none",
                },
                "& .MuiSlider-thumb": {
                  backgroundColor: "primary.main",
                  border: `2px solid ${theme.palette.background.paper}`,
                  width: 20,
                  height: 20,
                  "&:hover": {
                    boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}29`,
                  },
                  "&.Mui-focusVisible": {
                    boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}29`,
                  },
                },
                "& .MuiSlider-rail": {
                  backgroundColor: theme.palette.divider,
                },
                "& .MuiSlider-mark": {
                  backgroundColor: theme.palette.text.secondary,
                  height: 6,
                  width: 2,
                },
                "& .MuiSlider-markActive": {
                  backgroundColor: theme.palette.getContrastText(
                    theme.palette.primary.main
                  ),
                },
                "& .MuiSlider-markLabel": {
                  color: "text.secondary",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  fontFamily: brand.fonts.body,
                },
                "& .MuiSlider-valueLabel": {
                  backgroundColor: "primary.main",
                  color: theme.palette.getContrastText(
                    theme.palette.primary.main
                  ),
                  fontWeight: "bold",
                  fontFamily: brand.fonts.body,
                },
              }}
            />
          </Box>
        </Stack>

        {/* Action Buttons */}
        <Stack
          direction="row"
          spacing={2}
          sx={{ mt: 2, justifyContent: "center" }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpscaleSubmit}
            disabled={isUpscaling || wouldExceed8K(selectedUpscaleFactor)}
            size="medium"
            startIcon={<UpscaleIcon size={18} />}
            sx={{
              minWidth: 200,
              fontWeight: "bold",
              py: 1.5,
              borderRadius: `${brand.borderRadius}px`,
              fontFamily: brand.fonts.body,
            }}
          >
            {isUpscaling
              ? "Upscaling..."
              : `Create ${selectedUpscaleFactor}x Version`}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleCancel}
            size="medium"
            sx={{
              minWidth: 100,
              bgcolor: "transparent",
              backdropFilter: "blur(10px)",
              fontWeight: "medium",
              py: 1.5,
              borderRadius: `${brand.borderRadius}px`,
              fontFamily: brand.fonts.body,
            }}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
