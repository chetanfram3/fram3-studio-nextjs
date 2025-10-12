"use client";

// ImageGenerationOverlay.tsx - Fully theme-compliant and performance-optimized
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  IconButton,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  Collapse,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  Close as CloseIcon,
  AutoAwesome as OptimizeIcon,
  Info as InfoIcon,
  ExpandLess as CollapseIcon,
  Casino as RandomIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { ImageVersion } from "@/types/storyBoard/types";
import {
  useImageEditor,
  useImagePrompts,
  useImageGenerationSettings,
  getOptimizationInsights,
  getPromptForVersion,
  getLatestPrompt,
  isAllPromptsResponse,
  type OptimizationResult,
  type GenerateImageParams,
} from "../../hooks/useImageEditor";
import {
  ModelTierSelector,
  useModelTier,
  MODEL_TIERS,
} from "@/components/common/ModelTierSelector";

interface ImageGenerationOverlayProps {
  scriptId: string;
  versionId: string;
  type: "shots" | "keyVisual" | "actor" | "location";
  viewingVersion?: ImageVersion;

  // Shot-specific props
  sceneId?: number;
  shotId?: number;

  // Actor-specific props
  actorId?: number;
  actorVersionId?: number;

  // Location-specific props
  locationId?: number;
  locationVersionId?: number;
  promptType?: string;

  // Callbacks
  onGenerateComplete: (result: unknown) => void;
  onCancel: () => void;
  onDataRefresh?: () => void;
  onGeneratingStateChange?: (isGenerating: boolean) => void;

  // State
  disabled?: boolean;
}

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:3", label: "4:3 (Standard)" },
  { value: "3:4", label: "3:4 (Portrait)" },
  { value: "9:16", label: "9:16 (Vertical)" },
];

