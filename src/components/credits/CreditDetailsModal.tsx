// src/components/payments/CreditDetailsModal.tsx
"use client";

import {
  Box,
  Card,
  Typography,
  Button,
  LinearProgress,
  alpha,
  useTheme,
  Fade,
  Checkbox,
  FormControlLabel,
  Stack,
} from "@mui/material";
import {
  BarChart as BarChartIcon,
  Movie as FilmIcon,
  Add as PlusIcon,
  Description as FileTextIcon,
  AudioFile as AudioLinesIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import DiamondIcon from "@/components/common/DiamondIcon";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface CreditDetailsModalProps {
  creditData: {
    balance: {
      available: number;
      reserved: number;
      totalAvailable: number;
      lifetime: number;
      lastRechargeAmount?: number;
    };
    recentUsage: {
      last24Hours: number;
      breakdown: {
        llm: number;
        api: number;
      };
    };
    currency: {
      availableUSD: number;
      creditsPerDollar: number;
      lifetimeUSD?: number;
    };
    recentActivity?: Array<{
      activity: string;
      timestamp: string;
      details: {
        credits: number;
        status: string;
      };
    }>;
    status: {
      balanceLevel: "HEALTHY" | "LOW" | "CRITICAL" | "EMPTY";
      canMakeReservations: boolean;
      recommendedAction: "NONE" | "CONSIDER_ADDING_CREDITS" | "ADD_CREDITS";
    };
    healthCheck?: {
      riskLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH";
      openMeterSync: {
        isHealthy: boolean;
      };
    };
  };
  onAddCredits?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface UsageItem {
  action: string;
  credits: number;
  time: string;
  icon: React.ComponentType<{ sx?: Record<string, unknown> }>;
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor(
    (now.getTime() - time.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
};

// Service type to icon mapping
const getServiceIcon = (
  activity: string
): React.ComponentType<{ sx?: Record<string, unknown> }> => {
  const activityLower = activity.toLowerCase();

  if (activityLower.includes("image")) {
    return FilmIcon;
  }

  if (activityLower.includes("video")) {
    return FileTextIcon;
  }

  if (activityLower.includes("audio") || activityLower.includes("tts")) {
    return AudioLinesIcon;
  }

  if (activityLower.includes("analysis") || activityLower.includes("ai")) {
    return BarChartIcon;
  }

  if (activityLower.includes("script") || activityLower.includes("document")) {
    return AssessmentIcon;
  }

  return BarChartIcon;
};

// Service type display name
const getServiceType = (activity: string): string => {
  const activityLower = activity.toLowerCase();

  if (activityLower.includes("image generation")) {
    return "Image Generation";
  }

  if (
    activityLower.includes("image") &&
    (activityLower.includes("edit") || activityLower.includes("editing"))
  ) {
    return "Image Edit";
  }

  if (activityLower.includes("video")) {
    return "Video Processing";
  }

  if (activityLower.includes("audio")) {
    return "Audio Processing";
  }

  if (
    activityLower.includes("ai analysis") ||
    activityLower.includes("analysis")
  ) {
    return "AI Analysis";
  }

  if (activityLower.includes("script")) {
    return "Script Generation";
  }

  if (activityLower.includes("document")) {
    return "Document Analysis";
  }

  if (activityLower.includes("ai") && activityLower.includes("completed")) {
    return "AI Analysis";
  }

  if (activityLower.includes("image") && activityLower.includes("completed")) {
    return "Image Generation";
  }

  return "Text Analysis";
};

// ===========================
// MAIN COMPONENT
// ===========================

export default function CreditDetailsModal({
  creditData,
  onAddCredits,
}: CreditDetailsModalProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const maxCredits =
    creditData.balance.lastRechargeAmount || creditData.balance.lifetime;
  const credits = creditData.balance.totalAvailable;
  const percentage = maxCredits > 0 ? (credits / maxCredits) * 100 : 0;

  // Create recent usage array from API data, fallback to mock data if needed
  const recentUsage: UsageItem[] = creditData.recentActivity
    ? creditData.recentActivity.slice(0, 3).map((activity) => ({
        action: getServiceType(activity.activity),
        credits: -activity.details.credits,
        time: formatTimeAgo(activity.timestamp),
        icon: getServiceIcon(activity.activity),
      }))
    : [
        {
          action: "AI Analysis",
          credits:
            -Math.floor(creditData.recentUsage.breakdown.llm * 0.6) || -5,
          time: "1 hour ago",
          icon: BarChartIcon,
        },
        {
          action: "Image Generation",
          credits:
            -Math.floor(creditData.recentUsage.breakdown.api * 0.8) || -15,
          time: "2 hours ago",
          icon: FilmIcon,
        },
        {
          action: "Audio Processing",
          credits: -Math.floor(creditData.recentUsage.last24Hours * 0.1) || -25,
          time: "3 hours ago",
          icon: AudioLinesIcon,
        },
      ];

  const handleAddCredits = () => {
    onAddCredits?.();
  };

  return (
    <Fade in={true} timeout={300}>
      <Card
        sx={{
          width: 360,
          p: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: `${brand.borderRadius * 2}px`,
          boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.15)}`,
          background:
            theme.palette.mode === "dark"
              ? theme.palette.background.paper
              : "#ffffff",
          backdropFilter: "blur(10px)",
          animation: "slideInFromTop 0.3s ease-out",
          "@keyframes slideInFromTop": {
            "0%": {
              opacity: 0,
              transform: "translateY(-8px)",
            },
            "100%": {
              opacity: 1,
              transform: "translateY(0)",
            },
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Header with Diamond Icon */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              pb: 1,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: `${brand.borderRadius}px`,
                background: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <DiamondIcon
                size={14}
                style={{ color: theme.palette.primary.main }}
              />
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight="600"
                sx={{ lineHeight: 1.2, fontFamily: brand.fonts.heading }}
              >
                Credit Balance
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.75rem" }}
              >
                Current usage overview
              </Typography>
            </Box>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.875rem" }}
              >
                Credits
              </Typography>
              <Typography
                variant="body2"
                fontWeight="600"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  letterSpacing: "0.025em",
                }}
              >
                {formatNumber(credits)} / {formatNumber(maxCredits)} (
                {Math.round(percentage)}%)
              </Typography>
            </Box>
            <Box
              sx={{
                p: 0.5,
                borderRadius: `${brand.borderRadius * 2}px`,
                background: alpha(theme.palette.grey[400], 0.2),
                border: `1px solid ${alpha(theme.palette.grey[400], 0.3)}`,
              }}
            >
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 8,
                  borderRadius: `${brand.borderRadius * 1.5}px`,
                  backgroundColor: "transparent",
                  "& .MuiLinearProgress-bar": {
                    background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                    borderRadius: `${brand.borderRadius * 1.5}px`,
                  },
                }}
              />
            </Box>
          </Box>

          {/* Recent Usage */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography
              variant="subtitle2"
              fontWeight="500"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: "0.875rem",
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 16,
                  background: `linear-gradient(to bottom, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                  borderRadius: 2,
                }}
              />
              Recent Usage
            </Typography>
            <Stack spacing={1}>
              {recentUsage.map((usage, index) => {
                const IconComponent = usage.icon;
                return (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1.5,
                      borderRadius: `${brand.borderRadius * 2}px`,
                      border: `1px solid ${theme.palette.divider}`,
                      background:
                        theme.palette.mode === "dark"
                          ? alpha(theme.palette.grey[800], 0.5)
                          : alpha(theme.palette.grey[50], 0.8),
                      transition: "all 0.2s ease",
                      "&:hover": {
                        background:
                          theme.palette.mode === "dark"
                            ? alpha(theme.palette.grey[700], 0.6)
                            : alpha(theme.palette.grey[100], 0.9),
                      },
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: `${brand.borderRadius}px`,
                          background: alpha(theme.palette.info.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        }}
                      >
                        <IconComponent
                          sx={{ fontSize: 14, color: "info.main" }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight="500"
                        sx={{ fontSize: "0.75rem" }}
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
                        variant="body2"
                        fontWeight="600"
                        color="error.main"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.75rem",
                          letterSpacing: "0.025em",
                        }}
                      >
                        {usage.credits}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        {usage.time}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* Actions */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              pt: 1,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              onClick={handleAddCredits}
              variant="contained"
              fullWidth
              startIcon={<PlusIcon />}
              sx={{
                height: 48,
                fontSize: "1rem",
                fontWeight: 600,
                borderRadius: `${brand.borderRadius * 2}px`,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: theme.palette.primary.contrastText,
                textTransform: "none",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                    : `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  transform: "translateY(-1px)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`
                      : `0 6px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
                },
                "&:active": {
                  transform: "translateY(0)",
                },
              }}
            >
              Add More Credits
            </Button>

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  sx={{
                    "&.Mui-checked": {
                      color: "primary.main",
                    },
                    "& .MuiSvgIcon-root": {
                      borderRadius: "4px",
                    },
                  }}
                />
              }
              label={
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.75rem" }}
                >
                  Auto-recharge when &lt; 5%
                </Typography>
              }
              sx={{
                margin: 0,
                "& .MuiFormControlLabel-label": {
                  cursor: "pointer",
                },
              }}
            />
          </Box>
        </Box>
      </Card>
    </Fade>
  );
}
