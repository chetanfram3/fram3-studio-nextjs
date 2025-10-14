"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Box, Typography, Button, Popover } from "@mui/material";
import { KeyboardArrowDown as ChevronDownIcon } from "@mui/icons-material";
import { UseFormReturn } from "react-hook-form";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import type { FormValues } from "../types";
import { demographicData } from "../data/demographicData";

// ==========================================
// TYPE DEFINITIONS
// ==========================================
interface GenderIdentityPickerProps {
  form: UseFormReturn<FormValues>;
}

/**
 * GenderIdentityPicker - Multiple gender identity selection component
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
 */
export default function GenderIdentityPicker({
  form,
}: GenderIdentityPickerProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE
  // ==========================================
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // ==========================================
  // COMPUTED VALUES (Memoized for performance)
  // ==========================================
  const isOpen = useMemo(() => Boolean(anchorEl), [anchorEl]);

  const audience = form.watch("audienceDetails") || {};
  const selectedGenders = audience.demographics?.identity || [];

  const selectedGendersArray = useMemo(() => {
    return Array.isArray(selectedGenders)
      ? selectedGenders
      : selectedGenders
        ? [selectedGenders]
        : [];
  }, [selectedGenders]);

  const selectedLabels = useMemo(() => {
    if (selectedGendersArray.length === 0) return "Select Gender";

    if (selectedGendersArray.length === 1) {
      const option = demographicData.genderOptions.find(
        (opt) => opt.id === selectedGendersArray[0]
      );
      return option ? option.label : "Select Gender";
    }

    return `${selectedGendersArray.length} Identities Selected`;
  }, [selectedGendersArray]);

  // ==========================================
  // EVENT HANDLERS (useCallback for stability)
  // ==========================================
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    },
    []
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleToggleGender = useCallback(
    (genderId: string) => {
      if (selectedGendersArray.includes(genderId)) {
        form.setValue(
          "audienceDetails.demographics.identity",
          selectedGendersArray.filter((id) => id !== genderId),
          { shouldDirty: true }
        );
      } else {
        form.setValue(
          "audienceDetails.demographics.identity",
          [...selectedGendersArray, genderId],
          { shouldDirty: true }
        );
      }
    },
    [selectedGendersArray, form]
  );

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mb: 0.5,
          fontWeight: 500,
          color: "text.secondary",
          fontFamily: brand.fonts.body,
        }}
      >
        Gender Identity (Multiple)
      </Typography>

      <Button
        fullWidth
        variant="outlined"
        endIcon={<ChevronDownIcon />}
        onClick={handleClick}
        sx={{
          justifyContent: "space-between",
          textTransform: "none",
          py: 0.75,
          bgcolor: "background.paper",
          borderColor: "divider",
          color: "text.primary",
          textAlign: "left",
          fontFamily: brand.fonts.body,
          "&:hover": {
            borderColor: "primary.main",
            bgcolor: "action.hover",
          },
        }}
      >
        {selectedLabels}
      </Button>

      <Popover
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            width: anchorEl?.offsetWidth,
            backgroundColor: "background.default",
            p: 1.5,
            boxShadow: theme.shadows[8],
            border: 1,
            borderColor: alpha(theme.palette.divider, 0.3),
            borderRadius: `${brand.borderRadius}px`,
            mt: 0.5,
          },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1,
            width: "100%",
          }}
        >
          {demographicData.genderOptions.map((option) => {
            const isSelected = selectedGendersArray.includes(option.id);

            return (
              <Box
                key={option.id}
                onClick={() => handleToggleGender(option.id)}
                sx={{
                  p: 1.2,
                  borderRadius: `${brand.borderRadius / 2}px`,
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: isSelected
                    ? alpha(theme.palette.primary.main, 0.2)
                    : "background.paper",
                  color: isSelected ? "primary.main" : "text.primary",
                  fontWeight: isSelected ? 500 : 400,
                  fontFamily: brand.fonts.body,
                  border: 1,
                  borderColor: isSelected
                    ? alpha(theme.palette.primary.dark, 0.3)
                    : alpha(theme.palette.divider, 0.3),
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: isSelected
                      ? "primary.main"
                      : "action.hover",
                    color: isSelected ? "primary.contrastText" : "text.primary",
                  },
                  fontSize: "0.85rem",
                }}
              >
                {option.label}
              </Box>
            );
          })}
        </Box>
      </Popover>
    </Box>
  );
}

GenderIdentityPicker.displayName = "GenderIdentityPicker";
