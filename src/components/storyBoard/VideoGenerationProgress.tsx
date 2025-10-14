"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Collapse,
  Alert,
  AlertTitle,
  Chip,
  Tooltip,
  Stack,
  Fade,
  CircularProgress,
} from "@mui/material";
import {
  VideoCall as VideoIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Timer as TimerIcon,
  PlayArrow as PlayArrowIcon,
  Videocam as VideocamIcon,
  Pause as PauseIcon,
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { API_BASE_URL } from "@/config/constants";
import { useTriggerVideoPipeline } from "@/hooks/useTriggerVideoPipeline";
import CustomToast from "@/components/common/CustomToast";
import logger from "@/utils/logger";
import { formatTimestamp } from "@/utils/textUtils";
import ResumeOptionsDialog from "@/components/common/componentStatus/ResumeOptionsDialog";
import CreditErrorDisplay from "@/components/common/CreditErrorDisplay";
import { ANALYSIS_TITLES } from "@/config/analysisTypes";
import { CreditErrorResponse } from "@/types";
import { ResumeResponse } from "@/components/common/componentStatus/TaskProgress";

interface VideoGenerationProgressProps {
  scriptId: string;
  versionId: string;
  onVideoGenerated?: () => void;
  refetchStoryBoard?: () => void;
  className?: string;
}

interface VideoTaskInfo {
  id: string;
  status: "pending" | "active" | "completed" | "failed" | "paused";
  progress: number;
  error?: any;
  queueInfo?: {
    position: number | null;
    total: number | null;
    estimatedWaitFormatted?: string;
  };
  createdAt: string;
  updatedAt: string;
  pausedAnalyses?: string[];
  pauseBefore?: string[];
}

interface EnhancedError extends Error {
  response?: {
    data: any;
  };
}

// Function to find video task
const findVideoTask = async (
  userId: string,
  scriptId: string,
  versionId: string
) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("No authentication token available");
  }

  const params = new URLSearchParams({
    userId,
    scriptId,
    versionId,
    type: "video",
  });

  try {
    const response = await fetch(
      `${API_BASE_URL}/tasks/find?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { task: null, jobStatus: null, type: null };
      }
      const error = await response.json();
      throw new Error(error.message || "Failed to find video task");
    }

    const result = await response.json();
    logger.debug("Task found:", result);
    return result;
  } catch (error) {
    logger.error("Find video task failed:", error);
    throw error;
  }
};

// Function to retry video task
const retryVideoTask = async (taskId: string) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("No authentication token available");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/retry`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to retry video task");
    }

    const data = await response.json();
    logger.info("Video task retry response:", data);
    return data;
  } catch (error) {
    logger.error("Retry video task failed:", error);
    throw error;
  }
};

