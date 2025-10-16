// src/components/credits/AddCreditsModal.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  styled,
  useTheme,
  alpha,
  Avatar,
  Typography,
  Button,
  TextField,
  InputAdornment,
  LinearProgress,
  Slider,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Close,
  Add,
  Remove,
  CreditCard,
  Security,
  CardGiftcard as Gift,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import DiamondIcon from "@/components/common/DiamondIcon";
import {
  getPaymentConfig,
  createOrder,
  verifyPayment,
  formatCredits,
  formatCurrency,
  validateCreditPackage,
  type PackageInfo,
  type VerifyPaymentParams,
  type EnhancedOrderData,
  type TaxDetails,
  type PaymentConfig,
  type GSTConfig,
} from "@/services/payments";
import { ProfileTaxService } from "@/services/profileTaxService";
import { SuccessErrorDialogs } from "@/components/payments/SuccessErrorDialogs";
import { calculateCustomPrice, type CustomPricing } from "@/utils/pricingUtils";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import CustomToast from "@/components/common/CustomToast";

// ===========================
// TYPE DEFINITIONS
// ===========================

declare global {
  interface Window {
    Razorpay: unknown;
  }
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface AddCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCredits?: number;
  onCreditsAdded?: (credits: number) => void;
}

interface PaymentResultData {
  credits: {
    loaded: number;
    newBalance: number;
  };
  transactionId: string;
  paymentDetails: unknown;
  gstCompliance: unknown;
}

// ===========================
// STYLED COMPONENTS
// ===========================

const CompactDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: "16px",
    border: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.paper,
    boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.15)}`,
    maxWidth: "420px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "hidden",
  },
}));

const GradientAvatar = styled(Avatar)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  borderRadius: "12px",
  width: 32,
  height: 32,
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
}));

const CompactButton = styled(IconButton)(({ theme }) => ({
  background: "transparent",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: "12px",
  width: 40,
  height: 40,
  color: theme.palette.text.primary,
  transition: "all 0.2s ease",
  "&:hover": {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderColor: theme.palette.primary.main,
    transform: "scale(0.95)",
  },
  "&:disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
}));

const CompactTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    background: theme.palette.background.default,
    borderRadius: "12px",
    border: `1px solid ${theme.palette.divider}`,
    "& fieldset": {
      border: "none",
    },
    "&:hover": {
      borderColor: theme.palette.primary.main,
    },
    "&.Mui-focused": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
  "& .MuiInputBase-input": {
    fontWeight: 600,
    fontSize: "0.95rem",
    textAlign: "center",
  },
}));

const CompactSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.primary.main,
  height: 6,
  "& .MuiSlider-track": {
    border: "none",
    background: theme.palette.primary.main,
  },
  "& .MuiSlider-thumb": {
    height: 20,
    width: 20,
    backgroundColor: "#fff",
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    "&:focus, &:hover, &.Mui-active": {
      boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.4)}`,
    },
  },
  "& .MuiSlider-rail": {
    background: alpha(theme.palette.text.primary, 0.1),
  },
}));

const PayButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: "12px",
  fontWeight: 600,
  textTransform: "none",
  padding: "12px 24px",
  fontSize: "1rem",
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
  transition: "all 0.3s ease",
  "&:hover": {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    transform: "translateY(-1px)",
    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
  },
  "&:active": {
    transform: "translateY(0)",
  },
  "&.Mui-disabled": {
    background: theme.palette.action.disabledBackground,
    color: theme.palette.text.disabled,
    transform: "none",
  },
}));

const InfoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: "12px",
  background: alpha(theme.palette.primary.main, 0.05),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: "3px",
    height: "100%",
    background: theme.palette.primary.main,
    borderRadius: "0 12px 12px 0",
  },
}));

// ===========================
// MAIN COMPONENT
// ===========================

