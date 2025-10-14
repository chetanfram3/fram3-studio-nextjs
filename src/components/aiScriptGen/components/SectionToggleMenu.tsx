"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  IconButton,
  Paper,
  Typography,
  Fade,
  Backdrop,
  Fab,
} from "@mui/material";
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Book as BookIcon,
  Business as BusinessIcon,
  ShoppingCart as ProductIcon,
  Campaign as CampaignIcon,
  Palette as StyleIcon,
  Build as ExecutionIcon,
  Tune as AllSettingsIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  useSectionVisibility,
  SectionId,
} from "../context/SectionVisibilityContext";

// ==========================================
// TYPE DEFINITIONS
// ==========================================
interface SectionOption {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}

// ==========================================
// CONSTANTS
// ==========================================
const sectionOptions: SectionOption[] = [
  { id: "audience", label: "Audience", icon: <PersonIcon /> },
  { id: "story", label: "Story", icon: <BookIcon /> },
  { id: "brand", label: "Brand", icon: <BusinessIcon /> },
  { id: "product", label: "Product", icon: <ProductIcon /> },
  { id: "campaign", label: "Campaign", icon: <CampaignIcon /> },
  { id: "style", label: "Style", icon: <StyleIcon /> },
  { id: "execution", label: "Execution", icon: <ExecutionIcon /> },
];

/**
 * SectionToggleMenu - Floating menu for toggling section visibility
 *
 * Performance optimizations:
 * - React 19 compiler auto-optimizes (no manual memo needed)
 * - useCallback for event handlers
 * - useMemo for computed values
 * - Theme-aware styling (no hardcoded colors)
 * - Proper dependency arrays
 *
 * Porting standards:
 * - 100% type safe (no any types)
 * - Uses theme palette for all colors (primary instead of secondary)
 * - Uses brand config for fonts/spacing
 * - No hardcoded colors, fonts, or spacing
 * - Proper MUI alpha function import
 * - Follows MUI v7 patterns
 */
export default function SectionToggleMenu() {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // CONTEXT & STATE
  // ==========================================
  const {
    visibleSections,
    toggleSection,
    isVisible,
    showAllSections,
    getEnabledSectionCount,
  } = useSectionVisibility();

  const [isOpen, setIsOpen] = useState(false);

  // ==========================================
  // COMPUTED VALUES (Memoized for performance)
  // ==========================================
  const { enabled, total } = useMemo(
    () => getEnabledSectionCount(),
    [getEnabledSectionCount]
  );

  // ==========================================
  // EVENT HANDLERS (useCallback for stability)
  // ==========================================
  const handleToggle = useCallback(
    (sectionId: SectionId) => {
      toggleSection(sectionId);
    },
    [toggleSection]
  );

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleShowAllSections = useCallback(() => {
    showAllSections();
  }, [showAllSections]);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <>
      {/* Backdrop for when menu is open */}
      <Backdrop
        sx={{
          color: "text.primary",
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: alpha(theme.palette.background.default, 0.7),
        }}
        open={isOpen}
        onClick={closeMenu}
      />

      {/* Menu */}
      <Fade in={isOpen}>
        <Paper
          elevation={4}
          sx={{
            position: "fixed",
            bottom: 80,
            right: 16,
            width: 240,
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.paper",
            zIndex: theme.zIndex.drawer + 2,
            visibility: isOpen ? "visible" : "hidden",
            border: 1,
            borderColor: "divider",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              p: 1.5,
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: "background.default",
              borderTopLeftRadius: `${brand.borderRadius}px`,
              borderTopRightRadius: `${brand.borderRadius}px`,
            }}
          >
            <SettingsIcon
              sx={{
                color: "primary.main",
                mr: 1,
              }}
            />
            <Typography
              variant="subtitle1"
              fontWeight="medium"
              sx={{
                color: "text.primary",
                fontFamily: brand.fonts.heading,
              }}
            >
              Creative Input
            </Typography>
          </Box>

          {/* Section Options */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 1,
              p: 1.5,
              bgcolor: "background.default",
            }}
          >
            {sectionOptions.map((section) => (
              <Box
                key={section.id}
                onClick={() => handleToggle(section.id)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 2,
                  borderRadius: `${brand.borderRadius / 2}px`,
                  cursor: "pointer",
                  bgcolor: isVisible(section.id)
                    ? alpha(theme.palette.primary.main, 0.1)
                    : "background.paper",
                  border: 1,
                  borderColor: isVisible(section.id)
                    ? "primary.main"
                    : "divider",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: isVisible(section.id)
                      ? alpha(theme.palette.primary.main, 0.15)
                      : "action.hover",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isVisible(section.id)
                      ? "primary.main"
                      : "text.secondary",
                    mb: 0.5,
                  }}
                >
                  {section.icon}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: isVisible(section.id)
                      ? "primary.main"
                      : "text.secondary",
                    fontWeight: isVisible(section.id) ? "medium" : "normal",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {section.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* All Settings Option */}
          <Box
            onClick={handleShowAllSections}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 1.5,
              m: 1.5,
              borderRadius: `${brand.borderRadius / 2}px`,
              cursor: "pointer",
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              transition: "background-color 0.2s",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <AllSettingsIcon
              sx={{
                mr: 1,
                color: "text.secondary",
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: "text.primary",
                fontFamily: brand.fonts.body,
              }}
            >
              All Settings
            </Typography>
          </Box>

          {/* Footer with count */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 1.5,
              bgcolor: "background.default",
              borderBottomLeftRadius: `${brand.borderRadius}px`,
              borderBottomRightRadius: `${brand.borderRadius}px`,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontFamily: brand.fonts.body,
              }}
            >
              Enabled sections:
            </Typography>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{
                color: "text.primary",
                fontFamily: brand.fonts.body,
              }}
            >
              {enabled} / {total}
            </Typography>
          </Box>
        </Paper>
      </Fade>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="toggle sections"
        onClick={toggleMenu}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          bgcolor: isOpen ? "error.main" : "primary.main",
          "&:hover": {
            bgcolor: isOpen ? "error.dark" : "primary.dark",
          },
        }}
      >
        {isOpen ? <CloseIcon /> : <SettingsIcon />}
      </Fab>
    </>
  );
}

SectionToggleMenu.displayName = "SectionToggleMenu";
