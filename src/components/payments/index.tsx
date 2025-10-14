"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Container,
  Alert,
  Button,
  CircularProgress,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Grid,
  styled,
  useTheme,
  alpha,
  Avatar,
  Fade,
  Slide,
  Card,
  CardContent,
} from "@mui/material";
import {
  Refresh,
  ShoppingCart,
  Payment,
  CheckCircle,
  ArrowBack,
  ArrowForward,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  getPaymentConfig,
  createOrder,
  verifyPayment,
  getCreditBalance,
  formatCredits,
  validateCreditPackage,
  type PackageInfo,
  type VerifyPaymentParams,
  type EnhancedOrderData,
  type TaxDetails,
} from "@/services/payments";

// Component imports
import { PopularPackagesGrid } from "./PopularPackagesGrid";
import { CustomPackageSection } from "./CustomPackageSection";
import { PurchaseSummary } from "./PurchaseSummary";
import { SuccessErrorDialogs } from "./SuccessErrorDialogs";
import { MissingProfileDataCollection } from "./MissingProfileDataCollection";
import { calculateCustomPrice } from "@/utils/pricingUtils";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";

// Profile imports
import { ProfileTaxService } from "@/services/profileTaxService";
import {
  useProfileQuery,
  useUpdateProfileMutation,
} from "@/hooks/useProfileQuery";
import CustomToast from "@/components/common/CustomToast";
import { getCurrentBrand } from "@/config/brandConfig";
import { UserProfile } from "@/types/profile";

// Modern styled components matching Cr3ditSys design
const ModernCard = styled(Card)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: `${brand.borderRadius}px`,
    border: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.default,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    transition: "all 0.2s ease",
    "&:hover": {
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      transform: "translateY(-1px)",
    },
  };
});

const ModernButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "buttonVariant",
})<{
  buttonVariant?: "back" | "next" | "pay";
}>(({ theme, buttonVariant = "next" }) => {
  const brand = getCurrentBrand();

  const getButtonStyles = () => {
    switch (buttonVariant) {
      case "back":
        return {
          background: "transparent",
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          "&:hover": {
            background: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            borderColor: theme.palette.primary.main,
          },
        };
      case "pay":
        return {
          background: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          border: "none",
          "&:hover": {
            background: theme.palette.primary.dark,
          },
        };
      default:
        return {
          background: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          border: "none",
          "&:hover": {
            background: theme.palette.primary.dark,
          },
        };
    }
  };

  return {
    borderRadius: `${brand.borderRadius}px`,
    textTransform: "none",
    fontWeight: 600,
    fontFamily: brand.fonts.body,
    padding: "10px 20px",
    minWidth: 120,
    transition: "all 0.2s ease",
    "&:disabled": {
      opacity: 0.6,
      background: theme.palette.action.disabledBackground,
    },
    ...getButtonStyles(),
  };
});

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const steps = [
  {
    label: "Choose Package",
    description: "Select a credit package or customize your amount",
    icon: ShoppingCart,
  },
  {
    label: "Review & Pay",
    description: "Review your order and complete payment",
    icon: Payment,
  },
  {
    label: "Complete",
    description: "Payment successful, credits added",
    icon: CheckCircle,
  },
];

interface Package {
  id: string;
  credits: number;
  name: string;
  suggestedPrice: number;
  discount: number;
  price: number;
  pricePerCredit: number;
  savings: number;
}

