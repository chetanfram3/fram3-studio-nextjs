// src/components/profile/ProfileBanner.tsx
"use client";

import { Box, Avatar, Paper } from "@mui/material";
import { getCurrentBrand } from "@/config/brandConfig";

interface ProfileBannerProps {
  banner?: string;
  photoURL: string;
  displayName: string;
}

export default function ProfileBanner({
  banner,
  photoURL,
  displayName,
}: ProfileBannerProps) {
  const brand = getCurrentBrand();

  return (
    <Box sx={{ position: "relative", mb: 8 }}>
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          borderRadius: `${brand.borderRadius * 1.5}px`,
          overflow: "hidden",
          height: { xs: 150, md: 200 },
          border: 2,
          borderColor: "primary.dark",
        }}
      >
        <Box
          component="img"
          src={
            banner ||
            "https://images.unsplash.com/photo-1444628838545-ac4016a5418a?w=1600&h=400&fit=crop"
          }
          alt="Profile Banner"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Paper>

      <Avatar
        src={
          photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=FFD700&color=000`
        }
        alt={displayName}
        sx={{
          width: { xs: 100, md: 120 },
          height: { xs: 100, md: 120 },
          border: 4,
          borderColor: "primary.main",
          position: "absolute",
          bottom: { xs: -50, md: -60 },
          left: { xs: "50%", sm: 40 },
          transform: { xs: "translateX(-50%)", sm: "none" },
          zIndex: 1,
          boxShadow: (theme) => theme.shadows[6],
        }}
      />
    </Box>
  );
}
