"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Chip,
  Slider,
  Collapse,
  Tooltip,
  IconButton,
  alpha,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockIcon from "@mui/icons-material/LockOutlined";
import { ChevronDown } from "lucide-react";
import {
  SubscriptionLevels,
  PlanLevel,
  PLAN_TO_LEVEL,
  processorSteps,
} from "@/config/constants";
import { useSubscription } from "@/hooks/auth/useSubscription";
import {
  ModelTierSelector,
  MODEL_TIERS,
  type ModelTier,
} from "./ModelTierSelector";

// Define processing mode types
export type ProcessingMode = "quick" | "moderate" | "normal" | "detailed";
export type AspectRatio = "16:9" | "9:16";

// Model tier configuration interface
export interface ModelTierConfig {
  image: ModelTier;
  audio: ModelTier;
  video: ModelTier;
}

// Map processing modes to their values (for slider) and restrictions
const PROCESSING_MODES: {
  [key: number]: {
    value: ProcessingMode;
    label: string;
    description: string;
    minPlan: PlanLevel;
  };
} = {
  0: {
    value: "quick",
    label: "Quick",
    description: "Faster processing with basic analysis",
    minPlan: PlanLevel.STARTER,
  },
  1: {
    value: "moderate",
    label: "Moderate",
    description: "Balanced speed and detail",
    minPlan: PlanLevel.STARTER,
  },
  2: {
    value: "normal",
    label: "Normal",
    description: "Standard processing with good detail",
    minPlan: PlanLevel.STARTER,
  },
  3: {
    value: "detailed",
    label: "Detailed",
    description: "In-depth analysis with maximum detail",
    minPlan: PlanLevel.PREMIUM,
  },
};

// Aspect ratio options
const ASPECT_RATIO_OPTIONS: {
  [key in AspectRatio]: {
    label: string;
    description: string;
    minPlan: PlanLevel;
  };
} = {
  "16:9": {
    label: "16:9",
    description: "Landscape - Perfect for YouTube, desktop viewing",
    minPlan: PlanLevel.STARTER,
  },
  "9:16": {
    label: "9:16",
    description: "Portrait - Ideal for TikTok, Instagram Stories, mobile",
    minPlan: PlanLevel.STARTER,
  },
};

interface ProcessingModeSelectorProps {
  onChange: (
    mode: ProcessingMode,
    aspectRatio: AspectRatio,
    pauseBeforeSettings: string[],
    modelTiers: ModelTierConfig
  ) => void;
  initialMode?: ProcessingMode;
  initialAspectRatio?: AspectRatio;
  initialGenerateImages?: boolean;
  initialGenerateAudio?: boolean;
  initialGenerateVideo?: boolean;
  initialModelTiers?: Partial<ModelTierConfig>;
  className?: string;
  defaultExpanded?: boolean;
}

/**
 * ProcessingModeSelector
 *
 * Advanced selector for processing mode, aspect ratio, and AI model tiers.
 * Fully theme-aware and optimized with React 19 patterns.
 */
