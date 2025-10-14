// ShotVideoEditor.tsx - Ported to Next.js 15 with React 19 optimizations
"use client";

import { useMemo, useCallback, startTransition } from "react";
import { Box, Typography, CircularProgress, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import { VideoViewerContainer, VideoData } from "./VideoViewerContainer";
import { VideoViewerConfig } from "./VideoDisplayCore";
import { Shot } from "@/types/storyBoard/types";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import logger from "@/utils/logger";

/**
 * Props interface for ShotVideoEditor component
 * @interface ShotVideoEditorProps
 */
export interface ShotVideoEditorProps {
  /** Shot data containing video information */
  shot?: Shot;
  /** Scene identifier */
  sceneId?: number;
  /** Script identifier */
  scriptId?: string;
  /** Version identifier */
  versionId?: string;
  /** Callback for data refresh */
  onDataRefresh?: () => void;
  /** Callback when shot is updated */
  onShotUpdate?: (updatedShot: Shot) => void;
  /** Video data if not using shot */
  videoData?: VideoData;
  /** Callback when video is updated */
  onVideoUpdate?: (updatedVideoData: VideoData) => void;
  /** Aspect ratio for video display */
  aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";
  /** Callback for loading state changes */
  onLoadingChange?: (isLoading: boolean) => void;
  /** Callback for error handling */
  onError?: (errorMessage: string) => void;
  /** Function to refetch versions from API */
  onRefetchVersions?: () => Promise<unknown>;
}

/**
 * ShotVideoEditor Component
 *
 * Displays video content for a shot with support for:
 * - Multiple video versions
 * - Loading states
 * - Error handling
 * - Progressive image loading
 * - Theme integration
 *
 * @component
 */
export function ShotVideoEditor({
  shot,
  sceneId,
  scriptId,
  versionId,
  onDataRefresh,
  onShotUpdate,
  videoData,
  onVideoUpdate,
  aspectRatio = "16:9",
  onLoadingChange,
  onError,
  onRefetchVersions,
}: ShotVideoEditorProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  // Runtime validation - React 19: No need for useMemo here
  if (!shot && !videoData) {
    logger.error("ShotVideoEditor: Either shot or videoData prop is required");
    onError?.("Shot or video data is required");
    return null;
  }

  if (!scriptId || !versionId || !sceneId) {
    logger.error(
      "ShotVideoEditor: scriptId, versionId, and sceneId are required"
    );
    onError?.("Script ID, Version ID, and Scene ID are required");
    return null;
  }

  if (shot && !shot.shotId) {
    logger.error("ShotVideoEditor: shotId is required when using shot data");
    onError?.("Shot ID is required");
    return null;
  }

  // React 19: useMemo for video status detection
  const videoStatus = useMemo(() => {
    const isVideoPending =
      shot?.videoStatus === "VideoRequestSubmitted" ||
      shot?.videoStatus === "Processing" ||
      shot?.videoStatus === "InProgress" ||
      shot?.videoGenerationType === "text_to_video_pending";

    const isVideoCompleted =
      shot?.videoStatus === "Completed" ||
      shot?.videoStatus === "VideoReady" ||
      (shot?.videoSignedUrl &&
        shot?.videoStatus !== "VideoRequestSubmitted" &&
        shot?.videoStatus !== "Processing");

    const hasNoVideo =
      !shot?.videoSignedUrl &&
      !shot?.videoVersions?.current?.videoSignedUrl &&
      Object.keys(shot?.videoVersions?.archived || {}).length === 0 &&
      !isVideoPending &&
      !isVideoCompleted;

    return { isVideoPending, isVideoCompleted, hasNoVideo };
  }, [shot]);

  // React 19: useCallback for status check handler
  const handleCheckStatus = useCallback(async () => {
    if (!onRefetchVersions) return;

    logger.info("Check Status button clicked - calling versions API refetch");

    try {
      startTransition(() => {
        onRefetchVersions().then((result) => {
          logger.info("Versions refetch completed", result);
        });
      });
    } catch (error) {
      logger.error("Versions refetch failed", error);
      onError?.("Failed to refresh video status");
    }
  }, [onRefetchVersions, onError]);

  // Show placeholder for pending or no video states
  if (videoStatus.isVideoPending || videoStatus.hasNoVideo) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: 2,
          borderColor: "divider",
          borderStyle: "dashed",
          flexDirection: "column",
          gap: 2,
          p: 4,
        }}
      >
        <Typography
          sx={{
            fontSize: "48px",
            color: "text.disabled",
          }}
        >
          🎬
        </Typography>

        {videoStatus.isVideoPending ? (
          <>
            <CircularProgress
              size={32}
              thickness={3}
              sx={{
                color: "primary.main",
              }}
            />
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 1,
                  color: "text.primary",
                  fontFamily: brand.fonts.heading,
                }}
              >
                Video Generation in Progress
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mb: 1,
                }}
              >
                Scene {sceneId}, Shot {shot?.shotId} - Status:{" "}
                {shot?.videoStatus || "Processing"}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.disabled",
                  display: "block",
                  mb: 2,
                }}
              >
                This may take a few minutes...
              </Typography>
              {onRefetchVersions && (
                <IconButton
                  onClick={handleCheckStatus}
                  color="primary"
                  sx={{
                    bgcolor: "primary.main",
                    color: isDarkMode ? "grey.900" : "grey.50",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                    px: 2,
                    py: 1,
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                  }}
                  aria-label="Check video status"
                >
                  <RefreshIcon sx={{ mr: 1 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Check Status
                  </Typography>
                </IconButton>
              )}
            </Box>
          </>
        ) : (
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h6"
              sx={{
                mb: 1,
                color: "text.primary",
                fontFamily: brand.fonts.heading,
              }}
            >
              No Video Available
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 1,
              }}
            >
              Scene {sceneId}, Shot {shot?.shotId}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.disabled",
              }}
            >
              Video will appear here once generated
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  // React 19: useMemo for config object
  const config: VideoViewerConfig = useMemo(
    () => ({
      scriptId: scriptId!,
      versionId: versionId!,
      sceneId: sceneId!,
      shotId: shot?.shotId || 1,
      aspectRatio,
    }),
    [scriptId, versionId, sceneId, shot?.shotId, aspectRatio]
  );

  // React 19: useCallback for Shot to VideoData transformation
  const transformShotToVideoData = useCallback((shotData: Shot): VideoData => {
    const videoVersions = shotData.videoVersions;

    if (!videoVersions) {
      return {
        videoSignedUrl: shotData.videoSignedUrl,
        lipsyncVideoUrl:
          shotData.lipsyncVideoUrl || shotData.hasLipsyncVideo
            ? shotData.videoSignedUrl
            : undefined,
        thumbnailPath: shotData.thumbnailPath,
      };
    }

    const transformedVersions = {
      current: {
        version: videoVersions.current.version,
        videoSignedUrl: videoVersions.current.videoSignedUrl,
        lipsyncVideoSignedUrl: videoVersions.current.lipsyncVideoSignedUrl,
        prompt: videoVersions.current.prompt,
        generationType: videoVersions.current.generationType,
        seed: videoVersions.current.seed,
        aspectRatio: videoVersions.current.aspectRatio,
        imageVersion: videoVersions.current.imageVersion,
        audioVersion: videoVersions.current.audioVersion,
        isCurrent: videoVersions.current.isCurrent,
        lastEditedAt: videoVersions.current.lastEditedAt,
        videoMetadata: videoVersions.current.videoMetadata,
        modelTier: videoVersions.current.modelTier,
      },
      archived: Object.entries(videoVersions.archived || {}).reduce(
        (acc, [key, version]) => {
          acc[parseInt(key)] = {
            version: version.version,
            videoSignedUrl: version.videoSignedUrl,
            lipsyncVideoSignedUrl: version.lipsyncVideoSignedUrl,
            prompt: version.prompt,
            generationType: version.generationType,
            seed: version.seed,
            aspectRatio: version.aspectRatio,
            imageVersion: version.imageVersion,
            audioVersion: version.audioVersion,
            isCurrent: version.isCurrent,
            lastEditedAt: version.lastEditedAt,
            archivedAt: version.archivedAt,
            videoMetadata: version.videoMetadata,
            modelTier: version.modelTier,
          };
          return acc;
        },
        {} as Record<number, VideoData["versions"]>
      ),
      totalVersions: videoVersions.totalVersions,
      totalEdits: videoVersions.totalEdits,
      editHistory: videoVersions.editHistory,
    };

    return {
      videoSignedUrl: shotData.videoSignedUrl,
      lipsyncVideoUrl:
        shotData.lipsyncVideoUrl || shotData.hasLipsyncVideo
          ? shotData.videoSignedUrl
          : undefined,
      thumbnailPath: shotData.thumbnailPath,
      versions: transformedVersions,
    };
  }, []);

  // React 19: useCallback for VideoData to Shot transformation
  const transformVideoDataToShot = useCallback(
    (originalShot: Shot, updatedVideoData: VideoData): Shot => {
      if (!updatedVideoData.versions) {
        return {
          ...originalShot,
          videoSignedUrl: updatedVideoData.videoSignedUrl,
          lipsyncVideoUrl: updatedVideoData.lipsyncVideoUrl,
          hasLipsyncVideo: Boolean(updatedVideoData.lipsyncVideoUrl),
          thumbnailPath:
            updatedVideoData.thumbnailPath || originalShot.thumbnailPath,
        };
      }

      const transformedVideoVersions = {
        current: {
          version: updatedVideoData.versions.current.version,
          videoSignedUrl: updatedVideoData.versions.current.videoSignedUrl,
          lipsyncVideoSignedUrl:
            updatedVideoData.versions.current.lipsyncVideoSignedUrl,
          prompt: updatedVideoData.versions.current.prompt,
          generationType: updatedVideoData.versions.current.generationType,
          seed: updatedVideoData.versions.current.seed,
          aspectRatio: updatedVideoData.versions.current.aspectRatio,
          imageVersion: updatedVideoData.versions.current.imageVersion,
          audioVersion: updatedVideoData.versions.current.audioVersion,
          isCurrent: updatedVideoData.versions.current.isCurrent,
          lastEditedAt: updatedVideoData.versions.current.lastEditedAt,
          videoMetadata: updatedVideoData.versions.current.videoMetadata,
        },
        archived: Object.entries(
          updatedVideoData.versions.archived || {}
        ).reduce(
          (acc, [key, version]) => {
            acc[parseInt(key)] = {
              version: version.version,
              videoSignedUrl: version.videoSignedUrl,
              lipsyncVideoSignedUrl: version.lipsyncVideoSignedUrl,
              prompt: version.prompt,
              generationType: version.generationType,
              seed: version.seed,
              aspectRatio: version.aspectRatio,
              imageVersion: version.imageVersion,
              audioVersion: version.audioVersion,
              isCurrent: version.isCurrent,
              lastEditedAt: version.lastEditedAt,
              archivedAt: version.archivedAt,
              videoMetadata: version.videoMetadata,
            };
            return acc;
          },
          {} as Record<number, Shot["videoVersions"]>
        ),
        totalVersions: updatedVideoData.versions.totalVersions,
        totalEdits: updatedVideoData.versions.totalEdits,
        editHistory: updatedVideoData.versions.editHistory,
      };

      return {
        ...originalShot,
        videoSignedUrl: updatedVideoData.videoSignedUrl,
        lipsyncVideoUrl: updatedVideoData.lipsyncVideoUrl,
        hasLipsyncVideo: Boolean(updatedVideoData.lipsyncVideoUrl),
        thumbnailPath:
          updatedVideoData.thumbnailPath || originalShot.thumbnailPath,
        videoVersions: transformedVideoVersions,
        currentVideoVersion: transformedVideoVersions.current.version,
        videoPrompt: transformedVideoVersions.current.prompt,
        videoGenerationType: transformedVideoVersions.current.generationType,
        videoMetadata: transformedVideoVersions.current.videoMetadata,
      };
    },
    []
  );

  // React 19: useMemo for source video data
  const sourceVideoData: VideoData = useMemo(
    () => videoData || (shot ? transformShotToVideoData(shot) : {}),
    [videoData, shot, transformShotToVideoData]
  );

  // React 19: useCallback for video update handler
  const handleVideoUpdate = useCallback(
    (updatedVideoData: VideoData) => {
      try {
        logger.debug("ShotVideoEditor: Handling video update", {
          hasVersions: !!updatedVideoData.versions,
          currentVersion: updatedVideoData.versions?.current?.version,
          hasVideo: !!(
            updatedVideoData.videoSignedUrl || updatedVideoData.lipsyncVideoUrl
          ),
        });

        // Use startTransition for non-urgent updates
        startTransition(() => {
          if (shot && onShotUpdate) {
            const updatedShot = transformVideoDataToShot(
              shot,
              updatedVideoData
            );
            onShotUpdate(updatedShot);
          } else if (onVideoUpdate) {
            onVideoUpdate(updatedVideoData);
          }
        });
      } catch (error) {
        logger.error("Error updating video data", error);
        onError?.("Failed to update video data");
      }
    },
    [shot, onShotUpdate, onVideoUpdate, transformVideoDataToShot, onError]
  );

  // React 19: useCallback for data refresh handler
  const handleDataRefresh = useCallback(() => {
    try {
      logger.info("ShotVideoEditor: Explicit data refresh requested");
      if (onDataRefresh) {
        startTransition(() => {
          onDataRefresh();
        });
      }
    } catch (error) {
      logger.error("Error refreshing data", error);
      onError?.("Failed to refresh data");
    }
  }, [onDataRefresh, onError]);

  // Render video viewer container
  return (
    <VideoViewerContainer
      key={`${shot?.shotId}-${shot?.videoStatus}-${
        shot?.videoSignedUrl || "no-video"
      }`}
      config={config}
      videoData={sourceVideoData}
      onVideoUpdate={handleVideoUpdate}
      onDataRefresh={handleDataRefresh}
      onLoadingChange={onLoadingChange}
      onError={onError}
      onRefetchVersions={onRefetchVersions}
    />
  );
}

// Export types for external use
export type { VideoViewerConfig } from "./VideoDisplayCore";
export type { VideoData, VideoVersion } from "./VideoViewerContainer";
