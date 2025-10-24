"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { customAlphabet } from "nanoid";
import {
  Dialog,
  DialogContent,
  Box,
  Container,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  useScriptAnalysisCore,
  type AnalysisOptions,
  type AnalysisParams,
} from "@/hooks/useScriptAnalysis";
import ScriptAnalysisStepper from "./ScriptAnalysisStepper";
import ScriptAnalysisActions from "./ScriptAnalysisActions";
import ScriptInput from "./ScriptInput";
import { AnalysisInProgress } from "@/components/common/AnalysisInProgress";
import AnalysisDialogHeader from "./AnalysisDialogHeader";
import CustomToast from "@/components/common/CustomToast";
import CreditErrorDisplay from "@/components/common/CreditErrorDisplay";
import type { CreditErrorResponse } from "@/types";
import type {
  ProcessingMode,
  AspectRatio,
  ModelTierConfig,
} from "@/components/common/ProcessingModeSelector";
import ProcessingModeSelector from "@/components/common/ProcessingModeSelector";
import { UrlManager } from "@/components/common/UrlManager";
import { UrlEntry } from "@/types/urlManagerTypes";
import { convertToPayload } from "@/utils/urlValidationUtils";

// Constants
const STEPS: ReadonlyArray<string> = [
  "Enter Script",
  "Enter URLs",
  "Processing Mode",
];

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

interface AnalysisComponentProps {
  onClose?: () => void;
}

/**
 * AnalysisComponent
 *
 * Enhanced multi-step script analysis workflow with:
 * - Step 1: Enter Script
 * - Step 2: Enter URLs (optional)
 * - Step 3: Processing Mode Selection & Analysis
 *
 * Features:
 * - State maintained across steps (can go back/forth)
 * - Theme-aware styling
 * - Credit error handling
 * - Progressive disclosure of settings
 */
