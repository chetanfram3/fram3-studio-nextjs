// src/components/payments/CreditTransactionHistory.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
  Divider,
  TextField,
  MenuItem,
  Pagination,
  Skeleton,
  Alert,
  Tooltip,
  Badge,
  Card,
  CardContent,
  useTheme,
  alpha,
  Fade,
  Collapse,
  styled,
  Avatar,
  LinearProgress,
  Theme,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as DollarSignIcon,
  CalendarToday as CalendarIcon,
  Description as FileTextIcon,
  ErrorOutline as AlertCircleIcon,
  CheckCircle as CheckCircle2Icon,
  Schedule as ClockIcon,
  Close as XIcon,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebase";
import CustomToast from "@/components/common/CustomToast";
import { API_BASE_URL } from "@/config/constants";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface TransactionData {
  id: string;
  type: "load" | "deduct" | "refund" | "reserve" | "release" | "adjustment";
  amount: number;
  balance: {
    before: number;
    after: number;
    reserved?: number;
  };
  reason: string;
  metadata: {
    source?: string;
    adminId?: string;
    loadType?: string;
    paymentId?: string;
    orderId?: string;
    dualTrackingSuccess?: boolean;
    openMeterEventId?: string;
    [key: string]: unknown;
  };
  timestamp: {
    _seconds: number;
    _nanoseconds: number;
  };
}

interface TransactionHistoryResponse {
  success: boolean;
  data: {
    transactions: TransactionData[];
    summary: {
      totalAdded: number;
      totalUsed: number;
      transactionCount: number;
      hasMore: boolean;
    };
  };
}

interface CreditTransactionHistoryProps {
  className?: string;
  maxHeight?: string | number;
  showFilters?: boolean;
  showExport?: boolean;
  showSummary?: boolean;
  pageSize?: number;
  compact?: boolean;
  onTransactionClick?: (transaction: TransactionData) => void;
}

// ===========================
// STYLED COMPONENTS
// ===========================

const NeumorphicCard = styled(Card)(({ theme }) => ({
  background:
    theme.palette.mode === "dark"
      ? "linear-gradient(145deg, #0a0a0a, #1a1a1a)"
      : "linear-gradient(145deg, #f0f0f0, #ffffff)",
  boxShadow:
    theme.palette.mode === "dark"
      ? `8px 8px 16px #000000, -8px -8px 16px #1a1a1a`
      : `6px 6px 12px #d1d1d1, -6px -6px 12px #ffffff`,
  borderRadius: "16px",
  border: "none",
  transition: "all 0.3s ease",
}));

const NeumorphicButton = styled(IconButton)(({ theme }) => ({
  background:
    theme.palette.mode === "dark"
      ? "linear-gradient(145deg, #1a1a1a, #0a0a0a)"
      : "linear-gradient(145deg, #ffffff, #f0f0f0)",
  boxShadow:
    theme.palette.mode === "dark"
      ? `3px 3px 6px #000000, -3px -3px 6px #1a1a1a`
      : `3px 3px 6px #d1d1d1, -3px -3px 6px #ffffff`,
  borderRadius: "12px",
  width: 36,
  height: 36,
  "&:hover": {
    background:
      theme.palette.mode === "dark"
        ? "linear-gradient(145deg, #0a0a0a, #2a2a2a)"
        : "linear-gradient(145deg, #e8e8e8, #f8f8f8)",
    boxShadow:
      theme.palette.mode === "dark"
        ? `inset 3px 3px 6px #000000, inset -3px -3px 6px #1a1a1a`
        : `inset 3px 3px 6px #d1d1d1, inset -3px -3px 6px #ffffff`,
  },
  "&.active": {
    background:
      theme.palette.mode === "dark"
        ? "linear-gradient(145deg, #0a0a0a, #2a2a2a)"
        : "linear-gradient(145deg, #e8e8e8, #f8f8f8)",
    boxShadow:
      theme.palette.mode === "dark"
        ? `inset 3px 3px 6px #000000, inset -3px -3px 6px #1a1a1a`
        : `inset 3px 3px 6px #d1d1d1, inset -3px -3px 6px #ffffff`,
    color: theme.palette.primary.main,
  },
}));

const TransactionItem = styled(Box)(({ theme }) => ({
  background:
    theme.palette.mode === "dark"
      ? "linear-gradient(145deg, #0f0f0f, #1f1f1f)"
      : "linear-gradient(145deg, #f8f9fa, #ffffff)",
  boxShadow:
    theme.palette.mode === "dark"
      ? `2px 2px 4px #000000, -2px -2px 4px #1a1a1a`
      : `2px 2px 4px #e0e0e0, -2px -2px 4px #ffffff`,
  borderRadius: "12px",
  margin: "8px 0",
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow:
      theme.palette.mode === "dark"
        ? `4px 4px 8px #000000, -4px -4px 8px #1a1a1a`
        : `4px 4px 8px #d0d0d0, -4px -4px 8px #ffffff`,
  },
}));

