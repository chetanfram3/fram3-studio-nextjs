"use client";

// ImageGenerationOverlay.tsx - Fully theme-compliant with manual upload integration + standalone init support
import { useState, useEffect, useMemo, useCallback } from "react";
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
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  AutoAwesome as OptimizeIcon,
  Info as InfoIcon,
  ExpandLess as CollapseIcon,
  Casino as RandomIcon,
  Refresh as RefreshIcon,
  CloudUpload as UploadIcon,
  AutoFixHigh as GenerateIcon,
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
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
import GenericFileUpload from "@/components/common/GenericFileUpload";
import { ProjectMetadata } from "./ProjectMetadata";
import type { ProjectMetadataType } from "./ProjectMetadata";
import { manualAddImage } from "@/services/imageService";
import type {
  ManualAddImageRequest,
  ManualAddAspectRatio,
  ImageType,
} from "@/types/image/types";
import { auth } from "@/lib/firebase";
import logger from "@/utils/logger";
import InlineImageUploader from "@/components/common/InlineImageUploader";
import type { UploadedImageData } from "@/components/common/InlineImageUploader";

interface ImageGenerationOverlayProps {
  scriptId: string;
  versionId: string;
  type: ImageType;
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

  // ✅ NEW: Standalone initialization mode flag
  isStandaloneInitMode?: boolean;

  // Callbacks
  onGenerateComplete: (result: unknown) => void;
  onCancel: () => void;
  onDataRefresh?: () => void;
  onGeneratingStateChange?: (isGenerating: boolean) => void;

  // State
  disabled?: boolean;
}

type GenerationMode = "generate" | "upload";

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:3", label: "4:3 (Standard)" },
  { value: "3:4", label: "3:4 (Portrait)" },
  { value: "9:16", label: "9:16 (Vertical)" },
];

