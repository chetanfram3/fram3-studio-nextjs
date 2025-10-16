"use client";

import {
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Avatar,
  Typography,
  ListItemButton,
} from "@mui/material";
import {
  DashboardOutlined as DashboardIcon,
  PersonOutline as PersonIcon,
  LogoutOutlined as LogoutIcon,
  PaymentOutlined as PaymentIcon,
  PaymentsOutlined as SubscriptionIcon,
  PolicyOutlined as PolicyIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebase";
import { EmailVerificationAlert } from "./EmailVerificationAlert";

interface ProfileMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  isMobile?: boolean;
}

export function ProfileMenu({
  anchorEl,
  onClose,
  isMobile = false,
}: ProfileMenuProps) {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuthStore();

  const handleMenuItemClick = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleLogout = async () => {
    onClose();
    await auth.signOut();
    router.push("/signin");
  };

  const menuItemStyles = {
    "& .MuiListItemIcon-root": {
      color: "inherit",
      minWidth: 36,
    },
    "&:hover": {
      bgcolor: "action.hover",
    },
  };

  const renderMenuContent = () => (
    <Box>
      <Box sx={{ px: 2, py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            src={
              user?.photoURL ||
              `https://ui-avatars.com/api/?name=${user?.displayName || "User"}`
            }
            alt={user?.displayName || "User"}
            sx={{
              width: 48,
              height: 48,
              border: 2,
              borderColor: "primary.main",
            }}
          />
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                color: "text.primary",
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              {user?.displayName || "User"}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: "0.875rem",
              }}
            >
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ p: isMobile ? 1 : 0 }}>
        <ListItemButton
          onClick={() => handleMenuItemClick("/dashboard")}
          sx={menuItemStyles}
        >
          <ListItemIcon>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        <ListItemButton
          onClick={() => handleMenuItemClick("/profile")}
          sx={menuItemStyles}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItemButton>

        <ListItemButton
          onClick={() => handleMenuItemClick("/billing")}
          sx={menuItemStyles}
        >
          <ListItemIcon>
            <PaymentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Billing" />
        </ListItemButton>

        <ListItemButton
          onClick={() => handleMenuItemClick("/payments")}
          sx={menuItemStyles}
        >
          <ListItemIcon>
            <SubscriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Load Credits" />
        </ListItemButton>

        <ListItemButton
          onClick={() => handleMenuItemClick("/legal")}
          sx={menuItemStyles}
        >
          <ListItemIcon>
            <PolicyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Policy (T&C)" />
        </ListItemButton>

        <Box sx={{ px: 2, py: 1 }}>
          <EmailVerificationAlert />
        </Box>

        <Divider sx={{ my: 1 }} />

        <ListItemButton
          onClick={handleLogout}
          sx={{
            ...menuItemStyles,
            color: "error.main",
            "& .MuiListItemIcon-root": {
              color: "error.main",
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  if (isMobile) {
    return renderMenuContent();
  }

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      onClick={onClose}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      slotProps={{
        paper: {
          elevation: 1,
          sx: {
            mt: 1.5,
            minWidth: 220,
            maxWidth: 280,
            bgcolor: "background.paper",
            borderRadius: theme.shape.borderRadius,
            border: 1,
            borderColor: "divider",
            "& .MuiMenuItem-root": {
              py: 1,
              px: 2,
            },
            "& .MuiDivider-root": {
              borderColor: "divider",
            },
          },
        },
      }}
    >
      {renderMenuContent()}
    </Menu>
  );
}
