"use client";

import React, { useState } from "react";
import {
  Button,
  CircularProgress,
  Tooltip,
  Box,
  Typography,
  IconButton,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Image, Video, Play, Ban, RefreshCw } from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";
import { useAuthStore } from "@/store/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { API_BASE_URL, processorSteps } from "@/config/constants";
import CustomToast from "@/components/common/CustomToast";
import logger from "@/utils/logger";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ApprovalButtonProps {
  type: "pipeLine" | "video";
  scriptId: string;
  versionId: string;
  className?: string;
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  showRefreshIcon?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface PauseBeforeResponse {
  success: boolean;
  pauseBeforeArray: {
    standard: string[];
    video: string[];
    combined: string[];
    totalStandard: number;
    totalVideo: number;
    totalCombined: number;
  };
  pauseStatus: {
    exists: boolean;
    pauseBefore: string[];
    rawPauseBefore: string[];
    hasPauseConfiguration: boolean;
    totalPausePoints: number;
    totalRawPausePoints: number;
    pipelineType: string;
    filteredOut: string[];
  };
  queueRuntimeState: {
    isQueuePaused: boolean;
    pauseBeforeArray: string[];
    queuePausedAt: string | null;
    queueResumedAt: string | null;
    pauseReason: string | null;
  };
}

interface RemovePauseBeforeResponse {
  success: boolean;
  message: string;
  removedTypes: string[];
  pauseBeforeArray: {
    standard: string[];
    video: string[];
    combined: string[];
    totalStandard: number;
    totalVideo: number;
    totalCombined: number;
  };
}

interface ApprovalButtonsContainerProps {
  scriptId: string;
  versionId: string;
  showImageApproval?: boolean;
  showVideoApproval?: boolean;
  className?: string;
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getPauseBeforeArray = async (
  userId: string,
  scriptId: string,
  versionId: string
): Promise<PauseBeforeResponse> => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("No authentication token available");
  }

  const response = await fetch(
    `${API_BASE_URL}/tasks/pause-before/${userId}/${scriptId}/${versionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      (error.message as string) || "Failed to get pause before array"
    );
  }

  return response.json();
};

const removePauseBeforeTypes = async (
  userId: string,
  scriptId: string,
  versionId: string,
  analysisTypes: string[]
): Promise<RemovePauseBeforeResponse> => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("No authentication token available");
  }

  const requestBody =
    analysisTypes.length === 1
      ? { analysisType: analysisTypes[0] }
      : { analysisTypes: analysisTypes };

  logger.debug("Removing pause before types:", {
    analysisTypes,
    requestBody,
    isSingle: analysisTypes.length === 1,
    url: `${API_BASE_URL}/tasks/pause-before/${userId}/${scriptId}/${versionId}/remove`,
  });

  const response = await fetch(
    `${API_BASE_URL}/tasks/pause-before/${userId}/${scriptId}/${versionId}/remove`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    logger.error("Remove pause before types failed:", error);
    throw new Error(
      (error.message as string) || "Failed to remove pause before types"
    );
  }

  return response.json();
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

const usePauseBeforeData = (
  userId: string,
  scriptId: string,
  versionId: string
) => {
  return useQuery({
    queryKey: ["pauseBefore", userId, scriptId, versionId],
    queryFn: () => getPauseBeforeArray(userId, scriptId, versionId),
    enabled: !!userId && !!scriptId && !!versionId,
    staleTime: 0,
  });
};

// ============================================================================
// APPROVAL BUTTON COMPONENT
// ============================================================================

const ApprovalButton: React.FC<ApprovalButtonProps> = ({
  type,
  scriptId,
  versionId,
  className = "",
  variant = "contained",
  size = "medium",
  fullWidth = false,
  showRefreshIcon = false,
  onRefresh,
  isRefreshing = false,
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { user } = useAuthStore();
  const userId = user?.uid;
  const queryClient = useQueryClient();

  // Get the analysis types for the current type
  const analysisTypes =
    type === "pipeLine"
      ? [
          ...processorSteps.images,
          ...processorSteps.scenes,
          ...processorSteps.audio,
        ]
      : processorSteps.video;

  const imageAnalysisTypes = [
    ...processorSteps.images,
    ...processorSteps.scenes,
    ...processorSteps.audio,
  ];

  // Labels and icons based on type
  const config = {
    pipeLine: {
      label: "Approve Images & Audio",
      approvedLabel: "Images & Audio Approved",
      blockedLabel: "Image Generation Blocked",
      icon: <Image size={18} />,
      approvedIcon: <Image size={18} />,
      blockedIcon: <Ban size={18} />,
      color: "primary" as const,
      approvedColor: "success" as const,
      pipelineKey: "standard" as const,
    },
    video: {
      label: "Approve Video Generation",
      approvedLabel: "Video Approved",
      blockedLabel: "Images Must Be Approved First",
      icon: <Video size={18} />,
      approvedIcon: <Video size={18} />,
      blockedIcon: <Ban size={18} />,
      color: "primary" as const,
      approvedColor: "success" as const,
      pipelineKey: "video" as const,
    },
  };

  const currentConfig = config[type];

  // Use shared pause before data
  const {
    data: pauseBeforeData,
    isLoading: isLoadingPauseBefore,
    error: pauseBeforeError,
  } = usePauseBeforeData(userId!, scriptId, versionId);

  // Mutation to remove pause before types
  const removeTypesMutation = useMutation({
    mutationFn: (analysisTypes: string[]) =>
      removePauseBeforeTypes(userId!, scriptId, versionId, analysisTypes),
    onSuccess: (data) => {
      logger.info(`${type} approval successful:`, data);

      const removedCount = data.removedTypes.length;
      const message =
        removedCount > 0
          ? `${currentConfig.label.replace(
              "Approve ",
              ""
            )} approved! Removed ${removedCount} pause point${
              removedCount > 1 ? "s" : ""
            }.`
          : `${currentConfig.label.replace(
              "Approve ",
              ""
            )} was already approved.`;

      CustomToast.success(message);

      // Invalidate queries to trigger updates
      void queryClient.invalidateQueries({
        queryKey: ["pauseBefore", userId, scriptId, versionId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["task", userId, scriptId, versionId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["videoTask", userId, scriptId, versionId],
      });
    },
    onError: (error) => {
      logger.error(`${type} approval failed:`, error);
      CustomToast.error(
        `Failed to approve ${
          type === "pipeLine" ? "image" : "video"
        } generation: ${error.message}`
      );
    },
  });

  // Helper functions to get pause arrays
  const getCurrentPauseArray = (): string[] => {
    if (!pauseBeforeData?.pauseBeforeArray) return [];

    const pipelineKey = currentConfig.pipelineKey;
    const pauseArrays = pauseBeforeData.pauseBeforeArray;
    const targetArray = pauseArrays[pipelineKey];
    return Array.isArray(targetArray) ? targetArray : [];
  };

  const getImagePauseArray = (): string[] => {
    if (!pauseBeforeData?.pauseBeforeArray) return [];

    const pauseArrays = pauseBeforeData.pauseBeforeArray;
    const standardArray = pauseArrays.standard;
    return Array.isArray(standardArray) ? standardArray : [];
  };

  // Get the current pause arrays
  const currentPauseBeforeArray = getCurrentPauseArray();
  const imagePauseBeforeArray = getImagePauseArray();

  // Check approval states
  const hasRequiredPausePoints = analysisTypes.some((analysisType) =>
    currentPauseBeforeArray.includes(analysisType)
  );

  const hasImagePausePoints = imageAnalysisTypes.some((analysisType) =>
    imagePauseBeforeArray.includes(analysisType)
  );
  const isImageApproved = !hasImagePausePoints;

  const presentTypes = analysisTypes.filter((analysisType) =>
    currentPauseBeforeArray.includes(analysisType)
  );

  const isApproved = !hasRequiredPausePoints;
  const isLoading =
    isLoadingPauseBefore || removeTypesMutation.isPending || isRefreshing;

  const isVideoBlocked = type === "video" && !isImageApproved;
  const isDisabled = isLoading || isApproved || isVideoBlocked;

  const handleApprove = async () => {
    if (!userId || !hasRequiredPausePoints || isVideoBlocked) return;

    try {
      await removeTypesMutation.mutateAsync(presentTypes);
    } catch (error) {
      logger.error("Approval failed:", error);
    }
  };

  // Get button state and content
  const getButtonState = () => {
    if (isLoading) {
      return {
        label: `${
          type === "pipeLine" ? "Approving Image" : "Approving Video"
        }...`,
        icon: <CircularProgress size={20} color="inherit" />,
        endIcon: null,
        tooltip: "Processing approval...",
      };
    }

    if (isApproved) {
      return {
        label: currentConfig.approvedLabel,
        icon: currentConfig.approvedIcon,
        endIcon: null,
        tooltip: `${currentConfig.approvedLabel} - All required approvals completed`,
      };
    }

    if (isVideoBlocked) {
      return {
        label: currentConfig.blockedLabel || "Blocked",
        icon: currentConfig.blockedIcon || <Ban size={18} />,
        endIcon: null,
        tooltip:
          "Image generation must be approved before video generation can be approved",
      };
    }

    return {
      label: currentConfig.label,
      icon: currentConfig.icon,
      endIcon: <Play size={16} />,
      tooltip: `Click to approve ${
        type === "pipeLine" ? "image" : "video"
      } generation. Will remove pause points: ${presentTypes.join(", ")}`,
    };
  };

  const buttonState = getButtonState();

  // Error state
  if (pauseBeforeError) {
    return (
      <Tooltip title={`Failed to load ${type} approval status`}>
        <Button
          disabled
          variant={variant}
          size={size}
          fullWidth={fullWidth}
          className={className}
          sx={{
            bgcolor: theme.palette.error.main,
            color: theme.palette.error.contrastText,
            opacity: 0.6,
            border: `1px solid ${theme.palette.error.main}`,
          }}
        >
          Error Loading Status
        </Button>
      </Tooltip>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={1} className={className}>
      <Tooltip title={buttonState.tooltip} arrow>
        <Button
          variant={isApproved ? "outlined" : variant}
          size={size}
          fullWidth={fullWidth}
          disabled={isDisabled}
          onClick={handleApprove}
          startIcon={buttonState.icon}
          endIcon={buttonState.endIcon}
          color={
            isApproved
              ? "success"
              : isVideoBlocked
                ? "warning"
                : currentConfig.color
          }
          sx={{
            fontWeight: 600,
            borderRadius: `${brand.borderRadius}px`,
            textTransform: "none",
            fontFamily: brand.fonts.body,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            ...(isApproved && {
              borderColor: theme.palette.success.main,
              "&:hover": {
                bgcolor: theme.palette.success.main,
                color: theme.palette.success.contrastText,
                opacity: 0.9,
              },
            }),
            ...(isVideoBlocked && {
              borderColor: theme.palette.warning.main,
              border: `1px solid ${theme.palette.warning.main}`,
            }),
            ...(!isApproved &&
              !isVideoBlocked && {
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: theme.shadows[8],
                },
              }),
          }}
        >
          {buttonState.label}
        </Button>
      </Tooltip>

      {/* Refresh Icon */}
      {showRefreshIcon && (
        <Tooltip title="Refresh approval status" arrow>
          <IconButton
            onClick={onRefresh}
            disabled={isLoading}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                color: theme.palette.primary.main,
                bgcolor: theme.palette.action.hover,
              },
              "&:disabled": {
                color: theme.palette.text.disabled,
              },
            }}
          >
            {isRefreshing ? (
              <CircularProgress size={20} />
            ) : (
              <RefreshCw size={18} />
            )}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

// ============================================================================
// APPROVAL BUTTONS CONTAINER
// ============================================================================

const ApprovalButtonsContainer: React.FC<ApprovalButtonsContainerProps> = ({
  scriptId,
  versionId,
  showImageApproval = true,
  showVideoApproval = true,
  className = "",
  variant = "contained",
  size = "medium",
  fullWidth = false,
}) => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const userId = user?.uid;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use shared pause before data
  const { refetch } = usePauseBeforeData(userId!, scriptId, versionId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      CustomToast.success("Approval status refreshed");
    } catch (error) {
      CustomToast.error("Failed to refresh approval status");
      logger.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Determine if any buttons are being rendered
  const shouldShowRefresh = showImageApproval || showVideoApproval;

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      className={className}
    >
      {showImageApproval && (
        <ApprovalButton
          type="pipeLine"
          scriptId={scriptId}
          versionId={versionId}
          variant={variant}
          size={size}
          fullWidth={fullWidth}
          isRefreshing={isRefreshing}
        />
      )}

      {showVideoApproval && (
        <ApprovalButton
          type="video"
          scriptId={scriptId}
          versionId={versionId}
          variant={variant}
          size={size}
          fullWidth={fullWidth}
          isRefreshing={isRefreshing}
        />
      )}

      {/* Show refresh icon when any button is rendered */}
      {shouldShowRefresh && (
        <Tooltip title="Refresh approval status" arrow>
          <IconButton
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                color: theme.palette.primary.main,
                bgcolor: theme.palette.action.hover,
              },
              "&:disabled": {
                color: theme.palette.text.disabled,
              },
            }}
          >
            {isRefreshing ? (
              <CircularProgress size={20} />
            ) : (
              <RefreshCw size={18} />
            )}
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

export default ApprovalButton;
export { ApprovalButton, ApprovalButtonsContainer, usePauseBeforeData };