// Manual upload only supports these 3 aspect ratios
const MANUAL_UPLOAD_ASPECT_RATIOS: ManualAddAspectRatio[] = [
  "16:9",
  "9:16",
  "1:1",
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
  isStandaloneInitMode = false, // ✅ NEW: Default to false
  onGenerateComplete,
  onCancel,
  onDataRefresh,
  onGeneratingStateChange,
  disabled = false,
}: ImageGenerationOverlayProps) {
  // Theme and brand
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Generation mode state
  const [generationMode, setGenerationMode] =
    useState<GenerationMode>("generate");

  // State for AI generation
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [optimizationData, setOptimizationData] =
    useState<OptimizationResult | null>(null);
  const [showOptimizationInsights, setShowOptimizationInsights] =
    useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [loadingCurrentPrompt, setLoadingCurrentPrompt] = useState(false);

  // State for manual upload
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [uploadPrompt, setUploadPrompt] = useState("");
  const [detectedAspectRatio, setDetectedAspectRatio] =
    useState<ManualAddAspectRatio | null>(null);
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ✅ NEW: Standalone initialization data state
  const [metadata, setMetadata] = useState<ProjectMetadataType>({
    title: "",
    description: "",
    imageCategory: "",
    tags: [],
    projectName: "",
    notes: "",
  });

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
    } else if (type === "standalone") {
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

  // Fetch current version's prompt (skip for standalone init mode)
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
  } = useImagePrompts(promptsParams, !isStandaloneInitMode); // ✅ Skip fetch in init mode

  // Memoized selected tier option
  const selectedTierOption = useMemo(
    () => getSelectedOption(),
    [modelTier, getSelectedOption]
  );

  // Memoized optimization insights
  const optimizationInsights = useMemo(
    () => (optimizationData ? getOptimizationInsights(optimizationData) : null),
    [optimizationData]
  );

  // Update loading state
  useEffect(() => {
    if (onGeneratingStateChange) {
      onGeneratingStateChange(isGenerating || isUploading);
    }
  }, [isGenerating, isUploading, onGeneratingStateChange]);

  // Load current version's prompt on component mount (skip for standalone init)
  useEffect(() => {
    if (
      !disabled &&
      !isStandaloneInitMode &&
      promptsData &&
      !isLoadingPrompts
    ) {
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
        logger.error("Error loading current prompt:", error);
      } finally {
        setLoadingCurrentPrompt(false);
      }
    }
  }, [
    promptsData,
    isLoadingPrompts,
    disabled,
    isStandaloneInitMode,
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

  /**
   * Detect aspect ratio from uploaded image with 10% tolerance
   */
  const detectAspectRatioFromImage = useCallback(
    (imageUrl: string) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const ratio = width / height;

        logger.info("Image dimensions detected", { width, height, ratio });

        // Define target ratios with 10% tolerance
        const ratios: { target: number; label: ManualAddAspectRatio }[] = [
          { target: 16 / 9, label: "16:9" },
          { target: 9 / 16, label: "9:16" },
          { target: 1, label: "1:1" },
        ];

        const TOLERANCE = 0.1; // 10% tolerance

        for (const { target, label } of ratios) {
          const diff = Math.abs(ratio - target) / target;
          if (diff <= TOLERANCE) {
            setDetectedAspectRatio(label);
            setAspectRatio(label);
            logger.info(
              `Aspect ratio detected: ${label} (within ${(diff * 100).toFixed(1)}% tolerance)`
            );
            return;
          }
        }

        // Default to closest ratio if no match
        const closest = ratios.reduce((prev, curr) => {
          const prevDiff = Math.abs(ratio - prev.target);
          const currDiff = Math.abs(ratio - curr.target);
          return currDiff < prevDiff ? curr : prev;
        });

        setDetectedAspectRatio(closest.label);
        setAspectRatio(closest.label);
        logger.warn(
          `No exact match found. Defaulting to closest: ${closest.label}`
        );
      };

      img.onerror = () => {
        logger.error("Failed to load image for aspect ratio detection");
      };

      img.src = imageUrl;
    },
    [setAspectRatio]
  );

  /**
   * Handle image upload from InlineImageUploader
   */
  const handleImageUploaded = useCallback((data: UploadedImageData) => {
    setUploadedFileUrl(data.url);
    setDetectedAspectRatio(data.aspectRatio as ManualAddAspectRatio);
    logger.info("Image uploaded and ready:", {
      url: data.url,
      aspectRatio: data.aspectRatio,
      filename: data.file.name,
    });
  }, []);

  /**
   * Handle file upload
   */
  const handleFilesUpdate = useCallback(
    (fileUrls: string[]) => {
      if (fileUrls.length > 0) {
        const url = fileUrls[0]; // Only take first file
        setUploadedFileUrl(url);
        detectAspectRatioFromImage(url);
      } else {
        setUploadedFileUrl("");
        setDetectedAspectRatio(null);
      }
    },
    [detectAspectRatioFromImage]
  );

  /**
   * Handle manual upload submission
   */
  const handleManualUpload = useCallback(async () => {
    if (!uploadedFileUrl) {
      return;
    }

    if (!uploadPrompt.trim()) {
      return;
    }

    if (!detectedAspectRatio) {
      return;
    }

    try {
      setIsUploading(true);

      // Get auth token
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }
      const token = await user.getIdToken();

      // ✅ NEW: Handle standalone initialization
      if (type === "standalone" && isStandaloneInitMode) {
        // Validate title for init mode
        if (!metadata.title.trim()) {
          logger.error("Title is required for standalone initialization");
          return;
        }

        // Standalone INIT mode - include initData, NO scriptId/versionId
        const request = {
          type: "standalone" as const,
          prompt: uploadPrompt.trim(),
          imageUrl: uploadedFileUrl,
          aspectRatio: detectedAspectRatio,
          initData: {
            title: metadata.title.trim(),
            description: metadata.description?.trim() || null,
            imageCategory: metadata.imageCategory?.trim() || null,
            tags: metadata.tags,
            projectName: metadata.projectName?.trim() || null,
            notes: metadata.notes?.trim() || null,
          },
        };

        logger.info("Submitting standalone init manual upload", request);

        const result = await manualAddImage(request as any, token);

        if (result.success) {
          onGenerateComplete(result.data);
          if (onDataRefresh) {
            onDataRefresh();
          }
          handleCancel();
        } else {
          throw new Error(result.error);
        }

        return; // Exit early
      }

      // ✅ EXISTING: Build request for other types (including existing standalone)
      let request: ManualAddImageRequest;

      if (type === "standalone") {
        // Standalone EDIT mode - use scriptId (assetId), NO versionId, NO initData
        request = {
          scriptId,
          versionId: "",
          type: "standalone",
          prompt: uploadPrompt.trim(),
          imageUrl: uploadedFileUrl,
          aspectRatio: detectedAspectRatio,
        } as any;
      } else if (type === "shots") {
        request = {
          scriptId,
          versionId,
          type: "shots",
          sceneId: sceneId!,
          shotId: shotId!,
          prompt: uploadPrompt.trim(),
          imageUrl: uploadedFileUrl,
          aspectRatio: detectedAspectRatio,
        };
      } else if (type === "actor") {
        request = {
          scriptId,
          versionId,
          type: "actor",
          actorId: actorId!,
          actorVersionId: actorVersionId!,
          prompt: uploadPrompt.trim(),
          imageUrl: uploadedFileUrl,
          aspectRatio: detectedAspectRatio,
        };
      } else if (type === "location") {
        request = {
          scriptId,
          versionId,
          type: "location",
          locationId: locationId!,
          locationVersionId: locationVersionId!,
          promptType: promptType || "wideShotLocationSetPrompt",
          prompt: uploadPrompt.trim(),
          imageUrl: uploadedFileUrl,
          aspectRatio: detectedAspectRatio,
        };
      } else {
        // keyVisual
        request = {
          scriptId,
          versionId,
          type: "keyVisual",
          prompt: uploadPrompt.trim(),
          imageUrl: uploadedFileUrl,
          aspectRatio: detectedAspectRatio,
        };
      }

      logger.info("Submitting manual upload", request);

      const result = await manualAddImage(request, token);

      if (result.success) {
        onGenerateComplete(result.data);
        if (onDataRefresh) {
          onDataRefresh();
        }
        handleCancel();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error("Manual upload failed", error);
    } finally {
      setIsUploading(false);
    }
  }, [
    uploadedFileUrl,
    uploadPrompt,
    detectedAspectRatio,
    scriptId,
    versionId,
    type,
    isStandaloneInitMode,
    metadata,
    sceneId,
    shotId,
    actorId,
    actorVersionId,
    locationId,
    locationVersionId,
    promptType,
    onGenerateComplete,
    onDataRefresh,
  ]);

  // Handle generation submission
  const handleGenerateSubmit = async () => {
    // ✅ UPDATED: Proper validation for all modes
    if (isStandaloneInitMode) {
      // Standalone init validation
      if (
        !prompt.trim() ||
        !isValidPrompt ||
        !isValidSeed ||
        !metadata.title.trim()
      ) {
        logger.error("Missing required fields for standalone initialization");
        return;
      }
    } else {
      // Regular mode validation (including existing standalone)
      // ✅ For standalone edit mode, versionId is not required
      if (type === "standalone") {
        if (!scriptId || !prompt.trim() || !isValidPrompt || !isValidSeed) {
          return;
        }
      } else {
        // For other types, versionId is required
        if (
          !scriptId ||
          !versionId ||
          !prompt.trim() ||
          !isValidPrompt ||
          !isValidSeed
        ) {
          return;
        }
      }
    }

    try {
      resetGenerateMutation();

      // ✅ NEW: Handle standalone initialization
      if (type === "standalone" && isStandaloneInitMode) {
        // Standalone INIT mode - include initData, NO scriptId/versionId
        const generateParams = {
          type: "standalone" as const,
          prompt: prompt.trim(),
          aspectRatio,
          modelTier: modelTier,
          ...(fineTuneId && { fineTuneId }),
          ...(seed !== undefined && { seed }),
          initData: {
            title: metadata.title.trim(),
            description: metadata.description?.trim() || null,
            imageCategory: metadata.imageCategory?.trim() || null,
            tags: metadata.tags,
            projectName: metadata.projectName?.trim() || null,
            notes: metadata.notes?.trim() || null,
          },
        };

        logger.info("Submitting standalone init generation", generateParams);

        const generateResult = await generateImageAsync(generateParams as any);

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

        return; // Exit early
      }

      // ✅ EXISTING: Regular generation (including existing standalone)
      const generateParams: GenerateImageParams = {
        scriptId: scriptId || "",
        versionId: versionId || "", // ✅ Empty for standalone edit mode
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
      // ✅ standalone with existing assetId needs no additional params

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
      logger.error("Error generating image:", error);
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

    // Reset upload state
    setUploadedFileUrl("");
    setUploadPrompt("");
    setDetectedAspectRatio(null);
    setIsUploadPanelOpen(false);
    setGenerationMode("generate");

    // ✅ NEW: Reset init data
    setMetadata({
      title: "",
      description: "",
      imageCategory: "",
      tags: [],
      projectName: "",
      notes: "",
    });

    onCancel();
  };

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

  const isProcessing = isGenerating || isOptimizing || isUploading;

  return (
    <>
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
                component="span"
                sx={{ fontFamily: brand.fonts.body }}
              >
                {/* ✅ UPDATED: Show different text for standalone init */}
                {isStandaloneInitMode
                  ? "Create New Standalone Asset"
                  : generationMode === "generate"
                    ? "Generate New Version"
                    : "Upload Image"}
                {!isStandaloneInitMode && viewingVersion?.version && (
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
                {generationMode === "generate" && selectedTierOption && (
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

          {/* Mode Toggle */}
          <ToggleButtonGroup
            value={generationMode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode !== null) {
                setGenerationMode(newMode);
              }
            }}
            disabled={isProcessing}
            size="small"
            sx={{
              display: "inline-flex",
              gap: 1,
              "& .MuiToggleButtonGroup-grouped": {
                border: 0,
                "&:not(:first-of-type)": {
                  borderRadius: `${brand.borderRadius}px`,
                  marginLeft: 0,
                },
                "&:first-of-type": {
                  borderRadius: `${brand.borderRadius}px`,
                },
              },
              "& .MuiToggleButton-root": {
                bgcolor: theme.palette.action.selected,
                color: "text.secondary",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: `${brand.borderRadius}px`,
                fontFamily: brand.fonts.body,
                textTransform: "none",
                px: 2,
                py: 1,
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                  borderColor: "primary.main",
                },
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  color: "primary.main",
                  borderColor: "primary.main",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.25),
                  },
                },
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              },
            }}
          >
            <ToggleButton value="generate">
              <Stack direction="row" spacing={1} alignItems="center">
                <GenerateIcon fontSize="small" />
                <Typography
                  variant="body2"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  AI Generate
                </Typography>
              </Stack>
            </ToggleButton>
            <ToggleButton value="upload">
              <Stack direction="row" spacing={1} alignItems="center">
                <UploadIcon fontSize="small" />
                <Typography
                  variant="body2"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Upload Image
                </Typography>
              </Stack>
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider />

          {/* ✅ NEW: Standalone Init Data Fields */}
          {isStandaloneInitMode && (
            <ProjectMetadata
              value={metadata}
              onChange={setMetadata}
              compact={true}
            />
          )}

          {/* Error Alerts */}
          {generateError && (
            <Alert
              severity="error"
              sx={{
                borderRadius: `${brand.borderRadius}px`,
                "& .MuiAlert-message": {
                  fontFamily: brand.fonts.body,
                },
              }}
            >
              {generateError.message}
            </Alert>
          )}

          {promptsError && !isStandaloneInitMode && (
            <Alert
              severity="warning"
              sx={{
                borderRadius: `${brand.borderRadius}px`,
                "& .MuiAlert-message": {
                  fontFamily: brand.fonts.body,
                },
              }}
            >
              Could not load current prompt: {promptsError.message}
            </Alert>
          )}

          {/* AI Generation Mode */}
          {generationMode === "generate" && (
            <Stack spacing={2}>
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
                  endAdornment: prompt.trim() && !isStandaloneInitMode && (
                    <Stack direction="row" spacing={0.5} sx={{ mr: 1 }}>
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

                      {optimizationData && (
                        <Tooltip title="View optimization insights">
                          <IconButton
                            size="small"
                            onClick={() =>
                              setShowOptimizationInsights(
                                !showOptimizationInsights
                              )
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

                    <TextField
                      label="Seed (Optional)"
                      type="number"
                      value={seed || ""}
                      onChange={(e) =>
                        setSeed(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
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
                                {Math.round(
                                  optimizationInsights.confidence * 100
                                )}
                                %
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
                    // ✅ UPDATED: Different validation for standalone init
                    isStandaloneInitMode
                      ? !isValidPrompt ||
                        !isValidSeed ||
                        !metadata.title.trim() ||
                        isProcessing ||
                        disabled
                      : !isValidPrompt ||
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
                      color: theme.palette.getContrastText(
                        selectedTierOption.color
                      ),
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
          )}

          {/* Upload Mode */}
          {generationMode === "upload" && (
            <Stack spacing={2}>
              {/* Upload Description Field */}
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={6}
                value={uploadPrompt}
                onChange={(e) => setUploadPrompt(e.target.value)}
                placeholder="Describe the image you're uploading..."
                disabled={disabled || isProcessing}
                variant="outlined"
                label="Image Description"
                size="small"
                error={uploadPrompt.length > 5000}
                helperText={
                  uploadPrompt.length > 5000
                    ? "Description must be under 5000 characters"
                    : `${uploadPrompt.length}/5000 characters`
                }
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
                    "& textarea": {
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

              {/* Inline Image Uploader */}
              <InlineImageUploader
                onImageUploaded={handleImageUploaded}
                disabled={disabled || isProcessing}
                maxSizeMB={10}
                showAspectRatio={true}
                allowedFormats={["jpg", "jpeg", "png", "webp", "gif"]}
              />

              {/* Submit and Cancel Buttons */}
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleManualUpload}
                  disabled={
                    disabled ||
                    !uploadedFileUrl ||
                    !uploadPrompt.trim() ||
                    uploadPrompt.length > 5000 ||
                    (isStandaloneInitMode && !metadata.title.trim()) ||
                    isProcessing
                  }
                  size="small"
                  startIcon={
                    isUploading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <UploadIcon />
                    )
                  }
                  sx={{
                    minWidth: 120,
                    borderRadius: `${brand.borderRadius}px`,
                    fontFamily: brand.fonts.body,
                    textTransform: "none",
                  }}
                >
                  {isUploading ? "Submitting..." : "Submit"}
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
                    textTransform: "none",
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Box>
      {/* File Upload Component */}
    </>
  );
}
