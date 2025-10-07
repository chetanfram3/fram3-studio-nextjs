// src/components/profile/ProfileForm.tsx
"use client";

import React, { useEffect, useRef } from "react";
import {
  Container,
  Box,
  Button,
  Paper,
  Alert,
  Snackbar,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Error as ErrorIcon, Save as SaveIcon } from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import { useProfileForm } from "@/hooks/useProfileForm";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";
import ProfileBanner from "./ProfileBanner";
import BasicInfoSection from "./BasicInfoSection";
import AddressSection from "./AddressSection";
import PreferencesSection from "./PreferencesSection";
import TagsSection from "./TagsSection";
import MetadataSection from "./MetadataSection";
import GSTINDetails from "./GSTINDetails";
import { validateProfile } from "@/utils/profileHelpers";

export default function ProfileForm() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const {
    profile,
    isLoading,
    isUpdating,
    error,
    loadProfile,
    updateField,
    handleSubmit,
  } = useProfileForm();

  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showErrorDialog, setShowErrorDialog] = React.useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Show error dialog when validation errors exist
  useEffect(() => {
    if (validationErrors.length > 0) {
      setShowErrorDialog(true);
    }
  }, [validationErrors]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const errors = validateProfile(profile);
    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setValidationErrors([]);
    try {
      await handleSubmit();
      setShowSuccess(true);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  // Show loading animation while loading profile
  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <LoadingAnimation message="Loading your profile..." minHeight="80vh" />
      </Container>
    );
  }

  // Show error if profile failed to load
  if (!profile) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert
            severity="error"
            sx={{ borderRadius: `${brand.borderRadius}px` }}
          >
            Failed to load profile. Please refresh the page or contact support.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <ProfileBanner
          banner=""
          photoURL={profile.photoURL}
          displayName={profile.displayName}
        />

        <Paper
          sx={{
            p: { xs: 2, md: 4 },
            mt: 8,
            backgroundColor: "background.default",
            borderRadius: `${brand.borderRadius * 1.5}px`,
            border: 1,
            borderColor: "primary.dark",
          }}
        >
          <Box component="form" ref={formRef} onSubmit={handleFormSubmit}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  position: "sticky",
                  top: 0,
                  zIndex: 1000,
                  borderRadius: `${brand.borderRadius}px`,
                }}
              >
                {error}
              </Alert>
            )}

            <BasicInfoSection
              profile={profile}
              onUpdate={(field, value) => updateField(field, value)}
            />

            <AddressSection
              address={profile.extendedInfo.details.address}
              onUpdate={(field, value) =>
                updateField(
                  ["extendedInfo", "details", "address", field],
                  value
                )
              }
            />

            <GSTINDetails
              gstin={profile.extendedInfo.details.gstin?.number || ""}
              companyName={
                profile.extendedInfo.details.gstin?.companyName || ""
              }
              onChange={(values, isValid) => {
                if (!values.gstin && !values.companyName) {
                  updateField(["extendedInfo", "details", "gstin"], null);
                } else {
                  updateField(["extendedInfo", "details", "gstin"], {
                    number: values.gstin,
                    companyName: values.companyName,
                  });
                }
              }}
            />

            <PreferencesSection
              preferences={profile.extendedInfo.details.preferences}
              onUpdate={(field, value) =>
                updateField(
                  ["extendedInfo", "details", "preferences", field],
                  value
                )
              }
            />

            <TagsSection
              title="Genres"
              tags={profile.extendedInfo.details.genre}
              onAdd={(tag) =>
                updateField(
                  ["extendedInfo", "details", "genre"],
                  [...profile.extendedInfo.details.genre, tag]
                )
              }
              onDelete={(tag) =>
                updateField(
                  ["extendedInfo", "details", "genre"],
                  profile.extendedInfo.details.genre.filter((g) => g !== tag)
                )
              }
            />

            <TagsSection
              title="Expertise"
              tags={profile.extendedInfo.details.expertise}
              onAdd={(tag) =>
                updateField(
                  ["extendedInfo", "details", "expertise"],
                  [...profile.extendedInfo.details.expertise, tag]
                )
              }
              onDelete={(tag) =>
                updateField(
                  ["extendedInfo", "details", "expertise"],
                  profile.extendedInfo.details.expertise.filter(
                    (e) => e !== tag
                  )
                )
              }
            />

            {/* Sticky Save Button with loading state */}
            <Box
              sx={{
                mt: 3,
                mb: 2,
                display: "flex",
                justifyContent: "flex-end",
                position: "sticky",
                bottom: 16,
                backgroundColor: "background.default",
                padding: 2,
                borderRadius: `${brand.borderRadius}px`,
                boxShadow: theme.shadows[4],
                zIndex: 10,
                border: 1,
                borderColor: "divider",
              }}
            >
              <Button
                type="submit"
                variant="contained"
                disabled={isUpdating}
                startIcon={
                  isUpdating ? <CircularProgress size={20} /> : <SaveIcon />
                }
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  borderRadius: `${brand.borderRadius}px`,
                  fontFamily: brand.fonts.heading,
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                  "&:disabled": {
                    bgcolor: "action.disabledBackground",
                    color: "action.disabled",
                  },
                }}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </Box>

            <MetadataSection
              metadata={profile.metadata}
              providerData={profile.providerData}
            />
          </Box>
        </Paper>

        {/* Error Dialog */}
        <Dialog
          open={showErrorDialog}
          onClose={handleCloseErrorDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: "background.paper",
              borderRadius: `${brand.borderRadius * 1.5}px`,
              border: 2,
              borderColor: "error.main",
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
            <ErrorIcon />
            Form Validation Errors
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Please correct the following issues before saving:
            </Typography>
            <List
              sx={{
                bgcolor: "background.default",
                borderRadius: `${brand.borderRadius}px`,
                border: 1,
                borderColor: "error.light",
              }}
            >
              {validationErrors.map((err, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ErrorIcon sx={{ color: "error.main" }} fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={err} />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={handleCloseErrorDialog}
              variant="contained"
              sx={{
                bgcolor: "error.main",
                "&:hover": {
                  bgcolor: "error.dark",
                },
              }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={showSuccess}
          autoHideDuration={6000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setShowSuccess(false)}
            severity="success"
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontWeight: 600,
              fontSize: "1rem",
              borderRadius: `${brand.borderRadius}px`,
              boxShadow: theme.shadows[4],
              "& .MuiAlert-icon": {
                color: "primary.contrastText",
              },
            }}
          >
            Profile updated successfully!
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}