const GradientAvatar = styled(Avatar)<{ gradient?: string }>(
  ({ theme, gradient }) => ({
    background: gradient || theme.palette.primary.main,
    borderRadius: "12px",
    width: 48,
    height: 48,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  })
);

// ===========================
// UTILITY FUNCTIONS
// ===========================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 1000);
};

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const formatDate = (timestamp: {
  _seconds: number;
  _nanoseconds: number;
}): string => {
  const date = new Date(timestamp._seconds * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTransactionIcon = (type: string) => {
  switch (type) {
    case "load":
      return <TrendingUpIcon sx={{ fontSize: 18 }} />;
    case "deduct":
      return <TrendingDownIcon sx={{ fontSize: 18 }} />;
    case "refund":
      return <DollarSignIcon sx={{ fontSize: 18 }} />;
    case "reserve":
      return <ClockIcon sx={{ fontSize: 18 }} />;
    case "release":
      return <CheckCircle2Icon sx={{ fontSize: 18 }} />;
    case "adjustment":
      return <AlertCircleIcon sx={{ fontSize: 18 }} />;
    default:
      return <FileTextIcon sx={{ fontSize: 18 }} />;
  }
};

const getTransactionGradient = (type: string, theme: Theme) => {
  switch (type) {
    case "load":
      return `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`;
    case "refund":
      return `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`;
    case "release":
      return `linear-gradient(135deg, ${theme.palette.info.light} 0%, ${theme.palette.info.main} 100%)`;
    case "deduct":
      return `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`;
    case "reserve":
      return `linear-gradient(135deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main} 100%)`;
    case "adjustment":
      return `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`;
    default:
      return `linear-gradient(135deg, ${theme.palette.grey[600]} 0%, ${theme.palette.grey[800]} 100%)`;
  }
};

const getTransactionLabel = (type: string) => {
  switch (type) {
    case "load":
      return "Credit Load";
    case "deduct":
      return "Credit Usage";
    case "refund":
      return "Refund";
    case "reserve":
      return "Reserved";
    case "release":
      return "Released";
    case "adjustment":
      return "Adjustment";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

// ===========================
// MAIN COMPONENT
// ===========================

export default function CreditTransactionHistory({
  className = "",
  maxHeight = "600px",
  showFilters = true,
  showExport = true,
  showSummary = true,
  pageSize = 20,
  compact = false,
  onTransactionClick,
}: CreditTransactionHistoryProps) {
  const { user } = useAuthStore();
  const theme = useTheme();
  const brand = getCurrentBrand();

  // State
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [summary, setSummary] = useState({
    totalAdded: 0,
    totalUsed: 0,
    transactionCount: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchTransactions = useCallback(
    async (isRefresh = false) => {
      if (!user?.uid) return;

      const refreshing = isRefresh;
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setHasError(false);
      setError("");

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("No authentication token");

        const queryParams = new URLSearchParams({
          limit: pageSize.toString(),
          ...(typeFilter !== "all" && { type: typeFilter }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        });

        // Handle date range presets
        if (dateRange !== "custom" && dateRange !== "all") {
          const now = new Date();
          const days = parseInt(dateRange.replace("d", ""));
          const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          queryParams.set("startDate", start.toISOString());
        }

        const response = await fetch(
          `${API_BASE_URL}/credits/transactions?${queryParams}`,
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

        const result: TransactionHistoryResponse = await response.json();

        if (!result.success) {
          throw new Error(
            result.data?.summary?.transactionCount
              ? "No error"
              : "Failed to fetch transactions"
          );
        }

        setTransactions(result.data.transactions);
        setSummary(result.data.summary);

        if (!refreshing) {
          CustomToast.success("Transaction history loaded");
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch transactions";
        setError(errorMessage);
        setHasError(true);

        if (!refreshing) {
          CustomToast.error(`Failed to load transactions: ${errorMessage}`);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.uid, pageSize, typeFilter, dateRange, startDate, endDate]
  );

  // Initial load
  useEffect(() => {
    if (user?.uid) {
      fetchTransactions();
    }
  }, [user?.uid, fetchTransactions]);

  const handleRefresh = () => {
    fetchTransactions(true);
  };

  const handleFilterChange = () => {
    setPage(1);
    fetchTransactions();
  };

  const handleExport = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("No authentication token");

      // Create CSV content
      const headers = [
        "Date",
        "Type",
        "Amount",
        "Balance Before",
        "Balance After",
        "Reason",
        "Source",
      ];
      const csvContent = [
        headers.join(","),
        ...transactions.map((t) =>
          [
            formatDate(t.timestamp),
            getTransactionLabel(t.type),
            t.amount,
            t.balance.before,
            t.balance.after,
            `"${t.reason}"`,
            t.metadata.source || "system",
          ].join(",")
        ),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `credit-transactions-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      CustomToast.success("Transaction history exported");
    } catch (err) {
      CustomToast.error("Failed to export transactions");
    }
  };

  if (!user?.uid) {
    return null;
  }

  return (
    <NeumorphicCard className={className} sx={{ height: "100%" }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <GradientAvatar
                gradient={`linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`}
              >
                <FileTextIcon sx={{ fontSize: 20 }} />
              </GradientAvatar>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color="text.primary"
                  sx={{ fontFamily: brand.fonts.heading }}
                >
                  Transaction History
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track your credit usage and loads
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1}>
              {showFilters && (
                <Tooltip title="Toggle filters">
                  <NeumorphicButton
                    size="small"
                    onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                    className={showFiltersPanel ? "active" : ""}
                  >
                    <FilterIcon sx={{ fontSize: 16 }} />
                  </NeumorphicButton>
                </Tooltip>
              )}

              {showExport && transactions.length > 0 && (
                <Tooltip title="Export to CSV">
                  <NeumorphicButton size="small" onClick={handleExport}>
                    <DownloadIcon sx={{ fontSize: 16 }} />
                  </NeumorphicButton>
                </Tooltip>
              )}

              <Tooltip title="Refresh">
                <NeumorphicButton
                  size="small"
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}
                >
                  <RefreshIcon
                    sx={{
                      fontSize: 16,
                      animation: isRefreshing
                        ? "spin 1s linear infinite"
                        : "none",
                      "@keyframes spin": {
                        "0%": { transform: "rotate(0deg)" },
                        "100%": { transform: "rotate(360deg)" },
                      },
                    }}
                  />
                </NeumorphicButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Summary */}
          {showSummary && !isLoading && (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip
                icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                label={`+${formatNumber(summary.totalAdded)} credits`}
                sx={{
                  background: alpha(theme.palette.success.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                  color: "success.main",
                  fontWeight: 600,
                }}
                size="small"
              />
              <Chip
                icon={<TrendingDownIcon sx={{ fontSize: 14 }} />}
                label={`-${formatNumber(summary.totalUsed)} credits`}
                sx={{
                  background: alpha(theme.palette.warning.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                  color: "warning.main",
                  fontWeight: 600,
                }}
                size="small"
              />
              <Chip
                icon={<FileTextIcon sx={{ fontSize: 14 }} />}
                label={`${summary.transactionCount} transactions`}
                sx={{
                  background: alpha(theme.palette.info.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                  color: "info.main",
                  fontWeight: 600,
                }}
                size="small"
              />
            </Box>
          )}
        </Box>

        {/* Filters Panel */}
        <Collapse in={showFiltersPanel}>
          <Box
            sx={{
              mx: 2,
              mb: 2,
              p: 3,
              borderRadius: 3,
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(145deg, #1a1a1a, #0f0f0f)"
                  : "linear-gradient(145deg, #f0f0f0, #e8e8e8)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? `inset 4px 4px 8px #000000, inset -4px -4px 8px #1a1a1a`
                  : `inset 4px 4px 8px #d1d1d1, inset -4px -4px 8px #ffffff`,
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Transaction Type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  handleFilterChange();
                }}
                size="small"
                sx={{
                  minWidth: 150,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="load">Credit Loads</MenuItem>
                <MenuItem value="deduct">Credit Usage</MenuItem>
                <MenuItem value="refund">Refunds</MenuItem>
                <MenuItem value="reserve">Reservations</MenuItem>
                <MenuItem value="release">Releases</MenuItem>
              </TextField>

              <TextField
                select
                label="Date Range"
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  handleFilterChange();
                }}
                size="small"
                sx={{
                  minWidth: 120,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
                <MenuItem value="all">All time</MenuItem>
                <MenuItem value="custom">Custom range</MenuItem>
              </TextField>

              {dateRange === "custom" && (
                <>
                  <TextField
                    type="date"
                    label="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                  <TextField
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleFilterChange}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Apply
                  </Button>
                </>
              )}
            </Stack>
          </Box>
        </Collapse>

        {/* Content */}
        <Box sx={{ maxHeight, overflow: "auto", px: 2 }}>
          {/* Loading State */}
          {isLoading && transactions.length === 0 && (
            <Box sx={{ p: 2 }}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Skeleton
                    variant="rectangular"
                    height={80}
                    sx={{ borderRadius: 3 }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* Error State */}
          {hasError && (
            <Box sx={{ p: 2 }}>
              <Alert
                severity="error"
                sx={{
                  borderRadius: 3,
                  background:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.error.main, 0.1)
                      : alpha(theme.palette.error.main, 0.05),
                }}
                action={
                  <Button
                    size="small"
                    onClick={handleRefresh}
                    sx={{ borderRadius: 2 }}
                  >
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            </Box>
          )}

          {/* Empty State */}
          {!isLoading && !hasError && transactions.length === 0 && (
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <GradientAvatar
                gradient={`linear-gradient(135deg, ${theme.palette.grey[600]} 0%, ${theme.palette.grey[800]} 100%)`}
                sx={{ width: 64, height: 64 }}
              >
                <FileTextIcon sx={{ fontSize: 32 }} />
              </GradientAvatar>
              <Typography variant="h6" color="text.secondary" fontWeight="bold">
                No transactions found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                {typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Your transaction history will appear here"}
              </Typography>
            </Box>
          )}

          {/* Transaction List */}
          {transactions.length > 0 && (
            <Box sx={{ pb: 2 }}>
              {transactions.map((transaction, index) => (
                <Fade
                  key={transaction.id}
                  in={true}
                  timeout={300}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <TransactionItem
                    sx={{
                      p: 3,
                      cursor: onTransactionClick ? "pointer" : "default",
                    }}
                    onClick={() => onTransactionClick?.(transaction)}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {/* Icon */}
                      <GradientAvatar
                        gradient={getTransactionGradient(
                          transaction.type,
                          theme
                        )}
                        sx={{ width: 48, height: 48 }}
                      >
                        {getTransactionIcon(transaction.type)}
                      </GradientAvatar>

                      {/* Main Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight="bold"
                              sx={{ mb: 0.5 }}
                            >
                              {getTransactionLabel(transaction.type)}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1, lineHeight: 1.4 }}
                            >
                              {transaction.reason}
                            </Typography>
                            {!compact && (
                              <Typography
                                variant="caption"
                                color="text.disabled"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <CalendarIcon sx={{ fontSize: 12 }} />
                                {formatDate(transaction.timestamp)}
                                {transaction.metadata.source &&
                                  ` • via ${transaction.metadata.source}`}
                              </Typography>
                            )}
                          </Box>

                          <Box sx={{ textAlign: "right", ml: 2 }}>
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              color={
                                ["load", "refund", "release"].includes(
                                  transaction.type
                                )
                                  ? "success.main"
                                  : ["deduct", "reserve"].includes(
                                        transaction.type
                                      )
                                    ? "warning.main"
                                    : "text.primary"
                              }
                              sx={{
                                fontFamily: "monospace",
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                justifyContent: "flex-end",
                              }}
                            >
                              {["load", "refund", "release"].includes(
                                transaction.type
                              )
                                ? "+"
                                : "-"}
                              {formatNumber(transaction.amount)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              Balance: {formatNumber(transaction.balance.after)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Health Indicators */}
                        {!compact && transaction.metadata && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              mt: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            {transaction.metadata.dualTrackingSuccess ===
                              true && (
                              <Chip
                                icon={
                                  <CheckCircle2Icon sx={{ fontSize: 12 }} />
                                }
                                label="Synced"
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: "0.7rem",
                                  background: alpha(
                                    theme.palette.success.main,
                                    0.1
                                  ),
                                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                                  color: "success.main",
                                  fontWeight: 600,
                                }}
                              />
                            )}
                            {transaction.metadata.dualTrackingSuccess ===
                              false && (
                              <Chip
                                icon={<AlertCircleIcon sx={{ fontSize: 12 }} />}
                                label="Sync Failed"
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: "0.7rem",
                                  background: alpha(
                                    theme.palette.error.main,
                                    0.1
                                  ),
                                  border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                                  color: "error.main",
                                  fontWeight: 600,
                                }}
                              />
                            )}
                            {transaction.metadata.paymentId && (
                              <Chip
                                label="Payment"
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: "0.7rem",
                                  background: alpha(
                                    theme.palette.info.main,
                                    0.1
                                  ),
                                  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                                  color: "info.main",
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </TransactionItem>
                </Fade>
              ))}
            </Box>
          )}
        </Box>

        {/* Pagination */}
        {summary.hasMore && (
          <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <Button
              variant="outlined"
              onClick={() => {
                setPage(page + 1);
                fetchTransactions();
              }}
              disabled={isLoading}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 600,
                px: 4,
                py: 1.5,
              }}
            >
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </Box>
        )}
      </CardContent>
    </NeumorphicCard>
  );
}
