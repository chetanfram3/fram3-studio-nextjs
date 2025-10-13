"use client";

import React, { useState, useCallback } from "react";
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
  TextField,
  FormControlLabel,
  Switch,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Copy,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  X,
  Folder,
  Image as ImageIcon,
  Settings,
} from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebase";
import CustomToast from "@/components/common/CustomToast";
import { API_BASE_URL } from "@/config/constants";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ScriptDuplicateProps {
  sourceScriptId: string;
  sourceVersionId?: string;
  sourceTitle?: string;
  onComplete?: (result: {
    scriptId: string;
    versionId: string;
    message: string;
  }) => void;
  onError?: (error: string) => void;
  className?: string;
  fullWidth?: boolean;
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium" | "large";
  showAdvancedOptions?: boolean;
}

interface DuplicateResult {
  scriptId: string;
  versionId: string;
  sourceInfo: {
    sourceUserId: string;
    sourceScriptId: string;
    sourceVersionId: string;
  };
  copyStats: {
    artifactsCopied: boolean;
    allVersionsCopied: boolean;
  };
  message: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScriptDuplicate({
  sourceScriptId,
  sourceVersionId,
  sourceTitle = "Script",
  onComplete,
  onError,
  className = "",
  fullWidth = false,
  variant = "contained",
  size = "medium",
  showAdvancedOptions = false,
}: ScriptDuplicateProps) {
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
  const [showProgress, setShowProgress] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
  const [showOptions, setShowOptions] = useState(false);

  // Duplication Options
  const [newTitle, setNewTitle] = useState(`Copy of ${sourceTitle}`);
  const [newDescription, setNewDescription] = useState("");
  const [copyArtifacts, setCopyArtifacts] = useState(true);
  const [copyAllVersions, setCopyAllVersions] = useState(false);

  const resetState = useCallback(() => {
    setIsCreating(false);
    setIsComplete(false);
    setHasError(false);
    setError("");
    setProgress(0);
    setStage("");
    setMessage("");
    setShowProgress(false);
    setLastUpdateTime("");
    setShowOptions(false);
  }, []);

  const handleDuplication = useCallback(async () => {
    if (!user?.uid) {
      CustomToast.error("Please log in to duplicate script");
      return;
    }

    resetState();
    setIsCreating(true);
    setShowProgress(true);

    // Progress steps
    const progressSteps = [
      {
        stage: "validating",
        progress: 10,
        message: "Validating script access...",
      },
      {
        stage: "copying_data",
        progress: 30,
        message: "Copying script data...",
      },
      {
        stage: "copying_analysis",
        progress: 50,
        message: "Copying analysis results...",
      },
      {
        stage: "copying_media",
        progress: 70,
        message: copyArtifacts
          ? "Copying media artifacts..."
          : "Skipping media artifacts...",
      },
      {
        stage: "finalizing",
        progress: 90,
        message: "Finalizing duplication...",
      },
    ];

    try {
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("No authentication token available");
      }

      // Start progress simulation
      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          const step = progressSteps[currentStep];
          setProgress(step.progress);
          setStage(step.stage);
          setMessage(step.message);
          setLastUpdateTime(new Date().toLocaleTimeString());
          currentStep++;
        }
      }, 800);

      // Prepare request body
      const requestBody = {
        sourceUserId: user.uid,
        sourceScriptId,
        ...(sourceVersionId && { sourceVersionId }),
        newTitle: newTitle.trim() || `Copy of ${sourceTitle}`,
        ...(newDescription.trim() && { newDescription: newDescription.trim() }),
        copyAllVersions,
        copyArtifacts,
        isDuplication: true,
      };

