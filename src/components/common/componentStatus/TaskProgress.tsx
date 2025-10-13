"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Stack,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Hourglass,
  Play,
  Pause,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useFindTask,
  useRetryTask,
  useResumeTask,
  useTaskProgress,
} from "@/hooks/useTasks";
import {
  getPausedAnalyses,
  getErrorMessage,
  ResumeTaskResponse,
} from "@/services/taskService";
import { useQueryClient } from "@tanstack/react-query";
import CustomToast from "@/components/common/CustomToast";
import ResumeOptionsDialog from "./ResumeOptionsDialog";
import CreditErrorDisplay from "@/components/common/CreditErrorDisplay";
import { ANALYSIS_TITLES } from "@/config/analysisTypes";
import { CreditErrorResponse } from "@/types";

/**
 * Type-safe interfaces
 */
interface TaskProgressProps {
  scriptId: string;
  versionId: string;
  className?: string;
  onTaskInfoChange?: (taskInfo: TaskInfo) => void;
  onTaskStatusChange?: (oldStatus: string, newStatus: string) => void;
}

interface TaskInfo {
  id: string;
  status: TaskStatus;
  progress: number;
  error?: ErrorInfo;
  queueInfo?: QueueInfo;
  [key: string]: unknown;
}

interface ErrorInfo {
  message?: string;
  [key: string]: unknown;
}

interface QueueInfo {
  position?: number;
  total?: number;
  estimatedWaitFormatted?: string;
  state?: string;
}

type TaskStatus =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "paused"
  | null;

export type ResumeResponse = ResumeTaskResponse & {
  canResume?: boolean;
  reason?: string;
  message?: string;
  availablePausedAnalyses?: string[];
  currentPauseBefore?: string[];
  suggestion?: string;
  actionRequired?: string;
  resumeInfo?: {
    totalCompleted: number;
    totalPaused: number;
    pausedAnalyses: string[];
    canResumeByUnpausing: boolean;
  };
  success?: boolean;
  resumeType?: string;
  taskId?: string;
  newJobId?: string;
  newTaskId?: string;
  checkpointId?: string;
  resumeDetails?: {
    analysesToResume?: string[];
    analysesCount?: number;
    availablePausedAnalyses?: string[];
    completedBeforeResume?: number;
    currentPauseBefore?: string[];
  };
  creditInfo?: unknown;
  error?: string;
  errorType?: string;
  details?: {
    required?: number;
    available?: number;
    shortfall?: number;
    percentageAvailable?: string;
    recommendedPackage?: {
      recommended: string;
      reason: string;
      price: number;
      credits: number;
      bonus: number;
    };
  };
  required?: number;
  available?: number;
  shortfall?: number;
  resumeContext?: unknown;
  note?: string;
  response?: {
    data?: ResumeResponse;
  };
};

interface ErrorWithResponse extends Error {
  response?: {
    data?: ResumeResponse;
  };
}

/**
 * Styled components with theme integration
 */
const ProgressContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(1),
  minWidth: 100,
  minHeight: 100,
}));

const ChipsContainer = styled(Stack)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  width: "100%",
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
}));

const IconContainer = styled(Box)({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
});

const ActionButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: -8,
  right: -8,
  padding: 0,
  backgroundColor: theme.palette.background.paper,
  borderRadius: "50%",
  width: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: theme.shadows[3],
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:hover .MuiTooltip-tooltip": {
    display: "none !important",
  },
}));

const QueuedChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontSize: "0.8rem",
  fontWeight: 500,
  height: 24,
  margin: theme.spacing(0, 0.5),
}));

const WaitTimeChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.info.light,
  color: theme.palette.info.contrastText,
  fontSize: "0.8rem",
  fontWeight: 500,
  height: 24,
  margin: theme.spacing(0, 0.5),
}));

/**
 * Helper function to get status color from theme
 */
const getStatusColor = (
  status: TaskStatus,
  theme: ReturnType<typeof useTheme>
): string => {
  switch (status) {
    case "completed":
      return theme.palette.success.main;
    case "failed":
      return theme.palette.error.main;
    case "active":
      return theme.palette.success.main;
    case "pending":
      return theme.palette.warning.main;
    case "paused":
      return theme.palette.warning.main;
    default:
      return theme.palette.grey[500];
  }
};

/**
 * Helper function to get tooltip content
 */
