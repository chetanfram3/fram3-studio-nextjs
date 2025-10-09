// src/components/profile/BasicInfoSection.tsx
"use client";

import { TextField, Typography, Box, Button } from "@mui/material";
import { Phone as PhoneIcon } from "@mui/icons-material";
import { UserProfile } from "@/types/profile";
import { getCurrentBrand } from "@/config/brandConfig";
import VerificationStatus from "./VerificationStatus";
import PhoneLinkingDialog from "./PhoneLinkingDialog";
import { useState } from "react";

interface BasicInfoSectionProps {
  profile: UserProfile;
  onUpdate: (field: string[], value: string) => void;
}

/**
 * Check if phone number is verified via phone provider
 */
const isPhoneVerified = (profile: UserProfile): boolean => {
  if (!profile.phoneNumber) return false;

  // Check if user has authenticated with this phone number
  const phoneProvider = profile.providerData?.find(
    (provider) => provider.providerId === "phone"
  );

  // Phone is verified if it matches the phone provider
  return phoneProvider?.phoneNumber === profile.phoneNumber;
};

export default function BasicInfoSection({
  profile,
  onUpdate,
}: BasicInfoSectionProps) {
  const brand = getCurrentBrand();
  const phoneVerified = isPhoneVerified(profile);
  const [phoneLinkingOpen, setPhoneLinkingOpen] = useState(false);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontFamily: brand.fonts.heading,
          color: "primary.main",
          fontWeight: 600,
        }}
      >
        Basic Information
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 3,
        }}
      >
        <Box>
          <TextField
            fullWidth
            label="First Name"
            value={profile.extendedInfo.details.firstName}
            onChange={(e) =>
              onUpdate(["extendedInfo", "details", "firstName"], e.target.value)
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${brand.borderRadius}px`,
              },
            }}
          />
        </Box>
        <Box>
          <TextField
            fullWidth
            label="Last Name"
            value={profile.extendedInfo.details.lastName}
            onChange={(e) =>
              onUpdate(["extendedInfo", "details", "lastName"], e.target.value)
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${brand.borderRadius}px`,
              },
            }}
          />
        </Box>
        <Box>
          <TextField
            fullWidth
            label="Display Name"
            value={profile.displayName}
            onChange={(e) => onUpdate(["displayName"], e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${brand.borderRadius}px`,
              },
            }}
          />
        </Box>
        <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              fullWidth
              label="Email"
              value={profile.email}
              disabled
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${brand.borderRadius}px`,
                },
              }}
            />
            <VerificationStatus isVerified={profile.emailVerified} />
          </Box>
        </Box>
        <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              fullWidth
              label="Phone"
              value={profile.phoneNumber || ""}
              disabled={phoneVerified}
              helperText={
                phoneVerified
                  ? "Phone verified via authentication"
                  : "Click 'Verify Phone' to add and verify"
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${brand.borderRadius}px`,
                },
              }}
            />

            {/* Verification Status or Button */}
            {phoneVerified ? (
              <VerificationStatus isVerified={phoneVerified} />
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={() => setPhoneLinkingOpen(true)}
                startIcon={<PhoneIcon />}
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
                  whiteSpace: "nowrap",
                }}
              >
                Verify Phone
              </Button>
            )}
          </Box>
        </Box>
        <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
          <TextField
            fullWidth
            label="Profile Picture URL"
            value={profile.photoURL}
            onChange={(e) => onUpdate(["photoURL"], e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${brand.borderRadius}px`,
              },
            }}
          />
        </Box>
      </Box>
      {/* Phone Linking Dialog */}
      <PhoneLinkingDialog
        open={phoneLinkingOpen}
        onClose={() => setPhoneLinkingOpen(false)}
        onSuccess={(phoneNumber) => {
          onUpdate(["phoneNumber"], phoneNumber);
          setPhoneLinkingOpen(false);
        }}
        currentPhone={profile.phoneNumber}
      />
    </Box>
  );
}
