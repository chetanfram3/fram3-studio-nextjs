"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { ArticleOutlined as DetailsIcon, ArrowBack } from "@mui/icons-material";
import { getTokenStatus } from "@/utils/tokenization";
import { MAX_TOKENS, MIN_TOKENS } from "@/config/analysis";

interface TokenStatus {
  count: number;
  isExceeded: boolean;
  isBelowMinimum: boolean;
  remaining: number;
}

interface ScriptAnalysisActionsProps {
  activeStep: number;
  totalSteps: number;
  isAnalyzing: boolean;
  isNextDisabled: boolean;
  script: string;
  onBack: () => void;
  onNext: () => void;
  onAnalyze: () => void;
  onViewDetails: () => void;
  showDetailsButton: boolean;
}

/**
 * ScriptAnalysisActions
 *
 * Enhanced action buttons for 3-step script analysis workflow:
 * - Step 0: Back (disabled) + Next
 * - Step 1: Back + Next
 * - Step 2: Back + Analyze (replaces Next)
 *
 * Features:
 * - Token validation on final step
 * - Dynamic button visibility based on step
 * - Theme-aware styling
 * - View Details button after successful analysis
 */
const ScriptAnalysisActions: React.FC<ScriptAnalysisActionsProps> = ({
  activeStep,
  totalSteps,
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

  // Validate props
  useEffect(() => {
    if (activeStep < 0) {
      console.warn("activeStep should not be negative");
    }
    if (typeof script !== "string") {
      console.warn("script prop must be a string");
    }
  }, [activeStep, script]);

  // Token status calculation (only relevant for final step)
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
      return `Script exceeds maximum length. Remove ${Math.abs(remaining)} tokens.`;
    }
    return "";
  }, [isBelowMinimum, isExceeded, remaining]);

  // Determine if we're on the last step
  const isLastStep = activeStep === totalSteps - 1;

  return (
    <Box>
      {/* Token counter - only show on last step */}
      {isLastStep && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: `${brand.borderRadius}px`,
            bgcolor:
              theme.palette.mode === "light"
                ? "rgba(0, 0, 0, 0.02)"
                : "rgba(255, 255, 255, 0.02)",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="body2"
              color={
                isExceeded || isBelowMinimum ? "error.main" : "text.secondary"
              }
            >
              Tokens: {tokenCount.toLocaleString()} /{" "}
              {MAX_TOKENS.toLocaleString()}
            </Typography>
            {(isExceeded || isBelowMinimum) && (
              <Typography variant="caption" color="error.main">
                {getTokenWarningMessage()}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Action buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pt: 2,
        }}
      >
        {/* Back button */}
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowBack />}
          onClick={onBack}
          disabled={activeStep === 0 || isAnalyzing}
          sx={{
            fontFamily: brand.fonts.body,
            textTransform: "none",
            minWidth: "100px",
            borderColor: "primary.main",
            "&:hover": {
              borderColor: "primary.dark",
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
            "&.Mui-disabled": {
              borderColor: "action.disabled",
              color: "action.disabled",
            },
          }}
        >
          Back
        </Button>

        {/* Right side actions */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {/* View Details button - only after successful analysis */}
          {showDetailsButton && (
            <Tooltip title="View analysis details">
              <IconButton
                onClick={onViewDetails}
                color="primary"
                sx={{
                  border: `1px solid ${theme.palette.primary.main}`,
                  "&:hover": {
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  },
                }}
              >
                <DetailsIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Next or Analyze button */}
          {isLastStep ? (
            // Analyze button on last step
            <Button
              variant="contained"
              onClick={onAnalyze}
              disabled={isAnalyzeDisabled}
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontFamily: brand.fonts.body,
                textTransform: "none",
                minWidth: "120px",
                px: 3,
                py: 1,
                borderRadius: `${brand.borderRadius}px`,
                "&:hover": {
                  bgcolor: "primary.dark",
                },
                "&.Mui-disabled": {
                  bgcolor: "action.disabledBackground",
                  color: "action.disabled",
                },
              }}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Script"}
            </Button>
          ) : (
            // Next button on other steps
            <Button
              variant="contained"
              onClick={onNext}
              disabled={isNextDisabled || isAnalyzing}
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontFamily: brand.fonts.body,
                textTransform: "none",
                minWidth: "100px",
                px: 3,
                py: 1,
                borderRadius: `${brand.borderRadius}px`,
                "&:hover": {
                  bgcolor: "primary.dark",
                },
                "&.Mui-disabled": {
                  bgcolor: "action.disabledBackground",
                  color: "action.disabled",
                },
              }}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

ScriptAnalysisActions.displayName = "ScriptAnalysisActions";

export default ScriptAnalysisActions;
