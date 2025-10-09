// src/components/auth/PhoneSignInForm.tsx
"use client";

import { useState, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Sms as SmsIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  initializePhoneRecaptcha,
  sendPhoneVerificationCode,
  verifyPhoneCode,
  cleanupPhoneRecaptcha,
  formatPhoneNumber,
  isValidPhoneNumber,
} from "@/services/auth/phoneAuthService";
import { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import logger from "@/utils/logger";

interface PhoneSignInFormProps {
  onBack?: () => void;
}

export default function PhoneSignInForm({ onBack }: PhoneSignInFormProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [showMFAWarning, setShowMFAWarning] = useState(false);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowMFAWarning(false);

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
        cleanupPhoneRecaptcha(verifierRef.current);
      }

      // Initialize reCAPTCHA
      const verifier = initializePhoneRecaptcha("phone-recaptcha-container", {
        onError: () => setError("reCAPTCHA verification failed"),
      });

      verifierRef.current = verifier;

      // Send verification code
      const confirmationResult = await sendPhoneVerificationCode(
        formattedPhone,
        verifier
      );

      confirmationResultRef.current = confirmationResult;

      // Move to verification step
      setStep("code");
      logger.debug("Verification code sent to:", formattedPhone);
    } catch (err: any) {
      logger.error("Phone sign-in error:", err);

      // ✅ Check for MFA conflict error
      if (err?.code === "auth/unsupported-first-factor") {
        setShowMFAWarning(true);
        setError(
          "Phone-only authentication is not supported when MFA is enabled. Please use Email or Social login."
        );
      } else {
        setError(err.message || "Failed to send verification code");
      }

      // Clean up on error
      if (verifierRef.current) {
        cleanupPhoneRecaptcha(verifierRef.current);
        verifierRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const user = await verifyPhoneCode(
        confirmationResultRef.current,
        verificationCode
      );

      logger.debug("Phone sign-in successful:", user.uid);

      // Clean up
      if (verifierRef.current) {
        cleanupPhoneRecaptcha(verifierRef.current);
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      logger.error("Verification error:", err);
      setError(err.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setVerificationCode("");
    setError("");
    setShowMFAWarning(false);

    // Clean up
    if (verifierRef.current) {
      cleanupPhoneRecaptcha(verifierRef.current);
      verifierRef.current = null;
    }
    confirmationResultRef.current = null;
  };

  return (
    <Box>
      {/* Hidden reCAPTCHA container */}
      <div id="phone-recaptcha-container" style={{ display: "none" }} />

      {/* Info Alert about MFA limitation */}
      <Alert
        severity="info"
        icon={<WarningIcon />}
        sx={{
          mb: 3,
          borderRadius: `${brand.borderRadius}px`,
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="body2">
          <strong>Note:</strong> If you have MFA (Multi-Factor Authentication)
          enabled on your account, you must use Email or Social login instead of
          phone-only authentication.
        </Typography>
      </Alert>

      {/* Step 1: Enter Phone Number */}
      {step === "phone" && (
        <Box component="form" onSubmit={handlePhoneSubmit}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontFamily: brand.fonts.heading,
              fontWeight: 600,
              mb: 1,
            }}
          >
            Sign In with Phone
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            Enter your phone number to receive a verification code
          </Typography>

          {error && (
            <Alert
              severity={showMFAWarning ? "warning" : "error"}
              sx={{
                mb: 3,
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              {error}
            </Alert>
          )}

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
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: `${brand.borderRadius}px`,
              },
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading || !phoneNumber}
            startIcon={isLoading ? <CircularProgress size={20} /> : <SmsIcon />}
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
              mb: 2,
            }}
          >
            {isLoading ? "Sending Code..." : "Send Verification Code"}
          </Button>

          {onBack && (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={onBack}
              sx={{
                borderRadius: `${brand.borderRadius}px`,
                py: 1.5,
                textTransform: "none",
              }}
            >
              Back to Sign In Options
            </Button>
          )}
        </Box>
      )}

      {/* Step 2: Enter Verification Code */}
      {step === "code" && (
        <Box component="form" onSubmit={handleCodeSubmit}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontFamily: brand.fonts.heading,
              fontWeight: 600,
              mb: 1,
            }}
          >
            Verify Your Phone
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            Enter the 6-digit code sent to{" "}
            <strong>{formatPhoneNumber(phoneNumber)}</strong>
          </Typography>

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
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: `${brand.borderRadius}px`,
              },
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading || verificationCode.length !== 6}
            startIcon={
              isLoading ? <CircularProgress size={20} /> : <PhoneIcon />
            }
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
              mb: 2,
            }}
          >
            {isLoading ? "Verifying..." : "Verify & Sign In"}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToPhone}
            disabled={isLoading}
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              py: 1.5,
              textTransform: "none",
            }}
          >
            Use Different Number
          </Button>
        </Box>
      )}
    </Box>
  );
}
