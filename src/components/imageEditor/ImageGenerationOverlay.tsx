"use client";

// ImageGenerationOverlay.tsx - Updated with Model Tier Selector
import { useState, useEffect } from "react";
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
import { ImageVersion } from "@/types/storyBoard/types";
import {
  useImageEditor,
  useImagePrompts,
  useImageGenerationSettings,
  getOptimizedPrompt,
  getOptimizationInsights,
  getPromptForVersion,
  getLatestPrompt,
  isAllPromptsResponse,
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
  onGenerateComplete: (result: any) => void;
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
  // State
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [showOptimizationInsights, setShowOptimizationInsights] =
    useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [loadingCurrentPrompt, setLoadingCurrentPrompt] = useState(false);

  // Model tier state
  const { modelTier, setModelTier, getSelectedOption } = useModelTier(
    MODEL_TIERS.ULTRA
  );

  // Hooks
  const {
    generateImageAsync,
    optimizePromptAsync,
    isGenerating,
    isOptimizing,
    generateError,
    optimizeError,
    resetGenerateMutation,
    resetOptimizeMutation,
  } = useImageEditor();

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
  const promptsParams = {
    scriptId,
    versionId,
    type,
    imageVersion: viewingVersion?.version,
    ...(type === "shots" && { sceneId, shotId }),
    ...(type === "actor" && { actorId, actorVersionId }),
    ...(type === "location" && { locationId, locationVersionId, promptType }),
  };

  const {
    data: promptsData,
    isLoading: isLoadingPrompts,
    error: promptsError,
  } = useImagePrompts(promptsParams, true);

  // Load current version's prompt on component mount
  useEffect(() => {
    if (!disabled && promptsData && !isLoadingPrompts) {
      setLoadingCurrentPrompt(true);

      try {
        if (isAllPromptsResponse(promptsData)) {
          // Get prompt for current version or latest if version not specified
          const currentPrompt = viewingVersion?.version
            ? getPromptForVersion(promptsData.prompts, viewingVersion.version)
            : getLatestPrompt(promptsData.prompts);

          if (currentPrompt?.data?.prompt) {
            setPrompt(currentPrompt.data.prompt);

            // Also set other parameters if available
            if (currentPrompt.data.aspectRatio) {
              setAspectRatio(currentPrompt.data.aspectRatio);
            }
            if (currentPrompt.data.fineTuneId) {
              setFineTuneId(currentPrompt.data.fineTuneId);
            }
            if (currentPrompt.data.seed) {
              setSeed(currentPrompt.data.seed);
            }
          }
        } else {
          // Single prompt response
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
      setModelTier(MODEL_TIERS.ULTRA); // Reset to default
      resetGenerateMutation();
      resetOptimizeMutation();
    }
  }, [disabled, setModelTier, resetGenerateMutation, resetOptimizeMutation]);

  useEffect(() => {
    if (onGeneratingStateChange) {
      onGeneratingStateChange(isGenerating);
    }
  }, [isGenerating, onGeneratingStateChange]);

  // Handle prompt optimization
  const handleOptimizePrompt = async () => {
    if (!scriptId || !versionId || !prompt.trim()) {
      return;
    }

    try {
      resetOptimizeMutation();
      setOriginalPrompt(prompt); // Store original prompt

      const optimizeParams: any = {
        scriptId,
        versionId,
        type,
        textPrompt: prompt.trim(),
        sourceVersion: viewingVersion?.version,
        temperature: 0.1,
        topP: 0.8,
      };

      // Add type-specific parameters
      if (type === "shots") {
        if (!sceneId || !shotId) {
          throw new Error("Scene ID and Shot ID are required for shots");
        }
        optimizeParams.sceneId = sceneId;
        optimizeParams.shotId = shotId;
      } else if (type === "actor") {
        if (!actorId || !actorVersionId) {
          throw new Error(
            "Actor ID and Actor Version ID are required for actors"
          );
        }
        optimizeParams.actorId = actorId;
        optimizeParams.actorVersionId = actorVersionId;
      } else if (type === "location") {
        if (!locationId || !locationVersionId) {
          throw new Error(
            "Location ID and Location Version ID are required for locations"
          );
        }
        optimizeParams.locationId = locationId;
        optimizeParams.locationVersionId = locationVersionId;
        optimizeParams.promptType = promptType || "wideShotLocationSetPrompt";
      }

      const result = await optimizePromptAsync(optimizeParams);
      console.log("Optimization result:", result);

      // Extract optimized prompt and update the input
      const optimizedPrompt = getOptimizedPrompt(result);
      if (optimizedPrompt) {
        setPrompt(optimizedPrompt);
        setOptimizationData(result);
      }
    } catch (error) {
      console.error("Error optimizing prompt:", error);
    }
  };

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

      const generateParams: any = {
        scriptId,
        versionId,
        type,
        prompt: prompt.trim(),
        aspectRatio,
        // Add model tier to the request
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
      // keyVisual needs no additional params

      const generateResult = await generateImageAsync(generateParams);
      console.log("Generation completed successfully:", generateResult);

      // Call completion callback
      onGenerateComplete(generateResult);

      // Reset state
      resetToDefaults();
      setOriginalPrompt("");
      setOptimizationData(null);
      setShowOptimizationInsights(false);
      setShowAdvancedSettings(false);
      setModelTier(MODEL_TIERS.ULTRA); // Reset to default

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
    setModelTier(MODEL_TIERS.ULTRA); // Reset to default
    resetGenerateMutation();
    resetOptimizeMutation();
    onCancel();
  };

  // Handle refresh current prompt
  const handleRefreshPrompt = () => {
    if (promptsData && isAllPromptsResponse(promptsData)) {
      const currentPrompt = viewingVersion?.version
        ? getPromptForVersion(promptsData.prompts, viewingVersion.version)
        : getLatestPrompt(promptsData.prompts);

      if (currentPrompt?.data?.prompt) {
        setPrompt(currentPrompt.data.prompt);
        if (currentPrompt.data.aspectRatio) {
          setAspectRatio(currentPrompt.data.aspectRatio);
        }
      }
    }
  };

  const selectedTierOption = getSelectedOption();

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background:
          "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 70%, transparent 100%)",
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
            <Typography variant="body2" color="white" fontWeight="medium">
              Generate New Version
              {viewingVersion?.version && (
                <Chip
                  label={`from v${viewingVersion.version}`}
                  size="small"
                  color="secondary"
                  sx={{ ml: 1, height: 20, fontSize: "0.75rem" }}
                />
              )}
              {/* Show selected model tier */}
              {selectedTierOption && (
                <Chip
                  label={selectedTierOption.label}
                  size="small"
                  sx={{
                    ml: 1,
                    height: 20,
                    fontSize: "0.75rem",
                    bgcolor: selectedTierOption.color,
                    color: "white",
                  }}
                />
              )}
            </Typography>
            {/* Loading indicator for current prompt */}
            {(loadingCurrentPrompt || isLoadingPrompts) && (
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid",
                  borderTopColor: "secondary.main",
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
            disabled={isGenerating || isOptimizing}
            sx={{ color: "white", p: 0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Error Alerts */}
        {generateError && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {generateError.message}
          </Alert>
        )}

        {promptsError && (
          <Alert severity="warning" sx={{ mb: 1 }}>
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
          disabled={isOptimizing || disabled || loadingCurrentPrompt}
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
                    sx={{
                      color: "secondary.main",
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
                      sx={{
                        color: "secondary.main",
                        opacity: 0.8,
                        "&:hover": { opacity: 1 },
                      }}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {/* Optimize prompt button - disabled for generation overlay */}
                {false && (
                  <Tooltip title="Optimize this prompt with AI">
                    <span>
                      <IconButton
                        size="small"
                        onClick={handleOptimizePrompt}
                        disabled={isOptimizing || !prompt.trim() || disabled}
                        sx={{
                          color: "secondary.main",
                          opacity: 0.8,
                          "&:hover": { opacity: 1 },
                          "&:disabled": { opacity: 0.3 },
                        }}
                      >
                        {isOptimizing ? (
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              border: "2px solid rgba(255,255,255,0.3)",
                              borderTop: "2px solid",
                              borderTopColor: "secondary.main",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                              "@keyframes spin": {
                                "0%": { transform: "rotate(0deg)" },
                                "100%": { transform: "rotate(360deg)" },
                              },
                            }}
                          />
                        ) : (
                          <OptimizeIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Stack>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: isOptimizing
                ? "rgba(255,255,255,0.05)"
                : "rgba(255,255,255,0.08)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 1,
              "& fieldset": {
                border: "none",
              },
              "&:hover fieldset": {
                border: "none",
              },
              "&.Mui-focused fieldset": {
                border: "1px solid",
                borderColor: "secondary.main",
              },
              "& input, & textarea": {
                color: "white",
                fontSize: "0.875rem",
                fontWeight: 500,
                "&::placeholder": {
                  color: "rgba(255,255,255,0.7)",
                  opacity: 1,
                },
              },
            },
            "& .MuiInputLabel-root": {
              color: "rgba(255,255,255,0.7)",
              "&.Mui-focused": {
                color: "secondary.main",
              },
            },
            "& .MuiFormHelperText-root": {
              color: "rgba(255,255,255,0.6)",
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
            <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>
              Aspect Ratio
            </InputLabel>
            <Select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              label="Aspect Ratio"
              disabled={disabled}
              sx={{
                bgcolor: "rgba(255,255,255,0.08)",
                color: "white",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.5)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "secondary.main",
                },
                "& .MuiSvgIcon-root": {
                  color: "white",
                },
              }}
            >
              {ASPECT_RATIOS.map((ratio) => (
                <MenuItem key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Advanced Settings Toggle */}
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            disabled={disabled}
            sx={{
              color: "white",
              borderColor: "rgba(255,255,255,0.3)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.1)",
                borderColor: "white",
              },
            }}
          >
            Advanced {showAdvancedSettings ? "▲" : "▼"}
          </Button>

          {/* Model Tier Selector */}
          <ModelTierSelector
            value={modelTier}
            onChange={setModelTier}
            disabled={isOptimizing || isGenerating || disabled}
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
                    bgcolor: "rgba(255,255,255,0.08)",
                    color: "white",
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "secondary.main",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.7)",
                    "&.Mui-focused": {
                      color: "secondary.main",
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
                        sx={{ color: "secondary.main" }}
                      >
                        <RandomIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(255,255,255,0.08)",
                    color: "white",
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "secondary.main",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.7)",
                    "&.Mui-focused": {
                      color: "secondary.main",
                    },
                  },
                  "& .MuiFormHelperText-root": {
                    color: "rgba(255,255,255,0.6)",
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
                bgcolor: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 1,
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
                    color="white"
                    fontWeight="medium"
                  >
                    Optimization Insights
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setShowOptimizationInsights(false)}
                    sx={{ color: "white", p: 0.5 }}
                  >
                    <CollapseIcon fontSize="small" />
                  </IconButton>
                </Stack>

                {(() => {
                  const insights = getOptimizationInsights(optimizationData);
                  return (
                    <Stack spacing={1}>
                      {insights.strategy && (
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: "rgba(255,255,255,0.7)" }}
                          >
                            Strategy:
                          </Typography>
                          <Typography
                            variant="caption"
                            color="white"
                            sx={{ ml: 1 }}
                          >
                            {insights.strategy}
                          </Typography>
                        </Box>
                      )}

                      {insights.confidence !== undefined && (
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: "rgba(255,255,255,0.7)" }}
                          >
                            Confidence:
                          </Typography>
                          <Typography
                            variant="caption"
                            color="white"
                            sx={{ ml: 1 }}
                          >
                            {Math.round(insights.confidence * 100)}%
                          </Typography>
                        </Box>
                      )}

                      {originalPrompt && originalPrompt !== prompt && (
                        <Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setPrompt(originalPrompt);
                              setOptimizationData(null);
                              setShowOptimizationInsights(false);
                            }}
                            disabled={disabled}
                            sx={{
                              color: "white",
                              borderColor: "rgba(255,255,255,0.3)",
                              fontSize: "0.7rem",
                              py: 0.5,
                              "&:hover": {
                                bgcolor: "rgba(255,255,255,0.1)",
                                borderColor: "white",
                              },
                            }}
                          >
                            Revert to Original
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  );
                })()}
              </Stack>
            </Box>
          </Collapse>
        )}

        {/* Optimization Error */}
        {optimizeError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {optimizeError.message}
          </Alert>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={handleGenerateSubmit}
            disabled={
              !isValidPrompt ||
              !isValidSeed ||
              isGenerating ||
              isOptimizing ||
              disabled ||
              loadingCurrentPrompt
            }
            size="small"
            startIcon={selectedTierOption?.icon || <OptimizeIcon />}
            sx={{
              minWidth: 120,
              bgcolor: selectedTierOption?.color || "secondary.main",
              "&:hover": {
                bgcolor: selectedTierOption?.color
                  ? `${selectedTierOption.color}dd`
                  : "secondary.dark",
              },
            }}
          >
            {isGenerating
              ? `Generating with ${selectedTierOption?.label || "AI"}...`
              : `Generate with ${selectedTierOption?.label || "AI"}`}
          </Button>

          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isGenerating || isOptimizing}
            size="small"
            sx={{
              color: "white",
              borderColor: "rgba(255,255,255,0.5)",
              bgcolor: "transparent",
              backdropFilter: "blur(10px)",
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
