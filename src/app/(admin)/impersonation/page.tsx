// src/app/(protected)/admin/impersonation/page.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Divider,
  TextField,
  Autocomplete,
  CircularProgress,
  Stack,
  Chip,
  Container,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import SecurityIcon from "@mui/icons-material/Security";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import { getCurrentBrand } from "@/config/brandConfig";
import { useImpersonation } from "@/hooks/useImpersonation";
import { useSubscription } from "@/hooks/auth/useSubscription";
import { auth } from "@/lib/firebase";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// ===========================
// CONSTANTS
// ===========================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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

export default function ImpersonationPage() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isAdmin, isSuperAdmin } = useSubscription();
  const {
    startImpersonatingUser,
    isImpersonating,
    stopImpersonatingUser,
    currentUser,
  } = useImpersonation();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [userInput, setUserInput] = useState("");
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Reset form
  const resetForm = useCallback(() => {
    setTargetUser(null);
    setUserInput("");
    setUserOptions([]);
    setError(null);
  }, []);

  // Debounced user search
  useEffect(() => {
    if (!userInput || userInput.length < 2) {
      setUserOptions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await searchUsers(userInput);
        setUserOptions(users);
      } catch (err) {
        console.error("Search failed:", err);
        setUserOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userInput]);

  // Admin access check
  if (!isAdmin && !isSuperAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: `${brand.borderRadius}px`,
            border: `1px solid ${theme.palette.error.main}`,
          }}
        >
          <Alert severity="error">
            <Typography variant="h6" gutterBottom>
              Access Denied
            </Typography>
            <Typography>
              You do not have permission to access this page. This feature is
              only available to administrators.
            </Typography>
          </Alert>
        </Paper>
      </Container>
    );
  }

  // Handle impersonation start
  const handleStartImpersonation = async () => {
    if (!targetUser) {
      setError("Please select a user to impersonate");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await startImpersonatingUser(targetUser.uid);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start impersonation"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle impersonation stop
  const handleStopImpersonation = async () => {
    try {
      await stopImpersonatingUser();
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to stop impersonation"
      );
    }
  };

  // Handle Enter key
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && targetUser && !loading && !isImpersonating) {
      handleStartImpersonation();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        sx={{
          p: 4,
          borderRadius: `${brand.borderRadius}px`,
          border: `1px solid ${theme.palette.primary.main}`,
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <SecurityIcon
              sx={{
                fontSize: 40,
                color: "primary.main",
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontFamily: brand.fonts.heading,
                color: "primary.main",
                fontWeight: 600,
              }}
            >
              User Impersonation
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Admin-only feature. Impersonate users to troubleshoot issues or
            provide support.
          </Typography>
        </Box>

        <Divider
          sx={{
            mb: 3,
            borderColor: "primary.main",
            opacity: 0.3,
          }}
        />

        {/* Active Impersonation Warning */}
        {isImpersonating && currentUser && (
          <Alert
            severity="warning"
            icon={<SecurityIcon />}
            sx={{
              mb: 3,
              borderRadius: `${brand.borderRadius}px`,
              border: `1px solid ${theme.palette.warning.main}`,
            }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleStopImpersonation}
                startIcon={<StopCircleIcon />}
                sx={{
                  fontWeight: 600,
                }}
              >
                Stop Impersonating
              </Button>
            }
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Currently Impersonating
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {currentUser.email}
            </Typography>
            {currentUser.displayName && (
              <Typography variant="body2">
                <strong>Name:</strong> {currentUser.displayName}
              </Typography>
            )}
            <Typography variant="body2">
              <strong>User ID:</strong> {currentUser.uid}
            </Typography>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{
              mb: 3,
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            {error}
          </Alert>
        )}

        {/* Main Content */}
        <Stack spacing={4}>
          {/* Info Alert */}
          <Alert
            severity="info"
            icon={<SecurityIcon />}
            sx={{
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <Typography variant="body2">
              <strong>Important:</strong> When impersonating a user, you will
              have full access to their account and data. All actions performed
              will be logged. Use this feature responsibly and only when
              necessary for support or troubleshooting.
            </Typography>
          </Alert>

          {/* Search Section */}
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: "primary.main",
                fontWeight: 600,
                mb: 2,
              }}
            >
              Select User to Impersonate
            </Typography>

            <Autocomplete
              options={userOptions}
              getOptionLabel={(option) =>
                `${option.displayName || option.email} (${option.email})`
              }
              value={targetUser}
              onChange={(_, newValue) => setTargetUser(newValue)}
              inputValue={userInput}
              onInputChange={(_, newValue) => {
                setUserInput(newValue);
              }}
              loading={isSearching}
              disabled={loading || isImpersonating}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Users"
                  placeholder="Type email or name..."
                  onKeyDown={handleKeyDown}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": {
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
                          <CircularProgress
                            size={20}
                            sx={{ color: "primary.main" }}
                          />
                        ) : (
                          <PersonSearchIcon sx={{ color: "text.secondary" }} />
                        )}
                      </Box>
                    ),
                    endAdornment: params.InputProps.endAdornment,
                  }}
                />
              )}
              noOptionsText={
                !userInput
                  ? "Start typing to search users"
                  : userInput.length < 2
                    ? "Type at least 2 characters to search"
                    : "No users found"
              }
            />
          </Box>

          {/* Selected User Details */}
          {targetUser && (
            <Box
              sx={{
                p: 3,
                borderRadius: `${brand.borderRadius}px`,
                bgcolor: "background.paper",
                border: `2px solid ${theme.palette.primary.main}`,
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <SecurityIcon sx={{ color: "primary.main" }} />
                <Typography variant="h6" color="text.primary">
                  Selected User Details
                </Typography>
              </Box>
              <Stack spacing={1.5}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {targetUser.displayName || "N/A"}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {targetUser.email}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    User ID
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "monospace",
                      color: "text.secondary",
                    }}
                  >
                    {targetUser.uid}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            {targetUser && (
              <Button
                variant="outlined"
                onClick={resetForm}
                disabled={loading || isImpersonating}
              >
                Clear Selection
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartImpersonation}
              disabled={loading || isImpersonating || !targetUser}
              startIcon={
                loading ? <CircularProgress size={20} /> : <SecurityIcon />
              }
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              {loading ? "Starting Impersonation..." : "Start Impersonation"}
            </Button>
          </Box>

          {/* Security Notice */}
          <Box
            sx={{
              mt: 4,
              p: 2,
              borderRadius: `${brand.borderRadius}px`,
              bgcolor: "background.default",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              <strong>Security Notice:</strong>
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              component="ul"
              sx={{ pl: 2 }}
            >
              <li>All impersonation sessions are logged and audited</li>
              <li>
                You will have full access to the impersonated user&apos;s
                account
              </li>
              <li>
                Actions performed during impersonation are attributed to your
                admin account
              </li>
              <li>
                Impersonation sessions automatically expire after a set period
              </li>
              <li>Only use this feature when necessary for support purposes</li>
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
