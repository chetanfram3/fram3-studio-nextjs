// src/pages/payments/components/MissingProfileDataCollection.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Alert,
  Collapse,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import {
  Warning,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  Public,
  Business,
} from "@mui/icons-material";
import { ProfileUpdate, UserProfile } from "@/types/profile";
import { ProfileTaxService } from "@/services/profileTaxService";
import type { GSTConfig } from "@/services/payments";

// ✅ CORRECT: Import existing components as used in ProfileForm
import AddressSection from "@/components/profile/AddressSection";
import { GSTINDetails } from "./GSTINDetails";

interface MissingProfileDataProps {
  profile: UserProfile;
  onProfileUpdate: (
    updates: Partial<UserProfile> | ProfileUpdate
  ) => Promise<void>;
  onComplete: () => void;
  gstConfig?: GSTConfig;
}

export const MissingProfileDataCollection: React.FC<
  MissingProfileDataProps
> = ({ profile, onProfileUpdate, onComplete, gstConfig }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ CORRECT: Use same structure as ProfileForm
  const [tempProfile, setTempProfile] = useState<UserProfile>({
    ...profile,
    extendedInfo: {
      ...profile.extendedInfo,
      details: {
        ...profile.extendedInfo?.details,
        address: {
          street: profile?.extendedInfo?.details?.address?.street || "",
          city: profile?.extendedInfo?.details?.address?.city || "",
          state: profile?.extendedInfo?.details?.address?.state || "",
          postalCode: profile?.extendedInfo?.details?.address?.postalCode || "",
          country: profile?.extendedInfo?.details?.address?.country || "IN",
        },
        gstin: profile?.extendedInfo?.details?.gstin || null,
      },
    },
  });

  // ✅ Use ProfileTaxService for consistency
  const taxInfo = ProfileTaxService.extractTaxInfo(tempProfile);
  const missingFields = ProfileTaxService.getMissingFieldsForTax(tempProfile);
  const hasCompleteData = ProfileTaxService.hasCompleteTaxData(tempProfile);

  // ✅ Check international status
  const isInternational =
    tempProfile.extendedInfo.details.address.country !== "IN";

  // ✅ CORRECT: Update field function matching ProfileForm pattern
  const updateField = (fieldPath: string[], value: any) => {
    setTempProfile((prev) => {
      const newProfile = { ...prev };
      let current: any = newProfile;

      // Navigate to the nested object, creating objects if they don't exist
      for (let i = 0; i < fieldPath.length - 1; i++) {
        if (!current[fieldPath[i]]) {
          current[fieldPath[i]] = {};
        }
        current = current[fieldPath[i]];
      }

      // Update the value
      current[fieldPath[fieldPath.length - 1]] = value;
      return newProfile;
    });
  };

  const handleSaveData = async () => {
    try {
      setLoading(true);

      // ✅ CORRECT: Use ProfileUpdate type for partial updates
      const updates: ProfileUpdate = {
        extendedInfo: {
          details: {
            address: tempProfile.extendedInfo.details.address,
            gstin: tempProfile.extendedInfo.details.gstin,
          },
        },
      };

      await onProfileUpdate(updates);
      onComplete();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // ✅ Enhanced validation
  const isAddressValid = isInternational
    ? // International: need complete address
      !!(
        tempProfile.extendedInfo.details.address.country &&
        tempProfile.extendedInfo.details.address.state &&
        tempProfile.extendedInfo.details.address.city &&
        tempProfile.extendedInfo.details.address.street &&
        tempProfile.extendedInfo.details.address.postalCode
      )
    : // Indian: need at least country and state
      !!(
        tempProfile.extendedInfo.details.address.country === "IN" &&
        tempProfile.extendedInfo.details.address.state
      );

  const isGstinValid =
    !tempProfile.extendedInfo.details.gstin?.number ||
    (tempProfile.extendedInfo.details.gstin?.number &&
      tempProfile.extendedInfo.details.gstin?.companyName &&
      tempProfile.extendedInfo.details.gstin.number.length === 15);

  const isFormValid = isAddressValid && isGstinValid;

  return (
    <Card
      sx={{
        mb: 4,
        border: "2px solid",
        borderColor: "secondary.main",
        backgroundColor: "background.default",
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Warning color="warning" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" color="secondary.main">
              Complete Your Profile for Accurate Tax Calculation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isInternational
                ? "We need your complete address for international transactions"
                : "We need your location details to calculate GST correctly"}
            </Typography>
          </Box>
          <Button
            onClick={() => setExpanded(!expanded)}
            endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            variant="outlined"
            size="small"
          >
            {expanded ? "Hide" : "Complete Now"}
          </Button>
        </Box>

        {/* Missing fields summary */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {missingFields.map((field) => (
            <Chip
              key={field}
              label={`Missing: ${field}`}
              color="warning"
              size="small"
              variant="outlined"
            />
          ))}
        </Stack>

        <Collapse in={expanded}>
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              {/* ✅ CORRECT: Address Section - exactly like ProfileForm */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <Public
                    sx={{ fontSize: 18, mr: 1, verticalAlign: "middle" }}
                  />
                  Address Information
                </Typography>
                <AddressSection
                  address={tempProfile.extendedInfo.details.address}
                  onUpdate={(field, value) =>
                    updateField(
                      ["extendedInfo", "details", "address", field],
                      value
                    )
                  }
                />

                {isInternational && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ℹ️ <strong>International Customer:</strong> Export of
                      services - 0% GST applies
                    </Typography>
                  </Alert>
                )}
              </Grid>

              {/* ✅ CORRECT: GSTIN Details - exactly like ProfileForm (only for Indian users) */}
              {!isInternational && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      <Business
                        sx={{ fontSize: 18, mr: 1, verticalAlign: "middle" }}
                      />
                      Business Information (Optional)
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <GSTINDetails
                      gstin={
                        tempProfile.extendedInfo.details.gstin?.number || ""
                      }
                      companyName={
                        tempProfile.extendedInfo.details.gstin?.companyName ||
                        ""
                      }
                      onChange={(values, isValid) => {
                        if (!values.gstin && !values.companyName) {
                          updateField(
                            ["extendedInfo", "details", "gstin"],
                            null
                          );
                        } else {
                          updateField(["extendedInfo", "details", "gstin"], {
                            number: values.gstin,
                            companyName: values.companyName,
                          });
                        }
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Leave blank for individual purchases. Required for B2B
                      invoices and input tax credit.
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>

            {/* Action buttons */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mt: 3,
                justifyContent: "flex-end",
              }}
            >
              <Button onClick={handleSkip} variant="outlined">
                Skip for Now
              </Button>
              <Button
                onClick={handleSaveData}
                variant="contained"
                disabled={!isFormValid || loading}
                sx={{
                  backgroundColor: "secondary.main",
                  color: "common.black",
                  "&:hover": { backgroundColor: "secondary.dark" },
                }}
              >
                {loading ? "Saving..." : "Save & Continue"}
              </Button>
            </Box>

            {/* Tax preview */}
            {isFormValid &&
              tempProfile.extendedInfo.details.address.country && (
                <Alert
                  severity={isInternational ? "success" : "info"}
                  sx={{ mt: 2 }}
                >
                  <Typography variant="body2">
                    <strong>Tax Preview:</strong>
                    {isInternational ? (
                      <>
                        As an international customer from{" "}
                        {tempProfile.extendedInfo.details.address.country}, this
                        transaction qualifies as export of services.
                        <strong> 0% GST will be applied</strong> as per Indian
                        tax regulations. Payment will be processed in INR.
                      </>
                    ) : (
                      <>
                        Based on your location in{" "}
                        {tempProfile.extendedInfo.details.address.state}, we'll
                        calculate{" "}
                        {tempProfile.extendedInfo.details.address.state ===
                        gstConfig?.businessState
                          ? "CGST + SGST"
                          : "IGST"}{" "}
                        at 18% on your purchase.
                        {tempProfile.extendedInfo.details.gstin?.number &&
                          " Business invoice will be generated for input tax credit."}
                      </>
                    )}
                  </Typography>
                </Alert>
              )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};
