// src/components/sidebar/UserProfile.tsx
"use client";

import {
  Box,
  Avatar,
  Typography,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useSidebar } from "./SidebarContext";

interface UserProfileProps {
  user: User | null;
  showSidebar?: boolean; // Optional prop for temporary sidebar visibility
}

/**
 * UserProfile Component
 *
 * Displays user avatar and name in the sidebar
 * - Shows in bottom-left corner of sidebar
 * - Expands to show name when sidebar is expanded
 * - Clicking navigates to profile page
 * - Includes hover effects and transitions
 * - Uses Firebase User object for data
 */
export function UserProfile({ user, showSidebar }: UserProfileProps) {
  const router = useRouter();
  const { isExpanded } = useSidebar();
  const theme = useTheme();

  if (!user) return null;

  // Generate avatar URL from user's photo or create a default one
  const avatarUrl =
    user.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.displayName || "User"
    )}`;

  const displayName = user.displayName || "User";

  // Determine if the profile details should be shown
  // Based on sidebar expanded state from context
  const shouldShowDetails = isExpanded;

  return (
    <Box
      onClick={() => router.push("/profile")}
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        minHeight: 72,
        cursor: "pointer",
        transition: theme.transitions.create(
          ["background-color", "transform", "box-shadow"],
          { duration: theme.transitions.duration.shortest }
        ),
        "&:hover": {
          bgcolor: alpha(theme.palette.secondary.main, 0.08),
          transform: "translateX(5px)",
          boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
        },
        borderRadius: 1.5,
        mx: 1,
      }}
    >
      {/* User Avatar */}
      <Tooltip title={!shouldShowDetails ? displayName : ""} placement="right">
        <Avatar
          src={avatarUrl}
          alt={displayName}
          sx={{
            width: 42,
            height: 42,
            border: "2px solid",
            borderColor: theme.palette.secondary.main,
            boxShadow: `0 0 10px ${alpha(theme.palette.secondary.main, 0.3)}`,
            transition: theme.transitions.create(
              ["width", "height", "box-shadow", "transform"],
              { duration: theme.transitions.duration.standard }
            ),
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: `0 0 15px ${alpha(theme.palette.secondary.main, 0.5)}`,
            },
          }}
        />
      </Tooltip>

      {/* User Name - Only shown when expanded */}
      {shouldShowDetails && (
        <Typography
          variant="subtitle1"
          noWrap
          sx={{
            opacity: shouldShowDetails ? 1 : 0,
            transition: theme.transitions.create(["opacity", "transform"], {
              duration: theme.transitions.duration.standard,
            }),
            color: "text.primary",
            fontWeight: 600,
            fontSize: "0.95rem",
            letterSpacing: 0.3,
            transform: shouldShowDetails
              ? "translateX(0)"
              : "translateX(-20px)",
          }}
        >
          {displayName}
        </Typography>
      )}
    </Box>
  );
}
