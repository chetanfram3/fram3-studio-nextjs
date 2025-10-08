"use client";

import React, { useState, useEffect } from "react";
import { Box, Drawer, useTheme, useMediaQuery, alpha } from "@mui/material";
import { useAuthStore } from "@/store/authStore";
import { useSidebar } from "./SidebarContext";
import { SidebarContent } from "./SidebarContent";
import { SIDEBAR_WIDTH, COLLAPSED_WIDTH } from "./constants";
import { UserProfile } from "./UserProfile";

export interface SidebarProps {
  children?: React.ReactNode;
}

// Calculate the height of the header (adjust if your header has a different height)
const HEADER_HEIGHT = 64; // Typically MUI AppBar is 64px

export function Sidebar({ children }: SidebarProps) {
  const theme = useTheme();
  const isMobileDevice = useMediaQuery(theme.breakpoints.down("md"));
  const { isExpanded, isMobile, setMobileView } = useSidebar();
  const { user } = useAuthStore();
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    setMobileView(isMobileDevice);
  }, [isMobileDevice, setMobileView]);

  const handleMouseEnter = () => {
    if (!isMobile) {
      setShowSidebar(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setShowSidebar(false);
    }
  };

  if (!user) return null;

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: theme.palette.background.default,
      }}
    >
      <SidebarContent />
      {children}
    </Box>
  );

  const drawerProps = {
    elevation: 0,
    PaperProps: {
      sx: {
        width: isExpanded ? SIDEBAR_WIDTH : COLLAPSED_WIDTH,
        backgroundColor: "transparent",
        color: "text.primary",
        borderRight: "none",
        boxShadow: "none",
        // Start below the header
        top: `${HEADER_HEIGHT}px`,
        height: `calc(100% - ${HEADER_HEIGHT}px)`,
        transition: theme.transitions.create(
          ["width", "transform", "box-shadow"],
          {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }
        ),
      },
    },
  };

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={isExpanded}
        onClose={() => setMobileView(false)}
        ModalProps={{ keepMounted: true }}
        {...drawerProps}
        sx={{
          "& .MuiDrawer-paper": {
            // For mobile drawer, needs to account for the header
            marginTop: `${HEADER_HEIGHT}px`,
            height: `calc(100% - ${HEADER_HEIGHT}px)`,
            boxShadow: theme.shadows[10],
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <>
      {/* Trigger area for hover - adjusted to start below header */}
      <Box
        onMouseEnter={handleMouseEnter}
        sx={{
          position: "fixed",
          top: HEADER_HEIGHT,
          left: 0,
          width: "20px",
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          zIndex: theme.zIndex.drawer + 1,
        }}
      />
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        open={showSidebar}
        onMouseLeave={handleMouseLeave}
        {...drawerProps}
        PaperProps={{
          ...drawerProps.PaperProps,
          sx: {
            ...drawerProps.PaperProps.sx,
            boxShadow: showSidebar
              ? `5px 0 25px ${alpha(theme.palette.common.black, 0.15)}`
              : "none",
            transform: showSidebar ? "none" : "translateX(-100%)",
          },
        }}
      >
        {drawerContent}
      </Drawer>
      {/* Bottom-left UserProfile - adjusted position to account for the header */}
      <Box
        sx={{
          position: "fixed",
          bottom: theme.spacing(2),
          left: theme.spacing(0),
          zIndex: theme.zIndex.tooltip,
          transition: theme.transitions.create(["transform", "opacity"], {
            duration: theme.transitions.duration.standard,
          }),
          opacity: 1,
          transform: "translateX(0)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            backgroundColor: theme.palette.background.default,
            borderRadius: "0 12px 12px 0",
            boxShadow: `2px 3px 10px ${alpha(
              theme.palette.common.black,
              0.15
            )}`,
            transition: theme.transitions.create(["box-shadow", "transform"], {
              duration: theme.transitions.duration.shortest,
            }),
            "&:hover": {
              boxShadow: `2px 3px 15px ${alpha(
                theme.palette.common.black,
                0.25
              )}`,
              transform: "translateX(5px)",
            },
          }}
          onMouseEnter={handleMouseEnter}
          onClick={() => setShowSidebar(true)}
        >
          <UserProfile user={user} />
        </Box>
      </Box>
    </>
  );
}