"use client";

import React, { useState, useEffect } from "react";
import type { Theme } from "@mui/material/styles";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  LinearProgress,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  CircularProgress,
  Dialog,
  DialogContent,
  Fade,
  styled,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  CreditCard,
  AlertTriangle,
  X,
  ShoppingCart,
  ArrowRight,
  TrendingUp,
  Zap,
  CheckCircle as CheckIcon,
  Activity,
  BarChart3,
  Star,
  Rocket,
  Gift,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getCurrentBrand } from "@/config/brandConfig";
import DiamondIcon from "@/components/common/DiamondIcon";
import type { CreditError, CreditErrorResponse } from "@/types";
import {
  formatCurrency,
  formatCredits,
  getPaymentConfig,
  type PaymentConfig,
} from "@/services/payments";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreditErrorDisplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditError?: CreditErrorResponse;
  onRetry?: () => void;
  onPurchaseCredits?: () => void;
  className?: string;
}

interface Package {
  id: string;
  credits: number;
  name: string;
  price: number;
  discount: number;
  savings: number;
  pricePerCredit: number;
  suggestedPrice: number;
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const CompactModal = styled(Dialog)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    "& .MuiDialog-paper": {
      borderRadius: `${brand.borderRadius * 2}px`,
      border: `1px solid ${theme.palette.primary.main}`,
      background: theme.palette.background.paper,
      boxShadow: theme.shadows[24],
      maxWidth: "420px",
      width: "100%",
      maxHeight: "90vh",
      overflow: "hidden",
      margin: theme.spacing(2),
      backgroundImage: "none",
    },
  };
});

const CompactCard = styled(Card)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: `${brand.borderRadius * 2}px`,
    boxShadow: theme.shadows[8],
    maxWidth: 420,
    margin: "0 auto",
    overflow: "hidden",
    transition: "all 0.2s ease",
    backgroundImage: "none",
    "&:hover": {
      boxShadow: theme.shadows[12],
      transform: "translateY(-2px)",
    },
  };
});

const ErrorHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 2, 1.5, 2),
  textAlign: "center",
  background: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
  position: "relative",
}));

const GradientAvatar = styled(Box)<{ size?: number }>(({
  theme,
  size = 48,
}) => {
  const brand = getCurrentBrand();
  return {
    background: theme.palette.primary.main,
    borderRadius: `${brand.borderRadius}px`,
    width: size,
    height: size,
    margin: "0 auto 12px",
    boxShadow: theme.shadows[4],
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  };
});

const CompactSection = styled(Box)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    background: theme.palette.background.default,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: `${brand.borderRadius}px`,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    position: "relative",
    overflow: "hidden",
  };
});

const CompactButton = styled(Button)<{
  buttonVariant?: "primary" | "secondary" | "success" | "error";
}>(({ theme, buttonVariant = "primary" }) => {
  const brand = getCurrentBrand();

  const getButtonStyles = () => {
    switch (buttonVariant) {
      case "success":
        return {
          background: theme.palette.success.main,
          color: theme.palette.success.contrastText,
          "&:hover": {
            background: theme.palette.success.dark,
            transform: "translateY(-1px)",
          },
        };
      case "error":
        return {
          background: theme.palette.error.main,
          color: theme.palette.error.contrastText,
          "&:hover": {
            background: theme.palette.error.dark,
            transform: "translateY(-1px)",
          },
        };
      case "secondary":
        return {
          background: "transparent",
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          "&:hover": {
            background: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            borderColor: theme.palette.primary.main,
            transform: "translateY(-1px)",
          },
        };
      default:
        return {
          background: theme.palette.warning.main,
          color: theme.palette.warning.contrastText,
          "&:hover": {
            background: theme.palette.warning.dark,
            transform: "translateY(-1px)",
          },
        };
    }
  };

  return {
    borderRadius: `${brand.borderRadius}px`,
    fontWeight: 600,
    textTransform: "none",
    padding: "10px 20px",
    position: "relative",
    overflow: "hidden",
    minWidth: 120,
    transition: "all 0.2s ease",
    fontFamily: brand.fonts.body,
    "&:active": {
      transform: "translateY(0px)",
    },
    ...getButtonStyles(),
  };
});

