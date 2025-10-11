"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  LinearProgress,
  Typography,
  Chip,
  IconButton,
  Stack,
  TextField,
  Divider,
  Autocomplete,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as AlertCircleIcon,
  Description as FileTextIcon,
  Refresh as RefreshCwIcon,
  Close as XIcon,
  Search as SearchIcon,
  FileCopy as CopyIcon,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import { useAuthStore } from "@/store/authStore";
import { useSubscription } from "@/hooks/auth/useSubscription";
import { auth } from "@/lib/firebase";
import CustomToast from "@/components/common/CustomToast";
import { API_BASE_URL } from "@/config/constants";
import { useRouter } from "next/navigation";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

interface ScriptPullFromProps {
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
}

interface PullResult {
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

// ===========================
// HELPER FUNCTIONS
// ===========================

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
        (user.displayName as string | undefined) ||
        `${(user.extendedInfo as Record<string, string> | undefined)?.firstName || ""} ${
          (user.extendedInfo as Record<string, string> | undefined)?.lastName ||
          ""
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

// ===========================
// MAIN COMPONENT
// ===========================

export default function ScriptPullFrom({
  onComplete,
  onError,
  className = "",
  fullWidth = false,
  variant = "contained",
  size = "medium",
}: ScriptPullFromProps) {
  const { user } = useAuthStore();
  const { isAdmin } = useSubscription();
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();
  const router = useRouter();

  // Early return if not admin
  if (!isAdmin) {
    return null;
  }

  // Dialog State
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [message, setMessage] = useState("");

  // Form State
  const [sourceUser, setSourceUser] = useState<User | null>(null);
  const [sourceUserInput, setSourceUserInput] = useState("");
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sourceScriptId, setSourceScriptId] = useState("");
  const [sourceVersionId, setSourceVersionId] = useState("");

  const resetForm = useCallback(() => {
    setSourceUser(null);
    setSourceUserInput("");
    setSourceScriptId("");
    setSourceVersionId("");
    setProgress(0);
    setStage("");
    setMessage("");
  }, []);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    if (!isLoading) {
      setOpen(false);
      resetForm();
    }
  };

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
      if (sourceUserInput) {
        handleUserSearch(sourceUserInput);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [sourceUserInput, handleUserSearch]);

  const handlePullFrom = useCallback(async () => {
    if (!user?.uid) {
      CustomToast.error("Please log in to pull script");
      return;
    }

    if (!sourceUser) {
      CustomToast.error("Please select a source user");
      return;
    }

    if (!sourceScriptId.trim()) {
      CustomToast.error("Please enter a script ID");
      return;
    }

    setIsLoading(true);

    // Progress steps
    const progressSteps = [
      {
        stage: "validating",
        progress: 10,
        message: "Validating permissions...",
      },
      {
        stage: "fetching_script",
        progress: 20,
        message: "Fetching script from source user...",
      },
      {
        stage: "copying_data",
        progress: 40,
        message: "Copying script data...",
      },
      {
        stage: "copying_analysis",
        progress: 60,
        message: "Copying analysis results...",
      },
      {
        stage: "copying_media",
        progress: 80,
        message: "Copying media artifacts...",
      },
      {
        stage: "finalizing",
        progress: 90,
        message: "Finalizing pull operation...",
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
          currentStep++;
        }
      }, 800);

      // Prepare request body for script pull
      const requestBody = {
        sourceUserId: sourceUser.uid,
        targetUserId: user.uid,
        sourceScriptId: sourceScriptId.trim(),
        ...(sourceVersionId.trim() && {
          sourceVersionId: sourceVersionId.trim(),
        }),
        copyArtifacts: true,
        copyAllVersions: false,
      };

      // Make the API call to copy endpoint
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
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result: { success: boolean; data: PullResult } =
        await response.json();

      if (!result.success) {
        throw new Error("Pull operation failed");
      }

      // Complete the progress
      setProgress(100);
      setStage("complete");
      setMessage("Script pulled successfully!");

      CustomToast.success(
        `Script pulled from ${sourceUser.displayName || sourceUser.email}`
      );

      onComplete?.(result.data);

      // Navigate to the newly pulled script after a short delay
      setTimeout(() => {
        router.push(
          `/scripts/${result.data.scriptId}/versions/${result.data.versionId}`
        );
        handleClose();
      }, 1500);
    } catch (err) {
      console.error("Error pulling script:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to pull script";
      CustomToast.error(`Failed to pull script: ${errorMessage}`);
      onError?.(errorMessage);
      setIsLoading(false);
      setProgress(0);
      setStage("");
      setMessage("");
    }
  }, [
    sourceScriptId,
    sourceVersionId,
    user?.uid,
    sourceUser,
    onComplete,
    onError,
    router,
  ]);

  const getStageColor = (
    stage: string
  ): "info" | "warning" | "success" | "error" | "primary" => {
    switch (stage) {
      case "validating":
        return "info";
      case "fetching_script":
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
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case "fetching_script":
        return <DownloadIcon sx={{ fontSize: 16 }} />;
      case "copying_data":
        return <FileTextIcon sx={{ fontSize: 16 }} />;
      case "copying_analysis":
        return <RefreshCwIcon sx={{ fontSize: 16 }} />;
      case "copying_media":
        return <CopyIcon sx={{ fontSize: 16 }} />;
      case "finalizing":
        return <FileTextIcon sx={{ fontSize: 16 }} />;
      case "complete":
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case "error":
        return <AlertCircleIcon sx={{ fontSize: 16 }} />;
      default:
        return <DownloadIcon sx={{ fontSize: 16 }} />;
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
        onClick={handleOpen}
        fullWidth={fullWidth}
        className={className}
        sx={{
          // ✅ FIXED: Use primary color (Gold/Bronze)
          bgcolor: variant === "contained" ? "primary.main" : "transparent",
          color:
            variant === "contained" ? "primary.contrastText" : "primary.main",
          borderColor: variant === "outlined" ? "primary.main" : undefined,
          "&:hover": {
            bgcolor:
              variant === "contained"
                ? "primary.dark"
                : alpha(theme.palette.primary.main, 0.1),
          },
          px: 2,
          py: variant === "text" ? 0.75 : undefined,
          fontWeight: 500,
          fontSize: size === "small" ? "0.8125rem" : "0.875rem",
          textTransform: "none",
          minWidth: fullWidth ? undefined : "160px",
          justifyContent: "flex-start",
          transition: "all 0.2s ease-in-out",
          height:
            size === "small" ? "32px" : size === "large" ? "42px" : "38px",
        }}
      >
        Pull From User
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "background.paper",
            backgroundImage: "none !important", // Disable MUI's elevation overlay
            borderRadius: `${brand.borderRadius * 1.5}px`,
            border: 2,
            // ✅ FIXED: Use primary color for border (Gold/Bronze)
            borderColor: "primary.main",
            boxShadow: theme.shadows[24],
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: isDarkMode
                ? "rgba(0, 0, 0, 0.85)"
                : "rgba(0, 0, 0, 0.7)",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
            pt: 3,
            // ✅ FIXED: Use theme colors
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          {/* ✅ FIXED: Use primary color (Gold/Bronze) */}
          <Typography variant="h6" color="primary.main">
            Pull Script From User
          </Typography>
          <IconButton
            size="small"
            onClick={handleClose}
            disabled={isLoading}
            sx={{ color: "text.secondary" }}
          >
            <XIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            pt: 2,
            pb: 3,
            // ✅ FIXED: Use theme background
            bgcolor: "background.paper",
          }}
        >
          {!isLoading ? (
            <Stack spacing={3}>
              {/* User Selection */}
              <Box>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{
                    // ✅ FIXED: Use primary color (Gold/Bronze)
                    color: "primary.main",
                    fontWeight: 600,
                  }}
                >
                  Source User Selection
                </Typography>
                <Autocomplete
                  options={userOptions}
                  getOptionLabel={(option) =>
                    `${option.displayName || option.email} (${option.email})`
                  }
                  value={sourceUser}
                  onChange={(_, newValue) => setSourceUser(newValue)}
                  inputValue={sourceUserInput}
                  onInputChange={(_, newValue) => {
                    setSourceUserInput(newValue);
                  }}
                  loading={isSearching}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Users"
                      placeholder="Type email or name..."
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-focused fieldset": {
                            // ✅ FIXED: Use primary color (Gold/Bronze)
                            borderColor: "primary.main",
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "primary.main",
                        },
                      }}
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
                              <SearchIcon
                                sx={{
                                  fontSize: 16,
                                  color: theme.palette.text.secondary,
                                }}
                              />
                            )}
                          </Box>
                        ),
                        endAdornment: <>{params.InputProps.endAdornment}</>,
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      {...props}
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
                        {(option.displayName || option.email)[0].toUpperCase()}
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
                  )}
                  fullWidth
                  noOptionsText={
                    sourceUserInput.length < 2
                      ? "Type at least 2 characters to search"
                      : "No users found"
                  }
                />
              </Box>

              {/* ✅ FIXED: Use primary color for divider */}
              <Divider sx={{ borderColor: "primary.main", opacity: 0.3 }} />

              {/* Script Details */}
              <Box>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{
                    // ✅ FIXED: Use primary color (Gold/Bronze)
                    color: "primary.main",
                    fontWeight: 600,
                  }}
                >
                  Script Details
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Script ID *"
                    value={sourceScriptId}
                    onChange={(e) => setSourceScriptId(e.target.value)}
                    size="small"
                    placeholder="Enter the script ID to pull"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": {
                          // ✅ FIXED: Use primary color (Gold/Bronze)
                          borderColor: "primary.main",
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "primary.main",
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Version ID (Optional)"
                    value={sourceVersionId}
                    onChange={(e) => setSourceVersionId(e.target.value)}
                    size="small"
                    placeholder="Leave empty to pull the current version"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": {
                          // ✅ FIXED: Use primary color (Gold/Bronze)
                          borderColor: "primary.main",
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "primary.main",
                      },
                    }}
                  />
                </Stack>
              </Box>

              {/* Selected User Preview */}
              {sourceUser && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    border: 1,
                    // ✅ FIXED: Use primary color for border (Gold/Bronze)
                    borderColor: "primary.main",
                    borderStyle: "solid",
                    borderWidth: 1,
                    opacity: 0.8,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{
                      // ✅ FIXED: Use primary color (Gold/Bronze)
                      color: "primary.main",
                      fontWeight: 600,
                    }}
                  >
                    Pulling from:
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      src={sourceUser.photoURL}
                      sx={{ width: 40, height: 40 }}
                    >
                      {(sourceUser.displayName ||
                        sourceUser.email)[0].toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {sourceUser.displayName || sourceUser.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {sourceUser.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Stack>
          ) : (
            <Stack spacing={2}>
              {/* Progress Section */}
              <Box>
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
                  variant="determinate"
                  value={progress}
                  // ✅ FIXED: Use primary color (Gold/Bronze)
                  color="primary"
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: "background.default",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                    },
                  }}
                />

                {message && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, fontStyle: "italic", textAlign: "center" }}
                  >
                    {message}
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            // ✅ FIXED: Use theme background
            bgcolor: "background.paper",
          }}
        >
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={isLoading}
            sx={{
              // ✅ FIXED: Use primary color (Gold/Bronze)
              borderColor: "primary.main",
              color: "primary.main",
              "&:hover": {
                borderColor: "primary.dark",
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePullFrom}
            disabled={!sourceScriptId.trim() || !sourceUser || isLoading}
            startIcon={!isLoading && <DownloadIcon sx={{ fontSize: 16 }} />}
            // ✅ FIXED: Use primary color (Gold/Bronze)
            color="primary"
            sx={{ minWidth: 120 }}
          >
            {isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Pull Script"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
