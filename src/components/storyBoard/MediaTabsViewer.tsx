// MediaTabsViewer.tsx - Ported to Next.js 15 with React 19 optimizations
"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  startTransition,
} from "react";
import {
  Box,
  Tabs,
  Tab,
  Badge,
  Alert,
  Snackbar,
  Typography,
} from "@mui/material";
import {
  Image as ImageIcon,
  Videocam as VideoIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import { Shot, MediaViewMode } from "@/types/storyBoard/types";
import { ShotImageViewer } from "@/components/imageEditor/ShotImageViewer";
import { ShotVideoEditor } from "@/components/videoEditor/ShotVideoEditor";
import {
  PromptEditor,
  type PromptType,
} from "@/components/common/PromptEditor";
import { useVideoVersions } from "@/hooks/useVideoEditor";
import logger from "@/utils/logger";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Props for MediaTabsViewer component
 */
interface MediaTabsViewerProps {
  shot: Shot;
  sceneId: number;
  scriptId?: string;
  versionId?: string;
  onDataRefresh?: () => void;
  onShotUpdate?: (updatedShot: Shot) => void;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";
  isVideoGenerated?: boolean;
}

/**
 * Media load state interface
 */
interface MediaLoadState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
}

// ==========================================
// CONSTANTS
// ==========================================

const DEFAULT_HEIGHT = 600;
const MIN_HEIGHT_PORTRAIT = 400;
const MIN_HEIGHT_LANDSCAPE = 350;
const CONTROLS_HEIGHT = 120;
const VIEWPORT_HEIGHT_PORTRAIT = 0.85;
const VIEWPORT_HEIGHT_LANDSCAPE = 0.75;
const RESIZE_DEBOUNCE_MS = 150;
const REFRESH_DELAY_MS = 1000;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate optimal height based on aspect ratio and container width
 */