const ProcessingModeSelector: React.FC<ProcessingModeSelectorProps> = ({
  onChange,
  initialMode = "normal",
  initialAspectRatio = "16:9",
  initialGenerateImages = true,
  initialGenerateAudio = true,
  initialGenerateVideo = true,
  initialModelTiers = {},
  className,
  defaultExpanded = false,
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Use useSubscription hook
  const { subscription, hasFeatureAccess } = useSubscription();
  const userPlanLevel = PLAN_TO_LEVEL[subscription] || PlanLevel.STARTER;

  // Expanded state
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Find initial slider value
  const getInitialValue = useCallback((): number => {
    const entry = Object.entries(PROCESSING_MODES).find(
      ([_, modeInfo]) => modeInfo.value === initialMode
    );
    return entry ? parseInt(entry[0]) : 2; // Default to "normal" (index 2)
  }, [initialMode]);

  const [value, setValue] = useState<number>(getInitialValue());
  const [aspectRatio, setAspectRatio] =
    useState<AspectRatio>(initialAspectRatio);

  // Checkbox states
  const [generateImages, setGenerateImages] = useState<boolean>(
    initialGenerateImages
  );
  const [generateAudio, setGenerateAudio] =
    useState<boolean>(initialGenerateAudio);
  const [generateVideo, setGenerateVideo] =
    useState<boolean>(initialGenerateVideo);

  // Model tier states with defaults to ULTRA (4)
  const [modelTiers, setModelTiers] = useState<ModelTierConfig>({
    image: initialModelTiers.image || MODEL_TIERS.ULTRA,
    audio: initialModelTiers.audio || MODEL_TIERS.ULTRA,
    video: initialModelTiers.video || MODEL_TIERS.ULTRA,
  });

  // Selected mode
  const [selectedMode, setSelectedMode] = useState<ProcessingMode>(
    PROCESSING_MODES[value]?.value || "normal"
  );

  // Calculate pauseBefore settings
  const calculatePauseBeforeSettings = useCallback(
    (images: boolean, audio: boolean, video: boolean): string[] => {
      const pauseBeforeSteps = new Set<string>();

      // If images are disabled, pause before IMAGE processing steps
      if (!images) {
        processorSteps.images.forEach((step) => pauseBeforeSteps.add(step));
        processorSteps.scenes.forEach((step) => pauseBeforeSteps.add(step));
      }

      // If audio is disabled, pause before AUDIO processing steps
      if (!audio) {
        processorSteps.audio.forEach((step) => pauseBeforeSteps.add(step));
      }

      // If video is disabled, pause before VIDEO processing steps
      if (!video) {
        processorSteps.video.forEach((step) => pauseBeforeSteps.add(step));
      }

      // Create pipeline order for consistent ordering
      const pipelineOrder = [
        ...processorSteps.images,
        ...processorSteps.scenes,
        ...processorSteps.audio,
        ...processorSteps.video,
      ];

      return pipelineOrder.filter((step) => pauseBeforeSteps.has(step));
    },
    []
  );

  // Centralized function to trigger onChange
  const triggerOnChange = useCallback(
    (
      mode?: ProcessingMode,
      ratio?: AspectRatio,
      images?: boolean,
      audio?: boolean,
      video?: boolean,
      tiers?: ModelTierConfig
    ) => {
      const currentMode = mode !== undefined ? mode : selectedMode;
      const currentRatio = ratio !== undefined ? ratio : aspectRatio;
      const currentImages = images !== undefined ? images : generateImages;
      const currentAudio = audio !== undefined ? audio : generateAudio;
      const currentVideo = video !== undefined ? video : generateVideo;
      const currentTiers = tiers !== undefined ? tiers : modelTiers;

      const pauseBeforeSettings = calculatePauseBeforeSettings(
        currentImages,
        currentAudio,
        currentVideo
      );

      onChange(currentMode, currentRatio, pauseBeforeSettings, currentTiers);
    },
    [
      selectedMode,
      aspectRatio,
      generateImages,
      generateAudio,
      generateVideo,
      modelTiers,
      calculatePauseBeforeSettings,
      onChange,
    ]
  );

  // Handle slider change
  const handleSliderChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      const numericValue = Array.isArray(newValue) ? newValue[0] : newValue;
      setValue(numericValue);

      const modeInfo = PROCESSING_MODES[numericValue];

      // Only allow change if user has permission
      if (modeInfo && userPlanLevel >= modeInfo.minPlan) {
        const newSelectedMode = modeInfo.value;
        setSelectedMode(newSelectedMode);
        triggerOnChange(newSelectedMode);
      }
    },
    [userPlanLevel, triggerOnChange]
  );

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newAspectRatio: AspectRatio | null) => {
      if (newAspectRatio !== null) {
        setAspectRatio(newAspectRatio);
        triggerOnChange(undefined, newAspectRatio);
      }
    },
    [triggerOnChange]
  );

  // Handle checkbox changes
  const handleGenerateImagesChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.checked;
      setGenerateImages(newValue);
      triggerOnChange(undefined, undefined, newValue);
    },
    [triggerOnChange]
  );

  const handleGenerateAudioChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.checked;
      setGenerateAudio(newValue);
      triggerOnChange(undefined, undefined, undefined, newValue);
    },
    [triggerOnChange]
  );

  const handleGenerateVideoChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.checked;
      setGenerateVideo(newValue);
      triggerOnChange(undefined, undefined, undefined, undefined, newValue);
    },
    [triggerOnChange]
  );

  // Handle model tier changes
  const handleImageTierChange = useCallback(
    (tier: ModelTier) => {
      const newModelTiers = { ...modelTiers, image: tier };
      setModelTiers(newModelTiers);
      triggerOnChange(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        newModelTiers
      );
    },
    [modelTiers, triggerOnChange]
  );

  const handleAudioTierChange = useCallback(
    (tier: ModelTier) => {
      const newModelTiers = { ...modelTiers, audio: tier };
      setModelTiers(newModelTiers);
      triggerOnChange(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        newModelTiers
      );
    },
    [modelTiers, triggerOnChange]
  );

  const handleVideoTierChange = useCallback(
    (tier: ModelTier) => {
      const newModelTiers = { ...modelTiers, video: tier };
      setModelTiers(newModelTiers);
      triggerOnChange(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        newModelTiers
      );
    },
    [modelTiers, triggerOnChange]
  );

  // Get tooltip text
  const getTooltipText = useCallback(
    (sliderValue: number) => {
      const modeInfo = PROCESSING_MODES[sliderValue];
      if (userPlanLevel < modeInfo.minPlan) {
        const requiredPlan = Object.keys(SubscriptionLevels).find(
          (key) =>
            PLAN_TO_LEVEL[
              SubscriptionLevels[key as keyof typeof SubscriptionLevels]
            ] === modeInfo.minPlan
        );
        return `Requires ${requiredPlan?.toLowerCase() || "premium"} plan or higher`;
      }
      return modeInfo.description;
    },
    [userPlanLevel]
  );

  // Set initial mode on mount
  useEffect(() => {
    const newValue = getInitialValue();
    setValue(newValue);

    const modeInfo = PROCESSING_MODES[newValue];
    if (modeInfo && userPlanLevel >= modeInfo.minPlan) {
      setSelectedMode(modeInfo.value);
    }
  }, [initialMode, userPlanLevel, getInitialValue]);

  // Initial trigger on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerOnChange();
    }, 0);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{ mb: 0 }} className={className}>
      <Box
        sx={{
          backgroundColor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
          transition: theme.transitions.create(["border-color"], {
            duration: theme.transitions.duration.short,
          }),
        }}
      >
        {/* Accordion Header */}
        <Box
          onClick={() => setExpanded((prev) => !prev)}
          sx={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 1.5,
            borderBottom: expanded ? 1 : 0,
            borderBottomColor: "divider",
            transition: theme.transitions.create(["background-color"], {
              duration: theme.transitions.duration.short,
            }),
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: brand.fonts.body,
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              Processing Mode
            </Typography>
            <Chip
              label={PROCESSING_MODES[value].label}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: "primary.main",
                fontSize: "0.75rem",
                height: 20,
                fontWeight: 600,
                fontFamily: brand.fonts.body,
                border: 1,
                borderColor: alpha(theme.palette.primary.main, 0.3),
              }}
            />
            <Typography variant="body2" color="text.secondary">
              •
            </Typography>
            <Chip
              label={aspectRatio}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: "primary.main",
                fontSize: "0.75rem",
                height: 20,
                fontWeight: 600,
                fontFamily: brand.fonts.body,
                border: 1,
                borderColor: alpha(theme.palette.primary.main, 0.3),
              }}
            />
            <Typography variant="body2" color="text.secondary">
              •
            </Typography>
            <Chip
              label={`AI: ${modelTiers.image}/${modelTiers.audio}/${modelTiers.video}`}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.15),
                color: "warning.main",
                fontSize: "0.75rem",
                height: 20,
                fontWeight: 600,
                fontFamily: brand.fonts.body,
                border: 1,
                borderColor: alpha(theme.palette.warning.main, 0.3),
              }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="Select processing mode, aspect ratio, and AI model tiers">
              <InfoOutlinedIcon
                fontSize="small"
                sx={{
                  color: "text.secondary",
                  cursor: "help",
                  mr: 1,
                  fontSize: 16,
                }}
              />
            </Tooltip>
            <IconButton
              size="small"
              sx={{
                color: "primary.main",
                transition: theme.transitions.create(
                  ["background-color", "color"],
                  {
                    duration: theme.transitions.duration.short,
                  }
                ),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <ChevronDown
                size={18}
                style={{
                  transition: "transform 0.2s ease",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </IconButton>
          </Box>
        </Box>

        {/* Collapsible Content */}
        <Collapse in={expanded}>
          <Box sx={{ px: 2, py: 2 }}>
            {/* Processing Mode Section */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  fontFamily: brand.fonts.heading,
                  color: "text.primary",
                }}
              >
                Processing Mode
              </Typography>

              {/* Mode labels for slider */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                  px: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: brand.fonts.body,
                    color: "text.secondary",
                  }}
                >
                  Quick
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: brand.fonts.body,
                    color: "text.secondary",
                  }}
                >
                  Detailed
                </Typography>
              </Box>

              {/* Enhanced Slider */}
              <Slider
                value={value}
                onChange={handleSliderChange}
                step={null}
                min={0}
                max={3}
                marks={[
                  { value: 0, label: "" },
                  { value: 1, label: "" },
                  { value: 2, label: "" },
                  { value: 3, label: "" },
                ]}
                sx={{
                  color: "primary.main",
                  height: 8,
                  "& .MuiSlider-track": {
                    border: "none",
                    height: 8,
                  },
                  "& .MuiSlider-rail": {
                    height: 8,
                    opacity: 0.3,
                    backgroundColor:
                      theme.palette.mode === "light"
                        ? "rgba(0, 0, 0, 0.15)"
                        : "rgba(255, 255, 255, 0.15)",
                  },
                  "& .MuiSlider-thumb": {
                    height: 18,
                    width: 18,
                    border: 2,
                    borderColor: "background.paper",
                    backgroundColor: "primary.main",
                    transition: theme.transitions.create(["box-shadow"], {
                      duration: theme.transitions.duration.short,
                    }),
                    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
                      boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`,
                    },
                  },
                  "& .MuiSlider-mark": {
                    backgroundColor: "primary.main",
                    height: 8,
                    width: 8,
                    borderRadius: "50%",
                    marginTop: 0,
                  },
                }}
              />

              {/* Mode Description */}
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                }}
              >
                {PROCESSING_MODES[value].description}
              </Typography>
            </Box>

            {/* Aspect Ratio Section */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  fontFamily: brand.fonts.heading,
                  color: "text.primary",
                }}
              >
                Aspect Ratio
              </Typography>

              <ToggleButtonGroup
                value={aspectRatio}
                exclusive
                onChange={handleAspectRatioChange}
                aria-label="aspect ratio"
                sx={{
                  display: "flex",
                  width: "100%",
                  "& .MuiToggleButton-root": {
                    flex: 1,
                    py: 1,
                    border: 1,
                    borderColor: "divider",
                    fontFamily: brand.fonts.body,
                    transition: theme.transitions.create(
                      ["background-color", "border-color", "color"],
                      {
                        duration: theme.transitions.duration.short,
                      }
                    ),
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      borderColor: "primary.main",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    },
                    "&:not(.Mui-selected)": {
                      color: "text.primary",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        borderColor: "primary.main",
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="16:9" aria-label="16:9 landscape">
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      16:9
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          aspectRatio === "16:9"
                            ? "primary.contrastText"
                            : "text.secondary",
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      Landscape
                    </Typography>
                  </Box>
                </ToggleButton>
                <ToggleButton value="9:16" aria-label="9:16 portrait">
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      9:16
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          aspectRatio === "9:16"
                            ? "primary.contrastText"
                            : "text.secondary",
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      Portrait
                    </Typography>
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Aspect Ratio Description */}
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  display: "block",
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                }}
              >
                {ASPECT_RATIO_OPTIONS[aspectRatio].description}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Model Tier Selection Section */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  fontFamily: brand.fonts.heading,
                  color: "text.primary",
                }}
              >
                AI Model Quality Tiers
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Image Model Tier */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      minWidth: 80,
                      fontWeight: 500,
                      fontFamily: brand.fonts.body,
                      color: "text.primary",
                    }}
                  >
                    Images:
                  </Typography>
                  <ModelTierSelector
                    value={modelTiers.image}
                    onChange={handleImageTierChange}
                    disabled={false}
                    compact={true}
                    showDescription={false}
                  />
                </Box>

                {/* Audio Model Tier */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      minWidth: 80,
                      fontWeight: 500,
                      fontFamily: brand.fonts.body,
                      color: "text.primary",
                    }}
                  >
                    Audio:
                  </Typography>
                  <ModelTierSelector
                    value={modelTiers.audio}
                    onChange={handleAudioTierChange}
                    disabled={false}
                    compact={true}
                    showDescription={false}
                  />
                </Box>

                {/* Video Model Tier */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      minWidth: 80,
                      fontWeight: 500,
                      fontFamily: brand.fonts.body,
                      color: "text.primary",
                    }}
                  >
                    Video:
                  </Typography>
                  <ModelTierSelector
                    value={modelTiers.video}
                    onChange={handleVideoTierChange}
                    disabled={false}
                    compact={true}
                    showDescription={false}
                  />
                </Box>
              </Box>

              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  display: "block",
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                }}
              >
                Higher tiers provide better quality but use more credits.
                Disabled options will use minimal resources.
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Processing Options Section */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  fontFamily: brand.fonts.heading,
                  color: "text.primary",
                }}
              >
                Processing Options
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={generateImages}
                      onChange={handleGenerateImagesChange}
                      size="small"
                      sx={{
                        color: "primary.main",
                        "&.Mui-checked": {
                          color: "primary.main",
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: brand.fonts.body,
                          color: "text.primary",
                        }}
                      >
                        Generate Images
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        {generateImages
                          ? "Will generate images for scenes"
                          : "Will pause before scene processing"}
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={generateAudio}
                      onChange={handleGenerateAudioChange}
                      size="small"
                      sx={{
                        color: "primary.main",
                        "&.Mui-checked": {
                          color: "primary.main",
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: brand.fonts.body,
                          color: "text.primary",
                        }}
                      >
                        Generate Audio
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        {generateAudio
                          ? "Will generate audio for video"
                          : "Will pause before audio processing"}
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={generateVideo}
                      onChange={handleGenerateVideoChange}
                      size="small"
                      sx={{
                        color: "primary.main",
                        "&.Mui-checked": {
                          color: "primary.main",
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: brand.fonts.body,
                          color: "text.primary",
                        }}
                      >
                        Generate Video
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        {generateVideo
                          ? "Will generate video content"
                          : "Will pause before video processing"}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Box>

            {/* Restrictions */}
            {userPlanLevel < PROCESSING_MODES[3].minPlan && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  p: 1,
                  borderRadius: `${brand.borderRadius}px`,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  border: 1,
                  borderColor: alpha(theme.palette.warning.main, 0.3),
                }}
              >
                <LockIcon
                  sx={{
                    fontSize: 16,
                    color: "warning.main",
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: "warning.main",
                    fontFamily: brand.fonts.body,
                    fontWeight: 500,
                  }}
                >
                  Detailed mode requires Premium plan
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

ProcessingModeSelector.displayName = "ProcessingModeSelector";

export default ProcessingModeSelector;
