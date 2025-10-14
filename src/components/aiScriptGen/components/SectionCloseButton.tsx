"use client";

import React, { useCallback } from "react";
import { IconButton, IconButtonProps } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import {
  useSectionVisibility,
  SectionId,
} from "../context/SectionVisibilityContext";

// ==========================================
// TYPE DEFINITIONS
// ==========================================
interface SectionCloseButtonProps extends Omit<IconButtonProps, "onClick"> {
  sectionId: SectionId;
  icon?: React.ReactNode;
}

/**
 * SectionCloseButton - Reusable close button for section visibility toggling
 *
 * Performance optimizations:
 * - React 19 compiler auto-optimizes (no manual memo needed)
 * - useCallback for click handler
 * - Theme-aware styling (no hardcoded colors)
 *
 * Porting standards:
 * - 100% type safe (no any types)
 * - Uses theme palette for all colors
 * - No hardcoded colors or spacing
 * - Follows MUI v7 patterns
 *
 * @param sectionId - The ID of the section to toggle visibility
 * @param icon - Optional custom icon (defaults to CloseIcon)
 * @param props - Other IconButton props (color, sx, etc.)
 */
export default function SectionCloseButton({
  sectionId,
  icon,
  sx,
  ...props
}: SectionCloseButtonProps) {
  // ==========================================
  // THEME & CONTEXT
  // ==========================================
  const theme = useTheme();
  const { toggleSection } = useSectionVisibility();

  // ==========================================
  // EVENT HANDLERS (useCallback for stability)
  // ==========================================
  const handleClick = useCallback(() => {
    toggleSection(sectionId);
  }, [toggleSection, sectionId]);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <IconButton
      size="small"
      onClick={handleClick}
      sx={{
        color: "text.secondary",
        "&:hover": {
          color: "error.main",
          bgcolor: alpha(theme.palette.error.main, 0.1),
        },
        ...sx,
      }}
      {...props}
    >
      {icon || <CloseIcon fontSize="small" />}
    </IconButton>
  );
}

SectionCloseButton.displayName = "SectionCloseButton";
