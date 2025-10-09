// src/components/profile/PhoneLinkingDialog.tsx
"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Box,
  CircularProgress,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Sms as SmsIcon,
  CheckCircle as CheckIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  initializePhoneLinkingRecaptcha,
  sendPhoneLinkingCode,
  verifyPhoneLinkingCode,
  cleanupPhoneLinkingRecaptcha,
} from "@/services/auth/phoneLinkingService";
import { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { isValidPhoneNumber, formatPhoneNumber } from "@/services/auth/phoneAuthService";
import logger from "@/utils/logger";

interface PhoneLinkingDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (phoneNumber: string) => void;
  currentPhone?: string;
}

export default function PhoneLinkingDialog({
  open,
  onClose,
  onSuccess,
  currentPhone,
}: PhoneLinkingDialogProps) {
  const brand = getCurrentBrand();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const steps = ["Enter Phone Number", "Verify Code", "Complete"];

  const handlePhoneSubmit = async () => {
    setError("");

    // Format phone number
    let formattedPhone = phoneNumber.replace(/\D/g, "");

    // Add country code if not present (default to US +1)
    if (!formattedPhone.startsWith("1") && formattedPhone.length === 10) {
      formattedPhone = "1" + formattedPhone;
    }

    // Add + prefix
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+" + formattedPhone;
    }

    if (!isValidPhoneNumber(formattedPhone)) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);

    try {
      // Clean up any existing verifier
      if (verifierRef.current) {
        cleanupPhoneLinkingRecaptcha(verifierRef.current);
      }

      // Initialize reCAPTCHA
      const verifier = initializePhoneLinkingRecaptcha(
        "phone-linking-recaptcha-container",
        {
          onError: () => setError("reCAPTCHA verification failed"),
        }
      );

      verifierRef.current = verifier;

      // Send verification code
      const confirmationResult = await sendPhoneLinkingCode(
        formattedPhone,
        verifier
      );

      confirmationResultRef.current = confirmationResult;

      // Move to verification step
      setActiveStep(1);
      logger.debug("Phone linking code sent to:", formattedPhone);
    } catch (err: any) {
      logger.error("Phone linking error:", err);
      setError(err.message || "Failed to send verification code");

      // Clean up on error
      if (verifierRef.current) {
        cleanupPhoneLinkingRecaptcha(verifierRef.current);
        verifierRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    setError("");

    if (!confirmationResultRef.current) {
      setError("Please request a new verification code");
      return;
    }

    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit verification code");
      return;
    }

    setIsLoading(true);

    try {
      const user = await verifyPhoneLinkingCode(
        confirmationResultRef.current,
        verificationCode
      );

      logger.debug("Phone number linked successfully:", user.uid);

      // Clean up
      if (verifierRef.current) {
        cleanupPhoneLinkingRecaptcha(verifierRef.current);
      }

      // Move to success step
      setActiveStep(2);

      // Format phone for display
      let formattedPhone = phoneNumber.replace(/\D/g, "");
      if (!formattedPhone.startsWith("1") && formattedPhone.length === 10) {
        formattedPhone = "1" + formattedPhone;
      }
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+" + formattedPhone;
      }

      // Notify parent and close after delay
      setTimeout(() => {
        onSuccess(formattedPhone);
        handleCloseDialog();
      }, 2000);
    } catch (err: any) {
      logger.error("Verification error:", err);
      setError(err.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    // Clean up
    if (verifierRef.current) {
      cleanupPhoneLinkingRecaptcha(verifierRef.current);
      verifierRef.current = null;
    }
    confirmationResultRef.current = null;

    // Reset state
    setPhoneNumber("");
    setVerificationCode("");
    setError("");
    setActiveStep(0);
    setIsLoading(false);

    onClose();
  };

  return (
    <>
      {/* Hidden reCAPTCHA container */}
      <div id="phone-linking-recaptcha-container" style={{ display: "none" }} />

      <Dialog
        open={open}
        onClose={isLoading ? undefined : handleCloseDialog}
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
          {currentPhone ? "Update Phone Number" : "Add Phone Number"}
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
                Enter your phone number to verify and link it to your account.
                This will enable phone-based authentication.
              </Typography>

              <TextField
                fullWidth
                label="Phone Number"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
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
                  <strong>You'll receive an SMS code</strong> to verify this
                  phone number. Standard SMS rates may apply.
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Step 1: Enter Verification Code */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Enter the 6-digit code sent to{" "}
                <strong>{formatPhoneNumber(phoneNumber)}</strong>
              </Typography>

              <TextField
                fullWidth
                label="Verification Code"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, ""))
                }
                disabled={isLoading}
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
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${brand.borderRadius}px`,
                  },
                }}
              />
            </Box>
          )}

          {/* Step 2: Success */}
          {activeStep === 2 && (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <CheckIcon
                sx={{
                  fontSize: 80,
                  color: "success.main",
                  mb: 2,
                }}
              />
              <Typography variant="h6" gutterBottom>
                Phone Number Verified!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your phone number has been successfully linked to your account.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          {activeStep < 2 && (
            <>
              <Button
                onClick={handleCloseDialog}
                disabled={isLoading}
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
                  disabled={isLoading || !phoneNumber}
                  startIcon={
                    isLoading ? <CircularProgress size={20} /> : <SmsIcon />
                  }
                  sx={{
                    borderRadius: `${brand.borderRadius}px`,
                    fontWeight: 600,
                  }}
                >
                  {isLoading ? "Sending..." : "Send Code"}
                </Button>
              )}

              {activeStep === 1 && (
                <Button
                  onClick={handleCodeSubmit}
                  variant="contained"
                  disabled={isLoading || verificationCode.length !== 6}
                  startIcon={
                    isLoading ? <CircularProgress size={20} /> : <PhoneIcon />
                  }
                  sx={{
                    borderRadius: `${brand.borderRadius}px`,
                    fontWeight: 600,
                  }}
                >
                  {isLoading ? "Verifying..." : "Verify"}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}