// src/components/profile/BasicInfoSection.tsx
"use client";

import { TextField, Typography, Box } from "@mui/material";
import { UserProfile } from "@/types/profile";
import { getCurrentBrand } from "@/config/brandConfig";
import EmailVerificationStatus from "./EmailVerificationStatus";

interface BasicInfoSectionProps {
  profile: UserProfile;
  onUpdate: (field: string[], value: string) => void;
}

export default function BasicInfoSection({
  profile,
  onUpdate,
}: BasicInfoSectionProps) {
  const brand = getCurrentBrand();

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
            <EmailVerificationStatus isVerified={profile.emailVerified} />
          </Box>
        </Box>
        <Box>
          <TextField
            fullWidth
            label="Phone"
            value={profile.phoneNumber || ""}
            onChange={(e) => onUpdate(["phoneNumber"], e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${brand.borderRadius}px`,
              },
            }}
          />
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
    </Box>
  );
}
