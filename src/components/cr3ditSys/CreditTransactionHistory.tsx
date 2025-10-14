// src/components/Cr3ditSys/components/CreditTransactionHistory.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  TextField,
  MenuItem,
  Skeleton,
  Alert,
  Tooltip,
  alpha,
  Fade,
  Collapse,
  Card,
} from "@mui/material";
import { useTheme, Theme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  Refresh,
  Download,
  FilterList,
  TrendingUp,
  TrendingDown,
  AttachMoney as DollarSign,
  CalendarToday as Calendar,
  Description as FileText,
  Warning as AlertCircle,
  CheckCircle,
  Schedule as Clock,
} from "@mui/icons-material";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebase";
import CustomToast from "@/components/common/CustomToast";
import { API_BASE_URL } from "@/config/constants";

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
      return <TrendingUp sx={{ fontSize: 18, color: "white" }} />;
    case "deduct":
      return <TrendingDown sx={{ fontSize: 18, color: "white" }} />;
    case "refund":
      return <DollarSign sx={{ fontSize: 18, color: "white" }} />;
    case "reserve":
      return <Clock sx={{ fontSize: 18, color: "white" }} />;
    case "release":
      return <CheckCircle sx={{ fontSize: 18, color: "white" }} />;
    case "adjustment":
      return <AlertCircle sx={{ fontSize: 18, color: "white" }} />;
    default:
      return <FileText sx={{ fontSize: 18, color: "white" }} />;
  }
};