const CompactChip = styled(Chip)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    background: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
    border: `1px solid ${theme.palette.warning.main}`,
    borderRadius: `${brand.borderRadius}px`,
    fontWeight: 600,
    height: 24,
    fontSize: "0.7rem",
    boxShadow: "none",
    "&:hover": {
      background: theme.palette.warning.dark,
    },
    transition: "background-color 0.2s ease-in-out",
  };
});

const CloseButton = styled(IconButton)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    position: "absolute",
    top: theme.spacing(1.5),
    right: theme.spacing(1.5),
    background: "transparent",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: `${brand.borderRadius}px`,
    width: 32,
    height: 32,
    zIndex: 10,
    color: theme.palette.text.primary,
    "&:hover": {
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderColor: theme.palette.primary.main,
      transform: "scale(1.05)",
    },
    transition: "all 0.2s ease",
  };
});

const CompactAlert = styled(Alert)(({ theme, severity }) => {
  const brand = getCurrentBrand();

  const getColors = () => {
    switch (severity) {
      case "success":
        return {
          bg: theme.palette.success.main,
          border: theme.palette.success.main,
        };
      case "warning":
        return {
          bg: theme.palette.warning.main,
          border: theme.palette.warning.main,
        };
      case "error":
        return {
          bg: theme.palette.error.main,
          border: theme.palette.error.main,
        };
      default:
        return {
          bg: theme.palette.info.main,
          border: theme.palette.info.main,
        };
    }
  };

  const colors = getColors();

  return {
    background: theme.palette.background.default,
    border: `1px solid ${colors.border}`,
    borderRadius: `${brand.borderRadius}px`,
    boxShadow: "none",
    fontSize: "0.8rem",
    "& .MuiAlert-icon": {
      fontSize: "1.2rem",
    },
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: "3px",
      height: "100%",
      background: colors.bg,
      borderRadius: `0 ${brand.borderRadius}px ${brand.borderRadius}px 0`,
    },
  };
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

const getProgressPercentage = (available: number, required: number): number => {
  if (available < 0) return 0;
  return Math.min((available / required) * 100, 100);
};

const findRecommendedPackage = (
  shortfall: number,
  packages: Package[]
): Package | null => {
  if (!packages || packages.length === 0) return null;

  const sortedPackages = [...packages].sort((a, b) => a.credits - b.credits);
  const minViablePackage = sortedPackages.find(
    (pkg) => pkg.credits >= shortfall
  );

  if (minViablePackage) {
    return minViablePackage;
  }

  return sortedPackages[sortedPackages.length - 1];
};

const getPackageIcon = (index: number) => {
  const icons = [
    <TrendingUp size={16} key="trending" />,
    <DiamondIcon size={16} key="diamond" />,
    <Star size={16} key="star" />,
    <Rocket size={16} key="rocket" />,
    <Zap size={16} key="zap" />,
  ];

  return icons[index % icons.length] || <TrendingUp size={16} key="default" />;
};

const getPackageGradient = (index: number, theme: Theme) => {
  const colors = [
    theme.palette.info.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.text.secondary,
  ];

  return colors[index % colors.length];
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CreditErrorDisplay: React.FC<CreditErrorDisplayProps> = ({
  open,
  onOpenChange,
  creditError,
  className = "",
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  const [packages, setPackages] = useState<Package[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [recommendedPackage, setRecommendedPackage] = useState<Package | null>(
    null
  );
  const [alternativePackages, setAlternativePackages] = useState<Package[]>([]);

  // Fetch packages from backend API
  useEffect(() => {
    if (!creditError || !open) {
      return;
    }

    const loadPackages = async () => {
      try {
        setPackagesLoading(true);
        setPackagesError(null);

        const configData = await getPaymentConfig();
        setConfig(configData.data);

        const processedPackages =
          configData.data.suggestions.popularPackages.map(
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

        setPackages(processedPackages);
      } catch (err: unknown) {
        console.error("Failed to load packages:", err);
        setPackagesError(
          err instanceof Error ? err.message : "Failed to load packages"
        );
      } finally {
        setPackagesLoading(false);
      }
    };

    void loadPackages();
  }, [creditError, open]);

  // Calculate recommended package
  useEffect(() => {
    if (!creditError || packages.length === 0 || !open) {
      return;
    }

    const { details } = creditError.error;
    const recommended = findRecommendedPackage(details.shortfall, packages);
    setRecommendedPackage(recommended);

    const sortedPackages = [...packages].sort((a, b) => a.credits - b.credits);
    const recommendedIndex = recommended
      ? sortedPackages.findIndex((pkg) => pkg.id === recommended.id)
      : -1;

    let alternatives: Package[] = [];
    if (recommendedIndex >= 0) {
      if (recommendedIndex > 0)
        alternatives.push(sortedPackages[recommendedIndex - 1]);
      if (recommendedIndex < sortedPackages.length - 1)
        alternatives.push(sortedPackages[recommendedIndex + 1]);
    }

    if (alternatives.length < 2) {
      const remainingPackages = sortedPackages.filter(
        (pkg) =>
          pkg.id !== recommended?.id &&
          !alternatives.some((alt) => alt.id === pkg.id)
      );
      alternatives = [
        ...alternatives,
        ...remainingPackages.slice(0, 2 - alternatives.length),
      ];
    }

    setAlternativePackages(alternatives);
  }, [creditError, packages, open]);

  if (!creditError) {
    return null;
  }

  const { error } = creditError;
  const { details } = error;
  const hasScriptInfo = creditError.scriptId && creditError.versionId;
  const progressPercentage = getProgressPercentage(
    details.available,
    details.required
  );

  const handleSelectPackage = (packageId: string) => {
    onOpenChange(false);
    router.push(`/dashboard/payments?package=${packageId}`);
  };

  const handleNavigateToPayments = () => {
    onOpenChange(false);
    router.push("/dashboard/payments");
  };

  const handleNavigateToScript = () => {
    if (hasScriptInfo) {
      onOpenChange(false);
      router.push(
        `/dashboard/story/${creditError.scriptId}/version/${creditError.versionId}/3`
      );
    }
  };

  const handleDismiss = () => {
    onOpenChange(false);
  };

  if (packagesLoading) {
    return (
      <CompactModal
        open={open}
        onClose={handleDismiss}
        maxWidth={false}
        fullWidth
        slots={{
          transition: Fade,
        }}
        slotProps={{
          transition: { timeout: 300 },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <CompactCard>
            <CardContent sx={{ p: 3, textAlign: "center" }}>
              <GradientAvatar size={48}>
                <CircularProgress
                  size={24}
                  sx={{ color: theme.palette.primary.contrastText }}
                />
              </GradientAvatar>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ mb: 1, fontFamily: brand.fonts.heading }}
              >
                Loading Credit Options
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontSize="0.85rem"
              >
                Finding the best packages for your needs...
              </Typography>
            </CardContent>
          </CompactCard>
        </DialogContent>
      </CompactModal>
    );
  }

  return (
    <CompactModal
      open={open}
      onClose={handleDismiss}
      maxWidth={false}
      fullWidth
      slots={{
        transition: Fade,
      }}
      slotProps={{
        transition: { timeout: 300 },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <CompactCard>
          <Tooltip title="Close">
            <CloseButton onClick={handleDismiss} size="small">
              <X size={16} />
            </CloseButton>
          </Tooltip>

          <ErrorHeader>
            <GradientAvatar size={48}>
              <AlertTriangle
                size={20}
                style={{ color: theme.palette.primary.contrastText }}
              />
            </GradientAvatar>
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontWeight: "bold",
                color: "error.main",
                mb: 0.5,
                fontSize: "1.3rem",
                fontFamily: brand.fonts.heading,
              }}
            >
              Insufficient Credits
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                maxWidth: 300,
                mx: "auto",
                lineHeight: 1.3,
                fontWeight: 500,
                fontSize: "0.85rem",
              }}
            >
              You need more credits to continue with this operation
            </Typography>
          </ErrorHeader>

          <CardContent
            sx={{ p: 2, background: theme.palette.background.default }}
          >
            <Stack spacing={1.5}>
              {/* Credit Status Section */}
              <CompactSection>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 1.5,
                  }}
                >
                  <GradientAvatar size={24}>
                    <Activity
                      size={12}
                      style={{ color: theme.palette.primary.contrastText }}
                    />
                  </GradientAvatar>
                  <Typography
                    variant="body2"
                    fontWeight="700"
                    color="text.primary"
                  >
                    Credit Balance Overview
                  </Typography>
                </Box>

                <Box sx={{ mb: 1.5 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" fontWeight="medium">
                      Available Credits
                    </Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {formatNumber(details.available)} /{" "}
                      {formatNumber(details.required)}
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{
                      height: 6,
                      borderRadius: `${brand.borderRadius}px`,
                      backgroundColor: theme.palette.warning.main,
                      mb: 1,
                      opacity: 0.3,
                      "& .MuiLinearProgress-bar": {
                        backgroundColor:
                          details.available < 0
                            ? theme.palette.error.main
                            : theme.palette.warning.main,
                        borderRadius: `${brand.borderRadius}px`,
                        opacity: 1,
                      },
                    }}
                  />

                  <Box display="flex" justifyContent="space-between" gap={1}>
                    <CompactChip
                      icon={<AlertTriangle size={10} />}
                      label={`${formatNumber(details.shortfall)} short`}
                      size="small"
                    />
                    <CompactChip
                      icon={<TrendingUp size={10} />}
                      label={`${details.percentageAvailable}% funded`}
                      size="small"
                    />
                  </Box>
                </Box>
              </CompactSection>

              {packagesError && (
                <CompactAlert severity="warning" sx={{ mb: 2 }}>
                  <AlertTitle
                    sx={{ fontWeight: 600, fontSize: "0.8rem", mb: 0.5 }}
                  >
                    Package Loading Issue
                  </AlertTitle>
                  <Typography
                    variant="caption"
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    {packagesError}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Please try browsing packages manually.
                  </Typography>
                </CompactAlert>
              )}

              {/* Recommended Package */}
              {recommendedPackage && packages.length > 0 && (
                <Box sx={{ position: "relative" }}>
                  <CompactSection sx={{ mt: 0.5 }}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: -10,
                        transform: "rotate(45deg)",
                        transformOrigin: "center",
                        zIndex: 2,
                        background: theme.palette.warning.main,
                        color: theme.palette.warning.contrastText,
                        padding: "2px 12px",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        boxShadow: theme.shadows[4],
                        minWidth: "60px",
                        textAlign: "center",
                      }}
                    >
                      Best
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 1,
                      }}
                    >
                      <GradientAvatar size={24}>
                        <Zap
                          size={12}
                          style={{ color: theme.palette.primary.contrastText }}
                        />
                      </GradientAvatar>
                      <Typography
                        variant="body2"
                        fontWeight="700"
                        color="text.primary"
                      >
                        {recommendedPackage.name}
                      </Typography>
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        fontWeight: 500,
                        lineHeight: 1.3,
                        display: "block",
                      }}
                    >
                      {recommendedPackage.credits >= details.shortfall
                        ? `Covers ${formatNumber(
                            details.shortfall
                          )} credit shortfall with ${formatNumber(
                            recommendedPackage.credits - details.shortfall
                          )} extra credits.`
                        : `Largest package with ${formatNumber(
                            recommendedPackage.credits
                          )} credits available.`}
                    </Typography>

                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{ fontSize: "1.1rem" }}
                        >
                          {formatCurrency(recommendedPackage.price)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCredits(recommendedPackage.credits)} credits
                          {recommendedPackage.discount > 0 && (
                            <Box
                              component="span"
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                ml: 0.5,
                              }}
                            >
                              <Gift
                                size={10}
                                style={{
                                  color: theme.palette.warning.main,
                                  marginRight: 2,
                                }}
                              />
                              <Typography
                                component="span"
                                sx={{
                                  color: theme.palette.warning.main,
                                  fontWeight: 600,
                                  fontSize: "0.7rem",
                                }}
                              >
                                {recommendedPackage.discount}% off
                              </Typography>
                            </Box>
                          )}
                        </Typography>
                      </Box>
                      <CompactChip
                        label={
                          recommendedPackage.credits >= details.shortfall
                            ? "Best Match"
                            : "Max Available"
                        }
                        sx={{
                          background:
                            recommendedPackage.credits >= details.shortfall
                              ? theme.palette.success.main
                              : theme.palette.warning.main,
                          color:
                            recommendedPackage.credits >= details.shortfall
                              ? theme.palette.success.contrastText
                              : theme.palette.warning.contrastText,
                          border: "none",
                        }}
                        size="small"
                      />
                    </Box>

                    <CompactButton
                      buttonVariant="primary"
                      size="small"
                      onClick={() => handleSelectPackage(recommendedPackage.id)}
                      fullWidth
                      sx={{ fontSize: "0.8rem", py: 1 }}
                    >
                      <ShoppingCart size={14} style={{ marginRight: 6 }} />
                      Select This Package
                    </CompactButton>
                  </CompactSection>
                </Box>
              )}

              {/* Alternative Packages */}
              {alternativePackages.length > 0 &&
                recommendedPackage &&
                packages.length > 0 && (
                  <CompactSection>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 1.5,
                      }}
                    >
                      <GradientAvatar size={24}>
                        <BarChart3
                          size={12}
                          style={{ color: theme.palette.primary.contrastText }}
                        />
                      </GradientAvatar>
                      <Typography variant="body2" fontWeight="700">
                        Other Options
                      </Typography>
                    </Box>

                    <Grid container spacing={1}>
                      {alternativePackages.slice(0, 2).map((pkg, index) => (
                        <Grid size={{ xs: 6 }} key={pkg.id}>
                          <Box
                            sx={{
                              p: 1.5,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: `${brand.borderRadius}px`,
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                borderColor: theme.palette.warning.main,
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                            onClick={() => handleSelectPackage(pkg.id)}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: `${brand.borderRadius / 2}px`,
                                  background: getPackageGradient(index, theme),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {React.cloneElement(getPackageIcon(index), {
                                  size: 8,
                                  style: { color: "white" },
                                })}
                              </Box>
                              <Typography
                                variant="caption"
                                fontWeight="600"
                                fontSize="0.7rem"
                              >
                                {pkg.name}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              sx={{ mb: 0.25, fontSize: "0.9rem" }}
                            >
                              {formatCurrency(pkg.price)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              {formatCredits(pkg.credits)} credits
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CompactSection>
                )}

              {/* Script Navigation Alert */}
              {hasScriptInfo && creditError.note && (
                <CompactAlert severity="success">
                  <AlertTitle
                    sx={{ fontWeight: 600, fontSize: "0.8rem", mb: 0.5 }}
                  >
                    Script Created Successfully
                  </AlertTitle>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={0.5}
                    gap={1}
                  >
                    <Typography
                      variant="caption"
                      sx={{ flex: 1, lineHeight: 1.4, fontSize: "0.75rem" }}
                    >
                      {creditError.note}
                    </Typography>
                    <CompactButton
                      buttonVariant="success"
                      size="small"
                      onClick={handleNavigateToScript}
                      sx={{ minWidth: 90, fontSize: "0.7rem", py: 0.5, px: 1 }}
                    >
                      View Script
                      <ArrowRight size={12} style={{ marginLeft: 4 }} />
                    </CompactButton>
                  </Box>
                </CompactAlert>
              )}

              {/* Action Buttons */}
              <Box sx={{ textAlign: "center", pt: 0.5 }}>
                <CompactButton
                  buttonVariant="primary"
                  size="medium"
                  onClick={handleNavigateToPayments}
                  sx={{ minWidth: 160, fontSize: "0.85rem", py: 1, px: 2 }}
                >
                  <ShoppingCart size={16} style={{ marginRight: 6 }} />
                  Browse All Packages
                </CompactButton>
              </Box>

              {/* Bottom Suggestion */}
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontStyle: "italic",
                    maxWidth: 350,
                    mx: "auto",
                    lineHeight: 1.4,
                    fontWeight: 500,
                    fontSize: "0.75rem",
                  }}
                >
                  {details.suggestion}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </CompactCard>
      </DialogContent>
    </CompactModal>
  );
};

export default CreditErrorDisplay;
