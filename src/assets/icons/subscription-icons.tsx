// src/assets/icons/subscription-icons.tsx
"use client";

import type React from "react";
import { useTheme, alpha } from "@mui/material/styles";

interface BadgeIconProps {
  className?: string;
  size?: number;
}

// Unified Badge Component (Enterprise Design for All)
const UnifiedBadge: React.FC<BadgeIconProps & { text: string }> = ({
  className = "",
  size = 40,
  text,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer glow effect */}
      <div
        className="absolute inset-[-4px] rounded-lg blur-md opacity-50"
        style={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.4 : 0.3)}, ${alpha(theme.palette.primary.light, isDark ? 0.3 : 0.2)})`,
        }}
      />

      {/* Outer border ring */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.6 : 0.4)}, ${alpha(theme.palette.primary.light, isDark ? 0.4 : 0.3)})`,
          padding: "1.5px",
        }}
      >
        <div
          className="w-full h-full rounded-lg"
          style={{
            backgroundColor: isDark
              ? theme.palette.background.paper
              : alpha(theme.palette.primary.main, 0.03),
          }}
        />
      </div>

      {/* Inner border ring */}
      <div
        className="absolute inset-[3px] rounded-md"
        style={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.4 : 0.2)}, ${alpha(theme.palette.primary.dark, isDark ? 0.6 : 0.3)})`,
          padding: "1px",
        }}
      >
        <div
          className="w-full h-full rounded-md flex items-center justify-center"
          style={{
            backgroundColor: isDark
              ? theme.palette.background.default
              : alpha(theme.palette.primary.main, 0.08),
          }}
        >
          <span
            className="font-bold"
            style={{
              fontSize: size * 0.4,
              color: theme.palette.primary.main,
              textShadow: isDark
                ? `0 0 12px ${alpha(theme.palette.primary.main, 0.6)}`
                : "none",
            }}
          >
            {text}
          </span>
        </div>
      </div>
    </div>
  );
};

// Individual badge exports with different text
export const StarterBadge: React.FC<BadgeIconProps> = (props) => (
  <UnifiedBadge {...props} text="S" />
);

export const ProBadge: React.FC<BadgeIconProps> = (props) => (
  <UnifiedBadge {...props} text="P" />
);

export const PremiumBadge: React.FC<BadgeIconProps> = (props) => (
  <UnifiedBadge {...props} text="P+" />
);

export const UltraBadge: React.FC<BadgeIconProps> = (props) => (
  <UnifiedBadge {...props} text="U" />
);

export const EnterpriseBadge: React.FC<BadgeIconProps> = (props) => (
  <UnifiedBadge {...props} text="E" />
);