export function AddCreditsModal({
  open,
  onOpenChange,
  currentCredits = 0,
  onCreditsAdded,
}: AddCreditsModalProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Use TanStack Query hook for profile data
  const {
    data: userProfile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useProfileQuery();

  // Load profile when modal opens
  useEffect(() => {
    if (open) {
      refetchProfile();

      CustomToast.info("Loading your profile", {
        details: "This helps calculate accurate tax amounts",
        duration: 2000,
      });
    }
  }, [open, refetchProfile]);

  // Main state
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [customCredits, setCustomCredits] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<number>(450);
  const [loading, setLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidPackage, setIsValidPackage] = useState<boolean>(false);

  // Payment state
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [paymentResult, setPaymentResult] = useState<PaymentResultData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Load config when modal opens
  useEffect(() => {
    const loadConfig = async () => {
      if (!open) return;

      try {
        setLoading(true);
        const configData = await getPaymentConfig();
        setConfig(configData.data);

        CustomToast.success("Payment configuration loaded", {
          details: "Ready to configure your credit package",
          duration: 2000,
        });
      } catch (err) {
        console.error("Load config error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load configuration";
        setError(errorMessage);

        CustomToast.error("Failed to load payment configuration", {
          details: errorMessage || "Please refresh and try again",
          duration: 4000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [open]);

  // Handle credits change
  const handleCreditsChange = (value: number) => {
    if (!config) return;

    const minCredits = config.validation.minCredits;
    const maxCredits = config.validation.maxCredits;
    const newCredits = Math.max(minCredits, Math.min(value, maxCredits));

    if (value > maxCredits) {
      CustomToast.warning("Maximum credits exceeded", {
        details: `Maximum allowed is ${formatCredits(maxCredits)} credits`,
        duration: 3000,
      });
    }

    setCustomCredits(newCredits);

    const pricing = calculateCustomPrice(
      newCredits,
      config.customPricing as CustomPricing
    );
    setCustomAmount(pricing.price);
  };

  // Validate package
  useEffect(() => {
    if (!config?.validation) {
      setIsValidPackage(false);
      setValidationErrors([]);
      return;
    }

    const validation = validateCreditPackage(
      customCredits,
      customAmount,
      config.validation
    );
    setValidationErrors(validation.errors);
    setIsValidPackage(validation.isValid);
  }, [customCredits, customAmount, config]);

  // Get current package data
  const currentPackage = useMemo(() => {
    if (!config) return null;

    const pricing = calculateCustomPrice(
      customCredits,
      config.customPricing as CustomPricing
    );
    return {
      credits: customCredits,
      name: "Custom Package",
      price: customAmount,
      discount: pricing.discountPercent,
      savings: pricing.savings,
      tierName: pricing.tierName,
    };
  }, [customCredits, customAmount, config]);

  // Calculate tax
  const taxCalculation = useMemo(() => {
    if (!userProfile || !currentPackage || !config) return null;
    return ProfileTaxService.calculateTaxFromProfile(
      currentPackage.price,
      userProfile,
      config.gst as GSTConfig
    );
  }, [userProfile, currentPackage, config]);

  const finalTotal = useMemo(() => {
    if (!currentPackage || !config) return 0;

    if (taxCalculation) {
      return taxCalculation.totalAmount;
    }

    const gstRate = config.gst.rate;
    const gstAmount = Math.round((currentPackage.price * gstRate) / 100);
    return currentPackage.price + gstAmount;
  }, [currentPackage, taxCalculation, config]);

  // Payment success handler
  const handlePaymentSuccess = async (response: RazorpayResponse) => {
    try {
      // Processing toast for verification
      CustomToast.info("Verifying payment", {
        details: "Confirming your payment with bank...",
        duration: 3000,
      });

      const verifyParams: VerifyPaymentParams = {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      };

      const result = await verifyPayment(verifyParams);

      // ✅ FIX: Access result.data instead of result directly
      const verifiedCredits = result.data.credits.loaded;
      const newBalance = result.data.credits.newBalance;
      const transactionId = result.data.credits.transactionId;

      setPaymentStatus("success");
      setPaymentResult({
        credits: {
          loaded: verifiedCredits,
          newBalance: newBalance,
        },
        transactionId: transactionId,
        paymentDetails: result.data.payment,
        gstCompliance: result.data.gstCompliance,
      });

      if (onCreditsAdded) {
        onCreditsAdded(verifiedCredits);
      }

      // Success toast with verified data
      CustomToast.success("Payment verified successfully", {
        details: `${formatCredits(
          verifiedCredits
        )} credits added • Transaction ID: ${transactionId}`,
        duration: 4000,
      });

      console.log("✅ Payment verification complete:", {
        credits: verifiedCredits,
        newBalance: newBalance,
        transactionId: transactionId,
        gstCompliant: result.data.gstCompliance?.gstRate,
      });
    } catch (err: any) {
      setPaymentStatus("error");
      setError("Payment verification failed. Please contact support.");
      console.error("Payment verification error:", err);

      // Error toast for verification failure
      CustomToast.error("Payment verification failed", {
        details: "Please contact support with your payment ID",
        duration: 6000,
      });
    }
  };

  // Direct payment handler
  const handleDirectPayment = async () => {
    try {
      if (!isValidPackage || !config) {
        CustomToast.warning("Please fix validation errors", {
          details: "Check the highlighted issues above",
          duration: 3000,
        });
        return;
      }

      setPaymentStatus("processing");
      setError(null);

      CustomToast.info("Preparing your payment", {
        details: "Setting up secure payment gateway...",
        duration: 3000,
      });

      const credits = customCredits;
      const amount = customAmount;
      const packageName = `${formatCredits(credits)} Credits`;
      const pricing = calculateCustomPrice(
        credits,
        config.customPricing as CustomPricing
      );
      const discount = pricing.discountPercent;

      let finalAmount = amount;
      let taxDetails: TaxDetails | undefined = undefined;

      if (userProfile) {
        const taxCalculation = ProfileTaxService.calculateTaxFromProfile(
          amount,
          userProfile,
          config.gst as GSTConfig
        );
        finalAmount = taxCalculation.totalAmount;

        taxDetails = {
          baseAmount: taxCalculation.baseAmount,
          gstAmount: taxCalculation.gstAmount,
          totalAmount: taxCalculation.totalAmount,
          taxType: taxCalculation.taxType as "CGST+SGST" | "IGST",
          isInterState: taxCalculation.isInterState,
          customerType: taxCalculation.customerType as "B2B" | "B2C",
          breakdown: {
            cgst: taxCalculation.breakdown.cgst,
            sgst: taxCalculation.breakdown.sgst,
            igst: taxCalculation.breakdown.igst,
          },
        };
      } else {
        const gstRate = config.gst.rate;
        const gstAmount = Math.round((amount * gstRate) / 100);
        finalAmount = amount + gstAmount;
        taxDetails = {
          baseAmount: amount,
          gstAmount,
          totalAmount: finalAmount,
          taxType: "IGST" as const,
          isInterState: true,
          customerType: "B2C" as const,
          breakdown: { cgst: 0, sgst: 0, igst: gstAmount },
        };
      }

      const packageInfo: PackageInfo = {
        name: packageName,
        type: "custom",
        discount: discount,
        originalPrice: amount,
      };

      const orderData: EnhancedOrderData = {
        credits,
        amount: finalAmount,
        packageInfo,
        customerDetails: userProfile
          ? {
              name:
                userProfile.displayName ||
                `${userProfile.extendedInfo?.details?.firstName || ""} ${
                  userProfile.extendedInfo?.details?.lastName || ""
                }`.trim(),
              email: userProfile.email,
              phone: userProfile.phoneNumber || "",
              gstin: userProfile.extendedInfo?.details?.gstin?.number || "",
              companyName:
                userProfile.extendedInfo?.details?.gstin?.companyName || "",
              address: {
                street:
                  userProfile.extendedInfo?.details?.address?.street || "",
                city: userProfile.extendedInfo?.details?.address?.city || "",
                state: userProfile.extendedInfo?.details?.address?.state || "",
                postalCode:
                  userProfile.extendedInfo?.details?.address?.postalCode || "",
                country:
                  userProfile.extendedInfo?.details?.address?.country || "IN",
              },
            }
          : undefined,
        taxDetails,
      };

      const orderResponse = await createOrder(orderData);

      CustomToast.success("Payment gateway ready", {
        details: "Opening secure Razorpay window...",
        duration: 2000,
      });

      const razorpayOptions = {
        key: orderResponse.data.key_id,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "FRAM3 Studio",
        description: `${formatCredits(credits)} Credits`,
        order_id: orderResponse.data.orderId,
        handler: handlePaymentSuccess,
        prefill: {
          email: userProfile?.email || "user@example.com",
          contact: userProfile?.phoneNumber || "+919999999999",
          name: userProfile?.displayName || "Customer",
        },
        theme: {
          color: theme.palette.primary.main,
        },
        modal: {
          backdropclose: false,
          escape: false,
          ondismiss: () => {
            setPaymentStatus("error");
            setError("Payment was cancelled");

            CustomToast.warning("Payment cancelled", {
              details: "You can try again anytime",
              duration: 3000,
            });
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window.Razorpay as any)(razorpayOptions);
      rzp.open();
    } catch (err) {
      setPaymentStatus("error");
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Payment failed. Please try again.";
      setError(errorMessage);
      console.error("Payment error:", err);

      CustomToast.error("Payment setup failed", {
        details: errorMessage || "Please check your connection and try again",
        duration: 5000,
      });
    }
  };

  // Success/Error handlers
  const handleComplete = () => {
    setPaymentStatus("idle");
    setPaymentResult(null);
    setError(null);
    onOpenChange(false);
  };

  const handleRetry = () => {
    setPaymentStatus("idle");
    setError(null);
  };

  const handleNavigateToBilling = () => {
    onOpenChange(false);
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setPaymentStatus("idle");
      setPaymentResult(null);
      setError(null);
    }
  }, [open]);

  if (!config || loading || profileLoading) {
    return (
      <CompactDialog
        open={open && paymentStatus !== "success" && paymentStatus !== "error"}
        onClose={() => onOpenChange(false)}
      >
        <DialogContent sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress size={40} sx={{ mb: 2, color: "primary.main" }} />
          <Typography>Loading payment configuration...</Typography>
        </DialogContent>
      </CompactDialog>
    );
  }

  const minCredits = config.validation.minCredits;
  const maxCredits = config.validation.maxCredits;
  const pricing = calculateCustomPrice(
    customCredits,
    config.customPricing as CustomPricing
  );
  const progress =
    ((customCredits - minCredits) / (maxCredits - minCredits)) * 100;

  return (
    <>
      {/* Main Compact Modal */}
      <CompactDialog
        open={open && paymentStatus !== "success" && paymentStatus !== "error"}
        onClose={() => onOpenChange(false)}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 3,
              py: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              background: theme.palette.background.default,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <GradientAvatar>
                <DiamondIcon size={16} />
              </GradientAvatar>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  fontSize="1.1rem"
                  sx={{ fontFamily: brand.fonts.heading }}
                >
                  Add Credits
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Configure your perfect amount
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => onOpenChange(false)}
              sx={{ borderRadius: "8px", p: 0.5 }}
              size="small"
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* Processing State */}
          {paymentStatus === "processing" && (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress
                size={48}
                thickness={4}
                sx={{ color: "primary.main", mb: 2 }}
              />
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                Processing Payment...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {formatCredits(customCredits)} credits •{" "}
                {formatCurrency(finalTotal)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Complete payment in Razorpay window
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  mt: 2,
                }}
              >
                <Security sx={{ fontSize: 16, color: "success.main" }} />
                <Typography
                  variant="caption"
                  color="success.main"
                  fontWeight="600"
                >
                  Secure Payment in Progress
                </Typography>
              </Box>
            </Box>
          )}

          {/* Main Content */}
          {paymentStatus === "idle" && (
            <Box sx={{ p: 3 }}>
              {/* Credits Selector */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                  Credits Amount
                </Typography>

                {/* Control Buttons */}
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <CompactButton
                    onClick={() => handleCreditsChange(customCredits - 1000)}
                    disabled={customCredits <= minCredits}
                  >
                    <Remove fontSize="small" />
                  </CompactButton>

                  <CompactTextField
                    type="number"
                    value={customCredits}
                    onChange={(e) =>
                      handleCreditsChange(parseInt(e.target.value) || 0)
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography variant="caption" color="text.secondary">
                            credits
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                    size="small"
                    inputProps={{
                      min: minCredits,
                      max: maxCredits,
                      step: 100,
                    }}
                  />

                  <CompactButton
                    onClick={() => handleCreditsChange(customCredits + 1000)}
                    disabled={customCredits >= maxCredits}
                  >
                    <Add fontSize="small" />
                  </CompactButton>
                </Box>

                {/* Slider */}
                <Box sx={{ px: 1, mb: 2 }}>
                  <CompactSlider
                    value={customCredits}
                    min={minCredits}
                    max={maxCredits}
                    step={1000}
                    onChange={(_, value) =>
                      handleCreditsChange(value as number)
                    }
                  />
                </Box>

                {/* Progress indicator */}
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Package Size
                    </Typography>
                    <Typography
                      variant="caption"
                      color="primary.main"
                      fontWeight="600"
                    >
                      {pricing.tierName}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(progress, 100)}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                      },
                    }}
                  />
                </Box>

                {/* Quick Select */}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                  {[5000, 10000, 25000, 50000, 100000, 500000].map((amount) => (
                    <Chip
                      key={amount}
                      label={formatCredits(amount)}
                      onClick={() => handleCreditsChange(amount)}
                      size="small"
                      sx={{
                        background:
                          customCredits === amount
                            ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                            : alpha(theme.palette.primary.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        color:
                          customCredits === amount
                            ? theme.palette.primary.contrastText
                            : theme.palette.primary.main,
                        fontWeight: 600,
                        borderRadius: "8px",
                        "&:hover": {
                          background:
                            customCredits === amount
                              ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                              : alpha(theme.palette.primary.main, 0.2),
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Purchase Summary */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                  Order Summary
                </Typography>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2">Base Amount:</Typography>
                    <Typography variant="body2" fontWeight="600">
                      {formatCurrency(customAmount)}
                    </Typography>
                  </Box>

                  {pricing.discountPercent > 0 && (
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" color="success.main">
                        Discount ({pricing.discountPercent}%):
                      </Typography>
                      <Typography
                        variant="body2"
                        color="success.main"
                        fontWeight="600"
                      >
                        -{formatCurrency(pricing.savings)}
                      </Typography>
                    </Box>
                  )}

                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2">
                      {taxCalculation?.taxType === "IGST"
                        ? "IGST (18%):"
                        : taxCalculation?.taxType === "CGST+SGST"
                          ? "GST (9% + 9%):"
                          : "GST (18%):"}
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(
                        taxCalculation?.gstAmount ||
                          Math.round((customAmount * 18) / 100)
                      )}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 1 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    Total Amount:
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    {formatCurrency(finalTotal)}
                  </Typography>
                </Box>

                {/* Discount indicator */}
                {pricing.discountPercent > 0 && (
                  <InfoContainer sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Gift sx={{ fontSize: 16, color: "primary.main" }} />
                      <Typography
                        variant="body2"
                        color="primary.main"
                        fontWeight="bold"
                      >
                        {pricing.discountPercent}% Bulk Discount Applied!
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      You save ₹{pricing.savings} with this package size
                    </Typography>
                  </InfoContainer>
                )}
              </Box>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
                  <Typography variant="body2" fontWeight="600" sx={{ mb: 0.5 }}>
                    Please fix these issues:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {validationErrors.map((error, index) => (
                      <li key={index}>
                        <Typography variant="caption">{error}</Typography>
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}

              {/* Payment Button */}
              <PayButton
                fullWidth
                size="large"
                onClick={handleDirectPayment}
                disabled={!isValidPackage}
                startIcon={<CreditCard />}
              >
                Pay {formatCurrency(finalTotal)} Securely
              </PayButton>

              {/* Security badges */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 1.5,
                  mt: 2,
                }}
              >
                <Chip
                  label="256-bit SSL"
                  size="small"
                  sx={{
                    background: alpha("#4CAF50", 0.1),
                    border: `1px solid ${alpha("#4CAF50", 0.3)}`,
                    color: "#4CAF50",
                    fontSize: "0.7rem",
                    borderRadius: "8px",
                  }}
                />
                <Chip
                  label="Razorpay"
                  size="small"
                  sx={{
                    background: alpha("#2196F3", 0.1),
                    border: `1px solid ${alpha("#2196F3", 0.3)}`,
                    color: "#2196F3",
                    fontSize: "0.7rem",
                    borderRadius: "8px",
                  }}
                />
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  textAlign: "center",
                  mt: 1,
                  fontStyle: "italic",
                  opacity: 0.8,
                }}
              >
                * All prices inclusive of applicable GST
              </Typography>
            </Box>
          )}
        </DialogContent>
      </CompactDialog>

      {/* Success/Error Dialogs */}
      <SuccessErrorDialogs
        paymentStatus={paymentStatus}
        paymentResult={paymentResult}
        onComplete={handleComplete}
        error={error}
        onRetry={handleRetry}
        onNavigateToBilling={handleNavigateToBilling}
      />
    </>
  );
}

export default AddCreditsModal;