export function ImageGenerationOverlay({
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
  onGenerateComplete,
  onCancel,
  onDataRefresh,
  onGeneratingStateChange,
  disabled = false,
}: ImageGenerationOverlayProps) {
  // Theme and brand
  const theme = useTheme();
  const brand = getCurrentBrand();

  // State
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [optimizationData, setOptimizationData] =
    useState<OptimizationResult | null>(null);
  const [showOptimizationInsights, setShowOptimizationInsights] =
    useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [loadingCurrentPrompt, setLoadingCurrentPrompt] = useState(false);

  // Model tier state
  const { modelTier, setModelTier, getSelectedOption } = useModelTier(
    MODEL_TIERS.ULTRA
  );

  // Hook parameters - required by useImageEditor
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
    generateImageAsync,
    isGenerating,
    isOptimizing,
    generateError,
    optimizeError,
    resetGenerateMutation,
    resetOptimizeMutation,
  } = useImageEditor(hookParams);

  const {
    prompt,
    setPrompt,
    aspectRatio,
    setAspectRatio,
    fineTuneId,
    setFineTuneId,
    seed,
    setSeed,
    resetToDefaults,
    generateRandomSeed,
    isValidPrompt,
    isValidSeed,
  } = useImageGenerationSettings();

  // Fetch current version's prompt
  const promptsParams = useMemo(
    () => ({
      scriptId,
      versionId,
      type,
      imageVersion: viewingVersion?.version,
      ...(type === "shots" && { sceneId, shotId }),
      ...(type === "actor" && { actorId, actorVersionId }),
      ...(type === "location" && { locationId, locationVersionId, promptType }),
    }),
    [
      scriptId,
      versionId,
      type,
      viewingVersion?.version,
      sceneId,
      shotId,
      actorId,
      actorVersionId,
      locationId,
      locationVersionId,
      promptType,
    ]
  );

  const {
    data: promptsData,
    isLoading: isLoadingPrompts,
    error: promptsError,
  } = useImagePrompts(promptsParams, true);

  // Memoized selected tier option
  const selectedTierOption = useMemo(() => getSelectedOption(), [modelTier]);

  // Memoized optimization insights
  const optimizationInsights = useMemo(
    () => (optimizationData ? getOptimizationInsights(optimizationData) : null),
    [optimizationData]
  );

  // Load current version's prompt on component mount
  useEffect(() => {
    if (!disabled && promptsData && !isLoadingPrompts) {
      setLoadingCurrentPrompt(true);

      try {
        if (isAllPromptsResponse(promptsData)) {
          const currentPrompt = viewingVersion?.version
            ? getPromptForVersion(promptsData.prompts, viewingVersion.version)
            : getLatestPrompt(promptsData.prompts);

          if (currentPrompt) {
            const promptData =
              "data" in currentPrompt ? currentPrompt.data : currentPrompt;
            if (promptData?.prompt) {
              setPrompt(promptData.prompt);
              if (promptData.aspectRatio) {
                setAspectRatio(promptData.aspectRatio);
              }
              if (promptData.fineTuneId) {
                setFineTuneId(promptData.fineTuneId);
              }
              if (promptData.seed) {
                setSeed(promptData.seed);
              }
            }
          }
        } else {
          if (promptsData.prompt?.prompt) {
            setPrompt(promptsData.prompt.prompt);

            if (promptsData.prompt.aspectRatio) {
              setAspectRatio(promptsData.prompt.aspectRatio);
            }
            if (promptsData.prompt.fineTuneId) {
              setFineTuneId(promptsData.prompt.fineTuneId);
            }
            if (promptsData.prompt.seed) {
              setSeed(promptsData.prompt.seed);
            }
          }
        }
      } catch (error) {
        console.error("Error loading current prompt:", error);
      } finally {
        setLoadingCurrentPrompt(false);
      }
    }
  }, [
    promptsData,
    isLoadingPrompts,
    disabled,
    viewingVersion?.version,
    setPrompt,
    setAspectRatio,
    setFineTuneId,
    setSeed,
  ]);

  // Reset state when overlay opens/closes
  useEffect(() => {
    if (!disabled) {
      setOriginalPrompt("");
      setOptimizationData(null);
      setShowOptimizationInsights(false);
      setShowAdvancedSettings(false);
      setModelTier(MODEL_TIERS.ULTRA);
      resetGenerateMutation();
      resetOptimizeMutation();
    }
  }, [disabled, setModelTier, resetGenerateMutation, resetOptimizeMutation]);

  useEffect(() => {
    if (onGeneratingStateChange) {
      onGeneratingStateChange(isGenerating);
    }
  }, [isGenerating, onGeneratingStateChange]);

  // Handle generation submission
  const handleGenerateSubmit = async () => {
    if (
      !scriptId ||
      !versionId ||
      !prompt.trim() ||
      !isValidPrompt ||
      !isValidSeed
    ) {
      return;
    }

    try {
      resetGenerateMutation();

      const generateParams: GenerateImageParams = {
        scriptId,
        versionId,
        type,
        prompt: prompt.trim(),
        aspectRatio,
        modelTier: modelTier,
        ...(fineTuneId && { fineTuneId }),
        ...(seed !== undefined && { seed }),
      };

      // Add type-specific parameters
      if (type === "shots") {
        if (!sceneId || !shotId) {
          throw new Error("Scene ID and Shot ID are required for shots");
        }
        generateParams.sceneId = sceneId;
        generateParams.shotId = shotId;
      } else if (type === "actor") {
        if (!actorId || !actorVersionId) {
          throw new Error(
            "Actor ID and Actor Version ID are required for actors"
          );
        }
        generateParams.actorId = actorId;
        generateParams.actorVersionId = actorVersionId;
      } else if (type === "location") {
        if (!locationId || !locationVersionId) {
          throw new Error(
            "Location ID and Location Version ID are required for locations"
          );
        }
        generateParams.locationId = locationId;
        generateParams.locationVersionId = locationVersionId;
        generateParams.promptType = promptType || "wideShotLocationSetPrompt";
      }

      const generateResult = await generateImageAsync(generateParams);

      onGenerateComplete(generateResult);

      resetToDefaults();
      setOriginalPrompt("");
      setOptimizationData(null);
      setShowOptimizationInsights(false);
      setShowAdvancedSettings(false);
      setModelTier(MODEL_TIERS.ULTRA);

      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    resetToDefaults();
    setOriginalPrompt("");
    setOptimizationData(null);
    setShowOptimizationInsights(false);
    setShowAdvancedSettings(false);
    setModelTier(MODEL_TIERS.ULTRA);
    resetGenerateMutation();
    resetOptimizeMutation();
    onCancel();
  };

  // Handle refresh current prompt
  // Handle refresh current prompt
  const handleRefreshPrompt = () => {
    if (promptsData && isAllPromptsResponse(promptsData)) {
      const currentPrompt = viewingVersion?.version
        ? getPromptForVersion(promptsData.prompts, viewingVersion.version)
        : getLatestPrompt(promptsData.prompts);

      if (currentPrompt) {
        const promptData =
          "data" in currentPrompt ? currentPrompt.data : currentPrompt;
        if (promptData?.prompt) {
          setPrompt(promptData.prompt);
          if (promptData.aspectRatio) {
            setAspectRatio(promptData.aspectRatio);
          }
        }
      }
    }
  };

  const isProcessing = isGenerating || isOptimizing;

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: `linear-gradient(to top, ${theme.palette.background.paper}f2 0%, ${theme.palette.background.paper}cc 70%, transparent 100%)`,
        p: 3,
        pb: 7,
        zIndex: 10,
      }}
    >
      <Stack spacing={2.5}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography
              variant="body2"
              color="text.primary"
              fontWeight="medium"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Generate New Version
              {viewingVersion?.version && (
                <Chip
                  label={`from v${viewingVersion.version}`}
                  size="small"
                  color="primary"
                  sx={{
                    ml: 1,
                    height: 20,
                    fontSize: "0.75rem",
                    fontFamily: brand.fonts.body,
                  }}
                />
              )}
              {selectedTierOption && (
                <Chip
                  label={selectedTierOption.label}
                  size="small"
                  sx={{
                    ml: 1,
                    height: 20,
                    fontSize: "0.75rem",
                    bgcolor: selectedTierOption.color,
                    color: theme.palette.getContrastText(
                      selectedTierOption.color
                    ),
                    fontFamily: brand.fonts.body,
                  }}
                />
              )}
            </Typography>
            {/* Loading indicator */}
            {(loadingCurrentPrompt || isLoadingPrompts) && (
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  border: `2px solid ${theme.palette.divider}`,
                  borderTop: `2px solid ${theme.palette.primary.main}`,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
            )}
          </Stack>
          <IconButton
            onClick={handleCancel}
            disabled={isProcessing}
            color="primary"
            sx={{ p: 0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Error Alerts */}
        {generateError && (
          <Alert
            severity="error"
            sx={{
              mb: 1,
              borderRadius: `${brand.borderRadius}px`,
              "& .MuiAlert-message": {
                fontFamily: brand.fonts.body,
              },
            }}
          >
            {generateError.message}
          </Alert>
        )}

        {promptsError && (
          <Alert
            severity="warning"
            sx={{
              mb: 1,
              borderRadius: `${brand.borderRadius}px`,
              "& .MuiAlert-message": {
                fontFamily: brand.fonts.body,
              },
            }}
          >
            Could not load current prompt: {promptsError.message}
          </Alert>
        )}

        {/* Prompt Input */}
        <TextField
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
          label="Generation Prompt"
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          variant="outlined"
          size="small"
          disabled={isProcessing || disabled || loadingCurrentPrompt}
          error={!isValidPrompt && prompt.length > 0}
          helperText={
            !isValidPrompt && prompt.length > 0
              ? "Prompt must be between 1-5000 characters"
              : `${prompt.length}/5000 characters`
          }
          InputProps={{
            endAdornment: prompt.trim() && (
              <Stack direction="row" spacing={0.5} sx={{ mr: 1 }}>
                {/* Refresh current prompt button */}
                <Tooltip title="Reload current version's prompt">
                  <IconButton
                    size="small"
                    onClick={handleRefreshPrompt}
                    disabled={
                      disabled || loadingCurrentPrompt || isLoadingPrompts
                    }
                    color="primary"
                    sx={{
                      opacity: 0.8,
                      "&:hover": { opacity: 1 },
                    }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Optimization insights button */}
                {optimizationData && (
                  <Tooltip title="View optimization insights">
                    <IconButton
                      size="small"
                      onClick={() =>
                        setShowOptimizationInsights(!showOptimizationInsights)
                      }
                      disabled={disabled}
                      color="primary"
                      sx={{
                        opacity: 0.8,
                        "&:hover": { opacity: 1 },
                      }}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: isProcessing
                ? theme.palette.action.hover
                : theme.palette.action.selected,
              backdropFilter: "blur(10px)",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${brand.borderRadius}px`,
              fontFamily: brand.fonts.body,
              "& fieldset": {
                border: "none",
              },
              "&:hover fieldset": {
                border: "none",
              },
              "&.Mui-focused": {
                borderColor: "primary.main",
              },
              "& input, & textarea": {
                color: "text.primary",
                fontSize: "0.875rem",
                fontWeight: 500,
                fontFamily: brand.fonts.body,
                "&::placeholder": {
                  color: "text.secondary",
                  opacity: 0.7,
                },
              },
            },
            "& .MuiInputLabel-root": {
              color: "text.secondary",
              fontFamily: brand.fonts.body,
              "&.Mui-focused": {
                color: "primary.main",
              },
            },
            "& .MuiFormHelperText-root": {
              color: "text.secondary",
              fontFamily: brand.fonts.body,
              "&.Mui-error": {
                color: "error.main",
              },
            },
          }}
        />

        {/* Quick Settings Row */}
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Aspect Ratio */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel
              sx={{
                color: "text.secondary",
                fontFamily: brand.fonts.body,
                "&.Mui-focused": {
                  color: "primary.main",
                },
              }}
            >
              Aspect Ratio
            </InputLabel>
            <Select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              label="Aspect Ratio"
              disabled={disabled}
              sx={{
                bgcolor: theme.palette.action.selected,
                color: "text.primary",
                fontFamily: brand.fonts.body,
                borderRadius: `${brand.borderRadius}px`,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "divider",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
                "& .MuiSvgIcon-root": {
                  color: "text.primary",
                },
              }}
            >
              {ASPECT_RATIOS.map((ratio) => (
                <MenuItem
                  key={ratio.value}
                  value={ratio.value}
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {ratio.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Advanced Settings Toggle */}
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            disabled={disabled}
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              fontFamily: brand.fonts.body,
            }}
          >
            Advanced {showAdvancedSettings ? "▲" : "▼"}
          </Button>

          {/* Model Tier Selector */}
          <ModelTierSelector
            value={modelTier}
            onChange={setModelTier}
            disabled={isProcessing || disabled}
            showDescription={true}
            compact={true}
          />
        </Stack>

        {/* Advanced Settings */}
        <Collapse in={showAdvancedSettings}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              {/* Fine-tune ID */}
              <TextField
                label="Fine-tune Model ID (Optional)"
                value={fineTuneId}
                onChange={(e) => setFineTuneId(e.target.value)}
                size="small"
                disabled={disabled}
                placeholder="ft-model-123abc"
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: theme.palette.action.selected,
                    color: "text.primary",
                    fontFamily: brand.fonts.body,
                    borderRadius: `${brand.borderRadius}px`,
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "text.secondary",
                    fontFamily: brand.fonts.body,
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                }}
              />

              {/* Seed */}
              <TextField
                label="Seed (Optional)"
                type="number"
                value={seed || ""}
                onChange={(e) =>
                  setSeed(e.target.value ? parseInt(e.target.value) : undefined)
                }
                size="small"
                disabled={disabled}
                error={!isValidSeed}
                helperText={!isValidSeed ? "Must be 0-2147483647" : ""}
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Generate random seed">
                      <IconButton
                        size="small"
                        onClick={generateRandomSeed}
                        disabled={disabled}
                        color="primary"
                      >
                        <RandomIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: theme.palette.action.selected,
                    color: "text.primary",
                    fontFamily: brand.fonts.body,
                    borderRadius: `${brand.borderRadius}px`,
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "text.secondary",
                    fontFamily: brand.fonts.body,
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                  "& .MuiFormHelperText-root": {
                    color: "text.secondary",
                    fontFamily: brand.fonts.body,
                    "&.Mui-error": {
                      color: "error.main",
                    },
                  },
                }}
              />
            </Stack>
          </Stack>
        </Collapse>

        {/* Optimization Insights Panel */}
        {optimizationData && showOptimizationInsights && (
          <Collapse in={showOptimizationInsights}>
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: theme.palette.action.hover,
                backdropFilter: "blur(10px)",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography
                    variant="caption"
                    color="text.primary"
                    fontWeight="medium"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Optimization Insights
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setShowOptimizationInsights(false)}
                    color="primary"
                    sx={{ p: 0.5 }}
                  >
                    <CollapseIcon fontSize="small" />
                  </IconButton>
                </Stack>

                {optimizationInsights && (
                  <Stack spacing={1}>
                    {optimizationInsights.strategy && (
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          Strategy:
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.primary"
                          sx={{ ml: 1, fontFamily: brand.fonts.body }}
                        >
                          {optimizationInsights.strategy}
                        </Typography>
                      </Box>
                    )}

                    {optimizationInsights.confidence !== undefined && (
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          Confidence:
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.primary"
                          sx={{ ml: 1, fontFamily: brand.fonts.body }}
                        >
                          {Math.round(optimizationInsights.confidence * 100)}%
                        </Typography>
                      </Box>
                    )}

                    {originalPrompt && originalPrompt !== prompt && (
                      <Box>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            setPrompt(originalPrompt);
                            setOptimizationData(null);
                            setShowOptimizationInsights(false);
                          }}
                          disabled={disabled}
                          sx={{
                            fontSize: "0.7rem",
                            py: 0.5,
                            borderRadius: `${brand.borderRadius}px`,
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          Revert to Original
                        </Button>
                      </Box>
                    )}
                  </Stack>
                )}
              </Stack>
            </Box>
          </Collapse>
        )}

        {/* Optimization Error */}
        {optimizeError && (
          <Alert
            severity="error"
            sx={{
              mt: 1,
              borderRadius: `${brand.borderRadius}px`,
              "& .MuiAlert-message": {
                fontFamily: brand.fonts.body,
              },
            }}
          >
            {optimizeError.message}
          </Alert>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateSubmit}
            disabled={
              !isValidPrompt ||
              !isValidSeed ||
              isProcessing ||
              disabled ||
              loadingCurrentPrompt
            }
            size="small"
            startIcon={selectedTierOption?.icon || <OptimizeIcon />}
            sx={{
              minWidth: 120,
              borderRadius: `${brand.borderRadius}px`,
              fontFamily: brand.fonts.body,
              ...(selectedTierOption && {
                bgcolor: selectedTierOption.color,
                color: theme.palette.getContrastText(selectedTierOption.color),
                "&:hover": {
                  bgcolor: `${selectedTierOption.color}dd`,
                },
              }),
            }}
          >
            {isGenerating
              ? `Generating with ${selectedTierOption?.label || "AI"}...`
              : `Generate with ${selectedTierOption?.label || "AI"}`}
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={handleCancel}
            disabled={isProcessing}
            size="small"
            sx={{
              bgcolor: "transparent",
              backdropFilter: "blur(10px)",
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