export default function CreditLoadingPage() {
  const router = useRouter();
  const theme = useTheme();
  const brand = getCurrentBrand();
  const searchParams = useSearchParams();

  // Profile hooks - Replace useProfileForm with TanStack Query hooks
  const {
    data: userProfile,
    isLoading: profileLoading,
    refetch: loadProfile,
  } = useProfileQuery();

  const updateProfileMutation = useUpdateProfileMutation();

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);

  // State definitions
  const [config, setConfig] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [popularPackages, setPopularPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null
  );
  const [customCredits, setCustomCredits] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<number>(90);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidPackage, setIsValidPackage] = useState<boolean>(false);

  // Profile completion state
  const [showProfileCompletion, setShowProfileCompletion] = useState(true);

  // Pre-select package from URL
  useEffect(() => {
    const packageParam = searchParams?.get("package");
    if (packageParam && popularPackages.length > 0) {
      const packageExists = popularPackages.find(
        (pkg) => pkg.id === packageParam
      );
      if (packageExists) {
        setSelectedPackageId(packageParam);
        setIsCustomMode(false);
        setActiveStep(1);
        console.log("✅ Pre-selected package from URL:", packageParam);
      }
    }
  }, [searchParams, popularPackages]);

  // Load data once on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [configData, balanceData] = await Promise.all([
          getPaymentConfig(),
          getCreditBalance(),
        ]);

        setConfig(configData.data);
        setBalance(balanceData.data);

        // Process packages with stable structure
        const packages = configData.data.suggestions.popularPackages.map(
          (pkg: any, index: number) => {
            const basePrice = pkg.credits * 0.09;
            const discount = pkg.discount || 0;
            const discountedPrice = pkg.suggestedPrice;
            const savings = Math.max(0, basePrice - discountedPrice);

            return {
              id: `package-${index}-${pkg.credits}`,
              credits: pkg.credits,
              name: pkg.name,
              suggestedPrice: pkg.suggestedPrice,
              discount: pkg.discount || 0,
              price: discountedPrice,
              pricePerCredit: discountedPrice / pkg.credits,
              savings: savings,
            };
          }
        );

        setPopularPackages(packages);
      } catch (err: any) {
        console.error("Load error:", err);
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Check if profile needs completion for tax calculation
  useEffect(() => {
    if (userProfile && !ProfileTaxService.hasCompleteTaxData(userProfile)) {
      setShowProfileCompletion(true);
    } else {
      setShowProfileCompletion(false);
    }
  }, [userProfile]);

  // Handle profile completion
  const handleProfileCompletion = () => {
    setShowProfileCompletion(false);
    CustomToast.success("Profile updated! Tax calculation is now accurate.");
  };

  // Validate package whenever relevant state changes
  useEffect(() => {
    if (!config?.validation) {
      setIsValidPackage(false);
      setValidationErrors([]);
      return;
    }

    let credits: number;
    let baseAmount: number;

    if (isCustomMode) {
      credits = customCredits;
      baseAmount = customAmount;
    } else {
      const selectedPkg = popularPackages.find(
        (pkg) => pkg.id === selectedPackageId
      );
      if (!selectedPkg) {
        setIsValidPackage(false);
        setValidationErrors(["No package selected"]);
        return;
      }
      credits = selectedPkg.credits;
      baseAmount = selectedPkg.price;
    }

    if (!credits || !baseAmount) {
      setIsValidPackage(false);
      setValidationErrors(["Invalid credits or base amount"]);
      return;
    }

    const validation = validateCreditPackage(credits, baseAmount, config);
    setValidationErrors(validation.errors);
    setIsValidPackage(validation.isValid);
  }, [
    isCustomMode,
    selectedPackageId,
    customCredits,
    customAmount,
    config,
    popularPackages,
  ]);

  // Event handlers
  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
    setIsCustomMode(false);
    setTimeout(() => setActiveStep(1), 300);
  };

  const handleCustomModeToggle = () => {
    const newCustomMode = !isCustomMode;
    setIsCustomMode(newCustomMode);

    if (newCustomMode) {
      setSelectedPackageId(null);
      setActiveStep(1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setIsCustomMode(false);
    setSelectedPackageId(null);
    setError(null);
  };

  // Use custom pricing calculation
  const handleCreditsChange = (value: number) => {
    const minCredits = config?.validation?.minCredits || 100;
    const maxCredits = config?.validation?.maxCredits || 1000000;
    const newCredits = Math.max(minCredits, Math.min(value, maxCredits));

    setCustomCredits(newCredits);

    const pricing = calculateCustomPrice(newCredits, config?.customPricing);
    setCustomAmount(pricing.price);
  };

  const handlePaymentSuccess = async (response: RazorpayResponse) => {
    try {
      const verifyParams: VerifyPaymentParams = {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      };

      const result = await verifyPayment(verifyParams);

      setPaymentStatus("success");
      setPaymentResult(result.data);
      setActiveStep(2);

      // Refresh balance
      const newBalance = await getCreditBalance();
      setBalance(newBalance.data);
    } catch (err: any) {
      setPaymentStatus("error");
      setError(err.message);
    }
  };

  // Direct payment handler
  const handleDirectPayment = async () => {
    try {
      if (!isValidPackage) return;

      setPaymentStatus("processing");
      setError(null);

      let credits: number;
      let amount: number;
      let packageName: string;
      let discount = 0;

      if (isCustomMode) {
        credits = customCredits;
        amount = customAmount;
        packageName = `${formatCredits(credits)} Credits`;
        const pricing = calculateCustomPrice(credits, config?.customPricing);
        discount = pricing.discountPercent;
      } else {
        const selectedPkg = popularPackages.find(
          (pkg) => pkg.id === selectedPackageId
        );
        if (!selectedPkg) {
          setPaymentStatus("error");
          setError("No package selected");
          return;
        }
        credits = selectedPkg.credits;
        amount = selectedPkg.price;
        packageName = selectedPkg.name;
        discount = selectedPkg.discount;
      }

      // Calculate final amount including tax
      let finalAmount = amount;
      let taxDetails: TaxDetails | undefined = undefined;

      if (userProfile) {
        const taxCalculation = ProfileTaxService.calculateTaxFromProfile(
          amount,
          userProfile,
          config?.gst
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
        const gstRate = config?.gst?.rate || 18;
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
        type: isCustomMode ? "custom" : "popular",
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
          },
        },
      };

      const rzp = new window.Razorpay(razorpayOptions);
      rzp.open();
    } catch (err: any) {
      setPaymentStatus("error");
      setError(err.message);
      console.error("❌ Payment error:", err);
    }
  };

  const handleRetry = () => {
    setPaymentStatus("idle");
    setError(null);
    setPaymentResult(null);
  };

  const handleComplete = () => {
    router.push("/dashboard/billing");
  };

  // Handle profile updates using TanStack Query mutation
  const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
    try {
      await updateProfileMutation.mutateAsync(updates);
      return Promise.resolve();
    } catch (error) {
      console.error("❌ Failed to update profile:", error);
      CustomToast.error("Failed to update profile. Please try again.");
      return Promise.reject(error);
    }
  };

  // Get current package data
  const currentPackage = useMemo(() => {
    if (isCustomMode) {
      const pricing = calculateCustomPrice(
        customCredits,
        config?.customPricing
      );
      return {
        credits: customCredits,
        name: "Custom Package",
        price: customAmount,
        discount: pricing.discountPercent,
        savings: pricing.savings,
        tierName: pricing.tierName,
      };
    } else if (selectedPackageId) {
      return (
        popularPackages.find((pkg) => pkg.id === selectedPackageId) || null
      );
    }
    return null;
  }, [
    isCustomMode,
    customCredits,
    customAmount,
    selectedPackageId,
    popularPackages,
    config?.customPricing,
  ]);

  // Stepper navigation
  const handleNext = () => {
    if (activeStep === 0 && (selectedPackageId || isCustomMode)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const canProceedToNext = () => {
    if (activeStep === 0) {
      return selectedPackageId !== null || isCustomMode;
    }
    return false;
  };

  // Loading state
  if (loading || profileLoading) {
    return <LoadingAnimation message="Loading your payment options..." />;
  }

  // Error state
  if (error && !config) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <ModernCard sx={{ textAlign: "center", p: 4 }}>
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: `${brand.borderRadius}px` }}
          >
            {error}
          </Alert>
          <ModernButton
            onClick={() => window.location.reload()}
            startIcon={<Refresh />}
          >
            Try Again
          </ModernButton>
        </ModernCard>
      </Container>
    );
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Fade in timeout={600}>
            <Box>
              <PopularPackagesGrid
                packages={popularPackages}
                selectedPackageId={selectedPackageId}
                isCustomMode={isCustomMode}
                onPackageSelect={handlePackageSelect}
                onCustomModeToggle={handleCustomModeToggle}
              />
            </Box>
          </Fade>
        );
      case 1:
        return (
          <Slide direction="left" in timeout={600}>
            <Box>
              <Grid container spacing={4}>
                {/* Left Side - Selected Package or Custom Component */}
                <Grid size={{ xs: 12, md: 6 }}>
                  {isCustomMode ? (
                    <ModernCard>
                      <CardContent sx={{ p: 4 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 3,
                          }}
                        >
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            sx={{ fontFamily: brand.fonts.heading }}
                          >
                            Custom Package Configuration
                          </Typography>
                          <ModernButton
                            buttonVariant="back"
                            onClick={handleBack}
                            startIcon={<ArrowBack />}
                            size="small"
                          >
                            Change
                          </ModernButton>
                        </Box>
                        <CustomPackageSection
                          isCustomMode={true}
                          customCredits={customCredits}
                          customAmount={customAmount}
                          config={config}
                          validationErrors={validationErrors}
                          customPricing={config?.customPricing}
                          onCreditsChange={handleCreditsChange}
                        />
                      </CardContent>
                    </ModernCard>
                  ) : (
                    selectedPackageId &&
                    (() => {
                      const selectedPackage = popularPackages.find(
                        (pkg) => pkg.id === selectedPackageId
                      );
                      const originalIndex = popularPackages.findIndex(
                        (pkg) => pkg.id === selectedPackageId
                      );

                      return selectedPackage ? (
                        <ModernCard>
                          <CardContent sx={{ p: 4 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 3,
                              }}
                            >
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                sx={{ fontFamily: brand.fonts.heading }}
                              >
                                Selected Package
                              </Typography>
                              <ModernButton
                                buttonVariant="back"
                                onClick={handleBack}
                                startIcon={<ArrowBack />}
                                size="small"
                              >
                                Change
                              </ModernButton>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                width: "100%",
                              }}
                            >
                              <Box sx={{ width: "100%", maxWidth: "400px" }}>
                                <PopularPackagesGrid
                                  packages={[
                                    { ...selectedPackage, originalIndex },
                                  ]}
                                  selectedPackageId={selectedPackageId}
                                  isCustomMode={false}
                                  onPackageSelect={() => {}}
                                  onCustomModeToggle={() => {}}
                                  reviewMode={true}
                                />
                              </Box>
                            </Box>
                          </CardContent>
                        </ModernCard>
                      ) : (
                        <ModernCard>
                          <CardContent sx={{ p: 4, textAlign: "center" }}>
                            <Typography
                              variant="body1"
                              color="text.secondary"
                              sx={{ fontFamily: brand.fonts.body }}
                            >
                              No package selected. Please go back and select a
                              package.
                            </Typography>
                          </CardContent>
                        </ModernCard>
                      );
                    })()
                  )}
                </Grid>

                {/* Right Side - Purchase Summary */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <PurchaseSummary
                    currentPackage={currentPackage}
                    isValidPackage={isValidPackage}
                    paymentStatus={paymentStatus}
                    userProfile={userProfile}
                    gstConfig={config?.gst}
                    onDirectPayment={handleDirectPayment}
                  />
                </Grid>
              </Grid>
            </Box>
          </Slide>
        );
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: "bold",
            fontFamily: brand.fonts.heading,
            color: "text.primary",
            mb: 1,
          }}
        >
          Payments
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          Choose a plan that best suits you.
        </Typography>
      </Box>

      {/* Profile completion prompt */}
      {showProfileCompletion && userProfile && (
        <Box sx={{ mb: 4 }}>
          <MissingProfileDataCollection
            profile={userProfile}
            onProfileUpdate={handleProfileUpdate}
            onComplete={handleProfileCompletion}
          />
        </Box>
      )}

      {/* Error Display */}
      {error && config && paymentStatus !== "processing" && (
        <Alert
          severity="error"
          sx={{ mb: 4, borderRadius: `${brand.borderRadius}px` }}
          action={
            <Button color="inherit" size="small" onClick={() => setError(null)}>
              Dismiss
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Enhanced Stepper */}
      <ModernCard sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Stepper
            activeStep={activeStep}
            orientation="horizontal"
            sx={{
              "& .MuiStepLabel-label.Mui-active": {
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontFamily: brand.fonts.body,
              },
              "& .MuiStepIcon-root.Mui-active": {
                color: theme.palette.primary.main,
              },
              "& .MuiStepIcon-root.Mui-completed": {
                color: theme.palette.primary.main,
              },
            }}
          >
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <Step key={step.label}>
                  <StepLabel
                    icon={<StepIcon />}
                    optional={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        {step.description}
                      </Typography>
                    }
                  >
                    {step.label}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </CardContent>
      </ModernCard>

      {/* Step Content */}
      <Box sx={{ minHeight: 400, mb: 4 }}>{getStepContent(activeStep)}</Box>

      {/* Step Navigation - Only show for step 0 */}
      {activeStep === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <ModernButton
            buttonVariant="next"
            onClick={handleNext}
            disabled={!canProceedToNext()}
            endIcon={<ArrowForward />}
          >
            Continue to Review
          </ModernButton>
        </Box>
      )}

      {/* Success/Error Dialogs */}
      <SuccessErrorDialogs
        paymentStatus={paymentStatus}
        paymentResult={paymentResult}
        onComplete={handleComplete}
        error={error}
        onRetry={handleRetry}
        onNavigateToBilling={() => router.push("/dashboard/billing")}
      />
    </Container>
  );
}

CreditLoadingPage.displayName = "CreditLoadingPage";
