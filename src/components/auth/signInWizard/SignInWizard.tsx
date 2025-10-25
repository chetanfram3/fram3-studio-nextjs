// src/components/auth/SignInWizard.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { User as FirebaseUser } from "firebase/auth";
import { UserProfile } from "@/types/profile";
import { createDefaultProfile } from "@/utils/profileHelpers";
import { getDefaultProfilePic } from "@/utils/imageUtils";
import logger from "@/utils/logger";

interface SignInWizardProps {
  open: boolean;
  user: FirebaseUser;
  onComplete: (profileData: Partial<UserProfile>) => Promise<void>;
  onCancel: () => void;
}

interface WizardFormData {
  firstName: string;
  lastName: string;
  displayName: string;
  phoneNumber: string;
  email: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phoneNumber?: string;
  email?: string;
}

const STEPS = ["Basic Info", "Contact Details", "Review"];

/**
 * Sign-In Wizard Component
 *
 * Launches when a user signs in but has no profile in the backend.
 * Collects essential profile information before allowing access.
 *
 * Features:
 * - Multi-step form with validation
 * - Pre-fills data from Firebase Auth
 * - Email is mandatory and non-editable
 * - Progress indicator with stepper
 * - Theme-aware styling
 * - Production-ready error handling
 *
 * @example
 * <SignInWizard
 *   open={showWizard}
 *   user={firebaseUser}
 *   onComplete={handleProfileCreation}
 *   onCancel={handleSignOut}
 * />
 */
