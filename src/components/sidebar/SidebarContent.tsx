// ===== SidebarContent.tsx =====
// src/components/sidebar/SidebarContent.tsx
"use client";

import { List, Box, Divider, useTheme, alpha } from "@mui/material";
import { useNavigationItems } from "@/hooks/useNavigationItems";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarToggle } from "./SidebarToggle";

export function SidebarContent() {
  const theme = useTheme();
  const navigationItems = useNavigationItems();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toggle button at the top */}
      <SidebarToggle />

      {/* Navigation items list */}
      <List sx={{ flex: 1, py: 2 }}>
        {navigationItems.map((item, index) => (
          <SidebarNavItem key={item.path || index} item={item} />
        ))}
      </List>

      {/* Bottom divider - Theme aware */}ß
      <Divider
        sx={{
          borderColor: alpha(theme.palette.divider, 0.6),
        }}
      />
    </Box>
  );
}
