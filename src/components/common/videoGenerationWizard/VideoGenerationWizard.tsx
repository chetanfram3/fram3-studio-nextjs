// src/components/common/videoGenerationWizard/VideoGenerationWizard.tsx
"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  Stepper,
  Step,
  StepLabel,
  Box,
  IconButton,
  Typography,
  alpha,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import CloseIcon from "@mui/icons-material/Close";
import logger from "@/utils/logger";

// Step components
import { UrlConfigurationStep } from "./steps/UrlConfigurationStep";
import { ProcessingOptionsStep } from "./steps/ProcessingOptionsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { ProgressStep } from "./steps/ProgressStep";

// Hooks and types
import { useVideoGeneration } from "./hooks/useVideoGeneration";
import type {
  VideoGenerationMode,
  VideoGenerationConfig,
  VideoGenerationResult,
  WizardStep,
  StepConfiguration,
} from "./types";
import type { UrlEntry } from "@/types/urlManagerTypes";
import type {
  ProcessingMode,
  AspectRatio,
  ModelTierConfig,
} from "@/components/common/ProcessingModeSelector";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface VideoGenerationWizardProps {
  /** Whether the wizard is open */
  open: boolean;

  /** Mode: 'versioned' (existing script) or 'non-versioned' (new script) */
  mode: VideoGenerationMode;

  /** Script ID (required for versioned mode) */
  scriptId?: string;

  /** Version ID (required for versioned mode) */
  versionId?: string;

  /** Script content (required for non-versioned mode) */
  scriptContent?: string;

  /** Script title (optional for non-versioned mode) */
  title?: string;

  /** Script description (optional for non-versioned mode) */
  description?: string;

  /** Initial URLs */
  initialUrls?: UrlEntry[];

  /** Initial processing mode */
  initialProcessingMode?: ProcessingMode;

  /** Initial aspect ratio */
  initialAspectRatio?: AspectRatio;

  /** Initial model tiers */
  initialModelTiers?: ModelTierConfig;

  /** Initial pause settings */
  initialPauseSettings?: string[];

  /** Steps configuration (which steps are enabled) */
  enabledSteps?: StepConfiguration[];

  /** Called when wizard completes successfully */
  onComplete?: (result: VideoGenerationResult) => void;

  /** Called when wizard is cancelled */
  onCancel: () => void;

  /** Whether to redirect to storyboard on success */
  redirectOnSuccess?: boolean;

  /** Custom redirect path (overrides default storyboard redirect) */
  customRedirectPath?: string;
}

