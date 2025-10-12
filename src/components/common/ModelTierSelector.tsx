// ModelTierSelector.tsx - Fully theme-compliant with light/dark mode support

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Chip,
  SelectChangeEvent,
} from "@mui/material";
import {
  Diamond as UltraIcon,
  Star as PremiumIcon,
  Circle as ProIcon,
  Zap as BasicIcon,
} from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

// Model tier enum (matches your backend)
export const MODEL_TIERS = {
  BASIC: 1,
  PRO: 2,
  PREMIUM: 3,
  ULTRA: 4,
} as const;

export type ModelTier = (typeof MODEL_TIERS)[keyof typeof MODEL_TIERS];

interface ModelTierOption {
  value: ModelTier;
  label: string;
  description: string;
  icon: React.ReactNode;
  colorLight: string; // Color for light mode
  colorDark: string; // Color for dark mode
  isRecommended?: boolean;
}

// Theme-aware color definitions
const modelTierOptions: ModelTierOption[] = [
  {
    value: MODEL_TIERS.BASIC,
    label: "Basic",
    description: "Standard quality, fast processing",
    icon: <BasicIcon size={16} />,
    colorLight: "#78909c", // Pastel blue-grey
    colorDark: "#9e9e9e", // Original grey
  },
  {
    value: MODEL_TIERS.PRO,
    label: "Pro",
    description: "Enhanced quality and features",
    icon: <ProIcon size={16} />,
    colorLight: "#64b5f6", // Pastel blue
    colorDark: "#2196f3", // Original blue
  },
  {
    value: MODEL_TIERS.PREMIUM,
    label: "Premium",
    description: "High quality, advanced features",
    icon: <PremiumIcon size={16} />,
    colorLight: "#ffb74d", // Pastel orange
    colorDark: "#ff9800", // Original orange
  },
  {
    value: MODEL_TIERS.ULTRA,
    label: "Ultra",
    description: "Maximum quality, cutting-edge AI",
    icon: <UltraIcon size={16} />,
    colorLight: "#ba68c8", // Pastel purple
    colorDark: "#9c27b0", // Original purple
    isRecommended: true,
  },
];

interface ModelTierSelectorProps {
  value: ModelTier;
  onChange: (tier: ModelTier) => void;
  disabled?: boolean;
  showDescription?: boolean;
  compact?: boolean;
}

