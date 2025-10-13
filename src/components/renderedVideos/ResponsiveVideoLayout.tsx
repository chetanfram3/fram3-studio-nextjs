"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Alert,
  Stack,
  Chip,
  useMediaQuery,
  Drawer,
  IconButton,
  AppBar,
  Toolbar,
} from "@mui/material";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";
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

export default function ResponsiveVideoLayout({
  scriptId = "",
  versionId = "",
}: VideoLayoutProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

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
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [metadataExpanded, setMetadataExpanded] = useState(!isMobile);

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

  // Close sidebar on mobile when video is selected
  useEffect(() => {
    if (isMobile && selectedVideo) {
      setSidebarOpen(false);
    }
  }, [selectedVideo, isMobile]);

  const handleVideoSelect = useCallback((video: RenderedVideo) => {
    setSelectedVideo(video);
    setIsPlaying(false);
  }, []);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  // Memoize sidebar content
  const sidebarContent = useMemo(
    () => (
      <Box sx={{ width: isMobile ? 280 : 320, height: "100%" }}>
        {isMobile && (
          <AppBar position="static" color="transparent" elevation={0}>
            <Toolbar>
              <Typography
                variant="h6"
                sx={{ flexGrow: 1, color: "text.primary" }}
              >
                Video Versions
              </Typography>
              <IconButton
                onClick={() => setSidebarOpen(false)}
                sx={{ color: "text.secondary" }}
              >
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        <Box
          sx={{
            p: 2,
            overflow: "auto",
            height: isMobile ? "calc(100% - 64px)" : "100%",
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
      </Box>
    ),
    [isMobile, sortedVideos, selectedVideo, handleVideoSelect]
  );

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
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: isMobile ? 2 : 3,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {isMobile && (
            <IconButton
              onClick={() => setSidebarOpen(true)}
              sx={{ color: "text.secondary" }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ flex: 1 }}>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              fontWeight={600}
              gutterBottom
              color="text.primary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Rendered Videos
            </Typography>

            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={isMobile ? 1 : 2}
              alignItems={isMobile ? "flex-start" : "center"}
            >
              <Chip
                label={`${sortedVideos.length} Total`}
                color="primary"
                variant="outlined"
                size={isMobile ? "small" : "medium"}
              />
              {completedVideosCount > 0 && (
                <Chip
                  label={`${completedVideosCount} Completed`}
                  color="success"
                  variant="filled"
                  size={isMobile ? "small" : "medium"}
                />
              )}
              {processingVideosCount > 0 && (
                <Chip
                  label={`${processingVideosCount} Processing`}
                  color="warning"
                  variant="filled"
                  size={isMobile ? "small" : "medium"}
                />
              )}
              {failedVideosCount > 0 && (
                <Chip
                  label={`${failedVideosCount} Failed`}
                  color="error"
                  variant="filled"
                  size={isMobile ? "small" : "medium"}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar for desktop */}
        {!isMobile && (
          <Box
            sx={{
              width: 320,
              borderRight: 1,
              borderColor: "divider",
              bgcolor: "background.default",
              overflow: "auto",
            }}
          >
            {sidebarContent}
          </Box>
        )}

        {/* Mobile drawer */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            ModalProps={{
              keepMounted: true,
            }}
          >
            {sidebarContent}
          </Drawer>
        )}

        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Video Player Section */}
          <Box
            sx={{
              flex: 1,
              p: isMobile ? 2 : 3,
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.paper",
              overflow: "auto",
            }}
          >
            {/* Video Title */}
            <Box sx={{ mb: isMobile ? 2 : 3 }}>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                fontWeight={600}
                gutterBottom
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                {selectedVideo.renderData.title ||
                  `Version ${selectedVideo.version}`}
              </Typography>
              <Stack
                direction={isMobile ? "column" : "row"}
                spacing={isMobile ? 1 : 2}
                alignItems={isMobile ? "flex-start" : "center"}
              >
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
            <Box sx={{ flex: 1, minHeight: isMobile ? 200 : 400 }}>
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
                    p: isMobile ? 2 : 4,
                  }}
                >
                  <Typography
                    variant={isMobile ? "body1" : "h6"}
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
                    This video is still being processed. Please check back
                    later.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    width: "100%",
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
                    p: isMobile ? 2 : 4,
                  }}
                >
                  <Typography
                    variant={isMobile ? "body1" : "h6"}
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
          </Box>

          {/* Metadata Section */}
          {(!isMobile || metadataExpanded) && (
            <Box
              sx={{
                height: isMobile ? "auto" : 400,
                maxHeight: isMobile ? 300 : 400,
                borderTop: 1,
                borderColor: "divider",
                overflow: "auto",
              }}
            >
              <VideoMetadataDisplay
                video={selectedVideo}
                compact={isMobile || isTablet}
              />
            </Box>
          )}

          {/* Mobile metadata toggle */}
          {isMobile && (
            <Box
              sx={{
                p: 2,
                borderTop: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography
                variant="button"
                onClick={() => setMetadataExpanded(!metadataExpanded)}
                sx={{
                  cursor: "pointer",
                  color: "primary.main",
                  fontWeight: 600,
                }}
              >
                {metadataExpanded ? "Hide" : "Show"} Video Details
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

ResponsiveVideoLayout.displayName = "ResponsiveVideoLayout";
