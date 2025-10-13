"use client";

import { useMemo } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { countTokens } from "@/utils/textUtils";

/**
 * Type-safe interface for TokenDisplay props
 */
interface TokenDisplayProps {
  text: string;
  maxTokens: number;
}

/**
 * TokenDisplay Component
 *
 * Displays token count and usage progress with a visual progress bar.
 * Shows warning and error states when approaching or exceeding limits.
 * Fully theme-aware and optimized for performance.
 *
 * @component
 */
export default function TokenDisplay({ text, maxTokens }: TokenDisplayProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // React 19: useMemo for token count (expensive calculation)
  const tokenCount = useMemo(() => countTokens(text), [text]);

  // React 19: useMemo for progress calculation
  const progress = useMemo(
    () => (tokenCount / maxTokens) * 100,
    [tokenCount, maxTokens]
  );

  // React 19: useMemo for progress bar color based on usage
  const progressColor = useMemo((): "error" | "warning" | "primary" => {
    if (progress > 90) return "error";
    if (progress > 75) return "warning";
    return "primary";
  }, [progress]);

  // React 19: useMemo for capped progress value
  const cappedProgress = useMemo(() => Math.min(progress, 100), [progress]);

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          Total Tokens: {tokenCount}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          Maximum: {maxTokens}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={cappedProgress}
        color={progressColor}
        sx={{
          height: 8,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: theme.palette.action.hover,
        }}
      />
    </Box>
  );
}

TokenDisplay.displayName = "TokenDisplay";
