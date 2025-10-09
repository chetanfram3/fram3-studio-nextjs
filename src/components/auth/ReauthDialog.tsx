// src/components/auth/ReauthDialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  X as TwitterIcon,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  reauthenticateWithPassword,
  reauthenticateWithProvider,
  getUserSignInMethod,
} from "@/services/auth/reauthService";
import { useMFA } from "@/hooks/auth/useMFA";
import MFADialog from "@/components/auth/MFADialog";
import logger from "@/utils/logger";

interface ReauthDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  message?: string;
}

export default function ReauthDialog({
  open,
  onClose,
  onSuccess,
  title = "Verify Your Identity",
  message = "For security reasons, please verify your identity to continue.",
}: ReauthDialogProps) {
  const brand = getCurrentBrand();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Add MFA support
  const mfa = useMFA();

  const signInMethod = getUserSignInMethod();

  const handlePasswordReauth = async () => {
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      logger.debug("Attempting password reauthentication");
      await reauthenticateWithPassword(password);
      logger.debug("Reauthentication successful");

      setPassword("");
      onSuccess();
    } catch (err: any) {
      logger.error("Reauthentication error:", err);

      // ✅ Check if MFA is required
      if (err?.code === "auth/multi-factor-auth-required") {
        logger.debug("MFA required during reauthentication");
        await mfa.handleMFAChallenge(err);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to verify password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProviderReauth = async (providerId: string) => {
    setLoading(true);
    setError("");

    try {
      logger.debug("Attempting provider reauthentication:", providerId);
      await reauthenticateWithProvider(providerId);
      logger.debug("Reauthentication successful");

      onSuccess();
    } catch (err: any) {
      logger.error("Reauthentication error:", err);

      // ✅ Check if MFA is required
      if (err?.code === "auth/multi-factor-auth-required") {
        logger.debug("MFA required during reauthentication");
        await mfa.handleMFAChallenge(err);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to verify identity. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle successful MFA verification
  const handleMFASuccess = async () => {
    logger.debug("MFA verification successful during reauthentication");
    mfa.closeDialog();
    // Call onSuccess to proceed with the original operation
    onSuccess();
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case "google.com":
        return <GoogleIcon />;
      case "facebook.com":
        return <FacebookIcon />;
      case "twitter.com":
        return <TwitterIcon />;
      default:
        return null;
    }
  };

  const getProviderName = (providerId: string) => {
    switch (providerId) {
      case "google.com":
        return "Google";
      case "facebook.com":
        return "Facebook";
      case "twitter.com":
        return "Twitter";
      default:
        return "Provider";
    }
  };

  return (
    <>
      {/* Main Reauthentication Dialog */}
      <Dialog
        open={open && !mfa.isOpen}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: `${brand.borderRadius * 1.5}px`,
            backgroundImage: "none !important",
            border: 2,
            borderColor: "warning.main",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "warning.main",
            color: "warning.contrastText",
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
          }}
        >
          <LockIcon />
          {title}
        </DialogTitle>

        <DialogContent sx={{ mt: 3 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {message}
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              {error}
            </Alert>
          )}

          {/* MFA Error Alert */}
          {mfa.error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              {mfa.error}
            </Alert>
          )}

          {/* Password Method */}
          {signInMethod.method === "password" && (
            <Box>
              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && password) {
                    handlePasswordReauth();
                  }
                }}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${brand.borderRadius}px`,
                  },
                }}
              />
            </Box>
          )}

          {/* Social Provider Method */}
          {(signInMethod.method === "google.com" ||
            signInMethod.method === "facebook.com" ||
            signInMethod.method === "twitter.com") && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Please verify your identity by signing in with{" "}
                {getProviderName(signInMethod.providerId)} again.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={getProviderIcon(signInMethod.providerId)}
                onClick={() => handleProviderReauth(signInMethod.providerId)}
                disabled={loading}
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
                  py: 1.5,
                  fontWeight: 600,
                }}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  `Continue with ${getProviderName(signInMethod.providerId)}`
                )}
              </Button>
            </Box>
          )}

          {/* Unknown Method */}
          {signInMethod.method === "unknown" && (
            <Alert severity="error">
              Unable to determine your sign-in method. Please sign out and sign
              in again.
            </Alert>
          )}

          <Box sx={{ mt: 3 }}>
            <Divider />
            <Typography
              variant="caption"
              sx={{ mt: 2, display: "block", color: "text.secondary" }}
            >
              <strong>Why do I need to do this?</strong> For your security, we
              require recent authentication before performing sensitive
              operations like enabling MFA or changing account settings.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            Cancel
          </Button>

          {signInMethod.method === "password" && (
            <Button
              onClick={handlePasswordReauth}
              variant="contained"
              disabled={!password || loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{
                borderRadius: `${brand.borderRadius}px`,
                fontWeight: 600,
              }}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* MFA Dialog - Shows when MFA is required during reauthentication */}
      <MFADialog
        open={mfa.isOpen}
        phoneNumber={mfa.phoneNumber}
        verificationCode={mfa.verificationCode}
        onCodeChange={mfa.setVerificationCode}
        onVerify={async () => {
          const user = await mfa.handleMFAVerification();
          if (user) {
            handleMFASuccess();
          }
        }}
        onClose={() => {
          mfa.closeDialog();
          onClose();
        }}
        loading={mfa.loading}
        error={mfa.error}
      />
    </>
  );
}
