"use client";

import React from "react";
import { Box, Paper, Typography, Button, Stack, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import LockIcon from "@mui/icons-material/LockOutlined";
import InfoIcon from "@mui/icons-material/InfoOutlined";
import StarIcon from "@mui/icons-material/StarOutline";
import StarBorderIcon from "@mui/icons-material/StarBorderOutlined";
import MovieIcon from "@mui/icons-material/MovieOutlined";
import { useSubscription } from "@/hooks/auth/useSubscription";
import { SubscriptionLevels } from "@/config/constants";
import { getCurrentBrand } from "@/config/brandConfig";

// ===========================
// TYPE DEFINITIONS
// ===========================

type SubscriptionLevel =
  (typeof SubscriptionLevels)[keyof typeof SubscriptionLevels];

interface SubscriptionGateProps {
  requiredSubscription: SubscriptionLevel;
  message?: string;
  children?: React.ReactNode;
}

interface SubscriptionThemeInfo {
  level: number;
  stars: number;
  icon: React.ReactElement;
  description: string;
}

// ===========================
// SUBSCRIPTION CONFIGURATION
// ===========================

const subscriptionInfo: Record<SubscriptionLevel, SubscriptionThemeInfo> = {
  [SubscriptionLevels.STARTER]: {
    level: 1,
    stars: 1,
    icon: <MovieIcon />,
    description: "Basic media tools",
  },
  [SubscriptionLevels.PRO]: {
    level: 2,
    stars: 2,
    icon: <MovieIcon />,
    description: "Professional media suite",
  },
  [SubscriptionLevels.PREMIUM]: {
    level: 3,
    stars: 3,
    icon: <MovieIcon />,
    description: "Advanced media tools",
  },
  [SubscriptionLevels.ULTRA]: {
    level: 4,
    stars: 4,
    icon: <MovieIcon />,
    description: "Ultimate media platform",
  },
  [SubscriptionLevels.ENTERPRISE]: {
    level: 10,
    stars: 5,
    icon: <MovieIcon />,
    description: "Complete Control of your media platform",
  },
};

// ===========================
// HELPER COMPONENTS
// ===========================

interface SubscriptionStarsProps {
  count: number;
  total: number;
}

function SubscriptionStars({ count, total }: SubscriptionStarsProps) {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
      {[...Array(total)].map((_, i) =>
        i < count ? (
          <StarIcon
            key={i}
            sx={{
              color: theme.palette.primary.main,
              fontSize: "1.2rem",
            }}
          />
        ) : (
          <StarBorderIcon
            key={i}
            sx={{
              color: "text.secondary",
              fontSize: "1.2rem",
            }}
          />
        )
      )}
    </Box>
  );
}

interface SubscriptionChipProps {
  subscription: SubscriptionLevel;
  isRequired?: boolean;
}

function SubscriptionChip({ subscription, isRequired }: SubscriptionChipProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const info = subscriptionInfo[subscription];

  return (
    <Box sx={{ textAlign: "center", width: "100%" }}>
      <Chip
        icon={info.icon}
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2">
              {subscription.charAt(0).toUpperCase() + subscription.slice(1)}
            </Typography>
            <SubscriptionStars count={info.stars} total={4} />
          </Box>
        }
        sx={{
          minWidth: 200,
          p: 2,
          bgcolor: isRequired ? "primary.main" : "transparent",
          color: isRequired ? "primary.contrastText" : "text.primary",
          border: 1,
          borderColor: isRequired ? "transparent" : "divider",
          borderRadius: `${brand.borderRadius}px`,
          transition: theme.transitions.create(
            ["background-color", "transform"],
            { duration: theme.transitions.duration.short }
          ),
          "&:hover": {
            transform: isRequired ? "scale(1.02)" : "none",
          },
          "& .MuiChip-icon": {
            color: isRequired ? "primary.contrastText" : "text.primary",
          },
        }}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: "block" }}
      >
        {info.description}
      </Typography>
    </Box>
  );
}

// ===========================
// MAIN COMPONENT
// ===========================

export function SubscriptionGate({
  requiredSubscription,
  message,
  children,
}: SubscriptionGateProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();
  const { subscription: currentSubscription, hasFeatureAccess } =
    useSubscription();

  // Check if user has access
  if (hasFeatureAccess(requiredSubscription)) {
    return <>{children}</>;
  }

  const handleUpgradeClick = () => {
    router.push(
      `/dashboard/subscription-plans?recommended=${requiredSubscription}`
    );
  };

  const requiredInfo = subscriptionInfo[requiredSubscription];

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px",
        p: 3,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          maxWidth: 600,
          width: "100%",
          textAlign: "center",
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          position: "relative",
          overflow: "hidden",
          transition: theme.transitions.create("box-shadow", {
            duration: theme.transitions.duration.standard,
          }),
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
          },
        }}
      >
        <Stack spacing={4} alignItems="center">
          <LockIcon
            sx={{
              fontSize: 48,
              color: "primary.main",
              transition: theme.transitions.create("color", {
                duration: theme.transitions.duration.short,
              }),
            }}
          />

          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bgcolor: "background.paper",
              border: 1,
              borderColor: "primary.main",
              p: 2,
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <InfoIcon
              sx={{
                color: "primary.main",
                mb: 1,
              }}
            />
            <Typography variant="h5" sx={{ mb: 1, color: "text.primary" }}>
              Feature Not Available
            </Typography>
            <Typography color="text.secondary">
              {message ||
                `This feature requires a ${requiredSubscription} subscription or higher`}
            </Typography>
          </Box>

          <Stack spacing={3} width="100%">
            <Box>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                gutterBottom
              >
                Your Current Plan
              </Typography>
              <SubscriptionChip
                subscription={currentSubscription as SubscriptionLevel}
              />
            </Box>

            <Box>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                gutterBottom
              >
                Required Plan
              </Typography>
              <SubscriptionChip
                subscription={requiredSubscription}
                isRequired
              />
            </Box>
          </Stack>

          <Button
            variant="contained"
            size="large"
            onClick={handleUpgradeClick}
            sx={{
              mt: 2,
              px: 6,
              py: 1.5,
              borderRadius: `${brand.borderRadius}px`,
              textTransform: "none",
              fontSize: "1.1rem",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              transition: theme.transitions.create(
                ["background-color", "transform", "box-shadow"],
                { duration: theme.transitions.duration.short }
              ),
              "&:hover": {
                bgcolor: "primary.dark",
                transform: "translateY(-2px)",
                boxShadow: theme.shadows[8],
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            Upgrade to{" "}
            {requiredSubscription.charAt(0).toUpperCase() +
              requiredSubscription.slice(1)}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

// ===========================
// EXPORT DEFAULT
// ===========================

export default SubscriptionGate;