      // Make the API call
      const response = await fetch(
        `${API_BASE_URL}/scripts/copy-script-to-me`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          (errorData.error as string) ||
            `HTTP error! status: ${response.status}`
        );
      }

      const result: { success: boolean; data: DuplicateResult } =
        await response.json();

      if (!result.success) {
        throw new Error("Duplication failed");
      }

      // Complete the progress
      setProgress(100);
      setStage("complete");
      setMessage("Script duplicated successfully!");
      setIsComplete(true);
      setIsCreating(false);
      setLastUpdateTime(new Date().toLocaleTimeString());

      CustomToast.success(`Script duplicated as "${requestBody.newTitle}"`);
      onComplete?.(result.data);
    } catch (err) {
      console.error("Error duplicating script:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to duplicate script";
      setHasError(true);
      setError(errorMessage);
      setIsCreating(false);
      setStage("error");
      setMessage(`Error: ${errorMessage}`);
      CustomToast.error(`Failed to duplicate script: ${errorMessage}`);
      onError?.(errorMessage);
    }
  }, [
    sourceScriptId,
    sourceVersionId,
    sourceTitle,
    user?.uid,
    newTitle,
    newDescription,
    copyArtifacts,
    copyAllVersions,
    resetState,
    onComplete,
    onError,
  ]);

  const handleClose = useCallback(() => {
    setShowProgress(false);
    setTimeout(() => {
      resetState();
    }, 300);
  }, [resetState]);

  const getStageColor = (
    stage: string
  ): "info" | "warning" | "success" | "error" | "primary" => {
    switch (stage) {
      case "validating":
        return "info";
      case "copying_data":
      case "copying_analysis":
      case "copying_media":
        return "warning";
      case "finalizing":
        return "primary";
      case "complete":
        return "success";
      case "error":
        return "error";
      default:
        return "primary";
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "validating":
        return <CheckCircle2 size={16} />;
      case "copying_data":
        return <FileText size={16} />;
      case "copying_analysis":
        return <RefreshCw size={16} />;
      case "copying_media":
        return <ImageIcon size={16} />;
      case "finalizing":
        return <Folder size={16} />;
      case "complete":
        return <CheckCircle2 size={16} />;
      case "error":
        return <AlertCircle size={16} />;
      default:
        return <Copy size={16} />;
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
          {/* Options Toggle Button */}
          <Tooltip
            title={
              showOptions
                ? "Hide duplication options"
                : "Show duplication options"
            }
          >
            <IconButton
              onClick={() => setShowOptions(!showOptions)}
              size="small"
              sx={{
                bgcolor: "background.paper",
                color: showOptions ? "primary.main" : "text.secondary",
                height: "100%",
                borderRadius: 0,
                p: 1,
                "&:hover": {
                  bgcolor: "background.default",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <Settings size={16} />
            </IconButton>
          </Tooltip>

          {/* Main Button */}
          <Button
            variant={variant}
            size={size}
            startIcon={<Copy size={18} />}
            onClick={
              showOptions ? () => setShowProgress(true) : handleDuplication
            }
            fullWidth={fullWidth}
            color="primary"
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
            Duplicate Script
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
              minWidth: { xs: "100%", sm: 450 },
              maxWidth: { xs: "100%", sm: 600 },
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
                Duplicating Script
                {copyArtifacts && (
                  <Chip
                    label="With Media"
                    size="small"
                    color="primary"
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

            {/* Configuration Section */}
            {!isCreating &&
              !isComplete &&
              !hasError &&
              (showOptions || showAdvancedOptions) && (
                <Box mb={3}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Duplication Settings
                  </Typography>

                  <TextField
                    fullWidth
                    label="New Script Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    sx={{ mb: 2 }}
                    size="small"
                  />

                  <TextField
                    fullWidth
                    label="Description (Optional)"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    multiline
                    rows={2}
                    sx={{ mb: 2 }}
                    size="small"
                  />

                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Copy Options
                  </Typography>

                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={copyArtifacts}
                          onChange={(e) => setCopyArtifacts(e.target.checked)}
                          size="small"
                        />
                      }
                      label="Copy Media Artifacts (images, videos, audio)"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={copyAllVersions}
                          onChange={(e) => setCopyAllVersions(e.target.checked)}
                          size="small"
                        />
                      }
                      label="Copy All Versions"
                    />
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleDuplication}
                      disabled={!newTitle.trim()}
                      startIcon={<Copy size={16} />}
                      color="primary"
                    >
                      Start Duplication
                    </Button>
                  </Stack>
                </Box>
              )}

            {/* Progress Section */}
            {(isCreating || isComplete || hasError) && (
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
                      label={stage.replace(/_/g, " ")}
                      size="small"
                      color={getStageColor(stage)}
                      icon={getStageIcon(stage)}
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
            )}

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
                    onClick={handleDuplication}
                    startIcon={<RefreshCw size={16} />}
                  >
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            )}

            {isComplete && (
              <Alert
                severity="success"
                icon={<CheckCircle2 size={18} />}
                sx={{ mb: 2 }}
              >
                Script duplicated successfully as &quot;{newTitle}&quot;!
              </Alert>
            )}

            {/* Action Buttons */}
            {(isComplete || hasError) && (
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={handleClose}>
                  Close
                </Button>
              </Stack>
            )}

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
