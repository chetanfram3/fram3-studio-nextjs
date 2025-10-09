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
  Tabs,
  Tab,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Error as ErrorIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
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
import DeleteAccountDialog from "./DeleteAccountDialog";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `profile-tab-${index}`,
    "aria-controls": `profile-tabpanel-${index}`,
  };
}

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

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Local state for form editing
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Initialize edited profile when data loads
  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Helper to update nested fields
  const updateField = (path: string[], value: any) => {
    if (!editedProfile) return;

    const newProfile = { ...editedProfile };
    let current: any = newProfile;

    for (let i = 0; i < path.length - 1; i++) {
      current[path[i]] = { ...current[path[i]] };
      current = current[path[i]];
    }

    current[path[path.length - 1]] = value;
    setEditedProfile(newProfile);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedProfile) return;

    // Validate profile
    const errors = validateProfile(editedProfile);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowErrorDialog(true);
      return;
    }

    // Clear validation errors
    setValidationErrors([]);

    try {
      await updateProfile.mutateAsync(editedProfile);
      setShowSuccess(true);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setValidationErrors([
        error instanceof Error ? error.message : "Failed to update profile",
      ]);
      setShowErrorDialog(true);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LoadingAnimation message="Loading your profile..." />
      </Container>
    );
  }

  if (isError || !profile || !editedProfile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert
          severity="error"
          sx={{ borderRadius: `${brand.borderRadius}px` }}
        >
          <Typography variant="h6" gutterBottom>
            Failed to Load Profile
          </Typography>
          <Typography variant="body2">
            {queryError instanceof Error
              ? queryError.message
              : "An error occurred while loading your profile. Please try again."}
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Profile Banner - Outside the tabs */}
      <ProfileBanner
        banner=""
        photoURL={editedProfile.photoURL}
        displayName={editedProfile.displayName}
      />

      {/* Main Paper with Tabs */}
      <Paper
        elevation={0}
        sx={{
          mt: 8,
          borderRadius: `${brand.borderRadius * 1.5}px`,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "primary.dark",
        }}
      >
        {/* Tabs Header */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="profile tabs"
            centered
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
                height: 3,
                borderRadius: `${brand.borderRadius}px ${brand.borderRadius}px 0 0`,
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontFamily: brand.fonts.heading,
                fontSize: "1rem",
                fontWeight: 600,
                minHeight: 64,
                color: "text.secondary",
                transition: "all 0.3s ease",
                "&:hover": {
                  color: "primary.main",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.02)",
                },
                "&.Mui-selected": {
                  color: "primary.main",
                },
              },
            }}
          >
            <Tab
              icon={<PersonIcon />}
              iconPosition="start"
              label="Profile"
              {...a11yProps(0)}
            />
            <Tab
              icon={<SecurityIcon />}
              iconPosition="start"
              label="Security"
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>

        {/* Profile Tab Panel */}
        <TabPanel value={activeTab} index={0}>
          <Box
            component="form"
            onSubmit={handleFormSubmit}
            sx={{ p: { xs: 2, md: 4 } }}
          >
            {/* BasicInfoSection */}
            <BasicInfoSection
              profile={editedProfile}
              onUpdate={(field, value) => updateField(field, value)}
            />

            <Divider sx={{ my: 4 }} />

            {/* AddressSection */}
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

            {/* GSTINDetails */}
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

            {/* PreferencesSection */}
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

            {/* Save Button */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={
                  updateProfile.isPending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                disabled={updateProfile.isPending}
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Security Tab Panel */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            {/* MFA Status Section */}
            <MFAStatusSection />

            <Divider sx={{ my: 4 }} />

            {/* Metadata Section - Read-only account info */}
            <MetadataSection
              metadata={editedProfile.metadata}
              providerData={editedProfile.providerData}
            />
            <Alert severity="warning" sx={{ mb: 2 }}>
              Deleting your account is permanent and cannot be undone after 30
              days.
            </Alert>

            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              sx={{
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              Delete My Account
            </Button>

            <DeleteAccountDialog
              open={deleteDialogOpen}
              onClose={() => setDeleteDialogOpen(false)}
              userEmail={profile.email}
            />
          </Box>
        </TabPanel>
      </Paper>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          sx={{
            width: "100%",
            borderRadius: `${brand.borderRadius}px`,
            boxShadow: theme.shadows[8],
          }}
        >
          Profile updated successfully!
        </Alert>
      </Snackbar>

      {/* Error Dialog */}
      <Dialog
        open={showErrorDialog}
        onClose={handleCloseErrorDialog}
        maxWidth="sm"
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
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "error.main",
            fontFamily: brand.fonts.heading,
          }}
        >
          <ErrorIcon />
          Validation Errors
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please fix the following errors before saving:
          </Typography>
          <List dense>
            {validationErrors.map((error, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <ErrorIcon color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={error} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseErrorDialog}
            variant="contained"
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Got It
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
