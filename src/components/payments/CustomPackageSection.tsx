'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
  Alert,
  Typography,
  Stack,
  Fade,
  styled,
  useTheme,
  alpha,
  Avatar,
  Chip,
  Slider,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Remove,
  CheckOutlined as CheckIcon,
  TrendingUp,
  Settings,
  Calculate,
  Percent,
} from '@mui/icons-material';
import { formatCredits } from '@/services/payments';
import { getCurrentBrand } from '@/config/brandConfig';

// Modern styled components following theme guidelines
const ModernCard = styled(Card)(({ theme }) => ({
  borderRadius: `${getCurrentBrand().borderRadius}px`,
  border: `1px solid ${theme.palette.divider}`,
  background: theme.palette.background.default,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-1px)',
  },
}));

const ModernButton = styled(IconButton)(({ theme }) => ({
  background: 'transparent',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: `${getCurrentBrand().borderRadius}px`,
  width: 48,
  height: 48,
  color: theme.palette.text.primary,
  transition: 'all 0.2s ease',
  '&:hover': {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderColor: theme.palette.primary.main,
    transform: 'scale(0.95)',
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
    '&:hover': {
      transform: 'none',
      background: 'transparent',
      color: theme.palette.text.primary,
      borderColor: theme.palette.divider,
    },
  },
}));

const ModernTextField = styled(TextField)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    '& .MuiOutlinedInput-root': {
      background: theme.palette.background.paper,
      borderRadius: `${brand.borderRadius}px`,
      border: `1px solid ${theme.palette.divider}`,
      '& fieldset': {
        border: 'none',
      },
      '&:hover': {
        borderColor: theme.palette.primary.main,
      },
      '&.Mui-focused': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
      },
      '&.Mui-disabled': {
        background: theme.palette.action.disabledBackground,
      },
    },
    '& .MuiInputLabel-root': {
      fontWeight: 600,
      color: theme.palette.text.secondary,
      fontFamily: brand.fonts.body,
    },
    '& .MuiInputBase-input': {
      fontWeight: 600,
      fontSize: '1rem',
      fontFamily: brand.fonts.body,
    },
  };
});

const GradientAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'gradient',
})<{ gradient: string }>(({ gradient }) => {
  const brand = getCurrentBrand();
  return {
    background: gradient,
    borderRadius: `${brand.borderRadius}px`,
    width: 40,
    height: 40,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };
});

const FeatureItem = styled(Box)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    borderRadius: `${brand.borderRadius}px`,
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateX(4px)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
  };
});

const PricingContainer = styled(Box)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    padding: theme.spacing(3),
    borderRadius: `${brand.borderRadius}px`,
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    marginTop: theme.spacing(3),
  };
});

const ModernSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.primary.main,
  height: 8,
  '& .MuiSlider-track': {
    border: 'none',
    background: theme.palette.primary.main,
  },
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: theme.palette.background.paper,
    border: `3px solid ${theme.palette.primary.main}`,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.4)}`,
    },
  },
  '& .MuiSlider-rail': {
    background: alpha(theme.palette.text.primary, 0.1),
  },
}));

interface CustomPricing {
  basePricePerCredit: number;
  discountTiers: Array<{
    minCredits: number;
    maxCredits: number;
    discountPercent: number;
    name: string;
  }>;
}

interface CustomPackageSectionProps {
  isCustomMode: boolean;
  customCredits: number;
  customAmount: number;
  config: {
    validation?: {
      minCredits?: number;
      maxCredits?: number;
    };
  };
  validationErrors: string[];
  customPricing: CustomPricing;
  onCreditsChange: (value: number) => void;
}

interface PricingResult {
  credits: number;
  basePrice: number;
  discountPercent: number;
  price: number;
  savings: number;
  pricePerCredit: number;
  tierName: string;
}

// Custom pricing calculation logic
const calculateCustomPrice = (
  credits: number,
  customPricing: CustomPricing
): PricingResult => {
  if (!customPricing || !customPricing.discountTiers) {
    const basePrice = credits * 0.09;
    return {
      credits,
      basePrice: Math.round(basePrice),
      discountPercent: 0,
      price: Math.round(basePrice),
      savings: 0,
      pricePerCredit: 0.09,
      tierName: 'Standard Rate',
    };
  }

  const basePricePerCredit = customPricing.basePricePerCredit || 0.09;

  const tier = customPricing.discountTiers.find(
    (t) => credits >= t.minCredits && credits <= t.maxCredits
  );

  if (!tier) {
    const maxTier =
      customPricing.discountTiers[customPricing.discountTiers.length - 1];
    const basePrice = credits * basePricePerCredit;
    const discount = maxTier.discountPercent;
    const discountedPrice = basePrice * (1 - discount / 100);
    const savings = basePrice - discountedPrice;

    return {
      credits,
      basePrice: Math.round(basePrice),
      discountPercent: discount,
      price: Math.round(discountedPrice),
      savings: Math.round(savings),
      pricePerCredit: discountedPrice / credits,
      tierName: maxTier.name,
    };
  }

  const basePrice = credits * basePricePerCredit;
  const discount = tier.discountPercent;
  const discountedPrice = basePrice * (1 - discount / 100);
  const savings = basePrice - discountedPrice;

  return {
    credits,
    basePrice: Math.round(basePrice),
    discountPercent: discount,
    price: Math.round(discountedPrice),
    savings: Math.round(savings),
    pricePerCredit: discountedPrice / credits,
    tierName: tier.name,
  };
};

export function CustomPackageSection({
  isCustomMode,
  customCredits,
  customAmount,
  config,
  validationErrors,
  customPricing,
  onCreditsChange,
}: CustomPackageSectionProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  if (!isCustomMode) return null;

  const minCredits = config?.validation?.minCredits || 100;
  const maxCredits = config?.validation?.maxCredits || 1000000;
  const pricing = calculateCustomPrice(customCredits, customPricing);

  // Calculate progress for visual feedback
  const progress =
    ((customCredits - minCredits) / (maxCredits - minCredits)) * 100;

  return (
    <Fade in={isCustomMode} timeout={600}>
      <ModernCard
        sx={{
          mb: 6,
          maxWidth: 800,
          mx: 'auto',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <GradientAvatar gradient={`linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`}>
              <Settings sx={{ color: theme.palette.primary.contrastText }} />
            </GradientAvatar>
            <Box>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Custom Credit Package
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Configure your perfect credit amount with automatic bulk
                discounts
              </Typography>
            </Box>
          </Box>

          {/* Slider for visual feedback */}
          <Box sx={{ p: 3, mb: 2 }}>
            <ModernSlider
              value={customCredits}
              min={minCredits}
              max={Math.min(maxCredits, 500000)}
              step={100}
              onChange={(_, value) => onCreditsChange(value as number)}
              marks={[
                { value: minCredits, label: formatCredits(minCredits) },
                { value: 25000, label: '25K' },
                { value: 50000, label: '50K' },
                { value: 100000, label: '100K' },
                { value: 200000, label: '200K' },
                { value: 300000, label: '300K' },
                { value: 400000, label: '400K' },
                { value: 500000, label: '500K' },
              ]}
            />
          </Box>

          <Grid container spacing={4}>
            {/* Credits Input Section */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontFamily: brand.fonts.body,
                }}
              >
                <Calculate
                  sx={{ fontSize: 20, color: theme.palette.primary.main }}
                />
                Credits Amount
              </Typography>

              {/* Control Buttons */}
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}
              >
                <ModernButton
                  onClick={() => onCreditsChange(customCredits - 1000)}
                  disabled={customCredits <= minCredits}
                  size="large"
                  aria-label="Decrease credits by 1000"
                >
                  <Remove />
                </ModernButton>

                <ModernTextField
                  type="number"
                  value={customCredits}
                  onChange={(e) =>
                    onCreditsChange(parseInt(e.target.value) || 0)
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color="text.secondary"
                        >
                          credits
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                  inputProps={{
                    min: minCredits,
                    max: maxCredits,
                    step: 100,
                  }}
                />

                <ModernButton
                  onClick={() => onCreditsChange(customCredits + 1000)}
                  disabled={customCredits >= maxCredits}
                  size="large"
                  aria-label="Increase credits by 1000"
                >
                  <Add />
                </ModernButton>
              </Box>

              {/* Progress indicator */}
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Package Size
                  </Typography>
                  <Typography
                    variant="caption"
                    color="primary"
                    fontWeight="600"
                  >
                    {pricing.tierName}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progress, 100)}
                  color="primary"
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: theme.palette.primary.main,
                    },
                  }}
                />
              </Box>
            </Grid>

            {/* Price Display Section */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontFamily: brand.fonts.body,
                }}
              >
                <TrendingUp sx={{ fontSize: 20, color: 'success.main' }} />
                Auto-calculated Price
              </Typography>

              <ModernTextField
                type="number"
                value={customAmount}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography variant="body1" fontWeight="600">
                        ₹
                      </Typography>
                    </InputAdornment>
                  ),
                  readOnly: true,
                }}
                disabled
                fullWidth
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: theme.palette.text.primary,
                  },
                }}
              />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: 'block', textAlign: 'center' }}
              >
                Price automatically calculated with bulk discounts applied
              </Typography>

              {/* Discount indicator */}
              {pricing.discountPercent > 0 && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: `${brand.borderRadius}px`,
                    background: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(
                      theme.palette.success.main,
                      0.3
                    )}`,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="body2"
                    color="success.main"
                    fontWeight="bold"
                  >
                    🎉 {pricing.discountPercent}% Bulk Discount Applied!
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    You save ₹{pricing.savings} with this package size
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          {/* Enhanced Features Display */}
          {customCredits > 0 && customAmount > 0 && (
            <PricingContainer>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontFamily: brand.fonts.heading,
                }}
              >
                <CheckIcon sx={{ color: 'success.main' }} />
                Package Details
              </Typography>

              <Stack spacing={2}>
                <FeatureItem>
                  <GradientAvatar
                    gradient={`linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`}
                    sx={{ width: 32, height: 32 }}
                  >
                    <Calculate
                      sx={{
                        fontSize: 16,
                        color: theme.palette.info.contrastText,
                      }}
                    />
                  </GradientAvatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Price per credit: ₹
                      {(customAmount / customCredits).toFixed(3)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Competitive rate with bulk pricing
                    </Typography>
                  </Box>
                </FeatureItem>

                <FeatureItem>
                  <GradientAvatar
                    gradient={`linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`}
                    sx={{ width: 32, height: 32 }}
                  >
                    <TrendingUp
                      sx={{
                        fontSize: 16,
                        color: theme.palette.success.contrastText,
                      }}
                    />
                  </GradientAvatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Total credits: {formatCredits(customCredits)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ready to use immediately after purchase
                    </Typography>
                  </Box>
                </FeatureItem>

                {pricing.discountPercent > 0 && (
                  <FeatureItem>
                    <GradientAvatar
                      gradient={`linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`}
                      sx={{ width: 32, height: 32 }}
                    >
                      <Percent
                        sx={{
                          fontSize: 16,
                          color: theme.palette.warning.contrastText,
                        }}
                      />
                    </GradientAvatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Bulk discount: {pricing.discountPercent}% (Save ₹
                        {pricing.savings})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pricing.tierName} pricing tier
                      </Typography>
                    </Box>
                  </FeatureItem>
                )}
              </Stack>
            </PricingContainer>
          )}

          {/* Enhanced Error Display */}
          {validationErrors.length > 0 && (
            <Alert
              severity="error"
              sx={{
                mt: 3,
                borderRadius: `${brand.borderRadius}px`,
                background: alpha(theme.palette.error.main, 0.05),
                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              }}
            >
              <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
                Please fix the following issues:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>
                    <Typography variant="body2">{error}</Typography>
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          {/* Quick Amount Buttons */}
          <Box sx={{ mt: 4 }}>
            <Typography
              variant="subtitle2"
              fontWeight="600"
              sx={{ mb: 2, fontFamily: brand.fonts.body }}
            >
              Quick Select:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[1000, 5000, 10000, 25000, 50000].map((amount) => (
                <Chip
                  key={amount}
                  label={formatCredits(amount)}
                  onClick={() => onCreditsChange(amount)}
                  sx={{
                    background:
                      customCredits === amount
                        ? theme.palette.primary.main
                        : alpha(theme.palette.primary.main, 0.1),
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.3
                    )}`,
                    borderRadius: `${brand.borderRadius}px`,
                    color:
                      customCredits === amount
                        ? theme.palette.primary.contrastText
                        : theme.palette.primary.main,
                    fontWeight: 600,
                    fontFamily: brand.fonts.body,
                    '&:hover': {
                      background:
                        customCredits === amount
                          ? theme.palette.primary.dark
                          : alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </CardContent>
      </ModernCard>
    </Fade>
  );
}

CustomPackageSection.displayName = 'CustomPackageSection';