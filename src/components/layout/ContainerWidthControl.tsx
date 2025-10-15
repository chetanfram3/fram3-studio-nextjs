"use client";

import { Box, IconButton, Tooltip, Zoom, Container } from "@mui/material";
import { Expand, Minimize2 } from "lucide-react";
import { useTheme, alpha } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useLayoutStore } from "@/store/layoutStore";
import type { ReactNode } from "react";

interface ContainerWidthControlProps {
  children: ReactNode;
  showToggle?: boolean; // Option to hide toggle button
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

/**
 * ContainerWidthControl - Wraps content with dynamic width control
 *
 * Features:
 * - Toggle between full-width and XL container
 * - Persists preference to localStorage via Zustand
 * - Floating toggle button (theme-aware)
 * - Smooth transitions
 *
 * Usage:
 * ```tsx
 * <ContainerWidthControl>
 *   <YourPageContent />
 * </ContainerWidthControl>
 * ```
 */
export default function ContainerWidthControl({
  children,
  showToggle = true,
  position = "top-right",
}: ContainerWidthControlProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { containerWidth, toggleContainerWidth } = useLayoutStore();

  const isFullWidth = containerWidth === "full";

  // Position styles based on prop
  const positionStyles = {
    "top-right": { top: 16, right: 16 },
    "top-left": { top: 16, left: 16 },
    "bottom-right": { bottom: 16, right: 16 },
    "bottom-left": { bottom: 16, left: 16 },
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        transition: theme.transitions.create(["max-width", "padding"], {
          duration: theme.transitions.duration.standard,
        }),
      }}
    >
      {/* Floating Toggle Button */}
      {showToggle && (
        <Zoom in={true}>
          <Tooltip
            title={isFullWidth ? "Contain Width" : "Full Width"}
            placement="left"
            arrow
          >
            <IconButton
              onClick={toggleContainerWidth}
              sx={{
                position: "fixed",
                ...positionStyles[position],
                zIndex: theme.zIndex.speedDial,
                width: 40,
                height: 40,
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: "blur(8px)",
                border: 1,
                borderColor: "divider",
                boxShadow: theme.shadows[4],
                transition: theme.transitions.create(
                  ["background-color", "transform", "box-shadow"],
                  {
                    duration: theme.transitions.duration.short,
                  }
                ),
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  borderColor: "primary.main",
                  transform: "scale(1.05)",
                  boxShadow: theme.shadows[8],
                },
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
            >
              {isFullWidth ? (
                <Minimize2
                  size={20}
                  style={{ color: theme.palette.primary.main }}
                />
              ) : (
                <Expand
                  size={20}
                  style={{ color: theme.palette.primary.main }}
                />
              )}
            </IconButton>
          </Tooltip>
        </Zoom>
      )}

      {/* Content Wrapper */}
      {isFullWidth ? (
        // Full Width - No Container
        <Box
          sx={{
            width: "100%",
            transition: theme.transitions.create("padding", {
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          {children}
        </Box>
      ) : (
        // Contained Width - Use MUI Container
        <Container
          maxWidth="xl"
          sx={{
            transition: theme.transitions.create("max-width", {
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          {children}
        </Container>
      )}
    </Box>
  );
}
