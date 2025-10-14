"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Button,
  Box,
  CircularProgress,
  Tooltip,
  Typography,
  Slider,
  Chip,
  Collapse,
  IconButton,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { ChevronDown } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

// ==========================================
// TYPE DEFINITIONS
// ==========================================
export type GenerationMode = "fast" | "moderate" | "detailed";

interface GenerationModeConfig {
  value: GenerationMode;
  label: string;
  description: string;
}

interface GenerateButtonProps {
  isLoading: boolean;
  onClick?: (mode: GenerationMode) => void;
  fullWidth?: boolean;
}

// ==========================================
// CONSTANTS
// ==========================================
const GENERATION_MODES: Record<number, GenerationModeConfig> = {
  0: {
    value: "fast",
    label: "Fast",
    description: "Quicker generation with basic details",
  },
  1: {
    value: "moderate",
    label: "Moderate",
    description: "Balanced speed and quality",
  },
  2: {
    value: "detailed",
    label: "Detailed",
    description: "Higher quality with more extensive details",
  },
};

/**
 * GenerateButton - Script generation button with mode selector
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
 * - Follows MUI v7 patterns
 * - Added AutoAwesome icon for visual enhancement
 */
export default function GenerateButton({
  isLoading,
  onClick,
  fullWidth = true,
}: GenerateButtonProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE
  // ==========================================
  const [expanded, setExpanded] = useState(false);
  const [sliderValue, setSliderValue] = useState<number>(1); // Default to moderate

  // ==========================================
  // COMPUTED VALUES (Memoized for performance)
  // ==========================================
  const currentMode = useMemo(
    () => GENERATION_MODES[sliderValue].value,
    [sliderValue]
  );

  // ==========================================
  // EVENT HANDLERS (useCallback for stability)
  // ==========================================
  const handleButtonClick = useCallback(() => {
    if (onClick) {
      onClick(currentMode);
    }
  }, [onClick, currentMode]);

  const handleSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      const numericValue = Array.isArray(newValue) ? newValue[0] : newValue;
      setSliderValue(numericValue);
    },
    []
  );

  const toggleAccordion = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  }, []);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: fullWidth ? "100%" : "auto",
        my: 2,
      }}
    >
      {/* Mode Selector Accordion */}
      <Box
        sx={{
          width: "100%",
          mb: 2,
          border: 1,
          borderColor: "divider",
          borderRadius: `${brand.borderRadius}px`,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          overflow: "hidden",
        }}
      >
        {/* Accordion Header */}
        <Box
          onClick={toggleAccordion}
          sx={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 1.5,
            borderBottom: expanded ? 1 : 0,
            borderBottomColor: "divider",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body2"
              fontWeight="medium"
              sx={{
                color: "text.primary",
                fontFamily: brand.fonts.body,
              }}
            >
              Generation Mode
            </Typography>
            <Chip
              label={GENERATION_MODES[sliderValue].label}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                color: "primary.main",
                fontSize: "0.8rem",
                height: 20,
                fontWeight: 500,
                fontFamily: brand.fonts.body,
              }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip
              title="Select generation quality. More detailed modes may take longer to generate."
              placement="top"
              arrow
            >
              <InfoOutlinedIcon
                fontSize="small"
                sx={{
                  color: "text.secondary",
                  cursor: "help",
                  mr: 1,
                  fontSize: 16,
                }}
              />
            </Tooltip>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
              sx={{
                color: "text.secondary",
                "&:hover": {
                  color: "primary.main",
                },
              }}
            >
              <ChevronDown
                size={18}
                style={{
                  transition: "transform 0.2s ease",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </IconButton>
          </Box>
        </Box>

        {/* Collapsible Content */}
        <Collapse in={expanded}>
          <Box sx={{ px: 2, py: 2 }}>
            {/* Mode labels for slider */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 0.5,
                px: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                }}
              >
                Fast
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                }}
              >
                Detailed
              </Typography>
            </Box>

            {/* Enhanced Slider */}
            <Slider
              value={sliderValue}
              onChange={handleSliderChange}
              step={null}
              min={0}
              max={2}
              marks={[
                { value: 0, label: "" },
                { value: 1, label: "" },
                { value: 2, label: "" },
              ]}
              sx={{
                color: "primary.main",
                height: 8,
                "& .MuiSlider-track": {
                  border: "none",
                  height: 8,
                },
                "& .MuiSlider-rail": {
                  height: 8,
                  opacity: 0.5,
                  backgroundColor: alpha(theme.palette.divider, 0.5),
                },
                "& .MuiSlider-thumb": {
                  height: 18,
                  width: 18,
                  border: `2px solid ${theme.palette.primary.contrastText}`,
                  backgroundColor: "primary.main",
                  "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
                    boxShadow: "inherit",
                  },
                },
                "& .MuiSlider-mark": {
                  backgroundColor: "primary.main",
                  height: 8,
                  width: 8,
                  borderRadius: "50%",
                  marginTop: 0,
                },
              }}
            />

            {/* Mode Description */}
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1,
                color: "text.secondary",
                fontFamily: brand.fonts.body,
              }}
            >
              {GENERATION_MODES[sliderValue].description}
            </Typography>
          </Box>
        </Collapse>
      </Box>

      {/* Generate Button */}
      <Button
        fullWidth={fullWidth}
        variant="contained"
        color="primary"
        disabled={isLoading}
        onClick={handleButtonClick}
        sx={{
          py: 1.5,
          fontWeight: 600,
          fontFamily: brand.fonts.body,
          "&:hover": {
            bgcolor: "primary.dark",
          },
          "&.Mui-disabled": {
            bgcolor: alpha(theme.palette.primary.main, 0.3),
            color: alpha(
              theme.palette.primary.contrastText,
              theme.palette.mode === "dark" ? 0.5 : 0.7
            ),
          },
          borderRadius: `${brand.borderRadius}px`,
          textTransform: "none",
          fontSize: "1rem",
          minWidth: "200px",
        }}
        startIcon={
          isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <AutoAwesomeIcon />
          )
        }
      >
        {isLoading ? "Generating..." : "Generate"}
      </Button>
    </Box>
  );
}

GenerateButton.displayName = "GenerateButton";
