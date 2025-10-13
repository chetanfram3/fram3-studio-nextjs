"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Paper,
  Stack,
  Tooltip,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import type { VideoPlayerProps } from "@/types/renderedVideos/types";
import { SocialShareModal } from "./SocialShareModal";

export function VideoPlayer({
  video,
  isPlaying,
  onPlay,
  onPause,
}: VideoPlayerProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Create signed URL from destination path
  const videoUrl = `${video.signedUrl}`;

  // Memoize time formatter
  const formatTime = useCallback((time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  // Memoize seek handler
  const handleSeek = useCallback((value: number) => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.currentTime = value;
      setCurrentTime(value);
    }
  }, []);

  // Memoize volume change handler
  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value);
    setIsMuted(value === 0);
  }, []);

  // Memoize toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Memoize toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen((prev) => !prev);
  }, [isFullscreen]);

  // Memoize download handler
  const handleDownload = useCallback(async () => {
    if (!videoUrl) return;

    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        video.renderData.title || `video_v${video.version}`
      }.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
    setMenuAnchorEl(null);
  }, [videoUrl, video.renderData.title, video.version]);

  // Memoize share handler
  const handleShare = useCallback(() => {
    setShareModalOpen(true);
    setMenuAnchorEl(null);
  }, []);

  // Memoize mouse move handler
  const handleMouseMove = useCallback(() => {
    setShowControls(true);

    // Clear existing timeout
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }

    // Don't hide controls if hovering over them or if video is paused/loading
    if (!isHoveringControls && isPlaying && !isLoading) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        if (!isHoveringControls) {
          setShowControls(false);
        }
      }, 3000);
    }
  }, [isHoveringControls, isPlaying, isLoading]);

  // Memoize mouse leave handler
  const handleMouseLeave = useCallback(() => {
    // Only hide controls if not hovering over controls and video is playing
    if (!isHoveringControls && isPlaying && !isLoading) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        if (!isHoveringControls) {
          setShowControls(false);
        }
      }, 1000);
    }
  }, [isHoveringControls, isPlaying, isLoading]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
    const handleDurationChange = () => setDuration(videoElement.duration);
    const handleLoadedData = () => setIsLoading(false);
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("durationchange", handleDurationChange);
    videoElement.addEventListener("loadeddata", handleLoadedData);
    videoElement.addEventListener("error", handleError);

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      videoElement.removeEventListener("durationchange", handleDurationChange);
      videoElement.removeEventListener("loadeddata", handleLoadedData);
      videoElement.removeEventListener("error", handleError);
    };
  }, [video.destinationPath]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Show controls when video is paused or loading
  useEffect(() => {
    if (!isPlaying || isLoading) {
      setShowControls(true);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    }
  }, [isPlaying, isLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  if (hasError) {
    return (
      <Paper
        sx={{
          aspectRatio: video.videoMetadata.aspectRatio || "16/9",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.paper",
          p: 4,
          width: "100%",
          borderRadius: `${brand.borderRadius}px`,
        }}
      >
        <Typography variant="h6" color="error.main" gutterBottom>
          Video Load Error
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Unable to load video. Please check your connection or try again later.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        bgcolor: "#000",
        borderRadius: `${brand.borderRadius}px`,
        overflow: "hidden",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading overlay */}
      {isLoading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0, 0, 0, 0.8)",
            zIndex: 2,
          }}
        >
          <CircularProgress sx={{ color: "primary.main" }} />
        </Box>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={videoUrl}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          aspectRatio: video.videoMetadata.aspectRatio || "16/9",
        }}
        onClick={() => (isPlaying ? onPause() : onPlay())}
      />

      {/* Menu button */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        <IconButton
          onClick={(e) => setMenuAnchorEl(e.currentTarget)}
          sx={{
            bgcolor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            "&:hover": {
              bgcolor: "rgba(0, 0, 0, 0.8)",
            },
          }}
          size="small"
        >
          <MoreIcon />
        </IconButton>
      </Box>

      {/* Options Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            borderRadius: `${brand.borderRadius * 0.5}px`,
          },
        }}
      >
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <DownloadIcon sx={{ color: "primary.main" }} />
          </ListItemIcon>
          <ListItemText
            primary="Download Video"
            primaryTypographyProps={{ color: "text.primary" }}
          />
        </MenuItem>
        <MenuItem onClick={handleShare}>
          <ListItemIcon>
            <ShareIcon sx={{ color: "primary.main" }} />
          </ListItemIcon>
          <ListItemText
            primary="Share Video"
            primaryTypographyProps={{ color: "text.primary" }}
          />
        </MenuItem>
      </Menu>

      {/* Controls overlay */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
          p: 2,
          transform: showControls ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s ease",
          pointerEvents: showControls ? "auto" : "none",
        }}
        onMouseEnter={() => setIsHoveringControls(true)}
        onMouseLeave={() => setIsHoveringControls(false)}
      >
        {/* Progress bar */}
        <Box sx={{ mb: 2 }}>
          <Slider
            value={currentTime}
            max={duration}
            onChange={(_, value) => handleSeek(value as number)}
            sx={{
              color: "primary.main",
              "& .MuiSlider-thumb": {
                width: 12,
                height: 12,
              },
              "& .MuiSlider-rail": {
                bgcolor: "rgba(255,255,255,0.3)",
              },
            }}
          />
        </Box>

        {/* Control buttons */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Play/Pause */}
          <IconButton
            onClick={isPlaying ? onPause : onPlay}
            sx={{
              color: "white",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.1)",
                transform: "scale(1.1)",
              },
              transition: "all 0.2s ease",
            }}
            size="large"
          >
            {isPlaying ? (
              <PauseIcon fontSize="large" />
            ) : (
              <PlayIcon fontSize="large" />
            )}
          </IconButton>

          {/* Time display */}
          <Typography variant="body2" sx={{ color: "white", minWidth: 80 }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Volume controls */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title={isMuted ? "Unmute" : "Mute"}>
              <IconButton
                onClick={toggleMute}
                sx={{
                  color: "white",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
              </IconButton>
            </Tooltip>

            <Box sx={{ width: 80 }}>
              <Slider
                value={isMuted ? 0 : volume}
                max={1}
                step={0.1}
                onChange={(_, value) => handleVolumeChange(value as number)}
                sx={{
                  color: "white",
                  "& .MuiSlider-thumb": {
                    width: 8,
                    height: 8,
                  },
                }}
              />
            </Box>
          </Stack>

          {/* Fullscreen */}
          <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            <IconButton
              onClick={toggleFullscreen}
              sx={{
                color: "white",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Social Share Modal */}
      <SocialShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        video={video}
        videoUrl={videoUrl}
      />
    </Box>
  );
}

VideoPlayer.displayName = "VideoPlayer";
