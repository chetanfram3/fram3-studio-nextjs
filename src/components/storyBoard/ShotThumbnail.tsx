"use client";

import { Suspense, useState } from "react";
import { Box, Paper, Typography, Skeleton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NextImage from "next/image";
import type { Shot } from "@/types/storyBoard/types";

interface ShotThumbnailProps {
  shot?: Shot;
  isSelected?: boolean;
  onClick?: () => void;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";
}

const DEFAULT_THUMBNAIL = "/placeHolderT.webp";

export function ShotThumbnail({
  shot,
  isSelected = false,
  onClick,
  aspectRatio = "16:9",
}: ShotThumbnailProps) {
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);

  if (!shot) {
    return (
      <Paper
        sx={{
          aspectRatio: getAspectRatioValue(aspectRatio),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography color="text.secondary">No shot data</Typography>
      </Paper>
    );
  }

  // Prioritize current version thumbnail, then fall back to shot thumbnail
  const thumbnailSrc =
    shot.versions?.current?.thumbnailPath ||
    shot.thumbnailPath ||
    DEFAULT_THUMBNAIL;

  // Check if it's a placeholder (don't optimize placeholders)
  const isPlaceholder = thumbnailSrc === DEFAULT_THUMBNAIL;

  // Video status indicators
  const hasVideo = Boolean(shot.videoSignedUrl);
  const videoStatus = shot.videoStatus;
  const isVideoCompleted = videoStatus === "Completed";
  const isVideoFailed =
    videoStatus === "Failed" ||
    videoStatus === "VideoGenerationFailed" ||
    videoStatus === "Error";
  const isVideoInProgress =
    videoStatus === "InProgress" || videoStatus === "Processing";

  return (
    <Paper
      onClick={onClick}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      sx={{
        position: "relative",
        aspectRatio: getAspectRatioValue(aspectRatio),
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
        transition: "all 0.2s ease",
        border: 2,
        borderColor: isSelected ? "primary.main" : "divider",
        borderRadius: 1,
        opacity: isSelected ? 1 : 0.9,
        "&:hover": onClick
          ? {
              opacity: 1,
              transform: "scale(1.02)",
              borderColor: "primary.light",
            }
          : {},
        "&:focus-visible": {
          outline: (theme) => `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }}
    >
      {/* Image with Next.js optimization */}
      <Suspense
        fallback={
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            sx={{ bgcolor: "background.default" }}
          />
        }
      >
        {isPlaceholder || imageError ? (
          // Use regular img for placeholder or on error
          <Box
            component="img"
            src={imageError ? DEFAULT_THUMBNAIL : thumbnailSrc}
            alt={`Preview of Shot ${shot.shotId || "unknown"}`}
            loading="lazy"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              bgcolor: "background.default",
            }}
          />
        ) : (
          // Use Next.js Image for optimization (30-50% smaller!)
          <NextImage
            src={thumbnailSrc}
            alt={`Preview of Shot ${shot.shotId || "unknown"}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={85}
            style={{
              objectFit: "cover",
            }}
            onError={() => setImageError(true)}
          />
        )}
      </Suspense>

      {/* Video status indicator */}
      {hasVideo && (
        <Box
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
          }}
        >
          {isVideoCompleted && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "success.main",
                border: "1px solid",
                borderColor: "background.paper",
                boxShadow: theme.shadows[2],
              }}
            />
          )}
          {isVideoInProgress && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "warning.main",
                border: "1px solid",
                borderColor: "background.paper",
                boxShadow: theme.shadows[2],
                animation: "pulse 2s infinite",
                "@keyframes pulse": {
                  "0%": {
                    opacity: 1,
                  },
                  "50%": {
                    opacity: 0.5,
                  },
                  "100%": {
                    opacity: 1,
                  },
                },
              }}
            />
          )}
          {isVideoFailed && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "error.main",
                border: "1px solid",
                borderColor: "background.paper",
                boxShadow: theme.shadows[2],
              }}
            />
          )}
        </Box>
      )}

      {/* Shot info overlay */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          p: 1,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "common.white",
            fontWeight: isSelected ? 600 : 400,
            textShadow: "0px 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          Shot {shot.shotId || "?"}
          {/* Show version indicator if there are multiple versions */}
          {shot.versions && shot.versions.totalVersions > 1 && (
            <Box component="span" sx={{ ml: 0.5, opacity: 0.8 }}>
              (v{shot.versions.current?.version || 1})
            </Box>
          )}
          {/* Show lipsync indicator */}
          {shot.hasLipsyncVideo && (
            <Box component="span" sx={{ ml: 0.5, opacity: 0.8 }}>
              • Lipsync
            </Box>
          )}
        </Typography>
      </Box>
    </Paper>
  );
}

ShotThumbnail.displayName = "ShotThumbnail";

// Helper function to convert aspect ratio string to CSS value
function getAspectRatioValue(
  aspectRatio: "16:9" | "9:16" | "1:1" | "auto"
): string {
  switch (aspectRatio) {
    case "16:9":
      return "16/9";
    case "9:16":
      return "9/16";
    case "1:1":
      return "1/1";
    case "auto":
    default:
      return "16/9"; // Default fallback
  }
}
