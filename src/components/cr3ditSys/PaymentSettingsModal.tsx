"use client";

import {
  useState,
  useEffect,
  useCallback,
  startTransition,
  Suspense,
} from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  TextField,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Alert,
  FormControlLabel,
  Stack,
  CircularProgress,
  Tabs,
  Tab,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  CreditCard,
  Trash2,
  Plus,
  Settings,
  Bell,
  Building,
  X,
  Save,
  Zap,
} from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  fetchPaymentSettings,
  updatePaymentSettings,
  updateAutoRechargeSettings,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  validateAutoRechargeSettings,
  validateGSTIN,
  formatPaymentMethodDisplay,
  type PaymentSettings,
  type PaymentMethod,
  type AutoRechargeSettings,
  type AddPaymentMethodRequest,
  type GSTInfo,
  type Address,
} from "@/services/paymentSettings";
import AddressSection from "@/components/profile/AddressSection";
import { GSTINDetails } from "@/components/payments/GSTINDetails";
import { Address as ProfileAddress } from "@/types/profile";

interface PaymentSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSettingsUpdated?: (settings: PaymentSettings) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2 }}>
    {value === index && children}
  </Box>
);

// Loading skeleton for payment methods
const PaymentMethodsSkeleton = () => (
  <Stack spacing={2}>
    {[1, 2].map((i) => (
      <Card key={i} variant="outlined" sx={{ borderRadius: "8px" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Skeleton variant="circular" width={24} height={24} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
            <Skeleton variant="rectangular" width={80} height={32} />
          </Box>
        </CardContent>
      </Card>
    ))}
  </Stack>
);

export function PaymentSettingsModal({
  open,
  onClose,
  onSettingsUpdated,
}: PaymentSettingsModalProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettings | null>(null);
  const [autoRechargeForm, setAutoRechargeForm] = useState<
    Partial<AutoRechargeSettings>
  >({});
  const [gstForm, setGstForm] = useState<{
    gstin: string;
    companyName: string;
    address: ProfileAddress;
  }>({
    gstin: "",
    companyName: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "IN",
    },
  });
  const [notificationSettings, setNotificationSettings] = useState({
    lowBalanceAlert: true,
    preRechargeNotification: true,
    postRechargeNotification: true,
    failureAlerts: true,
  });

  // New Payment Method State
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState<
    Partial<AddPaymentMethodRequest>
  >({
    type: "card",
    isDefault: false,
  });

  // Load payment settings
  useEffect(() => {
    if (open) {
      loadPaymentSettings();
    }
  }, [open]);

  const loadPaymentSettings = async () => {
    try {
      setLoading(true);
      const settings = await fetchPaymentSettings();
      setPaymentSettings(settings);
      setAutoRechargeForm(settings.autoRecharge.settings);

      if (settings.gstInfo) {
        setGstForm({
          gstin: settings.gstInfo.gstin || "",
          companyName: settings.gstInfo.companyName || "",
          address: {
            street: settings.gstInfo.address?.line1 || "",
            city: settings.gstInfo.address?.city || "",
            state: settings.gstInfo.address?.state || "",
            postalCode: settings.gstInfo.address?.postalCode || "",
            country: settings.gstInfo.address?.country || "IN",
          },
        });
      }

      setNotificationSettings(settings.autoRecharge.notifications);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAutoRecharge = useCallback(async () => {
    if (!paymentSettings) return;

    // Validate settings
    const validationErrors = validateAutoRechargeSettings(autoRechargeForm);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      return;
    }

    try {
      setSaving(true);
      const updatedAutoRecharge = await updateAutoRechargeSettings({
        ...paymentSettings.autoRecharge,
        settings: {
          ...paymentSettings.autoRecharge.settings,
          ...autoRechargeForm,
        },
        notifications: notificationSettings,
      });

      const updatedSettings = {
        ...paymentSettings,
        autoRecharge: updatedAutoRecharge,
      };

      startTransition(() => {
        setPaymentSettings(updatedSettings);
        onSettingsUpdated?.(updatedSettings);
        setSuccess("Auto-recharge settings updated successfully");
        setError(null);
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update settings"
      );
    } finally {
      setSaving(false);
    }
  }, [
    paymentSettings,
    autoRechargeForm,
    notificationSettings,
    onSettingsUpdated,
  ]);

  const handleSaveGSTInfo = useCallback(async () => {
    if (!paymentSettings) return;

    // Validate GSTIN if provided
    if (gstForm.gstin && !validateGSTIN(gstForm.gstin)) {
      setError("Invalid GSTIN format");
      return;
    }

    if (gstForm.gstin && !gstForm.companyName) {
      setError("Company name is required when GSTIN is provided");
      return;
    }

    // Validate required address fields
    if (
      !gstForm.address.street ||
      !gstForm.address.city ||
      !gstForm.address.state ||
      !gstForm.address.postalCode ||
      !gstForm.address.country
    ) {
      setError("Complete address is required for GST information");
      return;
    }

    try {
      setSaving(true);
      const gstInfo: GSTInfo = {
        gstin: gstForm.gstin,
        companyName: gstForm.companyName,
        address: {
          line1: gstForm.address.street,
          line2: "",
          city: gstForm.address.city,
          state: gstForm.address.state,
          postalCode: gstForm.address.postalCode,
          country: gstForm.address.country,
        },
      };

      const { settings } = await updatePaymentSettings({ gstInfo });

      startTransition(() => {
        setPaymentSettings(settings);
        onSettingsUpdated?.(settings);
        setSuccess("GST information updated successfully");
        setError(null);
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update GST info"
      );
    } finally {
      setSaving(false);
    }
  }, [paymentSettings, gstForm, onSettingsUpdated]);

  const handleAddPaymentMethod = useCallback(async () => {
    if (!newPaymentMethod.tokenId || !newPaymentMethod.type) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      await addPaymentMethod(newPaymentMethod as AddPaymentMethodRequest);
      await loadPaymentSettings();

      startTransition(() => {
        setShowAddPayment(false);
        setNewPaymentMethod({ type: "card", isDefault: false });
        setSuccess("Payment method added successfully");
        setError(null);
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add payment method"
      );
    } finally {
      setSaving(false);
    }
  }, [newPaymentMethod]);

  const handleRemovePaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      try {
        setSaving(true);
        await removePaymentMethod(paymentMethodId);
        await loadPaymentSettings();

        startTransition(() => {
          setSuccess("Payment method removed successfully");
          setError(null);
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to remove payment method"
        );
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const handleSetDefaultPayment = useCallback(
    async (paymentMethodId: string) => {
      try {
        setSaving(true);
        const updatedSettings = await setDefaultPaymentMethod(paymentMethodId);

        startTransition(() => {
          setPaymentSettings(updatedSettings);
          onSettingsUpdated?.(updatedSettings);
          setSuccess("Default payment method updated");
          setError(null);
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to set default payment method"
        );
      } finally {
        setSaving(false);
      }
    },
    [onSettingsUpdated]
  );

  const handleClose = useCallback(() => {
    setError(null);
    setSuccess(null);
    onClose();
  }, [onClose]);

  const handleAddressUpdate = useCallback((field: string, value: string) => {
    setGstForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  }, []);

  const handleGSTINChange = useCallback(
    (values: { gstin: string; companyName: string }, isValid: boolean) => {
      setGstForm((prev) => ({
        ...prev,
        gstin: values.gstin,
        companyName: values.companyName,
      }));
    },
    []
  );

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: number) => {
      startTransition(() => {
        setTabValue(newValue);
      });
    },
    []
  );

  if (loading && !paymentSettings) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.default",
          },
        }}
      >
        <DialogContent sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress sx={{ color: "primary.main" }} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: "background.default",
          border: `2px solid ${theme.palette.primary.main}`,
          backgroundImage: 'none'
        },
      }}
    >
      <DialogTitle>
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
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: `${brand.borderRadius}px`,
                bgcolor: "primary.main",
              }}
            >
              <Settings size={20} color={theme.palette.primary.contrastText} />
            </Box>
            <Typography
              variant="h6"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Payment Settings
            </Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Alerts */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ mb: 2, borderRadius: `${brand.borderRadius}px` }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            onClose={() => setSuccess(null)}
            sx={{ mb: 2, borderRadius: `${brand.borderRadius}px` }}
          >
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
                fontFamily: brand.fonts.body,
                color: "text.secondary",
                "&.Mui-selected": {
                  color: "primary.main",
                },
              },
              "& .MuiTabs-indicator": {
                bgcolor: "primary.main",
              },
            }}
          >
            <Tab
              icon={<Zap size={16} />}
              iconPosition="start"
              label="Auto-Recharge"
            />
            <Tab
              icon={<CreditCard size={16} />}
              iconPosition="start"
              label="Payment Methods"
            />
            <Tab
              icon={<Bell size={16} />}
              iconPosition="start"
              label="Notifications"
            />
            <Tab
              icon={<Building size={16} />}
              iconPosition="start"
              label="GST & Billing"
            />
          </Tabs>
        </Box>

        {/* Auto-Recharge Settings */}
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            <Box>
              <Typography
                variant="h6"
                gutterBottom
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Auto-Recharge Configuration
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={paymentSettings?.autoRecharge.enabled || false}
                    onChange={(e) =>
                      paymentSettings &&
                      setPaymentSettings({
                        ...paymentSettings,
                        autoRecharge: {
                          ...paymentSettings.autoRecharge,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "primary.main",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          bgcolor: "primary.main",
                        },
                    }}
                  />
                }
                label={
                  <Typography
                    color="text.primary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Enable Auto-Recharge
                  </Typography>
                }
              />
            </Box>

            {paymentSettings?.autoRecharge.enabled && (
              <>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Low Balance Threshold"
                      type="number"
                      value={autoRechargeForm.lowBalanceThreshold || ""}
                      onChange={(e) =>
                        setAutoRechargeForm((prev) => ({
                          ...prev,
                          lowBalanceThreshold: parseInt(e.target.value) || 0,
                        }))
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            credits
                          </InputAdornment>
                        ),
                      }}
                      helperText="Recharge when balance falls below this amount (100-10,000)"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Critical Balance Threshold"
                      type="number"
                      value={autoRechargeForm.criticalBalanceThreshold || ""}
                      onChange={(e) =>
                        setAutoRechargeForm((prev) => ({
                          ...prev,
                          criticalBalanceThreshold:
                            parseInt(e.target.value) || 0,
                        }))
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            credits
                          </InputAdornment>
                        ),
                      }}
                      helperText="Emergency recharge threshold (50-5,000)"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Default Recharge Amount"
                      type="number"
                      value={autoRechargeForm.defaultRechargeAmount || ""}
                      onChange={(e) =>
                        setAutoRechargeForm((prev) => ({
                          ...prev,
                          defaultRechargeAmount: parseInt(e.target.value) || 0,
                        }))
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            credits
                          </InputAdornment>
                        ),
                      }}
                      helperText="Amount to recharge automatically (1,000-100,000)"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Max Daily Recharges"
                      type="number"
                      value={autoRechargeForm.maxDailyRecharges || ""}
                      onChange={(e) =>
                        setAutoRechargeForm((prev) => ({
                          ...prev,
                          maxDailyRecharges: parseInt(e.target.value) || 0,
                        }))
                      }
                      helperText="Maximum recharges per day (1-10)"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Monthly Spend Limit"
                      type="number"
                      value={autoRechargeForm.monthlySpendLimit || ""}
                      onChange={(e) =>
                        setAutoRechargeForm((prev) => ({
                          ...prev,
                          monthlySpendLimit: parseInt(e.target.value) || 0,
                        }))
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₹</InputAdornment>
                        ),
                      }}
                      helperText="Maximum monthly spend limit (₹1,000-₹1,000,000)"
                    />
                  </Grid>
                </Grid>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoRechargeForm.smartRechargeEnabled || false}
                        onChange={(e) =>
                          setAutoRechargeForm((prev) => ({
                            ...prev,
                            smartRechargeEnabled: e.target.checked,
                          }))
                        }
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "primary.main",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                            {
                              bgcolor: "primary.main",
                            },
                        }}
                      />
                    }
                    label={
                      <Typography
                        color="text.primary"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        Smart Recharge
                      </Typography>
                    }
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Automatically adjust recharge amounts based on usage
                    patterns
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveAutoRecharge}
                    disabled={saving}
                    startIcon={
                      saving ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Save size={16} />
                      )
                    }
                    sx={{
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      fontFamily: brand.fonts.body,
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    }}
                  >
                    Save Auto-Recharge Settings
                  </Button>
                </Box>
              </>
            )}
          </Stack>
        </TabPanel>

        {/* Payment Methods */}
        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Saved Payment Methods
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Plus size={16} />}
                onClick={() => setShowAddPayment(true)}
                sx={{
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

            {/* Existing Payment Methods with Suspense */}
            <Suspense fallback={<PaymentMethodsSkeleton />}>
              <Stack spacing={2}>
                {paymentSettings?.savedPaymentMethods.map((method) => (
                  <Card
                    key={method.id}
                    variant="outlined"
                    sx={{
                      borderRadius: `${brand.borderRadius}px`,
                      borderColor: "divider",
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <CreditCard
                          size={24}
                          color={theme.palette.primary.main}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            color="text.primary"
                            sx={{ fontFamily: brand.fonts.heading }}
                          >
                            {formatPaymentMethodDisplay(method)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontFamily: brand.fonts.body }}
                          >
                            Added{" "}
                            {new Date(method.addedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box
                          sx={{ display: "flex", gap: 1, alignItems: "center" }}
                        >
                          {method.isDefault && (
                            <Chip
                              label="Default"
                              color="primary"
                              size="small"
                              sx={{ fontFamily: brand.fonts.body }}
                            />
                          )}
                          {!method.isDefault && (
                            <Button
                              size="small"
                              onClick={() => handleSetDefaultPayment(method.id)}
                              sx={{
                                color: "primary.main",
                                fontFamily: brand.fonts.body,
                                "&:hover": {
                                  bgcolor: "action.hover",
                                },
                              }}
                            >
                              Set Default
                            </Button>
                          )}
                          <IconButton
                            color="error"
                            onClick={() => handleRemovePaymentMethod(method.id)}
                            disabled={saving}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}

                {(!paymentSettings?.savedPaymentMethods ||
                  paymentSettings.savedPaymentMethods.length === 0) && (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography
                      color="text.secondary"
                      sx={{ fontFamily: brand.fonts.body }}
                    >
                      No payment methods configured yet
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Suspense>

            {/* Add Payment Method Form */}
            {showAddPayment && (
              <Card
                variant="outlined"
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
                  borderColor: "divider",
                }}
              >
                <CardContent>
                  <Stack spacing={3}>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color="text.primary"
                      sx={{ fontFamily: brand.fonts.heading }}
                    >
                      Add New Payment Method
                    </Typography>

                    <FormControl fullWidth>
                      <InputLabel>Payment Type</InputLabel>
                      <Select
                        value={newPaymentMethod.type || "card"}
                        label="Payment Type"
                        onChange={(e) =>
                          setNewPaymentMethod((prev) => ({
                            ...prev,
                            type: e.target.value as "card" | "upi" | "emandate",
                          }))
                        }
                      >
                        <MenuItem value="card">Credit/Debit Card</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                        <MenuItem value="emandate">E-mandate</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Token ID"
                      value={newPaymentMethod.tokenId || ""}
                      onChange={(e) =>
                        setNewPaymentMethod((prev) => ({
                          ...prev,
                          tokenId: e.target.value,
                        }))
                      }
                      helperText="Payment gateway token ID"
                      required
                    />

                    {newPaymentMethod.type === "card" && (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Last 4 Digits"
                            value={newPaymentMethod.last4 || ""}
                            onChange={(e) =>
                              setNewPaymentMethod((prev) => ({
                                ...prev,
                                last4: e.target.value,
                              }))
                            }
                            inputProps={{ maxLength: 4 }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            label="Card Network"
                            value={newPaymentMethod.network || ""}
                            onChange={(e) =>
                              setNewPaymentMethod((prev) => ({
                                ...prev,
                                network: e.target.value,
                              }))
                            }
                            placeholder="Visa, Mastercard, etc."
                          />
                        </Grid>
                      </Grid>
                    )}

                    {newPaymentMethod.type === "upi" && (
                      <TextField
                        fullWidth
                        label="UPI VPA"
                        value={newPaymentMethod.upiVPA || ""}
                        onChange={(e) =>
                          setNewPaymentMethod((prev) => ({
                            ...prev,
                            upiVPA: e.target.value,
                          }))
                        }
                        placeholder="user@paytm"
                      />
                    )}

                    {newPaymentMethod.type === "emandate" && (
                      <TextField
                        fullWidth
                        label="Bank Name"
                        value={newPaymentMethod.bankName || ""}
                        onChange={(e) =>
                          setNewPaymentMethod((prev) => ({
                            ...prev,
                            bankName: e.target.value,
                          }))
                        }
                      />
                    )}

                    <FormControlLabel
                      control={
                        <Switch
                          checked={newPaymentMethod.isDefault || false}
                          onChange={(e) =>
                            setNewPaymentMethod((prev) => ({
                              ...prev,
                              isDefault: e.target.checked,
                            }))
                          }
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "primary.main",
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                              {
                                bgcolor: "primary.main",
                              },
                          }}
                        />
                      }
                      label={
                        <Typography
                          color="text.primary"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          Set as default payment method
                        </Typography>
                      }
                    />

                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleAddPaymentMethod}
                        disabled={saving}
                        startIcon={
                          saving ? (
                            <CircularProgress size={16} />
                          ) : (
                            <Plus size={16} />
                          )
                        }
                        sx={{
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          fontFamily: brand.fonts.body,
                          "&:hover": {
                            bgcolor: "primary.dark",
                          },
                        }}
                      >
                        Add Payment Method
                      </Button>
                      <Button
                        onClick={() => setShowAddPayment(false)}
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </TabPanel>

        {/* Notification Settings */}
        <TabPanel value={tabValue} index={2}>
          <Stack spacing={3}>
            <Typography
              variant="h6"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Notification Preferences
            </Typography>

            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.lowBalanceAlert}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        lowBalanceAlert: e.target.checked,
                      }))
                    }
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "primary.main",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          bgcolor: "primary.main",
                        },
                    }}
                  />
                }
                label={
                  <Typography
                    color="text.primary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Low Balance Alerts
                  </Typography>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.preRechargeNotification}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        preRechargeNotification: e.target.checked,
                      }))
                    }
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "primary.main",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          bgcolor: "primary.main",
                        },
                    }}
                  />
                }
                label={
                  <Typography
                    color="text.primary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Pre-Recharge Notifications
                  </Typography>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.postRechargeNotification}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        postRechargeNotification: e.target.checked,
                      }))
                    }
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "primary.main",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          bgcolor: "primary.main",
                        },
                    }}
                  />
                }
                label={
                  <Typography
                    color="text.primary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Post-Recharge Confirmations
                  </Typography>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.failureAlerts}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        failureAlerts: e.target.checked,
                      }))
                    }
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "primary.main",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          bgcolor: "primary.main",
                        },
                    }}
                  />
                }
                label={
                  <Typography
                    color="text.primary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Payment Failure Alerts
                  </Typography>
                }
              />
            </Stack>

            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                onClick={handleSaveAutoRecharge}
                disabled={saving}
                startIcon={
                  saving ? <CircularProgress size={16} /> : <Save size={16} />
                }
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                  minWidth: "200px",
                }}
              >
                Save Notification Settings
              </Button>
            </Box>
          </Stack>
        </TabPanel>

        {/* GST & Billing */}
        <TabPanel value={tabValue} index={3}>
          <Stack spacing={3}>
            <Typography
              variant="h6"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              GST Information & Billing Address
            </Typography>

            <GSTINDetails
              gstin={gstForm.gstin}
              companyName={gstForm.companyName}
              onChange={handleGSTINChange}
            />

            <AddressSection
              address={gstForm.address}
              onUpdate={handleAddressUpdate}
            />

            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                onClick={handleSaveGSTInfo}
                disabled={saving}
                startIcon={
                  saving ? <CircularProgress size={16} /> : <Save size={16} />
                }
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                  minWidth: "200px",
                }}
              >
                Save GST Information
              </Button>
            </Box>
          </Stack>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={handleClose}
          sx={{
            color: "text.secondary",
            fontFamily: brand.fonts.body,
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PaymentSettingsModal;
