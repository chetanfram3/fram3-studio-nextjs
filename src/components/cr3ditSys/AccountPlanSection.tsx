"use client";

import {
  useState,
  useEffect,
  useCallback,
  startTransition,
  Suspense,
} from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Chip,
  Stack,
  Switch,
  CircularProgress,
  Alert,
  IconButton,
  Skeleton,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { CreditCard, Settings, Zap, AlertCircle, Edit } from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  fetchPaymentSettings,
  updateAutoRechargeSettings,
  fetchAutoRechargeStatus,
  type PaymentSettings,
  type AutoRechargeStatus,
  needsAutoRechargeAttention,
} from "@/services/paymentSettings";
import PaymentSettingsModal from "./PaymentSettingsModal";

interface AccountPlanSectionProps {
  className?: string;
}

// Loading Skeleton Component
const AccountPlanSkeleton = () => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Grid size={{ xs: 12, lg: 6 }}>
      <Stack spacing={3}>
        <Box
          sx={{
            p: 3,
            borderRadius: `${brand.borderRadius}px`,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Skeleton
            variant="rectangular"
            width="100%"
            height={120}
            sx={{ borderRadius: `${brand.borderRadius}px` }}
          />
        </Box>
        <Box
          sx={{
            p: 3,
            borderRadius: `${brand.borderRadius}px`,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Skeleton
            variant="rectangular"
            width="100%"
            height={180}
            sx={{ borderRadius: `${brand.borderRadius}px` }}
          />
        </Box>
      </Stack>
    </Grid>
  );
};

// Credit Balance Card Component
const CreditBalanceCard = ({
  defaultPaymentMethod,
  autoRechargeStatus,
  onOpenSettings,
}: {
  defaultPaymentMethod: any;
  autoRechargeStatus: AutoRechargeStatus | null;
  onOpenSettings: () => void;
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: `${brand.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
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
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0px 4px 6px -1px rgba(0, 0, 0, 0.2), 0px 2px 4px -1px rgba(0, 0, 0, 0.12), 0 0 8px rgba(124, 58, 237, 0.2)"
                  : "0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          >
            <Zap size={24} color={theme.palette.primary.contrastText} />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Credit Balance
            </Typography>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              {autoRechargeStatus?.currentBalance || 0} credits available
            </Typography>
          </Box>
        </Box>
        <Chip
          label={autoRechargeStatus?.isLowBalance ? "Low Balance" : "Active"}
          color={autoRechargeStatus?.isLowBalance ? "warning" : "success"}
          size="small"
          sx={{ fontFamily: brand.fonts.body }}
        />
      </Box>

      {defaultPaymentMethod ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, pt: 2 }}>
          <Box
            sx={{
              p: 1,
              width: 48,
              height: 48,
              borderRadius: `${brand.borderRadius * 4}px`,
              bgcolor: alpha(theme.palette.action.selected, 0.05),
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0px 4px 6px -1px rgba(0, 0, 0, 0.2), 0px 2px 4px -1px rgba(0, 0, 0, 0.12)"
                  : "0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          >
            <CreditCard size={20} color={theme.palette.primary.main} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              {defaultPaymentMethod.network || defaultPaymentMethod.type} ••••{" "}
              {defaultPaymentMethod.last4}
            </Typography>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              {defaultPaymentMethod.type === "card" &&
              defaultPaymentMethod.expiryMonth &&
              defaultPaymentMethod.expiryYear
                ? `Expires ${defaultPaymentMethod.expiryMonth.toString().padStart(2, "0")}/${defaultPaymentMethod.expiryYear
                    .toString()
                    .slice(-2)}`
                : defaultPaymentMethod.type === "upi"
                  ? `UPI: ${defaultPaymentMethod.upiVPA}`
                  : `${defaultPaymentMethod.type.toUpperCase()} Payment`}
            </Typography>
          </Box>
          <Button
            size="medium"
            variant="text"
            onClick={onOpenSettings}
            sx={{
              borderRadius: `${brand.borderRadius * 5}px`,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              minWidth: "auto",
              px: 2,
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            <Edit size={16} />
          </Button>
        </Box>
      ) : (
        <Box sx={{ pt: 2, textAlign: "center" }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1, fontFamily: brand.fonts.body }}
          >
            No payment methods configured
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={onOpenSettings}
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              borderColor: "primary.main",
              color: "primary.main",
              fontFamily: brand.fonts.body,
              "&:hover": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                borderColor: "primary.main",
              },
            }}
          >
            Add Payment Method
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Auto-Recharge Card Component
const AutoRechargeCard = ({
  paymentSettings,
  autoRechargeStatus,
  updating,
  needsAttention,
  onToggle,
  onOpenSettings,
}: {
  paymentSettings: PaymentSettings | null;
  autoRechargeStatus: AutoRechargeStatus | null;
  updating: boolean;
  needsAttention: boolean;
  onToggle: (enabled: boolean) => void;
  onOpenSettings: () => void;
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: `${brand.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
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
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0px 4px 6px -1px rgba(0, 0, 0, 0.2), 0px 2px 4px -1px rgba(0, 0, 0, 0.12), 0 0 8px rgba(29, 78, 216, 0.2)"
                  : "0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          >
            <Settings size={24} color={theme.palette.primary.contrastText} />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Auto-Recharge
              {needsAttention && (
                <IconButton size="small" sx={{ ml: 1 }}>
                  <AlertCircle size={16} color={theme.palette.warning.main} />
                </IconButton>
              )}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Smart credit management
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {updating && (
            <CircularProgress size={16} sx={{ color: "primary.main" }} />
          )}
          <Switch
            checked={paymentSettings?.autoRecharge.enabled || false}
            onChange={(e) => onToggle(e.target.checked)}
            disabled={updating}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "primary.main",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                bgcolor: "primary.main",
              },
            }}
          />
        </Box>
      </Box>

      {paymentSettings?.autoRecharge.enabled && (
        <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={6}>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Threshold
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                {paymentSettings.autoRecharge.settings.lowBalanceThreshold}{" "}
                credits
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Amount
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                {paymentSettings.autoRecharge.settings.defaultRechargeAmount}{" "}
                credits
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: autoRechargeStatus?.willTriggerSoon
                  ? "warning.main"
                  : "success.main",
                animation: "pulse 2s infinite",
              }}
            />
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              {autoRechargeStatus?.willTriggerSoon
                ? "Will trigger soon"
                : autoRechargeStatus?.isLowBalance
                  ? "Low balance detected"
                  : "Active and monitoring"}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Recommendations */}
      {autoRechargeStatus?.recommendations &&
        autoRechargeStatus.recommendations.length > 0 && (
          <Box sx={{ pt: 2 }}>
            {autoRechargeStatus.recommendations
              .slice(0, 2)
              .map((rec, index) => (
                <Alert
                  key={index}
                  severity={rec.priority === "high" ? "warning" : "info"}
                  sx={{
                    mt: 1,
                    borderRadius: `${brand.borderRadius}px`,
                    border: `1px solid ${theme.palette.divider}`,
                    fontFamily: brand.fonts.body,
                    backgroundColor: 'background-paper'
                  }}
                  action={
                    <Button
                      size="small"
                      onClick={onOpenSettings}
                      sx={{
                        color:
                          rec.priority === "high"
                            ? "warning.main"
                            : "info.main",
                        fontFamily: brand.fonts.body,
                        "&:hover": {
                          bgcolor:
                            rec.priority === "high"
                              ? "warning.light"
                              : "info.light",
                        },
                      }}
                    >
                      Configure
                    </Button>
                  }
                >
                  {rec.message}
                </Alert>
              ))}
          </Box>
        )}

      {/* Settings Button */}
      <Box sx={{ pt: 2, display: "flex", justifyContent: "center" }}>
        <Button
          variant="outlined"
          size="small"
          onClick={onOpenSettings}
          startIcon={<Settings size={16} />}
          sx={{
            borderRadius: `${brand.borderRadius}px`,
            borderColor: "primary.main",
            color: "primary.main",
            fontFamily: brand.fonts.body,
            "&:hover": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              borderColor: "primary.main",
            },
          }}
        >
          Payment Settings
        </Button>
      </Box>
    </Box>
  );
};

