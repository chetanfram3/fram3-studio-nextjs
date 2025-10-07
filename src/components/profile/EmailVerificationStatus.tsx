// src/components/profile/EmailVerificationStatus.tsx
"use client";

import { Box, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { getCurrentBrand } from "@/config/brandConfig";

interface EmailVerificationStatusProps {
  isVerified: boolean;
}

export default function EmailVerificationStatus({
  isVerified,
}: EmailVerificationStatusProps) {
  const brand = getCurrentBrand();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {isVerified ? (
        <CheckCircleIcon color="success" />
      ) : (
        <ErrorOutlineIcon color="warning" />
      )}
      <Chip
        label={isVerified ? "Verified" : "Not Verified"}
        color={isVerified ? "success" : "warning"}
        size="small"
        sx={{
          borderRadius: `${brand.borderRadius}px`,
          fontWeight: 600,
        }}
      />
    </Box>
  );
}
