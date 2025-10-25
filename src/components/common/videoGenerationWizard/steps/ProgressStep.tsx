// src/components/videoGeneration/steps/ProgressStep.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography, alpha, keyframes } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import MovieIcon from "@mui/icons-material/Movie";
import SettingsEthernetIcon from "@mui/icons-material/SettingsEthernet";
import VideocamIcon from "@mui/icons-material/Videocam";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LinkIcon from "@mui/icons-material/Link";
import AspectRatioIcon from "@mui/icons-material/AspectRatio";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Button } from "@mui/material";
import CreditErrorDisplay from "@/components/common/CreditErrorDisplay";
import { processorSteps } from "@/config/constants";
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
  subtitle?: string;
  icon: React.ReactNode;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get human-readable labels for pause before steps
 */
const getPauseBeforeLabels = (pauseBeforeSettings: string[]): string[] => {
  const labels: string[] = [];

  const hasImagePause = processorSteps.images.some((step) =>
    pauseBeforeSettings.includes(step)
  );
  const hasScenePause = processorSteps.scenes.some((step) =>
    pauseBeforeSettings.includes(step)
  );
  const hasAudioPause = processorSteps.audio.some((step) =>
    pauseBeforeSettings.includes(step)
  );
  const hasVideoPause = processorSteps.video.some((step) =>
    pauseBeforeSettings.includes(step)
  );

  if (hasImagePause) labels.push("Images");
  if (hasScenePause) labels.push("Scenes");
  if (hasAudioPause) labels.push("Audio");
  if (hasVideoPause) labels.push("Video");

  return labels;
};

/**
 * Generate dynamic phases based on config
 */
const generateDynamicPhases = (
  urlCount: number,
  aspectRatio: string,
  processingMode: string,
  pauseBeforeSettings: string[]
): Phase[] => {
  const phases: Phase[] = [];
  let phaseId = 1;

  // Phase 1: Script Analysis
  phases.push({
    id: phaseId++,
    title: "Analyzing Script",
    subtitle: "Processing content structure",
    icon: <VideoLibraryIcon fontSize="large" />,
  });

  // Phase 2: URL Review (conditional)
  if (urlCount > 0) {
    phases.push({
      id: phaseId++,
      title: "Reviewing Reference URLs",
      subtitle: `Processing ${urlCount} reference${urlCount > 1 ? "s" : ""}`,
      icon: <LinkIcon fontSize="large" />,
    });
  }

  // Phase 3: Framework Setup
  phases.push({
    id: phaseId++,
    title: "Preparing Framework",
    subtitle: `Optimizing for ${aspectRatio} ${processingMode} mode`,
    icon: <AspectRatioIcon fontSize="large" />,
  });

  // Phase 4: Data Gathering
  phases.push({
    id: phaseId++,
    title: "Gathering Pipeline Data",
    subtitle: "Analyzing requirements",
    icon: <SettingsEthernetIcon fontSize="large" />,
  });

  // Phase 5: Pipeline Creation (with pause awareness)
  const pauseLabels = getPauseBeforeLabels(pauseBeforeSettings);
  if (pauseLabels.length > 0) {
    phases.push({
      id: phaseId++,
      title: "Creating Video Pipeline",
      subtitle: `Will pause before: ${pauseLabels.join(", ")}`,
      icon: <PauseCircleIcon fontSize="large" />,
    });
  } else {
    phases.push({
      id: phaseId++,
      title: "Creating Video Pipeline",
      subtitle: "Full generation enabled",
      icon: <VideocamIcon fontSize="large" />,
    });
  }

  // Phase 6: Finalizing
  phases.push({
    id: phaseId++,
    title: "Finalizing Setup",
    subtitle: "Preparing for generation",
    icon: <CloudUploadIcon fontSize="large" />,
  });

  return phases;
};