// Function to resume video task
const resumeVideoTask = async (taskId: string): Promise<ResumeResponse> => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("No authentication token available");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/resume`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      const errorResponse: ResumeResponse = {
        canResume: false,
        success: false,
        message: error.message || "Failed to resume video task",
        reason: error.reason || "Unknown error",
        suggestion: error.suggestion || "Please try again or contact support",
        ...error,
      };

      const enhancedError = new Error(errorResponse.message) as EnhancedError;
      enhancedError.response = { data: errorResponse };
      throw enhancedError;
    }

    const data = await response.json();
    logger.info("Video task resume response:", data);
    return data as ResumeResponse;
  } catch (error) {
    logger.error("Resume video task failed:", error);
    throw error;
  }
};

// Helper function to get paused analyses
const getPausedAnalyses = (task: VideoTaskInfo | null): string[] => {
  if (!task) return [];

  if (Array.isArray(task.pausedAnalyses)) {
    return task.pausedAnalyses;
  }

  if (Array.isArray(task.pauseBefore)) {
    return task.pauseBefore;
  }

  return [];
};

// Helper functions for credit error handling
const isCreditError = (response: any): response is CreditErrorResponse => {
  return (
    response?.error?.code === "INSUFFICIENT_CREDITS" ||
    response?.errorType === "credit_insufficient" ||
    (response?.error?.details?.required &&
      response?.error?.details?.available) ||
    (response?.error &&
      response?.details?.required &&
      response?.details?.available)
  );
};

const convertToCreditErrorResponse = (
  resumeResponse: ResumeResponse | any,
  scriptId: string,
  versionId: string
): CreditErrorResponse => {
  if (resumeResponse?.error?.code === "INSUFFICIENT_CREDITS") {
    return {
      error: resumeResponse.error,
      status: resumeResponse.status || 403,
      scriptId: resumeResponse.scriptId || scriptId,
      versionId: resumeResponse.versionId || versionId,
      route: resumeResponse.route || "resume-video",
      note:
        resumeResponse.note ||
        "Video operation failed due to insufficient credits. Your data is preserved.",
    };
  }

  return {
    error: {
      code: "CREDIT_INSUFFICIENT",
      message:
        resumeResponse.message ||
        (typeof resumeResponse.error === "string"
          ? resumeResponse.error
          : "") ||
        "Insufficient credits to resume video pipeline",
      details: resumeResponse.details ||
        resumeResponse.error?.details || {
          required: resumeResponse.required || 0,
          available: resumeResponse.available || 0,
          shortfall: resumeResponse.shortfall || 0,
          percentageAvailable:
            resumeResponse.details?.percentageAvailable || "0",
          recommendedPackage: resumeResponse.details?.recommendedPackage || {
            recommended: "starter",
            reason: "Upgrade needed",
            price: 10,
            credits: 10000,
            bonus: 0,
          },
        },
    },
    status: resumeResponse.status || 402,
    scriptId,
    versionId,
    route: "resume-video",
    note:
      resumeResponse.note ||
      "Video resume operation failed due to insufficient credits. Your checkpoint data is preserved.",
  };
};

const getAnalysisTitle = (analysisType: string): string => {
  return (
    ANALYSIS_TITLES[analysisType as keyof typeof ANALYSIS_TITLES] ||
    analysisType
  );
};

function VideoGenerationProgress({
  scriptId,
  versionId,
  onVideoGenerated,
  refetchStoryBoard,
  className = "",
}: VideoGenerationProgressProps) {
  const theme = useTheme();
  const { user } = useAuthStore();
  const userId = user?.uid;

  // UI State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");

  // Resume and Credit Error Dialog State
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [resumeResponse, setResumeResponse] = useState<ResumeResponse | null>(
    null
  );
  const [creditError, setCreditError] = useState<CreditErrorResponse | null>(
    null
  );
  const [creditErrorDialogOpen, setCreditErrorDialogOpen] = useState(false);

  // Refs for tracking state
  const notifiedCompletionRef = useRef<boolean>(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressMilestonesRef = useRef<Set<number>>(new Set());

  // API Hooks
  const triggerVideoPipelineMutation = useTriggerVideoPipeline();
  const [shouldPoll, setShouldPoll] = useState(true);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(false);

  // Find video task with improved polling logic
  const {
    data: videoTaskData,
    refetch: refetchTask,
    isLoading,
  } = useQuery({
    queryKey: ["videoTask", userId, scriptId, versionId],
    queryFn: () => findVideoTask(userId!, scriptId, versionId),
    enabled: !!userId && !!scriptId && !!versionId && shouldPoll,
    refetchInterval: (query) => {
      try {
        const data = query.state.data;
        const task = data?.task;

        if (task?.id) {
          setTaskId(task.id);

          const isActiveTask =
            task.status === "pending" || task.status === "active";

          if (isActiveTask) {
            logger.debug("Polling active video task:", {
              taskId: task.id,
              status: task.status,
              progress: task.progress,
            });
            return 2000;
          }

          if (
            task.status === "completed" ||
            task.status === "failed" ||
            task.status === "paused"
          ) {
            return 10000;
          }
        }

        if (taskId && !task?.id) {
          return 3000;
        }

        return false;
      } catch (error) {
        logger.error("Error in refetchInterval:", error);
        return 5000;
      }
    },
    refetchIntervalInBackground: true,
    retry: (failureCount, error) => {
      if (error?.message?.includes("404")) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Handle task creation from trigger
  useEffect(() => {
    if (
      triggerVideoPipelineMutation.isSuccess &&
      triggerVideoPipelineMutation.data?.taskId
    ) {
      setTaskId(triggerVideoPipelineMutation.data.taskId);
      setShouldPoll(true);
      progressMilestonesRef.current = new Set();

      setTimeout(() => {
        refetchTask();
      }, 1000);
    }
  }, [
    triggerVideoPipelineMutation.isSuccess,
    triggerVideoPipelineMutation.data?.taskId,
    refetchTask,
  ]);

  const videoTask: VideoTaskInfo | null = videoTaskData?.task?.id
    ? videoTaskData.task
    : null;

  // Enhanced resume success handler
  const handleResumeSuccess = useCallback(
    (data: ResumeResponse) => {
      const resumeData = data as ResumeResponse;

      if (isCreditError(resumeData as any)) {
        const creditErrorResponse = convertToCreditErrorResponse(
          resumeData,
          scriptId,
          versionId
        );
        setCreditError(creditErrorResponse);
        setCreditErrorDialogOpen(true);
        return;
      }

      if (resumeData.canResume === false) {
        setResumeResponse(resumeData);
        setResumeDialogOpen(true);

        const pausedAnalysesNames =
          resumeData.availablePausedAnalyses?.map(getAnalysisTitle) || [];

        CustomToast(
          "info",
          "Video pipeline paused - configuration required to resume",
          {
            details: `Paused analyses: ${pausedAnalysesNames.join(", ")}`,
            duration: 8000,
          }
        );
      } else if (resumeData.success === true || resumeData.canResume === true) {
        setShouldPoll(true);
        setTimeout(() => {
          refetchTask();
        }, 1000);
        setResumeDialogOpen(false);

        if (resumeData.resumeType === "checkpoint") {
          CustomToast(
            "success",
            `Video pipeline resumed from checkpoint. ${
              resumeData.resumeDetails?.analysesCount || 0
            } analyses will continue.`
          );
        } else {
          CustomToast("success", "Video pipeline resumed successfully");
        }
      } else {
        setResumeResponse(resumeData);
        setResumeDialogOpen(true);
        CustomToast("info", resumeData.message || "Resume response received", {
          details: "Check the dialog for more information",
        });
      }
    },
    [
      setResumeDialogOpen,
      setResumeResponse,
      setCreditError,
      setCreditErrorDialogOpen,
      refetchTask,
      scriptId,
      versionId,
      setShouldPoll,
    ]
  );

  // Enhanced resume error handler
  const handleResumeError = useCallback(
    (error: EnhancedError) => {
      if (error.response?.data && isCreditError(error.response.data as any)) {
        const creditErrorResponse = convertToCreditErrorResponse(
          error.response.data as ResumeResponse,
          scriptId,
          versionId
        );
        setCreditError(creditErrorResponse);
        setCreditErrorDialogOpen(true);
        return;
      }

      if (error.response?.data) {
        const errorData = error.response.data as ResumeResponse;
        setResumeResponse(errorData);
        setResumeDialogOpen(true);

        CustomToast(
          "error",
          errorData.message || "Failed to resume video pipeline",
          {
            details: errorData.suggestion || errorData.reason,
          }
        );
      } else {
        CustomToast(
          "error",
          `Failed to resume video pipeline: ${error.message}`
        );
      }
    },
    [
      setResumeDialogOpen,
      setResumeResponse,
      setCreditError,
      setCreditErrorDialogOpen,
      scriptId,
      versionId,
    ]
  );

  // Auto-collapse when completed
  useEffect(() => {
    if (videoTask?.status === "completed") {
      setIsCollapsed(true);
    }
  }, [videoTask?.status]);

  // Handle progress milestones and refetchStoryBoard calls
  useEffect(() => {
    if (!videoTask || !refetchStoryBoard) return;

    const currentProgress = videoTask.progress;
    const milestones = [25, 50, 75];

    for (const milestone of milestones) {
      if (
        currentProgress >= milestone &&
        !progressMilestonesRef.current.has(milestone)
      ) {
        logger.info(
          `Progress milestone reached: ${milestone}% - refetching storyboard`
        );
        progressMilestonesRef.current.add(milestone);
        refetchStoryBoard();
      }
    }

    if (videoTask.status === "completed") {
      logger.info("Video generation completed - refetching storyboard");
      progressMilestonesRef.current.add(100);
      refetchStoryBoard();
    }
  }, [
    videoTask?.progress,
    videoTask?.status,
    videoTask?.id,
    refetchStoryBoard,
  ]);

  // Handle video pipeline triggering
  const handleStartVideoGeneration = async () => {
    try {
      progressMilestonesRef.current = new Set();

      await triggerVideoPipelineMutation.mutateAsync({
        scriptId,
        versionId,
      });

      setIsCollapsed(false);
      notifiedCompletionRef.current = false;

      setTimeout(() => {
        refetchTask();
      }, 1000);
    } catch (error: unknown) {
      logger.error("Failed to start video generation:", error);

      const enhancedError = error as EnhancedError;
      if (
        enhancedError.response?.data &&
        isCreditError(enhancedError.response.data as any)
      ) {
        const creditErrorResponse = convertToCreditErrorResponse(
          enhancedError.response.data as ResumeResponse,
          scriptId,
          versionId
        );
        setCreditError(creditErrorResponse);
        setCreditErrorDialogOpen(true);
      }
    }
  };

  // Handle retry
  const handleRetryVideoGeneration = async () => {
    if (!videoTask?.id) return;

    try {
      progressMilestonesRef.current = new Set();

      await retryVideoTask(videoTask.id);
      setShouldPoll(true);
      setTaskId(videoTask.id);

      notifiedCompletionRef.current = false;
      setIsCollapsed(false);

      setTimeout(() => {
        refetchTask();
      }, 1000);

      CustomToast("info", "Video generation restarted");
    } catch (error: unknown) {
      logger.error("Failed to retry video generation:", error);

      const enhancedError = error as EnhancedError;
      if (
        enhancedError.response?.data &&
        isCreditError(enhancedError.response.data as any)
      ) {
        const creditErrorResponse = convertToCreditErrorResponse(
          enhancedError.response.data as ResumeResponse,
          scriptId,
          versionId
        );
        setCreditError(creditErrorResponse);
        setCreditErrorDialogOpen(true);
      } else {
        CustomToast("error", "Failed to retry video generation");
      }
    }
  };

  // Enhanced resume handler
  const handleResumeVideoGeneration = async () => {
    if (!videoTask?.id) return;

    try {
      setIsResuming(true);

      CustomToast("info", "Initiating video pipeline resume...", {
        duration: 2000,
      });

      const resumeResult = await resumeVideoTask(videoTask.id);
      handleResumeSuccess(resumeResult);
    } catch (error: unknown) {
      logger.error("Failed to resume video generation:", error);
      handleResumeError(error as EnhancedError);
    } finally {
      setIsResuming(false);
    }
  };

  // Handle pause configuration updates
  const handleConfigureResume = () => {
    CustomToast(
      "info",
      "Opening video pipeline pause configuration... (Feature to be implemented)"
    );
    setResumeDialogOpen(false);
  };

  // Handle simple resume from dialog
  const handleSimpleResume = () => {
    if (videoTask?.id) {
      handleResumeVideoGeneration();
    }
  };

  // Credit error dialog handlers
  const handleCreditErrorDismiss = () => {
    setCreditErrorDialogOpen(false);
    setCreditError(null);
  };

  const handlePurchaseCredits = () => {
    setCreditErrorDialogOpen(false);
    setCreditError(null);
  };

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      setShouldPoll(false);
    };
  }, []);

  // Handle task status changes
  useEffect(() => {
    if (!videoTask) return;

    const taskStatus = videoTask.status;

    if (videoTask.updatedAt) {
      setLastUpdateTime(formatTimestamp(videoTask.updatedAt));
    }

    if (taskStatus === "completed" && !notifiedCompletionRef.current) {
      CustomToast("success", "Video generation completed!");
      notifiedCompletionRef.current = true;
      onVideoGenerated?.();
    } else if (taskStatus === "failed" && !notifiedCompletionRef.current) {
      CustomToast("error", "Video generation failed");
      notifiedCompletionRef.current = true;
    } else if (taskStatus === "paused" && !notifiedCompletionRef.current) {
      const pausedAnalyses = getPausedAnalyses(videoTask);
      const pausedText =
        pausedAnalyses.length > 0
          ? `Video generation paused at: ${pausedAnalyses
              .map(getAnalysisTitle)
              .join(", ")}`
          : "Video generation paused";
      CustomToast("warning", pausedText);
      notifiedCompletionRef.current = true;
    }
  }, [videoTask, onVideoGenerated]);

  // Get current stage and progress info
  const getCurrentStageInfo = (progress: number) => {
    if (progress < 50) {
      return {
        stage: "Video Generation",
        stageProgress: (progress / 50) * 100,
        description: "Generating videos and processing scenes",
        icon: <VideocamIcon />,
        color: "primary.main",
      };
    } else {
      return {
        stage: "Video Analysis",
        stageProgress: ((progress - 50) / 50) * 100,
        description: "Analysis and final assembly",
        icon: <VideoIcon />,
        color: "primary.dark",
      };
    }
  };

  const overallProgress = videoTask?.progress || 0;
  const currentStageInfo = getCurrentStageInfo(overallProgress);
  const overallStatus = videoTask?.status || null;
  const hasVideoTask = !!videoTask?.id;

  // Status colors and icons
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "completed":
        return theme.palette.success.main;
      case "failed":
        return theme.palette.error.main;
      case "active":
        return theme.palette.primary.main;
      case "pending":
        return theme.palette.warning.main;
      case "paused":
        return theme.palette.warning.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon />;
      case "failed":
        return <ErrorIcon />;
      case "active":
        return <PlayArrowIcon />;
      case "pending":
        return <TimerIcon />;
      case "paused":
        return <PauseIcon />;
      default:
        return <VideoIcon />;
    }
  };

  const handleRefreshStatus = () => {
    logger.info("Manually refreshing video pipeline status");
    setShouldPoll(true);
    refetchTask();
    CustomToast("info", "Refreshing status...");
  };

  // Get paused analyses for display
  const pausedAnalyses = getPausedAnalyses(videoTask);

  return (
    <>
      <Fade in timeout={300}>
        <Box
          className={className}
          sx={{
            position: "relative",
            background: "secondary",
            backdropFilter: "blur(15px)",
            borderRadius: 0.5,
            borderTop: 1,
            borderColor: "primary.main",
            p: 2,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: hasVideoTask
                ? `0 8px 32px ${alpha(getStatusColor(overallStatus), 0.15)}`
                : `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
            },
          }}
        >
          {/* Animated background glow */}
          {hasVideoTask &&
            (overallStatus === "active" || overallStatus === "pending") && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(45deg, ${alpha(
                    theme.palette.primary.main,
                    0.05
                  )}, transparent, ${alpha(theme.palette.info.main, 0.05)})`,
                  animation: "pulse 3s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 0.3 },
                    "50%": { opacity: 0.7 },
                  },
                }}
              />
            )}

          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: hasVideoTask ? 3 : 2, position: "relative", zIndex: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: getStatusColor(overallStatus),
                  transition: "all 0.3s ease",
                }}
              >
                {getStatusIcon(overallStatus)}
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  color="text.primary"
                  fontWeight={600}
                  sx={{ lineHeight: 1.2 }}
                >
                  Video Generation
                </Typography>
                {hasVideoTask && (
                  <Typography
                    variant="caption"
                    sx={{ display: "block", color: "rgba(255,255,255,0.7)" }}
                  >
                    {currentStageInfo.description}
                  </Typography>
                )}
              </Box>
              {hasVideoTask && overallStatus && (
                <Chip
                  size="small"
                  label={overallStatus}
                  color={
                    overallStatus === "completed"
                      ? "success"
                      : overallStatus === "failed"
                        ? "error"
                        : overallStatus === "active"
                          ? "info"
                          : "warning"
                  }
                  sx={{
                    fontWeight: 600,
                    textTransform: "capitalize",
                    bgcolor: alpha(
                      theme.palette[
                        overallStatus === "completed"
                          ? "success"
                          : overallStatus === "failed"
                            ? "error"
                            : overallStatus === "active"
                              ? "info"
                              : "warning"
                      ].main,
                      0.2
                    ),
                    color: "common.white",
                    border: `1px solid ${alpha(
                      theme.palette[
                        overallStatus === "completed"
                          ? "success"
                          : overallStatus === "failed"
                            ? "error"
                            : overallStatus === "active"
                              ? "info"
                              : "warning"
                      ].main,
                      0.3
                    )}`,
                  }}
                />
              )}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              {lastUpdateTime && hasVideoTask && (
                <Typography
                  variant="caption"
                  sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}
                >
                  {lastUpdateTime}
                </Typography>
              )}

              {hasVideoTask &&
                (overallStatus === "active" || overallStatus === "pending") && (
                  <Tooltip title="Refresh status" arrow>
                    <IconButton
                      size="small"
                      onClick={handleRefreshStatus}
                      disabled={isLoading}
                      sx={{
                        color: "rgba(255,255,255,0.8)",
                        bgcolor: "rgba(255,255,255,0.1)",
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.2)",
                          transform: "rotate(90deg)",
                        },
                        transition: "all 0.2s ease-in-out",
                      }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

              {overallStatus === "failed" && (
                <Tooltip title="Retry generation" arrow>
                  <IconButton
                    size="small"
                    onClick={handleRetryVideoGeneration}
                    sx={{
                      color: "common.white",
                      bgcolor: alpha(theme.palette.error.main, 0.2),
                      border: `1px solid ${alpha(
                        theme.palette.error.main,
                        0.3
                      )}`,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.error.main, 0.3),
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {overallStatus === "paused" && (
                <Tooltip
                  title={`Resume video generation${
                    pausedAnalyses.length > 0
                      ? `\nPaused at: ${pausedAnalyses
                          .map(getAnalysisTitle)
                          .join(", ")}`
                      : ""
                  }`}
                  arrow
                >
                  <IconButton
                    size="small"
                    onClick={handleResumeVideoGeneration}
                    disabled={isResuming}
                    sx={{
                      color: "common.white",
                      bgcolor: alpha(theme.palette.warning.main, 0.2),
                      border: `1px solid ${alpha(
                        theme.palette.warning.main,
                        0.3
                      )}`,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.warning.main, 0.3),
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    {isResuming ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <PlayArrowIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              )}

              {hasVideoTask && (
                <IconButton
                  size="small"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  sx={{
                    color: "primary.main",
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.2)",
                    },
                  }}
                >
                  <ExpandMoreIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          </Stack>

          {/* Queue information */}
          {overallStatus === "pending" && videoTask?.queueInfo?.position && (
            <Box sx={{ mb: 3, position: "relative", zIndex: 1 }}>
              <Alert
                severity="info"
                sx={{
                  bgcolor: "rgba(33, 150, 243, 0.1)",
                  color: "common.white",
                  border: "1px solid rgba(33, 150, 243, 0.2)",
                  "& .MuiAlert-icon": { color: "info.main" },
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2">
                  Position in queue:{" "}
                  <strong>{videoTask.queueInfo.position}</strong>
                  {videoTask.queueInfo.estimatedWaitFormatted &&
                    ` • Est. wait: ${videoTask.queueInfo.estimatedWaitFormatted}`}
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Paused information */}
          {overallStatus === "paused" && pausedAnalyses.length > 0 && (
            <Box sx={{ mb: 3, position: "relative", zIndex: 1 }}>
              <Alert
                severity="warning"
                sx={{
                  bgcolor: "rgba(255, 152, 0, 0.1)",
                  color: "common.white",
                  border: "1px solid rgba(255, 152, 0, 0.2)",
                  "& .MuiAlert-icon": { color: "warning.main" },
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2">
                  <strong>Video generation paused</strong>
                  <br />
                  Paused at: {pausedAnalyses.map(getAnalysisTitle).join(", ")}
                  <br />
                  Click the resume button to continue processing.
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Main content */}
          <Collapse in={!isCollapsed || !hasVideoTask} timeout={400}>
            <Box sx={{ position: "relative", zIndex: 1 }}>
              {!hasVideoTask ? (
                /* Initial state */
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      border: `2px solid ${alpha(
                        theme.palette.primary.main,
                        0.3
                      )}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 2,
                      transition: "all 0.3s ease",
                    }}
                  >
                    <VideoIcon sx={{ color: "primary.main", fontSize: 32 }} />
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={
                      triggerVideoPipelineMutation.isPending ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <VideoIcon />
                      )
                    }
                    onClick={handleStartVideoGeneration}
                    disabled={triggerVideoPipelineMutation.isPending}
                    sx={{
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: "1rem",
                      "&:hover": {
                        bgcolor: "primary.dark",
                        transform: "translateY(-2px)",
                        boxShadow: `0 8px 25px ${alpha(
                          theme.palette.primary.main,
                          0.4
                        )}`,
                      },
                      "&:disabled": {
                        bgcolor: "rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.5)",
                      },
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {triggerVideoPipelineMutation.isPending
                      ? "Starting..."
                      : "Generate Video"}
                  </Button>
                </Box>
              ) : (
                /* Progress display */
                <Box>
                  {/* Progress Section */}
                  <Box sx={{ mb: 3 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ color: currentStageInfo.color }}>
                          {currentStageInfo.icon}
                        </Box>
                        <Typography
                          variant="body1"
                          color="common.white"
                          fontWeight={600}
                        >
                          {currentStageInfo.stage}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="h6"
                        color="common.white"
                        fontWeight={700}
                        sx={{
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {Math.round(overallProgress)}%
                      </Typography>
                    </Stack>

                    {/* Enhanced progress bar */}
                    <Box
                      sx={{
                        position: "relative",
                        height: 12,
                        bgcolor: "rgba(255,255,255,0.1)",
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      {/* Background segments */}
                      <Box
                        sx={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: "50%",
                          bgcolor: "rgba(255,255,255,0.05)",
                          borderRight: "1px solid rgba(255,255,255,0.1)",
                        }}
                      />

                      {/* Animated progress fill */}
                      <Box
                        sx={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: `${overallProgress}%`,
                          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          borderRadius: 2,
                          transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&::after": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                              "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                            animation:
                              overallStatus === "active"
                                ? "shimmer 2s infinite"
                                : "none",
                            "@keyframes shimmer": {
                              "0%": { transform: "translateX(-100%)" },
                              "100%": { transform: "translateX(100%)" },
                            },
                          },
                        }}
                      />
                    </Box>

                    {/* Stage labels */}
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mt: 1 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            overallProgress < 50
                              ? "primary.main"
                              : "rgba(255,255,255,0.6)",
                          fontWeight: overallProgress < 50 ? 600 : 400,
                        }}
                      >
                        Video Generation
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            overallProgress >= 50
                              ? "primary.main"
                              : "rgba(255,255,255,0.6)",
                          fontWeight: overallProgress >= 50 ? 600 : 400,
                        }}
                      >
                        Video Analysis
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Error message */}
                  {overallStatus === "failed" && (
                    <Alert
                      severity="error"
                      sx={{
                        bgcolor: "rgba(244, 67, 54, 0.1)",
                        color: "common.white",
                        border: "1px solid rgba(244, 67, 54, 0.2)",
                        "& .MuiAlert-icon": { color: "error.main" },
                        borderRadius: 0.5,
                      }}
                    >
                      <AlertTitle
                        sx={{ color: "common.white", fontWeight: 600 }}
                      >
                        Generation Failed
                      </AlertTitle>
                      <Typography variant="body2">
                        Please try again or contact support if the problem
                        persists.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Collapse>
        </Box>
      </Fade>

      {/* Resume Options Dialog */}
      <ResumeOptionsDialog
        scriptId={scriptId}
        versionId={versionId}
        open={resumeDialogOpen}
        onClose={() => setResumeDialogOpen(false)}
        onSimpleResume={handleSimpleResume}
        onConfigureResume={handleConfigureResume}
        resumeResponse={resumeResponse}
        isLoading={isResuming}
        showImage={false}
        showVideo={true}
      />

      {/* Credit Error Dialog */}
      <CreditErrorDisplay
        open={creditErrorDialogOpen && !!creditError}
        onOpenChange={(open) => {
          if (!open) {
            handleCreditErrorDismiss();
          }
        }}
        creditError={creditError || undefined}
        onPurchaseCredits={handlePurchaseCredits}
      />
    </>
  );
}

VideoGenerationProgress.displayName = "VideoGenerationProgress";

export default VideoGenerationProgress;
