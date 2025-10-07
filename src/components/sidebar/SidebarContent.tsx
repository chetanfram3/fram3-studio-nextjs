// src/components/sidebar/SidebarContent.tsx
"use client";

import { List, Box, Divider } from "@mui/material";
import { useNavigationItems } from "@/hooks/useNavigationItems";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarToggle } from "./SidebarToggle";

/**
 * SidebarContent Component
 * 
 * Renders the main content of the sidebar including:
 * - Toggle button for expanding/collapsing
 * - Navigation items from useNavigationItems hook
 * - Divider at the bottom
 */
export function SidebarContent() {
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
      
      {/* Bottom divider */}
      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.12)" }} />
    </Box>
  );
}