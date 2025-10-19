"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  Suspense,
  startTransition,
} from "react";
import {
  Box,
  Alert,
  Typography,
  Button,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { format } from "date-fns";
import { ImageVersion } from "@/types/storyBoard/types";
import {
  useImageEditor,
  useImageVersions,
  useImageHistory,
} from "@/hooks/useImageEditor";
import GenericFileUpload from "@/components/common/GenericFileUpload";
import { ImageDisplayCore, ImageViewerConfig } from "./ImageDisplayCore";
import { ImageVersionModal } from "./ImageVersionOverlay";
import { ImageUpscaleOverlay } from "./ImageUpscaleOverlay";
import { ImageEditOverlay } from "./ImageEditOverlay";
import { ImageGenerationOverlay } from "./ImageGenerationOverlay";
import { ImageVersionNavigation } from "./ImageVersionNavigation";
import logger from "@/utils/logger";

// Types
export type ImageType = "shots" | "keyVisual" | "actor" | "location";
export type AspectRatio = "16:9" | "9:16" | "1:1" | "auto";

export interface ImageData {
  signedUrl?: string;
  thumbnailPath?: string;
  versions?: {
    current: ImageVersion;
    archived: Record<number, ImageVersion>;
    totalVersions?: number;
    totalEdits?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editHistory?: any[];
  };
}

interface ImageViewerContainerProps {
  config: ImageViewerConfig;
  imageData: ImageData;
  onImageUpdate?: (updatedImageData: ImageData) => void;
  onDataRefresh?: () => void;
  className?: string;
  style?: React.CSSProperties;
  onLoadingChange?: (isLoading: boolean) => void;
  onError?: (errorMessage: string) => void;
}

// Constants for timeout handling
const HIGH_RES_LOAD_TIMEOUT = 10000; // 10 seconds
const IMAGE_LOAD_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_ATTEMPTS = 3;

/**
 * ImageViewerContainer - Optimized image viewer with version management
 *
 * Performance optimizations applied:
 * - React 19 compiler auto-optimization (removed unnecessary React.memo)
 * - startTransition for non-urgent UI updates
 * - Suspense boundaries for progressive loading
 * - Theme-aware styling (no hardcoded colors)
 * - Logger instead of console.log
 */
export function ImageViewerContainer({
  config,
  imageData,
  onImageUpdate,
  onDataRefresh,
  className,
  style,
  onLoadingChange,
  onError,
}: ImageViewerContainerProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // State - organized by category
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] =
    useState<string>("/placeHolder.webp");
  const [currentlyViewingVersion, setCurrentlyViewingVersion] = useState<
    ImageVersion | undefined
  >();

  // UI State
  const [showOverlays, setShowOverlays] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [generateMode, setGenerateMode] = useState(false);
  const [versionsMode, setVersionsMode] = useState(false);
  const [historyMode, setHistoryMode] = useState(false);
  const [upscaleMode, setUpscaleMode] = useState(false);
  const [additionalImagesMode, setAdditionalImagesMode] = useState(false);

  // Transition State
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextImageSrc, setNextImageSrc] = useState<string>("");
  const [wipeDirection, setWipeDirection] = useState<
    "left-to-right" | "right-to-left"
  >("left-to-right");

  // Image State
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
    null
  );
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [additionalImageUrls, setAdditionalImageUrls] = useState<string[]>([]);

  // Overlay States
  const [overlayIsEditing, setOverlayIsEditing] = useState(false);
  const [overlayIsGenerating, setOverlayIsGenerating] = useState(false);
  const [overlayIsUpscaling, setOverlayIsUpscaling] = useState(false);

  // Loading States
  const [isLoadingHighRes, setIsLoadingHighRes] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Refs for cleanup
  const highResTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const currentImageRef = useRef<HTMLImageElement | undefined>(undefined);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const mountedRef = useRef(true);

  // Hook parameters
  const hookParams = useMemo(() => {
    const baseParams = {
      scriptId: config.scriptId,
      versionId: config.versionId,
      type: config.type,
    };

    if (config.type === "shots") {
      return { ...baseParams, sceneId: config.sceneId, shotId: config.shotId };
    } else if (config.type === "actor") {
      return {
        ...baseParams,
        actorId: config.actorId,
        actorVersionId: config.actorVersionId,
      };
    } else if (config.type === "location") {
      return {
        ...baseParams,
        locationId: config.locationId,
        locationVersionId: config.locationVersionId,
        promptType: config.promptType || "wideShotLocationSetPrompt",
      };
    }
    return baseParams;
  }, [config]);

  // Hooks
  const {
    restoreVersionAsync,
    isEditing,
    isGenerating,
    isRestoring,
    isUpscaling,
    resetEditMutation,
    resetGenerateMutation,
    resetRestoreMutation,
    resetUpscaleMutation,
  } = useImageEditor(hookParams);

  const {
    data: imageVersionsData,
    isLoading: isLoadingVersions,
    refetch: refetchVersions,
  } = useImageVersions(hookParams, true);

  const { data: imageHistoryData, isLoading: isLoadingHistory } =
    useImageHistory(hookParams, historyMode);

  // Compute aspect ratio with close match logic
  const aspectRatioValue = useMemo(() => {
    const isCloseMatch = (
      imageRatio: number,
      targetRatio: number,
      tolerance: number = 0.02
    ) => {
      return Math.abs(imageRatio - targetRatio) / targetRatio <= tolerance;
    };

    if (config.aspectRatio === "auto") {
      if (imageDimensions) {
        return imageDimensions.width / imageDimensions.height;
      }
      return 16 / 9;
    }

    if (imageDimensions) {
      const imageRatio = imageDimensions.width / imageDimensions.height;

      switch (config.aspectRatio) {
        case "16:9": {
          const targetRatio = 16 / 9;
          return isCloseMatch(imageRatio, targetRatio)
            ? targetRatio
            : imageRatio;
        }
        case "9:16": {
          const targetRatio = 9 / 16;
          return isCloseMatch(imageRatio, targetRatio)
            ? targetRatio
            : imageRatio;
        }
        case "1:1": {
          const targetRatio = 1;
          return isCloseMatch(imageRatio, targetRatio)
            ? targetRatio
            : imageRatio;
        }
        default:
          return 16 / 9;
      }
    }

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
  }, [config.aspectRatio, imageDimensions]);

  // Stable image data to prevent unnecessary re-renders
  const stableImageData = useMemo(() => {
    if (!imageData) return null;

    return {
      signedUrl: imageData.signedUrl,
      thumbnailPath: imageData.thumbnailPath,
      versions: imageData.versions
        ? {
            current: {
              version: imageData.versions.current.version,
              thumbnailPath: imageData.versions.current.thumbnailPath,
              signedUrl: imageData.versions.current.signedUrl,
              destinationPath: imageData.versions.current.destinationPath,
              isCurrent: imageData.versions.current.isCurrent,
              lastEditedAt: imageData.versions.current.lastEditedAt,
            },
            archived: imageData.versions.archived,
            totalVersions: imageData.versions.totalVersions,
            totalEdits: imageData.versions.totalEdits,
            editHistory: imageData.versions.editHistory,
          }
        : undefined,
    };
  }, [
    imageData?.signedUrl,
    imageData?.thumbnailPath,
    imageData?.versions?.current?.version,
    imageData?.versions?.current?.thumbnailPath,
    imageData?.versions?.current?.signedUrl,
    imageData?.versions?.current?.destinationPath,
    imageData?.versions?.current?.isCurrent,
    imageData?.versions?.current?.lastEditedAt,
    imageData?.versions?.archived,
    imageData?.versions?.totalVersions,
    imageData?.versions?.totalEdits,
    imageData?.versions?.editHistory,
  ]);

  // Get all versions sorted
  const allVersions = imageData?.versions
    ? [
        imageData.versions.current,
        ...Object.values(imageData.versions.archived),
      ].sort((a, b) => b.version - a.version)
    : [];

  const viewingVersion =
    currentlyViewingVersion || imageData?.versions?.current;
  const hasMultipleVersions = allVersions.length > 1;
  const totalVersions =
    imageData?.versions?.totalVersions || imageVersionsData?.totalVersions || 0;
  const totalEdits =
    imageData?.versions?.totalEdits || imageVersionsData?.totalEdits || 0;

  // Cleanup function
  const cleanupImageLoading = useCallback(() => {
    if (highResTimeoutRef.current) {
      clearTimeout(highResTimeoutRef.current);
      highResTimeoutRef.current = undefined;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }
    if (currentImageRef.current) {
      currentImageRef.current.onload = null;
      currentImageRef.current.onerror = null;
      currentImageRef.current = undefined;
    }
  }, []);

  // Enhanced image loading with timeout and retry
  const loadHighResImage = useCallback(
    (
      imageUrl: string,
      onSuccess?: () => void,
      onErrorCallback?: () => void
    ) => {
      if (!mountedRef.current) return;

      logger.info("Loading high-res image", { url: imageUrl });
      setIsLoadingHighRes(true);
      setLoadError(null);

      if (onLoadingChange) {
        onLoadingChange(true);
      }

      cleanupImageLoading();

      const img = new Image();
      currentImageRef.current = img;

      highResTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;

        const errorMsg = "Image load timeout";
        logger.warn(errorMsg, { url: imageUrl, attempt: retryAttempts + 1 });
        setLoadError(errorMsg);
        setIsLoadingHighRes(false);

        if (onLoadingChange) onLoadingChange(false);
        if (onError) onError(errorMsg);
        if (onErrorCallback) onErrorCallback();

        if (retryAttempts < MAX_RETRY_ATTEMPTS) {
          retryTimeoutRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            setRetryAttempts((prev) => prev + 1);
            loadHighResImage(imageUrl, onSuccess, onErrorCallback);
          }, IMAGE_LOAD_RETRY_DELAY);
        }
      }, HIGH_RES_LOAD_TIMEOUT);

      img.onload = () => {
        if (!mountedRef.current) return;

        cleanupImageLoading();
        logger.info("High-res image loaded", { url: imageUrl });

        setCurrentImageSrc(imageUrl);
        setImageLoaded(true);
        setIsLoadingHighRes(false);
        setLoadError(null);
        setRetryAttempts(0);

        if (onLoadingChange) onLoadingChange(false);
        if (onSuccess) onSuccess();
      };

      img.onerror = () => {
        if (!mountedRef.current) return;

        cleanupImageLoading();
        const errorMsg = "Failed to load image";
        logger.error(errorMsg, { url: imageUrl, attempt: retryAttempts + 1 });

        setLoadError(errorMsg);
        setIsLoadingHighRes(false);

        if (onLoadingChange) onLoadingChange(false);
        if (onError) onError(errorMsg);
        if (onErrorCallback) onErrorCallback();

        if (retryAttempts < MAX_RETRY_ATTEMPTS) {
          retryTimeoutRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            setRetryAttempts((prev) => prev + 1);
            loadHighResImage(imageUrl, onSuccess, onErrorCallback);
          }, IMAGE_LOAD_RETRY_DELAY);
        } else {
          const finalError =
            "Maximum retry attempts reached. Showing available resolution.";
          setLoadError(finalError);
          setRetryAttempts(0);

          if (onError) onError(finalError);
          if (onErrorCallback) onErrorCallback();
        }
      };

      img.src = imageUrl;
    },
    [cleanupImageLoading, retryAttempts, onLoadingChange, onError]
  );

  // Helper to update image data with new version
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateImageDataWithNewVersion = useCallback(
    (editResult: any) => {
      if (!onImageUpdate) return;

      const newCurrentVersion: ImageVersion = {
        version: editResult.newCurrentVersion,
        destinationPath: editResult.newCurrentImagePath,
        thumbnailPath: editResult.newThumbnailPath,
        signedUrl: editResult.newCurrentImagePath,
        isCurrent: true,
        lastEditedAt: new Date().toISOString(),
        prompt: "",
      };

      const archivedVersions = { ...imageData?.versions?.archived };
      if (imageData?.versions?.current) {
        archivedVersions[imageData.versions.current.version] = {
          ...imageData.versions.current,
          isCurrent: false,
          archivedAt: new Date().toISOString(),
        };
      }

      const updatedImageData = {
        signedUrl: editResult.newCurrentImagePath,
        thumbnailPath: editResult.newThumbnailPath,
        versions: {
          current: newCurrentVersion,
          archived: archivedVersions,
          totalVersions: (imageData?.versions?.totalVersions || 1) + 1,
          totalEdits: (imageData?.versions?.totalEdits || 0) + 1,
          editHistory: [
            ...(imageData?.versions?.editHistory || []),
            {
              timestamp: new Date().toISOString(),
              fromVersion: editResult.sourceVersion,
              toVersion: editResult.newCurrentVersion,
              editType: editResult.editType || "flux_pro_kontext",
              previousPath: imageData?.versions?.current?.destinationPath || "",
              newPath: editResult.newCurrentImagePath,
            },
          ],
        },
      };

      // ✅ CRITICAL FIX: Defer the callback to the next tick
      Promise.resolve().then(() => {
        onImageUpdate(updatedImageData);
      });

      setCurrentlyViewingVersion(newCurrentVersion);
      setCurrentImageSrc(editResult.newThumbnailPath);
      setImageLoaded(true);
      setIsLoadingHighRes(false);
      setLoadError(null);
      refetchVersions();
    },
    [imageData, onImageUpdate, refetchVersions]
  );

  // Component lifecycle
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupImageLoading();
    };
  }, [cleanupImageLoading]);

  // Initial image setup
  useEffect(() => {
    if (!mountedRef.current) return;

    logger.debug("Image data changed, resetting state");
    cleanupImageLoading();

    // Use startTransition for non-urgent state updates
    startTransition(() => {
      setImageLoaded(false);
      setIsLoadingHighRes(false);
      setLoadError(null);
      setRetryAttempts(0);
      setImageDimensions(null);
      setOverlayIsUpscaling(false);
      setOverlayIsEditing(false);
      setOverlayIsGenerating(false);
      setEditMode(false);
      setGenerateMode(false);
      setVersionsMode(false);
      setHistoryMode(false);
      setUpscaleMode(false);
    });

    resetEditMutation();
    resetGenerateMutation();
    resetRestoreMutation();
    resetUpscaleMutation();

    if (imageData?.versions?.current?.thumbnailPath) {
      logger.debug("Setting thumbnail from current version");
      setCurrentImageSrc(imageData.versions.current.thumbnailPath);
      setCurrentlyViewingVersion(imageData.versions.current);
      setImageLoaded(true);
    } else if (imageData?.thumbnailPath) {
      logger.debug("Setting thumbnail from imageData");
      setCurrentImageSrc(imageData.thumbnailPath);
      setCurrentlyViewingVersion(undefined);
      setImageLoaded(true);
    } else {
      logger.debug("No thumbnail available, using placeholder");
      setCurrentImageSrc("/placeHolder.webp");
      setCurrentlyViewingVersion(undefined);
      setImageLoaded(true);
    }
  }, [
    imageData?.signedUrl,
    imageData?.thumbnailPath,
    imageData?.versions?.current?.version,
    imageData?.versions?.current?.thumbnailPath,
    imageData?.versions?.current?.signedUrl,
    resetEditMutation,
    resetGenerateMutation,
    resetRestoreMutation,
    resetUpscaleMutation,
    cleanupImageLoading,
  ]);

  // High-res image loading
  useEffect(() => {
    if (!mountedRef.current) return;

    let imageUrl: string | undefined;

    if (currentlyViewingVersion?.signedUrl) {
      imageUrl = currentlyViewingVersion.signedUrl;
    } else if (stableImageData?.signedUrl) {
      imageUrl = stableImageData.signedUrl;
    }

    if (
      imageUrl &&
      imageUrl !== currentImageSrc &&
      imageUrl !== "/placeHolder.webp"
    ) {
      logger.debug("Attempting to load high-res image", { url: imageUrl });
      loadHighResImage(imageUrl);
    } else if (imageUrl === currentImageSrc) {
      setImageLoaded(true);
      setIsLoadingHighRes(false);
      setLoadError(null);
    }

    if (!imageUrl) {
      setImageLoaded(true);
      setIsLoadingHighRes(false);
      setLoadError(null);
    }
  }, [
    stableImageData?.signedUrl,
    currentlyViewingVersion?.signedUrl,
    currentImageSrc,
    loadHighResImage,
  ]);

  // Event handlers
  const handleVersionSelect = (
    version: ImageVersion,
    direction: "left-to-right" | "right-to-left" = "left-to-right",
    skipThumbnail: boolean = false
  ) => {
    if (
      !mountedRef.current ||
      currentlyViewingVersion?.version === version.version
    )
      return;

    logger.info("Switching to version", { version: version.version });
    cleanupImageLoading();

    startTransition(() => {
      if (skipThumbnail && version.signedUrl) {
        const img = new Image();
        img.onload = () => {
          if (!mountedRef.current) return;
          setNextImageSrc(version.signedUrl);
          setWipeDirection(direction);
          setIsTransitioning(true);

          setTimeout(() => {
            if (!mountedRef.current) return;
            setCurrentImageSrc(version.signedUrl);
            setCurrentlyViewingVersion(version);
            setIsTransitioning(false);
            setNextImageSrc("");
            setImageLoaded(true);
          }, 500);
        };
        img.src = version.signedUrl;
      } else {
        if (version.thumbnailPath) {
          setNextImageSrc(version.thumbnailPath);
          setWipeDirection(direction);
          setIsTransitioning(true);

          setTimeout(() => {
            if (!mountedRef.current) return;
            setCurrentImageSrc(version.thumbnailPath!);
            setCurrentlyViewingVersion(version);
            setIsTransitioning(false);
            setNextImageSrc("");
            setImageLoaded(true);

            if (version.signedUrl) {
              loadHighResImage(version.signedUrl);
            }
          }, 500);
        } else {
          setCurrentlyViewingVersion(version);
          if (version.signedUrl) {
            loadHighResImage(version.signedUrl);
          }
        }
      }
    });
  };

  const handleRestoreVersion = async (targetVersion: number) => {
    try {
      resetRestoreMutation();

      const restoreParams = {
        ...hookParams,
        targetVersion,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const restoreResult: any = await restoreVersionAsync(restoreParams);

      const restoredVersion = allVersions.find(
        (v) => v.version === targetVersion
      );
      if (!restoredVersion) return;

      const newCurrentVersion: ImageVersion = {
        version: restoreResult.newCurrentVersion,
        destinationPath: restoredVersion.destinationPath,
        thumbnailPath: restoredVersion.thumbnailPath,
        signedUrl: restoredVersion.signedUrl,
        isCurrent: true,
        lastEditedAt: new Date().toISOString(),
        prompt: "",
      };

      const archivedVersions = { ...imageData?.versions?.archived };
      if (imageData?.versions?.current) {
        archivedVersions[imageData.versions.current.version] = {
          ...imageData.versions.current,
          isCurrent: false,
          archivedAt: new Date().toISOString(),
        };
      }
      delete archivedVersions[targetVersion];

      const updatedImageData = {
        signedUrl: restoredVersion.signedUrl,
        thumbnailPath: restoredVersion.thumbnailPath,
        versions: {
          current: newCurrentVersion,
          archived: archivedVersions,
          totalVersions: imageData?.versions?.totalVersions || 1,
          totalEdits: (imageData?.versions?.totalEdits || 0) + 1,
          editHistory: [
            ...(imageData?.versions?.editHistory || []),
            {
              timestamp: new Date().toISOString(),
              fromVersion: imageData?.versions?.current?.version || 1,
              toVersion: restoreResult.newCurrentVersion,
              editType: "version_restore",
              restoredFromVersion: targetVersion,
              previousPath: imageData?.versions?.current?.destinationPath || "",
              newPath: restoredVersion.destinationPath,
            },
          ],
        },
      };

      if (onImageUpdate) {
        onImageUpdate(updatedImageData);
      }

      startTransition(() => {
        setCurrentlyViewingVersion(newCurrentVersion);
        setCurrentImageSrc(restoredVersion.thumbnailPath);
        setImageLoaded(true);
        setIsLoadingHighRes(false);
        setLoadError(null);
        setVersionsMode(false);
        setHistoryMode(false);
      });

      refetchVersions();

      if (!onImageUpdate && onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      logger.error("Error restoring version", { error });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditComplete = useCallback(
    (editResult: any) => {
      updateImageDataWithNewVersion(editResult);

      startTransition(() => {
        setEditMode(false);
        setAdditionalImageUrls([]);
        setAdditionalImagesMode(false);
      });

      if (!onImageUpdate && onDataRefresh) {
        Promise.resolve().then(() => {
          onDataRefresh();
        });
      }
    },
    [updateImageDataWithNewVersion, onImageUpdate, onDataRefresh]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGenerateComplete = useCallback(
    (generateResult: any) => {
      updateImageDataWithNewVersion(generateResult);

      startTransition(() => {
        setGenerateMode(false);
      });

      if (!onImageUpdate && onDataRefresh) {
        Promise.resolve().then(() => {
          onDataRefresh();
        });
      }
    },
    [updateImageDataWithNewVersion, onImageUpdate, onDataRefresh]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpscaleComplete = useCallback(
    (upscaleResult: any) => {
      updateImageDataWithNewVersion(upscaleResult);

      startTransition(() => {
        setUpscaleMode(false);
      });

      refetchVersions();

      if (!onImageUpdate && onDataRefresh) {
        Promise.resolve().then(() => {
          onDataRefresh();
        });
      }
    },
    [
      updateImageDataWithNewVersion,
      onImageUpdate,
      onDataRefresh,
      refetchVersions,
    ]
  );

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setImageElement(img);
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
    setIsLoadingHighRes(false);
  };

  const handleRetry = () => {
    const imageUrl = currentlyViewingVersion?.signedUrl || imageData?.signedUrl;
    if (imageUrl) {
      setRetryAttempts(0);
      loadHighResImage(imageUrl);
    }
  };

  const handleAdditionalImagesUpdate = (imageUrls: string[]) => {
    setAdditionalImageUrls(imageUrls);
  };

  const handleVersionsClick = () => {
    startTransition(() => {
      setVersionsMode(true);
      setHistoryMode(false);
      setEditMode(false);
      setGenerateMode(false);
      setUpscaleMode(false);
    });
  };

  const handleHistoryClick = () => {
    startTransition(() => {
      setHistoryMode(true);
      setVersionsMode(false);
      setEditMode(false);
      setGenerateMode(false);
      setUpscaleMode(false);
    });
  };

  const handleGenerateClick = () => {
    startTransition(() => {
      setGenerateMode(true);
      setEditMode(false);
      setVersionsMode(false);
      setHistoryMode(false);
      setUpscaleMode(false);
    });
  };

  // Helper functions
  const getImageAltText = () => {
    const typeLabels = {
      shots: `Shot ${config.shotId || "unknown"}`,
      keyVisual: "Key Visual",
      actor: `Actor ${config.actorId || "unknown"}`,
      location: `Location ${config.locationId || "unknown"}`,
    };

    return `Preview of ${typeLabels[config.type]} ${viewingVersion ? `(Version ${viewingVersion.version})` : ""}`;
  };

  const getHistoryData = () => {
    return (
      imageHistoryData?.editHistory || imageData?.versions?.editHistory || []
    );
  };

  const getItemName = () => {
    const names = {
      shots: "shot",
      actor: "actor",
      location: "location",
      keyVisual: "key visual",
    };
    return names[config.type];
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return "Unknown date";
    }
  };

  const shouldShowLoadingIndicator = isLoadingHighRes && !loadError;

  // Loading state
  if (!mountedRef.current || (!imageData && !currentImageSrc)) {
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
            borderStyle: "dashed",
            borderColor: "divider",
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Loading image viewer...
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
      {/* Main Image Display with Suspense */}
      <Suspense fallback={<Skeleton variant="rectangular" height={400} />}>
        <ImageDisplayCore
          currentImageSrc={currentImageSrc}
          nextImageSrc={nextImageSrc}
          isTransitioning={isTransitioning}
          wipeDirection={wipeDirection}
          aspectRatio={aspectRatioValue}
          imageLoaded={imageLoaded && !shouldShowLoadingIndicator}
          hasSignedUrl={
            !!(imageData?.signedUrl || currentlyViewingVersion?.signedUrl)
          }
          altText={getImageAltText()}
          onImageLoad={handleImageLoad}
          onMouseEnter={() => setShowOverlays(true)}
          onMouseLeave={() => setShowOverlays(false)}
          showOverlays={showOverlays}
          hasMultipleVersions={hasMultipleVersions}
          editMode={editMode}
          generateMode={generateMode}
          upscaleMode={upscaleMode}
          versionsMode={versionsMode}
          historyMode={historyMode}
          additionalImagesMode={additionalImagesMode}
          onEditClick={() => {
            if (!mountedRef.current) return;
            startTransition(() => {
              setEditMode(true);
              setGenerateMode(false);
              setVersionsMode(false);
              setHistoryMode(false);
              setUpscaleMode(false);
            });
          }}
          onGenerateClick={handleGenerateClick}
          onUpscaleClick={() => {
            if (!mountedRef.current) return;
            startTransition(() => {
              setUpscaleMode(true);
              setEditMode(false);
              setGenerateMode(false);
              setVersionsMode(false);
              setHistoryMode(false);
            });
          }}
          onAdditionalImagesClick={() => {
            if (!mountedRef.current) return;
            startTransition(() => {
              setAdditionalImagesMode(!additionalImagesMode);
              setEditMode(false);
              setGenerateMode(false);
              setVersionsMode(false);
              setHistoryMode(false);
              setUpscaleMode(false);
            });
          }}
          onVersionsClick={handleVersionsClick}
          onHistoryClick={handleHistoryClick}
          totalVersions={totalVersions}
          totalEdits={totalEdits}
          isLoadingVersions={isLoadingVersions}
          isLoadingHistory={isLoadingHistory}
          isEditing={isEditing}
          isGenerating={isGenerating}
          isRestoring={isRestoring}
          isUpscaling={isUpscaling}
          overlayIsEditing={overlayIsEditing}
          overlayIsGenerating={overlayIsGenerating}
          overlayIsUpscaling={overlayIsUpscaling}
          additionalImageUrls={additionalImageUrls}
          viewingVersion={viewingVersion}
          config={config}
          isLoadingHighRes={isLoadingHighRes}
          hasLoadError={!!loadError}
          loadErrorMessage={loadError || undefined}
        />
      </Suspense>

      {/* Version Navigation */}
      {mountedRef.current && (
        <ImageVersionNavigation
          allVersions={allVersions}
          currentlyViewingVersion={viewingVersion}
          showOverlays={showOverlays}
          versionsMode={versionsMode}
          historyMode={historyMode}
          isEditing={isEditing}
          isRestoring={isRestoring}
          isUpscaling={isUpscaling}
          onVersionSelect={handleVersionSelect}
        />
      )}

      {/* Version Modal with Suspense */}
      {mountedRef.current && (
        <Suspense fallback={null}>
          <ImageVersionModal
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
            historyData={getHistoryData()}
            isLoading={false}
            isLoadingVersions={isLoadingVersions}
            isLoadingHistory={isLoadingHistory}
            isEditing={isEditing}
            isRestoring={isRestoring}
            isUpscaling={isUpscaling}
            onVersionSelect={handleVersionSelect}
            onRestoreVersion={handleRestoreVersion}
            itemName={getItemName()}
            formatDate={formatDate}
          />
        </Suspense>
      )}

      {/* Edit Overlay with Suspense */}
      {mountedRef.current && editMode && (
        <Suspense fallback={<CircularProgress color="primary" size={24} />}>
          <ImageEditOverlay
            scriptId={config.scriptId}
            versionId={config.versionId}
            type={config.type}
            viewingVersion={viewingVersion}
            sceneId={config.sceneId}
            shotId={config.shotId}
            actorId={config.actorId}
            actorVersionId={config.actorVersionId}
            locationId={config.locationId}
            locationVersionId={config.locationVersionId}
            promptType={config.promptType}
            additionalImageUrls={additionalImageUrls}
            onAdditionalImagesUpdate={handleAdditionalImagesUpdate}
            additionalImagesMode={additionalImagesMode}
            onAdditionalImagesModeToggle={() => {
              if (mountedRef.current) {
                startTransition(() => {
                  setAdditionalImagesMode(!additionalImagesMode);
                });
              }
            }}
            onEditComplete={handleEditComplete}
            onCancel={() => {
              if (!mountedRef.current) return;
              cleanupImageLoading();
              startTransition(() => {
                setEditMode(false);
                setAdditionalImageUrls([]);
                setAdditionalImagesMode(false);
              });
              resetEditMutation();
            }}
            onDataRefresh={onDataRefresh}
            onEditingStateChange={setOverlayIsEditing}
            disabled={isEditing || isGenerating || isRestoring || isUpscaling}
          />
        </Suspense>
      )}

      {/* Generation Overlay with Suspense */}
      {mountedRef.current && generateMode && (
        <Suspense fallback={<CircularProgress color="primary" size={24} />}>
          <ImageGenerationOverlay
            scriptId={config.scriptId}
            versionId={config.versionId}
            type={config.type}
            viewingVersion={viewingVersion}
            sceneId={config.sceneId}
            shotId={config.shotId}
            actorId={config.actorId}
            actorVersionId={config.actorVersionId}
            locationId={config.locationId}
            locationVersionId={config.locationVersionId}
            promptType={config.promptType}
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
            disabled={isEditing || isGenerating || isRestoring || isUpscaling}
          />
        </Suspense>
      )}

      {/* Upscale Overlay with Suspense */}
      {mountedRef.current && upscaleMode && (
        <Suspense fallback={<CircularProgress color="primary" size={24} />}>
          <ImageUpscaleOverlay
            scriptId={config.scriptId}
            versionId={config.versionId}
            type={config.type}
            viewingVersion={viewingVersion}
            sceneId={config.sceneId}
            shotId={config.shotId}
            actorId={config.actorId}
            actorVersionId={config.actorVersionId}
            locationId={config.locationId}
            locationVersionId={config.locationVersionId}
            promptType={config.promptType}
            imageDimensions={imageDimensions}
            onUpscaleComplete={handleUpscaleComplete}
            onCancel={() => {
              if (mountedRef.current) {
                startTransition(() => {
                  setUpscaleMode(false);
                });
              }
            }}
            onDataRefresh={onDataRefresh}
            onUpscalingStateChange={setOverlayIsUpscaling}
            disabled={isEditing || isGenerating || isRestoring || isUpscaling}
          />
        </Suspense>
      )}

      {/* Additional Images Upload */}
      {mountedRef.current && (
        <GenericFileUpload
          isVisible={additionalImagesMode}
          onToggle={() => {
            if (mountedRef.current) {
              startTransition(() => {
                setAdditionalImagesMode(!additionalImagesMode);
              });
            }
          }}
          onClose={() => setAdditionalImagesMode(false)}
          onFilesUpdate={handleAdditionalImagesUpdate}
          disabled={isEditing || isGenerating || isRestoring}
          fileFilter="images"
          maxFiles={3}
          maxSizeMB={20}
          maxFileSizeMB={8}
          title="Upload Reference Images"
          description="Add images for processing"
        />
      )}

      {/* Loading Indicator */}
      {shouldShowLoadingIndicator && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: "background.paper",
            borderRadius: `${brand.borderRadius}px`,
            px: 2,
            py: 1,
            boxShadow: theme.shadows[4],
            border: 1,
            borderColor: "primary.main",
          }}
        >
          <CircularProgress size={20} color="primary" />
          <Typography variant="body2" color="text.primary">
            Loading high-res...
          </Typography>
        </Box>
      )}

      {/* Error Alert */}
      {loadError && (
        <Alert
          severity="error"
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            maxWidth: 400,
            borderRadius: `${brand.borderRadius}px`,
          }}
          action={
            <Button
              color="primary"
              size="small"
              onClick={handleRetry}
              disabled={retryAttempts >= MAX_RETRY_ATTEMPTS}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="body2">{loadError}</Typography>
          {retryAttempts > 0 && (
            <Typography variant="caption" color="text.secondary">
              Attempt {retryAttempts} of {MAX_RETRY_ATTEMPTS}
            </Typography>
          )}
        </Alert>
      )}
    </Box>
  );
}