// Default step configuration
const DEFAULT_STEPS: WizardStep[] = [
  { id: "urls", label: "Reference URLs", optional: false },
  { id: "processing", label: "Processing Options", optional: false },
  { id: "review", label: "Review & Confirm", optional: true },
  { id: "progress", label: "Generating Video", optional: false },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * VideoGenerationWizard - Unified video generation workflow
 *
 * Features:
 * - Composable step system (easily add/remove steps)
 * - Supports both versioned and non-versioned modes
 * - Consistent UI/UX across all entry points
 * - Theme-aware styling with brand configuration
 * - Comprehensive error handling with credit errors
 * - Progress visualization
 * - Optional redirect to storyboard
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - useMemo for expensive computations
 * - useCallback for event handlers
 * - Proper component splitting for better code splitting
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - Consistent with existing components
 */
export function VideoGenerationWizard({
  open,
  mode,
  scriptId,
  versionId,
  scriptContent,
  title,
  description,
  initialUrls = [],
  initialProcessingMode = "normal",
  initialAspectRatio = "16:9",
  initialModelTiers = { image: 4, audio: 4, video: 4 },
  initialPauseSettings = [],
  enabledSteps,
  onComplete,
  onCancel,
  redirectOnSuccess = true,
  customRedirectPath,
}: VideoGenerationWizardProps) {
  // ==========================================
  // HOOKS
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  // ==========================================
  // STATE
  // ==========================================
  const [activeStep, setActiveStep] = useState(0);
  const [urls, setUrls] = useState<UrlEntry[]>(initialUrls);
  const [processingMode, setProcessingMode] =
    useState<ProcessingMode>(initialProcessingMode);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialAspectRatio);
  const [pauseBeforeSettings, setPauseBeforeSettings] =
    useState<string[]>(initialPauseSettings);
  const [modelTiers, setModelTiers] =
    useState<ModelTierConfig>(initialModelTiers);

  // ==========================================
  // COMPUTE ENABLED STEPS
  // ==========================================
  const steps = useMemo(() => {
    if (!enabledSteps) {
      return DEFAULT_STEPS;
    }

    return DEFAULT_STEPS.filter((step) => {
      const config = enabledSteps.find((s) => s.id === step.id);
      return config?.enabled !== false;
    });
  }, [enabledSteps]);

  // ==========================================
  // VIDEO GENERATION HOOK
  // ==========================================
  const config: VideoGenerationConfig = useMemo(
    () => ({
      mode,
      scriptId,
      versionId,
      scriptContent,
      title,
      description,
      processingMode,
      aspectRatio,
      pauseBeforeSettings,
      modelTiers,
      urls,
    }),
    [
      mode,
      scriptId,
      versionId,
      scriptContent,
      title,
      description,
      processingMode,
      aspectRatio,
      pauseBeforeSettings,
      modelTiers,
      urls,
    ]
  );

  const {
    isGenerating,
    result,
    error,
    creditError,
    startGeneration,
    retryGeneration,
    resetState,
  } = useVideoGeneration(config);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleProcessingOptionsChange = useCallback(
    (
      mode: ProcessingMode,
      ratio: AspectRatio,
      pauseBefore: string[],
      tiers: ModelTierConfig
    ) => {
      setProcessingMode(mode);
      setAspectRatio(ratio);
      setPauseBeforeSettings(pauseBefore);
      setModelTiers(tiers);
    },
    []
  );

  const handleStartGeneration = useCallback(async () => {
    try {
      // Move to progress step
      const progressStepIndex = steps.findIndex((s) => s.id === "progress");
      if (progressStepIndex !== -1) {
        setActiveStep(progressStepIndex);
      }

      // Start generation
      const generationResult = await startGeneration();

      if (generationResult) {
        // Call success callback
        onComplete?.(generationResult);

        // Handle redirect
        if (redirectOnSuccess) {
          const redirectPath =
            customRedirectPath ||
            `/story/${generationResult.scriptId}/version/${generationResult.versionId}/3`;

          logger.info("Redirecting to storyboard:", redirectPath);
          router.push(redirectPath);
        }
      }
    } catch (err) {
      logger.error("Failed to start generation:", err);
    }
  }, [
    steps,
    startGeneration,
    onComplete,
    redirectOnSuccess,
    customRedirectPath,
    router,
  ]);

  const handleCancel = useCallback(() => {
    resetState();
    setActiveStep(0);
    onCancel();
  }, [resetState, onCancel]);

  const handleRetry = useCallback(() => {
    // Go back to processing options step
    const processingStepIndex = steps.findIndex((s) => s.id === "processing");
    if (processingStepIndex !== -1) {
      setActiveStep(processingStepIndex);
    }
    resetState();
  }, [steps, resetState]);

  // ==========================================
  // RENDER CURRENT STEP
  // ==========================================
  const renderStep = useCallback(() => {
    const currentStepId = steps[activeStep]?.id;

    switch (currentStepId) {
      case "urls":
        return (
          <UrlConfigurationStep
            urls={urls}
            onUrlsChange={setUrls}
            onNext={handleNext}
            onCancel={handleCancel}
          />
        );

      case "processing":
        return (
          <ProcessingOptionsStep
            processingMode={processingMode}
            aspectRatio={aspectRatio}
            pauseBeforeSettings={pauseBeforeSettings}
            modelTiers={modelTiers}
            onProcessingOptionsChange={handleProcessingOptionsChange}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
            canGoBack={activeStep > 0}
          />
        );

      case "review":
        return (
          <ReviewStep
            config={config}
            urls={urls}
            processingMode={processingMode}
            aspectRatio={aspectRatio}
            modelTiers={modelTiers}
            onStartGeneration={handleStartGeneration}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );

      case "progress":
        return (
          <ProgressStep
            isGenerating={isGenerating}
            result={result}
            error={error}
            creditError={creditError}
            scriptContent={scriptContent || ""}
            onRetry={retryGeneration}
            onClose={handleCancel}
            config={config}
          />
        );

      default:
        return null;
    }
  }, [
    steps,
    activeStep,
    urls,
    processingMode,
    aspectRatio,
    pauseBeforeSettings,
    modelTiers,
    config,
    isGenerating,
    result,
    error,
    creditError,
    scriptContent,
    handleNext,
    handleBack,
    handleCancel,
    handleProcessingOptionsChange,
    handleStartGeneration,
    retryGeneration,
  ]);

  // ==========================================
  // RENDER
  // ==========================================
  if (!open) return null;

  const isProgressStep = steps[activeStep]?.id === "progress";

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        // Prevent closing during generation
        if (reason === "backdropClick" && isGenerating) {
          return;
        }
        handleCancel();
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: "background.paper",
          backgroundImage: "none",
        },
      }}
    >
      {/* Header with close button */}
      {!isProgressStep && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily: brand.fonts.heading,
              fontWeight: 600,
              color: "text.primary",
            }}
          >
            Video Generation
          </Typography>

          <IconButton
            onClick={handleCancel}
            disabled={isGenerating}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": {
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Stepper (hidden during progress step) */}
      {!isProgressStep && steps.length > 1 && (
        <Box sx={{ p: 3, pb: 2 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((step) => (
              <Step key={step.id}>
                <StepLabel
                  optional={
                    step.optional ? (
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        Optional
                      </Typography>
                    ) : null
                  }
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontFamily: brand.fonts.body,
                    },
                  }}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}

      {/* Step content */}
      <DialogContent
        sx={{
          p: isProgressStep ? 0 : 3,
          minHeight: isProgressStep ? undefined : 400,
        }}
      >
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}

VideoGenerationWizard.displayName = "VideoGenerationWizard";

export default VideoGenerationWizard;