const getTooltipContent = (
  status: TaskStatus,
  progress: number,
  error?: ErrorInfo,
  queueInfo?: QueueInfo,
  pausedAnalyses?: string[]
): string => {
  if (!status) {
    return "Unknown status";
  }

  switch (status) {
    case "completed":
      return "Task completed successfully";
    case "failed": {
      const errorMessage = getErrorMessage({ error } as TaskInfo);
      if (errorMessage) {
        return `Task failed: ${errorMessage}`;
      }
      return "Task failed - Click retry to try again";
    }
    case "active":
      return `Processing: ${progress}%`;
    case "pending":
      if (queueInfo?.position) {
        return `Queued (Position: ${queueInfo.position} of ${
          queueInfo.total || "?"
        })\nEstimated wait: ${
          queueInfo.estimatedWaitFormatted || "calculating..."
        }`;
      }
      return "Task pending. Please wait for other tasks to complete.";
    case "paused":
      if (pausedAnalyses && pausedAnalyses.length > 0) {
        const pausedTitles = pausedAnalyses.map(getAnalysisTitle);
        return `Task paused before: ${pausedTitles.join(
          ", "
        )}\nClick for options to resume`;
      }
      return "Task paused - Click for resume options";
    default:
      return "Unknown status";
  }
};

/**
 * Helper function to get analysis title
 */
const getAnalysisTitle = (analysisType: string): string => {
  return (
    ANALYSIS_TITLES[analysisType as keyof typeof ANALYSIS_TITLES] ||
    analysisType
  );
};

/**
 * Helper function to check if response is a credit error
 */
const isCreditError = (
  response: ResumeResponse
): response is CreditErrorResponse => {
  return (
    response?.errorType === "credit_insufficient" ||
    (!!response?.error &&
      !!response?.details?.required &&
      !!response?.details?.available)
  );
};

/**
 * Helper function to convert ResumeResponse to CreditErrorResponse
 */
const convertToCreditErrorResponse = (
  resumeResponse: ResumeResponse,
  scriptId: string,
  versionId: string
): CreditErrorResponse => {
  return {
    error: {
      message:
        resumeResponse.message ||
        resumeResponse.error ||
        "Insufficient credits to resume pipeline",
      details: resumeResponse.details || {
        required: resumeResponse.required || 0,
        available: resumeResponse.available || 0,
        shortfall: resumeResponse.shortfall || 0,
        percentageAvailable: resumeResponse.details?.percentageAvailable || "0",
        recommendedPackage: resumeResponse.details?.recommendedPackage || {
          recommended: "starter",
          reason: "Upgrade needed",
          price: 10,
          credits: 10000,
          bonus: 0,
        },
      },
    },
    scriptId,
    versionId,
    route: "resume",
    note:
      resumeResponse.note ||
      "Resume operation failed due to insufficient credits. Your checkpoint data is preserved.",
  };
};

/**
 * StatusIcon Component
 */
interface StatusIconProps {
  status: TaskStatus;
  theme: ReturnType<typeof useTheme>;
  size?: number;
}

const StatusIcon = ({ status, theme, size = 24 }: StatusIconProps) => {
  if (!status) return null;

  switch (status) {
    case "completed":
      return (
        <CheckCircle
          style={{
            width: size,
            height: size,
            color: "white",
          }}
        />
      );
    case "failed":
      return (
        <AlertCircle
          style={{
            width: size,
            height: size,
            color: "white",
          }}
        />
      );
    case "pending":
      return (
        <Hourglass
          style={{
            width: size,
            height: size,
            color: theme.palette.primary.main,
          }}
        />
      );
    case "paused":
      return (
        <Pause
          style={{
            width: size,
            height: size,
            color: "white",
          }}
        />
      );
    default:
      return null;
  }
};

/**
 * TaskProgress Component
 *
 * Displays task progress with status indicators, queue information,
 * and action buttons for retry/resume operations.
 * Fully theme-aware and optimized for performance.
 *
 * @component
 */
