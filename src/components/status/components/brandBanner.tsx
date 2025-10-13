"use client";

import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

/**
 * Type-safe interfaces
 */
interface BrandColor {
  name: string;
  hex: string;
  usage: string;
}

interface BannerProps {
  brandColors: BrandColor[];
  text: string;
  height?: number | string;
}

/**
 * Function to calculate relative luminance
 * Uses the WCAG formula for relative luminance calculation
 *
 * @param hex - Hex color code
 * @returns Luminance value between 0 and 1
 */
const getLuminance = (hex: string): number => {
  // Remove # if present
  const cleanHex = hex.replace("#", "");

  // Convert hex to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  // Apply gamma correction
  const toLinear = (value: number): number => {
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  // Calculate luminance using the WCAG formula
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

/**
 * Function to determine text color based on average luminance
 * Returns hex color for optimal contrast
 *
 * @param colors - Array of hex color codes
 * @returns Hex color code for text
 */
const getTextColor = (colors: string[]): string => {
  const averageLuminance =
    colors
      .map((color) => getLuminance(color))
      .reduce((sum, lum) => sum + lum, 0) / colors.length;

  // Return appropriate color based on luminance
  // For light backgrounds (>0.5), use dark text
  // For dark backgrounds (<=0.5), use light text
  return averageLuminance > 0.5 ? "#1A1A1A" : "#FFFFFF";
};

/**
 * BrandColorsBanner Component
 *
 * Displays an animated gradient banner with brand colors and text.
 * Automatically calculates optimal text color for accessibility.
 * Fully theme-aware and optimized for performance.
 *
 * @component
 */
const BrandColorsBanner = ({
  brandColors,
  text,
  height = 200,
}: BannerProps) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // React 19: useMemo for gradient colors array
  const gradientColors = useMemo(
    () => brandColors.map((color) => color.hex),
    [brandColors]
  );

  // React 19: useMemo for text color calculation (expensive)
  const textColor = useMemo(
    () => getTextColor(gradientColors),
    [gradientColors]
  );

  // Determine if text is white for shadow calculation
  const isWhiteText = textColor === "#FFFFFF";

  // React 19: useMemo for gradient string
  const gradientString = useMemo(
    () => `linear-gradient(45deg, ${gradientColors.join(", ")})`,
    [gradientColors]
  );

  // React 19: useMemo for text shadow (conditional)
  const textShadow = useMemo(() => {
    return isWhiteText ? "0 2px 4px rgba(0,0,0,0.2)" : "none";
  }, [isWhiteText]);

  // React 19: useMemo for decorative circle color
  const circleColor = useMemo(() => `${textColor}10`, [textColor]);

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: `${brand.borderRadius}px`,
        boxShadow: theme.shadows[6],
        height: height,
        background: gradientString,
        backgroundSize: "200% 200%",
        animation: "gradient 15s ease infinite",
        "@keyframes gradient": {
          "0%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
          "100%": {
            backgroundPosition: "0% 50%",
          },
        },
      }}
    >
      {/* Decorative circles */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 128,
          height: 128,
          borderRadius: "50%",
          bgcolor: circleColor,
          transform: "translate(-50%, -50%)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 160,
          height: 160,
          borderRadius: "50%",
          bgcolor: circleColor,
          transform: "translate(30%, 30%)",
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          px: 4,
        }}
      >
        <Typography
          variant="h3"
          component="h2"
          sx={{
            color: textColor,
            fontWeight: 700,
            fontFamily: brand.fonts.heading,
            textAlign: "center",
            letterSpacing: -0.5,
            textShadow: textShadow,
          }}
        >
          {text}
        </Typography>
      </Box>
    </Box>
  );
};

BrandColorsBanner.displayName = "BrandColorsBanner";

export default BrandColorsBanner;