const getTransactionGradient = (theme: Theme, type: string) => {
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
      return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`;
    case "adjustment":
      return `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark || theme.palette.secondary.main} 100%)`;
    default:
      return `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`;
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

export const CreditTransactionHistory: React.FC<
  CreditTransactionHistoryProps
> = ({
  className = "",
  maxHeight = "600px",
  showFilters = true,
  showExport = true,
  showSummary = true,
  pageSize = 20,
  compact = false,
  onTransactionClick,
}) => {
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
          throw new Error("Failed to fetch transactions");
        }

        setTransactions(result.data.transactions);
        setSummary(result.data.summary);

        if (!refreshing) {
          CustomToast("success", "Transaction history loaded");
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch transactions";
        setError(errorMessage);
        setHasError(true);

        if (!refreshing) {
          CustomToast("error", `Failed to load transactions: ${errorMessage}`);
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
      void fetchTransactions();
    }
  }, [fetchTransactions]);

  const handleRefresh = () => {
    void fetchTransactions(true);
  };

  const handleFilterChange = () => {
    setPage(1);
    void fetchTransactions();
  };

  const handleExport = async () => {
    try {
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
      a.download = `credit-transactions-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      CustomToast("success", "Transaction history exported");
    } catch (err) {
      CustomToast("error", "Failed to export transactions");
    }
  };

  if (!user?.uid) {
    return null;
  }

  return (
    <Card
      className={className}
      sx={{
        height: "100%",
        bgcolor: "background.paper",
        borderRadius: `${brand.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)"
            : "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
      }}
    >
      <Box sx={{ p: 0 }}>
        {/* Enhanced Header */}
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
              {/* Header Icon */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: `${brand.borderRadius * 0.33}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 2px 4px rgba(0, 0, 0, 0.3)"
                      : "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              >
                <FileText sx={{ fontSize: 20, color: "white" }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color="text.primary"
                  sx={{ fontFamily: brand.fonts.heading }}
                >
                  Transaction History
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Track your credit usage and loads
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1}>
              {showFilters && (
                <Tooltip title="Toggle filters">
                  <Button
                    variant={showFiltersPanel ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                    sx={{
                      minWidth: 40,
                      height: 40,
                      p: 0,
                      borderRadius: `${brand.borderRadius * 0.33}px`,
                    }}
                  >
                    <FilterList sx={{ fontSize: 16 }} />
                  </Button>
                </Tooltip>
              )}

              {showExport && transactions.length > 0 && (
                <Tooltip title="Export to CSV">
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleExport}
                    sx={{
                      minWidth: 40,
                      height: 40,
                      p: 0,
                      borderRadius: `${brand.borderRadius * 0.33}px`,
                    }}
                  >
                    <Download sx={{ fontSize: 16 }} />
                  </Button>
                </Tooltip>
              )}

              <Tooltip title="Refresh">
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}
                  sx={{
                    minWidth: 40,
                    height: 40,
                    p: 0,
                    borderRadius: `${brand.borderRadius * 0.33}px`,
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                >
                  <Refresh
                    sx={{
                      fontSize: 16,
                      animation: isRefreshing
                        ? "spin 1s linear infinite"
                        : "none",
                    }}
                  />
                </Button>
              </Tooltip>
            </Stack>
          </Box>

          {/* Enhanced Summary */}
          {showSummary && !isLoading && (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip
                icon={<TrendingUp sx={{ fontSize: 14 }} />}
                label={`+${formatNumber(summary.totalAdded)} credits`}
                sx={{
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                  color: "success.main",
                  fontWeight: 600,
                  fontFamily: brand.fonts.body,
                  borderRadius: `${brand.borderRadius * 0.33}px`,
                }}
                size="small"
              />
              <Chip
                icon={<TrendingDown sx={{ fontSize: 14 }} />}
                label={`-${formatNumber(summary.totalUsed)} credits`}
                sx={{
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                  color: "warning.main",
                  fontWeight: 600,
                  fontFamily: brand.fonts.body,
                  borderRadius: `${brand.borderRadius * 0.33}px`,
                }}
                size="small"
              />
              <Chip
                icon={<FileText sx={{ fontSize: 14 }} />}
                label={`${summary.transactionCount} transactions`}
                sx={{
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                  color: "info.main",
                  fontWeight: 600,
                  fontFamily: brand.fonts.body,
                  borderRadius: `${brand.borderRadius * 0.33}px`,
                }}
                size="small"
              />
            </Box>
          )}
        </Box>

        {/* Enhanced Filters Panel */}
        <Collapse in={showFiltersPanel}>
          <Box
            sx={{
              mx: 2,
              mb: 2,
              p: 3,
              borderRadius: `${brand.borderRadius * 0.75}px`,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${theme.palette.divider}`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "inset 0 1px 2px rgba(0, 0, 0, 0.3)"
                  : "inset 0 1px 2px rgba(0, 0, 0, 0.06)",
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
                sx={{ minWidth: 150 }}
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
                sx={{ minWidth: 120 }}
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
                  />
                  <TextField
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleFilterChange}
                    sx={{
                      px: 3,
                      py: 1,
                      borderRadius: `${brand.borderRadius * 0.33}px`,
                      fontFamily: brand.fonts.heading,
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
          {/* Enhanced Loading State */}
          {isLoading && transactions.length === 0 && (
            <Box sx={{ p: 2 }}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Skeleton
                    variant="rectangular"
                    height={80}
                    sx={{ borderRadius: `${brand.borderRadius * 0.75}px` }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* Enhanced Error State */}
          {hasError && (
            <Box sx={{ p: 2 }}>
              <Alert
                severity="error"
                sx={{
                  borderRadius: `${brand.borderRadius * 0.75}px`,
                  bgcolor: alpha(theme.palette.error.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                }}
                action={
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleRefresh}
                    size="small"
                    sx={{
                      minWidth: 80,
                      borderRadius: `${brand.borderRadius * 0.33}px`,
                    }}
                  >
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            </Box>
          )}

          {/* Enhanced Empty State */}
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
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: `${brand.borderRadius * 0.33}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                }}
              >
                <FileText sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Typography
                variant="h6"
                color="text.secondary"
                fontWeight="bold"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                No transactions found
              </Typography>
              <Typography
                variant="body2"
                color="text.disabled"
                sx={{ fontFamily: brand.fonts.body }}
              >
                {typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Your transaction history will appear here"}
              </Typography>
            </Box>
          )}

          {/* Enhanced Transaction List */}
          {transactions.length > 0 && (
            <Box sx={{ pb: 2 }}>
              {transactions.map((transaction, index) => (
                <Fade
                  key={transaction.id}
                  in={true}
                  timeout={300}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <Card
                    sx={{
                      p: 3,
                      mb: 2,
                      cursor: onTransactionClick ? "pointer" : "default",
                      transition: "all 0.2s ease",
                      bgcolor: "background.paper",
                      borderRadius: `${brand.borderRadius * 0.75}px`,
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "inset 0 1px 2px rgba(0, 0, 0, 0.3)"
                          : "inset 0 1px 2px rgba(0, 0, 0, 0.06)",
                      "&:hover": onTransactionClick
                        ? {
                            transform: "translateY(-2px)",
                            boxShadow:
                              theme.palette.mode === "dark"
                                ? "0 4px 6px rgba(0, 0, 0, 0.4)"
                                : "0 4px 6px rgba(0, 0, 0, 0.1)",
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                          }
                        : undefined,
                    }}
                    onClick={() => onTransactionClick?.(transaction)}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {/* Enhanced Icon */}
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: `${brand.borderRadius * 0.33}px`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: getTransactionGradient(
                            theme,
                            transaction.type
                          ),
                          boxShadow:
                            theme.palette.mode === "dark"
                              ? "0 2px 4px rgba(0, 0, 0, 0.3)"
                              : "0 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {getTransactionIcon(transaction.type)}
                      </Box>

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
                              color="text.primary"
                              sx={{ mb: 0.5, fontFamily: brand.fonts.heading }}
                            >
                              {getTransactionLabel(transaction.type)}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mb: 1,
                                lineHeight: 1.4,
                                fontFamily: brand.fonts.body,
                              }}
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
                                  fontFamily: brand.fonts.body,
                                }}
                              >
                                <Calendar sx={{ fontSize: 12 }} />
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
                              sx={{
                                display: "block",
                                mt: 0.5,
                                fontFamily: brand.fonts.body,
                              }}
                            >
                              Balance: {formatNumber(transaction.balance.after)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Enhanced Health Indicators */}
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
                                icon={<CheckCircle sx={{ fontSize: 12 }} />}
                                label="Synced"
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: "0.7rem",
                                  bgcolor: alpha(
                                    theme.palette.success.main,
                                    0.1
                                  ),
                                  border: `1px solid ${alpha(
                                    theme.palette.success.main,
                                    0.3
                                  )}`,
                                  color: "success.main",
                                  fontWeight: 600,
                                  fontFamily: brand.fonts.body,
                                  borderRadius: `${brand.borderRadius * 0.25}px`,
                                }}
                              />
                            )}
                            {transaction.metadata.dualTrackingSuccess ===
                              false && (
                              <Chip
                                icon={<AlertCircle sx={{ fontSize: 12 }} />}
                                label="Sync Failed"
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: "0.7rem",
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  border: `1px solid ${alpha(
                                    theme.palette.error.main,
                                    0.3
                                  )}`,
                                  color: "error.main",
                                  fontWeight: 600,
                                  fontFamily: brand.fonts.body,
                                  borderRadius: `${brand.borderRadius * 0.25}px`,
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
                                  bgcolor: alpha(theme.palette.info.main, 0.1),
                                  border: `1px solid ${alpha(
                                    theme.palette.info.main,
                                    0.3
                                  )}`,
                                  color: "info.main",
                                  fontWeight: 600,
                                  fontFamily: brand.fonts.body,
                                  borderRadius: `${brand.borderRadius * 0.25}px`,
                                }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Card>
                </Fade>
              ))}
            </Box>
          )}
        </Box>

        {/* Enhanced Pagination */}
        {summary.hasMore && (
          <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setPage(page + 1);
                void fetchTransactions();
              }}
              disabled={isLoading}
              sx={{
                px: 6,
                py: 2,
                borderRadius: `${brand.borderRadius * 0.33}px`,
                fontFamily: brand.fonts.heading,
              }}
            >
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default CreditTransactionHistory;
