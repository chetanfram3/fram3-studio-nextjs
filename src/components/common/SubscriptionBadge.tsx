"use client";

import { Box, Tooltip, Chip } from "@mui/material";
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

      {/* Admin Badge */}
      {isAdmin && (
        <Chip
          icon={<AdminPanelSettingsIcon />}
          label={accessLevel
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
          size="small"
          sx={{
            bgcolor: "background.default",
            color: "primary.main",
            border: (theme) => `1px solid ${theme.palette.grey[300]}`,
            "& .MuiChip-icon": {
              color: (theme) => theme.palette.grey[700],
              fontSize: "1rem",
            },
            "& .MuiChip-label": {
              fontSize: "0.75rem",
              fontWeight: 500,
            },
          }}
        />
      )}
    </Box>
  );
};

export default SubscriptionBadge;
