// src/components/common/LoadingAnimation.tsx
"use client";

import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Clapperboard } from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";
import { Fram3Icon3D } from "@/assets/icons/fram3-3d-icon";

interface LoadingAnimationProps {
  message?: string;
  minHeight?: string | number;
}

export function LoadingAnimation({
  message = "Loading...",
  minHeight = "400px",
}: LoadingAnimationProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight,
        gap: 3,
        position: "relative",
        p: 4,
      }}
    >
      {/* Icon with Pulsing Effect */}
      <Box
        sx={{
          position: "relative",
          animation: "pulse 2s infinite",
          "@keyframes pulse": {
            "0%": {
              transform: "scale(1)",
              opacity: 1,
            },
            "50%": {
              transform: "scale(1.2)",
              opacity: 0.8,
            },
            "100%": {
              transform: "scale(1)",
              opacity: 1,
            },
          },
        }}
      >
        <Fram3Icon3D
          sx={{
            fontSize: 128,
            color: "primary.main",
          }}
        />

        {/* Sparkles around the icon */}
        {[...Array(3)].map((_, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              animation: `sparkle${index + 1} 1.5s infinite`,
              [`@keyframes sparkle${index + 1}`]: {
                "0%": {
                  transform: `rotate(${index * 120}deg) translateX(40px) scale(0)`,
                  opacity: 0,
                },
                "50%": {
                  transform: `rotate(${index * 120}deg) translateX(40px) scale(1)`,
                  opacity: 1,
                },
                "100%": {
                  transform: `rotate(${index * 120}deg) translateX(40px) scale(0)`,
                  opacity: 0,
                },
              },
            }}
          >
            <Clapperboard
              size={28}
              color={theme.palette.primary.main}
              style={{
                filter: `drop-shadow(0 0 4px ${theme.palette.primary.main}40)`,
              }}
            />
          </Box>
        ))}
      </Box>

      {/* Message */}
      <Typography
        variant="h6"
        sx={{
          textAlign: "center",
          maxWidth: "400px",
          color: "text.secondary",
          fontFamily: brand.fonts.body,
          animation: "fadeInOut 2s infinite",
          "@keyframes fadeInOut": {
            "0%": { opacity: 0.7 },
            "50%": { opacity: 1 },
            "100%": { opacity: 0.7 },
          },
        }}
      >
        {message}
      </Typography>

      {/* Progress Dots */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          mt: 1,
        }}
      >
        {[...Array(3)].map((_, index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "primary.main",
              animation: "progressDot 1.5s infinite",
              animationDelay: `${index * 0.3}s`,
              "@keyframes progressDot": {
                "0%, 100%": { opacity: 0.3, transform: "scale(0.8)" },
                "50%": { opacity: 1, transform: "scale(1.2)" },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

// Export default
export default LoadingAnimation;
