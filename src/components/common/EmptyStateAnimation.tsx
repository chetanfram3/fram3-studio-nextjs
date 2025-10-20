// src/components/common/EmptyStateAnimation.tsx
"use client";

import { Box, Typography, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Headphones,
  Video,
  Sparkles,
  Plus,
} from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";

type AssetType = "image" | "audio" | "video";

interface EmptyStateAnimationProps {
  assetType: AssetType;
  navigationPath: string;
  customMessage?: string;
  customButtonText?: string;
  minHeight?: string | number;
}

const assetConfig = {
  image: {
    icon: ImageIcon,
    title: "No Images Yet",
    message:
      "Your image library is empty. Start creating stunning visuals for your projects!",
    buttonText: "Create First Image",
  },
  audio: {
    icon: Headphones,
    title: "No Audio Files",
    message:
      "Your audio library is waiting. Add soundtracks and voiceovers to bring your projects to life!",
    buttonText: "Add First Audio",
  },
  video: {
    icon: Video,
    title: "No Videos Yet",
    message:
      "Your video library is empty. Start creating compelling video content today!",
    buttonText: "Create First Video",
  },
};

export function EmptyStateAnimation({
  assetType,
  navigationPath,
  customMessage,
  customButtonText,
  minHeight = "600px",
}: EmptyStateAnimationProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  const config = assetConfig[assetType];
  const IconComponent = config.icon;

  // Use theme colors for consistency
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;

  // Create theme-aware gradient
  const gradient = `linear-gradient(135deg, ${primaryColor} 20%, ${secondaryColor} 100%)`;

  // Create lighter/darker variations for effects
  const glowColor =
    theme.palette.mode === "dark" ? `${primaryColor}40` : `${primaryColor}20`;

  const particleColor = theme.palette.primary.main;

  const handleCreateClick = () => {
    router.push(navigationPath);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight,
        gap: 4,
        position: "relative",
        p: 4,
        overflow: "hidden",
      }}
    >
      {/* Animated Background Circles */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          animation: "breathe 4s ease-in-out infinite",
          "@keyframes breathe": {
            "0%, 100%": {
              transform: "translate(-50%, -50%) scale(1)",
              opacity: 0.3,
            },
            "50%": {
              transform: "translate(-50%, -50%) scale(1.2)",
              opacity: 0.5,
            },
          },
        }}
      />

      {/* Floating Sparkles */}
      {[...Array(6)].map((_, index) => (
        <Box
          key={index}
          sx={{
            position: "absolute",
            animation: `float${index} ${3 + index * 0.5}s ease-in-out infinite`,
            opacity: 0.4,
            [`@keyframes float${index}`]: {
              "0%, 100%": {
                transform: `translate(${Math.cos(index * 60) * 150}px, ${Math.sin(index * 60) * 150}px) rotate(0deg)`,
              },
              "50%": {
                transform: `translate(${Math.cos(index * 60) * 180}px, ${Math.sin(index * 60) * 180}px) rotate(180deg)`,
              },
            },
          }}
        >
          <Sparkles size={20} color={particleColor} />
        </Box>
      ))}

      {/* Main Icon Container with Pulsing Effect */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: gradient,
          boxShadow: `0 20px 60px ${glowColor}`,
          animation: "iconPulse 3s ease-in-out infinite",
          "@keyframes iconPulse": {
            "0%, 100%": {
              transform: "scale(1) rotate(0deg)",
              boxShadow: `0 20px 60px ${glowColor}`,
            },
            "50%": {
              transform: "scale(1.05) rotate(5deg)",
              boxShadow: `0 25px 80px ${glowColor}`,
            },
          },
        }}
      >
        {/* Inner circle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: "50%",
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(0, 0, 0, 0.6)"
                : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
          }}
        >
          <IconComponent size={64} color={primaryColor} strokeWidth={1.5} />
        </Box>

        {/* Orbiting particles */}
        {[...Array(3)].map((_, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: primaryColor,
              opacity: 0.6,
              animation: `orbit${index} ${2 + index}s linear infinite`,
              [`@keyframes orbit${index}`]: {
                "0%": {
                  transform: `rotate(${index * 120}deg) translateX(100px) rotate(${-index * 120}deg)`,
                },
                "100%": {
                  transform: `rotate(${360 + index * 120}deg) translateX(100px) rotate(${-360 - index * 120}deg)`,
                },
              },
            }}
          />
        ))}
      </Box>

      {/* Text Content */}
      <Box
        sx={{
          textAlign: "center",
          maxWidth: "500px",
          zIndex: 1,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: 700,
            mb: 2,
            background: gradient,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "fadeIn 1s ease-in",
            "@keyframes fadeIn": {
              "0%": { opacity: 0, transform: "translateY(10px)" },
              "100%": { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          {config.title}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            fontFamily: brand.fonts.body,
            mb: 4,
            lineHeight: 1.7,
            animation: "fadeIn 1s ease-in 0.2s both",
          }}
        >
          {customMessage || config.message}
        </Typography>

        {/* Call to Action Button */}
        <Button
          variant="contained"
          size="large"
          startIcon={<Plus size={20} />}
          onClick={handleCreateClick}
          sx={{
            fontFamily: brand.fonts.body,
            fontWeight: 600,
            fontSize: "1rem",
            px: 4,
            py: 1.5,
            borderRadius: `${brand.borderRadius}px`,
            textTransform: "none",
            background: gradient,
            boxShadow: `0 8px 24px ${glowColor}`,
            transition: "all 0.3s ease",
            animation:
              "fadeIn 1s ease-in 0.4s both, buttonFloat 2s ease-in-out 1.5s infinite",
            "@keyframes buttonFloat": {
              "0%, 100%": {
                transform: "translateY(0px)",
              },
              "50%": {
                transform: "translateY(-5px)",
              },
            },
            "&:hover": {
              transform: "translateY(-3px)",
              boxShadow: `0 12px 32px ${glowColor}`,
              background: gradient,
            },
            "&:active": {
              transform: "translateY(-1px)",
            },
          }}
        >
          {customButtonText || config.buttonText}
        </Button>
      </Box>

      {/* Decorative bottom dots */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          mt: 2,
          animation: "fadeIn 1s ease-in 0.6s both",
        }}
      >
        {[...Array(3)].map((_, index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: primaryColor,
              opacity: 0.5,
              animation: "dotPulse 1.5s infinite",
              animationDelay: `${index * 0.3}s`,
              "@keyframes dotPulse": {
                "0%, 100%": {
                  opacity: 0.3,
                  transform: "scale(0.8)",
                },
                "50%": {
                  opacity: 0.8,
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

export default EmptyStateAnimation;
