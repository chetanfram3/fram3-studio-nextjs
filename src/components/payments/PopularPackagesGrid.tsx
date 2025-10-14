"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  styled,
  useTheme,
  alpha,
  Avatar,
} from "@mui/material";
import {
  CheckCircle,
  CheckOutlined as CheckIcon,
  Diamond,
  TrendingUp,
  Palette,
  Star,
  Rocket,
  HotelClassOutlined,
  FlashOn,
} from "@mui/icons-material";
import { formatCurrency, formatCredits } from "@/services/payments";
import { getCurrentBrand } from "@/config/brandConfig";

// Modern Card Component matching Cr3ditSys design
const ModernCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "selected" && prop !== "disabled",
})<{ selected?: boolean; disabled?: boolean }>(({
  theme,
  selected,
  disabled,
}) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: `${brand.borderRadius}px`,
    border: selected
      ? `2px solid ${theme.palette.primary.main}`
      : `1px solid ${theme.palette.divider}`,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    background: theme.palette.background.default,
    transition: "all 0.2s ease",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.6 : 1,
    position: "relative",
    overflow: "visible",
    "&:hover": !disabled
      ? {
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          transform: "translateY(-1px)",
          ...(selected && {
            boxShadow: `0 6px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
          }),
        }
      : undefined,
  };
});

// Modern Button Component matching Cr3ditSys design
const ModernButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})<{
  variant?: "contained" | "outlined";
  isSelected?: boolean;
}>(({ theme, variant, isSelected }) => {
  const brand = getCurrentBrand();

  const getButtonStyles = () => {
    if (isSelected) {
      return {
        background: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        border: "none",
        "&:hover": {
          background: theme.palette.primary.dark,
        },
      };
    }

    switch (variant) {
      case "contained":
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
          background: "transparent",
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          "&:hover": {
            background: alpha(theme.palette.background.paper, 0.8),
            borderColor: theme.palette.primary.main,
          },
        };
    }
  };

  return {
    borderRadius: `${brand.borderRadius}px`,
    textTransform: "none",
    fontWeight: 600,
    fontFamily: brand.fonts.body,
    transition: "all 0.2s ease",
    ...getButtonStyles(),
  };
});

const CustomModeButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isActive",
})<{ isActive?: boolean }>(({ theme, isActive }) => {
  const brand = getCurrentBrand();
  return {
    background: isActive ? theme.palette.primary.main : "transparent",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: `${brand.borderRadius}px`,
    color: isActive
      ? theme.palette.primary.contrastText
      : theme.palette.text.primary,
    fontWeight: 600,
    fontFamily: brand.fonts.body,
    textTransform: "none",
    padding: "8px 16px",
    transition: "all 0.2s ease",
    "&:hover": {
      background: isActive
        ? theme.palette.primary.dark
        : theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderColor: theme.palette.primary.main,
    },
  };
});

const GradientAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== "gradient",
})<{ gradient: string }>(({ gradient }) => {
  const brand = getCurrentBrand();
  return {
    background: gradient,
    borderRadius: `${brand.borderRadius}px`,
    width: 48,
    height: 48,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  };
});

const PopularBadge = styled(Box)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    position: "absolute",
    top: -8,
    right: -8,
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: "4px 12px",
    borderRadius: `${brand.borderRadius * 1.5}px`,
    fontSize: "0.75rem",
    fontWeight: 700,
    fontFamily: brand.fonts.body,
    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
    zIndex: 10,
    transform: "rotate(8deg)",
    whiteSpace: "nowrap",
  };
});

interface Package {
  id: string;
  credits: number;
  name: string;
  price: number;
  discount: number;
  savings: number;
  pricePerCredit: number;
  originalIndex?: number;
}

interface PopularPackagesGridProps {
  packages: Package[];
  selectedPackageId: string | null;
  isCustomMode: boolean;
  onPackageSelect: (id: string) => void;
  onCustomModeToggle: () => void;
  reviewMode?: boolean;
}

export function PopularPackagesGrid({
  packages,
  selectedPackageId,
  isCustomMode,
  onPackageSelect,
  onCustomModeToggle,
  reviewMode = false,
}: PopularPackagesGridProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Find the package with the highest price for "Most Popular" badge
  const mostExpensivePackage = packages.reduce(
    (max, pkg) => (pkg.price > max.price ? pkg : max),
    packages[0] || { price: 0 }
  );

  // Define different icons for each package based on credits/price tiers
  const getPackageIcon = (pkg: Package, index: number) => {
    const iconProps = {
      sx: {
        fontSize: 20,
        color: "white",
        zIndex: 2,
        position: "relative" as const,
      },
    };

    const icons = [
      <TrendingUp key="trending" {...iconProps} />,
      <Diamond key="diamond" {...iconProps} />,
      <Star key="star" {...iconProps} />,
      <Rocket key="rocket" {...iconProps} />,
      <HotelClassOutlined key="hotel" {...iconProps} />,
      <FlashOn key="flash" {...iconProps} />,
    ];

    return icons[index % icons.length] || <TrendingUp {...iconProps} />;
  };

  const getPackageGradient = (index: number) => {
    const gradients = [
      `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
      `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
      `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
      `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
      `linear-gradient(135deg, ${theme.palette.info.light} 0%, ${theme.palette.info.main} 100%)`,
    ];

    return gradients[index % gradients.length];
  };

  return (
    <Box sx={{ mb: reviewMode ? 0 : 4 }}>
      {/* Header - Hide in review mode */}
      {!reviewMode && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <GradientAvatar
              gradient={`linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`}
            >
              <Diamond sx={{ color: theme.palette.primary.contrastText }} />
            </GradientAvatar>
            <Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Popular Packages
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Choose from our most popular credit packages
              </Typography>
            </Box>
          </Box>

          <CustomModeButton
            isActive={isCustomMode}
            onClick={onCustomModeToggle}
            startIcon={isCustomMode ? <CheckCircle /> : <Palette />}
          >
            {isCustomMode ? "Custom Mode Active" : "Custom Amount"}
          </CustomModeButton>
        </Box>
      )}

      {/* Packages Grid */}
      <Grid container spacing={3}>
        {packages.map((pkg, index) => {
          const isSelected = selectedPackageId === pkg.id;
          const displayIndex =
            pkg.originalIndex !== undefined ? pkg.originalIndex : index;

          // Smart grid sizing - maintain consistent size in review mode
          const gridSizes =
            reviewMode && packages.length === 1
              ? { xs: 12 }
              : { xs: 12, sm: 6, md: 4, lg: 3 };

          return (
            <Grid key={pkg.id} size={gridSizes}>
              <Box sx={{ position: "relative", height: "100%" }}>
                <ModernCard
                  selected={isSelected}
                  disabled={isCustomMode || reviewMode}
                  onClick={() =>
                    !isCustomMode && !reviewMode && onPackageSelect(pkg.id)
                  }
                >
                  <CardContent
                    sx={{
                      p: reviewMode ? 3 : 4,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Package Header */}
                    <Box sx={{ mb: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <GradientAvatar
                          gradient={getPackageGradient(displayIndex)}
                          sx={{ width: 40, height: 40 }}
                        >
                          {getPackageIcon(pkg, displayIndex)}
                        </GradientAvatar>
                        <Box>
                          <Typography
                            variant="h6"
                            component="h3"
                            fontWeight="bold"
                            sx={{
                              lineHeight: 1.2,
                              fontFamily: brand.fonts.heading,
                            }}
                          >
                            {pkg.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight="600"
                            sx={{ fontFamily: brand.fonts.body }}
                          >
                            {formatCredits(pkg.credits)} credits
                          </Typography>
                        </Box>
                      </Box>

                      {/* Price Display */}
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: `${brand.borderRadius}px`,
                          background: alpha(theme.palette.primary.main, 0.05),
                          border: `1px solid ${alpha(
                            theme.palette.primary.main,
                            0.1
                          )}`,
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h4"
                          component="p"
                          fontWeight="bold"
                          color="primary.main"
                          sx={{
                            mb: 0.5,
                            fontFamily: brand.fonts.heading,
                          }}
                        >
                          {formatCurrency(pkg.price)}
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: 1, fontFamily: brand.fonts.body }}
                          >
                            total
                          </Typography>
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          ₹{pkg.pricePerCredit.toFixed(3)} per credit
                        </Typography>
                      </Box>
                    </Box>

                    {/* Features List */}
                    <Stack spacing={1.5} sx={{ mb: 3, flex: 1 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <CheckIcon
                          sx={{
                            fontSize: 18,
                            color: "success.main",
                            p: 0.25,
                            borderRadius: 1,
                            backgroundColor: alpha(
                              theme.palette.success.main,
                              0.1
                            ),
                          }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          {formatCredits(pkg.credits)} credits included
                        </Typography>
                      </Box>

                      {pkg.discount > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <CheckIcon
                            sx={{
                              fontSize: 18,
                              color: "warning.main",
                              p: 0.25,
                              borderRadius: 1,
                              backgroundColor: alpha(
                                theme.palette.warning.main,
                                0.1
                              ),
                            }}
                          />
                          <Typography
                            variant="body2"
                            fontWeight="600"
                            color="warning.main"
                            sx={{ fontFamily: brand.fonts.body }}
                          >
                            Save {formatCurrency(Math.round(pkg.savings))} (
                            {pkg.discount}% off)
                          </Typography>
                        </Box>
                      )}

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <CheckIcon
                          sx={{
                            fontSize: 18,
                            color: "info.main",
                            p: 0.25,
                            borderRadius: 1,
                            backgroundColor: alpha(
                              theme.palette.info.main,
                              0.1
                            ),
                          }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          Instant credit delivery
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <CheckIcon
                          sx={{
                            fontSize: 18,
                            color: "success.main",
                            p: 0.25,
                            borderRadius: 1,
                            backgroundColor: alpha(
                              theme.palette.success.main,
                              0.1
                            ),
                          }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          No expiry date
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Selection Button - Hide in review mode */}
                    {!reviewMode && (
                      <ModernButton
                        variant={isSelected ? "contained" : "outlined"}
                        isSelected={isSelected}
                        fullWidth
                        size="large"
                        onClick={() => !isCustomMode && onPackageSelect(pkg.id)}
                        disabled={isCustomMode}
                        startIcon={isSelected ? <CheckCircle /> : undefined}
                      >
                        {isSelected ? "Selected Package" : "Select Package"}
                      </ModernButton>
                    )}

                    {/* Review mode indicator */}
                    {reviewMode && isSelected && (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: `${brand.borderRadius}px`,
                          background: alpha(theme.palette.success.main, 0.1),
                          border: `2px solid ${alpha(
                            theme.palette.success.main,
                            0.3
                          )}`,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="success.main"
                          fontWeight="bold"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          ✅ Selected for Purchase
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </ModernCard>

                {/* Popular Badge - only show for most expensive package and not in review mode */}
                {!reviewMode && pkg.id === mostExpensivePackage?.id && (
                  <PopularBadge>Most Popular</PopularBadge>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

PopularPackagesGrid.displayName = "PopularPackagesGrid";
