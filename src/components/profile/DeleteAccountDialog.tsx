// src/components/profile/DeleteAccountDialog.tsx
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
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import GDPRTerms from "../legal/GDPRTerms";
import {
  requestAccountDeletion,
  downloadUserData,
} from "@/services/accountService";
import logger from "@/utils/logger";

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function DeleteAccountDialog({
  open,
  onClose,
  userEmail,
}: DeleteAccountDialogProps) {
  const brand = getCurrentBrand();

  const [activeStep, setActiveStep] = useState(0);
  const [confirmText, setConfirmText] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [downloadedData, setDownloadedData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const steps = ["Review Terms", "Download Data", "Confirm Deletion"];

  const handleDownloadData = async () => {
    setIsLoading(true);
    setError("");

    try {
      await downloadUserData();
      setDownloadedData(true);
      logger.debug("User data downloaded successfully");
    } catch (err: any) {
      logger.error("Error downloading user data:", err);
      setError(err.message || "Failed to download data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the terms to proceed");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await requestAccountDeletion();
      logger.debug("Account deletion requested successfully");

      // Close dialog and show success
      onClose();

      // Redirect to goodbye page
      window.location.href = "/goodbye";
    } catch (err: any) {
      logger.error("Error requesting account deletion:", err);
      setError(err.message || "Failed to request account deletion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !acceptedTerms) {
      setError("Please accept the terms to continue");
      return;
    }
    setError("");
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError("");
    setActiveStep((prev) => prev - 1);
  };

  const handleClose = () => {
    if (!isLoading) {
      setActiveStep(0);
      setConfirmText("");
      setAcceptedTerms(false);
      setDownloadedData(false);
      setError("");
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${brand.borderRadius * 1.5}px`,
          backgroundImage: "none !important",
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "error.main",
          color: "error.contrastText",
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontFamily: brand.fonts.heading,
          fontWeight: 600,
        }}
      >
        <WarningIcon />
        Delete Account
      </DialogTitle>

      <DialogContent sx={{ mt: 3 }}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Step 0: Review Terms */}
        {activeStep === 0 && (
          <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                This action cannot be undone after 30 days!
              </Typography>
            </Alert>

            <GDPRTerms />

            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  I have read and understand the terms above, including the
                  30-day retrieval window and permanent data deletion.
                </Typography>
              }
              sx={{ mt: 2 }}
            />
          </Box>
        )}

        {/* Step 1: Download Data */}
        {activeStep === 1 && (
          <Box>
            <Alert
              severity="info"
              sx={{ mb: 3, backgroundColor: "background.default" }}
            >
              <Typography variant="body2">
                <strong>Recommended:</strong> Download a copy of your data
                before deletion. This includes your profile, projects, and
                transaction history.
              </Typography>
            </Alert>

            <Typography variant="body1" paragraph>
              Your data will be exported as a ZIP file containing:
            </Typography>

            <Box component="ul" sx={{ pl: 3, mb: 3 }}>
              <li>
                <Typography variant="body2">
                  Profile information (JSON)
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  All projects and content
                </Typography>
              </li>
              <li>
                <Typography variant="body2">Transaction history</Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Uploaded files (Non temporary)
                </Typography>
              </li>
            </Box>

            <Button
              variant="contained"
              startIcon={
                isLoading ? <CircularProgress size={20} /> : <DownloadIcon />
              }
              onClick={handleDownloadData}
              disabled={isLoading || downloadedData}
              fullWidth
              sx={{
                borderRadius: `${brand.borderRadius}px`,
                py: 1.5,
              }}
            >
              {downloadedData
                ? "Data Downloaded ✓"
                : isLoading
                  ? "Downloading..."
                  : "Download My Data"}
            </Button>

            {downloadedData && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Your data has been downloaded successfully!
              </Alert>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, display: "block" }}
            >
              You can skip this step, but we strongly recommend downloading your
              data first.
            </Typography>
          </Box>
        )}

        {/* Step 2: Confirm Deletion */}
        {activeStep === 2 && (
          <Box>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ⚠️ FINAL WARNING
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                This will mark your account for deletion. You have 30 days to
                cancel by signing in again. After 30 days, all data will be
                permanently deleted.
              </Typography>
            </Alert>

            <Typography variant="body1" paragraph>
              Account to be deleted: <strong>{userEmail}</strong>
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
              Type <strong>DELETE</strong> to confirm:
            </Typography>

            <TextField
              fullWidth
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Type DELETE here"
              error={confirmText !== "" && confirmText !== "DELETE"}
              helperText={
                confirmText !== "" && confirmText !== "DELETE"
                  ? 'Please type "DELETE" exactly'
                  : ""
              }
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${brand.borderRadius}px`,
                },
              }}
            />

            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>
                <Typography variant="body2">
                  Your account will be deactivated immediately
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  You will receive a confirmation email
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  You have 30 days to cancel by signing in
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  After 30 days, all data is permanently deleted
                </Typography>
              </li>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>

        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={isLoading}>
            Back
          </Button>
        )}

        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isLoading || (activeStep === 0 && !acceptedTerms)}
            sx={{
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={isLoading || confirmText !== "DELETE"}
            startIcon={
              isLoading ? <CircularProgress size={20} /> : <DeleteIcon />
            }
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              fontWeight: 600,
            }}
          >
            {isLoading ? "Processing..." : "Delete My Account"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
