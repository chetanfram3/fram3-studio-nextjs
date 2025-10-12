"use client";

import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Brain, Sparkles } from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface AnalysisInProgressProps {
  message?: string;
}

// ===========================
// MAIN COMPONENT
// ===========================

export function AnalysisInProgress({
  message = "Analysis in progress. Please check back later.",
}: AnalysisInProgressProps) {
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
        minHeight: "400px",
        gap: 3,
        position: "relative",
        p: 4,
      }}
    >
      {/* Brain Icon with Pulsing Effect */}
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
              transform: "scale(1.1)",
              opacity: 0.8,
            },
            "100%": {
              transform: "scale(1)",
              opacity: 1,
            },
          },
        }}
      >
        <Brain size={64} color={theme.palette.primary.main} strokeWidth={1.5} />

        {/* Sparkles around the brain */}
        {[...Array(3)].map((_, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              animation: `sparkle${index + 1} 1.5s infinite`,
              animationDelay: `${index * 0.2}s`,
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
            <Sparkles
              size={24}
              color={theme.palette.secondary.main}
              strokeWidth={2}
            />
          </Box>
        ))}
      </Box>

      {/* Message */}
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{
          textAlign: "center",
          maxWidth: "400px",
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
                "0%, 100%": {
                  opacity: 0.3,
                  transform: "scale(0.8)",
                },
                "50%": {
                  opacity: 1,
                  transform: "scale(1.2)",
                },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default AnalysisInProgress;
