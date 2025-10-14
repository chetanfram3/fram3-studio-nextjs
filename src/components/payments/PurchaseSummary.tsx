"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  CircularProgress,
  Chip,
  styled,
  useTheme,
  alpha,
  Avatar,
} from "@mui/material";
import {
  CreditCard,
  LocationOn,
  Receipt,
  Percent,
  CurrencyRupee,
  AccountBalance,
  Security,
} from "@mui/icons-material";
import { formatCurrency, formatCredits, GSTConfig } from "@/services/payments";
import { ProfileTaxService } from "@/services/profileTaxService";
import { UserProfile } from "@/types/profile";
import { getCurrentBrand } from "@/config/brandConfig";

// Modern styled components matching Cr3ditSys design
const ModernSummaryCard = styled(Card)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: `${brand.borderRadius}px`,
    border: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.default,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    transition: "all 0.2s ease",
    height: "fit-content",
    "&:hover": {
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      transform: "translateY(-1px)",
    },
  };
});

const ModernPayButton = styled(Button)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: `${brand.borderRadius}px`,
    border: "none",
    fontWeight: 600,
    fontFamily: brand.fonts.body,
    textTransform: "none",
    padding: "12px 24px",
    fontSize: "1rem",
    transition: "all 0.2s ease",
    "&:hover": {
      background: theme.palette.primary.dark,
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(0px)",
    },
    "&.Mui-disabled": {
      background: theme.palette.action.disabledBackground,
      color: theme.palette.text.disabled,
      transform: "none",
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
    width: 40,
    height: 40,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  };
});

const TaxBreakdownContainer = styled(Box)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    padding: theme.spacing(2),
    borderRadius: `${brand.borderRadius}px`,
    background: alpha(theme.palette.info.main, 0.05),
    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
    marginBottom: theme.spacing(2),
  };
});

const ProcessingContainer = styled(Box)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(3),
    borderRadius: `${brand.borderRadius}px`,
    background: alpha(theme.palette.primary.main, 0.05),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    margin: theme.spacing(2, 0),
  };
});

const ProcessingText = styled(Typography)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    color: theme.palette.primary.main,
    fontWeight: "bold",
    fontFamily: brand.fonts.heading,
    textAlign: "center",
  };
});

interface CurrentPackage {
  credits: number;
  name: string;
  price: number;
  discount: number;
  savings: number;
  tierName?: string;
}

interface PurchaseSummaryProps {
  currentPackage: CurrentPackage | null;
  isValidPackage: boolean;
  paymentStatus: string;
  userProfile?: UserProfile | null;
  gstConfig?: GSTConfig;
  onDirectPayment: () => void;
}