const AnalysisComponent: React.FC<AnalysisComponentProps> = ({ onClose }) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  // Step management
  const [activeStep, setActiveStep] = useState(0);

  // Script and metadata state
  const [script, setScript] = useState("");
  const [referenceUrls, setReferenceUrls] = useState<UrlEntry[]>([]);

  // Processing options state (Step 3)
  const [processingMode, setProcessingMode] =
    useState<ProcessingMode>("normal");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [pauseBeforeSettings, setPauseBeforeSettings] = useState<string[]>([]);
  const [modelTiers, setModelTiers] = useState<ModelTierConfig>({
    image: 4,
    audio: 4,
    video: 4,
  });

  // ID generation
  const generateIds = useCallback(
    () => ({
      scriptId: nanoid(),
      versionId: nanoid(),
    }),
    []
  );

  const [ids, setIds] = useState(generateIds);

  // Analysis hook
  const {
    analyzeScriptCore,
    isAnalyzing,
    error,
    creditError,
    analysisResults,
    resetState,
  } = useScriptAnalysisCore();

  // Navigation handlers
  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, []);

  const handleBack = useCallback(() => {
    // If error on step 2 (processing), regenerate IDs when going back
    if ((error || creditError) && activeStep === 2) {
      const currentScript = script;
      const currentUrls = referenceUrls;
      const newIds = generateIds();
      setIds(newIds);
      resetState();

      // Wait for next render cycle
      setTimeout(() => {
        setScript(currentScript);
        setReferenceUrls(currentUrls);
        setActiveStep((prev) => prev - 1);
      }, 0);
    } else {
      setActiveStep((prev) => Math.max(prev - 1, 0));
    }
  }, [
    error,
    creditError,
    activeStep,
    generateIds,
    resetState,
    script,
    referenceUrls,
  ]);

  // Check if next button should be disabled
  const isNextDisabled = useMemo(() => {
    switch (activeStep) {
      case 0:
        // Step 1: Script required
        return !script.trim();
      case 1:
        // Step 2: URLs optional, always allow next
        return false;
      case 2:
        // Step 3: Never disabled (analysis button handles validation)
        return false;
      default:
        return false;
    }
  }, [activeStep, script]);

  // Enhanced analyze handler
  const handleAnalyzeWithParams = useCallback(async () => {
    const options: AnalysisOptions = {
      scriptContent: script,
      urls: convertToPayload(referenceUrls),
    };

    const params: AnalysisParams = {
      processingMode,
      aspectRatio,
      pauseBeforeSettings,
      modelTiers,
    };

    await analyzeScriptCore(options, params);
  }, [
    script,
    referenceUrls,
    processingMode,
    aspectRatio,
    pauseBeforeSettings,
    modelTiers,
    analyzeScriptCore,
  ]);

  // Credit error handlers
  const handleDismissCreditError = useCallback(() => {
    resetState();
    setActiveStep(0);
  }, [resetState]);

  const handleCreditRetry = useCallback(() => {
    if (creditError?.scriptId && creditError?.versionId) {
      router.push(
        `/scripts/${creditError.scriptId}/version/${creditError.versionId}`
      );
    }
  }, [creditError, router]);

  const hasCreditError = useCallback(() => {
    return creditError !== null && creditError !== undefined;
  }, [creditError]);

  // View details handler
  const handleViewDetails = useCallback(() => {
    if (analysisResults) {
      const navigate = () => {
        router.push(
          `/scripts/${analysisResults.scriptId}/version/${analysisResults.versionId}`
        );
      };

      // Show success toast
      CustomToast("success", "Analysis complete! Redirecting...");

      // Navigate after short delay
      setTimeout(navigate, 1000);
    }
  }, [analysisResults, router]);

  // Auto-redirect on successful analysis
  useEffect(() => {
    if (analysisResults && activeStep === 2 && !isAnalyzing) {
      const navigate = () => {
        router.push(
          `/scripts/${analysisResults.scriptId}/version/${analysisResults.versionId}`
        );
        resetState();
        if (onClose) {
          onClose();
        }
      };

      // Auto-navigate after 2 seconds
      const timeoutId = setTimeout(navigate, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [analysisResults, activeStep, isAnalyzing, router, resetState, onClose]);

  // Handle processing mode changes
  const handleProcessingModeChange = useCallback(
    (
      mode: ProcessingMode,
      ratio: AspectRatio,
      settings: string[],
      tiers: ModelTierConfig
    ) => {
      setProcessingMode(mode);
      setAspectRatio(ratio);
      setPauseBeforeSettings(settings);
      setModelTiers(tiers);
    },
    []
  );

  // Get step content
  const getStepContent = useCallback(
    (step: number): React.ReactNode => {
      switch (step) {
        case 0:
          // Step 1: Enter Script
          return <ScriptInput value={script} onChange={setScript} />;

        case 1:
          // Step 2: Enter URLs (optional)
          return (
            <Box sx={{ mt: 2 }}>
              {/* Guidance text */}
              <Box
                sx={{
                  mb: 3,
                  p: 2.5,
                  borderRadius: `${brand.borderRadius}px`,
                  bgcolor:
                    theme.palette.mode === "light"
                      ? "rgba(0, 0, 0, 0.02)"
                      : "rgba(255, 255, 255, 0.02)",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "text.primary",
                    fontFamily: brand.fonts.heading,
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  Reference URLs (Optional)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontFamily: brand.fonts.body,
                    lineHeight: 1.6,
                  }}
                >
                  Add URLs to provide FRAM3 AI with additional context about
                  your brand, products, or services. Useful links include
                  company websites, product pages, brand guidelines, or
                  marketing materials. This step is optional but can improve
                  analysis accuracy.
                </Typography>
              </Box>

              <UrlManager
                value={referenceUrls}
                onChange={setReferenceUrls}
                label="Reference URLs"
                helperText="Add up to 8 URLs for additional context (optional)"
                config={{ maxUrls: 8 }}
              />
            </Box>
          );

        case 2:
          // Step 3: Processing Mode & Analysis
          return isAnalyzing ? (
            <AnalysisInProgress message="FRAM3 AI is analyzing....." />
          ) : (
            <Box sx={{ mt: 2 }}>
              <ProcessingModeSelector
                onChange={handleProcessingModeChange}
                initialMode={processingMode}
                initialAspectRatio={aspectRatio}
                initialGenerateImages={true}
                initialGenerateAudio={true}
                initialGenerateVideo={true}
                defaultExpanded={true}
              />
            </Box>
          );

        default:
          return null;
      }
    },
    [
      script,
      referenceUrls,
      isAnalyzing,
      processingMode,
      aspectRatio,
      handleProcessingModeChange,
    ]
  );

  return (
    <Box
      sx={{
        maxWidth: "xl",
        mx: "auto",
        p: 4,
      }}
    >
      <AnalysisDialogHeader />

      <ScriptAnalysisStepper activeStep={activeStep} steps={STEPS} />

      <Box sx={{ mt: 4, mb: 4 }}>{getStepContent(activeStep)}</Box>

      <ScriptAnalysisActions
        activeStep={activeStep}
        isAnalyzing={isAnalyzing}
        isNextDisabled={isNextDisabled}
        script={script}
        onBack={handleBack}
        onNext={handleNext}
        onAnalyze={handleAnalyzeWithParams}
        onViewDetails={handleViewDetails}
        showDetailsButton={activeStep === 2 && analysisResults !== null}
        totalSteps={STEPS.length}
      />

      {/* Credit error display */}
      <CreditErrorDisplay
        open={hasCreditError() && !!creditError}
        onOpenChange={(open) => {
          if (!open) {
            handleDismissCreditError();
          }
        }}
        creditError={
          creditError
            ? ({
                ...creditError,
                scriptId: creditError.scriptId || "",
                versionId: creditError.versionId || "",
                route: creditError.route || "",
                note: creditError.note || "",
              } as CreditErrorResponse)
            : undefined
        }
        onRetry={handleCreditRetry}
      />
    </Box>
  );
};

/**
 * AnalysisDialog
 *
 * Dialog wrapper for the enhanced multi-step analysis component.
 * Theme-aware with proper styling.
 */
export const AnalysisDialog: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "background.paper",
          backgroundImage: "none",
          borderRadius: `${brand.borderRadius}px`,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          bgcolor: "background.default",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            bgcolor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: theme.palette.divider,
            borderRadius: "4px",
            "&:hover": {
              bgcolor: theme.palette.action.hover,
            },
          },
        }}
      >
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <AnalysisComponent onClose={onClose} />
        </Container>
      </DialogContent>
    </Dialog>
  );
};

/**
 * AnalysisPage
 *
 * Standalone page wrapper for the enhanced multi-step analysis component.
 * Used for dedicated analysis pages without dialog wrapper.
 * Theme-aware with proper styling.
 */
export const AnalysisPage: React.FC = () => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <AnalysisComponent />
      </Container>
    </Box>
  );
};

export default AnalysisDialog;
