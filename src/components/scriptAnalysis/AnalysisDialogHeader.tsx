"use client";

import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import Image from "next/image";

/**
 * AnalysisDialogHeader
 *
 * Header component for analysis dialog/page.
 * Displays logo and title with theme-aware styling.
 * Fully optimized with Next.js Image component.
 */
export default function AnalysisDialogHeader() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  // Get logo with fallback to light mode logo if signin is not available
  const logo = brand.logo.signin ?? brand.logo.light;

  return (
    <Box sx={{ textAlign: "center", mb: 4 }}>
      {/* Logo */}
      <Box
        sx={{
          position: "relative",
          width: 128,
          height: 128,
          mx: "auto",
          mb: 2,
        }}
      >
        <Image
          src={logo}
          alt="FRAM3 Studio Logo"
          fill
          sizes="128px"
          priority
          style={{
            objectFit: "contain",
          }}
        />
      </Box>

      {/* Brand Title */}
      <Typography
        variant="h6"
        component="h1"
        sx={{
          fontFamily: brand.fonts.heading,
          fontSize: { xs: "1.25rem", md: "1.5rem" },
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: "text.primary",
          transform: { xs: "translateY(-2px)", md: "translateY(-4.5px)" },
          transition: theme.transitions.create(["color"], {
            duration: theme.transitions.duration.standard,
          }),
          "& .yellow-text": {
            color: "primary.main",
            transition: theme.transitions.create(["color"], {
              duration: theme.transitions.duration.standard,
            }),
          },
          "&:hover": {
            color: "primary.main",
            "& .yellow-text": {
              color: "text.primary",
            },
          },
        }}
      >
        FRAM
        <span className="yellow-text">3</span>
        <Box
          component="span"
          sx={{ display: { xs: "none", md: "inline" } }}
          className="yellow-text"
        >
          {" "}
          STUDIO
        </Box>
      </Typography>

      {/* Subtitle */}
      <Typography
        variant="h2"
        component="h2"
        sx={{
          fontFamily: brand.fonts.heading,
          fontSize: { xs: "1.0rem", md: "1.1rem" },
          fontWeight: 400,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "text.primary",
          mt: 1,
        }}
      >
        Input Script
      </Typography>
    </Box>
  );
}
