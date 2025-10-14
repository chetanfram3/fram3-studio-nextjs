// src/components/payments/SuccessErrorDialogs.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  styled,
  useTheme,
  alpha,
  Avatar,
  Fade,
  Slide,
  keyframes,
} from "@mui/material";
import {
  CheckCircle,
  Error,
  CreditCard,
  AccountBalance,
} from "@mui/icons-material";
import { formatCurrency, formatCredits } from "@/services/payments";

// Keyframes for animations
const float = keyframes`
  0%, 100% { transform: translateY(0px) }
  50% { transform: translateY(-10px) }
`;

// Modern styled components matching Cr3ditSys design
const ModernDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    background: theme.palette.background.default,
    borderRadius: "4px",
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    position: "relative",
  },
}));

const GradientAvatar = styled(Avatar)<{ gradient: string; size?: number }>(
  ({ gradient, size = 64 }) => ({
    background: gradient,
    borderRadius: "16px",
    width: size,
    height: size,
    margin: "0 auto",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    animation: `${float} 3s ease-in-out infinite`,
    position: "relative",
  })
);

const ModernButton = styled(Button)<{
  buttonVariant?: "primary" | "secondary" | "success" | "error";
}>(({ theme, buttonVariant = "primary" }) => {
  const getButtonStyles = () => {
    switch (buttonVariant) {
      case "success":
        return {
          background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
          color: "white",
          "&:hover": {
            background: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
            transform: "translateY(-1px)",
          },
        };
      case "error":
        return {
          background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
          color: "white",
          "&:hover": {
            background: "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)",
            transform: "translateY(-1px)",
          },
        };
      case "secondary":
        return {
          background: "transparent",
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          "&:hover": {
            background: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            borderColor: theme.palette.secondary.main,
            transform: "translateY(-1px)",
          },
        };
      default:
        return {
          background: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
          "&:hover": {
            background: theme.palette.secondary.dark,
            transform: "translateY(-1px)",
          },
        };
    }
  };

  return {
    borderRadius: "8px",
    fontWeight: 600,
    textTransform: "none",
    padding: "10px 20px",
    transition: "all 0.2s ease",
    "&:active": {
      transform: "translateY(0px)",
    },
    ...getButtonStyles(),
  };
});

const InfoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: "4px",
  background: alpha(theme.palette.info.main, 0.05),
  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
  margin: theme.spacing(2, 0),
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: "4px",
    height: "100%",
    background: theme.palette.info.main,
  },
}));

interface PaymentResult {
  credits: {
    loaded: number;
    newBalance: number;
  };
}

interface SuccessErrorDialogsProps {
  paymentStatus: string;
  paymentResult: PaymentResult | null;
  onComplete: () => void;
  error: string | null;
  onRetry: () => void;
  onNavigateToBilling: () => void;
}

export const SuccessErrorDialogs: React.FC<SuccessErrorDialogsProps> = ({
  paymentStatus,
  paymentResult,
  onComplete,
  error,
  onRetry,
  onNavigateToBilling,
}) => {
  const theme = useTheme();

  return (
    <>
      {/* ✅ Success Dialog */}
      <ModernDialog
        open={paymentStatus === "success"}
        onClose={onComplete}
        maxWidth="sm"
        fullWidth
        slots={{
          transition: Fade,
        }}
        slotProps={{
          transition: { timeout: 600 },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pt: 4, pb: 2 }}>
          <GradientAvatar
            gradient="linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)"
            size={80}
            sx={{ mb: 2 }}
          >
            <CheckCircle
              sx={{
                fontSize: 40,
                color: "white",
                zIndex: 2,
                position: "relative",
              }}
            />
          </GradientAvatar>
          <Typography
            variant="h4"
            fontWeight="bold"
            color="success.main"
            sx={{ mb: 1 }}
          >
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your credits have been added to your account
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 4, py: 2, textAlign: "center" }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              fontWeight="bold"
              color="success.main"
              sx={{ mb: 1 }}
            >
              +{formatCredits(paymentResult?.credits?.loaded || 0)} credits
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Successfully added to your account
            </Typography>
          </Box>

          <InfoContainer>
            <Stack direction="row" spacing={2} alignItems="center">
              <GradientAvatar
                gradient="linear-gradient(135deg, #2196F3 0%, #1976D2 100%)"
                size={40}
              >
                <AccountBalance
                  sx={{
                    fontSize: 20,
                    color: "white",
                    zIndex: 2,
                    position: "relative",
                  }}
                />
              </GradientAvatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  color="primary.main"
                >
                  Updated Balance
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCredits(paymentResult?.credits?.newBalance || 0)}{" "}
                  credits
                </Typography>
              </Box>
            </Stack>
          </InfoContainer>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Your credits are ready to use immediately
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", p: 4, pt: 2 }}>
          <ModernButton
            buttonVariant="success"
            onClick={onComplete}
            size="large"
            sx={{ px: 4 }}
          >
            Continue to Dashboard
          </ModernButton>
        </DialogActions>
      </ModernDialog>

      {/* ✅ Error Dialog */}
      <ModernDialog
        open={paymentStatus === "error"}
        onClose={onRetry}
        maxWidth="sm"
        fullWidth
        slots={{
          transition: Slide,
        }}
        slotProps={{
          transition: { direction: "up" },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pt: 4, pb: 2 }}>
          <GradientAvatar
            gradient="linear-gradient(135deg, #f44336 0%, #d32f2f 100%)"
            size={80}
            sx={{ mb: 2 }}
          >
            <Error
              sx={{
                fontSize: 40,
                color: "white",
                zIndex: 2,
                position: "relative",
              }}
            />
          </GradientAvatar>
          <Typography
            variant="h4"
            fontWeight="bold"
            color="error.main"
            sx={{ mb: 1 }}
          >
            Payment Failed
          </Typography>
          <Typography variant="body1" color="text.secondary">
            We encountered an issue processing your payment
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 4, py: 2, textAlign: "center" }}>
          <InfoContainer>
            <Typography variant="body1" fontWeight="600" sx={{ mb: 1 }}>
              Error Details:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error ||
                "An unexpected error occurred while processing your payment. Please try again or contact support if the issue persists."}
            </Typography>
          </InfoContainer>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No charges have been made to your account
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", p: 4, pt: 2, gap: 2 }}>
          <ModernButton buttonVariant="secondary" onClick={onNavigateToBilling}>
            Go to Billing
          </ModernButton>
          <ModernButton
            buttonVariant="error"
            onClick={onRetry}
            startIcon={<CreditCard />}
          >
            Try Again
          </ModernButton>
        </DialogActions>
      </ModernDialog>
    </>
  );
};
