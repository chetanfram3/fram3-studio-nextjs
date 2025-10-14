"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  FormControlLabel,
  Checkbox,
  alpha,
} from "@mui/material";
import {
  Close as CloseIcon,
  Info as InfoIcon,
  Casino as RandomIcon,
  Refresh as RefreshIcon,
  RecordVoiceOver as LipSyncIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import logger from "@/utils/logger";
import { VideoVersion } from "./VideoViewerContainer";
import {
  useVideoEditor,
  useVideoPrompts,
  useVideoGenerationSettings,
  isAllVideoPromptsResponse,
} from "../../hooks/useVideoEditor";
import {
  ModelTierSelector,
  useModelTier,
  MODEL_TIERS,
} from "@/components/common/ModelTierSelector";

/**
 * Generate result interface
 */
export interface GenerateResult {
  isDummy?: boolean;
  status?: string;
}

interface VideoGenerationOverlayProps {
  scriptId: string;
  versionId: string;
  sceneId: number;
  shotId: number;
  viewingVersion?: VideoVersion;
  hasLipSync?: boolean;

  // Callbacks
  onGenerateComplete: (result: GenerateResult) => void;
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

const DURATIONS = [
  { value: "5", label: "5 seconds" },
  { value: "8", label: "8 seconds" },
  { value: "10", label: "10 seconds" },
];

export function VideoGenerationOverlay({
  scriptId,
  versionId,
  sceneId,
  shotId,
  viewingVersion,
  hasLipSync = false,
  onGenerateComplete,
  onCancel,
  onDataRefresh,
  onGeneratingStateChange,
  disabled = false,
}: VideoGenerationOverlayProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE
  // ==========================================
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [loadingCurrentPrompt, setLoadingCurrentPrompt] = useState(false);
  const [lipSyncOnly, setLipSyncOnly] = useState(false);
  const [originalPromptBackup, setOriginalPromptBackup] = useState("");

  // Model tier state
  const { modelTier, setModelTier, getSelectedOption } = useModelTier(
    MODEL_TIERS.ULTRA
  );

  // ==========================================
  // HOOKS
  // ==========================================
  const {
    generateVideoAsync,
    isGenerating,
    generateError,
    resetGenerateMutation,
  } = useVideoEditor();

  const {
    prompt,
    setPrompt,
    aspectRatio,
    setAspectRatio,
    duration,
    setDuration,
    seed,
    setSeed,
    negativePrompt,
    setNegativePrompt,
    cfgScale,
    setCfgScale,
    resetToDefaults,
    generateRandomSeed,
    isValidPrompt,
    isValidSeed,
    isValidAspectRatio,
    isValidDuration,
    isValidCfgScale,
  } = useVideoGenerationSettings();

  // Fetch current version's prompt
  const promptsParams = useMemo(
    () => ({
      scriptId,
      versionId,
      sceneId,
      shotId,
      videoVersion: viewingVersion?.version,
    }),
    [scriptId, versionId, sceneId, shotId, viewingVersion?.version]
  );

  const {
    data: promptsData,
    isLoading: isLoadingPrompts,
    error: promptsError,
  } = useVideoPrompts(promptsParams, true);

  const selectedTierOption = useMemo(
    () => getSelectedOption(),
    [getSelectedOption]
  );

  // ==========================================
  // EFFECTS
  // ==========================================

  // Load current version's prompt on component mount
  useEffect(() => {
    if (!disabled && promptsData && !isLoadingPrompts) {
      setLoadingCurrentPrompt(true);

      try {
        logger.debug("Loading video prompt data:", promptsData);

        let loadedPrompt = "";

        if (isAllVideoPromptsResponse(promptsData)) {
          logger.debug("Processing all video prompts response");

          const prompts = promptsData.prompts;
          const targetVersion = viewingVersion?.version || 1;
          const currentVersionPrompt = prompts[targetVersion.toString()];

          logger.debug(
            `Looking for version ${targetVersion}, found:`,
            currentVersionPrompt
          );

          if (currentVersionPrompt?.prompt) {
            logger.debug("Setting prompt:", currentVersionPrompt.prompt);
            loadedPrompt = currentVersionPrompt.prompt;
            setPrompt(currentVersionPrompt.prompt);

            if (currentVersionPrompt.aspectRatio) {
              setAspectRatio(currentVersionPrompt.aspectRatio);
            }
            if (currentVersionPrompt.seed) {
              setSeed(currentVersionPrompt.seed);
            }
          } else {
            const versions = Object.keys(prompts)
              .map((v) => parseInt(v))
              .sort((a, b) => b - a);
            if (versions.length > 0) {
              const latestPrompt = prompts[versions[0].toString()];
              logger.debug("Using latest prompt as fallback:", latestPrompt);
              if (latestPrompt?.prompt) {
                loadedPrompt = latestPrompt.prompt;
                setPrompt(latestPrompt.prompt);
                if (latestPrompt.aspectRatio) {
                  setAspectRatio(latestPrompt.aspectRatio);
                }
                if (latestPrompt.seed) {
                  setSeed(latestPrompt.seed);
                }
              }
            }
          }
        } else {
          logger.debug("Processing single video prompt response");
          if (promptsData.prompt?.prompt) {
            logger.debug("Setting single prompt:", promptsData.prompt.prompt);
            loadedPrompt = promptsData.prompt.prompt;
            setPrompt(promptsData.prompt.prompt);

            if (promptsData.prompt.aspectRatio) {
              setAspectRatio(promptsData.prompt.aspectRatio);
            }
            if (promptsData.prompt.seed) {
              setSeed(promptsData.prompt.seed);
            }
          }
        }

        setOriginalPrompt(loadedPrompt);
        setOriginalPromptBackup(loadedPrompt);
      } catch (error) {
        logger.error("Error loading current prompt:", error);
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
    setSeed,
  ]);

  // Reset state when overlay opens/closes
  useEffect(() => {
    if (!disabled) {
      setShowAdvancedSettings(false);
      setModelTier(MODEL_TIERS.ULTRA);
      setLipSyncOnly(false);
      resetGenerateMutation();
    }
  }, [disabled, setModelTier, resetGenerateMutation]);

  useEffect(() => {
    if (onGeneratingStateChange) {
      onGeneratingStateChange(isGenerating);
    }
  }, [isGenerating, onGeneratingStateChange]);

  // ==========================================
  // EVENT HANDLERS (Memoized)
  // ==========================================

  const handleLipSyncOnlyChange = useCallback(
    (checked: boolean) => {
      setLipSyncOnly(checked);

      if (checked) {
        setOriginalPromptBackup(prompt);
        setPrompt(originalPrompt);
      } else {
        setPrompt(originalPromptBackup);
      }
    },
    [prompt, originalPrompt, originalPromptBackup, setPrompt]
  );

  const handleGenerateSubmit = useCallback(async () => {
    if (
      !scriptId ||
      !versionId ||
      !prompt.trim() ||
      !isValidPrompt ||
      !isValidSeed ||
      !isValidAspectRatio ||
      !isValidDuration ||
      !isValidCfgScale
    ) {
      return;
    }

    try {
      resetGenerateMutation();

      const generateParams = {
        scriptId,
        versionId,
        sceneId,
        shotId,
        prompt: prompt.trim(),
        aspectRatio,
        duration,
        modelTier: modelTier,
        ...(lipSyncOnly && { lipSyncOnly: true }),
        ...(seed !== undefined && { seed }),
        ...(negativePrompt.trim() && { negativePrompt: negativePrompt.trim() }),
        ...(cfgScale !== undefined && { cfgScale }),
      };

      const generateResult = await generateVideoAsync(generateParams);
      logger.info("Video generation started successfully:", generateResult);

      onGenerateComplete(generateResult);

      resetToDefaults();
      setOriginalPrompt("");
      setOriginalPromptBackup("");
      setShowAdvancedSettings(false);
      setModelTier(MODEL_TIERS.ULTRA);
      setLipSyncOnly(false);
    } catch (error) {
      logger.error("Error generating video:", error);
    }
  }, [
    scriptId,
    versionId,
    sceneId,
    shotId,
    prompt,
    aspectRatio,
    duration,
    modelTier,
    lipSyncOnly,
    seed,
    negativePrompt,
    cfgScale,
    isValidPrompt,
    isValidSeed,
    isValidAspectRatio,
    isValidDuration,
    isValidCfgScale,
    resetGenerateMutation,
    generateVideoAsync,
    onGenerateComplete,
    resetToDefaults,
    setModelTier,
  ]);

  const handleCancel = useCallback(() => {
    resetToDefaults();
    setOriginalPrompt("");
    setOriginalPromptBackup("");
    setShowAdvancedSettings(false);
    setModelTier(MODEL_TIERS.ULTRA);
    setLipSyncOnly(false);
    resetGenerateMutation();
    onCancel();
  }, [resetToDefaults, setModelTier, resetGenerateMutation, onCancel]);

  const handleRefreshPrompt = useCallback(() => {
    if (promptsData && isAllVideoPromptsResponse(promptsData)) {
      logger.debug("Refreshing prompt data:", promptsData);

      const prompts = promptsData.prompts;
      const targetVersion = viewingVersion?.version || 1;
      const currentVersionPrompt = prompts[targetVersion.toString()];

      let refreshedPrompt = "";

      if (currentVersionPrompt?.prompt) {
        logger.debug("Refreshing with prompt:", currentVersionPrompt.prompt);
        refreshedPrompt = currentVersionPrompt.prompt;
        setPrompt(currentVersionPrompt.prompt);
        if (currentVersionPrompt.aspectRatio) {
          setAspectRatio(currentVersionPrompt.aspectRatio);
        }
        if (currentVersionPrompt.seed) {
          setSeed(currentVersionPrompt.seed);
        }
      } else {
        const versions = Object.keys(prompts)
          .map((v) => parseInt(v))
          .sort((a, b) => b - a);
        if (versions.length > 0) {
          const latestPrompt = prompts[versions[0].toString()];
          logger.debug(
            "Refreshing with latest prompt as fallback:",
            latestPrompt
          );
          if (latestPrompt?.prompt) {
            refreshedPrompt = latestPrompt.prompt;
            setPrompt(latestPrompt.prompt);
            if (latestPrompt.aspectRatio) {
              setAspectRatio(latestPrompt.aspectRatio);
            }
            if (latestPrompt.seed) {
              setSeed(latestPrompt.seed);
            }
          }
        }
      }

      setOriginalPrompt(refreshedPrompt);
      if (!lipSyncOnly) {
        setOriginalPromptBackup(refreshedPrompt);
      }
    }
  }, [
    promptsData,
    viewingVersion?.version,
    lipSyncOnly,
    setPrompt,
    setAspectRatio,
    setSeed,
  ]);

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
            <Typography
              variant="body2"
              color="white"
              fontWeight="medium"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Generate New Video
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
                    color: "white",
                    fontFamily: brand.fonts.body,
                  }}
                />
              )}
              {lipSyncOnly && (
                <Chip
                  icon={<LipSyncIcon sx={{ fontSize: "0.75rem !important" }} />}
                  label="LipSync Only"
                  size="small"
                  sx={{
                    ml: 1,
                    height: 20,
                    fontSize: "0.75rem",
                    bgcolor: "primary.main",
                    color: "white",
                    fontFamily: brand.fonts.body,
                  }}
                />
              )}
            </Typography>
            {(loadingCurrentPrompt || isLoadingPrompts) && (
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid",
                  borderTopColor: "primary.main",
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
            disabled={isGenerating}
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

        {/* LipSync Only Checkbox */}
        {hasLipSync && (
          <FormControlLabel
            control={
              <Checkbox
                checked={lipSyncOnly}
                onChange={(e) => handleLipSyncOnlyChange(e.target.checked)}
                disabled={isGenerating || disabled || loadingCurrentPrompt}
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  "&.Mui-checked": {
                    color: "primary.main",
                  },
                  "&.MuiCheckbox-indeterminate": {
                    color: "primary.main",
                  },
                }}
              />
            }
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <LipSyncIcon
                  sx={{ fontSize: "1rem", color: "rgba(255,255,255,0.7)" }}
                />
                <Typography
                  variant="body2"
                  color="rgba(255,255,255,0.7)"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  LipSync Only (Use existing audio, regenerate video only)
                </Typography>
              </Stack>
            }
            sx={{
              margin: 0,
              "& .MuiFormControlLabel-label": {
                fontSize: "0.875rem",
              },
            }}
          />
        )}

        {/* Prompt Input */}
        <TextField
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
          label="Video Generation Prompt"
          placeholder="Describe the video you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          variant="outlined"
          size="small"
          disabled={
            isGenerating || disabled || loadingCurrentPrompt || lipSyncOnly
          }
          error={!isValidPrompt && prompt.length > 0}
          helperText={
            lipSyncOnly
              ? "Prompt is locked when LipSync Only mode is enabled"
              : !isValidPrompt && prompt.length > 0
                ? "Prompt must be between 1-5000 characters"
                : `${prompt.length}/5000 characters`
          }
          InputProps={{
            endAdornment: prompt.trim() && !lipSyncOnly && (
              <Stack direction="row" spacing={0.5} sx={{ mr: 1 }}>
                <Tooltip title="Reload current version's prompt">
                  <IconButton
                    size="small"
                    onClick={handleRefreshPrompt}
                    disabled={
                      disabled ||
                      loadingCurrentPrompt ||
                      isLoadingPrompts ||
                      lipSyncOnly
                    }
                    sx={{
                      color: "primary.main",
                      opacity: 0.8,
                      "&:hover": { opacity: 1 },
                    }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: lipSyncOnly
                ? "rgba(255,255,255,0.04)"
                : "rgba(255,255,255,0.08)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: `${brand.borderRadius}px`,
              "& fieldset": {
                border: "none",
              },
              "&:hover fieldset": {
                border: "none",
              },
              "&.Mui-focused fieldset": {
                border: "1px solid",
                borderColor: "primary.main",
              },
              "& input, & textarea": {
                color: lipSyncOnly ? "rgba(255,255,255,0.5)" : "white",
                fontSize: "0.875rem",
                fontWeight: 500,
                fontFamily: brand.fonts.body,
                "&::placeholder": {
                  color: "rgba(255,255,255,0.7)",
                  opacity: 1,
                },
              },
            },
            "& .MuiInputLabel-root": {
              color: "rgba(255,255,255,0.7)",
              fontFamily: brand.fonts.body,
              "&.Mui-focused": {
                color: "primary.main",
              },
            },
            "& .MuiFormHelperText-root": {
              color: lipSyncOnly
                ? "rgba(255,255,255,0.5)"
                : "rgba(255,255,255,0.6)",
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
                color: "rgba(255,255,255,0.7)",
                fontFamily: brand.fonts.body,
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
                bgcolor: "rgba(255,255,255,0.08)",
                color: "white",
                fontFamily: brand.fonts.body,
                borderRadius: `${brand.borderRadius}px`,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.5)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
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

          {/* Duration */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel
              sx={{
                color: "rgba(255,255,255,0.7)",
                fontFamily: brand.fonts.body,
              }}
            >
              Duration
            </InputLabel>
            <Select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              label="Duration"
              disabled={disabled}
              sx={{
                bgcolor: "rgba(255,255,255,0.08)",
                color: "white",
                fontFamily: brand.fonts.body,
                borderRadius: `${brand.borderRadius}px`,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.5)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
                "& .MuiSvgIcon-root": {
                  color: "white",
                },
              }}
            >
              {DURATIONS.map((dur) => (
                <MenuItem key={dur.value} value={dur.value}>
                  {dur.label}
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
              fontFamily: brand.fonts.body,
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
            disabled={isGenerating || disabled}
            showDescription={true}
            compact={true}
          />
        </Stack>

        {/* Advanced Settings */}
        <Collapse in={showAdvancedSettings}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
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
                        sx={{ color: "primary.main" }}
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
                    fontFamily: brand.fonts.body,
                    borderRadius: `${brand.borderRadius}px`,
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: brand.fonts.body,
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                  "& .MuiFormHelperText-root": {
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: brand.fonts.body,
                    "&.Mui-error": {
                      color: "error.main",
                    },
                  },
                }}
              />

              {/* CFG Scale */}
              <TextField
                label="CFG Scale (Optional)"
                type="number"
                value={cfgScale || ""}
                onChange={(e) =>
                  setCfgScale(
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                size="small"
                disabled={disabled}
                error={!isValidCfgScale}
                helperText={!isValidCfgScale ? "Must be 1-20" : ""}
                inputProps={{ min: 1, max: 20, step: 0.1 }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(255,255,255,0.08)",
                    color: "white",
                    fontFamily: brand.fonts.body,
                    borderRadius: `${brand.borderRadius}px`,
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: brand.fonts.body,
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                  "& .MuiFormHelperText-root": {
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: brand.fonts.body,
                    "&.Mui-error": {
                      color: "error.main",
                    },
                  },
                }}
              />
            </Stack>

            {/* Negative Prompt */}
            <TextField
              multiline
              minRows={2}
              maxRows={4}
              fullWidth
              label="Negative Prompt (Optional)"
              placeholder="Describe what you don't want in the video..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              size="small"
              disabled={disabled}
              helperText={`${negativePrompt.length}/1000 characters`}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.08)",
                  color: "white",
                  fontFamily: brand.fonts.body,
                  borderRadius: `${brand.borderRadius}px`,
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: brand.fonts.body,
                  "&.Mui-focused": {
                    color: "primary.main",
                  },
                },
                "& .MuiFormHelperText-root": {
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: brand.fonts.body,
                },
              }}
            />
          </Stack>
        </Collapse>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={handleGenerateSubmit}
            disabled={
              !isValidPrompt ||
              !isValidSeed ||
              !isValidAspectRatio ||
              !isValidDuration ||
              !isValidCfgScale ||
              isGenerating ||
              disabled ||
              loadingCurrentPrompt
            }
            size="small"
            startIcon={lipSyncOnly ? <LipSyncIcon /> : selectedTierOption?.icon}
            sx={{
              minWidth: 120,
              fontFamily: brand.fonts.body,
              bgcolor: lipSyncOnly
                ? "primary.main"
                : selectedTierOption?.color || "primary.main",
              "&:hover": {
                bgcolor: lipSyncOnly
                  ? "primary.dark"
                  : selectedTierOption?.color
                    ? `${selectedTierOption.color}dd`
                    : "primary.dark",
              },
            }}
          >
            {isGenerating
              ? lipSyncOnly
                ? "Generating LipSync..."
                : `Generating with ${selectedTierOption?.label || "AI"}...`
              : lipSyncOnly
                ? "Generate LipSync"
                : `Generate with ${selectedTierOption?.label || "AI"}`}
          </Button>

          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isGenerating}
            size="small"
            sx={{
              color: "white",
              borderColor: "rgba(255,255,255,0.5)",
              bgcolor: "transparent",
              backdropFilter: "blur(10px)",
              fontFamily: brand.fonts.body,
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
