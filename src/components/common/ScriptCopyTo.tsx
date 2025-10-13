"use client";

import React, { useState, useCallback, useEffect } from "react";
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
  Autocomplete,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Share,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  X,
  Folder,
  Image as ImageIcon,
  Settings,
  Search,
} from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";
import { useAuthStore } from "@/store/authStore";
import { useSubscription } from "@/hooks/auth/useSubscription";
import { auth } from "@/lib/firebase";
import CustomToast from "@/components/common/CustomToast";
import { API_BASE_URL } from "@/config/constants";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

interface ScriptCopyToProps {
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

interface CopyResult {
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
// USER SEARCH FUNCTION
// ============================================================================

const searchUsers = async (query: string): Promise<User[]> => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("No authentication token");

    const response = await fetch(
      `${API_BASE_URL}/user/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to search users");
    }

    const responseData = await response.json();
    const users = responseData?.data?.results || [];

    return users.map((user: Record<string, unknown>) => ({
      uid: user.uid as string,
      email: user.email as string,
      displayName:
        (user.displayName as string) ||
        `${(user.extendedInfo as Record<string, unknown>)?.firstName || ""} ${
          (user.extendedInfo as Record<string, unknown>)?.lastName || ""
        }`.trim() ||
        (user.email as string).split("@")[0],
      photoURL: user.photoURL as string | undefined,
    }));
  } catch (error) {
    console.warn("User search API error:", error);

    // Fallback mock data for development
    const mockUsers = [
      { uid: "user1", email: "john.doe@example.com", displayName: "John Doe" },
      {
        uid: "user2",
        email: "jane.smith@example.com",
        displayName: "Jane Smith",
      },
      {
        uid: "user3",
        email: "bob.wilson@example.com",
        displayName: "Bob Wilson",
      },
      {
        uid: "user4",
        email: "alice.johnson@example.com",
        displayName: "Alice Johnson",
      },
    ];

    return mockUsers.filter(
      (user) =>
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(query.toLowerCase())
    );
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScriptCopyTo({
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
}: ScriptCopyToProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { user } = useAuthStore();
  const { isAdmin, isSuperAdmin } = useSubscription();

  // Admin check - hide component if not admin
  if (!isAdmin && !isSuperAdmin) {
    return null;
  }

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

  // Copy Options
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [targetUserInput, setTargetUserInput] = useState("");
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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

  const handleUserSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setUserOptions([]);
      return;
    }

    setIsSearching(true);
    try {
      const users = await searchUsers(query);
      setUserOptions(users);
    } catch (err) {
      console.error("Error searching users:", err);
      setUserOptions([]);
      CustomToast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (targetUserInput) {
        void handleUserSearch(targetUserInput);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [targetUserInput, handleUserSearch]);

  const handleCopyTo = useCallback(async () => {
    if (!user?.uid) {
      CustomToast.error("Please log in to copy script");
      return;
    }

    if (!targetUser) {
      CustomToast.error("Please select a target user");
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
        message: "Validating permissions...",
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
        message: "Finalizing copy operation...",
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

      // Prepare request body for admin copy
      const requestBody = {
        sourceUserId: user.uid,
        targetUserId: targetUser.uid,
        sourceScriptId,
        ...(sourceVersionId && { sourceVersionId }),
        newTitle: newTitle.trim() || `Copy of ${sourceTitle}`,
        ...(newDescription.trim() && { newDescription: newDescription.trim() }),
        copyAllVersions,
        copyArtifacts,
      };

      // Make the API call to admin copy endpoint
      const response = await fetch(`${API_BASE_URL}/scripts/copy-script`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          (errorData.error as string) ||
            `HTTP error! status: ${response.status}`
        );
      }

      const result: { success: boolean; data: CopyResult } =
        await response.json();

      if (!result.success) {
        throw new Error("Copy operation failed");
      }

      // Complete the progress
      setProgress(100);
      setStage("complete");
      setMessage("Script copied successfully!");
      setIsComplete(true);
      setIsCreating(false);
      setLastUpdateTime(new Date().toLocaleTimeString());

      CustomToast.success(
        `Script copied to ${targetUser.displayName || targetUser.email}`
      );
      onComplete?.(result.data);
    } catch (err) {
      console.error("Error copying script:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to copy script";
      setHasError(true);
      setError(errorMessage);
      setIsCreating(false);
      setStage("error");
      setMessage(`Error: ${errorMessage}`);
      CustomToast.error(`Failed to copy script: ${errorMessage}`);
      onError?.(errorMessage);
    }
  }, [
    sourceScriptId,
    sourceVersionId,
    sourceTitle,
    user?.uid,
    targetUser,
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
        return <Share size={16} />;
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
            title={showOptions ? "Hide copy options" : "Show copy options"}
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
            startIcon={<Share size={18} />}
            onClick={() => setShowProgress(true)}
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
            Copy To User
            {(isAdmin || isSuperAdmin) && (
              <Chip
                label="Admin"
                size="small"
                color="primary"
                sx={{ ml: 1, fontSize: "0.6rem", height: "16px" }}
              />
            )}
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
              minWidth: { xs: "100%", sm: 500 },
              maxWidth: { xs: "100%", sm: 650 },
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
                Copy Script To User
                {(isAdmin || isSuperAdmin) && (
                  <Chip
                    label="Admin Access"
                    size="small"
                    color="error"
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
            {!isCreating && !isComplete && !hasError && (
              <Box mb={3}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Target User Selection
                </Typography>

                <Autocomplete
                  options={userOptions}
                  getOptionLabel={(option) =>
                    `${option.displayName || option.email} (${option.email})`
                  }
                  value={targetUser}
                  onChange={(_, newValue) => setTargetUser(newValue)}
                  inputValue={targetUserInput}
                  onInputChange={(_, newValue) => {
                    setTargetUserInput(newValue);
                  }}
                  loading={isSearching}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Users"
                      placeholder="Type email or name..."
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mr: 1,
                            }}
                          >
                            {isSearching ? (
                              <CircularProgress size={16} />
                            ) : (
                              <Search
                                size={16}
                                style={{ color: theme.palette.text.secondary }}
                              />
                            )}
                          </Box>
                        ),
                        endAdornment: <>{params.InputProps.endAdornment}</>,
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props as Record<
                      string,
                      unknown
                    > & { key: string };
                    return (
                      <Box
                        component="li"
                        key={key}
                        {...otherProps}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                        }}
                      >
                        <Avatar
                          src={option.photoURL}
                          sx={{ width: 32, height: 32 }}
                        >
                          {(option.displayName ||
                            option.email)[0].toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {option.displayName || option.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.email}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                  sx={{ mb: 3 }}
                  fullWidth
                  noOptionsText={
                    targetUserInput.length < 2
                      ? "Type at least 2 characters to search"
                      : "No users found"
                  }
                />

                <Divider sx={{ my: 2 }} />

                <Typography
                  variant="subtitle2"
                  gutterBottom
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Script Details
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

                {showAdvancedOptions && (
                  <>
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
                            onChange={(e) =>
                              setCopyAllVersions(e.target.checked)
                            }
                            size="small"
                          />
                        }
                        label="Copy All Versions"
                      />
                    </Stack>
                  </>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Selected User Preview */}
                {targetUser && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      bgcolor: "background.default",
                      borderRadius: `${brand.borderRadius}px`,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      color="text.secondary"
                      sx={{ fontFamily: brand.fonts.body }}
                    >
                      Copying to:
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        src={targetUser.photoURL}
                        sx={{ width: 40, height: 40 }}
                      >
                        {(targetUser.displayName ||
                          targetUser.email)[0].toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {targetUser.displayName || targetUser.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {targetUser.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button variant="outlined" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleCopyTo}
                    disabled={!newTitle.trim() || !targetUser}
                    startIcon={<Share size={16} />}
                    color="primary"
                  >
                    Copy Script
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
                    onClick={handleCopyTo}
                    startIcon={<RefreshCw size={16} />}
                  >
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            )}

            {isComplete && targetUser && (
              <Alert
                severity="success"
                icon={<CheckCircle2 size={18} />}
                sx={{ mb: 2 }}
              >
                Script successfully copied to{" "}
                {targetUser.displayName || targetUser.email}!
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
