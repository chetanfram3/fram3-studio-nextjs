"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { customAlphabet } from "nanoid";
import { Dialog, DialogContent, Box, Container } from "@mui/material";
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
import { EmailVerificationAlert } from "@/components/header/components/EmailVerificationAlert";
import CreditErrorDisplay from "@/components/common/CreditErrorDisplay";
import type { CreditErrorResponse } from "@/types";
import type {
  ProcessingMode,
  AspectRatio,
  ModelTierConfig,
} from "@/components/common/ProcessingModeSelector";

// Constants
const STEPS: ReadonlyArray<string> = ["Enter Script", "View Analysis"];

interface AnalysisComponentProps {
  onClose?: () => void;
}

/**
 * AnalysisComponent
 *
 * Core component for script analysis workflow.
 * Handles script input, analysis execution, and error states.
 * Fully theme-aware and optimized for performance.
 */
const AnalysisComponent: React.FC<AnalysisComponentProps> = ({ onClose }) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const navigate = useRouter();

  // Firebase ID generator - memoized
  const firebaseIdGenerator = useMemo(
    () =>
      customAlphabet(
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        20
      ),
    []
  );

  // Generate IDs function
  const generateIds = useCallback(
    () => ({
      scriptId: firebaseIdGenerator(),
      versionId: firebaseIdGenerator(),
    }),
    [firebaseIdGenerator]
  );

  // Store IDs in state for regeneration
  const [ids, setIds] = useState(generateIds);

  // Use shared analysis hook
  const {
    isAnalyzing,
    analysisResults,
    error,
    creditError,
    resetState,
    clearCreditError,
    clearError,
    hasCreditError,
    hasGenericError,
    analyzeScriptCore,
    retryAnalysis,
  } = useScriptAnalysisCore();

  // Local state
  const [activeStep, setActiveStep] = useState(0);
  const [title, setTitle] = useState("PlaceHolder Title");
  const [description, setDescription] = useState("PlaceHolder Description");
  const [script, setScript] = useState("");

  // Store params for retry
  const [lastAnalysisParams, setLastAnalysisParams] = useState<{
    options: AnalysisOptions;
    params: AnalysisParams;
  } | null>(null);

  // Stepper navigation
  const handleNext = useCallback(() => {
    setActiveStep((prev) => prev + 1);
  }, []);

  const handleBack = useCallback(() => {
    // If error on step 1, regenerate IDs when going back
    if ((error || creditError) && activeStep === 1) {
      const currentScript = script;
      const newIds = generateIds();
      setIds(newIds);
      resetState();

      // Wait for next render cycle
      setTimeout(() => {
        setScript(currentScript);
        setActiveStep((prev) => prev - 1);
      }, 0);
    } else {
      setActiveStep((prev) => prev - 1);
    }
  }, [error, creditError, activeStep, generateIds, resetState, script]);

  // Check if next button should be disabled
  const isNextDisabled = useMemo(() => {
    switch (activeStep) {
      case 0:
        return !title.trim() || title.trim() === "PlaceHolder Title";
      case 1:
        return (
          !description.trim() ||
          description.trim() === "PlaceHolder Description"
        );
      default:
        return false;
    }
  }, [activeStep, title, description]);

  // Enhanced analyze handler
  const handleAnalyzeWithParams = useCallback(
    async (
      processingMode: ProcessingMode = "normal",
      aspectRatio: AspectRatio = "16:9",
      pauseBeforeSettings: string[] = [],
      modelTiers: ModelTierConfig = { image: 4, audio: 4, video: 4 }
    ) => {
      const options: AnalysisOptions = {
        scriptContent: script,
        title: title || "PlaceHolder Title",
        description: description || "PlaceHolder Description",
      };

      const params: AnalysisParams = {
        processingMode,
        aspectRatio,
        pauseBeforeSettings,
        modelTiers,
      };

      setLastAnalysisParams({ options, params });
      handleNext();

      await analyzeScriptCore(options, params);
    },
    [script, title, description, analyzeScriptCore, handleNext]
  );

  // Credit error retry handler
  const handleCreditRetry = useCallback(async () => {
    if (lastAnalysisParams) {
      await retryAnalysis(
        lastAnalysisParams.options,
        lastAnalysisParams.params
      );
    } else {
      // Fallback
      const options: AnalysisOptions = {
        scriptContent: script,
        title: title || "PlaceHolder Title",
        description: description || "PlaceHolder Description",
      };
      const params: AnalysisParams = {
        processingMode: "normal",
        aspectRatio: "16:9",
        pauseBeforeSettings: [],
        modelTiers: { image: 4, audio: 4, video: 4 },
      };
      await retryAnalysis(options, params);
    }
  }, [retryAnalysis, lastAnalysisParams, script, title, description]);

  // Credit error dismiss handler
  const handleDismissCreditError = useCallback(() => {
    clearCreditError();
    if (activeStep === 1) {
      setActiveStep(0);
    }
  }, [clearCreditError, activeStep]);

  // Handle generic errors with toast
  useEffect(() => {
    if (hasGenericError() && error) {
      if (error.isPreCheckFailed) {
        CustomToast.warning("Script Pre-Check Failed", {
          details:
            error.recommendation ||
            "Please check your script content and try again.",
          duration: 4000,
        });
      } else {
        CustomToast.error("Analysis Error", {
          details: error.message,
          duration: 5000,
        });
      }
    }
  }, [error, hasGenericError]);

  // Navigate when analysis completes successfully
  useEffect(() => {
    if (
      analysisResults?.scriptId &&
      analysisResults?.versionId &&
      !hasCreditError() &&
      !hasGenericError()
    ) {
      navigate.push(
        `/story/${analysisResults.scriptId}/version/${analysisResults.versionId}/3`
      );
    }
  }, [analysisResults, navigate, hasCreditError, hasGenericError]);

  // View details handler
  const handleViewDetails = useCallback(() => {
    if (analysisResults?.scriptId && analysisResults?.versionId) {
      resetState();
      navigate.push(
        `/story/${analysisResults.scriptId}/version/${analysisResults.versionId}/3`
      );
      onClose?.();
    }
  }, [analysisResults, navigate, resetState, onClose]);

  // Get step content
  const getStepContent = useCallback(
    (step: number): React.ReactNode => {
      switch (step) {
        case 0:
          return <ScriptInput value={script} onChange={setScript} />;
        case 1:
          return isAnalyzing ? (
            <AnalysisInProgress message="FRAM3 AI is analysing....." />
          ) : null;
        default:
          return null;
      }
    },
    [script, isAnalyzing]
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
        showDetailsButton={activeStep === 1 && analysisResults !== null}
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
 * Dialog wrapper for the analysis component.
 * Theme-aware with proper styling.
 */
interface AnalysisDialogProps {
  open: boolean;
  onClose: () => void;
}

export const AnalysisDialog: React.FC<AnalysisDialogProps> = ({
  open,
  onClose,
}) => {
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
          borderRadius: `${brand.borderRadius * 1.5}px`,
          border: 2,
          borderColor: "primary.main",
          minHeight: "80vh",
          bgcolor: "background.paper",
          backgroundImage: "none !important",
        },
      }}
    >
      <DialogContent
        sx={{
          bgcolor: "background.default",
          pt: 4,
        }}
      >
        <AnalysisComponent onClose={onClose} />
        <EmailVerificationAlert />
      </DialogContent>
    </Dialog>
  );
};

/**
 * AnalysisPage
 *
 * Standalone page version of the analysis component.
 */
export const AnalysisPage: React.FC = () => (
  <Container maxWidth="xl">
    <EmailVerificationAlert />
    <AnalysisComponent />
  </Container>
);
