// src/components/profile/MFAStatusSection.tsx
"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Paper,
  Button,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Phone as PhoneIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import { useIsMFAEnabled } from "@/hooks/auth/useMFA";
import {
  formatPhoneNumberMasked,
  unenrollMFA,
} from "@/services/auth/mfaService";
import MFAEnrollmentDialog from "./MFAEnrollmentDialog";
import logger from "@/utils/logger";

export default function MFAStatusSection() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isEnabled, factors, loading } = useIsMFAEnabled();
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleEnrollClick = () => {
    setEnrollDialogOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const handleEnrollSuccess = () => {
    setSuccessMessage(
      "MFA enabled successfully! Your account is now more secure."
    );
    // Force re-render by reloading the page or using a state update
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleRemoveFactor = async (factorUid: string, displayName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove "${displayName}"? This will make your account less secure.`
      )
    ) {
      return;
    }

    setRemoving(factorUid);
    setError("");

    try {
      logger.debug("Removing MFA factor:", factorUid);
      await unenrollMFA(factorUid);
      logger.debug("MFA factor removed successfully");
      setSuccessMessage(`"${displayName}" has been removed from your account.`);

      // Reload to refresh factors list
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      logger.error("Error removing MFA factor:", err);
      setError(
        err instanceof Error ? err.message : "Failed to remove MFA factor"
      );
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Loading MFA status...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <SecurityIcon sx={{ color: "primary.main" }} />
          <Typography
            variant="h6"
            sx={{
              fontFamily: brand.fonts.heading,
              color: "primary.main",
              fontWeight: 600,
            }}
          >
            Multi-Factor Authentication (MFA)
          </Typography>
        </Box>

        {/* Success Message */}
        {successMessage && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              borderRadius: `${brand.borderRadius}px`,
            }}
            onClose={() => setSuccessMessage("")}
          >
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: `${brand.borderRadius}px`,
            }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <Paper
          sx={{
            p: 3,
            bgcolor: "background.default",
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: isEnabled ? "success.main" : "divider",
          }}
        >
          {/* MFA Status */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: isEnabled ? 2 : 0,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Status:
              </Typography>
              <Chip
                icon={isEnabled ? <CheckIcon /> : <CancelIcon />}
                label={isEnabled ? "Enabled" : "Disabled"}
                color={isEnabled ? "success" : "default"}
                sx={{
                  fontWeight: 600,
                  borderRadius: `${brand.borderRadius}px`,
                }}
              />
            </Box>

            {!isEnabled && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleEnrollClick}
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Enable MFA
              </Button>
            )}
          </Box>

          {/* Enrolled Factors */}
          {isEnabled && factors.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: "text.secondary" }}
                >
                  Enrolled Methods:
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleEnrollClick}
                  sx={{
                    borderRadius: `${brand.borderRadius}px`,
                    textTransform: "none",
                  }}
                >
                  Add Another
                </Button>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {factors.map((factor, index) => (
                  <Box
                    key={factor.uid || index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                      bgcolor: "background.paper",
                      borderRadius: `${brand.borderRadius}px`,
                      border: 1,
                      borderColor: "success.light",
                    }}
                  >
                    <PhoneIcon sx={{ color: "success.main" }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {factor.displayName || "Phone Authentication"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatPhoneNumberMasked(factor.phoneNumber)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mr: 1 }}
                    >
                      Enrolled:{" "}
                      {new Date(factor.enrollmentTime).toLocaleDateString()}
                    </Typography>
                    <Tooltip title="Remove this method">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          handleRemoveFactor(factor.uid, factor.displayName)
                        }
                        disabled={removing === factor.uid}
                        sx={{
                          "&:hover": {
                            bgcolor: "error.light",
                            color: "error.contrastText",
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Info Alert */}
          {!isEnabled && (
            <Alert
              severity="info"
              sx={{
                mt: 2,
                borderRadius: `${brand.borderRadius}px`,
                backgroundColor: "background.paper",
                "& .MuiAlert-message": {
                  width: "100%",
                },
              }}
            >
              <Typography variant="body2">
                <strong>What is MFA?</strong> Multi-Factor Authentication adds
                an extra layer of security to your account by requiring a
                verification code from your phone in addition to your password.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Why enable it?</strong> Even if someone gets your
                password, they won't be able to access your account without your
                phone.
              </Typography>
            </Alert>
          )}

          {isEnabled && (
            <Alert
              severity="success"
              sx={{
                mt: 2,
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              <Typography variant="body2">
                ✅ Your account is protected with Multi-Factor Authentication.
                You'll need to verify your identity with your phone when signing
                in.
              </Typography>
            </Alert>
          )}
        </Paper>
      </Box>

      {/* MFA Enrollment Dialog */}
      <MFAEnrollmentDialog
        open={enrollDialogOpen}
        onClose={() => setEnrollDialogOpen(false)}
        onSuccess={handleEnrollSuccess}
      />
    </>
  );
}
