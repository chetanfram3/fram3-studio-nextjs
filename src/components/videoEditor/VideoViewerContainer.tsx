// VideoViewerContainer.tsx - Ported to Next.js 15 with React 19 optimizations (FIXED)
"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  startTransition,
} from "react";
import {
  Box,
  Alert,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { format } from "date-fns";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import logger from "@/utils/logger";
import {
  useVideoEditor,
  useVideoVersions,
  useVideoHistory,
  useVideoStatus,
} from "../../hooks/useVideoEditor";
import { VideoDisplayCore, VideoViewerConfig } from "./VideoDisplayCore";
import { VideoVersionModal } from "./VideoVersionOverlay";
import { VideoGenerationOverlay, type GenerateResult } from "./VideoGenerationOverlay";
import { VideoVersionNavigation } from "./VideoVersionNavigation";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Video version interface with metadata
 */
export interface VideoVersion {
  id?: string;
  createdAt?: string;
  modelTier?: number;
  version: number;
  videoSignedUrl: string;
  lipsyncVideoSignedUrl?: string;
  prompt?: string;
  generationType?: string;
  seed?: number;
  aspectRatio?: string;
  imageVersion?: number;
  audioVersion?: number;
  isCurrent: boolean;
  lastEditedAt?: string;
  archivedAt?: string;
  videoMetadata?: {
    duration?: number;
    frameRate?: number;
    size?: string;
    format?: string;
    uploadedAt?: string;
    aspectRatio?: string;
    bitrate?: string;
    modelType?: string;
    audioCodec?: string | null;
    contentType?: string;
    resolution?: string;
    videoCodec?: string;
    fileName?: string;
  };
}

/**
 * History item for tracking video changes
 */
interface HistoryItem {
  timestamp: string;
  fromVersion: number;
  toVersion: number;
  generationType: string;
  previousVideoPath?: string;
  newVideoPath: string;
  prompt?: string;
  seed?: number;
  imageVersion?: number;
  audioVersion?: number;
  restoredFromVersion?: number;
  modelTier?: number;
}

/**
 * Video data structure
 */
export interface VideoData {
  lipsyncVideoUrl?: string | null;
  videoSignedUrl?: string | null;
  lipsyncVideoSignedUrl?: string | null;
  thumbnailPath?: string;
  versions?: {
    current: VideoVersion;
    archived: Record<number, VideoVersion>;
    totalVersions?: number;
    totalEdits?: number;
    editHistory?: HistoryItem[];
  };
}

/**
 * Enhanced video versions response from API
 */
interface EnhancedVideoVersionsResponse {
  totalVersions: number;
  currentVersion: number;
  totalEdits: number;
  versions: {
    current: VideoVersion;
    archived: Record<number, VideoVersion>;
  };
  editHistory?: HistoryItem[];
}

/**
 * Restore result interface
 */
interface RestoreResult {
  newCurrentVersion: number;
}

/**
 * Props for VideoViewerContainer component
 */
interface VideoViewerContainerProps {
  config: VideoViewerConfig;
  videoData: VideoData;
  onVideoUpdate?: (updatedVideoData: VideoData) => void;
  onDataRefresh?: () => void;
  className?: string;
  style?: React.CSSProperties;
  onLoadingChange?: (isLoading: boolean) => void;
  onError?: (errorMessage: string) => void;
  onRefetchVersions?: () => Promise<{ data?: EnhancedVideoVersionsResponse }>;
}

// ==========================================
// CONSTANTS
// ==========================================

const VIDEO_LOAD_TIMEOUT = 15000; // 15 seconds
const VIDEO_LOAD_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_ATTEMPTS = 3;
const MAX_POLL_ATTEMPTS = 10;
const INITIAL_POLL_DELAY = 30000; // 30 seconds
const SUBSEQUENT_POLL_DELAY = 60000; // 60 seconds

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get preferred video URL (prioritize lipsync)
 */
const getPreferredVideoUrl = (
  version: VideoVersion | VideoData | undefined
): string | undefined => {
  if (!version) return undefined;
  if (version.lipsyncVideoSignedUrl) {
    return version.lipsyncVideoSignedUrl;
  }
  return version.videoSignedUrl ?? undefined;
};

/**
 * Check if version has any video
 */
const hasAnyVideo = (
  version: VideoVersion | VideoData | undefined
): boolean => {
  return !!getPreferredVideoUrl(version);
};

/**
 * Check if version has lipsync video
 */
const hasLipsyncVideo = (
  version: VideoVersion | VideoData | undefined
): boolean => {
  return !!version?.lipsyncVideoSignedUrl;
};

/**
 * Check if currently using lipsync video
 */
const isUsingLipsyncVideo = (
  version: VideoVersion | VideoData | undefined,
  currentSrc: string
): boolean => {
  return !!(
    version?.lipsyncVideoSignedUrl &&
    currentSrc === version.lipsyncVideoSignedUrl
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * VideoViewerContainer Component
 *
 * Manages video playback, version history, and generation for shots.
 * Features:
 * - Multi-version support with navigation
 * - Lipsync video prioritization
 * - Video generation and restoration
 * - Loading states and error handling
 * - Automatic polling for generation completion
 *
 * @component
 */
export function VideoViewerContainer({
  config,
  videoData,
  onVideoUpdate,
  onDataRefresh,
  className,
  style,
  onLoadingChange,
  onError,
  onRefetchVersions,
}: VideoViewerContainerProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  // ==========================================
  // STATE
  // ==========================================
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string>("");
  const [currentlyViewingVersion, setCurrentlyViewingVersion] = useState<
    VideoVersion | undefined
  >();
  const [showOverlays, setShowOverlays] = useState(false);
  const [generateMode, setGenerateMode] = useState(false);
  const [versionsMode, setVersionsMode] = useState(false);
  const [historyMode, setHistoryMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextVideoSrc, setNextVideoSrc] = useState<string>("");
  const [wipeDirection, setWipeDirection] = useState<
    "left-to-right" | "right-to-left"
  >("left-to-right");
  const [isLoadingHighRes, setIsLoadingHighRes] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [showInvalidVersions, setShowInvalidVersions] = useState(false);
  const [isAwaitingGeneration, setIsAwaitingGeneration] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<Date | null>(
    null
  );
  const [pollAttempts, setPollAttempts] = useState(0);
  const [overlayIsGenerating, setOverlayIsGenerating] = useState(false);

  // ==========================================
  // REFS
  // ==========================================
  const videoTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const currentVideoRef = useRef<HTMLVideoElement | undefined>(undefined);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // ==========================================
  // MEMOIZED VALUES
  // ==========================================

  // React 19: useMemo for hook parameters
  const hookParams = useMemo(
    () => ({
      scriptId: config.scriptId,
      versionId: config.versionId,
      sceneId: config.sceneId,
      shotId: config.shotId,
    }),
    [config.scriptId, config.versionId, config.sceneId, config.shotId]
  );

  // React 19: useMemo for aspect ratio calculation
  const aspectRatioValue = useMemo(() => {
    switch (config.aspectRatio) {
      case "16:9":
        return 16 / 9;
      case "9:16":
        return 9 / 16;
      case "1:1":
        return 1;
      default:
        return 16 / 9;
    }
  }, [config.aspectRatio]);

  // React 19: useMemo for stable video data
  const stableVideoData = useMemo(() => {
    if (!videoData) return null;

    return {
      videoSignedUrl: videoData.videoSignedUrl,
      lipsyncVideoSignedUrl: videoData.lipsyncVideoSignedUrl,
      thumbnailPath: videoData.thumbnailPath,
      versions: videoData.versions
        ? {
            current: {
              version: videoData.versions.current.version,
              videoSignedUrl: videoData.versions.current.videoSignedUrl,
              lipsyncVideoSignedUrl:
                videoData.versions.current.lipsyncVideoSignedUrl,
              prompt: videoData.versions.current.prompt,
              generationType: videoData.versions.current.generationType,
              imageVersion: videoData.versions.current.imageVersion,
              audioVersion: videoData.versions.current.audioVersion,
              isCurrent: videoData.versions.current.isCurrent,
              lastEditedAt: videoData.versions.current.lastEditedAt,
              modelTier: videoData.versions.current.modelTier,
            },
            archived: videoData.versions.archived,
            totalVersions: videoData.versions.totalVersions,
            totalEdits: videoData.versions.totalEdits,
            editHistory: videoData.versions.editHistory,
          }
        : undefined,
    };
  }, [
    videoData?.videoSignedUrl,
    videoData?.lipsyncVideoSignedUrl,
    videoData?.thumbnailPath,
    videoData?.versions?.current?.version,
    videoData?.versions?.current?.videoSignedUrl,
    videoData?.versions?.current?.lipsyncVideoSignedUrl,
    videoData?.versions?.current?.prompt,
    videoData?.versions?.current?.generationType,
    videoData?.versions?.current?.imageVersion,
    videoData?.versions?.current?.audioVersion,
    videoData?.versions?.current?.isCurrent,
    videoData?.versions?.current?.lastEditedAt,
    videoData?.versions?.current?.modelTier,
    videoData?.versions?.archived,
    videoData?.versions?.totalVersions,
    videoData?.versions?.totalEdits,
    videoData?.versions?.editHistory,
  ]);

  // ==========================================
  // HOOKS
  // ==========================================
  const {
    generateVideoAsync,
    restoreVideoVersionAsync,
    isGenerating,
    isRestoring,
    resetGenerateMutation,
    resetRestoreMutation,
  } = useVideoEditor();

  const {
    data: videoVersionsData,
    isLoading: isLoadingVersions,
    error: versionsError,
    refetch: refetchVersions,
  } = useVideoVersions(hookParams, true);

  const {
    data: videoHistoryData,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useVideoHistory(hookParams, historyMode);

  const {
    data: videoStatusData,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useVideoStatus(hookParams, true);

  // ==========================================
  // CALLBACKS
  // ==========================================

  // React 19: useCallback for version refetch
  const finalRefetchVersions = useCallback(async () => {
    if (onRefetchVersions) {
      return await onRefetchVersions();
    }
    const result = await refetchVersions();
    return { data: result.data as EnhancedVideoVersionsResponse | undefined };
  }, [onRefetchVersions, refetchVersions]);

  // React 19: useCallback for polling cleanup
  const cleanupPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setIsAwaitingGeneration(false);
    setGenerationStartTime(null);
    setPollAttempts(0);
  }, []);

  // React 19: useCallback for video loading cleanup
  const cleanupVideoLoading = useCallback(() => {
    if (videoTimeoutRef.current) {
      clearTimeout(videoTimeoutRef.current);
      videoTimeoutRef.current = undefined;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }
    if (currentVideoRef.current) {
      currentVideoRef.current.onloadeddata = null;
      currentVideoRef.current.onerror = null;
      currentVideoRef.current = undefined;
    }
  }, []);

  // React 19: useCallback for updating video data from versions
  const updateVideoDataFromVersions = useCallback(
    (versionsData: EnhancedVideoVersionsResponse) => {
      if (!onVideoUpdate || !versionsData?.versions) return;

      const { current, archived } = versionsData.versions;

      const updatedVideoData: VideoData = {
        videoSignedUrl: current.videoSignedUrl,
        lipsyncVideoSignedUrl: current.lipsyncVideoSignedUrl,
        lipsyncVideoUrl: current.lipsyncVideoSignedUrl,
        thumbnailPath: videoData?.thumbnailPath,
        versions: {
          current: {
            version: current.version,
            videoSignedUrl: current.videoSignedUrl,
            lipsyncVideoSignedUrl: current.lipsyncVideoSignedUrl,
            prompt: current.prompt,
            generationType: current.generationType,
            seed: current.seed,
            aspectRatio: current.aspectRatio,
            imageVersion: current.imageVersion,
            audioVersion: current.audioVersion,
            isCurrent: true,
            lastEditedAt: current.lastEditedAt,
            videoMetadata: current.videoMetadata,
            modelTier: current.modelTier,
          },
          archived,
          totalVersions: versionsData.totalVersions,
          totalEdits: versionsData.totalEdits,
          editHistory:
            versionsData.editHistory || videoData?.versions?.editHistory,
        },
      };

      onVideoUpdate(updatedVideoData);
      if (!updatedVideoData.versions) return;

      const preferredUrl = getPreferredVideoUrl(
        updatedVideoData.versions.current
      );
      setCurrentlyViewingVersion(updatedVideoData.versions.current);
      setCurrentVideoSrc(preferredUrl || "");
      setVideoLoaded(!!preferredUrl);
      setIsLoadingHighRes(false);
      setLoadError(null);
    },
    [onVideoUpdate, videoData?.thumbnailPath, videoData?.versions?.editHistory]
  );

  // React 19: useCallback for versions polling
  const startVersionsPolling = useCallback(async () => {
    if (!mountedRef.current || !isAwaitingGeneration) {
      return;
    }

    const currentAttempt = pollAttempts + 1;
    logger.info(`Polling attempt ${currentAttempt}/${MAX_POLL_ATTEMPTS}`);

    try {
      const result = await finalRefetchVersions();
      const versions = result.data;

      if (versions && versions.versions) {
        const currentVersion = versions.versions.current;
        const hasNewVideo = !!(
          currentVersion.videoSignedUrl || currentVersion.lipsyncVideoSignedUrl
        );

        const isNewVersion =
          currentVersion.version !== videoData?.versions?.current?.version;

        const isComplete =
          currentVersion.generationType !== "text_to_video_pending";

        if (hasNewVideo && (isNewVersion || isComplete)) {
          updateVideoDataFromVersions(versions);

          const completionTime = generationStartTime
            ? Math.round((Date.now() - generationStartTime.getTime()) / 1000)
            : 0;

          logger.info(`Video generated successfully in ${completionTime}s`);
          onError?.(
            `Video generated successfully in ${completionTime}s! Version ${currentVersion.version}`
          );

          cleanupPolling();
          return;
        }

        if (currentAttempt < MAX_POLL_ATTEMPTS) {
          setPollAttempts(currentAttempt);
          pollTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && isAwaitingGeneration) {
              startVersionsPolling();
            }
          }, SUBSEQUENT_POLL_DELAY);
        } else {
          cleanupPolling();
          onError?.(
            "Video generation is taking longer than expected. Please refresh manually."
          );
        }
      } else {
        throw new Error("Invalid versions data structure");
      }
    } catch (error) {
      logger.error("Error during polling", error);

      if (currentAttempt < MAX_POLL_ATTEMPTS) {
        setPollAttempts(currentAttempt);
        pollTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && isAwaitingGeneration) {
            startVersionsPolling();
          }
        }, SUBSEQUENT_POLL_DELAY);
      } else {
        cleanupPolling();
        onError?.(
          "Failed to check video generation status. Please refresh manually."
        );
      }
    }
  }, [
    pollAttempts,
    finalRefetchVersions,
    videoData?.versions?.current?.version,
    generationStartTime,
    isAwaitingGeneration,
    onError,
    cleanupPolling,
    updateVideoDataFromVersions,
  ]);

  // React 19: useCallback for filtering valid versions
  const getValidVersions = useCallback(
    (versions: VideoVersion[]): VideoVersion[] => {
      return versions.filter((version) => hasAnyVideo(version));
    },
    []
  );

  // React 19: useCallback for finding next valid version
  const findNextValidVersion = useCallback(
    (
      currentIndex: number,
      direction: "next" | "prev",
      versions: VideoVersion[]
    ): { version: VideoVersion; index: number } | null => {
      const step = direction === "next" ? 1 : -1;
      let index = currentIndex + step;

      while (index >= 0 && index < versions.length) {
        const version = versions[index];
        if (hasAnyVideo(version)) {
          return { version, index };
        }
        index += step;
      }

      return null;
    },
    []
  );

  // React 19: useCallback for high-res video loading
  const loadHighResVideo = useCallback(
    (
      videoUrl: string,
      onSuccess?: () => void,
      onErrorCallback?: () => void
    ) => {
      if (!mountedRef.current) return;

      cleanupVideoLoading();

      setIsLoadingHighRes(true);
      setLoadError(null);
      onLoadingChange?.(true);

      const video = document.createElement("video");
      currentVideoRef.current = video;

      videoTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        logger.warn("High-res video load timeout", videoUrl);

        video.onloadeddata = null;
        video.onerror = null;

        setIsLoadingHighRes(false);
        setVideoLoaded(true);
        const timeoutError =
          "High-resolution video load timed out. Showing available resolution.";
        setLoadError(timeoutError);
        onLoadingChange?.(false);
        onError?.(timeoutError);
        onErrorCallback?.();
      }, VIDEO_LOAD_TIMEOUT);

      video.onloadeddata = () => {
        if (!mountedRef.current) return;

        cleanupVideoLoading();
        setCurrentVideoSrc(videoUrl);
        setVideoLoaded(true);
        setIsLoadingHighRes(false);
        setRetryAttempts(0);
        onLoadingChange?.(false);
        onSuccess?.();
      };

      video.onerror = (error) => {
        if (!mountedRef.current) return;
        logger.error("High-res video load error", { videoUrl, error });

        cleanupVideoLoading();
        setIsLoadingHighRes(false);
        onLoadingChange?.(false);

        if (retryAttempts < MAX_RETRY_ATTEMPTS) {
          const newAttempts = retryAttempts + 1;
          setRetryAttempts(newAttempts);
          const retryError = `Retrying video load (${newAttempts}/${MAX_RETRY_ATTEMPTS})...`;
          setLoadError(retryError);
          onError?.(retryError);

          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              loadHighResVideo(videoUrl, onSuccess, onErrorCallback);
            }
          }, VIDEO_LOAD_RETRY_DELAY);
        } else {
          setVideoLoaded(true);
          const finalError =
            "Failed to load high-resolution video. Showing available resolution.";
          setLoadError(finalError);
          setRetryAttempts(0);
          onError?.(finalError);
          onErrorCallback?.();
        }
      };

      video.src = videoUrl;
      video.load();
    },
    [cleanupVideoLoading, retryAttempts, onLoadingChange, onError]
  );

  // React 19: useCallback for version selection
  const handleVersionSelect = useCallback(
    (
      version: VideoVersion,
      direction: "left-to-right" | "right-to-left" = "left-to-right",
      skipThumbnail: boolean = false
    ) => {
      if (!mountedRef.current) return;
      if (currentlyViewingVersion?.version === version.version) return;

      cleanupVideoLoading();

      setIsLoadingHighRes(false);
      setLoadError(null);
      setIsNavigating(true);

      const videoUrl = getPreferredVideoUrl(version);

      if (!videoUrl) {
        logger.warn(`Version ${version.version} has no video URL available`);

        setCurrentlyViewingVersion(version);
        setCurrentVideoSrc("");
        setVideoLoaded(false);
        setIsLoadingHighRes(false);
        setIsNavigating(false);

        let errorMessage = `Version ${version.version} video is not available`;
        if (version.generationType === "text_to_video_pending") {
          errorMessage = `Version ${version.version} is still being generated`;
        }

        setLoadError(errorMessage);
        onError?.(errorMessage);
        onLoadingChange?.(false);

        return;
      }

      const video = document.createElement("video");
      video.preload = "metadata";

      const navigationTimeout = setTimeout(() => {
        if (!mountedRef.current) return;

        setCurrentlyViewingVersion(version);
        setCurrentVideoSrc(videoUrl);
        setVideoLoaded(true);
        setIsTransitioning(false);
        setNextVideoSrc("");
        setIsNavigating(false);

        const timeoutError = `Version ${version.version} loaded with timeout`;
        setLoadError(timeoutError);
        onLoadingChange?.(false);
      }, 8000);

      video.onloadeddata = () => {
        if (!mountedRef.current) return;
        clearTimeout(navigationTimeout);

        setNextVideoSrc(videoUrl);
        setWipeDirection(direction);
        setIsTransitioning(true);

        setTimeout(() => {
          if (!mountedRef.current) return;

          setCurrentlyViewingVersion(version);
          setCurrentVideoSrc(videoUrl);
          setVideoLoaded(true);
          setIsTransitioning(false);
          setNextVideoSrc("");
          setIsLoadingHighRes(false);
          setIsNavigating(false);
          setLoadError(null);
          setRetryAttempts(0);
          onLoadingChange?.(false);
        }, 900);
      };

      video.oncanplay = () => {
        if (!video.readyState || video.readyState < 2) {
          video.onloadeddata?.({} as Event);
        }
      };

      video.onerror = (error) => {
        if (!mountedRef.current) return;
        clearTimeout(navigationTimeout);
        logger.error(`Video load failed for version ${version.version}`, error);

        setCurrentlyViewingVersion(version);
        setCurrentVideoSrc("");
        setVideoLoaded(false);
        setIsLoadingHighRes(false);
        setIsTransitioning(false);
        setNextVideoSrc("");
        setIsNavigating(false);

        const errorMessage = `Version ${version.version} failed to load`;
        setLoadError(errorMessage);
        onError?.(errorMessage);
        onLoadingChange?.(false);
      };

      video.src = videoUrl;
      video.load();
    },
    [currentlyViewingVersion, cleanupVideoLoading, onError, onLoadingChange]
  );

  // React 19: useCallback for generation completion
  const handleGenerateComplete = useCallback(
    (generateResult: GenerateResult) => {
      startTransition(() => {
        setGenerateMode(false);

        if (generateResult.isDummy || generateResult.status === "completed") {
          onDataRefresh?.();
          return;
        }

        if (
          generateResult.status === "VideoRequestSubmitted" ||
          generateResult.status === "processing"
        ) {
          setIsAwaitingGeneration(true);
          setGenerationStartTime(new Date());
          setPollAttempts(0);

          if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
          }

          pollTimeoutRef.current = setTimeout(async () => {
            if (!mountedRef.current) return;

            try {
              if (onRefetchVersions) {
                logger.info("Calling onRefetchVersions after initial delay");
                const result = await onRefetchVersions();
                logger.info(
                  "Post-generate refresh completed",
                  result?.data?.versions?.current
                );

                if (result?.data) {
                  updateVideoDataFromVersions(result.data);
                }
              }
            } catch (error) {
              logger.error("Post-generate refresh failed", error);
            }

            if (mountedRef.current) {
              startVersionsPolling();
            }
          }, INITIAL_POLL_DELAY);

          onError?.(
            `Video generation started! First refresh in ${INITIAL_POLL_DELAY / 1000}s...`
          );
        }
      });
    },
    [
      onDataRefresh,
      onRefetchVersions,
      onError,
      updateVideoDataFromVersions,
      startVersionsPolling,
    ]
  );

  // React 19: useCallback for version restoration
  const handleRestoreVersion = useCallback(
    async (targetVersion: number) => {
      try {
        resetRestoreMutation();

        const restoreParams = {
          ...hookParams,
          targetVersion,
        };

        const restoreResult = (await restoreVideoVersionAsync(
          restoreParams
        )) as RestoreResult;

        const restoredVersion = allVersions.find(
          (v) => v.version === targetVersion
        );
        if (!restoredVersion) return;

        const newCurrentVersion: VideoVersion = {
          version: restoreResult.newCurrentVersion,
          videoSignedUrl: restoredVersion.videoSignedUrl,
          lipsyncVideoSignedUrl: restoredVersion.lipsyncVideoSignedUrl,
          prompt: restoredVersion.prompt,
          generationType: restoredVersion.generationType,
          imageVersion: restoredVersion.imageVersion,
          audioVersion: restoredVersion.audioVersion,
          isCurrent: true,
          lastEditedAt: new Date().toISOString(),
          modelTier: restoredVersion.modelTier,
        };

        const archivedVersions = { ...videoData?.versions?.archived };
        if (videoData?.versions?.current) {
          archivedVersions[videoData.versions.current.version] = {
            ...videoData.versions.current,
            isCurrent: false,
            archivedAt: new Date().toISOString(),
          };
        }
        delete archivedVersions[targetVersion];

        const updatedVideoData: VideoData = {
          videoSignedUrl: restoredVersion.videoSignedUrl,
          lipsyncVideoSignedUrl: restoredVersion.lipsyncVideoSignedUrl,
          lipsyncVideoUrl: restoredVersion.lipsyncVideoSignedUrl,
          thumbnailPath: videoData?.thumbnailPath,
          versions: {
            current: newCurrentVersion,
            archived: archivedVersions,
            totalVersions: videoData?.versions?.totalVersions || 1,
            totalEdits: (videoData?.versions?.totalEdits || 0) + 1,
            editHistory: [
              ...(videoData?.versions?.editHistory || []),
              {
                timestamp: new Date().toISOString(),
                fromVersion: videoData?.versions?.current?.version || 1,
                toVersion: restoreResult.newCurrentVersion,
                generationType: "version_restore",
                restoredFromVersion: targetVersion,
                previousVideoPath:
                  videoData?.versions?.current?.videoSignedUrl || "",
                newVideoPath: restoredVersion.videoSignedUrl,
                prompt: restoredVersion.prompt,
                modelTier: restoredVersion.modelTier,
              },
            ],
          },
        };

        if (onVideoUpdate) {
          onVideoUpdate(updatedVideoData);
        }

        const preferredUrl = getPreferredVideoUrl(newCurrentVersion);
        setCurrentlyViewingVersion(newCurrentVersion);
        setCurrentVideoSrc(preferredUrl || "");
        setVideoLoaded(!!preferredUrl);
        setIsLoadingHighRes(false);
        setLoadError(null);
        refetchVersions();

        if (!onVideoUpdate && onDataRefresh) {
          onDataRefresh();
        }
      } catch (error) {
        logger.error("Error restoring version", error);
      }
    },
    [
      hookParams,
      restoreVideoVersionAsync,
      resetRestoreMutation,
      videoData,
      onVideoUpdate,
      onDataRefresh,
      refetchVersions,
    ]
  );

  // React 19: useCallback for other handlers
  const handleVideoLoad = useCallback(() => {
    setVideoLoaded(true);
    setIsLoadingHighRes(false);
    setLoadError(null);
  }, []);

  const handleGenerateClick = useCallback(() => {
    startTransition(() => {
      setGenerateMode(true);
      setVersionsMode(false);
      setHistoryMode(false);
    });
  }, []);

  const handleVersionsClick = useCallback(() => {
    startTransition(() => {
      setVersionsMode(true);
      setHistoryMode(false);
      setGenerateMode(false);
    });
  }, []);

  const handleHistoryClick = useCallback(() => {
    startTransition(() => {
      setHistoryMode(true);
      setVersionsMode(false);
      setGenerateMode(false);
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setShowOverlays(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowOverlays(false);
  }, []);

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  // React 19: useMemo for filtered versions
  const filteredVersions = useMemo(() => {
    const rawVersions = videoData?.versions
      ? [
          videoData.versions.current,
          ...Object.values(videoData.versions.archived),
        ].sort((a, b) => b.version - a.version)
      : [];

    return showInvalidVersions ? rawVersions : getValidVersions(rawVersions);
  }, [videoData?.versions, showInvalidVersions, getValidVersions]);

  const allVersions = filteredVersions;
  const viewingVersion =
    currentlyViewingVersion || videoData?.versions?.current;

  // React 19: useMemo for derived values
  const hasMultipleVersions = allVersions.length > 1;
  const totalVersions =
    videoData?.versions?.totalVersions || videoVersionsData?.totalVersions || 0;
  const totalEdits =
    videoData?.versions?.totalEdits || videoVersionsData?.totalEdits || 0;
  const historyData =
    videoHistoryData?.editHistory || videoData?.versions?.editHistory || [];
  const shouldShowLoadingIndicator = isLoadingHighRes && !loadError;

  // React 19: useMemo for lipsync status
  const currentVideoIsLipsync = useMemo(() => {
    return isUsingLipsyncVideo(viewingVersion, currentVideoSrc);
  }, [viewingVersion, currentVideoSrc]);

  const hasLipsyncAvailable = useMemo(() => {
    return hasLipsyncVideo(viewingVersion);
  }, [viewingVersion]);

  // React 19: useMemo for processing status
  const isVideoProcessing = useMemo(() => {
    return isAwaitingGeneration || isGenerating || isRestoring;
  }, [isAwaitingGeneration, isGenerating, isRestoring]);

  // React 19: useCallback for processing status message
  const getProcessingStatus = useCallback(() => {
    if (isGenerating) return "Submitting generation request...";
    if (overlayIsGenerating) return "Preparing video generation...";
    if (isRestoring) return "Restoring version...";
    if (isAwaitingGeneration && generationStartTime) {
      const elapsed = Math.round(
        (Date.now() - generationStartTime.getTime()) / 1000
      );
      const nextCheckIn =
        pollAttempts === 0
          ? Math.max(0, INITIAL_POLL_DELAY / 1000 - elapsed)
          : Math.max(
              0,
              SUBSEQUENT_POLL_DELAY / 1000 -
                (elapsed % (SUBSEQUENT_POLL_DELAY / 1000))
            );

      return `Checking for completion... (${elapsed}s elapsed, attempt ${
        pollAttempts + 1
      }/${MAX_POLL_ATTEMPTS}, next check in ${Math.ceil(nextCheckIn)}s)`;
    }
    return "Processing...";
  }, [
    isGenerating,
    overlayIsGenerating,
    isRestoring,
    isAwaitingGeneration,
    generationStartTime,
    pollAttempts,
  ]);

  // React 19: useCallback for helper functions
  const getVideoAltText = useCallback(() => {
    return `Video for Scene ${config.sceneId}, Shot ${config.shotId}${
      viewingVersion ? ` (Version ${viewingVersion.version})` : ""
    }`;
  }, [config.sceneId, config.shotId, viewingVersion]);

  const formatDate = useCallback((dateString: string): string => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return "Unknown date";
    }
  }, []);

  // ==========================================
  // EFFECTS
  // ==========================================

  // Component unmount cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupVideoLoading();
      cleanupPolling();
    };
  }, [cleanupVideoLoading, cleanupPolling]);

  // Initial video setup
  useEffect(() => {
    if (!mountedRef.current) return;

    cleanupVideoLoading();
    cleanupPolling();

    setVideoLoaded(false);
    setIsLoadingHighRes(false);
    setIsNavigating(false);
    setLoadError(null);
    setRetryAttempts(0);
    setOverlayIsGenerating(false);
    setGenerateMode(false);
    setVersionsMode(false);
    setHistoryMode(false);

    resetGenerateMutation();
    resetRestoreMutation();

    if (videoData?.versions?.current) {
      const preferredUrl = getPreferredVideoUrl(videoData.versions.current);
      if (preferredUrl) {
        setCurrentVideoSrc(preferredUrl);
        setCurrentlyViewingVersion(videoData.versions.current);
        setVideoLoaded(true);
      }
    } else {
      const preferredUrl = getPreferredVideoUrl(videoData);
      if (preferredUrl) {
        setCurrentVideoSrc(preferredUrl);
        setCurrentlyViewingVersion(undefined);
        setVideoLoaded(true);
      } else {
        setCurrentVideoSrc("");
        setCurrentlyViewingVersion(undefined);
        setVideoLoaded(false);
      }
    }
  }, [
    videoData?.videoSignedUrl,
    videoData?.lipsyncVideoSignedUrl,
    videoData?.versions?.current?.version,
    videoData?.versions?.current?.videoSignedUrl,
    videoData?.versions?.current?.lipsyncVideoSignedUrl,
    resetGenerateMutation,
    resetRestoreMutation,
    cleanupVideoLoading,
    cleanupPolling,
  ]);

  // High-resolution video loading
  useEffect(() => {
    if (!mountedRef.current) return;

    const videoUrl = getPreferredVideoUrl(
      currentlyViewingVersion || stableVideoData || undefined
    );

    if (
      videoUrl &&
      videoUrl !== currentVideoSrc &&
      !isTransitioning &&
      !isLoadingHighRes &&
      videoLoaded &&
      currentVideoSrc !== "" &&
      !isNavigating
    ) {
      loadHighResVideo(videoUrl);
    } else if (videoUrl === currentVideoSrc && !isTransitioning) {
      setVideoLoaded(true);
      setIsLoadingHighRes(false);
      setLoadError(null);
    }

    if (!videoUrl && !isTransitioning) {
      setVideoLoaded(false);
      setIsLoadingHighRes(false);
      setLoadError(null);
    }
  }, [
    stableVideoData?.videoSignedUrl,
    stableVideoData?.lipsyncVideoSignedUrl,
    currentlyViewingVersion?.videoSignedUrl,
    currentlyViewingVersion?.lipsyncVideoSignedUrl,
    currentVideoSrc,
    isTransitioning,
    isLoadingHighRes,
    videoLoaded,
    isNavigating,
    loadHighResVideo,
  ]);

  // ==========================================
  // RENDER
  // ==========================================

  if (!mountedRef.current || (!videoData && !currentVideoSrc)) {
    return (
      <Box className={className} style={style}>
        <Box
          sx={{
            height: 400,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.paper",
            borderRadius: `${brand.borderRadius}px`,
            border: 2,
            borderColor: "divider",
            borderStyle: "dashed",
          }}
        >
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Loading video viewer...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      className={className}
      style={style}
      sx={{
        position: "relative",
        isolation: "isolate",
        ...style,
      }}
    >
      {/* Main Video Display */}
      <VideoDisplayCore
        currentVideoSrc={currentVideoSrc}
        nextVideoSrc={nextVideoSrc}
        isTransitioning={isTransitioning}
        wipeDirection={wipeDirection}
        aspectRatio={aspectRatioValue}
        videoLoaded={videoLoaded && !shouldShowLoadingIndicator}
        hasSignedUrl={
          hasAnyVideo(videoData) || hasAnyVideo(currentlyViewingVersion)
        }
        altText={getVideoAltText()}
        onVideoLoad={handleVideoLoad}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        showOverlays={showOverlays}
        hasMultipleVersions={hasMultipleVersions}
        generateMode={generateMode}
        versionsMode={versionsMode}
        historyMode={historyMode}
        onGenerateClick={handleGenerateClick}
        onVersionsClick={handleVersionsClick}
        onHistoryClick={handleHistoryClick}
        totalVersions={totalVersions}
        totalEdits={totalEdits}
        isLoadingVersions={isLoadingVersions}
        isLoadingHistory={isLoadingHistory}
        isGenerating={isGenerating}
        isRestoring={isRestoring}
        overlayIsGenerating={false}
        viewingVersion={viewingVersion}
        config={config}
        isLoadingHighRes={isLoadingHighRes}
        isNavigating={isNavigating}
        hasLoadError={!!loadError}
        loadErrorMessage={loadError}
        videoStatus={videoStatusData?.status}
        hasLipsync={hasLipsyncAvailable}
        thumbnailPath={videoData?.thumbnailPath}
        onRefetchVersions={finalRefetchVersions}
      />

      {mountedRef.current && (
        <VideoVersionNavigation
          allVersions={allVersions}
          currentlyViewingVersion={viewingVersion}
          showOverlays={showOverlays}
          versionsMode={versionsMode}
          historyMode={historyMode}
          isGenerating={isGenerating}
          isRestoring={isRestoring}
          onVersionSelect={handleVersionSelect}
        />
      )}

      {mountedRef.current && (
        <VideoVersionModal
          open={versionsMode || historyMode}
          onClose={() => {
            if (mountedRef.current) {
              startTransition(() => {
                setVersionsMode(false);
                setHistoryMode(false);
              });
            }
          }}
          allVersions={allVersions}
          currentlyViewingVersion={viewingVersion}
          totalVersions={totalVersions}
          totalEdits={totalEdits}
          historyData={historyData}
          isLoading={false}
          isLoadingVersions={isLoadingVersions}
          isLoadingHistory={isLoadingHistory}
          isGenerating={isGenerating}
          isRestoring={isRestoring}
          onVersionSelect={handleVersionSelect}
          onRestoreVersion={handleRestoreVersion}
          formatDate={formatDate}
        />
      )}

      {mountedRef.current && generateMode && (
        <VideoGenerationOverlay
          scriptId={config.scriptId}
          versionId={config.versionId}
          sceneId={config.sceneId}
          shotId={config.shotId}
          viewingVersion={viewingVersion}
          hasLipSync={hasLipsyncAvailable}
          onGenerateComplete={handleGenerateComplete}
          onCancel={() => {
            if (mountedRef.current) {
              startTransition(() => {
                setGenerateMode(false);
              });
            }
          }}
          onDataRefresh={onDataRefresh}
          onGeneratingStateChange={setOverlayIsGenerating}
          disabled={isGenerating || isRestoring}
        />
      )}

      {/* Processing indicator */}
      {isVideoProcessing && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "text.primary",
            bgcolor: isDarkMode ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)",
            px: 3,
            py: 2,
            borderRadius: `${brand.borderRadius}px`,
            zIndex: 25,
            border: 2,
            borderColor: "primary.main",
            boxShadow: theme.shadows[8],
            backdropFilter: "blur(10px)",
            minWidth: 280,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CircularProgress
              size={20}
              thickness={3}
              sx={{
                color: "primary.main",
              }}
            />
            <Typography
              variant="body2"
              fontWeight="medium"
              sx={{
                fontFamily: brand.fonts.body,
                color: "text.primary",
              }}
            >
              {getProcessingStatus()}
            </Typography>
            {isAwaitingGeneration && (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={async () => {
                  cleanupPolling();
                  if (onRefetchVersions) {
                    try {
                      const result = await onRefetchVersions();
                      logger.info(
                        "Versions refetch completed",
                        result?.data?.versions?.current
                      );

                      if (result?.data) {
                        updateVideoDataFromVersions(result.data);
                      }
                    } catch (error) {
                      logger.error("Versions refetch failed", error);
                      onError?.("Failed to refresh video data");
                    }
                  }
                }}
                sx={{
                  fontSize: "0.75rem",
                  fontFamily: brand.fonts.body,
                }}
              >
                Refresh Now
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Loading indicator */}
      {shouldShowLoadingIndicator && (
        <Alert
          severity="info"
          sx={{
            mt: 1,
            position: "relative",
            zIndex: 10,
            fontFamily: brand.fonts.body,
            animation: "fadeIn 0.3s ease-in-out",
            "@keyframes fadeIn": {
              from: { opacity: 0, transform: "translateY(-10px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontFamily: brand.fonts.body,
            }}
          >
            <CircularProgress
              size={16}
              thickness={3}
              sx={{ color: "primary.main" }}
            />
            Loading high-resolution video
            {currentVideoIsLipsync ? " (lipsync)" : ""}...
            {retryAttempts > 0 &&
              ` (Attempt ${retryAttempts + 1}/${MAX_RETRY_ATTEMPTS + 1})`}
          </Typography>
        </Alert>
      )}

      {/* Error indicator */}
      {loadError && (
        <Alert
          severity="warning"
          sx={{
            mt: 1,
            position: "relative",
            zIndex: 10,
            fontFamily: brand.fonts.body,
            animation: "fadeIn 0.3s ease-in-out",
            "@keyframes fadeIn": {
              from: { opacity: 0, transform: "translateY(-10px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
          action={
            retryAttempts < MAX_RETRY_ATTEMPTS ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  if (!mountedRef.current) return;
                  const videoUrl = getPreferredVideoUrl(
                    currentlyViewingVersion || videoData
                  );
                  if (videoUrl) {
                    setLoadError(null);
                    loadHighResVideo(videoUrl);
                  }
                }}
                disabled={isLoadingHighRes}
                sx={{ fontFamily: brand.fonts.body }}
              >
                Retry
              </Button>
            ) : undefined
          }
        >
          <Typography variant="body2" sx={{ fontFamily: brand.fonts.body }}>
            {loadError}
          </Typography>
        </Alert>
      )}

      {/* Error Alerts */}
      {versionsError && (
        <Alert
          severity="error"
          sx={{ mt: 2, fontFamily: brand.fonts.body }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                if (mountedRef.current) {
                  refetchVersions();
                }
              }}
              sx={{ fontFamily: brand.fonts.body }}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontFamily: brand.fonts.body }}>
            Failed to load versions: {versionsError.message}
          </Typography>
        </Alert>
      )}

      {historyError && (
        <Alert severity="error" sx={{ mt: 2, fontFamily: brand.fonts.body }}>
          <Typography variant="body2" sx={{ fontFamily: brand.fonts.body }}>
            Failed to load history: {historyError.message}
          </Typography>
        </Alert>
      )}

      {statusError && (
        <Alert severity="warning" sx={{ mt: 2, fontFamily: brand.fonts.body }}>
          <Typography variant="body2" sx={{ fontFamily: brand.fonts.body }}>
            Failed to load status: {statusError.message}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