export function PurchaseSummary({
  currentPackage,
  isValidPackage,
  paymentStatus,
  userProfile,
  gstConfig,
  onDirectPayment,
}: PurchaseSummaryProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  if (!currentPackage) return null;

  // Calculate tax using profile data AND backend GST config
  const taxCalculation = userProfile
    ? ProfileTaxService.calculateTaxFromProfile(
        currentPackage.price,
        userProfile,
        gstConfig
      )
    : null;

  // Fallback using backend GST config or default
  const gstRate = gstConfig?.rate || 18;
  const fallbackGST = Math.round((currentPackage.price * gstRate) / 100);
  const fallbackTotal = currentPackage.price + fallbackGST;

  const finalGSTAmount = taxCalculation?.gstAmount || fallbackGST;
  const finalTotal = taxCalculation?.totalAmount || fallbackTotal;
  const taxType = taxCalculation?.taxType || "IGST";
  const isInterState = taxCalculation?.isInterState ?? true;

  // Show processing state when payment is in progress
  if (paymentStatus === "processing") {
    return (
      <ModernSummaryCard>
        <CardContent sx={{ p: 4 }}>
          <ProcessingContainer>
            <CircularProgress
              size={48}
              thickness={4}
              sx={{ color: "primary.main" }}
            />
            <ProcessingText variant="h6">Processing Payment...</ProcessingText>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 1, fontFamily: brand.fonts.body }}
            >
              {formatCredits(currentPackage.credits)} credits •{" "}
              {formatCurrency(finalTotal)}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Complete payment in Razorpay window
            </Typography>

            {/* Security indicator during processing */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
              <Security sx={{ fontSize: 16, color: "success.main" }} />
              <Typography
                variant="caption"
                color="success.main"
                fontWeight="600"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Secure Payment in Progress
              </Typography>
            </Box>
          </ProcessingContainer>
        </CardContent>
      </ModernSummaryCard>
    );
  }

  return (
    <ModernSummaryCard>
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <GradientAvatar
            gradient={`linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`}
          >
            <Receipt sx={{ color: theme.palette.info.contrastText }} />
          </GradientAvatar>
          <Box>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Order Summary
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Review before payment
            </Typography>
          </Box>
        </Box>

        {/* Price Breakdown */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          {/* Base Amount */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CurrencyRupee sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography
                variant="body1"
                fontWeight="600"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Base Amount:
              </Typography>
            </Box>
            <Typography
              variant="body1"
              fontWeight="600"
              sx={{ fontFamily: brand.fonts.body }}
            >
              {formatCurrency(currentPackage.price)}
            </Typography>
          </Box>

          {/* Discount Display */}
          {currentPackage.discount > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Percent sx={{ fontSize: 18, color: "success.main" }} />
                <Typography
                  variant="body1"
                  color="success.main"
                  fontWeight="600"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Discount ({currentPackage.discount}%):
                </Typography>
              </Box>
              <Typography
                variant="body1"
                color="success.main"
                fontWeight="600"
                sx={{ fontFamily: brand.fonts.body }}
              >
                -{formatCurrency(Math.round(currentPackage.savings || 0))}
              </Typography>
            </Box>
          )}

          {/* Tax Information */}
          {taxCalculation ? (
            <TaxBreakdownContainer>
              <Typography
                variant="body2"
                fontWeight="600"
                sx={{
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  fontFamily: brand.fonts.body,
                }}
              >
                <AccountBalance sx={{ fontSize: 16 }} />
                Tax ({taxType})
              </Typography>

              {isInterState ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    IGST (18%):
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    {formatCurrency(finalGSTAmount)}
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: brand.fonts.body }}
                    >
                      CGST (9%):
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: brand.fonts.body }}
                    >
                      {formatCurrency(taxCalculation.breakdown.cgst)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: brand.fonts.body }}
                    >
                      SGST (9%):
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: brand.fonts.body }}
                    >
                      {formatCurrency(taxCalculation.breakdown.sgst)}
                    </Typography>
                  </Box>
                </>
              )}

              {/* Tax source information */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 1,
                  p: 1,
                  borderRadius: `${brand.borderRadius}px`,
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                }}
              >
                <LocationOn sx={{ fontSize: 12, color: "text.secondary" }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {taxCalculation.stateInfo.customerState}
                </Typography>
                {taxCalculation.customerType === "B2B" && (
                  <Chip
                    label="Business"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.65rem",
                      borderRadius: `${brand.borderRadius}px`,
                      fontFamily: brand.fonts.body,
                      "& .MuiChip-label": { px: 0.5 },
                    }}
                  />
                )}
              </Box>
            </TaxBreakdownContainer>
          ) : (
            <>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccountBalance
                    sx={{ fontSize: 18, color: "text.secondary" }}
                  />
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    GST (18%):
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {formatCurrency(fallbackGST)}
                </Typography>
              </Box>
            </>
          )}
        </Stack>

        <Divider sx={{ borderStyle: "dashed", opacity: 0.7, my: 2 }} />

        {/* Final Total */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderRadius: `${brand.borderRadius}px`,
            background: alpha(theme.palette.success.main, 0.05),
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ fontFamily: brand.fonts.heading }}
          >
            Total Amount:
          </Typography>
          <Typography
            variant="h5"
            fontWeight="bold"
            color="success.main"
            sx={{ fontFamily: brand.fonts.heading }}
          >
            {formatCurrency(finalTotal)}
          </Typography>
        </Box>

        {/* Payment Button */}
        <ModernPayButton
          fullWidth
          size="large"
          onClick={onDirectPayment}
          disabled={!isValidPackage}
          startIcon={<CreditCard />}
        >
          Pay {formatCurrency(finalTotal)} Securely
        </ModernPayButton>

        {/* Security badges */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
          <Chip
            label="256-bit SSL"
            size="small"
            sx={{
              background: alpha(theme.palette.success.main, 0.1),
              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
              borderRadius: `${brand.borderRadius}px`,
              color: "success.main",
              fontWeight: 600,
              fontFamily: brand.fonts.body,
              fontSize: "0.7rem",
            }}
          />
          <Chip
            label="Razorpay"
            size="small"
            sx={{
              background: alpha(theme.palette.info.main, 0.1),
              border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
              borderRadius: `${brand.borderRadius}px`,
              color: "info.main",
              fontWeight: 600,
              fontFamily: brand.fonts.body,
              fontSize: "0.7rem",
            }}
          />
        </Box>

        {/* Tax compliance note */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontStyle: "italic",
            display: "block",
            textAlign: "center",
            mt: 2,
            opacity: 0.8,
            fontFamily: brand.fonts.body,
          }}
        >
          * All prices inclusive of applicable GST
        </Typography>
      </CardContent>
    </ModernSummaryCard>
  );
}

PurchaseSummary.displayName = "PurchaseSummary";
