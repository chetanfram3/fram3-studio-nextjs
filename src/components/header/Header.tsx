"use client";

import { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  useMediaQuery,
  Drawer,
  Typography,
  useTheme,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { ProfileButton } from "./components/ProfileButton";
import { ProfileMenu } from "./components/ProfileMenu";
import { ThemeSwitch } from "./components/ThemeSwitch";
import { ProjectSearch } from "@/components/search/ProjectSearch";
import SubscriptionBadge from "@/components/common/SubscriptionBadge";
import { Logo } from "./Logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isMobile) {
      setMobileMenuOpen(true);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "transparent",
          boxShadow: "none",
          borderBottom: "none",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            p: isMobile ? 1 : 2,
            minHeight: { xs: "56px", sm: "64px" },
          }}
        >
          <Logo />

          {isMobile ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <NotificationBell />
              <ThemeSwitch />
              <ProfileButton onClick={handleProfileClick} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <SubscriptionBadge />
              <ProjectSearch />
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  height: 24,
                  my: "auto",
                  borderColor: "divider",
                }}
              />
              <NotificationBell />
              <ThemeSwitch />
              <ProfileButton onClick={handleProfileClick} />
            </Box>
          )}

          <ProfileMenu anchorEl={anchorEl} onClose={handleClose} />
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        slotProps={{
          paper: {
            sx: {
              width: "85%",
              maxWidth: "320px",
              borderRadius: "12px 0 0 12px",
              bgcolor: "background.default",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Menu
          </Typography>
          <IconButton onClick={handleMobileMenuClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        <Box sx={{ maxHeight: "calc(100vh - 100px)", overflow: "auto" }}>
          <ProfileMenu
            anchorEl={null}
            onClose={handleMobileMenuClose}
            isMobile={true}
          />
        </Box>

        <Box sx={{ p: 2, mt: "auto" }}>
          <SubscriptionBadge />
          <Box sx={{ mt: 2 }}>
            <ProjectSearch />
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
