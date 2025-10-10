// src/components/profile/MFAEnrollmentDialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Sms as SmsIcon,
  CheckCircle as CheckIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import { useMFAEnrollment } from "@/hooks/auth/useMFA";
import ReauthDialog from "@/components/auth/ReauthDialog";

interface MFAEnrollmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MFAEnrollmentDialog({
  open,
  onClose,
  onSuccess,
}: MFAEnrollmentDialogProps) {
  const brand = getCurrentBrand();
  const {
    loading,
    error,
    verificationId,
    success,
    needsReauth,
    startEnrollment,
    completeEnrollment,
    reset,
    clearReauthFlag,
  } = useMFAEnrollment();

  const [activeStep, setActiveStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [factorName, setFactorName] = useState("My Phone");
  const [reauthDialogOpen, setReauthDialogOpen] = useState(false);

  const steps = ["Enter Phone Number", "Verify Code", "Complete"];

  // CRITICAL FIX: Show reauth dialog when needed
  useEffect(() => {
    if (needsReauth && open) {
      setReauthDialogOpen(true);
    }
  }, [needsReauth, open]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setActiveStep(0);
        setPhoneNumber("");
        setVerificationCode("");
        setFactorName("My Phone");
        setReauthDialogOpen(false);
        reset();
      }, 300);
    }
  }, [open, reset]);

  // Auto-advance when verification ID is received
  useEffect(() => {
    if (verificationId && activeStep === 0) {
      setActiveStep(1);
    }
  }, [verificationId, activeStep]);

  // Auto-advance when enrollment succeeds
  useEffect(() => {
    if (success && activeStep === 1) {
      setActiveStep(2);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);
    }
  }, [success, activeStep, onSuccess]);

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handlePhoneSubmit = async () => {
    // Format phone number (add country code if missing)
    let formattedPhone = phoneNumber.replace(/\D/g, "");

    // Add country code if not present
    if (!formattedPhone.startsWith("1") && formattedPhone.length === 10) {
      formattedPhone = "1" + formattedPhone;
    }

    // Add + prefix
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+" + formattedPhone;
    }

    await startEnrollment(formattedPhone);
  };

  const handleCodeSubmit = async () => {
    await completeEnrollment(verificationCode, factorName);
  };

  const handleReauthSuccess = () => {
    setReauthDialogOpen(false);
    clearReauthFlag(); // This will automatically retry enrollment
  };

  const handleReauthClose = () => {
    setReauthDialogOpen(false);
    // Also close the main dialog since reauth was cancelled
    handleClose();
  };

  const isPhoneValid = () => {
    const digits = phoneNumber.replace(/\D/g, "");
    return digits.length >= 10;
  };

  const isCodeValid = () => {
    return verificationCode.length === 6;
  };

  return (
    <>
      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container" style={{ display: "none" }} />

      {/* Reauthentication Dialog - Shows INSTEAD of main dialog when needed */}
      <ReauthDialog
        open={reauthDialogOpen}
        onClose={handleReauthClose}
        onSuccess={handleReauthSuccess}
        title="Verify Your Identity"
        message="For security reasons, please verify your identity before enabling MFA."
      />

      {/* MFA Enrollment Dialog - HIDDEN when reauth dialog is open */}
      <Dialog
        open={open && !reauthDialogOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: `${brand.borderRadius * 1.5}px`,
            backgroundImage: "none !important",
            border: 2,
            borderColor: "primary.main",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
          }}
        >
          <SecurityIcon />
          Enable Multi-Factor Authentication
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

          {/* Error Alert - Don't show if it's a reauth error */}
          {error && !needsReauth && (
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

          {/* Step 0: Enter Phone Number */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Enter your phone number to receive a verification code. This
                will be used as a second factor when signing in.
              </Typography>

              <TextField
                fullWidth
                label="Phone Number"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
                helperText="Include country code (e.g., +1 for US)"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${brand.borderRadius}px`,
                  },
                }}
              />

              <Alert
                severity="info"
                sx={{
                  mt: 3,
                  borderRadius: `${brand.borderRadius}px`,
                }}
              >
                <Typography variant="body2">
                  <strong>Standard SMS rates may apply.</strong> You shall receive
                  a 6-digit verification code to confirm your phone number.
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Step 1: Verify Code */}
          {activeStep === 1 && (
            <Box>
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  borderRadius: `${brand.borderRadius}px`,
                }}
              >
                <Typography variant="body2">
                  Verification code sent to <strong>{phoneNumber}</strong>
                </Typography>
              </Alert>

              <Typography variant="body1" sx={{ mb: 3 }}>
                Enter the 6-digit verification code sent to your phone.
              </Typography>

              <TextField
                fullWidth
                label="Verification Code"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, ""))
                }
                disabled={loading}
                inputProps={{
                  maxLength: 6,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SmsIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${brand.borderRadius}px`,
                  },
                }}
              />

              <TextField
                fullWidth
                label="Factor Name (Optional)"
                placeholder="My Phone"
                value={factorName}
                onChange={(e) => setFactorName(e.target.value)}
                disabled={loading}
                helperText="Give this authentication method a memorable name"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${brand.borderRadius}px`,
                  },
                }}
              />
            </Box>
          )}

          {/* Step 2: Success */}
          {activeStep === 2 && (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
              }}
            >
              <CheckIcon
                sx={{
                  fontSize: 80,
                  color: "success.main",
                  mb: 2,
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: "success.main",
                }}
              >
                MFA Enabled Successfully!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Your account is now protected with multi-factor authentication.
                You will need to verify your identity with your phone when signing
                in.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          {activeStep < 2 && (
            <>
              <Button
                onClick={handleClose}
                disabled={loading}
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
                }}
              >
                Cancel
              </Button>

              {activeStep === 0 && (
                <Button
                  onClick={handlePhoneSubmit}
                  variant="contained"
                  disabled={!isPhoneValid() || loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  sx={{
                    borderRadius: `${brand.borderRadius}px`,
                    fontWeight: 600,
                  }}
                >
                  {loading ? "Sending..." : "Send Code"}
                </Button>
              )}

              {activeStep === 1 && (
                <Button
                  onClick={handleCodeSubmit}
                  variant="contained"
                  disabled={!isCodeValid() || loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  sx={{
                    borderRadius: `${brand.borderRadius}px`,
                    fontWeight: 600,
                  }}
                >
                  {loading ? "Verifying..." : "Verify & Enable"}
                </Button>
              )}
            </>
          )}

          {activeStep === 2 && (
            <Button
              onClick={handleClose}
              variant="contained"
              sx={{
                borderRadius: `${brand.borderRadius}px`,
                fontWeight: 600,
              }}
            >
              Done
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
