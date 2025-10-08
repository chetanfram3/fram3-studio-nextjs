// src/assets/icons/subscription-icons.tsx
"use client";

import type React from "react";
import { SvgIcon } from "@mui/material";
import type { SvgIconProps } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

interface BadgeIconProps extends SvgIconProps {
  variant: "starter" | "pro" | "premium" | "ultra" | "enterprise";
  symbol: string;
}

const BadgeIcon: React.FC<BadgeIconProps> = ({ variant, symbol, ...props }) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const isDarkMode = theme.palette.mode === "dark";

  // Get variant-specific colors - fully theme-aware
  const getVariantColors = () => {
    switch (variant) {
      case "starter":
        return {
          main: theme.palette.pastel.sage.main,
          accent: theme.palette.pastel.sage.light,
          textColor: theme.palette.pastel.sage.contrastText,
        };
      case "pro":
        return {
          main: theme.palette.pastel.sky.main,
          accent: theme.palette.pastel.sky.light,
          textColor: theme.palette.pastel.sky.contrastText,
        };
      case "premium":
        return {
          main: theme.palette.pastel.lavender.main,
          accent: theme.palette.pastel.lavender.light,
          textColor: theme.palette.pastel.lavender.contrastText,
        };
      case "ultra":
        return {
          main: theme.palette.pastel.lilac.main,
          accent: theme.palette.pastel.lilac.light,
          textColor: theme.palette.pastel.lilac.contrastText,
        };
      case "enterprise":
        return {
          main: isDarkMode
            ? theme.palette.yellow.main
            : alpha(theme.palette.yellow.main, 0.9),
          accent: theme.palette.yellow.light,
          textColor: theme.palette.yellow.contrastText,
        };
      default:
        return {
          main: theme.palette.primary.main,
          accent: theme.palette.primary.light,
          textColor: theme.palette.primary.contrastText,
        };
    }
  };

  const colors = getVariantColors();

  // Use variant-specific text color with fallback
  const textColor = colors.textColor || (isDarkMode ? "#FFFFFF" : "#000000");

  // Dynamic shadow based on theme mode
  const shadowOpacity = isDarkMode ? 0.5 : 0.3;
  const shadowColor = isDarkMode
    ? alpha(theme.palette.common.black, 0.8)
    : alpha(theme.palette.common.black, 0.4);

  const gradientId = `badge-gradient-${variant}-${theme.palette.mode}`;
  const shadowId = `badge-shadow-${variant}-${theme.palette.mode}`;

  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <defs>
        {/* Gradient definition */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.main} />
          <stop offset="100%" stopColor={colors.accent} />
        </linearGradient>

        {/* Shadow filter - theme-aware */}
        <filter id={shadowId}>
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2"
            floodColor={shadowColor}
            floodOpacity={shadowOpacity}
          />
        </filter>
      </defs>

      {/* Main background with gradient and shadow */}
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx={brand.borderRadius}
        fill={`url(#${gradientId})`}
        filter={`url(#${shadowId})`}
      />

      {/* Outer border - gradient stroke */}
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx={brand.borderRadius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        opacity="0.8"
      />

      {/* Middle spacing border - transparent */}
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx={brand.borderRadius - 1}
        fill="none"
        stroke="transparent"
        strokeWidth="1.5"
      />

      {/* Inner border - subtle gradient */}
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx={brand.borderRadius - 2}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="1"
        opacity="0.6"
      />

      {/* Symbol text - theme-aware styling */}
      <text
        x="12"
        y="16"
        fontFamily={brand.fonts.heading}
        fontSize="10"
        fontWeight="bold"
        fill={textColor}
        textAnchor="middle"
        style={{
          userSelect: "none",
          // Text shadow for better readability
          filter: isDarkMode
            ? `drop-shadow(0 1px 2px ${alpha(theme.palette.background.default, 0.9)})`
            : `drop-shadow(0 1px 1px ${alpha(theme.palette.common.black, 0.4)})`,
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
