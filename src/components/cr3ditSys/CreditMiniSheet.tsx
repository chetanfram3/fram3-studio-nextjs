// src/components/Cr3ditSys/components/CreditMiniSheet.tsx
"use client";

import React from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Checkbox,
  FormControlLabel,
  Fade,
  Divider,
  Chip,
  Stack,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  Add as Plus,
  TrendingDown as BarChart,
  VideoLibrary as Film,
  Schedule as Clock,
} from "@mui/icons-material";
import DiamondIcon from "@/components/common/DiamondIcon";

interface CreditUsage {
  action: string;
  credits: number;
  time: string;
  icon: React.ComponentType<{ sx?: object }>;
}

interface CreditMiniSheetProps {
  credits: number;
  maxCredits: number;
  onAddCredits: () => void;
  className?: string;
  recentUsage?: CreditUsage[];
  autoRecharge?: boolean;
  onAutoRechargeToggle?: (enabled: boolean) => void;
}

const defaultRecentUsage: CreditUsage[] = [
  { action: "Image generation", credits: -15, time: "2 min ago", icon: Film },
  { action: "Text analysis", credits: -5, time: "1 hour ago", icon: BarChart },
  {
    action: "Video processing",
    credits: -25,
    time: "3 hours ago",
    icon: Clock,
  },
];

export const CreditMiniSheet: React.FC<CreditMiniSheetProps> = ({
  credits,
  maxCredits,
  onAddCredits,
  className,
  recentUsage = defaultRecentUsage,
  autoRecharge = false,
  onAutoRechargeToggle,
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const percentage = (credits / maxCredits) * 100;

  const getCreditStateColor = () => {
    if (percentage >= 50) return theme.palette.success.main;
    if (percentage >= 25) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getCreditStateLabel = () => {
    if (percentage >= 50) return "Healthy";
    if (percentage >= 25) return "Low";
    return "Critical";
  };

  return (
    <Fade in timeout={300}>
      <Box
        className={className}
        sx={{
          width: 360,
          p: 3,
          position: "relative",
          overflow: "hidden",
          // Use theme colors instead of hardcoded values
          bgcolor: "background.paper",
          backdropFilter: "blur(20px)",
          borderRadius: `${brand.borderRadius}px`,
          // Use theme primary color for border
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          // Modern shadow using theme
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 8px 32px rgba(0, 0, 0, 0.6)"
              : "0 8px 32px rgba(0, 0, 0, 0.1)",
          // Accent border using primary color
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            borderRadius: `${brand.borderRadius}px ${brand.borderRadius}px 0 0`,
          },
        }}
      >
        {/* Header with Diamond Icon */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            pb: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            mb: 3,
          }}
        >
          {/* Avatar with gradient using theme colors */}
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: `${brand.borderRadius * 0.33}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 2px 4px rgba(0, 0, 0, 0.3)"
                  : "0 2px 4px rgba(0, 0, 0, 0.1)",
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 4px 6px rgba(0, 0, 0, 0.4)"
                    : "0 4px 6px rgba(0, 0, 0, 0.15)",
              },
            }}
          >
            <DiamondIcon
              animate
              size={18}
              sx={{ color: theme.palette.primary.contrastText }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Credit Balance
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Current usage overview
            </Typography>
          </Box>
          <Chip
            label={getCreditStateLabel()}
            color={
              percentage >= 50
                ? "success"
                : percentage >= 25
                  ? "warning"
                  : "error"
            }
            variant="outlined"
            size="small"
            sx={{
              fontWeight: 600,
              borderRadius: `${brand.borderRadius * 0.5}px`,
              fontFamily: brand.fonts.body,
            }}
          />
        </Box>

        {/* Progress Section */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Credits
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontFamily: "monospace" }}
            >
              {credits.toLocaleString()} / {maxCredits.toLocaleString()} (
              {Math.round(percentage)}%)
            </Typography>
          </Box>

          <Box
            sx={{
              p: 0.5,
              borderRadius: `${brand.borderRadius * 0.5}px`,
              bgcolor: alpha(theme.palette.background.paper, 0.3),
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 8,
                borderRadius: `${brand.borderRadius * 0.25}px`,
                bgcolor: "transparent",
                "& .MuiLinearProgress-bar": {
                  background: `linear-gradient(90deg, ${getCreditStateColor()}, ${alpha(getCreditStateColor(), 0.7)})`,
                  borderRadius: `${brand.borderRadius * 0.25}px`,
                },
              }}
            />
          </Box>
        </Box>

        {/* Recent Usage */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 16,
                background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.main, 0.7)} 100%)`,
                borderRadius: `${brand.borderRadius * 0.5}px`,
              }}
            />
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Recent Usage
            </Typography>
          </Box>

          <Stack spacing={1}>
            {recentUsage.map((usage, index) => {
              const IconComponent = usage.icon;
              return (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.5,
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                    bgcolor: alpha(theme.palette.background.paper, 0.3),
                    border: `1px solid ${theme.palette.divider}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                      transform: "translateX(4px)",
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {/* Icon avatar */}
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: `${brand.borderRadius * 0.33}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
                      }}
                    >
                      <IconComponent sx={{ fontSize: 12, color: "white" }} />
                    </Box>
                    <Typography
                      variant="caption"
                      fontWeight="medium"
                      color="text.primary"
                      sx={{ fontFamily: brand.fonts.body }}
                    >
                      {usage.action}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      textAlign: "right",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      sx={{
                        color: theme.palette.error.main,
                        fontFamily: "monospace",
                      }}
                    >
                      {usage.credits}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: brand.fonts.body }}
                    >
                      {usage.time}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Divider sx={{ mb: 3, opacity: 0.5 }} />

        {/* Actions */}
        <Stack spacing={2}>
          <Button
            onClick={onAddCredits}
            variant="contained"
            color="primary"
            startIcon={<Plus />}
            fullWidth
            sx={{
              fontWeight: 700,
              py: 1.5,
              borderRadius: `${brand.borderRadius * 0.5}px`,
              textTransform: "none",
              fontFamily: brand.fonts.heading,
              // Use theme primary color with shadow
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
              transition: "all 0.3s ease",
            }}
          >
            Add More Credits
          </Button>

          {onAutoRechargeToggle && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={autoRecharge}
                  onChange={(e) => onAutoRechargeToggle(e.target.checked)}
                  sx={{
                    // Use primary color for checkbox
                    color: theme.palette.primary.main,
                    "&.Mui-checked": {
                      color: theme.palette.primary.main,
                    },
                    "& .MuiSvgIcon-root": {
                      borderRadius: `${brand.borderRadius * 0.25}px`,
                    },
                  }}
                />
              }
              label={
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Auto-recharge when &lt; 5%
                </Typography>
              }
              sx={{
                mx: 0,
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.75rem",
                },
              }}
            />
          )}
        </Stack>

        {/* Usage Statistics */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack direction="row" spacing={3} justifyContent="center">
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="warning.main"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                {recentUsage.reduce(
                  (sum, usage) => sum + Math.abs(usage.credits),
                  0
                )}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Used Today
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="success.main"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                {Math.round((credits / maxCredits) * 100)}%
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Remaining
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="info.main"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                {Math.ceil(credits / 47)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Days Left*
              </Typography>
            </Box>
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 1,
              fontStyle: "italic",
              fontFamily: brand.fonts.body,
            }}
          >
            *Based on average daily usage of 47 credits
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
};

export default CreditMiniSheet;
