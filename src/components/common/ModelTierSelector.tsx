// ModelTierSelector.tsx

"use client";

import { useState } from "react";
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
  color: string;
  isRecommended?: boolean;
}

const modelTierOptions: ModelTierOption[] = [
  {
    value: MODEL_TIERS.BASIC,
    label: "Basic",
    description: "Standard quality, fast processing",
    icon: <BasicIcon size={16} />,
    color: "#9e9e9e",
  },
  {
    value: MODEL_TIERS.PRO,
    label: "Pro",
    description: "Enhanced quality and features",
    icon: <ProIcon size={16} />,
    color: "#2196f3",
  },
  {
    value: MODEL_TIERS.PREMIUM,
    label: "Premium",
    description: "High quality, advanced features",
    icon: <PremiumIcon size={16} />,
    color: "#ff9800",
  },
  {
    value: MODEL_TIERS.ULTRA,
    label: "Ultra",
    description: "Maximum quality, cutting-edge AI",
    icon: <UltraIcon size={16} />,
    color: "#9c27b0",
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
  const handleChange = (event: SelectChangeEvent<ModelTier>) => {
    onChange(event.target.value as ModelTier);
  };

  return (
    <Box sx={{ display: "inline-block", minWidth: compact ? 150 : 200 }}>
      {!compact && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: "block" }}
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
            borderRadius: 1,
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              border: 1,
              borderColor: "secondary.main",
            },
            "&:hover": {
              bgcolor: disabled ? "action.disabledBackground" : "action.hover",
            },
            "& .MuiSelect-select": {
              color: "text.primary",
              fontSize: "0.875rem",
              fontWeight: 500,
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
            const option = modelTierOptions.find(
              (opt) => opt.value === selected
            );
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
                      bgcolor: option.color,
                      color: "white",
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
                bgcolor: "background.paper",
                backdropFilter: "blur(20px)",
                border: 1,
                borderColor: "divider",
                "& .MuiMenuItem-root": {
                  color: "text.primary",
                  "&:hover": {
                    bgcolor: "secondary.main",
                    color: "secondary.contrastText",
                    "& .MuiTypography-root": {
                      color: "secondary.contrastText !important",
                    },
                    "& *": {
                      color: "secondary.contrastText !important",
                    },
                  },
                  "&.Mui-selected": {
                    bgcolor: "secondary.main",
                    color: "secondary.contrastText",
                    "& .MuiTypography-root": {
                      color: "secondary.contrastText !important",
                    },
                    "& *": {
                      color: "secondary.contrastText !important",
                    },
                    "&:hover": {
                      bgcolor: "secondary.dark",
                      color: "secondary.contrastText",
                    },
                  },
                },
              },
            },
          }}
        >
          {modelTierOptions.map((option) => (
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
                    <Typography variant="body2" fontWeight="medium">
                      {option.label}
                    </Typography>
                    {option.isRecommended && (
                      <Chip
                        label="Recommended"
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: "0.6rem",
                          bgcolor: option.color,
                          color: "white",
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
                        color: "inherit", // Inherit color from parent MenuItem
                        display: "block",
                        mt: 0.25,
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

  const resetToDefault = () => {
    setModelTier(defaultTier);
  };

  const getSelectedOption = () => {
    return modelTierOptions.find((option) => option.value === modelTier);
  };

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
