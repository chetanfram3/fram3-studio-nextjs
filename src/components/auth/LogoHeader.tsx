"use client";

import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useThemeMode } from "@/theme";
import { getCurrentBrand } from "@/config/brandConfig";

/**
 * Brand-aware logo header component
 * Displays logo and brand name with proper theming
 */
export default function LogoHeader() {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const brand = getCurrentBrand();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mb: 4,
      }}
    >
      {/* Logo Image */}
      <Box
        component="img"
        src={isDarkMode ? brand.logo.signin : brand.logo.signin}
        alt={brand.name}
        sx={{
          width: { xs: 100, sm: 120 },
          height: { xs: 100, sm: 120 },
          mb: 2,
          transition: theme.transitions.create(["transform"]),
          "&:hover": {
            transform: "scale(1.05)",
          },
        }}
      />

      {/* Brand Name */}
      <Typography
        variant="h1"
        sx={{
          fontFamily: brand.fonts.heading,
          fontSize: { xs: "2.5rem", sm: "3rem", md: "4rem" },
          fontWeight: "normal",
          textTransform: "uppercase",
          color: "secondary.main",
          textAlign: "center",
          letterSpacing: "0.05em",
        }}
      >
        {brand.name}
      </Typography>

      {/* Tagline */}
      {brand.tagline && (
        <Typography
          variant="subtitle1"
          sx={{
            mt: 1,
            color: "primary.main",
            textAlign: "center",
            fontFamily: brand.fonts.body,
          }}
        >
          {brand.tagline}
        </Typography>
      )}
    </Box>
  );
}