const calculateOptimalHeight = (
  containerWidth: number,
  aspectRatio: "16:9" | "9:16" | "1:1" | "auto",
  isPortraitMode: boolean
): number => {
  if (!containerWidth) return DEFAULT_HEIGHT;

  let calculatedHeight: number;

  switch (aspectRatio) {
    case "16:9":
      calculatedHeight = (containerWidth * 9) / 16;
      break;
    case "9:16":
      calculatedHeight = (containerWidth * 16) / 9;
      break;
    case "1:1":
      calculatedHeight = containerWidth;
      break;
    case "auto":
    default:
      calculatedHeight = (containerWidth * 9) / 16;
      break;
  }

  const totalHeight = calculatedHeight + CONTROLS_HEIGHT;

  if (isPortraitMode) {
    const minHeight = Math.max(MIN_HEIGHT_PORTRAIT, containerWidth * 0.8);
    const maxHeight = window.innerHeight * VIEWPORT_HEIGHT_PORTRAIT;
    return Math.min(Math.max(totalHeight, minHeight), maxHeight);
  } else {
    const minHeight = MIN_HEIGHT_LANDSCAPE;
    const maxHeight = window.innerHeight * VIEWPORT_HEIGHT_LANDSCAPE;
    return Math.min(Math.max(totalHeight, minHeight), maxHeight);
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * MediaTabsViewer Component
 *
 * Provides tabbed interface for viewing shot images, videos, and prompts.
 * Features:
 * - Automatic height calculation based on aspect ratio
 * - Responsive layout with ResizeObserver
 * - Video version refetching integration
 * - Error handling and loading states
 * - Theme-aware styling
 *
 * @component
 */
export function MediaTabsViewer({
  shot,
  sceneId,
  scriptId,
  versionId,
  onDataRefresh,
  onShotUpdate,
  aspectRatio = "16:9",
  isVideoGenerated = false,
}: MediaTabsViewerProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  // ==========================================
  // STATE
  // ==========================================
  const [viewMode, setViewMode] = useState<MediaViewMode>("image");
  const [containerHeight, setContainerHeight] =
    useState<number>(DEFAULT_HEIGHT);
  const [error, setError] = useState<string>("");
  const [localShot, setLocalShot] = useState<Shot>(shot);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const [mediaLoadState, setMediaLoadState] = useState<MediaLoadState>({
    isLoading: false,
    hasError: false,
  });

  // ==========================================
  // REFS
  // ==========================================
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ==========================================
  // MEMOIZED VALUES
  // ==========================================

  // React 19: useMemo for hook parameters
  const hookParams = useMemo(
    () => ({
      scriptId: scriptId || "",
      versionId: versionId || "",
      sceneId,
      shotId: shot.shotId,
    }),
    [scriptId, versionId, sceneId, shot.shotId]
  );

  // React 19: useMemo for computed values
  const hasVideo = useMemo(
    () => Boolean(localShot?.videoSignedUrl),
    [localShot?.videoSignedUrl]
  );
  const hasImage = useMemo(
    () => Boolean(localShot?.signedUrl || localShot?.thumbnailPath),
    [localShot?.signedUrl, localShot?.thumbnailPath]
  );
  const hasImagePrompt = useMemo(
    () => Boolean(localShot?.imagePrompt),
    [localShot?.imagePrompt]
  );
  const hasVideoPrompt = useMemo(
    () => Boolean(localShot?.videoPrompt),
    [localShot?.videoPrompt]
  );
  const isVideoCompleted = useMemo(
    () => localShot?.videoStatus === "Completed",
    [localShot?.videoStatus]
  );
  const isPortraitMode = useMemo(() => aspectRatio === "9:16", [aspectRatio]);

  const showImagePromptEditor = useMemo(
    () => !hasImage && hasImagePrompt,
    [hasImage, hasImagePrompt]
  );
  const showVideoPromptEditor = useMemo(
    () => !hasVideo && hasVideoPrompt,
    [hasVideo, hasVideoPrompt]
  );

  // ==========================================
  // HOOKS
  // ==========================================

  const { refetch: refetchVersions } = useVideoVersions(
    hookParams,
    !!(scriptId && versionId && isVideoGenerated)
  );

  // ==========================================
  // CALLBACKS
  // ==========================================

  // React 19: useCallback for versions refetch wrapper
  const handleRefetchVersions = useCallback(async () => {
    if (!scriptId || !versionId) {
      logger.warn("Cannot refetch versions - missing scriptId or versionId");
      return null;
    }

    try {
      logger.info("MediaTabsViewer: Refetching versions via hook");
      const result = await refetchVersions();
      logger.info("MediaTabsViewer: Versions refetch completed", result);
      return result;
    } catch (error) {
      logger.error("MediaTabsViewer: Versions refetch failed", error);
      throw error;
    }
  }, [refetchVersions, scriptId, versionId]);

  // React 19: useCallback for height calculation
  const calculateHeightSafely = useCallback(() => {
    if (!isComponentMounted || !containerRef.current) return;

    try {
      const containerWidth = containerRef.current.offsetWidth;
      if (containerWidth <= 0) return;

      const optimalHeight = calculateOptimalHeight(
        containerWidth,
        aspectRatio,
        isPortraitMode
      );

      setContainerHeight(optimalHeight);
      logger.debug("MediaTabsViewer: Height calculated", {
        containerWidth,
        aspectRatio,
        optimalHeight,
      });
    } catch (error) {
      logger.error("Error calculating container height", error);
      setContainerHeight(
        isPortraitMode ? DEFAULT_HEIGHT : MIN_HEIGHT_LANDSCAPE
      );
    }
  }, [aspectRatio, isPortraitMode, isComponentMounted]);

  // React 19: useCallback for debounced height calculation
  const debouncedCalculateHeight = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      calculateHeightSafely();
    }, RESIZE_DEBOUNCE_MS);
  }, [calculateHeightSafely]);

  // React 19: useCallback for tab change handler
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: MediaViewMode) => {
      if (!isComponentMounted) return;

      logger.info("MediaTabsViewer: Switching to tab", newValue);

      startTransition(() => {
        setViewMode(newValue);
        setMediaLoadState({
          isLoading: false,
          hasError: false,
        });
      });
    },
    [isComponentMounted]
  );

  // React 19: useCallback for prompt update handler
  const handlePromptUpdate = useCallback(
    (newPrompt: string, type: PromptType) => {
      if (!isComponentMounted || !localShot) return;

      try {
        const updatedShot = {
          ...localShot,
          [type === "image" ? "imagePrompt" : "videoPrompt"]: newPrompt,
        };

        setLocalShot(updatedShot);
        onShotUpdate?.(updatedShot);

        if (onDataRefresh) {
          setTimeout(() => {
            if (isComponentMounted) {
              onDataRefresh();
            }
          }, REFRESH_DELAY_MS);
        }
      } catch (error) {
        logger.error("Error updating prompt", error);
        setError("Failed to update prompt. Please try again.");
      }
    },
    [isComponentMounted, localShot, onShotUpdate, onDataRefresh]
  );

  // React 19: useCallback for error handler
  const handleError = useCallback(
    (errorMessage: string) => {
      if (!isComponentMounted) return;

      logger.error("MediaTabsViewer error", errorMessage);
      setError(errorMessage);
      setMediaLoadState((prev) => ({
        ...prev,
        hasError: true,
        errorMessage,
      }));
    },
    [isComponentMounted]
  );

  // React 19: useCallback for close error
  const handleCloseError = useCallback(() => {
    if (!isComponentMounted) return;

    startTransition(() => {
      setError("");
      setMediaLoadState((prev) => ({
        ...prev,
        hasError: false,
        errorMessage: undefined,
      }));
    });
  }, [isComponentMounted]);

  // React 19: useCallback for shot update handler
  const handleShotUpdate = useCallback(
    (updatedShot: Shot) => {
      if (!isComponentMounted) return;

      try {
        setLocalShot(updatedShot);
        onShotUpdate?.(updatedShot);

        if (error) {
          setError("");
        }
        if (mediaLoadState.hasError) {
          setMediaLoadState({
            isLoading: false,
            hasError: false,
          });
        }
      } catch (error) {
        logger.error("Error in shot update handler", error);
        handleError("Failed to update shot data");
      }
    },
    [
      isComponentMounted,
      onShotUpdate,
      error,
      mediaLoadState.hasError,
      handleError,
    ]
  );

  // React 19: useCallback for image loading change
  const handleImageLoadingChange = useCallback(
    (isLoading: boolean) => {
      if (!isComponentMounted) return;

      setMediaLoadState((prev) => ({
        ...prev,
        isLoading,
      }));
    },
    [isComponentMounted]
  );

  // React 19: useCallback for video loading change
  const handleVideoLoadingChange = useCallback(
    (isLoading: boolean) => {
      if (!isComponentMounted) return;

      setMediaLoadState((prev) => ({
        ...prev,
        isLoading,
      }));
    },
    [isComponentMounted]
  );

  // ==========================================
  // EFFECTS
  // ==========================================

  // Component mount/unmount tracking
  useEffect(() => {
    setIsComponentMounted(true);
    return () => {
      setIsComponentMounted(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Update local shot when prop changes
  useEffect(() => {
    if (!isComponentMounted) return;

    if (shot && typeof shot === "object") {
      logger.debug("MediaTabsViewer: Updating local shot", {
        shotId: shot.shotId,
        hasImage: !!shot.signedUrl,
        hasVideo: !!shot.videoSignedUrl,
        imageStatus: shot.imageStatus,
        videoStatus: shot.videoStatus,
      });

      setLocalShot(shot);
      setMediaLoadState({
        isLoading: false,
        hasError: false,
      });

      if (error) {
        setError("");
      }
    } else {
      logger.warn("MediaTabsViewer: Invalid shot data received", shot);
      setMediaLoadState({
        isLoading: false,
        hasError: true,
        errorMessage: "Invalid shot data received",
      });
    }
  }, [shot, isComponentMounted, error]);

  // Height calculation with proper cleanup
  useEffect(() => {
    if (!isComponentMounted) return;

    calculateHeightSafely();

    const handleResize = () => {
      debouncedCalculateHeight();
    };

    window.addEventListener("resize", handleResize);

    if (containerRef.current && "ResizeObserver" in window) {
      try {
        resizeObserverRef.current = new ResizeObserver((entries) => {
          if (!isComponentMounted) return;

          for (const entry of entries) {
            const { width } = entry.contentRect;
            if (width > 0) {
              debouncedCalculateHeight();
            }
          }
        });

        resizeObserverRef.current.observe(containerRef.current);
      } catch (error) {
        logger.warn("ResizeObserver not supported or failed", error);
      }
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    aspectRatio,
    isPortraitMode,
    calculateHeightSafely,
    debouncedCalculateHeight,
    isComponentMounted,
  ]);

  // ==========================================
  // RENDER
  // ==========================================

  // Render fallback for invalid data
  if (!localShot || !isComponentMounted) {
    return (
      <Box
        sx={{
          height: containerHeight,
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
          {!isComponentMounted ? "Loading..." : "No shot data available"}
        </Typography>
      </Box>
    );
  }

  // If video is not generated globally, show image viewer/prompt editor only
  if (!isVideoGenerated) {
    return (
      <Box
        ref={containerRef}
        className="media-container"
        sx={{
          height: `${containerHeight}px`,
          width: "100%",
          minHeight: isPortraitMode
            ? MIN_HEIGHT_PORTRAIT
            : MIN_HEIGHT_LANDSCAPE,
          position: "relative",
          overflow: "visible",
          isolation: "isolate",
          contain: "layout style",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          borderRadius: 0,
        }}
      >
        {/* Error Snackbar */}
        <Snackbar
          open={Boolean(error)}
          autoHideDuration={6000}
          onClose={handleCloseError}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseError}
            severity="error"
            sx={{ width: "100%" }}
          >
            {error}
          </Alert>
        </Snackbar>

        {/* Error State Alert */}
        {mediaLoadState.hasError && mediaLoadState.errorMessage && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            {mediaLoadState.errorMessage}
          </Alert>
        )}

        {/* Image Viewer or Prompt Editor */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {hasImage ? (
            <ShotImageViewer
              shot={localShot}
              sceneId={sceneId}
              scriptId={scriptId}
              versionId={versionId}
              onDataRefresh={onDataRefresh}
              onShotUpdate={handleShotUpdate}
              type="shots"
              aspectRatio={aspectRatio}
              onLoadingChange={handleImageLoadingChange}
              onError={handleError}
            />
          ) : showImagePromptEditor ? (
            <PromptEditor
              type="image"
              prompt={localShot.imagePrompt ?? null}
              originalPrompt={localShot.originalImagePrompt}
              sceneId={sceneId}
              shotId={localShot.shotId}
              scriptId={scriptId!}
              versionId={versionId!}
              onPromptUpdate={handlePromptUpdate}
              onError={handleError}
              disabled={!scriptId || !versionId}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                bgcolor: "background.paper",
                borderRadius: `${brand.borderRadius}px`,
                border: 2,
                borderColor: "divider",
                borderStyle: "dashed",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                No image or prompt available
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // Full tabbed interface when video is generated
  return (
    <Box
      ref={containerRef}
      className="media-container"
      sx={{
        height: `${containerHeight}px`,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: isPortraitMode ? MIN_HEIGHT_PORTRAIT : MIN_HEIGHT_LANDSCAPE,
        position: "relative",
        overflow: "visible",
        isolation: "isolate",
        contain: "layout style",
        borderRadius: 0,
      }}
    >
      {/* Error Snackbar */}
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Error State Alert */}
      {mediaLoadState.hasError &&
        mediaLoadState.errorMessage &&
        (viewMode === "image" || viewMode === "video") && (
          <Alert
            severity="warning"
            sx={{
              position: "absolute",
              top: 50,
              left: 8,
              right: 8,
              zIndex: 100,
            }}
          >
            {mediaLoadState.errorMessage}
          </Alert>
        )}

      {/* Tabs Header */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          flexShrink: 0,
        }}
      >
        <Tabs
          value={viewMode}
          onChange={handleTabChange}
          aria-label="media view tabs"
          variant="fullWidth"
          sx={{
            minHeight: 40,
            "& .MuiTab-root": {
              minHeight: 40,
              textTransform: "none",
              fontSize: "0.875rem",
              fontFamily: brand.fonts.body,
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "primary.main",
            },
          }}
        >
          <Tab
            value="image"
            icon={
              <Badge
                variant="dot"
                color={
                  hasImage
                    ? "success"
                    : showImagePromptEditor
                      ? "primary"
                      : undefined
                }
                invisible={!hasImage && !showImagePromptEditor}
              >
                <ImageIcon
                  sx={{
                    color:
                      viewMode === "image" ? "primary.main" : "text.secondary",
                  }}
                />
              </Badge>
            }
            iconPosition="start"
            label={
              hasImage
                ? "Image"
                : showImagePromptEditor
                  ? "Image Prompt"
                  : "No Image"
            }
            sx={{
              "& .MuiTab-iconWrapper": {
                marginRight: 0.5,
                marginBottom: "0 !important",
              },
            }}
          />
          <Tab
            value="video"
            icon={
              <Badge
                variant="dot"
                color={
                  hasVideo
                    ? "success"
                    : showVideoPromptEditor
                      ? "primary"
                      : undefined
                }
                invisible={!hasVideo && !showVideoPromptEditor}
              >
                <VideoIcon
                  sx={{
                    color:
                      viewMode === "video" ? "primary.main" : "text.secondary",
                  }}
                />
              </Badge>
            }
            iconPosition="start"
            label={
              hasVideo
                ? "Video"
                : showVideoPromptEditor
                  ? "Video Prompt"
                  : "No Video"
            }
            disabled={!hasVideo && !showVideoPromptEditor}
            sx={{
              "& .MuiTab-iconWrapper": {
                marginRight: 0.5,
                marginBottom: "0 !important",
              },
            }}
          />
        </Tabs>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          height: "calc(100% - 40px)",
          position: "relative",
          overflow: "visible",
          p: 1,
        }}
      >
        {viewMode === "image" && (
          <Box sx={{ height: "100%", width: "100%" }}>
            {hasImage ? (
              <ShotImageViewer
                shot={localShot}
                sceneId={sceneId}
                scriptId={scriptId}
                versionId={versionId}
                onDataRefresh={onDataRefresh}
                onShotUpdate={handleShotUpdate}
                type="shots"
                aspectRatio={aspectRatio}
                onLoadingChange={handleImageLoadingChange}
                onError={handleError}
              />
            ) : showImagePromptEditor ? (
              <PromptEditor
                type="image"
                prompt={localShot.imagePrompt ?? null}
                originalPrompt={localShot.originalImagePrompt}
                sceneId={sceneId}
                shotId={localShot.shotId}
                scriptId={scriptId!}
                versionId={versionId!}
                onPromptUpdate={handlePromptUpdate}
                onError={handleError}
                disabled={!scriptId || !versionId}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  bgcolor: "background.paper",
                  borderRadius: `${brand.borderRadius}px`,
                  border: 2,
                  borderColor: "primary.main",
                  borderStyle: "dashed",
                  p: 4,
                  textAlign: "center",
                }}
              >
                <ImageIcon
                  sx={{
                    fontSize: 48,
                    color: "primary.light",
                    mb: 2,
                  }}
                />
                <Typography
                  variant="h6"
                  color="text.secondary"
                  gutterBottom
                  sx={{ fontFamily: brand.fonts.heading }}
                >
                  No Image Available
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Image will appear here once generated
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {viewMode === "video" && (
          <Box sx={{ height: "100%", width: "100%" }}>
            {hasVideo ? (
              <ShotVideoEditor
                shot={localShot}
                sceneId={sceneId}
                scriptId={scriptId}
                versionId={versionId}
                onDataRefresh={onDataRefresh}
                onShotUpdate={handleShotUpdate}
                aspectRatio={aspectRatio}
                onLoadingChange={handleVideoLoadingChange}
                onError={handleError}
                onRefetchVersions={handleRefetchVersions}
              />
            ) : showVideoPromptEditor ? (
              <PromptEditor
                type="video"
                prompt={localShot.videoPrompt ?? null}
                originalPrompt={localShot.originalVideoPrompt}
                sceneId={sceneId}
                shotId={localShot.shotId}
                scriptId={scriptId!}
                versionId={versionId!}
                onPromptUpdate={handlePromptUpdate}
                onError={handleError}
                disabled={!scriptId || !versionId}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  bgcolor: "background.paper",
                  borderRadius: `${brand.borderRadius}px`,
                  border: 2,
                  borderColor: "divider",
                  borderStyle: "dashed",
                  p: 4,
                  textAlign: "center",
                }}
              >
                <VideoIcon
                  sx={{
                    fontSize: 48,
                    color: "text.disabled",
                    mb: 2,
                  }}
                />
                <Typography
                  variant="h6"
                  color="text.secondary"
                  gutterBottom
                  sx={{ fontFamily: brand.fonts.heading }}
                >
                  No Video Available
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {localShot.videoStatus === "InProgress" ||
                  localShot.videoStatus === "Processing"
                    ? "Video is being processed..."
                    : "Video will appear here once generated"}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
