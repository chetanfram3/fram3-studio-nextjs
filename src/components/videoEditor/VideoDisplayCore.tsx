"use client";

import { useMemo, useCallback } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Fade,
  Stack,
  Typography,
  Badge,
  Chip,
  CircularProgress,
  Button,
  alpha,
} from "@mui/material";
import {
  PlayCircleOutline as PlayIcon,
  ErrorOutline as ErrorIcon,
} from "@mui/icons-material";
import {
  History as HistoryIcon,
  Layers as VersionsIcon,
  Wand2 as GenerateIcon,
} from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import logger from "@/utils/logger";

export interface VideoViewerConfig {
  scriptId: string;
  versionId: string;
  sceneId: number;
  shotId: number;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";
}

export interface VideoVersion {
  id: string;
  createdAt: string;
  // Add other version properties as needed
}

interface VideoDisplayCoreProps {
  currentVideoSrc: string;
  nextVideoSrc: string;
  isTransitioning: boolean;
  wipeDirection: "left-to-right" | "right-to-left";
  aspectRatio: number;
  videoLoaded: boolean;
  hasSignedUrl: boolean;
  altText: string;
  onVideoLoad: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  showOverlays: boolean;
  hasMultipleVersions: boolean;

  // Control states
  generateMode: boolean;
  versionsMode: boolean;
  historyMode: boolean;

  // Action handlers
  onGenerateClick: () => void;
  onVersionsClick: () => void;
  onHistoryClick: () => void;

  // State flags
  isGenerating: boolean;
  isRestoring: boolean;
  overlayIsGenerating: boolean;
  viewingVersion?: VideoVersion;
  config: VideoViewerConfig;

  // Version/History data
  totalVersions: number;
  totalEdits: number;
  isLoadingVersions: boolean;
  isLoadingHistory: boolean;

  // Enhanced loading states
  isLoadingHighRes?: boolean;
  isNavigating?: boolean;
  loadingProgress?: number;
  hasLoadError?: boolean;
  loadErrorMessage?: string | null;

  // Video-specific props
  videoStatus?: string;
  hasLipsync?: boolean;
  thumbnailPath?: string;

  // Callback for versions API refetch
  onRefetchVersions?: () => Promise<unknown>;
}