/**
 * ProgressStep - Progress visualization for video generation
 *
 * Features:
 * - Dynamic phases based on configuration
 * - URL count awareness
 * - Processing mode and aspect ratio display
 * - Pause settings awareness
 * - Credit error handling with CreditErrorDisplay
 * - Generic error handling with retry
 * - Success state with delayed close to prevent confusion
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
  // COMPUTED VALUES
  // ==========================================
  const phases = useMemo(
    () =>
      generateDynamicPhases(
        config.urls.length,
        config.aspectRatio,
        config.processingMode,
        config.pauseBeforeSettings
      ),
    [
      config.urls.length,
      config.aspectRatio,
      config.processingMode,
      config.pauseBeforeSettings,
    ]
  );

  // ==========================================
  // STATE
  // ==========================================
  const [currentPhase, setCurrentPhase] = useState(0);

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
      setCurrentPhase((prev) => (prev + 1) % phases.length);
    }, 3000); // Change phase every 3 seconds

    return () => clearInterval(interval);
  }, [isGenerating, phases.length]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleRetry = useCallback(async () => {
    await onRetry();
  }, [onRetry]);

  // ==========================================
  // RENDER STATES
  // ==========================================

  // Success State - Keep dialog open to prevent confusion
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
            animation: `${pulse} 2s ease-in-out infinite`,
          }}
        />
        <Typography
          variant="h5"
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
            color: "text.primary",
            mb: 2,
            textAlign: "center",
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
            mb: 1,
          }}
        >
          Your video is being generated.
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: brand.fonts.body,
            color: "text.secondary",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          Redirecting to storyboard...
        </Typography>
      </Box>
    );
  }

  // Generic Error State (not credit error)
  if (error && !creditError) {
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
            textAlign: "center",
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
            mb: 4,
            maxWidth: 500,
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
              fontStyle: "italic",
              maxWidth: 500,
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
            startIcon={<RefreshIcon />}
            onClick={handleRetry}
            sx={{
              fontFamily: brand.fonts.body,
              fontWeight: 600,
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            Try Again
          </Button>
        </Box>
      </Box>
    );
  }

  // Get current phase info
  const currentPhaseInfo = phases[currentPhase] || phases[0];

  // Choose animation based on phase
  const getIconAnimation = () => {
    const phaseIndex = currentPhase % 5;
    switch (phaseIndex) {
      case 0:
        return `${float} 2s ease-in-out infinite`;
      case 1:
        return `${pulse} 1.5s ease-in-out infinite`;
      case 2:
        return `${rotate} 4s linear infinite`;
      case 3:
        return `${pulse} 1s ease-in-out infinite`;
      case 4:
        return `${float} 1.5s ease-in-out infinite`;
      default:
        return `${pulse} 1.5s ease-in-out infinite`;
    }
  };

  // Progress percentage (cycle through phases)
  const progressPercentage = ((currentPhase + 1) / phases.length) * 100;

  // Circle progress values
  const circleRadius = 85;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const offset =
    circleCircumference - (progressPercentage / 100) * circleCircumference;

  // Generating State (with Credit Error Display)
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          p: 4,
          position: "relative",
        }}
      >
        {/* Circular Progress with Icon - Isolated container */}
        <Box
          sx={{
            position: "relative",
            width: 220,
            height: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 3,
          }}
        >
          {/* SVG Circle */}
          <Box
            component="svg"
            width={220}
            height={220}
            sx={{ position: "absolute", transform: "rotate(-90deg)" }}
          >
            {/* Background circle */}
            <Box
              component="circle"
              cx={110}
              cy={110}
              r={circleRadius}
              fill="none"
              stroke={alpha(theme.palette.primary.main, 0.1)}
              strokeWidth={10}
            />
            {/* Progress circle */}
            <Box
              component="circle"
              cx={110}
              cy={110}
              r={circleRadius}
              fill="none"
              stroke={theme.palette.primary.main}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={circleCircumference}
              strokeDashoffset={offset}
              sx={{
                transition: theme.transitions.create("stroke-dashoffset", {
                  duration: theme.transitions.duration.standard,
                  easing: theme.transitions.easing.easeInOut,
                }),
              }}
            />
          </Box>

          {/* Icon - Centered in circle */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: getIconAnimation(),
              color: "primary.main",
              zIndex: 1,
            }}
          >
            {currentPhaseInfo.icon}
          </Box>
        </Box>

        {/* All text completely outside circle */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: 500,
            width: "100%",
          }}
        >
          {/* Phase Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              fontFamily: brand.fonts.heading,
              textAlign: "center",
              mb: 1,
            }}
          >
            {currentPhaseInfo.title}
          </Typography>

          {/* Phase Subtitle */}
          {currentPhaseInfo.subtitle && (
            <Typography
              variant="body2"
              sx={{
                fontFamily: brand.fonts.body,
                color: "text.secondary",
                textAlign: "center",
                mb: 2,
              }}
            >
              {currentPhaseInfo.subtitle}
            </Typography>
          )}

          {/* Status text */}
          <Typography
            variant="body2"
            sx={{
              fontFamily: brand.fonts.body,
              color: alpha(theme.palette.text.secondary, 0.7),
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            Please wait while we process your video...
          </Typography>
        </Box>
      </Box>

      {/* Credit Error Display - Rendered outside main box */}
      <CreditErrorDisplay
        open={!!creditError}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
        creditError={creditError || undefined}
        onRetry={handleRetry}
      />
    </>
  );
}

ProgressStep.displayName = "ProgressStep";
