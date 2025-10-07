"use client";

import { Box, Tooltip, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
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

      {/* Admin Badge - Now fully theme-aware */}
      {isAdmin && (
        <Chip
          icon={<AdminPanelSettingsIcon />}
          label={accessLevel
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
          size="small"
          sx={{
            bgcolor: "background.paper",
            color: "primary.main",
            border: 1,
            borderColor: "divider",
            transition: theme.transitions.create(
              ["background-color", "border-color", "transform"],
              { duration: theme.transitions.duration.short }
            ),
            "&:hover": {
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.04)",
              borderColor: "primary.main",
              transform: "translateY(-1px)",
            },
            "& .MuiChip-icon": {
              color: "primary.main",
              fontSize: "1rem",
            },
            "& .MuiChip-label": {
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "text.primary",
            },
          }}
        />
      )}
    </Box>
  );
};

export default SubscriptionBadge;
