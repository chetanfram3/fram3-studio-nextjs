// components/scripts/VideoGeneratorDialog.tsx
"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  startTransition,
} from "react";
import {
  Box,
  Typography,
  alpha,
  keyframes,
  Backdrop,
  Fade,
  IconButton,
  Button,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import { getTokenStatus } from "@/utils/tokenization";
import { MAX_TOKENS, MIN_TOKENS } from "@/config/analysis";
import CustomToast from "@/components/common/CustomToast";
import CloseIcon from "@mui/icons-material/Close";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import MovieIcon from "@mui/icons-material/Movie";
import SettingsEthernetIcon from "@mui/icons-material/SettingsEthernet";
import VideocamIcon from "@mui/icons-material/Videocam";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ProcessingModeSelector, {
  ProcessingMode,
  AspectRatio,
  ModelTierConfig,
} from "@/components/common/ProcessingModeSelector";
import { processorSteps } from "@/config/constants";
import {
  useScriptAnalysisCore,
  AnalysisOptions,
  AnalysisParams,
} from "@/hooks/useScriptAnalysis";
import CreditErrorDisplay from "@/components/common/CreditErrorDisplay";
import logger from "@/utils/logger";

// Define keyframes for animations
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

interface VideoProgressIndicatorProps {
  open: boolean;
  onClose: () => void;
  scriptContent: string;
  processingMode?: ProcessingMode;
  aspectRatio?: AspectRatio;
  pauseBeforeSettings?: string[];
  modelTiers?: ModelTierConfig;
  genScriptId?: string;
  currentVersionNumber?: number;
}

interface Phase {
  id: number;
  title: string;
  icon: React.ReactNode;
}

function VideoProgressIndicator({
  open,
  onClose,
  scriptContent,
  processingMode = "normal",
  aspectRatio = "16:9",
  pauseBeforeSettings = [],
  modelTiers = { image: 4, audio: 4, video: 4 },
  genScriptId,
  currentVersionNumber,
}: VideoProgressIndicatorProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const router = useRouter();
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  // Use the shared analysis hook
  const {
    isAnalyzing,
    analysisResults,
    error,
    creditError,
    resetState,
    clearCreditError,
    hasCreditError,
    hasGenericError,
    analyzeScriptCore,
    retryAnalysis,
  } = useScriptAnalysisCore();

  // Define the phases of video generation with icons
  const phases: Phase[] = useMemo(
    () => [
      {
        id: 0,
        title: "Initializing",
        icon: <VideoLibraryIcon fontSize="large" />,
      },
      {
        id: 1,
        title: "Analyzing Script",
        icon: <MovieIcon fontSize="large" />,
      },
      {
        id: 2,
        title: "Setting up Pipeline",
        icon: <SettingsEthernetIcon fontSize="large" />,
      },
      {
        id: 3,
        title: "Initialising Video generation",
        icon: <VideocamIcon fontSize="large" />,
      },
      {
        id: 4,
        title: "Re-Directing for Live Status",
        icon: <CloudUploadIcon fontSize="large" />,
      },
    ],
    []
  );

  // For token counting
  const plainTextForTokens = useMemo(() => {
    return scriptContent
      .replace(/<[^>]*>/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }, [scriptContent]);

  // Use the existing tokenization utility
  const tokenStatus = useMemo(
    () => getTokenStatus(plainTextForTokens, MAX_TOKENS, MIN_TOKENS),
    [plainTextForTokens]
  );

  const [lastAnalysisParams, setLastAnalysisParams] = useState<{
    options: AnalysisOptions;
    params: AnalysisParams;
  } | null>(null);

  // Calculate progress percentage based on current phase
  const progressPercentage = useMemo(
    () => (currentPhase / (phases.length - 1)) * 100,
    [currentPhase, phases.length]
  );

  // For the circular progress, calculate the stroke-dashoffset
  const circleRadius = 85;
  const circleCircumference = useMemo(() => 2 * Math.PI * circleRadius, []);
  const offset = useMemo(
    () =>
      circleCircumference - (progressPercentage / 100) * circleCircumference,
    [circleCircumference, progressPercentage]
  );

  // Get current phase information
  const currentPhaseInfo = useMemo(
    () => phases.find((phase) => phase.id === currentPhase) || phases[0],
    [phases, currentPhase]
  );

  // Choose animation based on phase
  const getIconAnimation = useCallback(() => {
    switch (currentPhase) {
      case 0: // Initializing
        return `${float} 2s ease-in-out infinite`;
      case 1: // Analyzing Script
        return `${pulse} 1.5s ease-in-out infinite`;
      case 2: // Setting up Pipeline
        return `${rotate} 4s linear infinite`;
      case 3: // Initialising Video generation
        return `${pulse} 1s ease-in-out infinite`;
      case 4: // Re-Directing for Live Status
        return `${float} 1.5s ease-in-out infinite`;
      default:
        return `${pulse} 1.5s ease-in-out infinite`;
    }
  }, [currentPhase]);

  const handleAnalyzeScript = useCallback(async () => {
    // Token validation (keep this in VideoGenerator since it's specific to this flow)
    if (!scriptContent.trim()) {
      CustomToast("error", "Script cannot be empty");
      return;
    }

    if (tokenStatus.isBelowMinimum) {
      CustomToast(
        "error",
        `Script is too short (${tokenStatus.count} tokens). Minimum ${MIN_TOKENS} tokens required.`
      );
      return;
    }

    if (tokenStatus.isExceeded) {
      CustomToast(
        "error",
        `Script exceeds the maximum token limit by ${Math.abs(
          tokenStatus.remaining
        )} tokens.`
      );
      return;
    }

    const options: AnalysisOptions = {
      genScriptId,
      currentVersionNumber,
      scriptContent,
      title: "Script from Editor",
      description: "Generated from script editor",
    };

    const params: AnalysisParams = {
      processingMode,
      aspectRatio,
      pauseBeforeSettings,
      modelTiers,
    };

    // Store for retry
    setLastAnalysisParams({ options, params });

    setCurrentPhase(0);

    try {
      // Simulate phase progression
      const simulatePhases = async () => {
        for (let i = 0; i < phases.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          setCurrentPhase(i);
        }
      };

      const [result] = await Promise.all([
        analyzeScriptCore(options, params),
        simulatePhases(),
      ]);

      if (result) {
        startTransition(() => {
          router.push(
            `/story/${result.scriptId}/version/${result.versionId}/3`
          );
        });
        onClose();
      }
    } catch (err) {
      logger.error("Analysis error", { error: err });
    }
  }, [
    scriptContent,
    tokenStatus,
    genScriptId,
    currentVersionNumber,
    processingMode,
    aspectRatio,
    pauseBeforeSettings,
    modelTiers,
    phases.length,
    analyzeScriptCore,
    router,
    onClose,
  ]);

  const handleRetry = useCallback(async () => {
    if (lastAnalysisParams) {
      setCurrentPhase(0);
      await retryAnalysis(
        lastAnalysisParams.options,
        lastAnalysisParams.params
      );
    }
  }, [lastAnalysisParams, retryAnalysis]);

  useEffect(() => {
    if (open && scriptContent) {
      handleAnalyzeScript();
    }
  }, [
    open,
    scriptContent,
    processingMode,
    aspectRatio,
    pauseBeforeSettings,
    handleAnalyzeScript,
  ]);

  useEffect(() => {
    if (error) {
      if (error.isPreCheckFailed) {
        CustomToast("warning", "Script Pre-Check Failed", {
          details:
            error.recommendation ||
            "Please check your script content and try again.",
          duration: 4000,
        });
      } else {
        CustomToast("error", "Video Generation Failed", {
          details: error.message,
          duration: 5000,
        });
      }
      // Auto-close the video dialog on error
      onClose();
    }
  }, [error, onClose]);

  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        color: "text.primary",
        backgroundColor: isDarkMode
          ? "rgba(0, 0, 0, 0.85)"
          : "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Fade
        in={open}
        timeout={{
          enter: 400,
          exit: 400,
        }}
      >
        <Box sx={{ position: "relative" }}>
          {/* Close button */}
          <IconButton
            onClick={onClose}
            disabled={isAnalyzing}
            sx={{
              position: "absolute",
              right: -12,
              top: -12,
              bgcolor: "background.paper",
              color: "text.secondary",
              zIndex: 1,
              border: 1,
              borderColor: "divider",
              "&:hover": {
                bgcolor: "background.paper",
                color: "primary.main",
                borderColor: "primary.main",
              },
              "&.Mui-disabled": {
                bgcolor: "background.default",
                color: "text.disabled",
              },
              boxShadow: theme.shadows[4],
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Step indicator and percentage in close proximity */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                mb: 2,
              }}
            >
              {/* Step indicator */}
              <Box
                sx={{
                  display: "inline-block",
                  px: 1.5,
                  py: 0.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  borderRadius: `${brand.borderRadius * 4}px`,
                  border: 1,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  boxShadow: theme.shadows[2],
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  Step
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    ml: 0.5,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {currentPhase}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    mx: 0.5,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  of
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {phases.length - 1}
                </Typography>
              </Box>

              {/* Percentage indicator */}
              <Typography
                variant="body2"
                sx={{
                  color: "primary.main",
                  fontWeight: 500,
                  fontFamily: brand.fonts.body,
                  animation: `${pulse} 1.5s infinite ease-in-out`,
                }}
              >
                {Math.round(progressPercentage)}% Complete
              </Typography>
            </Box>

            {/* Circular Progress Indicator with fixed size */}
            <Box
              sx={{
                position: "relative",
                width: 220,
                height: 220,
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                border: 1,
                borderColor: alpha(theme.palette.primary.main, 0.3),
                boxShadow: theme.shadows[8],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* SVG for circular progress */}
              <Box
                component="svg"
                width={220}
                height={220}
                viewBox="0 0 220 220"
                sx={{
                  position: "absolute",
                  transform: "rotate(-90deg)",
                }}
              >
                {/* Background circle */}
                <Box
                  component="circle"
                  cx={110}
                  cy={110}
                  r={circleRadius}
                  fill="none"
                  stroke={alpha(theme.palette.divider, 0.3)}
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

              {/* Center content - Icon and Title */}
              <Box sx={{ zIndex: 10, textAlign: "center", px: 4 }}>
                {/* Phase icon with animation */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mb: 2,
                    animation: getIconAnimation(),
                    color: "primary.main",
                  }}
                >
                  {currentPhaseInfo.icon}
                </Box>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                    fontFamily: brand.fonts.heading,
                  }}
                >
                  {currentPhaseInfo.title}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Fade>
      <CreditErrorDisplay
        open={hasCreditError() && !!creditError}
        onOpenChange={(open) => {
          if (!open) {
            clearCreditError();
            resetState();
            onClose();
          }
        }}
        creditError={
          creditError
            ? {
                ...creditError,
                scriptId: creditError.scriptId || "",
                versionId: creditError.versionId || "",
                route: creditError.route || "",
                note: creditError.note || "",
              }
            : undefined
        }
        onRetry={handleRetry}
      />
    </Backdrop>
  );
}

// Updated wrapper component that properly handles processing mode selection
export function VideoGeneratorWithMode({
  open,
  onClose,
  scriptContent,
  genScriptId,
  currentVersionNumber,
}: {
  open: boolean;
  onClose: () => void;
  scriptContent: string;
  genScriptId?: string;
  currentVersionNumber?: number;
}) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const [processingMode, setProcessingMode] =
    useState<ProcessingMode>("normal");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [pauseBeforeSettings, setPauseBeforeSettings] = useState<string[]>([
    ...processorSteps.images,
    ...processorSteps.scenes,
    ...processorSteps.audio,
    ...processorSteps.video,
  ]);
  const [modelTiers, setModelTiers] = useState<ModelTierConfig>({
    image: 4,
    audio: 4,
    video: 4,
  });
  const [showSelector, setShowSelector] = useState(true);

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

  const handleStartGeneration = useCallback(() => {
    setShowSelector(false);
  }, []);

  const handleClose = useCallback(() => {
    setShowSelector(true);
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        color: "text.primary",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      {showSelector ? (
        <Fade in={true} timeout={400}>
          <Box
            sx={{
              position: "relative",
              bgcolor: "background.paper",
              borderRadius: `${brand.borderRadius}px`,
              border: 2,
              borderColor: "primary.main",
              p: 4,
              maxWidth: 600,
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: theme.shadows[24],
            }}
          >
            {/* Close button */}
            <IconButton
              onClick={handleClose}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: "text.secondary",
                "&:hover": {
                  color: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>

            <Typography
              variant="h5"
              sx={{
                mb: 3,
                fontWeight: 600,
                color: "text.primary",
                fontFamily: brand.fonts.heading,
              }}
            >
              Video Generation Settings
            </Typography>

            {/* Processing Mode Selector */}
            <ProcessingModeSelector
              onChange={handleProcessingOptionsChange}
              initialMode="normal"
              initialAspectRatio="16:9"
              initialGenerateImages={true}
              initialGenerateAudio={true}
              initialGenerateVideo={true}
            />

            {/* Start Generation Button */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartGeneration}
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
                  fontFamily: brand.fonts.body,
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  transition: theme.transitions.create(
                    ["background-color", "transform"],
                    {
                      duration: theme.transitions.duration.short,
                    }
                  ),
                  "&:hover": {
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Start Video Generation
              </Button>
            </Box>
          </Box>
        </Fade>
      ) : (
        <VideoProgressIndicator
          open={true}
          onClose={handleClose}
          scriptContent={scriptContent}
          processingMode={processingMode}
          aspectRatio={aspectRatio}
          pauseBeforeSettings={pauseBeforeSettings}
          modelTiers={modelTiers}
          genScriptId={genScriptId}
          currentVersionNumber={currentVersionNumber}
        />
      )}
    </Backdrop>
  );
}

export default VideoProgressIndicator;
