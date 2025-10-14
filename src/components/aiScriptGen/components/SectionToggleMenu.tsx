// src/modules/scripts/components/SectionToggleMenu.tsx
import React, { useState } from "react";
import {
  Box,
  IconButton,
  Paper,
  Typography,
  Fade,
  Backdrop,
  useTheme,
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
import {
  useSectionVisibility,
  SectionId,
} from "../context/SectionVisibilityContext";

interface SectionOption {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}

const sectionOptions: SectionOption[] = [
  { id: "audience", label: "Audience", icon: <PersonIcon /> },
  { id: "story", label: "Story", icon: <BookIcon /> },
  { id: "brand", label: "Brand", icon: <BusinessIcon /> },
  { id: "product", label: "Product", icon: <ProductIcon /> },
  { id: "campaign", label: "Campaign", icon: <CampaignIcon /> },
  { id: "style", label: "Style", icon: <StyleIcon /> },
  { id: "execution", label: "Execution", icon: <ExecutionIcon /> },
];

const SectionToggleMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();
  const {
    visibleSections,
    toggleSection,
    isVisible,
    showAllSections,
    getEnabledSectionCount,
  } = useSectionVisibility();

  const { enabled, total } = getEnabledSectionCount();

  // Handle toggle
  const handleToggle = (sectionId: SectionId) => {
    toggleSection(sectionId);
  };

  // Toggle menu visibility
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Backdrop for when menu is open */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
        open={isOpen}
        onClick={() => setIsOpen(false)}
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
            borderRadius: 2,
            bgcolor: "background.paper",
            zIndex: (theme) => theme.zIndex.drawer + 2,
            visibility: isOpen ? "visible" : "hidden",
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
              bgcolor: theme.palette.background.default,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          >
            <SettingsIcon
              sx={{
                color: theme.palette.secondary.main,
                mr: 1,
              }}
            />
            <Typography variant="subtitle1" fontWeight="medium">
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
              bgcolor: theme.palette.background.default,
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
                  borderRadius: 1,
                  cursor: "pointer",
                  bgcolor: isVisible(section.id)
                    ? alpha(theme.palette.secondary.main, 0.1)
                    : theme.palette.background.paper,
                  border: 1,
                  borderColor: isVisible(section.id)
                    ? theme.palette.secondary.main
                    : "divider",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: isVisible(section.id)
                      ? alpha(theme.palette.secondary.main, 0.15)
                      : theme.palette.action.hover,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isVisible(section.id)
                      ? theme.palette.secondary.main
                      : theme.palette.text.secondary,
                    mb: 0.5,
                  }}
                >
                  {section.icon}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: isVisible(section.id)
                      ? theme.palette.secondary.main
                      : theme.palette.text.secondary,
                    fontWeight: isVisible(section.id) ? "medium" : "normal",
                  }}
                >
                  {section.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* All Settings Option */}
          <Box
            onClick={showAllSections}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 1.5,
              m: 1.5,
              borderRadius: 1,
              cursor: "pointer",
              bgcolor: theme.palette.background.paper,
              border: 1,
              borderColor: "divider",
              "&:hover": {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <AllSettingsIcon sx={{ mr: 1 }} />
            <Typography variant="body2">All Settings</Typography>
          </Box>

          {/* Footer with count */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 1.5,
              bgcolor: theme.palette.background.default,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Enabled sections:
            </Typography>
            <Typography variant="caption" fontWeight="bold">
              {enabled} / {total}
            </Typography>
          </Box>
        </Paper>
      </Fade>

      {/* Floating Action Button */}
      <Fab
        color="secondary"
        aria-label="toggle sections"
        onClick={toggleMenu}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          bgcolor: isOpen
            ? theme.palette.error.main
            : theme.palette.secondary.main,
          "&:hover": {
            bgcolor: isOpen
              ? theme.palette.error.dark
              : theme.palette.secondary.dark,
          },
        }}
      >
        {isOpen ? <CloseIcon /> : <SettingsIcon />}
      </Fab>
    </>
  );
};

// Helper function to apply alpha to colors
function alpha(color: string, opacity: number): string {
  if (color.startsWith("#")) {
    // For hex colors
    return (
      color +
      Math.round(opacity * 255)
        .toString(16)
        .padStart(2, "0")
    );
  } else {
    // For MUI colors, use the alpha function from theme
    return `rgba(${hexToRgb(color)}, ${opacity})`;
  }
}

// Convert hex to rgb for alpha function
function hexToRgb(hex: string): string {
  // Remove the hash if it exists
  hex = hex.replace("#", "");

  // Parse the hex values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  return `${r}, ${g}, ${b}`;
}

export default SectionToggleMenu;
