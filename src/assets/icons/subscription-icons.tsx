// src/assets/icons/subscription-icons.tsx
"use client";

import type React from "react";
import { SvgIcon } from "@mui/material";
import type { SvgIconProps } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

interface BadgeIconProps extends SvgIconProps {
  variant: "starter" | "pro" | "premium" | "ultra" | "enterprise";
  symbol: string;
}

const BadgeIcon: React.FC<BadgeIconProps> = ({ variant, symbol, ...props }) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const isDarkMode = theme.palette.mode === "dark";

  // Get variant-specific colors from theme
  const getVariantColors = () => {
    switch (variant) {
      case "starter":
        return {
          main: theme.palette.primary.dark,
          accent: theme.palette.primary.main,
        };
      case "pro":
        return {
          main: theme.palette.primary.main,
          accent: theme.palette.primary.light,
        };
      case "premium":
        return {
          main: theme.palette.primary.light,
          accent: alpha(theme.palette.primary.light, 0.8),
        };
      case "ultra":
        return {
          main: alpha(theme.palette.secondary.main, 0.9),
          accent: theme.palette.secondary.light,
        };
      case "enterprise":
        return {
          main: theme.palette.pastel.lavender.main,
          accent: theme.palette.error.main,
        };
      default:
        return {
          main: theme.palette.primary.main,
          accent: theme.palette.primary.light,
        };
    }
  };

  const colors = getVariantColors();
  const textColor = isDarkMode
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary;

  const gradientId = `badge-gradient-${variant}-${theme.palette.mode}`;
  const shadowId = `badge-shadow-${variant}-${theme.palette.mode}`;

  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.main} />
          <stop offset="100%" stopColor={colors.accent} />
        </linearGradient>
        <filter id={shadowId}>
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1"
            floodColor={isDarkMode ? theme.palette.background.paper : "#000000"}
            floodOpacity={isDarkMode ? 0.5 : 0.2}
          />
        </filter>
      </defs>
      <path
        d="M5 2C3.34315 2 2 3.34315 2 5V19C2 20.6569 3.34315 22 5 22H19C20.6569 22 22 20.6569 22 19V5C22 3.34315 20.6569 2 19 2H5Z"
        fill={`url(#${gradientId})`}
        filter={`url(#${shadowId})`}
      />
      <text
        x="12"
        y="17"
        fontFamily={brand.fonts.heading}
        fontSize="10"
        fontWeight="bold"
        fill={textColor}
        textAnchor="middle"
        style={{
          userSelect: "none",
          filter: isDarkMode
            ? `drop-shadow(0 1px 1px ${alpha(theme.palette.background.paper, 0.5)})`
            : "none",
        }}
      >
        {symbol}
      </text>
    </SvgIcon>
  );
};

// Individual badge components
export const StarterBadge: React.FC<
  Omit<BadgeIconProps, "variant" | "symbol">
> = (props) => <BadgeIcon variant="starter" symbol="S" {...props} />;

export const ProBadge: React.FC<Omit<BadgeIconProps, "variant" | "symbol">> = (
  props
) => <BadgeIcon variant="pro" symbol="P" {...props} />;

export const PremiumBadge: React.FC<
  Omit<BadgeIconProps, "variant" | "symbol">
> = (props) => <BadgeIcon variant="premium" symbol="P+" {...props} />;

export const UltraBadge: React.FC<
  Omit<BadgeIconProps, "variant" | "symbol">
> = (props) => <BadgeIcon variant="ultra" symbol="U" {...props} />;

export const EnterpriseBadge: React.FC<
  Omit<BadgeIconProps, "variant" | "symbol">
> = (props) => <BadgeIcon variant="enterprise" symbol="E" {...props} />;
