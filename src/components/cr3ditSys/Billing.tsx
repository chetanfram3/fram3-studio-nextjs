"use client";

import {
  useState,
  useMemo,
  useCallback,
  startTransition,
  Suspense,
} from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  LinearProgress,
  alpha,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Skeleton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  CheckCircle,
  FileText,
  X as Close,
} from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";
import DiamondIcon from "@/components/common/DiamondIcon";
import { CustomInvoiceTable } from "@/components/invoice/CustomInvoiceTable";
import { ModernInvoicePreview } from "@/components/invoice/ModernInvoicePreview";
import { useInvoicePreview } from "@/hooks/useInvoicePreview";
import type { InvoiceListItem } from "@/services/invoiceService";
import { AccountPlanSection } from "./AccountPlanSection";
import { formatCurrency, formatDate } from "@/services/invoiceService";
import { QuickStats } from "@/services/scriptService";

// Types
interface CreditMetrics {
  current: number;
  max: number;
  usedPercentage: number;
  resetsIn: string;
}

interface SpendingMetrics {
  monthlySpend: number;
  vsLastMonth: number;
  dailyAverage: number;
  projectedMonthly: number;
}

interface SystemStatus {
  isActive: boolean;
  nextBill: string;
  autoPayEnabled: boolean;
  usageLevel: "Normal" | "High" | "Critical";
  planStatus: "Active" | "Inactive" | "Suspended";
}

interface PlanInfo {
  name: string;
  price: number;
  currency: string;
  paymentMethod: {
    type: string;
    last4: string;
    expiry: string;
  };
}

interface AutoRechargeSettings {
  enabled: boolean;
  threshold: number;
  amount: number;
  nextCheck: string;
}

interface RecentInvoice {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  status: "paid" | "overdue" | "pending" | "failed" | "cancelled" | "refunded";
  plan: string;
  period: string;
}

interface BillingProps {
  creditMetrics: CreditMetrics;
  spendingMetrics: SpendingMetrics;
  systemStatus: SystemStatus;
  planInfo: PlanInfo;
  autoRechargeSettings: AutoRechargeSettings;
  recentInvoices?: InvoiceListItem[];
  totalPaid: number;
  invoicesThisQuarter: number;
  quickStats?: QuickStats | null;
  onAddCredits: () => void;
  onManagePlan: () => void;
  onViewAllInvoices: () => void;
  onAutoRechargeToggle: (enabled: boolean) => void;
  onSharedRefresh?: () => void;
  className?: string;
  loading?: boolean;
  onRefresh?: () => void;
}

const defaultProps: Omit<
  BillingProps,
  | "onAddCredits"
  | "onManagePlan"
  | "onViewAllInvoices"
  | "onAutoRechargeToggle"
  | "recentInvoices"
> = {
  creditMetrics: {
    current: 100,
    max: 1000,
    usedPercentage: 0,
    resetsIn: "No Reset",
  },
  spendingMetrics: {
    monthlySpend: 2499,
    vsLastMonth: -12,
    dailyAverage: 108,
    projectedMonthly: 3240,
  },
  systemStatus: {
    isActive: true,
    nextBill: "Aug 1, 2024",
    autoPayEnabled: true,
    usageLevel: "Normal",
    planStatus: "Active",
  },
  planInfo: {
    name: "Pro Plan",
    price: 4999,
    currency: "₹",
    paymentMethod: {
      type: "Visa",
      last4: "1234",
      expiry: "04/27",
    },
  },
  autoRechargeSettings: {
    enabled: true,
    threshold: 50,
    amount: 1000,
    nextCheck: "2 days",
  },
  totalPaid: 12497,
  invoicesThisQuarter: 3,
  loading: false,
};

// Helper function to get status color
const getStatusColor = (
  status: string
): "success" | "error" | "warning" | "default" | "info" => {
  switch (status) {
    case "paid":
      return "success";
    case "overdue":
    case "failed":
      return "error";
    case "pending":
      return "warning";
    case "cancelled":
      return "default";
    case "refunded":
      return "info";
    default:
      return "default";
  }
};

