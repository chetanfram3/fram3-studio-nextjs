// src/components/videoGeneration/steps/ProgressStep.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  alpha,
  keyframes,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import MovieIcon from "@mui/icons-material/Movie";
import SettingsEthernetIcon from "@mui/icons-material/SettingsEthernet";
import VideocamIcon from "@mui/icons-material/Videocam";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import RefreshIcon from "@mui/icons-material/Refresh";
import CreditErrorDisplay from "@/components/common/CreditErrorDisplay";
import type { ProgressStepProps } from "../types";

// ==========================================
// KEYFRAME ANIMATIONS
// ==========================================

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
`;

// ==========================================
// PHASE DEFINITIONS
// ==========================================

interface Phase {
  id: number;
  title: string;
  icon: React.ReactNode;
}

const PHASES: Phase[] = [
  {
    id: 1,
    title: "Analyzing Script",
    icon: <VideoLibraryIcon fontSize="large" />,
  },
  {
    id: 2,
    title: "Generating Storyboard",
    icon: <MovieIcon fontSize="large" />,
  },
  {
    id: 3,
    title: "Processing Media",
    icon: <SettingsEthernetIcon fontSize="large" />,
  },
  {
    id: 4,
    title: "Creating Video",
    icon: <VideocamIcon fontSize="large" />,
  },
  {
    id: 5,
    title: "Finalizing",
    icon: <CloudUploadIcon fontSize="large" />,
  },
];

/**
 * ProgressStep - Progress visualization for video generation
 *
 * Features:
 * - Animated 5-phase progress display
 * - Credit error handling with CreditErrorDisplay
 * - Generic error handling with retry
 * - Success state
 * - Theme-aware styling
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Consistent with existing VideoGeneratorDialog
 */
export function ProgressStep({
  isGenerating,
  result,
  error,
  creditError,
  scriptContent,
  onRetry,
  onClose,
  config,
}: ProgressStepProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE
  // ==========================================
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // ==========================================
  // PHASE PROGRESSION
  // ==========================================
  useEffect(() => {
    if (!isGenerating) {
      setCurrentPhase(0);
      return;
    }

    // Cycle through phases during generation
    const interval = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % PHASES.length);
    }, 3000); // Change phase every 3 seconds

    return () => clearInterval(interval);
  }, [isGenerating]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry]);

  // ==========================================
  // RENDER STATES
  // ==========================================

  // Success State
  if (result && !isGenerating) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          p: 4,
        }}
      >
        <CheckCircleIcon
          sx={{
            fontSize: 80,
            color: "success.main",
            mb: 3,
          }}
        />
        <Typography
          variant="h5"
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
            color: "text.primary",
            mb: 2,
          }}
        >
          Video Generation Started!
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontFamily: brand.fonts.body,
            color: "text.secondary",
            textAlign: "center",
            mb: 4,
          }}
        >
          Your video is being generated. You'll be redirected to the storyboard
          shortly.
        </Typography>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            fontFamily: brand.fonts.body,
            fontWeight: 600,
            borderRadius: `${brand.borderRadius}px`,
          }}
        >
          Close
        </Button>
      </Box>
    );
  }

  // Credit Error State
  if (creditError) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: 400,
          p: 4,
        }}
      >
        <CreditErrorDisplay
          creditError={creditError}
          onRetry={handleRetry}
          isRetrying={isRetrying}
        />
      </Box>
    );
  }

  // Generic Error State
  if (error && !isGenerating) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          p: 4,
        }}
      >
        <ErrorIcon
          sx={{
            fontSize: 80,
            color: "error.main",
            mb: 3,
          }}
        />
        <Typography
          variant="h5"
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
            color: "text.primary",
            mb: 2,
          }}
        >
          Generation Failed
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontFamily: brand.fonts.body,
            color: "text.secondary",
            textAlign: "center",
            mb: 1,
          }}
        >
          {error.message}
        </Typography>
        {error.recommendation && (
          <Typography
            variant="body2"
            sx={{
              fontFamily: brand.fonts.body,
              color: "text.secondary",
              textAlign: "center",
              mb: 4,
            }}
          >
            {error.recommendation}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              fontFamily: brand.fonts.body,
              fontWeight: 600,
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleRetry}
            disabled={isRetrying}
            startIcon={isRetrying ? <CircularProgress size={16} /> : <RefreshIcon />}
            sx={{
              fontFamily: brand.fonts.body,
              fontWeight: 600,
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  // Generating State (Progress Display)
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 500,
        p: 4,
        bgcolor: alpha(theme.palette.primary.main, 0.02),
      }}
    >
      {/* Main Title */}
      <Typography
        variant="h4"
        sx={{
          fontFamily: brand.fonts.heading,
          fontWeight: 700,
          color: "text.primary",
          mb: 2,
        }}
      >
        Generating Your Video
      </Typography>

      <Typography
        variant="body1"
        sx={{
          fontFamily: brand.fonts.body,
          color: "text.secondary",
          mb: 6,
          textAlign: "center",
        }}
      >
        This may take a few minutes. Please don't close this window.
      </Typography>

      {/* Progress Phases */}
      <Box
        sx={{
          display: "flex",
          gap: 4,
          mb: 6,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 800,
        }}
      >
        {PHASES.map((phase, index) => {
          const isActive = index === currentPhase;
          const isComplete = index < currentPhase;

          return (
            <Box
              key={phase.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                minWidth: 120,
                animation: isActive ? `${float} 2s ease-in-out infinite` : "none",
              }}
            >
              {/* Icon */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isActive
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.grey[500], 0.1),
                  border: 2,
                  borderColor: isActive
                    ? "primary.main"
                    : isComplete
                    ? "success.main"
                    : "divider",
                  color: isActive
                    ? "primary.main"
                    : isComplete
                    ? "success.main"
                    : "text.secondary",
                  animation: isActive ? `${pulse} 2s ease-in-out infinite` : "none",
                  position: "relative",
                }}
              >
                {phase.icon}
                {isActive && (
                  <CircularProgress
                    size={90}
                    thickness={2}
                    sx={{
                      color: "primary.main",
                      position: "absolute",
                      top: -5,
                      left: -5,
                    }}
                  />
                )}
              </Box>

              {/* Label */}
              <Typography
                variant="caption"
                sx={{
                  fontFamily: brand.fonts.body,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? "primary.main"
                    : isComplete
                    ? "success.main"
                    : "text.secondary",
                  textAlign: "center",
                }}
              >
                {phase.title}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Current Phase Label */}
      <Typography
        variant="h6"
        sx={{
          fontFamily: brand.fonts.body,
          fontWeight: 600,
          color: "primary.main",
          mb: 4,
        }}
      >
        {PHASES[currentPhase].title}...
      </Typography>

      {/* Cancel Button (only show if not critical phase) */}
      <Button
        variant="text"
        onClick={onClose}
        sx={{
          fontFamily: brand.fonts.body,
          color: "text.secondary",
          "&:hover": {
            bgcolor: alpha(theme.palette.error.main, 0.08),
            color: "error.main",
          },
        }}
      >
        Cancel Generation
      </Button>
    </Box>
  );
}

ProgressStep.displayName = "ProgressStep";