export default function SignInWizard({
  open,
  user,
  onComplete,
  onCancel,
}: SignInWizardProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  // Initialize form data from Firebase user
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if email is available from auth provider
  const hasEmailFromAuth = !!user.email;

  const [formData, setFormData] = useState<WizardFormData>(() => {
    const displayName = user.displayName || user.email?.split("@")[0] || "";
    const nameParts = displayName.split(" ");

    return {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      displayName,
      phoneNumber: user.phoneNumber || "",
      email: user.email || "",
    };
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  // Update field value
  const handleFieldChange = (field: keyof WizardFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const errors: ValidationErrors = {};

    if (step === 0) {
      // Step 1: Basic Info
      if (!formData.firstName.trim()) {
        errors.firstName = "First name is required";
      } else if (formData.firstName.trim().length < 2) {
        errors.firstName = "First name must be at least 2 characters";
      }

      if (!formData.lastName.trim()) {
        errors.lastName = "Last name is required";
      } else if (formData.lastName.trim().length < 2) {
        errors.lastName = "Last name must be at least 2 characters";
      }

      if (!formData.displayName.trim()) {
        errors.displayName = "Display name is required";
      } else if (formData.displayName.trim().length < 2) {
        errors.displayName = "Display name must be at least 2 characters";
      }
    } else if (step === 1) {
      // Step 2: Contact Details
      if (!formData.email.trim()) {
        errors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Invalid email format";
      }

      if (formData.phoneNumber.trim()) {
        const phoneDigits = formData.phoneNumber.replace(/\D/g, "");
        if (phoneDigits.length < 10) {
          errors.phoneNumber = "Phone number must be at least 10 digits";
        } else if (phoneDigits.length > 15) {
          errors.phoneNumber = "Phone number is too long";
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
      setError(null);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug("Sign-in wizard: Creating profile with data", {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      // Create profile data structure matching backend expectations
      const displayName = formData.displayName.trim();
      const profilePic = user.photoURL || getDefaultProfilePic(displayName);

      // Create default profile with wizard data
      const defaultProfile = createDefaultProfile(formData.email, displayName);

      const profileData: Partial<UserProfile> = {
        ...defaultProfile,
        uid: user.uid,
        email: formData.email,
        emailVerified: user.emailVerified,
        displayName,
        photoURL: profilePic,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        extendedInfo: {
          details: {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            dob: null,
            address: {
              street: "",
              city: "",
              state: "",
              country: "IN", // Default to India
              postalCode: "",
            },
            gstin: null,
            preferences: {
              theme: isDarkMode ? "dark" : "light",
              language: "en",
            },
            genre: [],
            expertise: [],
          },
        },
        providerData: user.providerData.map((provider) => ({
          uid: provider.uid || "",
          displayName: provider.displayName || "",
          email: provider.email || "",
          phoneNumber: provider.phoneNumber || "",
          photoURL: provider.photoURL || "",
          providerId: provider.providerId,
        })),
        metadata: {
          creationTime: user.metadata.creationTime || "",
          lastSignInTime: user.metadata.lastSignInTime || "",
          lastRefreshTime: new Date().toISOString(),
        },
      };

      // Call the completion handler (parent will handle API call)
      await onComplete(profileData);

      logger.debug("Sign-in wizard: Profile creation initiated successfully");
    } catch (err) {
      logger.error("Sign-in wizard: Profile creation failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <Box
              sx={{
                p: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Welcome to {brand.name}! 
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.95 }}>
                We&apos;re excited to have you here! To personalize your
                experience and help you get started, we need a few quick
                details. This will only take a moment.
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="First Name"
              required
              value={formData.firstName}
              onChange={(e) => handleFieldChange("firstName", e.target.value)}
              error={!!validationErrors.firstName}
              helperText={validationErrors.firstName}
              disabled={loading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${brand.borderRadius}px`,
                },
              }}
            />

            <TextField
              fullWidth
              label="Last Name"
              required
              value={formData.lastName}
              onChange={(e) => handleFieldChange("lastName", e.target.value)}
              error={!!validationErrors.lastName}
              helperText={validationErrors.lastName}
              disabled={loading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${brand.borderRadius}px`,
                },
              }}
            />

            <TextField
              fullWidth
              label="Display Name"
              required
              value={formData.displayName}
              onChange={(e) => handleFieldChange("displayName", e.target.value)}
              error={!!validationErrors.displayName}
              helperText={
                validationErrors.displayName ||
                "This name will be visible to others"
              }
              disabled={loading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${brand.borderRadius}px`,
                },
              }}
            />
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Box
              sx={{
                p: 2,
                bgcolor: "background.default",
                border: 1,
                borderColor: "divider",
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                <EmailOutlinedIcon
                  sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.5 }}
                />
                Contact Information
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {hasEmailFromAuth
                  ? "Your email is verified through your sign-in provider"
                  : "Please provide your email address for account verification"}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Email"
              required
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              disabled={hasEmailFromAuth || loading}
              error={!!validationErrors.email}
              helperText={
                validationErrors.email ||
                (hasEmailFromAuth
                  ? "Email from your sign-in account"
                  : "We'll use this to keep you updated")
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${brand.borderRadius}px`,
                },
              }}
            />

            <TextField
              fullWidth
              label="Phone Number"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
              error={!!validationErrors.phoneNumber}
              helperText={
                validationErrors.phoneNumber ||
                "Optional - Include country code (e.g., +1234567890)"
              }
              disabled={loading}
              placeholder="+1234567890"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${brand.borderRadius}px`,
                },
              }}
            />
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Alert
              severity="success"
              icon={<CheckCircleOutlineIcon />}
              sx={{
                bgcolor: "background.default",
                border: 1,
                borderColor: "success.main",
                "& .MuiAlert-icon": {
                  color: "success.main",
                },
              }}
            >
              <Typography variant="body2" color="text.primary">
                Review your information before completing setup
              </Typography>
            </Alert>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1 }}
              >
                Name
              </Typography>
              <Typography variant="body1" color="text.primary" gutterBottom>
                {formData.firstName} {formData.lastName}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic" }}
              >
                Display as: {formData.displayName}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: "divider" }} />

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1 }}
              >
                Email
              </Typography>
              <Typography variant="body1" color="text.primary">
                {formData.email}
              </Typography>
            </Box>

            {formData.phoneNumber && (
              <>
                <Divider sx={{ borderColor: "divider" }} />
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    Phone Number
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    {formData.phoneNumber}
                  </Typography>
                </Box>
              </>
            )}
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Prevent closing by clicking outside
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          backgroundColor: "background.paper",
          backgroundImage: "none !important",
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
          fontFamily: brand.fonts.heading,
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <PersonOutlineIcon color="primary" />
        <Typography
          variant="h6"
          component="span"
          sx={{
            fontFamily: brand.fonts.heading,
            color: "text.primary",
          }}
        >
          Complete Your Profile
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: "background.paper", py: 3 }}>
        <Stack spacing={3}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontFamily: brand.fonts.body,
                      color: "text.secondary",
                      "&.Mui-active": {
                        color: "primary.main",
                        fontWeight: 600,
                      },
                      "&.Mui-completed": {
                        color: "text.primary",
                      },
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Step Content */}
          {renderStepContent(activeStep)}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          p: 2,
          gap: 1,
        }}
      >
        {/* Back Button */}
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={loading}
            startIcon={<ArrowBackIcon />}
            sx={{
              color: "text.secondary",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            Back
          </Button>
        )}

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Cancel Button */}
        <Button
          onClick={onCancel}
          disabled={loading}
          sx={{
            color: "error.main",
            "&:hover": {
              bgcolor: (theme) =>
                isDarkMode
                  ? "rgba(244, 67, 54, 0.08)"
                  : "rgba(244, 67, 54, 0.04)",
            },
          }}
        >
          Sign Out
        </Button>

        {/* Next/Submit Button */}
        {activeStep === STEPS.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontWeight: 600,
              px: 3,
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "inherit" }} />
            ) : (
              "Complete Setup"
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="contained"
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontWeight: 600,
              px: 3,
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
