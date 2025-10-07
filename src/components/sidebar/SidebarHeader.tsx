// src/components/sidebar/SidebarHeader.tsx
"use client";

import { Box, useTheme, alpha } from "@mui/material";
import { useSidebar } from "./SidebarContext";
import { useThemeMode } from "@/theme";
import { COLLAPSED_WIDTH } from "./constants";

/**
 * SidebarHeader Component
 * 
 * Displays the application logo in the sidebar header
 * - Logo size adjusts based on sidebar expanded/collapsed state
 * - Includes hover effects and transitions
 * - Optional decorative gradient underline
 */
export function SidebarHeader() {
  const { isExpanded } = useSidebar();
  const { isDarkMode } = useThemeMode();
  const theme = useTheme();

  // Use the same logo for both dark and light mode
  // Update paths based on your actual logo files
  const logo = isDarkMode ? "/logo512.png" : "/logo512.png";

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
        borderBottom: "1px solid",
        borderColor: alpha(theme.palette.divider, 0.6),
        mt: 1,
        position: "relative",
        // Decorative gradient underline
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: isExpanded ? "10%" : "20%",
          width: isExpanded ? "80%" : "60%",
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${alpha(
            theme.palette.secondary.main,
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
        alt="Fram3 Studio"
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
          filter: `drop-shadow(0 2px 5px ${alpha(
            theme.palette.common.black,
            0.2
          )})`,
          "&:hover": {
            transform: "scale(1.05)",
            filter: `drop-shadow(0 4px 8px ${alpha(
              theme.palette.common.black,
              0.3
            )})`,
          },
        }}
      />
    </Box>
  );
}