export function VideoDisplayCore({
  currentVideoSrc,
  nextVideoSrc,
  isTransitioning,
  wipeDirection,
  aspectRatio,
  videoLoaded,
  hasSignedUrl,
  altText,
  onVideoLoad,
  onMouseEnter,
  onMouseLeave,
  showOverlays,
  hasMultipleVersions,
  generateMode,
  versionsMode,
  historyMode,
  onGenerateClick,
  onVersionsClick,
  onHistoryClick,
  isGenerating,
  isRestoring,
  overlayIsGenerating,
  viewingVersion,
  config,
  totalVersions,
  totalEdits,
  isLoadingVersions,
  isLoadingHistory,
  isLoadingHighRes = false,
  isNavigating = false,
  loadingProgress = 0,
  hasLoadError = false,
  loadErrorMessage,
  videoStatus,
  hasLipsync = false,
  thumbnailPath,
  onRefetchVersions,
}: VideoDisplayCoreProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // COMPUTED VALUES (Memoized)
  // ==========================================
  const shouldShowLoading = useMemo(
    () => !videoLoaded && hasSignedUrl && !hasLoadError,
    [videoLoaded, hasSignedUrl, hasLoadError]
  );

  const shouldShowError = useMemo(
    () => hasLoadError && loadErrorMessage,
    [hasLoadError, loadErrorMessage]
  );

  const shouldShowPlaceholder = useMemo(
    () => !currentVideoSrc && !shouldShowLoading && !shouldShowError,
    [currentVideoSrc, shouldShowLoading, shouldShowError]
  );

  const containerStyles = useMemo(
    () => ({
      mb: 2,
      width: "100%",
      bgcolor: "grey.900",
      borderRadius: `${brand.borderRadius}px`,
      overflow: "hidden",
      position: "relative" as const,
      cursor: hasMultipleVersions ? "pointer" : "default",
      aspectRatio: aspectRatio.toString(),
    }),
    [aspectRatio, hasMultipleVersions, brand.borderRadius]
  );

  // ==========================================
  // EVENT HANDLERS (Memoized)
  // ==========================================
  const handleCheckStatus = useCallback(async () => {
    if (!onRefetchVersions) return;

    logger.debug("Check Status button clicked - calling versions API refetch");
    try {
      const result = await onRefetchVersions();
      logger.info("Versions refetch completed:", result);
    } catch (error) {
      logger.error("Versions refetch failed:", error);
    }
  }, [onRefetchVersions]);

  // ==========================================
  // LOADING INDICATOR COMPONENT
  // ==========================================
  const LoadingIndicator = useMemo(
    () => () => (
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          color: "white",
          bgcolor: "rgba(0,0,0,0.75)",
          px: 3,
          py: 2,
          borderRadius: `${brand.borderRadius}px`,
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          zIndex: 20,
        }}
      >
        <CircularProgress
          size={32}
          sx={{
            color: "primary.main",
            ...(loadingProgress > 0 && {
              "& .MuiCircularProgress-circle": {
                strokeDasharray: `${loadingProgress * 2.51}, 251`,
              },
            }),
          }}
        />
        <Stack alignItems="center" spacing={0.5}>
          <Typography
            variant="body2"
            fontWeight="medium"
            textAlign="center"
            sx={{ fontFamily: brand.fonts.body }}
          >
            {videoStatus === "VideoRequestSubmitted"
              ? "Video generation in progress..."
              : videoStatus === "Completed"
                ? "Loading completed video..."
                : isLoadingHighRes
                  ? "Loading high-res video..."
                  : "Loading video..."}
          </Typography>
          {loadingProgress > 0 && (
            <Typography
              variant="caption"
              sx={{ opacity: 0.8, fontFamily: brand.fonts.body }}
            >
              {Math.round(loadingProgress)}%
            </Typography>
          )}
          {videoStatus && (
            <Typography
              variant="caption"
              sx={{ opacity: 0.7, fontFamily: brand.fonts.body }}
            >
              Status: {videoStatus}
            </Typography>
          )}
        </Stack>
      </Box>
    ),
    [
      brand.borderRadius,
      brand.fonts.body,
      loadingProgress,
      videoStatus,
      isLoadingHighRes,
    ]
  );

  // ==========================================
  // ERROR INDICATOR COMPONENT
  // ==========================================
  const ErrorIndicator = useMemo(
    () => () => (
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          color: "white",
          bgcolor: "rgba(0,0,0,0.75)",
          px: 3,
          py: 2,
          borderRadius: `${brand.borderRadius}px`,
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,0,0,0.3)",
          zIndex: 20,
          maxWidth: "80%",
        }}
      >
        <ErrorIcon sx={{ fontSize: 32, color: "error.main" }} />
        <Typography
          variant="body2"
          fontWeight="medium"
          textAlign="center"
          sx={{ fontFamily: brand.fonts.body }}
        >
          Video Load Error
        </Typography>
        <Typography
          variant="caption"
          sx={{
            opacity: 0.9,
            textAlign: "center",
            fontFamily: brand.fonts.body,
          }}
        >
          {loadErrorMessage || "Failed to load video"}
        </Typography>
      </Box>
    ),
    [brand.borderRadius, brand.fonts.body, loadErrorMessage]
  );

  // ==========================================
  // PLACEHOLDER INDICATOR COMPONENT
  // ==========================================
  const PlaceholderIndicator = useMemo(
    () => () => (
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          color: "white",
          textAlign: "center",
          zIndex: 20,
        }}
      >
        <PlayIcon sx={{ fontSize: 64, color: "grey.400" }} />
        <Typography
          variant="h6"
          color="grey.400"
          gutterBottom
          sx={{ fontFamily: brand.fonts.heading }}
        >
          No Video Available
        </Typography>
        <Typography
          variant="body2"
          color="grey.500"
          sx={{ fontFamily: brand.fonts.body }}
        >
          Scene {config.sceneId}, Shot {config.shotId}
        </Typography>
        {videoStatus && (
          <Chip
            label={`Status: ${videoStatus}`}
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.1)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
              fontFamily: brand.fonts.body,
            }}
          />
        )}
        {videoStatus === "VideoRequestSubmitted" && onRefetchVersions && (
          <Button
            onClick={handleCheckStatus}
            variant="outlined"
            size="small"
            sx={{
              marginTop: 2,
              color: "white",
              borderColor: "rgba(255,255,255,0.5)",
              fontFamily: brand.fonts.body,
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.1)",
                borderColor: "white",
              },
            }}
          >
            Check Status
          </Button>
        )}
      </Box>
    ),
    [
      brand.fonts.heading,
      brand.fonts.body,
      config.sceneId,
      config.shotId,
      videoStatus,
      onRefetchVersions,
      handleCheckStatus,
    ]
  );

  return (
    <Box
      sx={containerStyles}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Main Video Container with Reveal/Wipe Effect */}
      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
        {/* Current Video (Background Layer) */}
        {currentVideoSrc && (
          <Box
            component="video"
            src={currentVideoSrc}
            poster={thumbnailPath}
            controls={videoLoaded && !shouldShowLoading}
            preload="metadata"
            onLoadedData={onVideoLoad}
            onCanPlay={onVideoLoad}
            playsInline
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: `${brand.borderRadius}px`,
              transition: "filter 0.3s ease-in-out",
              filter: shouldShowLoading
                ? "blur(10px) brightness(0.7)"
                : hasLoadError
                  ? "blur(2px) brightness(0.5) grayscale(50%)"
                  : "none",
              ...(shouldShowLoading && {
                animation: "videoLoadingPulse 2s ease-in-out infinite",
                "@keyframes videoLoadingPulse": {
                  "0%": { opacity: 0.7 },
                  "50%": { opacity: 0.9 },
                  "100%": { opacity: 0.7 },
                },
              }),
            }}
          />
        )}

        {/* Next Video for Wipe Effect (Overlay Layer) */}
        {isTransitioning && nextVideoSrc && (
          <Box
            component="video"
            src={nextVideoSrc}
            poster={thumbnailPath}
            preload="metadata"
            playsInline
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: `${brand.borderRadius}px`,
              clipPath:
                wipeDirection === "left-to-right"
                  ? "inset(0 0 0 100%)"
                  : "inset(0 100% 0 0)",
              animation:
                wipeDirection === "left-to-right"
                  ? "wipeRevealLeftToRight 0.8s ease-in-out forwards"
                  : "wipeRevealRightToLeft 0.8s ease-in-out forwards",
              "@keyframes wipeRevealLeftToRight": {
                "0%": { clipPath: "inset(0 0 0 100%)" },
                "100%": { clipPath: "inset(0 0 0 0)" },
              },
              "@keyframes wipeRevealRightToLeft": {
                "0%": { clipPath: "inset(0 100% 0 0)" },
                "100%": { clipPath: "inset(0 0 0 0)" },
              },
            }}
          />
        )}

        {/* Loading Indicator */}
        {shouldShowLoading && <LoadingIndicator />}

        {/* Error Indicator */}
        {shouldShowError && <ErrorIndicator />}

        {/* Placeholder Indicator */}
        {shouldShowPlaceholder && <PlaceholderIndicator />}

        {/* Navigation Loading Indicator */}
        {isNavigating && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 30,
              bgcolor: "rgba(0,0,0,0.8)",
              px: 2,
              py: 1,
              borderRadius: `${brand.borderRadius}px`,
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontFamily: brand.fonts.body,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
              Switching versions...
            </Typography>
          </Box>
        )}

        {/* Action Controls */}
        <Fade in={showOverlays || generateMode || versionsMode || historyMode}>
          <Box
            sx={{
              position: "absolute",
              bottom: 60,
              left: 8,
              display: "flex",
              gap: 1,
            }}
          >
            {/* Main Action Buttons */}
            {config.scriptId &&
              config.versionId &&
              !generateMode &&
              !versionsMode &&
              !historyMode && (
                <Box
                  sx={{
                    bgcolor: "rgba(0, 0, 0, 0.6)",
                    backdropFilter: "blur(4px)",
                    borderRadius: `${brand.borderRadius}px`,
                    p: 1,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Stack direction="row" spacing={1}>
                    {/* History Button */}
                    {totalEdits > 0 && (
                      <Tooltip title="View edit history">
                        <IconButton
                          onClick={onHistoryClick}
                          disabled={
                            isGenerating || isRestoring || isLoadingHistory
                          }
                          sx={{
                            bgcolor: historyMode
                              ? "primary.main"
                              : "transparent",
                            color: historyMode
                              ? "primary.contrastText"
                              : "white",
                            "&:hover": {
                              bgcolor: "primary.main",
                              color: "primary.contrastText",
                            },
                            "&:disabled": {
                              bgcolor: "transparent",
                              color: "rgba(255, 255, 255, 0.3)",
                            },
                            transition: "all 0.2s ease-in-out",
                          }}
                        >
                          <Badge badgeContent={totalEdits} color="primary">
                            <HistoryIcon size={20} />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* Generate Button */}
                    <Tooltip title="Generate new video version from prompt">
                      <IconButton
                        onClick={onGenerateClick}
                        disabled={isGenerating || isRestoring}
                        sx={{
                          bgcolor: generateMode
                            ? "primary.main"
                            : "transparent",
                          color: generateMode
                            ? "primary.contrastText"
                            : "white",
                          "&:hover": {
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                          },
                          "&:disabled": {
                            bgcolor: "transparent",
                            color: "rgba(255, 255, 255, 0.3)",
                          },
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <GenerateIcon size={20} />
                      </IconButton>
                    </Tooltip>

                    {/* Versions Button */}
                    {totalVersions > 1 && (
                      <Tooltip title="View all versions">
                        <IconButton
                          onClick={onVersionsClick}
                          disabled={
                            isGenerating || isRestoring || isLoadingVersions
                          }
                          sx={{
                            bgcolor: versionsMode
                              ? "primary.main"
                              : "transparent",
                            color: versionsMode
                              ? "primary.contrastText"
                              : "white",
                            "&:hover": {
                              bgcolor: "primary.main",
                              color: "primary.contrastText",
                            },
                            "&:disabled": {
                              bgcolor: "transparent",
                              color: "rgba(255, 255, 255, 0.3)",
                            },
                            transition: "all 0.2s ease-in-out",
                          }}
                        >
                          <Badge badgeContent={totalVersions} color="primary">
                            <VersionsIcon size={20} />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              )}
          </Box>
        </Fade>

        {/* Processing indicator */}
        {(isGenerating || isRestoring || overlayIsGenerating) && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "white",
              bgcolor: "rgba(0,0,0,0.8)",
              px: 3,
              py: 2,
              borderRadius: `${brand.borderRadius}px`,
              zIndex: 25,
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid",
                  borderTopColor: "primary.main",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
              <Typography
                variant="body2"
                fontWeight="medium"
                sx={{ fontFamily: brand.fonts.body }}
              >
                {isGenerating || overlayIsGenerating
                  ? "Generating new video..."
                  : isRestoring
                    ? "Restoring version..."
                    : "Processing..."}
              </Typography>
            </Stack>
          </Box>
        )}

        {/* Video Status Indicator */}
        {videoStatus && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              px: 1.5,
              py: 0.5,
              borderRadius: `${brand.borderRadius * 0.5}px`,
              fontSize: "0.75rem",
              fontFamily: brand.fonts.body,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            Scene {config.sceneId}, Shot {config.shotId}
            {hasLipsync && (
              <Chip
                label="Lipsync"
                size="small"
                sx={{
                  height: 16,
                  fontSize: "0.6rem",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontFamily: brand.fonts.body,
                }}
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
