// src/components/sidebar/SidebarHeader.tsx
"use client";

import { Box, useTheme, alpha } from "@mui/material";
import { useSidebar } from "./SidebarContext";
import { useThemeMode } from "@/theme";
import { COLLAPSED_WIDTH } from "./constants";
import { getCurrentBrand } from "@/config/brandConfig";

export function SidebarHeader() {
  const { isExpanded } = useSidebar();
  const { isDarkMode } = useThemeMode();
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Use brand logos if available, fallback to default
  const logo = isDarkMode ? brand.logo.dark : brand.logo.light;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        p: 2,
        minHeight: 64,
        borderBottom: 1,
        borderColor: alpha(theme.palette.divider, 0.6),
        mt: 1,
        position: "relative",
        // Decorative gradient underline - Theme aware
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: isExpanded ? "10%" : "20%",
          width: isExpanded ? "80%" : "60%",
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${alpha(
            theme.palette.primary.main,
            0.7
          )}, transparent)`,
          transition: theme.transitions.create(["width", "left"], {
            duration: theme.transitions.duration.standard,
          }),
        },
      }}
    >
      <Box
        component="img"
        src={logo}
        alt={brand.name}
        sx={{
          height: isExpanded ? 60 : 40,
          width: "auto",
          transition: theme.transitions.create(
            ["height", "width", "filter", "transform"],
            {
              duration: theme.transitions.duration.standard,
            }
          ),
          maxWidth: isExpanded ? 200 : COLLAPSED_WIDTH - 32,
          mx: "auto",
          display: "block",
          objectFit: "contain",
          // Theme-aware shadow
          filter: isDarkMode
            ? `drop-shadow(0 2px 5px ${alpha(theme.palette.primary.main, 0.3)})`
            : `drop-shadow(0 2px 5px ${alpha(theme.palette.common.black, 0.2)})`,
          "&:hover": {
            transform: "scale(1.05)",
            filter: isDarkMode
              ? `drop-shadow(0 4px 8px ${alpha(theme.palette.primary.main, 0.4)})`
              : `drop-shadow(0 4px 8px ${alpha(theme.palette.common.black, 0.3)})`,
          },
        }}
      />
    </Box>
  );
}
