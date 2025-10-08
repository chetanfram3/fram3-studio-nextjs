// src/components/sidebar/SidebarNavItem.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import { useSidebar } from "./SidebarContext";
import type { NavigationItem } from "@/hooks/useNavigationItems";

interface SidebarNavItemProps {
  item: NavigationItem;
}

export function SidebarNavItem({ item }: SidebarNavItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isExpanded, isMobile, toggleSidebar } = useSidebar();
  const theme = useTheme();
  const isActive = pathname === item.path;

  const handleClick = () => {
    if (item.path) {
      router.push(item.path);
      if (isMobile) {
        toggleSidebar();
      }
    }
  };

  const Icon = item.Icon;
  const tooltipTitle = !isExpanded
    ? item.getTooltip
      ? item.getTooltip()
      : item.label
    : "";

  // Theme-aware colors using primary instead of secondary
  const isDarkMode = theme.palette.mode === "dark";

  // Active state colors
  const activeColor = theme.palette.primary.main;
  const activeBgColor = isDarkMode
    ? alpha(theme.palette.primary.main, 0.2) // Gold 20% in dark
    : alpha(theme.palette.primary.main, 0.12); // Bronze 12% in light

  // Hover state colors
  const hoverBgColor = isDarkMode
    ? alpha(theme.palette.primary.main, 0.15) // Gold 15% in dark
    : alpha(theme.palette.primary.main, 0.08); // Bronze 8% in light

  return (
    <Tooltip title={tooltipTitle} placement="right">
      {/* Wrapper to ensure Tooltip works with disabled children */}
      <span style={{ display: "flex", width: "100%" }}>
        <ListItem
          onClick={handleClick}
          sx={{
            px: 2,
            py: 1.5,
            cursor: "pointer",
            my: 0.5,
            borderRadius: 1.5,
            mx: 1,
            bgcolor: isActive ? activeBgColor : "transparent",
            transition: theme.transitions.create(
              ["background-color", "box-shadow", "transform"],
              { duration: theme.transitions.duration.shorter }
            ),
            "&:hover": {
              bgcolor: isActive ? hoverBgColor : hoverBgColor,
              transform: "translateX(5px)",
              boxShadow: isActive
                ? `0 0 12px ${alpha(activeColor, 0.3)}`
                : `0 0 8px ${alpha(activeColor, 0.2)}`,
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 40,
              color: isActive ? activeColor : "text.primary",
              transition: theme.transitions.create(
                ["margin", "color", "transform"],
                { duration: theme.transitions.duration.standard }
              ),
              ...(isExpanded ? {} : { mr: 0 }),
              ...(isActive && {
                transform: "scale(1.1)",
              }),
              "& svg": {
                transition: theme.transitions.create(["color", "transform"], {
                  duration: theme.transitions.duration.shorter,
                }),
              },
              "&:hover svg": {
                color: activeColor,
                transform: "scale(1.1)",
              },
            }}
          >
            {Icon && <Icon />}
          </ListItemIcon>
          {isExpanded && (
            <ListItemText
              primary={item.label}
              sx={{
                opacity: isExpanded ? 1 : 0,
                transition: theme.transitions.create(
                  ["opacity", "width", "transform"],
                  { duration: theme.transitions.duration.standard }
                ),
                "& .MuiTypography-root": {
                  color: isActive ? activeColor : "text.primary",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: "0.95rem",
                  letterSpacing: 0.2,
                  transition: theme.transitions.create(
                    ["color", "font-weight", "transform"],
                    { duration: theme.transitions.duration.standard }
                  ),
                },
              }}
            />
          )}
        </ListItem>
      </span>
    </Tooltip>
  );
}
