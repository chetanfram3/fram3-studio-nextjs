// src/components/credits/CreditBalance.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  alpha,
  useTheme,
  CircularProgress,
  Fade,
  styled,
  Avatar,
  LinearProgress,
  Popper,
  ClickAwayListener,
} from "@mui/material";
import {
  Refresh,
  ErrorOutline,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material";
import { Coins } from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";
import DiamondIcon from "@/components/common/DiamondIcon";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebase";
import CustomToast from "@/components/common/CustomToast";
import { API_BASE_URL } from "@/config/constants";
import CreditDetailsModal from "./CreditDetailsModal";
import { AddCreditsModal } from "./AddCreditsModal";
import { useRouter } from "next/navigation";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface CreditBalanceData {
  balance: {
    available: number;
    reserved: number;
    totalAvailable: number;
    lifetime: number;
    lastUpdated: string;
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
  refreshInterval?: number;
  onBalanceUpdate?: (data: CreditBalanceData) => void;
  onError?: (error: string) => void;
}

// ===========================
// STYLED COMPONENTS
// ===========================

const ModernContainer = styled(Box)<{ size?: string }>(({ theme, size }) => ({
  background: theme.palette.background.default,
  border: size === "small" ? "none" : `1px solid ${theme.palette.divider}`,
  borderRadius: size === "small" ? "100px" : "4px",
  boxShadow:
    size === "small" ? theme.shadows[8] : "0 1px 3px rgba(0, 0, 0, 0.1)",
  transition: "all 0.2s ease",
  overflow: "hidden",
  cursor: "pointer",
  backdropFilter: size === "small" ? "blur(8px)" : "none",
  "&:hover":
    size === "small"
      ? {
          transform: "translateY(-1px)",
          boxShadow: theme.shadows[12],
        }
      : {
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          transform: "translateY(-1px)",
        },
}));

const GradientAvatar = styled(Avatar)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  width: 32,
  height: 32,
  borderRadius: "16px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
}));

const ModernButton = styled(IconButton)(({ theme }) => ({
  background: "transparent",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: "8px",
  width: 32,
  height: 32,
  color: theme.palette.text.primary,
  transition: "all 0.2s ease",
  "&:hover": {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderColor: theme.palette.primary.main,
  },
}));

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

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// ===========================
// MAIN COMPONENT
// ===========================