// Credits Card Skeleton
const CreditsCardSkeleton = () => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: `${brand.borderRadius}px`,
        bgcolor: alpha(theme.palette.warning.main, 0.05),
        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
        height: "100%",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Skeleton
          variant="rectangular"
          width={64}
          height={64}
          sx={{ borderRadius: `${brand.borderRadius * 4}px` }}
        />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={48} />
          <Skeleton variant="text" width="40%" height={24} />
        </Box>
      </Box>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={6}
        sx={{ mb: 2, borderRadius: `${brand.borderRadius}px` }}
      />
      <Skeleton
        variant="rectangular"
        width="100%"
        height={48}
        sx={{ borderRadius: `${brand.borderRadius}px` }}
      />
    </Box>
  );
};

// Credits Card Component
const CreditsCard = ({
  creditMetrics,
  quickStats,
  onAddCredits,
}: {
  creditMetrics: CreditMetrics;
  quickStats: QuickStats | null;
  onAddCredits: () => void;
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: `${brand.borderRadius}px`,
        bgcolor: alpha(theme.palette.warning.main, 0.05),
        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
        height: "100%",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: `${brand.borderRadius * 4}px`,
            background:
              "linear-gradient(135deg, #facc15 0%, rgb(130, 100, 2) 100%)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0px 4px 6px -1px rgba(0, 0, 0, 0.2), 0px 2px 4px -1px rgba(0, 0, 0, 0.12), 0 0 8px rgba(234, 88, 12, 0.2)"
                : "0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        >
          <DiamondIcon size={32} animate={creditMetrics.usedPercentage > 75} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontSize: "2.8rem",
                fontWeight: 700,
                fontFamily: brand.fonts.heading,
                background: "linear-gradient(90deg, #FFC107, #F57F17)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              {creditMetrics.current.toLocaleString()}
            </Typography>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              / {creditMetrics.max.toLocaleString()}
            </Typography>
          </Box>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Credits Available
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <LinearProgress
          variant="determinate"
          value={creditMetrics.usedPercentage}
          sx={{
            height: 6,
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: alpha(theme.palette.warning.main, 0.2),
            "& .MuiLinearProgress-bar": {
              background: "linear-gradient(135deg, #FFC107 0%, #FFD740 100%)",
              borderRadius: `${brand.borderRadius}px`,
            },
          }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            {creditMetrics.usedPercentage}% used from last recharge
          </Typography>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            {creditMetrics.resetsIn}
          </Typography>
        </Box>

        {quickStats?.balance && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Available Balance
              </Typography>
              <Typography
                variant="caption"
                color="text.primary"
                fontWeight="bold"
                sx={{ fontFamily: brand.fonts.body }}
              >
                {quickStats.balance.available.toLocaleString()}
              </Typography>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Reserved
              </Typography>
              <Typography
                variant="caption"
                color="text.primary"
                fontWeight="bold"
                sx={{ fontFamily: brand.fonts.body }}
              >
                {quickStats.balance.reserved.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Lifetime Credits
              </Typography>
              <Typography
                variant="caption"
                color="text.primary"
                fontWeight="bold"
                sx={{ fontFamily: brand.fonts.body }}
              >
                {quickStats.balance.lifetime.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <Button
        variant="contained"
        fullWidth
        startIcon={<CreditCard size={20} />}
        onClick={onAddCredits}
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          fontWeight: 600,
          fontFamily: brand.fonts.body,
          borderRadius: `${brand.borderRadius}px`,
          "&:hover": {
            bgcolor: "primary.dark",
          },
        }}
      >
        Add Credits
      </Button>
    </Box>
  );
};

// Spending Card Component
const SpendingCard = ({
  spendingMetrics,
  quickStats,
}: {
  spendingMetrics: SpendingMetrics;
  quickStats: QuickStats | null;
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const changePercent = quickStats?.monthlyComparison?.changePercent ?? 0;
  const isPositive = changePercent >= 0;

  return (
    <Box sx={{ p: 3, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: `${brand.borderRadius * 4}px`,
            background: isPositive
              ? "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)"
              : "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)",
          }}
        >
          {isPositive ? (
            <TrendingUp size={20} color={theme.palette.primary.contrastText} />
          ) : (
            <TrendingDown
              size={20}
              color={theme.palette.primary.contrastText}
            />
          )}
        </Box>
        <Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            color={isPositive ? "success.main" : "warning.main"}
            sx={{ fontFamily: brand.fonts.heading }}
          >
            {quickStats?.monthlyComparison?.currentMonth?.credits?.toLocaleString() ||
              spendingMetrics.monthlySpend.toLocaleString()}
          </Typography>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Credits This Month
          </Typography>
        </Box>
      </Box>

      <Stack spacing={1}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            vs Last Month
          </Typography>
          <Typography
            variant="body2"
            color={isPositive ? "error.main" : "success.main"}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              fontFamily: brand.fonts.body,
            }}
          >
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(changePercent || spendingMetrics.vsLastMonth)}%
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Daily Average
          </Typography>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            color="text.primary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            {quickStats?.averageDailyCredits?.toLocaleString() ||
              spendingMetrics.dailyAverage}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Projected Total
          </Typography>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            color="text.primary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            {quickStats?.projectedUsage?.projectedTotal?.toLocaleString() ||
              spendingMetrics.projectedMonthly.toLocaleString()}
          </Typography>
        </Box>
        {quickStats?.projectedUsage && (
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Days Remaining
            </Typography>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              {quickStats.projectedUsage.daysRemaining} of{" "}
              {quickStats.projectedUsage.daysInMonth}
            </Typography>
          </Box>
        )}
      </Stack>

      {quickStats?.monthlyComparison?.currentMonth?.period && (
        <Box
          sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Period: {quickStats.monthlyComparison.currentMonth.period.label}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// System Status Card Component
const SystemStatusCard = ({
  systemStatus,
  quickStats,
}: {
  systemStatus: SystemStatus;
  quickStats: QuickStats | null;
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const usageLevel = useMemo(() => {
    if (quickStats?.monthlyComparison?.changePercent !== undefined) {
      const absChange = Math.abs(quickStats.monthlyComparison.changePercent);
      if (absChange < 50) return "Low";
      if (absChange > 75) return "High";
      return "Normal";
    }
    return systemStatus.usageLevel;
  }, [quickStats, systemStatus.usageLevel]);

  const usageColor = useMemo(() => {
    if (usageLevel === "Low") return "success";
    if (usageLevel === "High") return "error";
    return "info";
  }, [usageLevel]);

  return (
    <Box sx={{ p: 3, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: `${brand.borderRadius * 4}px`,
            background: systemStatus.isActive
              ? "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)"
              : "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
          }}
        >
          <CheckCircle size={20} color={theme.palette.primary.contrastText} />
        </Box>
        <Typography
          variant="h6"
          fontWeight="bold"
          color={systemStatus.isActive ? "success.main" : "error.main"}
          sx={{ fontFamily: brand.fonts.heading }}
        >
          {systemStatus.isActive ? "All Systems Active" : "System Issues"}
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Next Bill
          </Typography>
          <Chip
            label={
              quickStats?.projectedUsage?.daysRemaining
                ? new Date(
                    Date.now() +
                      quickStats.projectedUsage.daysRemaining *
                        24 *
                        60 *
                        60 *
                        1000
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : systemStatus.nextBill
            }
            size="small"
            variant="outlined"
            sx={{ fontFamily: brand.fonts.body }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Usage Level
          </Typography>
          <Chip
            label={usageLevel}
            size="small"
            color={usageColor}
            sx={{ fontFamily: brand.fonts.body }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Plan Status
          </Typography>
          <Chip
            label={systemStatus.planStatus}
            size="small"
            color={systemStatus.planStatus === "Active" ? "success" : "error"}
            sx={{ fontFamily: brand.fonts.body }}
          />
        </Box>
      </Stack>
    </Box>
  );
};

// Recent Invoices Card Component
const RecentInvoicesCard = ({
  displayInvoices,
  loading,
  totalPaid,
  invoicesThisQuarter,
  onViewAll,
  onInvoicePreview,
  invoiceDetailsLoading,
}: {
  displayInvoices: RecentInvoice[];
  loading: boolean;
  totalPaid: number;
  invoicesThisQuarter: number;
  onViewAll: () => void;
  onInvoicePreview: (invoice: RecentInvoice) => void;
  invoiceDetailsLoading: boolean;
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: `${brand.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
        height: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: `${brand.borderRadius * 4}px`,
              bgcolor: "primary.main",
            }}
          >
            <FileText size={24} color={theme.palette.primary.contrastText} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Recent Invoices
            </Typography>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Latest billing history
            </Typography>
          </Box>
        </Box>
        <Button
          variant="text"
          size="small"
          onClick={onViewAll}
          sx={{
            borderRadius: `${brand.borderRadius}px`,
            color: "primary.main",
            fontFamily: brand.fonts.body,
          }}
        >
          View All
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Loading invoices...
          </Typography>
        </Box>
      ) : displayInvoices.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            No recent invoices found
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2} sx={{ mb: 3 }}>
          {displayInvoices.map((invoice) => (
            <Box
              key={invoice.id}
              sx={{
                p: 2,
                borderRadius: `${brand.borderRadius}px`,
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
              }}
              onClick={() => onInvoicePreview(invoice)}
            >
              {invoiceDetailsLoading && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    right: 16,
                    transform: "translateY(-50%)",
                    zIndex: 1,
                  }}
                >
                  <CircularProgress size={20} sx={{ color: "primary.main" }} />
                </Box>
              )}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: `${brand.borderRadius}px`,
                      bgcolor: "primary.main",
                    }}
                  >
                    <FileText
                      size={16}
                      color={theme.palette.primary.contrastText}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      sx={{ fontFamily: brand.fonts.body }}
                    >
                      {invoice.invoiceNumber}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ fontFamily: brand.fonts.body }}
                    >
                      {formatDate(invoice.date)} • {invoice.plan}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color="text.primary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    {formatCurrency(invoice.amount, "INR")}
                  </Typography>
                  <Chip
                    label={invoice.status}
                    size="small"
                    color={getStatusColor(invoice.status)}
                    sx={{ fontSize: "0.7rem", fontFamily: brand.fonts.body }}
                  />
                </Box>
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      <Box
        sx={{
          p: 2,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: alpha(theme.palette.success.main, 0.05),
          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
        }}
      >
        <Grid container spacing={2}>
          <Grid size={6}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="success.main"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                {formatCurrency(totalPaid, "INR")}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Total Paid
              </Typography>
            </Box>
          </Grid>
          <Grid size={6}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="info.main"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                {invoicesThisQuarter}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                This Quarter
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

// Main Billing Component
export function BillingCard(props: Partial<BillingProps>) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const {
    creditMetrics = defaultProps.creditMetrics,
    spendingMetrics = defaultProps.spendingMetrics,
    systemStatus = defaultProps.systemStatus,
    recentInvoices = [],
    totalPaid = defaultProps.totalPaid,
    invoicesThisQuarter = defaultProps.invoicesThisQuarter,
    quickStats = null,
    onAddCredits = () => {},
    onViewAllInvoices = () => {},
    onSharedRefresh,
    className,
    loading = false,
    onRefresh,
  } = props;

  const [invoiceTableOpen, setInvoiceTableOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const {
    invoice: selectedInvoice,
    previewOpen: invoicePreviewOpen,
    loading: invoiceDetailsLoading,
    error: invoiceDetailsError,
    openPreview,
    closePreview: handleCloseInvoicePreview,
  } = useInvoicePreview();

  const displayInvoices = useMemo((): RecentInvoice[] => {
    if (!recentInvoices.length) return [];

    return recentInvoices.map((invoice) => ({
      id: invoice.invoiceId,
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.createdAt,
      amount: invoice.amount,
      status: invoice.status,
      plan: invoice.package.name,
      period: new Date(invoice.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
    }));
  }, [recentInvoices]);

  const handleViewAllInvoices = useCallback(() => {
    startTransition(() => {
      setInvoiceTableOpen(true);
      onViewAllInvoices();
    });
  }, [onViewAllInvoices]);

  const handleCloseInvoiceTable = useCallback(() => {
    startTransition(() => {
      setInvoiceTableOpen(false);
    });
  }, []);

  const handleInvoicePreview = useCallback(
    async (invoice: RecentInvoice) => {
      try {
        openPreview(invoice.invoiceId);
      } catch (error) {
        console.error("Failed to preview invoice:", error);
        setSnackbar({
          open: true,
          message: `Failed to preview: ${(error as Error).message}`,
          severity: "error",
        });
      }
    },
    [openPreview]
  );

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "text.primary",
            fontFamily: brand.fonts.heading,
            mb: 1,
          }}
        >
          Billing & Payments
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          Manage your payment methods, invoices, and subscription
        </Typography>
      </Box>

      <Card
        sx={{
          borderRadius: `${brand.borderRadius}px`,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: "background.default",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            transform: "translateY(-1px)",
          },
        }}
        className={className}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Primary Metrics Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Suspense fallback={<CreditsCardSkeleton />}>
                <CreditsCard
                  creditMetrics={creditMetrics}
                  quickStats={quickStats}
                  onAddCredits={onAddCredits}
                />
              </Suspense>
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Suspense
                fallback={
                  <Box sx={{ p: 3, height: "100%" }}>
                    <Skeleton variant="rectangular" width="100%" height={200} />
                  </Box>
                }
              >
                <SpendingCard
                  spendingMetrics={spendingMetrics}
                  quickStats={quickStats}
                />
              </Suspense>
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Suspense
                fallback={
                  <Box sx={{ p: 3, height: "100%" }}>
                    <Skeleton variant="rectangular" width="100%" height={200} />
                  </Box>
                }
              >
                <SystemStatusCard
                  systemStatus={systemStatus}
                  quickStats={quickStats}
                />
              </Suspense>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Secondary Information Row */}
          <Grid container spacing={3}>
            <AccountPlanSection />

            <Grid size={{ xs: 12, lg: 6 }}>
              <Suspense
                fallback={
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: `${brand.borderRadius}px`,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Skeleton variant="text" width="40%" height={32} />
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      {[1, 2, 3].map((i) => (
                        <Skeleton
                          key={i}
                          variant="rectangular"
                          width="100%"
                          height={60}
                        />
                      ))}
                    </Stack>
                  </Box>
                }
              >
                <RecentInvoicesCard
                  displayInvoices={displayInvoices}
                  loading={loading}
                  totalPaid={totalPaid}
                  invoicesThisQuarter={invoicesThisQuarter}
                  onViewAll={handleViewAllInvoices}
                  onInvoicePreview={handleInvoicePreview}
                  invoiceDetailsLoading={invoiceDetailsLoading}
                />
              </Suspense>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Invoice Table Modal */}
      <Dialog
        open={invoiceTableOpen}
        onClose={handleCloseInvoiceTable}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: "90vh",
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.default",
          },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: `${brand.borderRadius}px`,
                  bgcolor: "primary.main",
                }}
              >
                <FileText
                  size={20}
                  color={theme.palette.primary.contrastText}
                />
              </Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                All Invoices & Orders
              </Typography>
            </Box>
            <IconButton onClick={handleCloseInvoiceTable}>
              <Close size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, overflow: "hidden" }}>
          <Box sx={{ height: "100%", overflow: "auto" }}>
            <CustomInvoiceTable
              loading={loading}
              onRefresh={onSharedRefresh || onRefresh}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Dialog */}
      {selectedInvoice && (
        <ModernInvoicePreview
          invoice={selectedInvoice}
          open={invoicePreviewOpen}
          onClose={handleCloseInvoicePreview}
          loading={invoiceDetailsLoading}
          error={invoiceDetailsError || undefined}
          scale="large"
        />
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            borderRadius: `${brand.borderRadius}px`,
            fontWeight: 600,
            fontFamily: brand.fonts.body,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default BillingCard;
