"use client";

import { Box, Tooltip, Chip } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useAuthStore } from "@/store/authStore";
import { SubscriptionLevels, AccessLevels } from "@/config/constants";
import {
  StarterBadge,
  ProBadge,
  PremiumBadge,
  UltraBadge,
  EnterpriseBadge,
} from "@/assets/icons/subscription-icons";

type SubscriptionLevel =
  (typeof SubscriptionLevels)[keyof typeof SubscriptionLevels];

export const SubscriptionBadge = () => {
  const theme = useTheme();
  const { claims } = useAuthStore();

  const subscription = (claims?.subscription || "starter") as SubscriptionLevel;
  const accessLevel = claims?.access_level;

  const isAdmin =
    accessLevel === AccessLevels.ADMIN ||
    accessLevel === AccessLevels.TEAM_ADMIN;

  // Mapping subscription levels to corresponding badge components
  const badgeComponents: Record<string, React.ComponentType<any>> = {
    starter: StarterBadge,
    pro: ProBadge,
    premium: PremiumBadge,
    ultra: UltraBadge,
    enterprise: EnterpriseBadge,
  };

  // Select the correct badge component or default to StarterBadge
  const SubscriptionIcon =
    badgeComponents[subscription.toLowerCase()] || StarterBadge;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {/* Subscription Icon with Tooltip */}
      <Tooltip
        title={
          "You are subscribed to our " +
          subscription.charAt(0).toUpperCase() +
          subscription.slice(1) +
          " plan!"
        }
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <SubscriptionIcon sx={{ fontSize: "2.5rem" }} />
        </Box>
      </Tooltip>

      {/* Admin Badge - Fully Theme-Aware */}
      {isAdmin && (
        <Chip
          icon={<AdminPanelSettingsIcon />}
          label={accessLevel
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
          size="small"
          sx={{
            // Use subtle background based on theme mode
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.primary.main, 0.15)
                : alpha(theme.palette.primary.main, 0.08),

            // Primary color for text
            color: "primary.main",

            // Subtle border with primary color
            border: 1,
            borderColor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.primary.main, 0.3)
                : alpha(theme.palette.primary.main, 0.2),

            // Smooth transitions
            transition: theme.transitions.create(
              ["background-color", "border-color", "transform", "box-shadow"],
              { duration: theme.transitions.duration.short }
            ),

            // Hover effects
            "&:hover": {
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.primary.main, 0.25)
                  : alpha(theme.palette.primary.main, 0.15),

              borderColor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.primary.main, 0.5)
                  : alpha(theme.palette.primary.main, 0.4),

              transform: "translateY(-1px)",

              boxShadow:
                theme.palette.mode === "dark"
                  ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                  : `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
            },

            // Icon styling
            "& .MuiChip-icon": {
              color: "primary.main",
              fontSize: "1rem",
            },

            // Label styling
            "& .MuiChip-label": {
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "primary.main",
            },
          }}
        />
      )}
    </Box>
  );
};

export default SubscriptionBadge;