export default function CreditBalance({
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
}: CreditBalanceProps) {
  const { user } = useAuthStore();
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [creditData, setCreditData] = useState<CreditBalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Hover state for details modal
  const [isHovering, setIsHovering] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add Credits Modal state
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchCreditBalance(true);
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Initial load
  useEffect(() => {
    if (user?.uid) {
      fetchCreditBalance();
    }
  }, [user?.uid]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

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

        const queryParams = new URLSearchParams({});

        const response = await fetch(
          `${API_BASE_URL}/credits/balance?${queryParams}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

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
          CustomToast.success("Credit balance updated");
        }
      } catch (err) {
        console.error("Error fetching credit balance:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch balance";
        setError(errorMessage);
        setHasError(true);
        onError?.(errorMessage);

        if (!refreshing) {
          CustomToast.error(`Failed to fetch balance: ${errorMessage}`);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.uid, showHealthStatus, showRecentUsage, onBalanceUpdate, onError]
  );

  const handleRefresh = useCallback(() => {
    fetchCreditBalance();
  }, [fetchCreditBalance]);

  // Hover handlers for details modal
  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    if (size === "small") return; // No hover modal for small size

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setAnchorEl(event.currentTarget);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (size === "small") return;

    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(false);
      setAnchorEl(null);
    }, 200);
  };

  const handleModalMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleModalMouseLeave = () => {
    setIsHovering(false);
    setAnchorEl(null);
  };

  const handleClickAway = () => {
    setIsHovering(false);
    setAnchorEl(null);
  };

  // Add Credits Modal handlers
  const handleAddCredits = () => {
    setShowAddCreditsModal(true);
    setIsHovering(false);
    setAnchorEl(null);
  };

  const handleCreditsAdded = (credits: number) => {
    fetchCreditBalance();
    CustomToast.success(`${credits} credits added successfully!`);
  };

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
          container: {
            px: 3,
            py: 1.5,
            minHeight: "auto",
          },
          avatar: { width: 20, height: 20 },
          mainText: "body1" as const,
          subText: "caption" as const,
          gap: 1.5,
        };
      case "large":
        return {
          container: { p: 4, minHeight: 120 },
          avatar: { width: 48, height: 48 },
          mainText: "h3" as const,
          subText: "body2" as const,
          gap: 3,
        };
      default:
        return {
          container: { p: 3, minHeight: 100 },
          avatar: { width: 32, height: 32 },
          mainText: "h4" as const,
          subText: "body2" as const,
          gap: 2,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  if (!user?.uid) {
    return null;
  }

  // Loading State
  if (isLoading && !creditData) {
    return (
      <ModernContainer
        sx={{
          ...sizeStyles.container,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
        size={size}
        className={className}
      >
        <CircularProgress
          size={size === "small" ? 16 : size === "large" ? 32 : 24}
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
            "& .MuiCircularProgress-circle": {
              strokeLinecap: "round",
            },
          }}
        />
        {size !== "small" && (
          <Typography variant={sizeStyles.subText} color="text.secondary">
            Loading credits...
          </Typography>
        )}
      </ModernContainer>
    );
  }

  // Error State
  if (hasError || !creditData) {
    return (
      <ModernContainer
        sx={{
          ...sizeStyles.container,
          background: alpha(theme.palette.error.main, 0.05),
          borderColor:
            size === "small"
              ? "transparent"
              : alpha(theme.palette.error.main, 0.2),
        }}
        size={size}
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
          {size !== "small" && (
            <Avatar
              sx={{
                ...sizeStyles.avatar,
                background: theme.palette.error.main,
                borderRadius: "16px",
              }}
            >
              <ErrorOutline fontSize={size === "large" ? "medium" : "small"} />
            </Avatar>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant={sizeStyles.mainText}
              color="error.main"
              fontWeight="bold"
            >
              {size === "small" ? "--" : "Error"}
            </Typography>
            {size !== "small" && (
              <Typography variant={sizeStyles.subText} color="error.dark">
                Failed to load balance
              </Typography>
            )}
          </Box>
          {size !== "small" && (
            <Tooltip title="Retry fetching balance">
              <ModernButton
                onClick={handleRefresh}
                disabled={isLoading}
                size="small"
              >
                {isLoading ? (
                  <CircularProgress size={16} />
                ) : (
                  <Refresh fontSize="small" />
                )}
              </ModernButton>
            </Tooltip>
          )}
        </Box>
      </ModernContainer>
    );
  }

  const balanceColor = getBalanceColor(creditData.status.balanceLevel);
  const healthColor = getHealthColor(creditData.healthCheck?.riskLevel);

  const usagePercentage =
    creditData.balance.lifetime > 0
      ? ((creditData.balance.lifetime - creditData.balance.totalAvailable) /
          creditData.balance.lifetime) *
        100
      : 0;

  // Small size - Credit Badge style (like signup landing page)
  if (size === "small") {
    return (
      <>
        <Fade in={true} timeout={300}>
          <ModernContainer
            ref={containerRef}
            sx={{
              ...sizeStyles.container,
              position: "relative", // Change from "fixed"
              top: "auto", // Remove fixed positioning
              right: "auto", // Remove fixed positioning
              zIndex: "auto", // Remove high z-index
              bgcolor: "background.paper",
              border: "1.2px solid", // Thinner border
              borderColor: "primary.main", // Subtle border
              px: 2, // Reduce padding
              py: 1.25, // Reduce padding
              minHeight: "auto",
              "&:hover": {
                borderColor: "primary.main",
              },
            }}
            size={size}
            className={className}
            onClick={handleAddCredits}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1, // Reduce gap
              }}
            >
              <Coins
                style={{
                  width: 20, // Smaller icon
                  height: 20,
                  color: theme.palette.primary.main,
                }}
              />
              <Typography
                sx={{
                  color: "text.primary",
                  fontWeight: 600,
                  fontSize: "0.875rem", // Smaller font
                  fontFamily: "monospace",
                }}
              >
                {formatNumber(creditData.balance.totalAvailable)}
              </Typography>
            </Box>
          </ModernContainer>
        </Fade>

        {/* Add Credits Modal */}
        <AddCreditsModal
          open={showAddCreditsModal}
          onOpenChange={setShowAddCreditsModal}
          currentCredits={creditData?.balance.totalAvailable || 0}
          onCreditsAdded={handleCreditsAdded}
        />
      </>
    );
  }

  // Medium and Large sizes - Original design
  return (
    <>
      <Fade in={true} timeout={300}>
        <ModernContainer
          ref={containerRef}
          sx={{ ...sizeStyles.container }}
          size={size}
          className={className}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: sizeStyles.gap }}
          >
            {/* Credit Icon */}
            <GradientAvatar sx={sizeStyles.avatar}>
              <DiamondIcon
                size={size === "large" ? 20 : 16}
                sx={{ color: theme.palette.primary.contrastText }}
              />
            </GradientAvatar>

            {/* Main Credit Display */}
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 1,
                  mb: 0.5,
                }}
              >
                <Typography
                  variant={sizeStyles.mainText}
                  component="span"
                  fontWeight="bold"
                  color="primary.main"
                  sx={{
                    fontFamily: "monospace",
                    letterSpacing: "-0.025em",
                  }}
                >
                  {formatNumber(creditData.balance.totalAvailable)}
                </Typography>
                <Typography variant={sizeStyles.subText} color="text.secondary">
                  credits
                </Typography>
              </Box>

              {/* Progress Bar for Large Size */}
              {size === "large" && creditData.balance.lifetime > 0 && (
                <Box sx={{ mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(usagePercentage, 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      "& .MuiLinearProgress-bar": {
                        background: theme.palette.primary.main,
                        borderRadius: 3,
                      },
                    }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(100 - usagePercentage)}% remaining
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      of {formatNumber(creditData.balance.lifetime)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Additional Info Row */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                {/* USD Value */}
                {showUSD && creditData.currency.availableUSD > 0 && (
                  <Chip
                    label={formatCurrency(creditData.currency.availableUSD)}
                    size="small"
                    variant="outlined"
                    sx={{
                      background: alpha(theme.palette.success.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      borderRadius: "4px",
                    }}
                  />
                )}

                {/* Balance Level */}
                <Chip
                  label={creditData.status.balanceLevel}
                  size="small"
                  color={balanceColor}
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    background: alpha(theme.palette[balanceColor].main, 0.1),
                    border: `1px solid ${alpha(theme.palette[balanceColor].main, 0.3)}`,
                    borderRadius: "4px",
                  }}
                />

                {/* Recent Usage */}
                {showRecentUsage && creditData.recentUsage.last24Hours > 0 && (
                  <Chip
                    icon={<TrendingDown sx={{ fontSize: 12 }} />}
                    label={`-${formatNumber(creditData.recentUsage.last24Hours)} today`}
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{
                      fontSize: "0.7rem",
                      background: alpha(theme.palette.info.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                      borderRadius: "4px",
                    }}
                  />
                )}

                {/* Health Status */}
                {showHealthStatus && creditData.healthCheck && (
                  <Chip
                    icon={
                      creditData.healthCheck.openMeterSync.isHealthy ? (
                        <CheckCircle sx={{ fontSize: 12 }} />
                      ) : (
                        <ErrorOutline sx={{ fontSize: 12 }} />
                      )
                    }
                    label={creditData.healthCheck.riskLevel}
                    size="small"
                    color={healthColor}
                    sx={{
                      fontSize: "0.7rem",
                      background: alpha(theme.palette[healthColor].main, 0.1),
                      border: `1px solid ${alpha(theme.palette[healthColor].main, 0.3)}`,
                      borderRadius: "4px",
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Refresh Button */}
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
                <ModernButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh();
                  }}
                  disabled={isLoading || isRefreshing}
                  size="small"
                >
                  {isLoading || isRefreshing ? (
                    <CircularProgress
                      size={16}
                      thickness={4}
                      sx={{ color: theme.palette.primary.main }}
                    />
                  ) : (
                    <Refresh fontSize="small" />
                  )}
                </ModernButton>
              </Tooltip>

              {size === "large" && lastUpdated && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: "center", fontSize: "0.65rem" }}
                >
                  {lastUpdated}
                </Typography>
              )}
            </Box>
          </Box>
        </ModernContainer>
      </Fade>

      {/* Hover Details Modal */}
      <Popper
        open={isHovering && !!anchorEl}
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={[
          {
            name: "offset",
            options: {
              offset: [0, 8],
            },
          },
        ]}
        sx={{ zIndex: 9999 }}
      >
        <ClickAwayListener onClickAway={handleClickAway}>
          <div
            onMouseEnter={handleModalMouseEnter}
            onMouseLeave={handleModalMouseLeave}
          >
            <CreditDetailsModal
              creditData={creditData}
              onAddCredits={handleAddCredits}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </div>
        </ClickAwayListener>
      </Popper>

      {/* Add Credits Modal */}
      <AddCreditsModal
        open={showAddCreditsModal}
        onOpenChange={setShowAddCreditsModal}
        currentCredits={creditData?.balance.totalAvailable || 0}
        onCreditsAdded={handleCreditsAdded}
      />
    </>
  );
}
