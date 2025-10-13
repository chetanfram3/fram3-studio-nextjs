"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Paper, Typography, Chip } from "@mui/material";
import {
  Videocam as VideoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as ProcessingIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import type { VideoThumbnailProps } from "@/types/renderedVideos/types";

export function VideoThumbnail({
  video,
  isSelected,
  onClick,
}: VideoThumbnailProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const formatDuration = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const getStatusIcon = useCallback(() => {
    switch (video.status) {
      case "completed":
        return <SuccessIcon sx={{ color: "success.main", fontSize: 16 }} />;
      case "processing":
        return <ProcessingIcon sx={{ color: "warning.main", fontSize: 16 }} />;
      case "failed":
        return <ErrorIcon sx={{ color: "error.main", fontSize: 16 }} />;
      default:
        return <VideoIcon sx={{ color: "text.secondary", fontSize: 16 }} />;
    }
  }, [video.status]);

  const getStatusColor = useCallback(() => {
    switch (video.status) {
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  }, [video.status]);

  // Memoize thumbnail URL calculation
  const thumbnailUrl = useMemo((): string | null => {
    if (
      !video.renderData.inputProps ||
      !Array.isArray(video.renderData.inputProps)
    ) {
      return null;
    }

    // Sort by ID to get the first element
    const sortedElements = [...video.renderData.inputProps].sort(
      (a, b) => (a.id || 0) - (b.id || 0)
    );

    // Find first image or video element
    const thumbnailElement = sortedElements.find(
      (element) => element.type === "image" || element.type === "video"
    );

    return thumbnailElement?.content || null;
  }, [video.renderData.inputProps]);

  const handleImageLoad = useCallback(() => {
    setThumbnailLoaded(true);
    setHasError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setHasError(true);
    setThumbnailLoaded(false);
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  // Reset states when video changes
  useEffect(() => {
    setThumbnailLoaded(false);
    setHasError(false);
  }, [video.videoId]);

  return (
    <Paper
      onClick={onClick}
      sx={{
        position: "relative",
        cursor: "pointer",
        transition: "all 0.3s ease",
        border: 2,
        borderColor: isSelected ? "primary.main" : "divider",
        borderRadius: `${brand.borderRadius}px`,
        overflow: "hidden",
        bgcolor: "background.default",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[8],
          borderColor: "primary.light",
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }}
      role="button"
      tabIndex={0}
      onKeyPress={handleKeyPress}
    >
      {/* Video Thumbnail */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: video.videoMetadata.aspectRatio || "16/9",
          bgcolor: "black",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {thumbnailUrl && !hasError ? (
          <img
            src={thumbnailUrl}
            alt={`Version ${video.version} thumbnail`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              opacity: thumbnailLoaded ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "text.secondary",
            }}
          >
            <VideoIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="caption">
              {hasError ? "Preview unavailable" : "No thumbnail"}
            </Typography>
          </Box>
        )}

        {/* Loading overlay - only show when actually loading */}
        {thumbnailUrl && !thumbnailLoaded && !hasError && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                bgcolor: "rgba(0, 0, 0, 0.7)",
                borderRadius: `${brand.borderRadius * 0.5}px`,
                p: 1.5,
                color: "white",
              }}
            >
              <VideoIcon sx={{ fontSize: 24, mb: 0.5 }} />
              <Typography variant="caption">Loading...</Typography>
            </Box>
          </Box>
        )}

        {/* Status indicator */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            zIndex: 2,
          }}
        >
          {getStatusIcon()}
        </Box>

        {/* Duration badge */}
        {video.videoMetadata.duration && (
          <Chip
            label={formatDuration(video.videoMetadata.duration)}
            size="small"
            sx={{
              position: "absolute",
              bottom: 8,
              right: 8,
              bgcolor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              fontSize: "0.75rem",
              height: 20,
              zIndex: 2,
            }}
          />
        )}
      </Box>

      {/* Video Info */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="text.primary"
            sx={{ flex: 1 }}
          >
            Version {video.version}
          </Typography>
          <Chip
            label={video.status}
            size="small"
            color={
              getStatusColor() as "success" | "warning" | "error" | "default"
            }
            variant="outlined"
            sx={{ fontSize: "0.7rem", height: 20 }}
          />
        </Box>

        {video.renderData.title && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: "0.75rem",
              mb: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {video.renderData.title}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {video.videoMetadata.resolution || "Unknown"}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

VideoThumbnail.displayName = "VideoThumbnail";
