"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { ArticleOutlined as DetailsIcon } from "@mui/icons-material";
import { getTokenStatus } from "@/utils/tokenization";
import { MAX_TOKENS, MIN_TOKENS } from "@/config/analysis";
import ProcessingModeSelector, {
  type ProcessingMode,
  type AspectRatio,
  type ModelTierConfig,
} from "@/components/common/ProcessingModeSelector";

interface TokenStatus {
  count: number;
  isExceeded: boolean;
  isBelowMinimum: boolean;
  remaining: number;
}

interface ScriptAnalysisActionsProps {
  activeStep: number;
  isAnalyzing: boolean;
  isNextDisabled: boolean;
  script: string;
  onBack: () => void;
  onNext: () => void;
  onAnalyze: (
    processingMode?: ProcessingMode,
    aspectRatio?: AspectRatio,
    pauseBeforeSettings?: string[],
    modelTiers?: ModelTierConfig
  ) => void;
  onViewDetails: () => void;
  showDetailsButton: boolean;
}

/**
 * ScriptAnalysisActions
 *
 * Action buttons and controls for script analysis workflow.
 * Includes processing mode selector, token validation, and navigation.
 * Fully theme-aware and optimized with React 19 features.
 */
const ScriptAnalysisActions: React.FC<ScriptAnalysisActionsProps> = ({
  activeStep,
  isAnalyzing,
  isNextDisabled,
  script,
  onBack,
  onNext,
  onAnalyze,
  onViewDetails,
  showDetailsButton,
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Processing options state
  const [processingMode, setProcessingMode] =
    useState<ProcessingMode>("normal");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [pauseBeforeSettings, setPauseBeforeSettings] = useState<string[]>([]);
  const [modelTiers, setModelTiers] = useState<ModelTierConfig>({
    image: 4,
    audio: 4,
    video: 4,
  });

  // Validate props
  useEffect(() => {
    if (activeStep < 0) {
      console.warn("activeStep should not be negative");
    }
    if (typeof script !== "string") {
      console.warn("script prop must be a string");
    }
  }, [activeStep, script]);

  // Token status calculation
  const tokenStatus: TokenStatus = useMemo(
    () => getTokenStatus(script, MAX_TOKENS, MIN_TOKENS),
    [script]
  );

  const {
    count: tokenCount,
    isExceeded,
    isBelowMinimum,
    remaining,
  } = tokenStatus;

  // Check if analyze should be disabled
  const isAnalyzeDisabled = useMemo(
    () => isBelowMinimum || isExceeded || isAnalyzing || !script.trim(),
    [isBelowMinimum, isExceeded, isAnalyzing, script]
  );

  // Get token warning message
  const getTokenWarningMessage = useCallback((): string => {
    if (isBelowMinimum) {
      return `Script is too short. Minimum ${MIN_TOKENS} tokens required.`;
    }
    if (isExceeded) {
      return `Script exceeds the limit by ${Math.abs(tokenCount - MAX_TOKENS)} tokens.`;
    }
    return "";
  }, [isBelowMinimum, isExceeded, tokenCount]);

  // Handle processing options change
  const handleProcessingOptionsChange = useCallback(
    (
      mode: ProcessingMode,
      ratio: AspectRatio,
      pauseBefore: string[],
      newModelTiers: ModelTierConfig
    ) => {
      setProcessingMode(mode);
      setAspectRatio(ratio);
      setPauseBeforeSettings(pauseBefore);
      setModelTiers(newModelTiers);
    },
    []
  );

  // Handle analyze with options
  const handleAnalyzeWithOptions = useCallback(() => {
    onAnalyze(processingMode, aspectRatio, pauseBeforeSettings, modelTiers);
  }, [onAnalyze, processingMode, aspectRatio, pauseBeforeSettings, modelTiers]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        gap: 2,
      }}
    >
      {/* Back Button */}
      {activeStep > 0 && !showDetailsButton && (
        <Button
          onClick={onBack}
          disabled={isAnalyzing}
          aria-label="Go back"
          sx={{
            color: "text.primary",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          Back
        </Button>
      )}

      {/* Action Buttons */}
      {showDetailsButton ? (
        <Tooltip title="View Script Details">
          <span>
            <IconButton
              onClick={onViewDetails}
              color="primary"
              size="large"
              aria-label="View script details"
              sx={{
                border: 2,
                borderColor: "primary.main",
                transition: theme.transitions.create(
                  ["background-color", "color"],
                  {
                    duration: theme.transitions.duration.short,
                  }
                ),
                "&:hover": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                },
              }}
            >
              <DetailsIcon />
            </IconButton>
          </span>
        </Tooltip>
      ) : activeStep === 0 ? (
        <>
          {/* Processing Mode Selector */}
          <Box sx={{ width: "100%", mb: 3, maxWidth: 600, mx: "auto" }}>
            <ProcessingModeSelector
              onChange={handleProcessingOptionsChange}
              initialMode="normal"
              initialGenerateImages={true}
              initialGenerateAudio={true}
              initialGenerateVideo={true}
            />
          </Box>

          {/* Analyze Button */}
          <Button
            variant="contained"
            onClick={handleAnalyzeWithOptions}
            disabled={isAnalyzeDisabled}
            aria-label={isAnalyzing ? "Analyzing script" : "Analyze script"}
            color="primary"
            sx={{
              textTransform: "none",
              px: 4,
              py: 1.5,
              minWidth: 200,
              fontFamily: brand.fonts.body,
              fontWeight: 600,
              transition: theme.transitions.create(
                ["transform", "box-shadow"],
                {
                  duration: theme.transitions.duration.short,
                }
              ),
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: theme.shadows[8],
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Script"}
          </Button>

          {/* Token Warning */}
          {getTokenWarningMessage() && (
            <Typography
              variant="body2"
              color={
                isBelowMinimum || isExceeded ? "error.main" : "text.secondary"
              }
              role="alert"
              aria-live="polite"
              sx={{
                textAlign: "center",
                maxWidth: 400,
              }}
            >
              {getTokenWarningMessage()}
            </Typography>
          )}
        </>
      ) : (
        <Button
          variant="contained"
          onClick={onNext}
          disabled={isNextDisabled}
          aria-label="Next step"
          color="primary"
          sx={{
            textTransform: "none",
            px: 4,
            py: 1.5,
            minWidth: 200,
            fontFamily: brand.fonts.body,
          }}
        >
          Next
        </Button>
      )}
    </Box>
  );
};

ScriptAnalysisActions.displayName = "ScriptAnalysisActions";

export default ScriptAnalysisActions;
