"use client";

import React, { useMemo, useCallback } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { getTokenStatus } from "@/utils/tokenization";

interface TokenCounterProps {
  text: string;
  maxTokens: number;
  minTokens?: number;
  isError?: boolean;
  showErrors?: boolean; // New prop to control error visibility
}

/**
 * TokenCounter
 *
 * Displays token count and validation status.
 * Only shows error states when showErrors is true.
 */
export const TokenCounter: React.FC<TokenCounterProps> = React.memo(
  ({ text, maxTokens, minTokens = 0, isError = false, showErrors = false }) => {
    const theme = useTheme();
    const brand = getCurrentBrand();

    // Calculate token status
    const tokenStatus = useMemo(
      () => getTokenStatus(text, maxTokens, minTokens),
      [text, maxTokens, minTokens]
    );

    const { count, isExceeded, isBelowMinimum } = tokenStatus;

    // Calculate progress percentage
    const progress = useMemo(
      () => Math.min((count / maxTokens) * 100, 100),
      [count, maxTokens]
    );

    // Get progress bar color - only show error colors if showErrors is true
    const getProgressColor = useMemo(() => {
      if (showErrors && isExceeded) return "error.main";
      if (showErrors && progress > 75) return "warning.main";
      if (progress === 0) return "action.disabled"; // Gray for empty state
      return "primary.main";
    }, [isExceeded, progress, showErrors]);

    // Get status message - only show if showErrors is true
    const getStatusMessage = useCallback((): string => {
      if (!showErrors) return "";
      if (isExceeded) return "Token limit exceeded";
      if (isBelowMinimum) return `Minimum ${minTokens} tokens required`;
      return "";
    }, [isExceeded, isBelowMinimum, minTokens, showErrors]);

    // Determine text color for token count
    const getCountColor = useMemo(() => {
      if (showErrors && isError) return "error.main";
      return "text.primary";
    }, [showErrors, isError]);

    return (
      <Box role="status" aria-live="polite">
        {/* Token Count Display */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: getCountColor,
              fontFamily: brand.fonts.body,
              fontWeight: 600,
            }}
          >
            Tokens: {count.toLocaleString()}/{maxTokens.toLocaleString()}
          </Typography>

          {getStatusMessage() && (
            <Typography
              variant="body2"
              sx={{
                color: isError ? "error.main" : "warning.main",
                fontFamily: brand.fonts.body,
                fontWeight: 500,
              }}
            >
              {getStatusMessage()}
            </Typography>
          )}
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: `${brand.borderRadius}px`,
            bgcolor:
              theme.palette.mode === "light"
                ? "rgba(0, 0, 0, 0.08)"
                : "rgba(255, 255, 255, 0.08)",
            "& .MuiLinearProgress-bar": {
              borderRadius: `${brand.borderRadius}px`,
              transition: theme.transitions.create(
                ["transform", "background-color"],
                {
                  duration: theme.transitions.duration.standard,
                  easing: theme.transitions.easing.easeOut,
                }
              ),
              bgcolor: getProgressColor,
              boxShadow:
                showErrors && isExceeded
                  ? `0 0 8px ${theme.palette.error.main}`
                  : showErrors && progress > 75
                    ? `0 0 8px ${theme.palette.warning.main}`
                    : progress > 0
                      ? `0 0 4px ${theme.palette.primary.main}`
                      : "none",
            },
          }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={`Token count: ${count} of ${maxTokens}`}
        />
      </Box>
    );
  }
);

TokenCounter.displayName = "TokenCounter";

export default TokenCounter;