export function ModelTierSelector({
  value,
  onChange,
  disabled = false,
  showDescription = true,
  compact = false,
}: ModelTierSelectorProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const isDarkMode = theme.palette.mode === "dark";

  // Get theme-aware color for an option
  const getOptionColor = useCallback(
    (option: ModelTierOption) => {
      return isDarkMode ? option.colorDark : option.colorLight;
    },
    [isDarkMode]
  );

  // Memoize options with theme-aware colors
  const themedOptions = useMemo(
    () =>
      modelTierOptions.map((option) => ({
        ...option,
        color: getOptionColor(option),
      })),
    [getOptionColor]
  );

  const handleChange = useCallback(
    (event: SelectChangeEvent<ModelTier>) => {
      onChange(event.target.value as ModelTier);
    },
    [onChange]
  );

  // Memoize selected option
  const selectedOption = useMemo(
    () => themedOptions.find((opt) => opt.value === value),
    [themedOptions, value]
  );

  return (
    <Box sx={{ display: "inline-block", minWidth: compact ? 150 : 200 }}>
      {!compact && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: "block", fontFamily: brand.fonts.body }}
        >
          AI Model Quality
        </Typography>
      )}

      <FormControl size="small" sx={{ minWidth: compact ? 150 : 200 }}>
        <Select
          value={value}
          onChange={handleChange}
          disabled={disabled}
          displayEmpty
          sx={{
            backdropFilter: "blur(10px)",
            border: 1,
            borderColor: "divider",
            borderRadius: `${brand.borderRadius}px`,
            fontFamily: brand.fonts.body,
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              border: 1,
              borderColor: "primary.main",
            },
            "&:hover": {
              bgcolor: disabled ? "action.disabledBackground" : "action.hover",
            },
            "& .MuiSelect-select": {
              color: "text.primary",
              fontSize: "0.875rem",
              fontWeight: 500,
              fontFamily: brand.fonts.body,
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 1,
            },
            "& .MuiSelect-icon": {
              color: "text.secondary",
            },
          }}
          renderValue={(selected) => {
            const option = themedOptions.find((opt) => opt.value === selected);
            if (!option) return null;

            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    color: option.color,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {option.icon}
                </Box>
                <Typography
                  variant="body2"
                  color="text.primary"
                  fontWeight="medium"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {option.label}
                </Typography>
                {option.isRecommended && (
                  <Chip
                    label="Recommended"
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: "0.6rem",
                      fontFamily: brand.fonts.body,
                      bgcolor: option.color,
                      color: theme.palette.getContrastText(option.color),
                      "& .MuiChip-label": {
                        px: 0.5,
                      },
                    }}
                  />
                )}
              </Box>
            );
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: theme.palette.background.paper,
                backgroundImage: "none !important",
                backdropFilter: "blur(20px)",
                border: 1,
                borderColor: "divider",
                borderRadius: `${brand.borderRadius}px`,
                boxShadow: theme.shadows[8],
                "& .MuiMenuItem-root": {
                  color: "text.primary",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    bgcolor: "primary.main",
                    color: theme.palette.getContrastText(
                      theme.palette.primary.main
                    ),
                    "& .MuiTypography-root": {
                      color: `${theme.palette.getContrastText(
                        theme.palette.primary.main
                      )} !important`,
                    },
                    "& *": {
                      color: `${theme.palette.getContrastText(
                        theme.palette.primary.main
                      )} !important`,
                    },
                  },
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: theme.palette.getContrastText(
                      theme.palette.primary.main
                    ),
                    "& .MuiTypography-root": {
                      color: `${theme.palette.getContrastText(
                        theme.palette.primary.main
                      )} !important`,
                    },
                    "& *": {
                      color: `${theme.palette.getContrastText(
                        theme.palette.primary.main
                      )} !important`,
                    },
                    "&:hover": {
                      bgcolor: "primary.dark",
                      color: theme.palette.getContrastText(
                        theme.palette.primary.dark
                      ),
                    },
                  },
                },
              },
            },
          }}
        >
          {themedOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    color: option.color,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {option.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{ fontFamily: brand.fonts.body }}
                    >
                      {option.label}
                    </Typography>
                    {option.isRecommended && (
                      <Chip
                        label="Recommended"
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: "0.6rem",
                          fontFamily: brand.fonts.body,
                          bgcolor: option.color,
                          color: theme.palette.getContrastText(option.color),
                          "& .MuiChip-label": {
                            px: 0.5,
                          },
                        }}
                      />
                    )}
                  </Box>
                  {showDescription && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "inherit",
                        display: "block",
                        mt: 0.25,
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      {option.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

// Hook for managing model tier state
export function useModelTier(defaultTier: ModelTier = MODEL_TIERS.ULTRA) {
  const [modelTier, setModelTier] = useState<ModelTier>(defaultTier);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const resetToDefault = useCallback(() => {
    setModelTier(defaultTier);
  }, [defaultTier]);

  const getSelectedOption = useCallback(() => {
    const option = modelTierOptions.find((opt) => opt.value === modelTier);
    if (!option) return undefined;

    return {
      ...option,
      color: isDarkMode ? option.colorDark : option.colorLight,
    };
  }, [modelTier, isDarkMode]);

  return {
    modelTier,
    setModelTier,
    resetToDefault,
    getSelectedOption,
    isUltra: modelTier === MODEL_TIERS.ULTRA,
    isPremium: modelTier === MODEL_TIERS.PREMIUM,
    isPro: modelTier === MODEL_TIERS.PRO,
    isBasic: modelTier === MODEL_TIERS.BASIC,
  };
}
