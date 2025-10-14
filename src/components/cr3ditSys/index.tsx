// src/components/Cr3ditSys/index.tsx
"use client";

import React, { useState, useCallback } from "react";
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  alpha,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  Download,
  Refresh,
  Dashboard as DashboardIcon,
  Receipt as BillingIcon,
} from "@mui/icons-material";
import { useQuickUsageStats } from "@/hooks/useQuickUsageStats";
import { useInvoices } from "@/hooks/useInvoices";
import DiamondIcon from "../common/DiamondIcon";
import { AddCreditsModal } from "@/components/credits/AddCreditsModal";
import { CreditMiniSheet } from "./CreditMiniSheet";
import { BillingCard } from "./Billing";
import { ApiUsageAnalytics } from "./ApiUsageAnalytics";
import { Dashboard } from "./Dashboard";

const Cr3ditSys: React.FC = () => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Fetch real usage statistics
  const {
    data: quickStatsResponse,
    isLoading: quickStatsLoading,
    error: quickStatsError,
    refetch: refetchQuickStats,
  } = useQuickUsageStats();

  // Fetch only recent invoices for Recent Invoices section
  const {
    invoices: recentInvoices,
    isLoading: invoicesLoading,
    error: invoicesError,
    refresh: refreshInvoices,
  } = useInvoices({
    limit: 3,
    orderBy: "createdAt",
    orderDirection: "desc",
  });

  // Create a shared refresh function that can be passed to CustomInvoiceTable
  const handleSharedRefresh = useCallback(async () => {
    try {
      await Promise.all([refetchQuickStats(), refreshInvoices()]);
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  }, [refetchQuickStats, refreshInvoices]);

  // State Management
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [showCreditSheet, setShowCreditSheet] = useState(false);
  const [creditSheetAnchor, setCreditSheetAnchor] =
    useState<HTMLElement | null>(null);
  const [autoRechargeEnabled, setAutoRechargeEnabled] = useState(true);
  const [currentCredits, setCurrentCredits] = useState(1247);
  const [activeTab, setActiveTab] = useState(0);
  const maxCredits = 5000;

  // Extract quick stats data
  const quickStats = quickStatsResponse?.success
    ? quickStatsResponse.data
    : null;

  // Calculate credit percentage
  const creditPercentage = Math.round((currentCredits / maxCredits) * 100);

  const handleRefresh = useCallback(async () => {
    await handleSharedRefresh();
  }, [handleSharedRefresh]);

  const handleCreditsAdded = useCallback((credits: number) => {
    setCurrentCredits((prev) => prev + credits);
    setShowAddCredits(false);
  }, []);

  // Tab handlers
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleManageCredits = () => {
    setActiveTab(1); // Switch to Billing tab
  };

  const handleViewBilling = () => {
    setActiveTab(1); // Switch to Billing tab
  };

  const handleManageSubscription = () => {
    window.location.href = "/dashboard/payments";
  };

  // Calculate enhanced summary with quickStats
  const enhancedSummary = React.useMemo(() => {
    const quickStatsData = quickStats;

    return {
      monthlySpend:
        quickStatsData?.monthlyComparison?.currentMonth?.credits || 2499,
      vsLastMonth: quickStatsData?.monthlyComparison?.changePercent || -12,
      dailyAverage: quickStatsData?.averageDailyCredits || 108,
      projectedMonthly: quickStatsData?.projectedUsage?.projectedTotal || 3240,
      totalPaid: 12497,
      invoicesThisQuarter: 3,
    };
  }, [quickStats]);

  // Calculate credit metrics using real Quick Stats data
  const creditMetrics = React.useMemo(() => {
    const balance = quickStats?.balance;
    const lastRechargeAmount = quickStats?.lastRechargeAmount || 5000;

    if (!balance) {
      // Fallback to original values if no balance data
      return {
        current: currentCredits,
        max: maxCredits,
        usedPercentage: creditPercentage,
        resetsIn: "No Reset",
      };
    }

    const current = balance.totalAvailable;
    const max = lastRechargeAmount;
    const usedPercentage =
      max > 0
        ? Math.max(0, Math.min(100, Math.round(((max - current) / max) * 100)))
        : 0;

    return {
      current: current,
      max: max,
      usedPercentage: usedPercentage,
      resetsIn: "No Reset",
    };
  }, [quickStats, currentCredits, maxCredits, creditPercentage]);

  const spendingMetrics = {
    monthlySpend: enhancedSummary.monthlySpend,
    vsLastMonth: enhancedSummary.vsLastMonth,
    dailyAverage: enhancedSummary.dailyAverage,
    projectedMonthly: enhancedSummary.projectedMonthly,
  };

  const systemStatus = {
    isActive: true,
    nextBill: "Aug 1, 2024",
    autoPayEnabled: true,
    usageLevel: "Normal" as const,
    planStatus: "Active" as const,
  };

  const planInfo = {
    name: "Pro Plan",
    price: 4999,
    currency: "₹",
    paymentMethod: {
      type: "Visa",
      last4: "1234",
      expiry: "04/27",
    },
  };

  const autoRechargeConfig = {
    enabled: autoRechargeEnabled,
    threshold: 50,
    amount: 1000,
    nextCheck: "2 days",
  };

  // Show loading state if quick stats are loading
  if (quickStatsLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          sx={{
            minHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stack alignItems="center" spacing={3}>
            <Box
              sx={{
                p: 3,
                borderRadius: `${brand.borderRadius}px`,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 2px 4px rgba(0, 0, 0, 0.3)"
                    : "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <DiamondIcon
                animate
                size={32}
                sx={{ color: theme.palette.primary.contrastText }}
              />
            </Box>
            <CircularProgress
              size={40}
              sx={{ color: theme.palette.primary.main }}
            />
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Loading Cr3ditSys...
            </Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  const hasError = quickStatsError || invoicesError;
  const errorMessage =
    quickStatsError?.message || invoicesError?.message || "Failed to load data";

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Error Alert */}
      {hasError && (
        <Alert
          severity="error"
          sx={{
            borderRadius: `${brand.borderRadius * 0.75}px`,
            mb: 3,
            bgcolor: alpha(theme.palette.error.main, 0.05),
            border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRefresh}
              sx={{
                fontFamily: brand.fonts.body,
                textTransform: "none",
              }}
            >
              Retry
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      )}

      {/* Centered Tab Navigation */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          sx={{
            "& .MuiTabs-indicator": {
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
              minHeight: 48,
              minWidth: 120,
              mx: 2,
              color: "text.secondary",
              transition: "all 0.2s ease",
              fontFamily: brand.fonts.heading,
              "&.Mui-selected": {
                color: theme.palette.primary.main,
                background: "transparent",
              },
              "&:hover": {
                background: "transparent",
                color: alpha(theme.palette.primary.main, 0.8),
              },
              "& .MuiSvgIcon-root": {
                transition: "color 0.2s ease",
              },
              "&.Mui-selected .MuiSvgIcon-root": {
                color: theme.palette.primary.main,
              },
            },
            "& .MuiTabs-flexContainer": {
              gap: 3,
            },
          }}
        >
          <Tab
            icon={<DashboardIcon />}
            iconPosition="start"
            label="Dashboard"
          />
          <Tab icon={<BillingIcon />} iconPosition="start" label="Billing" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Dashboard
          quickStats={quickStats}
          quickStatsLoading={quickStatsLoading}
          quickStatsError={quickStatsError}
          onManageCredits={handleManageCredits}
          onViewBilling={handleViewBilling}
          onManageSubscription={handleManageSubscription}
        />
      )}

      {activeTab === 1 && (
        <Box>
          {/* Header for Billing Tab */}
          <Box sx={{ mb: 4, display: "flex", justifyContent: "flex-end" }}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Download />}
                size="small"
                sx={{
                  borderRadius: `${brand.borderRadius * 0.75}px`,
                  textTransform: "none",
                  fontWeight: 600,
                  fontFamily: brand.fonts.body,
                }}
              >
                Export
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={
                  quickStatsLoading || invoicesLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Refresh />
                  )
                }
                onClick={handleRefresh}
                disabled={quickStatsLoading || invoicesLoading}
                size="small"
                sx={{
                  borderRadius: `${brand.borderRadius * 0.75}px`,
                  textTransform: "none",
                  fontWeight: 600,
                  fontFamily: brand.fonts.body,
                }}
              >
                {quickStatsLoading || invoicesLoading
                  ? "Refreshing..."
                  : "Refresh"}
              </Button>
            </Stack>
          </Box>

          {/* Integrated Dashboard Card - Pass recent invoices and shared refresh */}
          <Box sx={{ mb: 4 }}>
            <BillingCard
              creditMetrics={creditMetrics}
              spendingMetrics={spendingMetrics}
              systemStatus={systemStatus}
              planInfo={planInfo}
              autoRechargeSettings={autoRechargeConfig}
              recentInvoices={recentInvoices}
              loading={invoicesLoading}
              totalPaid={enhancedSummary.totalPaid}
              invoicesThisQuarter={enhancedSummary.invoicesThisQuarter}
              quickStats={quickStats}
              onAddCredits={() => setShowAddCredits(true)}
              onManagePlan={() => console.log("Manage plan clicked")}
              onViewAllInvoices={() => console.log("View all invoices clicked")}
              onAutoRechargeToggle={setAutoRechargeEnabled}
              onRefresh={handleRefresh}
              onSharedRefresh={handleSharedRefresh}
            />
          </Box>

          {/* API Call History & Usage Analytics */}
          <Box sx={{ mb: 4 }}>
            <ApiUsageAnalytics />
          </Box>
        </Box>
      )}

      {/* Modals */}
      <AddCreditsModal
        open={showAddCredits}
        onOpenChange={() => setShowAddCredits(false)}
        currentCredits={creditMetrics.current}
        onCreditsAdded={handleCreditsAdded}
      />

      {/* Credit Sheet Popover */}
      {creditSheetAnchor && showCreditSheet && (
        <Box
          sx={{
            position: "fixed",
            top: creditSheetAnchor.getBoundingClientRect().bottom + 10,
            left: creditSheetAnchor.getBoundingClientRect().left,
            zIndex: 1300,
          }}
        >
          <CreditMiniSheet
            credits={creditMetrics.current}
            maxCredits={creditMetrics.max}
            onAddCredits={() => {
              setShowCreditSheet(false);
              setCreditSheetAnchor(null);
              setShowAddCredits(true);
            }}
          />
        </Box>
      )}

      {/* Click away listener for credit sheet */}
      {showCreditSheet && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
          }}
          onClick={() => {
            setShowCreditSheet(false);
            setCreditSheetAnchor(null);
          }}
        />
      )}
    </Container>
  );
};

export default Cr3ditSys;
