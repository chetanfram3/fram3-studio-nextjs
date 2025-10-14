// src/components/Cr3ditSys/components/CreditBalance.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  alpha,
  CircularProgress,
  Fade,
  LinearProgress,
  Stack,
  Card,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  Refresh,
  Warning as AlertCircle,
  CheckCircle,
  TrendingDown,
} from "@mui/icons-material";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebase";
import CustomToast from "@/components/common/CustomToast";
import { API_BASE_URL } from "@/config/constants";
import DiamondIcon from "@/components/common/DiamondIcon";

interface CreditBalanceData {
  balance: {
    available: number;
    reserved: number;
    totalAvailable: number;
    lifetime: number;
    lastUpdated: string;
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
  status: {
    balanceLevel: "HEALTHY" | "LOW" | "CRITICAL" | "EMPTY";
    canMakeReservations: boolean;
    recommendedAction: "NONE" | "CONSIDER_ADDING_CREDITS" | "ADD_CREDITS";
    reservationStatus: string;
  };
  healthCheck?: {
    timestamp: string;
    openMeterSync: {
      isHealthy: boolean;
      lifetimeDiscrepancy: number;
      balanceDiscrepancy: number;
    };
    riskLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  };
}

interface CreditBalanceProps {
  className?: string;
  size?: "small" | "medium" | "large";
  variant?: "contained" | "outlined" | "minimal";
  showUSD?: boolean;
  showRecentUsage?: boolean;
  showHealthStatus?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  onBalanceUpdate?: (data: CreditBalanceData) => void;
  onError?: (error: string) => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const CreditBalance: React.FC<CreditBalanceProps> = ({
  className = "",
  size = "medium",
  variant = "contained",
  showUSD = true,
  showRecentUsage = false,
  showHealthStatus = false,
  autoRefresh = false,
  refreshInterval = 30,
  onBalanceUpdate,
  onError,
}) => {
  const { user } = useAuthStore();
  const theme = useTheme();
  const brand = getCurrentBrand();

  // State
  const [creditData, setCreditData] = useState<CreditBalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        void fetchCreditBalance(true);
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Initial load
  useEffect(() => {
    if (user?.uid) {
      void fetchCreditBalance();
    }
  }, [user?.uid]);

  const fetchCreditBalance = useCallback(
    async (isAutoRefresh = false) => {
      if (!user?.uid) {
        setError("User not authenticated");
        setHasError(true);
        return;
      }

      const refreshing = isAutoRefresh;
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setHasError(false);
      setError("");

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          throw new Error("No authentication token");
        }

        const response = await fetch(`${API_BASE_URL}/credits/balance`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch credit balance");
        }

        setCreditData(result.data);
        setLastUpdated(new Date().toLocaleTimeString());
        onBalanceUpdate?.(result.data);

        if (!refreshing) {
          CustomToast("success", "Credit balance updated");
        }
      } catch (err) {
        console.error("Error fetching credit balance:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch balance";
        setError(errorMessage);
        setHasError(true);
        onError?.(errorMessage);

        if (!refreshing) {
          CustomToast("error", `Failed to fetch balance: ${errorMessage}`);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.uid, onBalanceUpdate, onError]
  );

  const handleRefresh = useCallback(() => {
    void fetchCreditBalance();
  }, [fetchCreditBalance]);

  const getHealthColor = (
    riskLevel?: string
  ): "success" | "warning" | "error" | "info" => {
    switch (riskLevel) {
      case "HIGH":
        return "error";
      case "MEDIUM":
        return "warning";
      case "LOW":
        return "info";
      case "NONE":
        return "success";
      default:
        return "info";
    }
  };

  const getBalanceColor = (
    level: string
  ): "success" | "warning" | "error" | "primary" => {
    switch (level) {
      case "HEALTHY":
        return "success";
      case "LOW":
        return "warning";
      case "CRITICAL":
        return "error";
      case "EMPTY":
        return "error";
      default:
        return "primary";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          container: { p: 2, minHeight: 60 },
          avatar: { width: 32, height: 32 },
          mainText: "h6" as const,
          subText: "caption" as const,
          gap: 1.5,
          iconSize: 16,
        };
      case "large":
        return {
          container: { p: 4, minHeight: 140 },
          avatar: { width: 64, height: 64 },
          mainText: "h3" as const,
          subText: "body2" as const,
          gap: 3,
          iconSize: 28,
        };
      default:
        return {
          container: { p: 3, minHeight: 100 },
          avatar: { width: 48, height: 48 },
          mainText: "h4" as const,
          subText: "body2" as const,
          gap: 2,
          iconSize: 20,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  if (!user?.uid) {
    return null;
  }

  // Enhanced Loading State
  if (isLoading && !creditData) {
    return (
      <Card
        sx={{
          ...sizeStyles.container,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)"
              : "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
        className={className}
      >
        {/* Avatar with gradient */}
        <Box
          sx={{
            ...sizeStyles.avatar,
            borderRadius: `${brand.borderRadius * 0.33}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 2px 4px rgba(0, 0, 0, 0.3)"
                : "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          <CircularProgress
            size={sizeStyles.iconSize}
            thickness={4}
            sx={{ color: theme.palette.primary.contrastText }}
          />
        </Box>
        <Typography
          variant={sizeStyles.subText}
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          Loading credits...
        </Typography>
      </Card>
    );
  }

  // Enhanced Error State
  if (hasError || !creditData) {
    return (
      <Card
        sx={{
          ...sizeStyles.container,
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: `1px solid ${theme.palette.error.main}`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)"
              : "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
        className={className}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: sizeStyles.gap,
            flex: 1,
          }}
        >
          {/* Error avatar */}
          <Box
            sx={{
              ...sizeStyles.avatar,
              borderRadius: `${brand.borderRadius * 0.33}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
            }}
          >
            <AlertCircle
              sx={{
                fontSize: sizeStyles.iconSize,
                color: "white",
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant={sizeStyles.mainText}
              color="error.main"
              fontWeight="bold"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Error
            </Typography>
            <Typography
              variant={sizeStyles.subText}
              color="error.dark"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Failed to load balance
            </Typography>
          </Box>
          <Tooltip title="Retry fetching balance">
            <Box
              component="button"
              onClick={handleRefresh}
              disabled={isLoading}
              sx={{
                minWidth: size === "small" ? 32 : 40,
                height: size === "small" ? 32 : 40,
                borderRadius: `${brand.borderRadius * 0.33}px`,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: "transparent",
                color: theme.palette.text.primary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                "&:hover:not(:disabled)": {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                  transform: "translateY(-1px)",
                },
                "&:disabled": {
                  opacity: 0.6,
                  cursor: "not-allowed",
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={16} />
              ) : (
                <Refresh sx={{ fontSize: size === "small" ? 14 : 16 }} />
              )}
            </Box>
          </Tooltip>
        </Box>
      </Card>
    );
  }

  const balanceColor = getBalanceColor(creditData.status.balanceLevel);
  const healthColor = getHealthColor(creditData.healthCheck?.riskLevel);

  // Calculate usage percentage for progress bar
  const usagePercentage =
    creditData.balance.lifetime > 0
      ? ((creditData.balance.lifetime - creditData.balance.totalAvailable) /
          creditData.balance.lifetime) *
        100
      : 0;

  return (
    <Fade in={true} timeout={300}>
      <Card
        sx={{
          ...sizeStyles.container,
          position: "relative",
          overflow: "hidden",
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)"
              : "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
        className={className}
      >
        {/* Accent border using primary color */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            borderRadius: `${brand.borderRadius}px ${brand.borderRadius}px 0 0`,
          }}
        />

        <Box
          sx={{ display: "flex", alignItems: "center", gap: sizeStyles.gap }}
        >
          {/* Enhanced Credit Icon with animation */}
          <Box
            sx={{
              ...sizeStyles.avatar,
              borderRadius: `${brand.borderRadius * 0.33}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 2px 4px rgba(0, 0, 0, 0.3)"
                  : "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            <DiamondIcon
              animate={creditData.status.balanceLevel !== "HEALTHY"}
              size={sizeStyles.iconSize}
              sx={{ color: theme.palette.primary.contrastText }}
            />
          </Box>

          {/* Main Credit Display */}
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.5 }}
            >
              <Typography
                variant={sizeStyles.mainText}
                component="span"
                fontWeight="bold"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "monospace",
                  letterSpacing: "-0.025em",
                }}
              >
                {formatNumber(creditData.balance.totalAvailable)}
              </Typography>
              <Typography
                variant={sizeStyles.subText}
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                credits
              </Typography>
            </Box>

            {/* Enhanced Progress Bar for Large Size */}
            {size === "large" && creditData.balance.lifetime > 0 && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(usagePercentage, 100)}
                  sx={{
                    height: 8,
                    borderRadius: `${brand.borderRadius * 0.25}px`,
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    "& .MuiLinearProgress-bar": {
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.7)})`,
                      borderRadius: `${brand.borderRadius * 0.25}px`,
                    },
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    {Math.round(100 - usagePercentage)}% remaining
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    of {formatNumber(creditData.balance.lifetime)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Additional Info Row */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {/* USD Value */}
              {showUSD && creditData.currency.availableUSD > 0 && (
                <Chip
                  label={formatCurrency(creditData.currency.availableUSD)}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                    color: "success.main",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    fontFamily: brand.fonts.body,
                    borderRadius: `${brand.borderRadius * 0.33}px`,
                  }}
                />
              )}

              {/* Balance Level - Only show for medium and large sizes */}
              {size !== "small" && (
                <Chip
                  label={creditData.status.balanceLevel}
                  size="small"
                  color={balanceColor}
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    fontFamily: brand.fonts.body,
                    bgcolor: alpha(theme.palette[balanceColor].main, 0.1),
                    border: `1px solid ${alpha(theme.palette[balanceColor].main, 0.3)}`,
                    borderRadius: `${brand.borderRadius * 0.33}px`,
                  }}
                />
              )}

              {/* Recent Usage */}
              {showRecentUsage && creditData.recentUsage.last24Hours > 0 && (
                <Chip
                  icon={<TrendingDown sx={{ fontSize: 12 }} />}
                  label={`-${formatNumber(creditData.recentUsage.last24Hours)} today`}
                  size="small"
                  color="info"
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    fontFamily: brand.fonts.body,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                    borderRadius: `${brand.borderRadius * 0.33}px`,
                  }}
                />
              )}

              {/* Health Status - Only show for medium and large sizes */}
              {showHealthStatus &&
                creditData.healthCheck &&
                size !== "small" && (
                  <Chip
                    icon={
                      creditData.healthCheck.openMeterSync.isHealthy ? (
                        <CheckCircle sx={{ fontSize: 12 }} />
                      ) : (
                        <AlertCircle sx={{ fontSize: 12 }} />
                      )
                    }
                    label={creditData.healthCheck.riskLevel}
                    size="small"
                    color={healthColor}
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      fontFamily: brand.fonts.body,
                      bgcolor: alpha(theme.palette[healthColor].main, 0.1),
                      border: `1px solid ${alpha(theme.palette[healthColor].main, 0.3)}`,
                      borderRadius: `${brand.borderRadius * 0.33}px`,
                    }}
                  />
                )}
            </Stack>
          </Box>

          {/* Enhanced Refresh Button */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Tooltip
              title={`Refresh balance${lastUpdated ? ` (last: ${lastUpdated})` : ""}`}
            >
              <Box
                component="button"
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                sx={{
                  minWidth: size === "small" ? 32 : 40,
                  height: size === "small" ? 32 : 40,
                  borderRadius: `${brand.borderRadius * 0.33}px`,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: "transparent",
                  color: theme.palette.text.primary,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  "&:hover:not(:disabled)": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                    transform: "translateY(-1px)",
                  },
                  "&:disabled": {
                    opacity: 0.6,
                    cursor: "not-allowed",
                  },
                  // Add spin animation for autoRefresh
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              >
                {isLoading || isRefreshing ? (
                  <CircularProgress
                    size={size === "small" ? 14 : 16}
                    thickness={4}
                    sx={{ color: theme.palette.primary.main }}
                  />
                ) : (
                  <Refresh
                    sx={{
                      fontSize: size === "small" ? 14 : 16,
                      animation: autoRefresh
                        ? "spin 2s linear infinite"
                        : "none",
                    }}
                  />
                )}
              </Box>
            </Tooltip>

            {size === "large" && lastUpdated && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  textAlign: "center",
                  fontSize: "0.65rem",
                  fontFamily: brand.fonts.body,
                }}
              >
                {lastUpdated}
              </Typography>
            )}
          </Box>
        </Box>
      </Card>
    </Fade>
  );
};

export default CreditBalance;