// Main Component
export function AccountPlanSection({ className }: AccountPlanSectionProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettings | null>(null);
  const [autoRechargeStatus, setAutoRechargeStatus] =
    useState<AutoRechargeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSettingsOpen, setPaymentSettingsOpen] = useState(false);

  const handleOpenPaymentSettings = useCallback(() => {
    startTransition(() => {
      setPaymentSettingsOpen(true);
    });
  }, []);

  const handleClosePaymentSettings = useCallback(() => {
    startTransition(() => {
      setPaymentSettingsOpen(false);
    });
  }, []);

  const handleSettingsUpdated = useCallback(
    async (updatedSettings: PaymentSettings) => {
      setPaymentSettings(updatedSettings);
      try {
        const status = await fetchAutoRechargeStatus();
        startTransition(() => {
          setAutoRechargeStatus(status);
        });
      } catch (err) {
        console.error("Error refreshing auto-recharge status:", err);
      }
    },
    []
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [settings, status] = await Promise.all([
          fetchPaymentSettings(),
          fetchAutoRechargeStatus(),
        ]);

        startTransition(() => {
          setPaymentSettings(settings);
          setAutoRechargeStatus(status);
          setError(null);
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load payment settings"
        );
        console.error("Error loading payment settings:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAutoRechargeToggle = useCallback(
    async (enabled: boolean) => {
      if (!paymentSettings) return;

      try {
        setUpdating(true);

        const updatedAutoRecharge = await updateAutoRechargeSettings({
          ...paymentSettings.autoRecharge,
          enabled,
        });

        const updatedStatus = await fetchAutoRechargeStatus();

        startTransition(() => {
          setPaymentSettings((prev) =>
            prev
              ? {
                  ...prev,
                  autoRecharge: updatedAutoRecharge,
                }
              : null
          );
          setAutoRechargeStatus(updatedStatus);
          setError(null);
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to update auto-recharge settings"
        );
        console.error("Error updating auto-recharge:", err);
      } finally {
        setUpdating(false);
      }
    },
    [paymentSettings]
  );

  if (loading) {
    return <AccountPlanSkeleton />;
  }

  if (error && !paymentSettings) {
    return (
      <Grid size={{ xs: 12, lg: 6 }} className={className}>
        <Alert
          severity="error"
          sx={{
            m: 2,
            borderRadius: `${brand.borderRadius}px`,
            fontFamily: brand.fonts.body,
          }}
        >
          {error}
        </Alert>
      </Grid>
    );
  }

  const defaultPaymentMethod =
    paymentSettings?.savedPaymentMethods.find(
      (method) =>
        method.isDefault ||
        method.id === paymentSettings.preferences.defaultPaymentMethod
    ) || paymentSettings?.savedPaymentMethods[0];

  const needsAttention = autoRechargeStatus
    ? needsAutoRechargeAttention(autoRechargeStatus)
    : false;

  return (
    <Grid size={{ xs: 12, lg: 6 }} className={className}>
      <Stack spacing={3}>
        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              fontFamily: brand.fonts.body,
            }}
          >
            {error}
          </Alert>
        )}

        {/* Credit Balance Card */}
        <Suspense
          fallback={
            <Box
              sx={{
                p: 3,
                borderRadius: `${brand.borderRadius}px`,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Skeleton variant="rectangular" width="100%" height={120} />
            </Box>
          }
        >
          <CreditBalanceCard
            defaultPaymentMethod={defaultPaymentMethod}
            autoRechargeStatus={autoRechargeStatus}
            onOpenSettings={handleOpenPaymentSettings}
          />
        </Suspense>

        {/* Auto-Recharge Card */}
        <Suspense
          fallback={
            <Box
              sx={{
                p: 3,
                borderRadius: `${brand.borderRadius}px`,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Skeleton variant="rectangular" width="100%" height={180} />
            </Box>
          }
        >
          <AutoRechargeCard
            paymentSettings={paymentSettings}
            autoRechargeStatus={autoRechargeStatus}
            updating={updating}
            needsAttention={needsAttention}
            onToggle={handleAutoRechargeToggle}
            onOpenSettings={handleOpenPaymentSettings}
          />
        </Suspense>

        {/* Payment Settings Modal */}
        <PaymentSettingsModal
          open={paymentSettingsOpen}
          onClose={handleClosePaymentSettings}
          onSettingsUpdated={handleSettingsUpdated}
        />
      </Stack>
    </Grid>
  );
}

export default AccountPlanSection;