const TaskProgress = ({
  scriptId,
  versionId,
  className = "",
  onTaskInfoChange,
  onTaskStatusChange,
}: TaskProgressProps) => {
  const { user } = useAuth();
  const theme = useTheme();
  const brand = getCurrentBrand();
  const queryClient = useQueryClient();

  const [pollingInterval, setPollingInterval] = useState<number | false>(3000);
  const previousStatusRef = useRef<TaskStatus>(null);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [resumeResponse, setResumeResponse] = useState<ResumeResponse | null>(
    null
  );
  const [creditError, setCreditError] = useState<CreditErrorResponse | null>(
    null
  );
  const [creditErrorDialogOpen, setCreditErrorDialogOpen] = useState(false);

  const enabled = !!user?.uid;

  const taskQuery = useFindTask(user?.uid || "", scriptId, versionId, {
    enabled: enabled,
    refetchInterval: pollingInterval,
  });

  const taskProgress = useTaskProgress(taskQuery);

  // React 19: useCallback for retry success handler
  const handleRetrySuccess = useCallback(() => {
    setPollingInterval(3000);
    queryClient.invalidateQueries({
      queryKey: ["task", user?.uid, scriptId, versionId],
    });
    CustomToast("success", "Task retry initiated successfully");
  }, [queryClient, user?.uid, scriptId, versionId]);

  // React 19: useCallback for retry error handler
  const handleRetryError = useCallback(
    (error: ErrorWithResponse) => {
      if (error.response?.data && isCreditError(error.response.data)) {
        const creditErrorResponse = convertToCreditErrorResponse(
          error.response.data,
          scriptId,
          versionId
        );
        setCreditError(creditErrorResponse);
        setCreditErrorDialogOpen(true);
      } else {
        CustomToast("error", `Failed to retry task: ${error.message}`);
      }
    },
    [scriptId, versionId]
  );

  const retryTask = useRetryTask({
    onSuccess: handleRetrySuccess,
    onError: handleRetryError,
  });

  // React 19: useCallback for resume success handler
  const handleResumeSuccess = useCallback(
    (data: ResumeTaskResponse) => {
      const resumeData = data as ResumeResponse;

      if (isCreditError(resumeData)) {
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

        CustomToast("info", "Task paused - configuration required to resume", {
          details: `Paused analyses: ${pausedAnalysesNames.join(", ")}`,
          duration: 8000,
        });
      } else if (resumeData.success === true || resumeData.canResume === true) {
        setPollingInterval(3000);
        queryClient.invalidateQueries({
          queryKey: ["task", user?.uid, scriptId, versionId],
        });
        setResumeDialogOpen(false);

        if (resumeData.resumeType === "checkpoint") {
          CustomToast(
            "success",
            `Pipeline resumed from checkpoint. ${
              resumeData.resumeDetails?.analysesCount || 0
            } analyses will continue.`
          );
        } else {
          CustomToast("success", "Task resumed successfully");
        }
      } else {
        setResumeResponse(resumeData);
        setResumeDialogOpen(true);
        CustomToast("info", resumeData.message || "Resume response received", {
          details: "Check the dialog for more information",
        });
      }
    },
    [queryClient, user?.uid, scriptId, versionId]
  );

  // React 19: useCallback for resume error handler
  const handleResumeError = useCallback(
    (error: ErrorWithResponse) => {
      if (error.response?.data && isCreditError(error.response.data)) {
        const creditErrorResponse = convertToCreditErrorResponse(
          error.response.data,
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

        CustomToast("error", errorData.message || "Failed to resume task", {
          details: errorData.suggestion || errorData.reason,
        });
      } else {
        CustomToast("error", `Failed to resume task: ${error.message}`);
      }
    },
    [scriptId, versionId]
  );

  const resumeTask = useResumeTask({
    onSuccess: handleResumeSuccess,
    onError: handleResumeError,
  });

  // React 19: useCallback for configure resume handler
  const handleConfigureResume = useCallback(() => {
    CustomToast(
      "info",
      "Opening pause configuration... (Feature to be implemented)"
    );
    setResumeDialogOpen(false);
  }, []);

  // React 19: useCallback for simple resume handler
  const handleSimpleResume = useCallback(() => {
    if (taskQuery.data?.task?.id) {
      resumeTask.mutate(taskQuery.data.task.id);
    }
  }, [taskQuery.data?.task?.id, resumeTask]);

  // React 19: useCallback for resume click handler
  const handleResumeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (taskQuery.data?.task?.id) {
        CustomToast("info", "Initiating task resume...", {
          duration: 2000,
        });

        resumeTask.mutate(taskQuery.data.task.id);
      } else {
        CustomToast("error", "Unable to resume: No task ID found");
      }
    },
    [taskQuery.data?.task?.id, resumeTask]
  );

  // React 19: useCallback for credit error handlers
  const handleCreditErrorDismiss = useCallback(() => {
    setCreditErrorDialogOpen(false);
    setCreditError(null);
  }, []);

  const handlePurchaseCredits = useCallback(() => {
    setCreditErrorDialogOpen(false);
    setCreditError(null);
  }, []);

  // React 19: useCallback for retry click handler
  const handleRetryClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, taskId: string) => {
      e.stopPropagation();
      retryTask.mutate(taskId);
    },
    [retryTask]
  );

  // Effect to notify parent of task info changes
  useEffect(() => {
    if (taskQuery.data?.task && onTaskInfoChange) {
      onTaskInfoChange(taskQuery.data.task);
    }
  }, [taskQuery.data?.task, onTaskInfoChange]);

  // Effect to update queue info
  useEffect(() => {
    if (taskQuery.data?.task?.queueInfo) {
      setQueueInfo(taskQuery.data.task.queueInfo);
    } else {
      setQueueInfo(null);
    }
  }, [taskQuery.data?.task?.queueInfo]);

  // Effect to handle status changes and polling
  useEffect(() => {
    const currentStatus = taskQuery.data?.task?.status;

    if (
      currentStatus &&
      onTaskStatusChange &&
      previousStatusRef.current !== currentStatus
    ) {
      onTaskStatusChange(previousStatusRef.current || "", currentStatus);
      previousStatusRef.current = currentStatus;
    }

    if (currentStatus === "pending") {
      setPollingInterval(2000);
    } else if (currentStatus === "active") {
      setPollingInterval(3000);
    } else if (
      currentStatus === "completed" ||
      currentStatus === "failed" ||
      currentStatus === "paused"
    ) {
      setPollingInterval(false);
      queryClient.invalidateQueries({
        queryKey: ["task", user?.uid, scriptId, versionId],
      });
    }
  }, [
    taskQuery.data?.task?.status,
    queryClient,
    user?.uid,
    scriptId,
    versionId,
    onTaskStatusChange,
  ]);

  // React 19: useMemo for computed values
  const task = taskQuery.data?.task;

  const computedValues = useMemo(() => {
    if (!task) return null;

    const progress = Math.round(task.progress || 0);
    const isPending = task.status === "pending";
    const isPaused = task.status === "paused";
    const isFailed = task.status === "failed";
    const pausedAnalyses = getPausedAnalyses(task);

    const hasQueuePosition =
      queueInfo &&
      typeof queueInfo.position === "number" &&
      queueInfo.position > 0;

    const queueLabel = hasQueuePosition
      ? `#${queueInfo.position}${queueInfo.total ? `/${queueInfo.total}` : ""}`
      : "Queued";

    const showChips =
      isPending &&
      queueInfo?.state !== "active" &&
      queueInfo?.estimatedWaitFormatted !== "processing now" &&
      (hasQueuePosition || (queueInfo && queueInfo.estimatedWaitFormatted));

    const circleSize = showChips ? 60 : 80;
    const iconSize = showChips ? 18 : 24;
    const typographyVariant = showChips ? "h5" : "h4";

    const tooltipContent = getTooltipContent(
      task.status,
      progress,
      task.error,
      queueInfo,
      pausedAnalyses
    );

    return {
      progress,
      isPending,
      isPaused,
      isFailed,
      pausedAnalyses,
      hasQueuePosition,
      queueLabel,
      showChips,
      circleSize,
      iconSize,
      typographyVariant,
      tooltipContent,
    };
  }, [task, queueInfo]);

  if (taskQuery.isLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width={80}
        height={80}
      >
        <CircularProgress size={60} color="primary" />
      </Box>
    );
  }

  if (taskQuery.isError || !task?.status || !computedValues) {
    return null;
  }

  const {
    progress,
    isPending,
    isPaused,
    isFailed,
    pausedAnalyses,
    hasQueuePosition,
    queueLabel,
    showChips,
    circleSize,
    iconSize,
    typographyVariant,
    tooltipContent,
  } = computedValues;

  return (
    <>
      <Tooltip title={tooltipContent} disableHoverListener={isPaused}>
        <ProgressContainer className={className}>
          {showChips && (
            <ChipsContainer spacing={0} direction="row">
              {isPending && (
                <QueuedChip
                  size="small"
                  label={queueLabel}
                  icon={
                    <Clock
                      style={{
                        width: 14,
                        height: 14,
                        color: theme.palette.primary.contrastText,
                      }}
                    />
                  }
                  sx={{ fontFamily: brand.fonts.body }}
                />
              )}

              {isPending &&
                hasQueuePosition &&
                queueInfo?.estimatedWaitFormatted && (
                  <WaitTimeChip
                    size="small"
                    label={queueInfo.estimatedWaitFormatted}
                    icon={
                      <Hourglass
                        style={{
                          width: 14,
                          height: 14,
                          color: theme.palette.primary.dark,
                        }}
                      />
                    }
                    sx={{ fontFamily: brand.fonts.body }}
                  />
                )}
            </ChipsContainer>
          )}

          <Box
            position="relative"
            width={circleSize}
            height={circleSize}
            sx={{
              bgcolor:
                task.status === "completed"
                  ? "success.main"
                  : task.status === "active"
                    ? "background.default"
                    : task.status === "paused"
                      ? "warning.main"
                      : "inherit",
              borderRadius: "50%",
            }}
          >
            <CircularProgress
              variant={
                isPending && queueInfo?.state !== "active"
                  ? "indeterminate"
                  : "determinate"
              }
              value={progress}
              size={circleSize}
              thickness={showChips ? 3 : 4}
              color="primary"
              style={{
                color:
                  task.status === "completed"
                    ? theme.palette.success.main
                    : getStatusColor(task.status, theme),
              }}
            />
            <IconContainer>
              {task.status === "active" ||
              (task.status === "pending" && queueInfo?.state === "active") ? (
                <Typography
                  variant={typographyVariant}
                  component="div"
                  color="primary.main"
                  fontWeight="bold"
                  sx={{
                    fontSize: showChips ? "1.25rem" : "1.5rem",
                    fontFamily: brand.fonts.heading,
                  }}
                >
                  {`${progress}%`}
                </Typography>
              ) : (
                <StatusIcon
                  status={task.status}
                  theme={theme}
                  size={iconSize}
                />
              )}
            </IconContainer>
          </Box>

          {/* Retry button for failed tasks */}
          {isFailed && task.id && (
            <Tooltip title="Retry failed task">
              <ActionButton
                onClick={(e) => handleRetryClick(e, task.id)}
                disabled={retryTask.isLoading}
                size="small"
                sx={{
                  top: showChips ? 8 : -8,
                  right: -8,
                  backgroundColor: theme.palette.error.main,
                  "&:hover": {
                    backgroundColor: theme.palette.error.dark,
                  },
                }}
              >
                <RefreshCw style={{ width: 16, height: 16, color: "white" }} />
              </ActionButton>
            </Tooltip>
          )}

          {/* Resume button for paused tasks */}
          {isPaused && task.id && (
            <Tooltip
              title={
                pausedAnalyses.length > 0
                  ? `Paused before: ${pausedAnalyses
                      .map(getAnalysisTitle)
                      .join(", ")}\nClick to resume`
                  : "Task paused - Click to resume"
              }
            >
              <ActionButton
                onClick={handleResumeClick}
                disabled={resumeTask.isLoading}
                size="small"
                sx={{
                  top: showChips ? 8 : -8,
                  right: -8,
                  backgroundColor: theme.palette.primary.main,
                  "&:hover": {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
              >
                <Play style={{ width: 16, height: 16, color: "white" }} />
              </ActionButton>
            </Tooltip>
          )}
        </ProgressContainer>
      </Tooltip>

      {/* Resume Options Dialog */}
      <ResumeOptionsDialog
        scriptId={scriptId}
        versionId={versionId}
        open={resumeDialogOpen}
        onClose={() => setResumeDialogOpen(false)}
        onSimpleResume={handleSimpleResume}
        onConfigureResume={handleConfigureResume}
        resumeResponse={resumeResponse}
        isLoading={resumeTask.isLoading}
        showImage={true}
        showVideo={false}
      />

      {/* Credit Error Dialog */}
      {creditError && (
        <CreditErrorDisplay
          open={creditErrorDialogOpen}
          onOpenChange={setCreditErrorDialogOpen}
          creditError={creditError}
          onPurchaseCredits={handlePurchaseCredits}
        />
      )}
    </>
  );
};

TaskProgress.displayName = "TaskProgress";

export default TaskProgress;
