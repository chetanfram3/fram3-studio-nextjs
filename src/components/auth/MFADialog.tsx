"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { getCurrentBrand } from "@/config/brandConfig";
import { Security as SecurityIcon } from "@mui/icons-material";
import { useThemeMode } from "@/theme";

interface MFADialogProps {
  open: boolean;
  onClose: () => void;
  verificationCode: string;
  onCodeChange: (code: string) => void;
  onVerify: () => void;
  error?: string;
  loading?: boolean;
  phoneNumber?: string;
}

/**
 * Multi-Factor Authentication Dialog
 * Theme-aware dialog for MFA verification with consistent styling
 */
export default function MFADialog({
  open,
  onClose,
  verificationCode,
  onCodeChange,
  onVerify,
  error,
  loading = false,
  phoneNumber,
}: MFADialogProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: isDarkMode ? "background.default" : "#f8f9fa", // Force solid background
          backgroundImage: "none !important", // CRITICAL: Disable MUI's elevation overlay
          opacity: 1, // Ensure full opacity
          borderRadius: `${brand.borderRadius * 1.5}px`,
          border: 2,
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
          textAlign: "center",
          fontFamily: brand.fonts.heading,
          fontWeight: 600,
          pt: 4,
          pb: 2,
          color: "text.primary",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <SecurityIcon />
          </Box>
          <Typography variant="h5" component="span" fontWeight={600}>
            Two-Factor Authentication
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2, pb: 3, px: 3 }}>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                bgcolor:
                  theme.palette.mode === "dark" ? "error.dark" : "error.light",
                color:
                  theme.palette.mode === "dark"
                    ? "error.contrastText"
                    : "error.dark",
                "& .MuiAlert-icon": {
                  color: "inherit",
                },
              }}
            >
              {error}
            </Alert>
          )}

          <Typography
            variant="body1"
            paragraph
            sx={{
              textAlign: "center",
              color: "text.primary",
              mb: 3,
            }}
          >
            Please enter the 6-digit verification code sent to{" "}
            {phoneNumber ? (
              <Typography
                component="span"
                sx={{
                  fontWeight: 600,
                  color: "primary.main",
                }}
              >
                {phoneNumber}
              </Typography>
            ) : (
              <Typography component="span" sx={{ fontWeight: 600 }}>
                your phone
              </Typography>
            )}
          </Typography>

          <TextField
            autoFocus
            fullWidth
            label="Verification Code"
            type="text"
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              onCodeChange(value);
            }}
            disabled={loading}
            placeholder="000000"
            inputProps={{
              inputMode: "numeric",
              pattern: "[0-9]*",
              maxLength: 6,
              style: {
                textAlign: "center",
                fontSize: "1.5rem",
                letterSpacing: "0.5em",
                fontWeight: 600,
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "background.default",
                "& fieldset": {
                  borderColor: "divider",
                  borderWidth: 2,
                },
                "&:hover fieldset": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                  borderWidth: 2,
                },
                "&.Mui-disabled": {
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.02)",
                },
              },
              "& .MuiInputLabel-root": {
                color: "text.secondary",
                "&.Mui-focused": {
                  color: "primary.main",
                },
              },
              "& input": {
                color: "text.primary",
              },
            }}
          />

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <CircularProgress
                size={32}
                sx={{
                  color: "primary.main",
                }}
              />
            </Box>
          )}

          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 3,
              textAlign: "center",
              color: "text.secondary",
              lineHeight: 1.5,
            }}
          >
            Didn't receive the code? Check your messages or try again in a few
            moments.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: "space-between",
            px: 3,
            pb: 3,
            gap: 2,
          }}
        >
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            sx={{
              borderRadius: `${brand.borderRadius / 2}px`,
              textTransform: "none",
              fontWeight: 600,
              minWidth: 100,
              borderWidth: 2,
              borderColor: "primary.main",
              color: "primary.main",
              bgcolor: "transparent",
              "&:hover": {
                borderWidth: 2,
                borderColor: "primary.dark",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.02)",
              },
              "&.Mui-disabled": {
                borderColor: "divider",
                color: "text.disabled",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={verificationCode.length !== 6 || loading}
            variant="contained"
            sx={{
              borderRadius: `${brand.borderRadius / 2}px`,
              textTransform: "none",
              fontWeight: 600,
              minWidth: 120,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              boxShadow: theme.shadows[2],
              "&:hover": {
                bgcolor: "primary.dark",
                boxShadow: theme.shadows[4],
              },
              "&.Mui-disabled": {
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 0, 0, 0.12)",
                color: "text.disabled",
              },
            }}
          >
            {loading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: "primary.contrastText",
                }}
              />
            ) : (
              "Verify"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
