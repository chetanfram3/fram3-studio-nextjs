"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  AlertTitle,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useAuthStore } from "@/store/authStore";
import {
  PlayArrow as PlayIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";
import TaskProgress from "./TaskProgress";
import type { ScriptInfo } from "@/types/storyMain/types";
import { usePipelineConfig } from "@/hooks/usePipelineConfig";
import { usePipelineStatus } from "@/hooks/usePipelineStatus";
import { useTriggerPipeline } from "@/hooks/useTriggerPipeline";
import { PIPELINE_STAGES as FALLBACK_STAGES } from "@/config/analysisTypes";
import { getStatusText } from "@/utils/pipelineUtils";
import CustomToast from "@/components/common/CustomToast";
import logger from "@/utils/logger";
import { useScripts } from "@/hooks/scripts/useScripts";
import { StageDetailsView } from "./StageDetailsView";
import { StageSimpleView } from "./StageSimpleView";

/**
 * Type-safe interfaces
 */
interface ComponentStatusProps {
  refetch: () => void;
  scriptInfo: ScriptInfo;
  details?: boolean;
}

interface StageDefinition {
  id?: string;
  name: string;
  types: string[];
  detailedInfo?: string;
}

interface AnalysisData {
  status: number;
  data?: unknown[];
}

interface StageData {
  analyses: Record<string, AnalysisData>;
  status: number;
  progress: number;
}

interface TaskInfoStage {
  progress: number;
  status: number | string;
  completed?: boolean;
  analyses: Record<string, AnalysisData>;
}

interface TaskInfo {
  id?: string;
  status: string;
  progress: number;
  updatedAt?:
    | {
        seconds?: number;
      }
    | number;
  stages?: Record<string, TaskInfoStage>;
  subscription?: string;
}

interface PipelineStatusData {
  taskInfo?: {
    stages?: TaskInfoStage[] | Record<string, TaskInfoStage>;
    subscription?: string;
  };
  subscriptionChanged?: boolean;
  currentSubscription?: string;
}

interface PipelineConfigData {
  stages?: Record<string, StageDefinition>;
}

/**
 * ComponentStatus Component
 *
 * Displays the status of the pipeline processing with stage details,
 * task progress, and control actions. Supports both simple and detailed views.
 * Fully theme-aware and optimized for performance.
 *
 * @component
 */
export function ComponentStatus({
  refetch,
  scriptInfo,
  details = false,
}: ComponentStatusProps) {
  const { scriptId, currentVersion: versionId } = scriptInfo;
  const { user } = useAuthStore();
  const theme = useTheme();
  const brand = getCurrentBrand();
  const userId = user?.uid;

  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [stageData, setStageData] = useState<Record<string, StageData>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [queueInfoAlert, setQueueInfoAlert] = useState<boolean>(false);
  const [notifiedAnalyses, setNotifiedAnalyses] = useState<Set<string>>(
    new Set()
  );
  const [taskInfo, setTaskInfo] = useState<TaskInfo | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");

  const { refetch: refetchLibrary } = useScripts({});

  // Get pipeline status with task info
  const { data: pipelineStatus, isLoading: pipelineStatusLoading } =
    usePipelineStatus(scriptId, versionId);

  const typedPipelineStatus = pipelineStatus as PipelineStatusData | undefined;

  // Get pipeline configuration based on execution subscription
  const { data: pipelineConfig, isLoading: configLoading } = usePipelineConfig(
    typedPipelineStatus?.taskInfo?.subscription
  );

  const typedPipelineConfig = pipelineConfig as PipelineConfigData | undefined;

  // Mutation for triggering pipeline
  const triggerPipelineMutation = useTriggerPipeline();

  // React 19: useMemo for dynamic stages
  const DYNAMIC_STAGES = useMemo(
    () => typedPipelineConfig?.stages || FALLBACK_STAGES,
    [typedPipelineConfig?.stages]
  );

  // React 19: useMemo for subscription info
  const subscriptionInfo = useMemo(
    () => ({
      subscriptionChanged: typedPipelineStatus?.subscriptionChanged || false,
      executionSubscription: typedPipelineStatus?.taskInfo?.subscription,
      currentSubscription:
        typedPipelineStatus?.currentSubscription ||
        user?.subscription ||
        "unknown",
    }),
    [typedPipelineStatus, user?.subscription]
  );

  // React 19: useMemo for all complete check
  const isAllComplete = useMemo(
    () => Object.values(stageData).every((stage) => stage.progress === 100),
    [stageData]
  );

  // React 19: useCallback for stage progress calculation
  const getStageProgress = useCallback(
    (stageKey: string, stageIndex: number): number => {
      if (taskInfo?.status === "completed" || taskInfo?.progress === 100) {
        return 100;
      }

      if (taskInfo?.stages) {
        const taskStage = taskInfo.stages[stageKey];
        if (taskStage && typeof taskStage.progress === "number") {
          return Math.round(taskStage.progress);
        }
        if (taskStage && (taskStage.completed || taskStage.status === 1)) {
          return 100;
        }
      }

      return Math.round(stageData[stageKey]?.progress || 0);
    },
    [taskInfo, stageData]
  );

  // React 19: useCallback for stage completion status
  const getStageCompletionStatus = useCallback(
    (stageKey: string): boolean => {
      if (taskInfo?.status === "completed" || taskInfo?.progress === 100) {
        return true;
      }

      if (taskInfo?.stages) {
        const taskStage = taskInfo.stages[stageKey];
        if (taskStage) {
          const analyses = taskStage.analyses || {};
          const hasPausedAnalyses = Object.values(analyses).some(
            (analysis) => analysis.status === -3
          );

          if (hasPausedAnalyses) {
            return false;
          }

          const allAnalysesCompleted = Object.values(analyses).every(
            (analysis) => analysis.status === 1
          );

          if (allAnalysesCompleted && taskStage.progress === 100) {
            return true;
          }

          if (
            !hasPausedAnalyses &&
            (taskStage.completed || taskStage.status === 1)
          ) {
            return true;
          }
        }
      }

      return stageData[stageKey]?.status === 1;
    },
    [taskInfo, stageData]
  );

  // React 19: useMemo for overall progress calculation
  const overallProgress = useMemo(() => {
    if (taskInfo?.status === "completed" || taskInfo?.progress === 100) {
      return 100;
    }

    if (
      taskInfo?.status === "active" &&
      typeof taskInfo?.progress === "number"
    ) {
      return Math.round(taskInfo.progress);
    }

    const stageKeys = Object.keys(DYNAMIC_STAGES);
    if (stageKeys.length === 0) return 0;

    const totalProgress = stageKeys.reduce((sum, stageKey) => {
      return sum + Math.round(stageData[stageKey]?.progress || 0);
    }, 0);

    const calculatedProgress = Math.round(totalProgress / stageKeys.length);

    if (typeof taskInfo?.progress === "number" && taskInfo.progress > 0) {
      return Math.round(taskInfo.progress);
    }

    return calculatedProgress;
  }, [taskInfo, stageData, DYNAMIC_STAGES]);

  // React 19: useCallback for progress color
  const getProgressColor = useCallback(() => {
    if (taskInfo?.status === "completed" || overallProgress === 100) {
      return "success";
    } else if (taskInfo?.status === "failed") {
      return "error";
    } else if (taskInfo?.status === "active") {
      return "primary";
    } else {
      return "inherit";
    }
  }, [taskInfo?.status, overallProgress]);

  // React 19: useCallback for task status change handler
  const handleTaskStatusChange = useCallback(
    (oldStatus: string, newStatus: string) => {
      logger.info(`Task status changed: ${oldStatus} -> ${newStatus}`);

      if (oldStatus === "pending" && newStatus === "active") {
        logger.info("Task started processing");
        setQueueInfoAlert(true);
        refetch();
      }
    },
    [refetch]
  );

  // React 19: useCallback for trigger pipeline handler
  const handleTriggerPipeline = useCallback(() => {
    setDialogOpen(true);
  }, []);

  // React 19: useCallback for confirm trigger handler
  const handleConfirmTrigger = useCallback(() => {
    triggerPipelineMutation.mutate({ scriptId, versionId });
    setDialogOpen(false);
  }, [triggerPipelineMutation, scriptId, versionId]);

  // React 19: useCallback for refresh status handler
  const handleRefreshStatus = useCallback(() => {
    logger.info("Manually refreshing pipeline status");
    refetch();
    CustomToast("info", "Refreshing pipeline status...");
  }, [refetch]);

  // React 19: useCallback for dialog close handler
  const handleDialogClose = useCallback(() => {
    if (!triggerPipelineMutation.isPending) {
      setDialogOpen(false);
    }
  }, [triggerPipelineMutation.isPending]);

  // Effect to handle queue alerts based on task status
  useEffect(() => {
    if (taskInfo?.status === "active") {
      setQueueInfoAlert(false);
    } else if (taskInfo?.status === "pending") {
      setQueueInfoAlert(true);
    } else {
      setQueueInfoAlert(false);
    }
  }, [taskInfo?.status]);

  // Effect to initialize stage data from pipeline status API
  useEffect(() => {
    if (!typedPipelineStatus?.taskInfo?.stages) return;

    console.log("Initializing stage data from pipeline status");

    const initialStageData: Record<string, StageData> = {};
    const analysisStatusMap: Record<string, number> = {};

    if (Array.isArray(typedPipelineStatus.taskInfo.stages)) {
      // Array format processing
      typedPipelineStatus.taskInfo.stages.forEach((stage: TaskInfoStage) => {
        Object.entries(stage.analyses).forEach(([type, analysis]) => {
          const numericStatus =
            typeof analysis.status === "number"
              ? analysis.status
              : analysis.status === "completed"
                ? 1
                : analysis.status === "failed"
                  ? -1
                  : 0;

          analysisStatusMap[type] = numericStatus;
        });
      });

      Object.entries(DYNAMIC_STAGES).forEach(
        ([stageKey, stageConfig]: [string, StageDefinition]) => {
          const matchingStage = typedPipelineStatus.taskInfo?.stages?.find(
            (s: TaskInfoStage & { id?: string }) => s.id === stageConfig.id
          );

          const analyses: Record<string, AnalysisData> = {};

          stageConfig.types.forEach((type: string) => {
            analyses[type] = {
              status:
                analysisStatusMap[type] !== undefined
                  ? analysisStatusMap[type]
                  : -2,
              data: undefined,
            };
          });

          let stageStatus = -2;
          let stageProgress = 0;

          if (matchingStage) {
            stageStatus =
              matchingStage.status === "completed"
                ? 1
                : matchingStage.status === "failed"
                  ? -1
                  : 0;
            stageProgress = matchingStage.progress || 0;
          } else {
            stageStatus = Object.values(analyses).every((a) => a.status === 1)
              ? 1
              : Object.values(analyses).some((a) => a.status === -1)
                ? -1
                : Object.values(analyses).some((a) => a.status === 0)
                  ? 0
                  : -2;

            stageProgress =
              Object.values(analyses).length > 0
                ? Math.floor(
                    (Object.values(analyses).filter((a) => a.status === 1)
                      .length /
                      Object.values(analyses).length) *
                      100
                  )
                : 0;
          }

          initialStageData[stageKey] = {
            analyses,
            status: stageStatus,
            progress: stageProgress,
          };
        }
      );
    } else {
      // Object format
      Object.values(typedPipelineStatus.taskInfo.stages).forEach(
        (stage: TaskInfoStage) => {
          Object.entries(stage.analyses).forEach(
            ([type, analysis]: [string, AnalysisData]) => {
              analysisStatusMap[type] = analysis.status;
            }
          );
        }
      );

      Object.entries(DYNAMIC_STAGES).forEach(
        ([stageKey, stage]: [string, StageDefinition]) => {
          const analyses: Record<string, AnalysisData> = {};

          stage.types.forEach((type: string) => {
            analyses[type] = {
              status:
                analysisStatusMap[type] !== undefined
                  ? analysisStatusMap[type]
                  : -2,
              data: undefined,
            };
          });

          const stageStatus = Object.values(analyses).every(
            (a) => a.status === 1
          )
            ? 1
            : Object.values(analyses).some((a) => a.status === -1)
              ? -1
              : Object.values(analyses).some((a) => a.status === 0)
                ? 0
                : -2;

          const stageProgress =
            Object.values(analyses).length > 0
              ? Math.floor(
                  (Object.values(analyses).filter((a) => a.status === 1)
                    .length /
                    Object.values(analyses).length) *
                    100
                )
              : 0;

          initialStageData[stageKey] = {
            analyses,
            status: stageStatus,
            progress: stageProgress,
          };
        }
      );
    }

    setStageData(initialStageData);
  }, [typedPipelineStatus, DYNAMIC_STAGES]);

  // Effect to handle task status changes and notifications
  useEffect(() => {
    if (!taskInfo) return;

    // Update last update time
    if (taskInfo.updatedAt) {
      const date = new Date(
        typeof taskInfo.updatedAt === "object" && taskInfo.updatedAt.seconds
          ? taskInfo.updatedAt.seconds * 1000
          : taskInfo.updatedAt
      );
      setLastUpdateTime(`Last updated: ${date.toLocaleTimeString()}`);
    }

    // Handle overall task completion notifications
    if (taskInfo.status === "completed" && !notifiedAnalyses.has("completed")) {
      CustomToast("success", "Pipeline completed successfully!");
      setNotifiedAnalyses((prev) => new Set([...prev, "completed"]));
      refetch();
      refetchLibrary();
    } else if (
      taskInfo.status === "failed" &&
      !notifiedAnalyses.has("failed")
    ) {
      CustomToast("error", "Pipeline failed");
      setNotifiedAnalyses((prev) => new Set([...prev, "failed"]));
    } else if (
      taskInfo.status === "paused" &&
      !notifiedAnalyses.has("paused")
    ) {
      CustomToast("warning", "Pipeline paused");
      setNotifiedAnalyses((prev) => new Set([...prev, "paused"]));
    }

    // Check for individual analysis completions
    if (taskInfo.stages && taskInfo.status === "active") {
      Object.values(taskInfo.stages).forEach((stage: TaskInfoStage) => {
        if (stage.analyses) {
          Object.entries(stage.analyses).forEach(
            ([analysisType, analysis]: [string, AnalysisData]) => {
              if (
                analysis.status === 1 &&
                !notifiedAnalyses.has(analysisType)
              ) {
                // Handle specific analysis completion notifications
                const notifications: Record<
                  string,
                  { message: string; refetch?: boolean; refetchLib?: boolean }
                > = {
                  scriptInfo: {
                    message: "Script Info is now Ready!",
                    refetch: true,
                  },
                  rating: {
                    message: "Market Research is now Ready!",
                    refetch: true,
                  },
                  audioProcessor: {
                    message: "Audio Processing is completed!",
                    refetch: true,
                  },
                  shotMapper: { message: "Overview Section is now available!" },
                  processScenesAndShots: {
                    message: "Visuals is now complete!",
                    refetch: true,
                  },
                  videoEditor: {
                    message: "Video Editor is now complete!",
                    refetch: true,
                  },
                  keyVisualProcessor: {
                    message: "Key Visual Image is now Ready!",
                    refetchLib: true,
                  },
                  processActorImages: {
                    message: "Actor Images are now Ready!",
                    refetchLib: true,
                  },
                };

                const notification = notifications[analysisType];
                if (notification) {
                  CustomToast("success", notification.message);
                  if (notification.refetch) refetch();
                  if (notification.refetchLib) refetchLibrary();
                }

                setNotifiedAnalyses((prev) => new Set([...prev, analysisType]));
              }
            }
          );
        }
      });
    }

    // Reset notifications when task changes or restarts
    if (taskInfo.status === "pending") {
      setNotifiedAnalyses(new Set());
    }
  }, [taskInfo, refetch, refetchLibrary, notifiedAnalyses]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      setNotifiedAnalyses(new Set());
    };
  }, []);

  // Show loading state while configurations are loading
  if (configLoading || pipelineStatusLoading) {
    return <LoadingAnimation message="Loading pipeline configuration..." />;
  }

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        border: 1,
        borderColor: "divider",
        borderRadius: `${brand.borderRadius}px`,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="h5"
            color="primary"
            sx={{ fontFamily: brand.fonts.heading }}
          >
            Process Flow
          </Typography>
          <Box
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            gap={2}
          >
            <Tooltip title="Refresh pipeline status">
              <IconButton
                onClick={handleRefreshStatus}
                color="primary"
                size="small"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              {lastUpdateTime}
            </Typography>
            <TaskProgress
              scriptId={scriptId}
              versionId={versionId}
              onTaskInfoChange={setTaskInfo}
              onTaskStatusChange={handleTaskStatusChange}
            />
          </Box>
        </Box>

        {/* Queue Information Alert */}
        {queueInfoAlert && taskInfo?.status === "pending" && (
          <Alert
            severity="info"
            onClose={() => setQueueInfoAlert(false)}
            sx={{ mb: 3 }}
          >
            <AlertTitle sx={{ fontFamily: brand.fonts.heading }}>
              Pipeline Queued
            </AlertTitle>
            <Typography sx={{ fontFamily: brand.fonts.body }}>
              Your task is currently queued and waiting to be processed. Please
              wait for other tasks to complete. When processing begins, you will
              see live updates here.
            </Typography>
          </Alert>
        )}

        {queueInfoAlert && taskInfo?.status === "active" && (
          <Alert
            severity="success"
            onClose={() => setQueueInfoAlert(false)}
            sx={{ mb: 3 }}
          >
            <AlertTitle sx={{ fontFamily: brand.fonts.heading }}>
              Processing Started
            </AlertTitle>
            <Typography sx={{ fontFamily: brand.fonts.body }}>
              Your pipeline is now being processed. You should see live updates
              shortly.
            </Typography>
          </Alert>
        )}

        {/* Subscription change warning */}
        {subscriptionInfo.subscriptionChanged && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle sx={{ fontFamily: brand.fonts.heading }}>
              Subscription Changed
            </AlertTitle>
            <Typography sx={{ fontFamily: brand.fonts.body }}>
              This pipeline was executed with a{" "}
              {subscriptionInfo.executionSubscription} subscription. Your
              current subscription is {subscriptionInfo.currentSubscription}.
              The status reflects what was executed at the time of pipeline
              creation.
            </Typography>
          </Alert>
        )}

        {/* Conditional rendering based on details prop */}
        {details ? (
          <StageDetailsView
            DYNAMIC_STAGES={DYNAMIC_STAGES}
            FALLBACK_STAGES={FALLBACK_STAGES}
            stageData={stageData}
            taskInfo={taskInfo}
            getStageProgress={getStageProgress}
            getStageCompletionStatus={getStageCompletionStatus}
          />
        ) : (
          <StageSimpleView
            DYNAMIC_STAGES={DYNAMIC_STAGES}
            stageData={stageData}
            taskInfo={taskInfo}
            getStageProgress={getStageProgress}
            getStageCompletionStatus={getStageCompletionStatus}
            overallProgress={overallProgress}
            getProgressColor={getProgressColor}
          />
        )}

        {/* Stage details - only shown when details=true and stage is selected */}
        {details && selectedStage && (
          <Box
            sx={{
              mt: 3,
              p: 3,
              bgcolor: "background.paper",
              borderRadius: `${brand.borderRadius}px`,
              border: 1,
              borderColor: "divider",
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontFamily: brand.fonts.heading }}
              >
                {DYNAMIC_STAGES[selectedStage]?.name || ""}
              </Typography>

              <Tooltip title="View detailed analysis information">
                <IconButton size="small" color="primary">
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{ fontFamily: brand.fonts.body }}
            >
              {FALLBACK_STAGES[selectedStage]?.detailedInfo || ""}
            </Typography>

            <Box mt={2}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Analysis Progress:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {(DYNAMIC_STAGES[selectedStage]?.types || []).map(
                  (type: string) => {
                    const analysisStatus =
                      stageData[selectedStage]?.analyses[type]?.status || -2;
                    return (
                      <Box key={type}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          {type}: {getStatusText(analysisStatus)}
                        </Typography>
                      </Box>
                    );
                  }
                )}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Stage Progress:{" "}
                  {getStageProgress(
                    selectedStage,
                    Object.keys(DYNAMIC_STAGES).indexOf(selectedStage)
                  )}
                  %
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    height: 6,
                    borderRadius: `${brand.borderRadius}px`,
                    bgcolor: "background.paper",
                    mt: 1,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: `${getStageProgress(
                        selectedStage,
                        Object.keys(DYNAMIC_STAGES).indexOf(selectedStage)
                      )}%`,
                      height: "100%",
                      bgcolor: getStageCompletionStatus(selectedStage)
                        ? "success.main"
                        : stageData[selectedStage]?.status === 0
                          ? "primary.main"
                          : stageData[selectedStage]?.status === -1
                            ? "error.main"
                            : "grey.500",
                      borderRadius: `${brand.borderRadius}px`,
                      transition: theme.transitions.create("width", {
                        duration: theme.transitions.duration.standard,
                      }),
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Pipeline Trigger Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleDialogClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "background.paper",
              backgroundImage: "none !important",
              borderRadius: `${brand.borderRadius * 1.5}px`,
              border: 2,
              borderColor: "primary.main",
            },
          }}
        >
          <DialogTitle
            sx={{
              m: 0,
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: brand.fonts.heading,
            }}
          >
            Trigger FRAM3 Pipeline
            <IconButton
              aria-label="close"
              onClick={handleDialogClose}
              sx={{ color: "text.secondary" }}
              disabled={triggerPipelineMutation.isPending}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Typography sx={{ fontFamily: brand.fonts.body }}>
              Are you sure you want to trigger the pipeline? This will process
              incomplete stages of analysis for your script.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleDialogClose}
              disabled={triggerPipelineMutation.isPending}
              sx={{ fontFamily: brand.fonts.body }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmTrigger}
              disabled={triggerPipelineMutation.isPending}
              sx={{ fontFamily: brand.fonts.body }}
            >
              {triggerPipelineMutation.isPending ? "Triggering..." : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Box>
  );
}

ComponentStatus.displayName = "ComponentStatus";
