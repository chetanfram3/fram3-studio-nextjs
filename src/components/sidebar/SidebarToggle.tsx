"use client";

import { IconButton, Tooltip, Box, useTheme, alpha } from "@mui/material";
import { ChevronLeft, ChevronRight, Menu } from "@mui/icons-material";
import { useSidebar } from "./SidebarContext";
import { useThemeMode } from "@/theme";

export function SidebarToggle() {
  const { isExpanded, isMobile, toggleSidebar } = useSidebar();
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();

  // Get the appropriate secondary color based on theme mode
  const secondaryColor = theme.palette.secondary.main;
  const secondaryLight = theme.palette.secondary.light;
  const secondaryDark = theme.palette.secondary.dark;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        mt: 2,
        mb: 2,
      }}
    >
      <Tooltip title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}>
        <IconButton
          onClick={toggleSidebar}
          size="small"
          sx={{
            color: secondaryColor,
            backgroundColor: alpha(secondaryColor, 0.12),
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: theme.transitions.create(
              ["background-color", "transform", "color", "box-shadow"],
              { duration: theme.transitions.duration.shorter }
            ),
            "&:hover": {
              color: isDarkMode ? secondaryLight : secondaryDark,
              transform: "scale(1.05)",
              boxShadow: `0 0 12px ${alpha(secondaryColor, 0.5)}`,
            },
            "&:active": {
              transform: "scale(0.98)",
              boxShadow: `0 0 5px ${alpha(secondaryColor, 0.3)}`,
            },
          }}
        >
          {isMobile ? (
            <Menu fontSize="small" />
          ) : isExpanded ? (
            <ChevronLeft fontSize="small" />
          ) : (
            <ChevronRight fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
