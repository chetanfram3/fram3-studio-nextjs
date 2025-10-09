// src/components/profile/ProfileForm.tsx
"use client";

import React, { useEffect, useState } from "react";
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
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Error as ErrorIcon, Save as SaveIcon } from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  useProfileQuery,
  useUpdateProfileMutation,
} from "@/hooks/useProfileQuery";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";
import ProfileBanner from "./ProfileBanner";
import BasicInfoSection from "./BasicInfoSection";
import AddressSection from "./AddressSection";
import PreferencesSection from "./PreferencesSection";
import TagsSection from "./TagsSection";
import MetadataSection from "./MetadataSection";
import GSTINDetails from "./GSTINDetails";
import MFAStatusSection from "./MFAStatusSection";
import { validateProfile } from "@/utils/profileHelpers";
import { UserProfile } from "@/types/profile";

export default function ProfileForm() {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // TanStack Query hooks
  const {
    data: profile,
    isLoading,
    error: queryError,
    isError,
  } = useProfileQuery();

  const updateProfile = useUpdateProfileMutation();

  // Local state for form editing
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Sync profile data to local state when loaded
  useEffect(() => {
    if (profile && !editedProfile) {
      setEditedProfile(profile);
    }
  }, [profile, editedProfile]);

  // Show error dialog when validation errors exist
  useEffect(() => {
    if (validationErrors.length > 0) {
      setShowErrorDialog(true);
    }
  }, [validationErrors]);

  // Show success message when mutation succeeds
  useEffect(() => {
    if (updateProfile.isSuccess) {
      setShowSuccess(true);
    }
  }, [updateProfile.isSuccess]);

  /**
   * Update a field in the edited profile
   * Supports nested paths like ['extendedInfo', 'details', 'firstName']
   */
  const updateField = (path: string[], value: any) => {
    setEditedProfile((currentProfile) => {
      if (!currentProfile) return null;

      const newProfile = { ...currentProfile };
      let current: any = newProfile;

      // Navigate to the nested object, creating objects if they don't exist
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        // Create a new object reference for immutability
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }

      // Update the value
      current[path[path.length - 1]] = value;
      return newProfile;
    });
  };

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedProfile) return;

    // Validate profile
    const errors = validateProfile(editedProfile);
    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setValidationErrors([]);

    try {
      // Prepare update data - only send fields that can be updated
      const updateData = {
        displayName: editedProfile.displayName,
        photoURL: editedProfile.photoURL,
        phoneNumber: editedProfile.phoneNumber,
        extendedInfo: {
          details: {
            firstName: editedProfile.extendedInfo.details.firstName,
            lastName: editedProfile.extendedInfo.details.lastName,
            dob: editedProfile.extendedInfo.details.dob,
            address: editedProfile.extendedInfo.details.address,
            gstin: editedProfile.extendedInfo.details.gstin,
            preferences: editedProfile.extendedInfo.details.preferences,
            genre: editedProfile.extendedInfo.details.genre,
            expertise: editedProfile.extendedInfo.details.expertise,
          },
        },
      };

      await updateProfile.mutateAsync(updateData);
    } catch (err) {
      console.error("Profile update failed:", err);
    }
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  // Show loading animation only on initial load (when there's no cached data)
  if (isLoading && !editedProfile) {
    return (
      <Container maxWidth="lg">
        <LoadingAnimation message="Loading your profile..." minHeight="80vh" />
      </Container>
    );
  }

  // Show error if profile failed to load
  if (isError || !editedProfile) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert
            severity="error"
            sx={{ borderRadius: `${brand.borderRadius}px` }}
          >
            {queryError?.message ||
              "Failed to load profile. Please refresh the page or contact support."}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: `${brand.borderRadius}px` }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Please fix the following errors:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Mutation Error */}
        {updateProfile.isError && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: `${brand.borderRadius}px` }}
          >
            {updateProfile.error?.message ||
              "Failed to update profile. Please try again."}
          </Alert>
        )}

        {/* Profile Banner - Outside Paper */}
        <ProfileBanner
          banner=""
          photoURL={editedProfile.photoURL}
          displayName={editedProfile.displayName}
        />

        {/* Profile Form */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 4 },
            mt: 8,
            backgroundColor: "background.default",
            borderRadius: `${brand.borderRadius * 1.5}px`,
            border: 1,
            borderColor: "primary.dark",
          }}
        >
          <Box component="form" onSubmit={handleFormSubmit}>
            {/* BasicInfoSection - expects profile and onUpdate */}
            <BasicInfoSection
              profile={editedProfile}
              onUpdate={(field, value) => updateField(field, value)}
            />

            <Divider sx={{ my: 4 }} />

            {/* AddressSection - expects address and onUpdate */}
            <AddressSection
              address={editedProfile.extendedInfo.details.address}
              onUpdate={(field, value) =>
                updateField(
                  ["extendedInfo", "details", "address", field],
                  value
                )
              }
            />

            <Divider sx={{ my: 4 }} />

            {/* GSTINDetails - expects gstin, companyName, and onChange */}
            <GSTINDetails
              gstin={editedProfile.extendedInfo.details.gstin?.number || ""}
              companyName={
                editedProfile.extendedInfo.details.gstin?.companyName || ""
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

            <Divider sx={{ my: 4 }} />

            {/* PreferencesSection - expects preferences and onUpdate */}
            <PreferencesSection
              preferences={editedProfile.extendedInfo.details.preferences}
              onUpdate={(field, value) =>
                updateField(
                  ["extendedInfo", "details", "preferences", field],
                  value
                )
              }
            />

            <Divider sx={{ my: 4 }} />

            {/* TagsSection for Genre */}
            <TagsSection
              title="Genres"
              tags={editedProfile.extendedInfo.details.genre}
              onAdd={(tag) =>
                updateField(
                  ["extendedInfo", "details", "genre"],
                  [...editedProfile.extendedInfo.details.genre, tag]
                )
              }
              onDelete={(tag) =>
                updateField(
                  ["extendedInfo", "details", "genre"],
                  editedProfile.extendedInfo.details.genre.filter(
                    (g) => g !== tag
                  )
                )
              }
            />

            <Divider sx={{ my: 4 }} />

            {/* TagsSection for Expertise */}
            <TagsSection
              title="Expertise"
              tags={editedProfile.extendedInfo.details.expertise}
              onAdd={(tag) =>
                updateField(
                  ["extendedInfo", "details", "expertise"],
                  [...editedProfile.extendedInfo.details.expertise, tag]
                )
              }
              onDelete={(tag) =>
                updateField(
                  ["extendedInfo", "details", "expertise"],
                  editedProfile.extendedInfo.details.expertise.filter(
                    (e) => e !== tag
                  )
                )
              }
            />

            {/* Sticky Save Button */}
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
                disabled={updateProfile.isPending}
                startIcon={
                  updateProfile.isPending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
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
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </Box>

            <Divider sx={{ my: 4 }} />
            <MFAStatusSection />

            {/* MetadataSection - expects metadata and providerData */}
            <MetadataSection
              metadata={editedProfile.metadata}
              providerData={editedProfile.providerData}
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
          onClose={handleCloseSuccess}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSuccess}
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
