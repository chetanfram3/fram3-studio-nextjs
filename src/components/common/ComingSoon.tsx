"use client";

import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Video, Sparkles } from "lucide-react";

interface ComingSoonProps {
  message?: string;
}

export function ComingSoon({
  message = "Coming Soon! Please check back later.",
}: ComingSoonProps) {
  const theme = useTheme();

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
      {/* Video Icon with Pulsing Effect */}
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
        <Video size={256} color={theme.palette.primary.main} />

        {/* Sparkles around the video icon */}
        {[...Array(5)].map((_, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              top: "40%",
              left: "30%",
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
            <Sparkles size={30} color={theme.palette.secondary.main} />
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
    </Box>
  );
}

ComingSoon.displayName = "ComingSoon";
