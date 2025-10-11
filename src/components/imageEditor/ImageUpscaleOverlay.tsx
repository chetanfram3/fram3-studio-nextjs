"use client";

// ImageUpscaleOverlay.tsx
import React, { useState, useMemo } from "react";
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
import { useImageEditor } from "../../hooks/useImageEditor";

interface ImageUpscaleOverlayProps {
  // Required props
  scriptId: string;
  versionId: string;
  type: "shots" | "actor" | "location" | "keyVisual";
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
  onUpscaleComplete: (result: any) => void;
  onCancel?: () => void;
  onDataRefresh?: () => void;
  onUpscalingStateChange?: (isUpscaling: boolean) => void;

  // State control
  disabled?: boolean;

  // Optional styling
  buttonSx?: any;
}

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
  onDataRefresh,
  onUpscalingStateChange,
  disabled = false,
  buttonSx = {},
}: ImageUpscaleOverlayProps) {
  // Local state
  const [selectedUpscaleFactor, setSelectedUpscaleFactor] = useState<number>(2);

  // Hooks
  const {
    upscaleImageAsync,
    isUpscaling,
    error: upscaleError,
    resetUpscaleMutation,
  } = useImageEditor();

  // DEBUG: Add effect to monitor isUpscaling changes
  React.useEffect(() => {
    console.log(
      "🔍 isUpscaling state changed in ImageUpscaleOverlay:",
      isUpscaling
    );
    // NEW: Notify parent of upscaling state change
    if (onUpscalingStateChange) {
      onUpscalingStateChange(isUpscaling);
    }
  }, [isUpscaling, onUpscalingStateChange]);

  // Available upscale factors for slider
  const upscaleFactors = [1.5, 2, 3, 4, 6, 8];

  // 8K resolution limit (7680 x 4320)
  const MAX_8K_WIDTH = 7680;
  const MAX_8K_HEIGHT = 4320;

  // Calculate available upscale factors based on 8K limit
  const availableUpscaleFactors = useMemo(() => {
    if (!imageDimensions) {
      return upscaleFactors; // If no dimensions, allow all factors
    }

    const { width, height } = imageDimensions;

    return upscaleFactors.filter((factor) => {
      const newWidth = Math.round(width * factor);
      const newHeight = Math.round(height * factor);

      // Check if either dimension would exceed 8K
      return newWidth <= MAX_8K_WIDTH && newHeight <= MAX_8K_HEIGHT;
    });
  }, [imageDimensions]);

  // Update selected factor if it's no longer available
  React.useEffect(() => {
    if (!availableUpscaleFactors.includes(selectedUpscaleFactor)) {
      const maxAvailable = Math.max(...availableUpscaleFactors);
      setSelectedUpscaleFactor(maxAvailable);
    }
  }, [availableUpscaleFactors, selectedUpscaleFactor]);

  // Slider marks for better UX
  const sliderMarks = availableUpscaleFactors.map((factor) => ({
    value: factor,
    label: `${factor}x`,
  }));

  // Get current resolution display
  const getCurrentResolution = () => {
    if (imageDimensions?.width && imageDimensions?.height) {
      return `${imageDimensions.width}×${imageDimensions.height}`;
    }
    return "Unknown";
  };

  // Get resolution estimate using actual dimensions
  const getResolutionEstimate = (factor: number) => {
    if (imageDimensions?.width && imageDimensions?.height) {
      const newWidth = Math.round(imageDimensions.width * factor);
      const newHeight = Math.round(imageDimensions.height * factor);
      return `${newWidth}×${newHeight}`;
    }

    // Fallback to typical dimensions if not provided
    const baseRes = 512;
    const newRes = Math.round(baseRes * factor);
    return `~${newRes}×${newRes}`;
  };

  // Check if upscale would exceed 8K
  const wouldExceed8K = (factor: number) => {
    if (!imageDimensions) return false;

    const newWidth = Math.round(imageDimensions.width * factor);
    const newHeight = Math.round(imageDimensions.height * factor);

    return newWidth > MAX_8K_WIDTH || newHeight > MAX_8K_HEIGHT;
  };

  // Get megapixel count
  const getMegapixels = (width: number, height: number) => {
    const megapixels = (width * height) / 1000000;
    return megapixels >= 1
      ? `${megapixels.toFixed(1)}MP`
      : `${(megapixels * 1000).toFixed(0)}KP`;
  };

  const handleUpscaleSubmit = async () => {
    if (!scriptId || !versionId) {
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

    // Check 8K limit
    if (wouldExceed8K(selectedUpscaleFactor)) {
      console.error("Upscale factor would exceed 8K resolution limit");
      return;
    }

    try {
      console.log("🚀 Starting upscale process...");
      console.log("Current isUpscaling state before:", isUpscaling);

      resetUpscaleMutation();

      const upscaleParams: any = {
        scriptId,
        versionId,
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

      console.log("📤 Calling upscaleImageAsync with params:", upscaleParams);
      console.log("Current isUpscaling state during call:", isUpscaling);

      const upscaleResult = await upscaleImageAsync(upscaleParams);

      console.log("✅ Upscale completed successfully:", upscaleResult);
      console.log("Current isUpscaling state after:", isUpscaling);

      onUpscaleComplete(upscaleResult);
    } catch (error) {
      console.error("❌ Error upscaling image:", error);
      console.log("Current isUpscaling state on error:", isUpscaling);
    }
  };

  const handleCancel = () => {
    resetUpscaleMutation();
    if (onCancel) {
      onCancel();
    }
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setSelectedUpscaleFactor(newValue as number);
  };

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background:
          "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.6) 100%)",
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
              color="white"
              fontWeight="medium"
              component="div"
            >
              Upscale Version {viewingVersion?.version}
            </Typography>
            <Chip
              label={`${selectedUpscaleFactor}x`}
              size="small"
              color="secondary"
              sx={{ height: 20, fontSize: "0.75rem" }}
            />
            {/* NEW: Show estimated resolution next to the factor chip */}
            <Chip
              label={getResolutionEstimate(selectedUpscaleFactor)}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.75rem",
                bgcolor: "rgba(255,255,255,0.15)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            />
          </Stack>
          <IconButton onClick={handleCancel} sx={{ color: "white", p: 0.5 }}>
            <CloseIcon size={16} />
          </IconButton>
        </Stack>

        {/* Show error if there's one */}
        {upscaleError && <Alert severity="error">{upscaleError.message}</Alert>}

        {/* Current and Target Resolution Display */}
        <Stack spacing={0}>
          <Stack direction="row" alignItems="center" justifyContent="left">
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              Current Resolution:
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Chip
                label={getCurrentResolution()}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: "0.75rem",
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
                    bgcolor: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "0.7rem",
                  }}
                />
              )}
            </Stack>
          </Stack>
          <Stack direction="row" alignItems="center" justifyContent="left">
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              Target Resolution:
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Chip
                label={getResolutionEstimate(selectedUpscaleFactor)}
                size="small"
                color="secondary"
                sx={{
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              />
              {imageDimensions && (
                <Chip
                  label={getMegapixels(
                    Math.round(imageDimensions.width * selectedUpscaleFactor),
                    Math.round(imageDimensions.height * selectedUpscaleFactor)
                  )}
                  size="small"
                  color="secondary"
                  sx={{
                    bgcolor: "secondary.dark",
                    color: "secondary.contrastText",
                    fontSize: "0.7rem",
                  }}
                />
              )}
            </Stack>
          </Stack>
        </Stack>

        {/* 8K Limit Warning */}
        {availableUpscaleFactors.length < upscaleFactors.length && (
          <Alert severity="warning">
            <Typography variant="caption">
              Some upscale factors are disabled to stay within 8K resolution
              limit (7680×4320). Current maximum available:{" "}
              {Math.max(...availableUpscaleFactors)}x
            </Typography>
          </Alert>
        )}

        {/* Info Alert */}
        <Alert severity="info">
          <Typography variant="caption">
            Upscaling will enhance image resolution from{" "}
            {getCurrentResolution()} to{" "}
            {getResolutionEstimate(selectedUpscaleFactor)} (
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
            <Typography variant="body2" color="white" fontWeight="medium">
              Upscale Factor
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                label={`${selectedUpscaleFactor}x`}
                size="small"
                color="secondary"
                sx={{
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
                  fontWeight: "bold",
                }}
              />
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
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
                color: "secondary.main",
                height: 8,
                "& .MuiSlider-track": {
                  backgroundColor: "secondary.main",
                  border: "none",
                },
                "& .MuiSlider-thumb": {
                  backgroundColor: "secondary.main",
                  border: "2px solid",
                  borderColor: "primary.main",
                  width: 20,
                  height: 20,
                  "&:hover": {
                    boxShadow: `0px 0px 0px 8px rgba(144, 202, 249, 0.16)`,
                  },
                  "&.Mui-focusVisible": {
                    boxShadow: `0px 0px 0px 8px rgba(144, 202, 249, 0.16)`,
                  },
                },
                "& .MuiSlider-rail": {
                  backgroundColor: "rgba(255,255,255,0.3)",
                },
                "& .MuiSlider-mark": {
                  backgroundColor: "rgba(255,255,255,0.5)",
                  height: 6,
                  width: 2,
                },
                "& .MuiSlider-markActive": {
                  backgroundColor: "secondary.contrastText",
                },
                "& .MuiSlider-markLabel": {
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                },
                "& .MuiSlider-valueLabel": {
                  backgroundColor: "secondary.main",
                  color: "secondary.contrastText",
                  fontWeight: "bold",
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
            onClick={handleUpscaleSubmit}
            disabled={isUpscaling || wouldExceed8K(selectedUpscaleFactor)}
            size="medium"
            startIcon={<UpscaleIcon size={18} />}
            sx={{
              minWidth: 200,
              bgcolor: "secondary.main",
              color: "secondary.contrastText",
              fontWeight: "bold",
              py: 1.5,
              "&:hover": {
                bgcolor: "secondary.dark",
              },
              "&:disabled": {
                bgcolor: "rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.5)",
              },
            }}
          >
            {isUpscaling
              ? "Upscaling..."
              : `Create ${selectedUpscaleFactor}x Version`}
          </Button>
          <Button
            variant="outlined"
            onClick={handleCancel}
            size="medium"
            sx={{
              minWidth: 100,
              color: "white",
              borderColor: "rgba(255,255,255,0.5)",
              bgcolor: "transparent",
              backdropFilter: "blur(10px)",
              fontWeight: "medium",
              py: 1.5,
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.1)",
                borderColor: "white",
              },
            }}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
