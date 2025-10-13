"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  LinearProgress,
  Typography,
  Alert,
  Chip,
  Fade,
  IconButton,
  Paper,
  Stack,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  RefreshCw,
  X,
} from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebase";
import CustomToast from "@/components/common/CustomToast";
import { API_BASE_URL } from "@/config/constants";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface VersionZipDownloadProps {
  scriptId: string;
  versionId: string;
  onComplete?: (result: { signedUrl: string; zipPath: string }) => void;
  onError?: (error: string) => void;
  className?: string;
  fullWidth?: boolean;
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
}

interface ProgressUpdate {
  stage: string;
  progress: number;
  message: string;
  timestamp: string;
}

interface ZipResult {
  signedUrl: string;
  zipPath: string;
}

type EventData =
  | ProgressUpdate
  | { stage: "complete"; result: ZipResult }
  | { stage: "error"; error: string };

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VersionZipDownload({
  scriptId,
  versionId,
  onComplete,
  onError,
  className = "",
  fullWidth = false,
  variant = "contained",
  size = "medium",
}: VersionZipDownloadProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { user } = useAuthStore();

  // UI State
  const [isCreating, setIsCreating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [showProgress, setShowProgress] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
  const [forceCreate, setForceCreate] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  const resetState = useCallback(() => {
    setIsCreating(false);
    setIsComplete(false);
    setHasError(false);
    setError("");
    setProgress(0);
    setStage("");
    setMessage("");
    setDownloadUrl("");
    setShowProgress(false);
    setLastUpdateTime("");
  }, []);

  const cleanupEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const handleStreamingZipCreation = useCallback(
    async (forceCreateOverride?: boolean) => {
      if (!user?.uid) {
        CustomToast.error("Please log in to create zip file");
        return;
      }

      resetState();
      cleanupEventSource();

      setIsCreating(true);
      setShowProgress(true);

      try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
          throw new Error("No authentication token available");
        }

        // Use the forceCreateOverride if provided, otherwise use the state
        const shouldForceCreate =
          forceCreateOverride !== undefined ? forceCreateOverride : forceCreate;

        // Since EventSource doesn't support custom headers, include token in URL
        const params = new URLSearchParams({
          stream: "true",
          forceCreate: shouldForceCreate.toString(),
          token: token,
        });

        const url = `${API_BASE_URL}/internal/zip/scripts/${scriptId}/versions/${versionId}?${params}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const data: EventData = JSON.parse(event.data);

            if (data.stage === "complete" && "result" in data) {
              setProgress(100);
              setMessage("Zip file ready for download!");
              setDownloadUrl(data.result.signedUrl);
              setIsComplete(true);
              setIsCreating(false);
              CustomToast.success("Zip file created successfully!");
              onComplete?.(data.result);
            } else if (data.stage === "error" && "error" in data) {
              setHasError(true);
              setError(data.error);
              setIsCreating(false);
              CustomToast.error(`Failed to create zip: ${data.error}`);
              onError?.(data.error);
            } else if ("progress" in data && data.progress !== undefined) {
              setProgress(data.progress);
              setStage(data.stage);
              setMessage(data.message);

              if (data.timestamp) {
                const date = new Date(data.timestamp);
                setLastUpdateTime(date.toLocaleTimeString());
              }
            }
          } catch (err) {
            console.error("Error parsing SSE data:", err);
            setHasError(true);
            setError("Error parsing server response");
            setIsCreating(false);
            CustomToast.error("Error parsing server response");
          }
        };

        eventSource.onerror = (event) => {
          console.error("SSE connection error:", event);
          setHasError(true);
          setError("Connection error occurred");
          setIsCreating(false);
          CustomToast.error("Connection error - please try again");
          onError?.("Connection error occurred");
        };

        // Set timeout for SSE connection (5 minutes)
        setTimeout(() => {
          if (eventSource.readyState !== EventSource.CLOSED) {
            eventSource.close();
            setHasError(true);
            setError("Request timed out");
            setIsCreating(false);
            CustomToast.error("Request timed out - please try again");
            onError?.("Request timed out");
          }
        }, 300000);
      } catch (err) {
        console.error("Error creating zip:", err);
        setHasError(true);
        setError("Failed to start zip creation");
        setIsCreating(false);
        CustomToast.error("Failed to start zip creation");
        onError?.("Failed to start zip creation");
      }
    },
    [
      scriptId,
      versionId,
      user?.uid,
      forceCreate,
      resetState,
      cleanupEventSource,
      onComplete,
      onError,
    ]
  );

  const handleClose = useCallback(() => {
    cleanupEventSource();
    setShowProgress(false);

    setTimeout(() => {
      resetState();
    }, 300);
  }, [cleanupEventSource, resetState]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupEventSource;
  }, [cleanupEventSource]);

  const getStageColor = (
    stage: string
  ): "info" | "warning" | "success" | "error" | "primary" => {
    switch (stage) {
      case "scan":
      case "start":
        return "info";
      case "compressing":
      case "finalizing":
        return "warning";
      case "complete":
        return "success";
      case "error":
        return "error";
      default:
        return "primary";
    }
  };

  return (
    <Box className={className}>
      {!showProgress ? (
        <Box
          sx={{
            display: "inline-flex",
            borderRadius: `${brand.borderRadius}px`,
            overflow: "hidden",
            bgcolor: variant === "contained" ? "primary.main" : "transparent",
            border: variant === "outlined" ? "1px solid" : "none",
            borderColor:
              variant === "outlined" ? "primary.main" : "transparent",
          }}
        >
          {/* Force Create Toggle Button */}
          <Tooltip
            title={
              forceCreate
                ? "Force create is ON - will recreate zip from scratch"
                : "Force create is OFF - will use existing zip if available"
            }
          >
            <IconButton
              onClick={() => setForceCreate(!forceCreate)}
              size="small"
              sx={{
                bgcolor: "background.paper",
                color: forceCreate ? "warning.main" : "primary.main",
                height: "100%",
                borderRadius: 0,
                p: 1,
                "&:hover": {
                  bgcolor: "background.default",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              {forceCreate ? (
                <RefreshCw size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
            </IconButton>
          </Tooltip>

          {/* Main Button */}
          <Button
            variant={variant}
            size={size}
            startIcon={<FolderArchive size={18} />}
            onClick={() => void handleStreamingZipCreation()}
            fullWidth={fullWidth}
            color={forceCreate ? "warning" : "primary"}
            sx={{
              borderRadius: 0,
              px: 2,
              py: variant === "text" ? 0.75 : undefined,
              fontWeight: 500,
              fontSize: size === "small" ? "0.8125rem" : "0.875rem",
              textTransform: "none",
              minWidth: fullWidth ? undefined : "140px",
              justifyContent: "flex-start",
              transition: "all 0.2s ease-in-out",
              height:
                size === "small" ? "32px" : size === "large" ? "42px" : "38px",
              fontFamily: brand.fonts.body,
            }}
          >
            {forceCreate ? "Force Create Zip" : "Artefacts Zip"}
          </Button>
        </Box>
      ) : (
        <Fade in={showProgress} timeout={300}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              bgcolor: "background.paper",
              borderRadius: `${brand.borderRadius}px`,
              border: "1px solid",
              borderColor: "primary.main",
              minWidth: { xs: "100%", sm: 400 },
              maxWidth: { xs: "100%", sm: 500 },
              boxShadow: theme.shadows[24],
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Creating Version Zip
                {forceCreate && (
                  <Chip
                    label="Force Create"
                    size="small"
                    color="warning"
                    sx={{ ml: 1, fontSize: "0.75rem" }}
                  />
                )}
              </Typography>
              <IconButton
                size="small"
                onClick={handleClose}
                disabled={isCreating && !hasError}
                sx={{ color: "text.secondary" }}
              >
                <X size={20} />
              </IconButton>
            </Box>

            {/* Progress Section */}
            <Box mb={3}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Progress: {progress}%
                </Typography>
                {stage && (
                  <Chip
                    label={stage}
                    size="small"
                    color={getStageColor(stage)}
                    sx={{ textTransform: "capitalize" }}
                  />
                )}
              </Box>

              <LinearProgress
                variant={isCreating ? "determinate" : "buffer"}
                value={progress}
                valueBuffer={progress + 10}
                sx={{
                  height: 8,
                  borderRadius: `${brand.borderRadius}px`,
                  bgcolor: "background.default",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: `${brand.borderRadius}px`,
                  },
                }}
              />

              {message && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, fontStyle: "italic" }}
                >
                  {message}
                </Typography>
              )}
            </Box>

            {/* Status Section */}
            {hasError && (
              <Alert
                severity="error"
                icon={<AlertCircle size={18} />}
                sx={{ mb: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => void handleStreamingZipCreation(true)}
                    startIcon={<RefreshCw size={16} />}
                  >
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            )}

            {isComplete && downloadUrl && (
              <Alert
                severity="success"
                icon={<CheckCircle2 size={18} />}
                sx={{ mb: 2 }}
              >
                Zip file created successfully! Ready for download.
              </Alert>
            )}

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {isComplete && downloadUrl && (
                <Button
                  variant="contained"
                  startIcon={<Download size={18} />}
                  href={downloadUrl}
                  download={`version_${versionId}.zip`}
                  color="success"
                  sx={{
                    fontFamily: brand.fonts.body,
                  }}
                >
                  Download Zip
                </Button>
              )}

              {!isCreating && (
                <Button variant="outlined" onClick={handleClose}>
                  Close
                </Button>
              )}
            </Stack>

            {/* Footer Info */}
            {lastUpdateTime && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", textAlign: "center", mt: 2 }}
              >
                Last updated: {lastUpdateTime}
              </Typography>
            )}
          </Paper>
        </Fade>
      )}
    </Box>
  );
}
