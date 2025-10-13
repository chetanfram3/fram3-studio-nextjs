"use client";

import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Box,
  Divider,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  VideoSettings as VideoIcon,
  AudioFile as AudioIcon,
  Storage as StorageIcon,
  Schedule as DurationIcon,
  AspectRatio as AspectRatioIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useCallback, useMemo } from "react";
import type { VideoMetadataDisplayProps } from "@/types/renderedVideos/types";
import { CompositionDetails } from "./CompositionDetails";

interface MetadataItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  compact?: boolean;
}

export function VideoMetadataDisplay({
  video,
  compact = false,
}: VideoMetadataDisplayProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Memoize formatting functions
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "Unknown";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }, []);

  const formatRenderTime = useCallback((milliseconds: number): string => {
    const seconds = milliseconds / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleString();
  }, []);

  const formatCreatedAt = useCallback(
    (createdAt: { _seconds: number; _nanoseconds: number }): string => {
      return new Date(createdAt._seconds * 1000).toLocaleString();
    },
    []
  );

  // Memoize render data JSON structure
  const renderDataJson = useMemo(
    () => ({
      overlays: video.renderData.inputProps || [],
      durationInFrames: Math.round(
        (video.videoMetadata.duration || 0) *
          (video.videoMetadata.frameRate || 30)
      ),
      aspectRatio: video.videoMetadata.aspectRatio || "16:9",
      fps: video.videoMetadata.frameRate || 30,
      composition: {
        width: parseInt(
          video.videoMetadata.resolution?.split("x")[0] || "1920"
        ),
        height: parseInt(
          video.videoMetadata.resolution?.split("x")[1] || "1080"
        ),
        durationInFrames: Math.round(
          (video.videoMetadata.duration || 0) *
            (video.videoMetadata.frameRate || 30)
        ),
        fps: video.videoMetadata.frameRate || 30,
      },
      timestamp: video.renderData.timestamp || new Date().toISOString(),
      version: "7.0.0",
      videoMetadata: {
        videoId: video.videoId,
        version: video.version,
        status: video.status,
        title: video.renderData.title,
        codec: video.renderData.codec,
        region: video.renderData.region,
        renderTime: video.renderData.renderTime,
        outputSizeInBytes: video.renderData.outputSizeInBytes,
      },
    }),
    [video]
  );

  const handleDownloadRenderData = useCallback(() => {
    try {
      const jsonString = JSON.stringify(renderDataJson, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        video.renderData.title || `video_v${video.version}`
      }_render_data.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download render data failed:", error);
    }
  }, [renderDataJson, video.renderData.title, video.version]);

  const MetadataItem = useCallback(
    ({
      icon,
      label,
      value,
      color = "text.secondary",
      compact: itemCompact = false,
    }: MetadataItemProps) => (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: itemCompact ? 0.5 : 1,
        }}
      >
        <Box sx={{ color, fontSize: itemCompact ? 16 : 20 }}>{icon}</Box>
        <Typography
          variant={itemCompact ? "caption" : "body2"}
          color="text.secondary"
          sx={{ fontWeight: 500, minWidth: itemCompact ? 60 : 80 }}
        >
          {label}:
        </Typography>
        <Typography
          variant={itemCompact ? "caption" : "body2"}
          color="text.primary"
          sx={{ fontWeight: 400, flex: 1 }}
        >
          {value}
        </Typography>
      </Box>
    ),
    []
  );

  return (
    <Card
      sx={{
        height: "100%",
        bgcolor: "background.default",
        borderRadius: `${brand.borderRadius}px`,
        border: 1,
        borderColor: "primary.main",
      }}
    >
      <CardContent sx={{ p: compact ? 2 : 3 }}>
        {/* Header with Download Button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: compact ? 2 : 3,
          }}
        >
          <Box>
            <Typography
              variant={compact ? "h6" : "h5"}
              fontWeight={600}
              color="text.primary"
              gutterBottom
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Video Details
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={`Version ${video.version}`}
                color="primary"
                variant="outlined"
                size={compact ? "small" : "medium"}
              />
              <Chip
                label={video.status}
                color={
                  video.status === "completed"
                    ? "success"
                    : video.status === "processing"
                      ? "warning"
                      : "error"
                }
                variant="filled"
                size={compact ? "small" : "medium"}
              />
            </Stack>
          </Box>

          <Tooltip title="Download Render Data (JSON)">
            <IconButton
              onClick={handleDownloadRenderData}
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              }}
              size={compact ? "small" : "medium"}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Title if available */}
        {video.renderData.title && (
          <>
            <Typography
              variant={compact ? "subtitle2" : "h6"}
              fontWeight={500}
              sx={{ mb: 2, color: "primary.main" }}
            >
              {video.renderData.title}
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </>
        )}

        <Grid container spacing={compact ? 1 : 2} sx={{ width: "100%" }}>
          {/* Video Technical Details */}
          <Grid size={{ xs: 12, md: compact ? 12 : 6 }}>
            <Typography
              variant={compact ? "subtitle2" : "subtitle1"}
              fontWeight={600}
              sx={{ mb: 1, color: "primary.main" }}
            >
              Video Information
            </Typography>

            <MetadataItem
              icon={<DurationIcon />}
              label="Duration"
              value={formatDuration(video.videoMetadata.duration)}
              color="primary.main"
              compact={compact}
            />

            <MetadataItem
              icon={<AspectRatioIcon />}
              label="Resolution"
              value={video.videoMetadata.resolution}
              compact={compact}
            />

            <MetadataItem
              icon={<VideoIcon />}
              label="Aspect Ratio"
              value={video.videoMetadata.aspectRatio}
              compact={compact}
            />

            <MetadataItem
              icon={<VideoIcon />}
              label="Frame Rate"
              value={`${video.videoMetadata.frameRate} fps`}
              compact={compact}
            />

            <MetadataItem
              icon={<VideoIcon />}
              label="Video Codec"
              value={video.videoMetadata.videoCodec.toUpperCase()}
              compact={compact}
            />

            <MetadataItem
              icon={<AudioIcon />}
              label="Audio Codec"
              value={video.videoMetadata.audioCodec.toUpperCase()}
              compact={compact}
            />
          </Grid>

          {/* Render & File Details */}
          <Grid size={{ xs: 12, md: compact ? 12 : 6 }}>
            <Typography
              variant={compact ? "subtitle2" : "subtitle1"}
              fontWeight={600}
              sx={{ mb: 1, color: "primary.main" }}
            >
              Render Information
            </Typography>

            <MetadataItem
              icon={<StorageIcon />}
              label="File Size"
              value={formatFileSize(video.renderData.outputSizeInBytes)}
              color="info.main"
              compact={compact}
            />

            <MetadataItem
              icon={<VideoIcon />}
              label="Format"
              value={video.videoMetadata.format}
              compact={compact}
            />

            <MetadataItem
              icon={<VideoIcon />}
              label="Codec"
              value={video.renderData.codec.toUpperCase()}
              compact={compact}
            />

            {!compact && (
              <>
                <Divider sx={{ my: 2 }} />
                <MetadataItem
                  icon={<UploadIcon />}
                  label="Rendered"
                  value={formatDate(video.videoMetadata.uploadedAt)}
                  color="primary.main"
                  compact={compact}
                />

                <MetadataItem
                  icon={<UploadIcon />}
                  label="Uploaded"
                  value={formatCreatedAt(video.createdAt)}
                  compact={compact}
                />
              </>
            )}
          </Grid>
        </Grid>

        {/* Additional render details */}
        {!compact && video.renderData.inputProps && (
          <>
            <Divider sx={{ my: 3 }} />
            <CompositionDetails video={video} compact={compact} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

VideoMetadataDisplay.displayName = "VideoMetadataDisplay";
