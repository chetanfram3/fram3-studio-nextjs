"use client";

import { Box, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useThemeMode } from "@/theme";
import { getCurrentBrand } from "@/config/brandConfig";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const loadOrbitronFont = () => {
  const fontFace = `
    @font-face {
      font-family: 'Orbitron';
      font-style: normal;
      font-weight: 400 900;
      font-display: swap;
      src: url('/fonts/Orbitron-VariableFont_wght.ttf') format('truetype');
    }
  `;

  const style = document.createElement("style");
  style.textContent = fontFace;
  document.head.appendChild(style);
};

export function Logo() {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const brand = getCurrentBrand();
  const router = useRouter();

  useEffect(() => {
    loadOrbitronFont();
  }, []);

  const handleLogoClick = () => {
    router.push("/");
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        cursor: "pointer",
        transition: theme.transitions.create(["transform"]),
        "&:hover": {
          transform: "scale(1.05)",
        },
      }}
      onClick={handleLogoClick}
      className="group"
    >
      {/* Logo Icon Container */}
      <Box
        sx={{
          position: "relative",
          width: { xs: 32, md: 40 },
          height: { xs: 32, md: 40 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transition: theme.transitions.create(["border-color", "transform"]),
          "&:hover": {
            borderColor: alpha(theme.palette.primary.main, 0.4),
            "& .pulse-effect": {
              opacity: 1,
            },
          },
        }}
      >
        {/* Pulse Effect - Theme Aware */}
        <Box
          className="pulse-effect"
          sx={{
            position: "absolute",
            inset: 0,
            // Dynamic gradient based on theme mode
            borderRadius: "50%",
            opacity: 0,
            animation: "pulse 2s infinite",
            transition: theme.transitions.create(["opacity"]),
            "@keyframes pulse": {
              "0%": { opacity: 0.3 },
              "50%": { opacity: 0.6 },
              "100%": { opacity: 0.3 },
            },
          }}
        />

        {/* Logo Image */}
        <Box
          component="img"
          src={`${brand.logo.headerLogo}`}
          alt={`${brand.name} Logo`}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            zIndex: 10,
            transition: theme.transitions.create(["filter"]),
            // Subtle filter effect in dark mode
            filter: isDarkMode
              ? `drop-shadow(0 0 8px ${alpha(theme.palette.primary.main, 0.3)})`
              : "none",
          }}
        />
      </Box>

      {/* Brand Text - Theme Aware */}
      <Typography
        variant="h6"
        sx={{
          fontFamily: brand.fonts.heading,
          fontSize: { xs: "1.25rem", md: "1.5rem" },
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: "text.primary",
          transform: { xs: "translateY(-2px)", md: "translateY(-4.5px)" },
          transition: theme.transitions.create(["color"]),
          // Yellow/accent text for "3" and "STUDIO"
          "& .accent-text": {
            color: isDarkMode
              ? theme.palette.primary.main // Gold in dark mode
              : theme.palette.secondary.main, // Orange-gold in light mode
            transition: theme.transitions.create(["color"]),
          },
          "&:hover": {
            "& .accent-text": {
              color: isDarkMode
                ? theme.palette.primary.light // Lighter gold
                : theme.palette.secondary.light, // Lighter orange-gold
            },
          },
        }}
      >
        FRAM
        <span className="accent-text">3</span>
        <Box
          component="span"
          sx={{ display: { xs: "none", md: "inline" } }}
          className="accent-text"
        >
          {" "}
          STUDIO
        </Box>
      </Typography>
    </Box>
  );
}
