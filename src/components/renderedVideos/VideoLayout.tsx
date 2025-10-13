"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography, Alert, Stack, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import type {
  VideoLayoutProps,
  RenderedVideo,
  RenderedVideosData,
} from "@/types/renderedVideos/types";
import { VideoPlayer } from "./VideoPlayer";
import { VideoThumbnail } from "./VideoThumbnail";
import { VideoMetadataDisplay } from "./VideoMetadataDisplay";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";
import { AnalysisInProgress } from "@/components/common/AnalysisInProgress";
import { useScriptDashboardAnalysis } from "@/hooks/scripts/useScriptDashboardAnalysis";

export default function VideoLayout({
  scriptId = "",
  versionId = "",
}: VideoLayoutProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const { data, isLoading, refetch, error } =
    useScriptDashboardAnalysis<RenderedVideosData>(
      scriptId,
      versionId,
      "renderedVideos"
    );

  const [selectedVideo, setSelectedVideo] = useState<RenderedVideo | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Memoize sorted videos
  const sortedVideos = useMemo(() => {
    return data?.videos
      ? [...data.videos].sort((a, b) => b.version - a.version)
      : [];
  }, [data?.videos]);

  // Memoize video counts
  const { completedVideosCount, processingVideosCount, failedVideosCount } =
    useMemo(() => {
      return {
        completedVideosCount: sortedVideos.filter(
          (v) => v.status === "completed"
        ).length,
        processingVideosCount: sortedVideos.filter(
          (v) => v.status === "processing"
        ).length,
        failedVideosCount: sortedVideos.filter((v) => v.status === "failed")
          .length,
      };
    }, [sortedVideos]);

  // Set initial selected video when data loads
  useEffect(() => {
    if (data?.videos && data.videos.length > 0 && !selectedVideo) {
      const completedVideos = data.videos.filter(
        (video) => video.status === "completed"
      );
      if (completedVideos.length > 0) {
        const latestVideo = completedVideos.sort(
          (a, b) => b.version - a.version
        )[0];
        setSelectedVideo(latestVideo);
      } else {
        setSelectedVideo(data.videos[0]);
      }
    }
  }, [data?.videos, selectedVideo]);

  const handleVideoSelect = useCallback((video: RenderedVideo) => {
    setSelectedVideo(video);
    setIsPlaying(false);
  }, []);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  if (isLoading) {
    return <LoadingAnimation message="Loading rendered videos..." />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load videos: {error.message}
        </Alert>
      </Box>
    );
  }

  if (!data || !data.videos || data.videos.length === 0) {
    return (
      <AnalysisInProgress message="No rendered videos available. Videos will appear here once generation is complete." />
    );
  }

  if (!selectedVideo) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Loading video player...</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        bgcolor: "background.default",
        borderTop: 4,
        borderColor: "primary.dark",
      }}
    >
      {/* Header with stats */}
      <Box
        sx={{
          p: 3,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.default",
        }}
      >
        <Typography
          variant="h4"
          fontWeight={600}
          gutterBottom
          color="text.primary"
          sx={{ fontFamily: brand.fonts.heading }}
        >
          Rendered Videos
        </Typography>

        <Stack direction="row" spacing={2}>
          <Chip
            label={`${sortedVideos.length} Total`}
            color="primary"
            variant="outlined"
          />
          {completedVideosCount > 0 && (
            <Chip
              label={`${completedVideosCount} Completed`}
              color="success"
              variant="filled"
            />
          )}
          {processingVideosCount > 0 && (
            <Chip
              label={`${processingVideosCount} Processing`}
              color="warning"
              variant="filled"
            />
          )}
          {failedVideosCount > 0 && (
            <Chip
              label={`${failedVideosCount} Failed`}
              color="error"
              variant="filled"
            />
          )}
        </Stack>
      </Box>

      <Box sx={{ display: "flex", height: "calc(100% - 120px)" }}>
        {/* Thumbnails Sidebar - Scrollable */}
        <Box
          sx={{
            width: 320,
            borderRight: 1,
            borderColor: "divider",
            bgcolor: "background.default",
            overflow: "auto",
            p: 2,
            height: "100%",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            color="text.primary"
            sx={{ mb: 2 }}
          >
            Versions ({sortedVideos.length})
          </Typography>

          <Stack spacing={2}>
            {sortedVideos.map((video) => (
              <VideoThumbnail
                key={video.videoId}
                video={video}
                isSelected={selectedVideo?.videoId === video.videoId}
                onClick={() => handleVideoSelect(video)}
              />
            ))}
          </Stack>
        </Box>

        {/* Main Content Area - Video Player + Details */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            bgcolor: "background.default",
            p: 3,
          }}
        >
          {/* Video Title */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              fontWeight={600}
              gutterBottom
              color="text.primary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              {selectedVideo.renderData.title ||
                `Version ${selectedVideo.version}`}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Video ID: {selectedVideo.videoId}
              </Typography>
              <Chip
                label={selectedVideo.status}
                color={
                  selectedVideo.status === "completed"
                    ? "success"
                    : selectedVideo.status === "processing"
                      ? "warning"
                      : "error"
                }
                size="small"
              />
            </Stack>
          </Box>

          {/* Video Player */}
          <Box sx={{ mb: 4 }}>
            {selectedVideo.status === "completed" ? (
              <VideoPlayer
                video={selectedVideo}
                isPlaying={isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
              />
            ) : selectedVideo.status === "processing" ? (
              <Box
                sx={{
                  width: "100%",
                  maxWidth: "800px",
                  aspectRatio:
                    selectedVideo.videoMetadata.aspectRatio || "16/9",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "background.paper",
                  borderRadius: `${brand.borderRadius}px`,
                  border: 1,
                  borderColor: "divider",
                  p: 4,
                  mx: "auto",
                }}
              >
                <Typography
                  variant="h6"
                  color="text.primary"
                  gutterBottom
                  sx={{ fontFamily: brand.fonts.heading }}
                >
                  Video Processing...
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  This video is still being processed. Please check back later.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  width: "100%",
                  maxWidth: "800px",
                  aspectRatio:
                    selectedVideo.videoMetadata.aspectRatio || "16/9",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "error.light",
                  borderRadius: `${brand.borderRadius}px`,
                  border: 1,
                  borderColor: "error.main",
                  p: 4,
                  mx: "auto",
                }}
              >
                <Typography
                  variant="h6"
                  color="error.dark"
                  gutterBottom
                  sx={{ fontFamily: brand.fonts.heading }}
                >
                  Video Generation Failed
                </Typography>
                <Typography variant="body2" color="error.dark" align="center">
                  This video failed to generate. Please try regenerating or
                  contact support.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Video Details Section */}
          <Box>
            <VideoMetadataDisplay video={selectedVideo} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

VideoLayout.displayName = "VideoLayout";
