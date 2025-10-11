"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Box, Alert, Typography, Button } from "@mui/material";
import { format } from "date-fns";
import { ImageVersion } from "@/types/storyBoard/types";
import {
  useImageEditor,
  useImageVersions,
  useImageHistory,
} from "../../hooks/useImageEditor";
import AdditionalImagesUpload from "@/components/common/AdditionalImagesUpload";
import { ImageDisplayCore, ImageViewerConfig } from "./ImageDisplayCore";
import { ImageVersionModal } from "./ImageVersionOverlay";
import { ImageUpscaleOverlay } from "./ImageUpscaleOverlay";
import { ImageEditOverlay } from "./ImageEditOverlay";
import { ImageGenerationOverlay } from "./ImageGenerationOverlay"; // NEW: Import the generation overlay
import { ImageVersionNavigation } from "./ImageVersionNavigation";

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
  // Enhanced callback support
  onLoadingChange?: (isLoading: boolean) => void;
  onError?: (errorMessage: string) => void;
}

// Constants for timeout handling
const HIGH_RES_LOAD_TIMEOUT = 10000; // 10 seconds
const IMAGE_LOAD_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_ATTEMPTS = 3;

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
  // State
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] =
    useState<string>("/placeHolder.webp");
  const [currentlyViewingVersion, setCurrentlyViewingVersion] = useState<
    ImageVersion | undefined
  >();
  const [showOverlays, setShowOverlays] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [generateMode, setGenerateMode] = useState(false); // NEW: Generate mode state
  const [versionsMode, setVersionsMode] = useState(false);
  const [historyMode, setHistoryMode] = useState(false);
  const [upscaleMode, setUpscaleMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextImageSrc, setNextImageSrc] = useState<string>("");
  const [additionalImagesMode, setAdditionalImagesMode] = useState(false);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
    null
  );
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [overlayIsEditing, setOverlayIsEditing] = useState(false);
  const [overlayIsGenerating, setOverlayIsGenerating] = useState(false); // NEW: Overlay generating state
  const [overlayIsUpscaling, setOverlayIsUpscaling] = useState(false);
  const [additionalImageUrls, setAdditionalImageUrls] = useState<string[]>([]);
  const [wipeDirection, setWipeDirection] = useState<
    "left-to-right" | "right-to-left"
  >("left-to-right");

  // Enhanced loading state management
  const [isLoadingHighRes, setIsLoadingHighRes] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Refs for cleanup and timeout handling
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
    } else {
      return baseParams;
    }
  }, [config]);

  // Hooks
  const {
    editImageAsync,
    restoreVersionAsync,
    generateImageAsync, // NEW: Include generate function
    isEditing,
    isGenerating, // NEW: Include generating state
    isRestoring,
    isUpscaling,
    error: imageEditorError,
    resetEditMutation,
    resetGenerateMutation, // NEW: Include generate reset
    resetRestoreMutation,
    resetUpscaleMutation,
  } = useImageEditor();

  const {
    data: imageVersionsData,
    isLoading: isLoadingVersions,
    error: versionsError,
    refetch: refetchVersions,
  } = useImageVersions(hookParams, true);

  const {
    data: imageHistoryData,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useImageHistory(hookParams, historyMode);

  // Calculate aspect ratio
  const aspectRatioValue = useMemo(() => {
    // Helper function to check if image ratio closely matches a target ratio
    const isCloseMatch = (
      imageRatio: number,
      targetRatio: number,
      tolerance: number = 0.02
    ) => {
      return Math.abs(imageRatio - targetRatio) / targetRatio <= tolerance;
    };

    // If explicitly set to auto, always use image dimensions
    if (config.aspectRatio === "auto") {
      if (imageDimensions) {
        return imageDimensions.width / imageDimensions.height;
      }
      return 16 / 9; // default fallback
    }

    // If we have image dimensions, check for close matches
    if (imageDimensions) {
      const imageRatio = imageDimensions.width / imageDimensions.height;

      switch (config.aspectRatio) {
        case "16:9": {
          const targetRatio = 16 / 9;
          // If image is close to 16:9 (within 2%), use exact 16:9
          // Otherwise use auto (image's natural ratio)
          return isCloseMatch(imageRatio, targetRatio)
            ? targetRatio
            : imageRatio;
        }
        case "9:16": {
          const targetRatio = 9 / 16;
          // If image is close to 9:16 (within 2%), use exact 9:16
          // Otherwise use auto (image's natural ratio)
          return isCloseMatch(imageRatio, targetRatio)
            ? targetRatio
            : imageRatio;
        }
        case "1:1": {
          const targetRatio = 1;
          // If image is close to 1:1 (within 2%), use exact 1:1
          // Otherwise use auto (image's natural ratio)
          return isCloseMatch(imageRatio, targetRatio)
            ? targetRatio
            : imageRatio;
        }
        default:
          return 16 / 9;
      }
    }

    // Fallback to exact ratios if no image dimensions available yet
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

  // Get all versions sorted by version number (descending)
  const allVersions = imageData?.versions
    ? [
        imageData.versions.current,
        ...Object.values(imageData.versions.archived),
      ].sort((a, b) => b.version - a.version)
    : [];

  const viewingVersion =
    currentlyViewingVersion || imageData?.versions?.current;

  // Enhanced cleanup function
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

  // Enhanced image loading with timeout and retry logic
  const loadHighResImage = useCallback(
    (
      imageUrl: string,
      onSuccess?: () => void,
      onErrorCallback?: () => void
    ) => {
      if (!mountedRef.current) return;

      // Clean up any existing loading
      cleanupImageLoading();

      console.log("🖼️ Starting high-res image load:", imageUrl);
      setIsLoadingHighRes(true);
      setLoadError(null);

      // Notify parent of loading state change
      if (onLoadingChange) {
        onLoadingChange(true);
      }

      const img = new Image();
      currentImageRef.current = img;

      // Set up timeout
      highResTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        console.warn("⏰ High-res image load timeout for:", imageUrl);

        img.onload = null;
        img.onerror = null;

        setIsLoadingHighRes(false);
        setImageLoaded(true); // Consider current image as loaded
        const timeoutError =
          "High-resolution image load timed out. Showing available resolution.";
        setLoadError(timeoutError);

        // Notify parent of loading state and error
        if (onLoadingChange) {
          onLoadingChange(false);
        }
        if (onError) {
          onError(timeoutError);
        }

        if (onErrorCallback) onErrorCallback();
      }, HIGH_RES_LOAD_TIMEOUT);

      img.onload = () => {
        if (!mountedRef.current) return;
        console.log("✅ High-res image loaded successfully:", imageUrl);

        cleanupImageLoading();
        setCurrentImageSrc(imageUrl);
        setImageLoaded(true);
        setIsLoadingHighRes(false);
        setRetryAttempts(0);

        // Notify parent of successful load
        if (onLoadingChange) {
          onLoadingChange(false);
        }

        if (onSuccess) onSuccess();
      };

      img.onerror = (error) => {
        if (!mountedRef.current) return;
        console.error("❌ High-res image load error:", imageUrl, error);

        cleanupImageLoading();
        setIsLoadingHighRes(false);

        // Notify parent of loading state change
        if (onLoadingChange) {
          onLoadingChange(false);
        }

        // Retry logic
        if (retryAttempts < MAX_RETRY_ATTEMPTS) {
          const newAttempts = retryAttempts + 1;
          setRetryAttempts(newAttempts);
          const retryError = `Retrying image load (${newAttempts}/${MAX_RETRY_ATTEMPTS})...`;
          setLoadError(retryError);

          // Notify parent of retry error
          if (onError) {
            onError(retryError);
          }

          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              loadHighResImage(imageUrl, onSuccess, onErrorCallback);
            }
          }, IMAGE_LOAD_RETRY_DELAY);
        } else {
          setImageLoaded(true); // Consider current image as loaded even if high-res failed
          const finalError =
            "Failed to load high-resolution image. Showing available resolution.";
          setLoadError(finalError);
          setRetryAttempts(0);

          // Notify parent of final error
          if (onError) {
            onError(finalError);
          }

          if (onErrorCallback) onErrorCallback();
        }
      };

      // Start loading
      img.src = imageUrl;
    },
    [cleanupImageLoading, retryAttempts, onLoadingChange, onError]
  );

  // Helper functions
  const getImageAltText = () => {
    const typeLabels = {
      shots: `Shot ${config.shotId || "unknown"}`,
      keyVisual: "Key Visual",
      actor: `Actor ${config.actorId || "unknown"}`,
      location: `Location ${config.locationId || "unknown"}`,
    };

    return `Preview of ${typeLabels[config.type]} ${
      viewingVersion ? `(Version ${viewingVersion.version})` : ""
    }`;
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

  // Component unmount cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupImageLoading();
    };
  }, [cleanupImageLoading]);

  // ENHANCED: Initial image setup with proper cleanup
  useEffect(() => {
    if (!mountedRef.current) return;

    console.log("🔄 ImageViewerContainer: imageData changed, resetting state");

    // Clean up any existing loading
    cleanupImageLoading();

    // Reset all state
    setImageLoaded(false);
    setIsLoadingHighRes(false);
    setLoadError(null);
    setRetryAttempts(0);
    setImageDimensions(null);
    setOverlayIsUpscaling(false);
    setOverlayIsEditing(false);
    setOverlayIsGenerating(false); // NEW: Reset generating state
    setEditMode(false);
    setGenerateMode(false); // NEW: Reset generate mode
    setVersionsMode(false);
    setHistoryMode(false);
    setUpscaleMode(false);

    resetEditMutation();
    resetGenerateMutation(); // NEW: Reset generate mutation
    resetRestoreMutation();
    resetUpscaleMutation();

    // Set initial thumbnail
    if (imageData?.versions?.current?.thumbnailPath) {
      console.log("📸 Setting thumbnail from current version");
      setCurrentImageSrc(imageData.versions.current.thumbnailPath);
      setCurrentlyViewingVersion(imageData.versions.current);
      setImageLoaded(true); // Thumbnail is considered loaded
    } else if (imageData?.thumbnailPath) {
      console.log("📸 Setting thumbnail from imageData");
      setCurrentImageSrc(imageData.thumbnailPath);
      setCurrentlyViewingVersion(undefined);
      setImageLoaded(true); // Thumbnail is considered loaded
    } else {
      console.log("📸 No thumbnail available, using placeholder");
      setCurrentImageSrc("/placeHolder.webp");
      setCurrentlyViewingVersion(undefined);
      setImageLoaded(true); // Placeholder is considered loaded
    }
  }, [
    // Use specific values instead of the entire imageData object
    imageData?.signedUrl,
    imageData?.thumbnailPath,
    imageData?.versions?.current?.version,
    imageData?.versions?.current?.thumbnailPath,
    imageData?.versions?.current?.signedUrl,
    resetEditMutation,
    resetGenerateMutation, // NEW: Include in dependencies
    resetRestoreMutation,
    resetUpscaleMutation,
    cleanupImageLoading,
  ]);

  // ENHANCED: High-resolution image loading with robust error handling
  useEffect(() => {
    if (!mountedRef.current) return;

    let imageUrl: string | undefined;

    if (currentlyViewingVersion?.signedUrl) {
      imageUrl = currentlyViewingVersion.signedUrl;
    } else if (stableImageData?.signedUrl) {
      imageUrl = stableImageData.signedUrl;
    }

    // Only attempt high-res loading if we have a different URL than current
    if (
      imageUrl &&
      imageUrl !== currentImageSrc &&
      imageUrl !== "/placeHolder.webp"
    ) {
      console.log("🚀 Attempting to load high-res image:", imageUrl);
      loadHighResImage(imageUrl);
    } else if (imageUrl === currentImageSrc) {
      // URL matches current src, consider it loaded
      setImageLoaded(true);
      setIsLoadingHighRes(false);
      setLoadError(null);
    }

    // If no high-res URL available, just mark as loaded
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
    if (!mountedRef.current) return;
    if (currentlyViewingVersion?.version === version.version) return;

    console.log(`🔄 Switching to version ${version.version}`);

    // Clean up any existing loading
    cleanupImageLoading();

    if (skipThumbnail && version.signedUrl) {
      const img = new Image();
      img.onload = () => {
        if (!mountedRef.current) return;
        setNextImageSrc(version.signedUrl);
        setWipeDirection(direction);
        setIsTransitioning(true);

        setTimeout(() => {
          if (!mountedRef.current) return;
          setCurrentlyViewingVersion(version);
          setCurrentImageSrc(version.signedUrl);
          setImageLoaded(true);
          setIsTransitioning(false);
          setNextImageSrc("");
          setIsLoadingHighRes(false);
          setLoadError(null);
        }, 800);
      };
      img.onerror = () => {
        if (!mountedRef.current) return;
        console.warn(
          "⚠️ High-res version load failed, falling back to thumbnail"
        );
        handleVersionSelect(version, direction, false);
      };
      img.src = version.signedUrl;
      return;
    }

    if (version.thumbnailPath) {
      const img = new Image();
      img.onload = () => {
        if (!mountedRef.current) return;
        setNextImageSrc(version.thumbnailPath);
        setWipeDirection(direction);
        setIsTransitioning(true);

        setTimeout(() => {
          if (!mountedRef.current) return;
          setCurrentlyViewingVersion(version);
          setCurrentImageSrc(version.thumbnailPath);
          setImageLoaded(true);
          setIsTransitioning(false);
          setNextImageSrc("");
          setIsLoadingHighRes(false);
          setLoadError(null);

          // Load high-res if available and different from thumbnail
          if (
            version.signedUrl &&
            version.signedUrl !== version.thumbnailPath
          ) {
            loadHighResImage(version.signedUrl);
          }
        }, 800);
      };
      img.onerror = () => {
        if (!mountedRef.current) return;
        console.error("❌ Thumbnail load failed for version", version.version);
        setImageLoaded(true); // Still mark as loaded to prevent infinite loading
      };
      img.src = version.thumbnailPath;
    }
  };

  const updateImageDataWithNewVersion = (editResult: any) => {
    if (!onImageUpdate || !editResult) return;

    const newCurrentVersion: ImageVersion = {
      version: editResult.newCurrentVersion,
      destinationPath: editResult.newCurrentImagePath,
      thumbnailPath: editResult.newThumbnailPath,
      signedUrl: editResult.newCurrentImagePath,
      isCurrent: true,
      lastEditedAt: new Date().toISOString(),
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
            editType: editResult.editType || "flux_pro_kontext", // NEW: Support different edit types
            previousPath: imageData?.versions?.current?.destinationPath || "",
            newPath: editResult.newCurrentImagePath,
          },
        ],
      },
    };

    onImageUpdate(updatedImageData);
    setCurrentlyViewingVersion(newCurrentVersion);
    setCurrentImageSrc(editResult.newThumbnailPath);
    setImageLoaded(true); // Thumbnail is loaded
    setIsLoadingHighRes(false);
    setLoadError(null);
    refetchVersions();
  };

  const handleEditComplete = (editResult: any) => {
    updateImageDataWithNewVersion(editResult);
    setEditMode(false);
    setAdditionalImageUrls([]);
    setAdditionalImagesMode(false);

    if (!onImageUpdate && onDataRefresh) {
      onDataRefresh();
    }
  };

  // NEW: Handle generation complete
  const handleGenerateComplete = (generateResult: any) => {
    updateImageDataWithNewVersion(generateResult);
    setGenerateMode(false);

    if (!onImageUpdate && onDataRefresh) {
      onDataRefresh();
    }
  };

  const handleRestoreVersion = async (targetVersion: number) => {
    try {
      resetRestoreMutation();

      const restoreParams: any = {
        ...hookParams,
        targetVersion,
      };

      const restoreResult = await restoreVersionAsync(restoreParams);

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
      setCurrentlyViewingVersion(newCurrentVersion);
      setCurrentImageSrc(restoredVersion.thumbnailPath);
      setImageLoaded(true); // Thumbnail is loaded
      setIsLoadingHighRes(false);
      setLoadError(null);
      refetchVersions();

      if (!onImageUpdate && onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error("Error restoring version:", error);
    }
  };

  const handleUpscaleComplete = (upscaleResult: any) => {
    updateImageDataWithNewVersion(upscaleResult);
    setUpscaleMode(false);
    refetchVersions();

    if (!onImageUpdate && onDataRefresh) {
      onDataRefresh();
    }
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setImageElement(img);
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setImageLoaded(true);
    setIsLoadingHighRes(false); // Clear loading state when image loads in UI
    setLoadError(null);
  };

  const handleAdditionalImagesUpdate = (imageUrls: string[]) => {
    setAdditionalImageUrls(imageUrls);
  };

  const handleVersionsClick = () => {
    setVersionsMode(true);
    setHistoryMode(false);
    setEditMode(false);
    setGenerateMode(false); // NEW: Close generate mode
    setUpscaleMode(false);
  };

  const handleHistoryClick = () => {
    setHistoryMode(true);
    setVersionsMode(false);
    setEditMode(false);
    setGenerateMode(false); // NEW: Close generate mode
    setUpscaleMode(false);
  };

  // NEW: Handle generate button click
  const handleGenerateClick = () => {
    setGenerateMode(true);
    setEditMode(false);
    setVersionsMode(false);
    setHistoryMode(false);
    setUpscaleMode(false);
  };

  // Derived values
  const hasMultipleVersions = allVersions.length > 1;
  const totalVersions =
    imageData?.versions?.totalVersions || imageVersionsData?.totalVersions || 0;
  const totalEdits =
    imageData?.versions?.totalEdits || imageVersionsData?.totalEdits || 0;
  const historyData = getHistoryData();

  // Show loading state only when actually loading high-res and no error
  const shouldShowLoadingIndicator = isLoadingHighRes && !loadError;

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
            bgcolor: "grey.50",
            borderRadius: 1,
            border: "2px dashed",
            borderColor: "grey.300",
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
        isolation: "isolate", // Prevent z-index issues
        ...style,
      }}
    >
      {/* Main Image Display */}
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
        // Control states
        editMode={editMode}
        generateMode={generateMode} // NEW: Pass generate mode
        upscaleMode={upscaleMode}
        versionsMode={versionsMode}
        historyMode={historyMode}
        additionalImagesMode={additionalImagesMode}
        // Action handlers
        onEditClick={() => {
          if (!mountedRef.current) return;
          setEditMode(true);
          setGenerateMode(false); // NEW: Close other modes
          setVersionsMode(false);
          setHistoryMode(false);
          setUpscaleMode(false);
        }}
        onGenerateClick={handleGenerateClick} // NEW: Pass generate handler
        onUpscaleClick={() => {
          if (!mountedRef.current) return;
          setUpscaleMode(true);
          setEditMode(false);
          setGenerateMode(false); // NEW: Close other modes
          setVersionsMode(false);
          setHistoryMode(false);
        }}
        onAdditionalImagesClick={() => {
          if (!mountedRef.current) return;
          setAdditionalImagesMode(!additionalImagesMode);
          setEditMode(false);
          setGenerateMode(false); // NEW: Close other modes
          setVersionsMode(false);
          setHistoryMode(false);
          setUpscaleMode(false);
        }}
        onVersionsClick={handleVersionsClick}
        onHistoryClick={handleHistoryClick}
        totalVersions={totalVersions}
        totalEdits={totalEdits}
        isLoadingVersions={isLoadingVersions}
        isLoadingHistory={isLoadingHistory}
        // State flags
        isEditing={isEditing}
        isGenerating={isGenerating} // NEW: Pass generating state
        isRestoring={isRestoring}
        isUpscaling={isUpscaling}
        overlayIsEditing={overlayIsEditing}
        overlayIsGenerating={overlayIsGenerating} // NEW: Pass overlay generating state
        overlayIsUpscaling={overlayIsUpscaling}
        additionalImageUrls={additionalImageUrls}
        viewingVersion={viewingVersion}
        config={config}
        // Enhanced loading states for better feedback
        isLoadingHighRes={isLoadingHighRes}
        hasLoadError={!!loadError}
        loadErrorMessage={loadError}
      />

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

      {/* Version Modal with safe guards */}
      {mountedRef.current && (
        <ImageVersionModal
          open={versionsMode || historyMode}
          onClose={() => {
            if (mountedRef.current) {
              setVersionsMode(false);
              setHistoryMode(false);
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
          isEditing={isEditing}
          isRestoring={isRestoring}
          isUpscaling={isUpscaling}
          onVersionSelect={handleVersionSelect}
          onRestoreVersion={handleRestoreVersion}
          itemName={getItemName()}
          formatDate={formatDate}
        />
      )}

      {/* Edit Overlay with mount checking */}
      {mountedRef.current && editMode && (
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
              setAdditionalImagesMode(!additionalImagesMode);
            }
          }}
          onEditComplete={handleEditComplete}
          onCancel={() => {
            if (!mountedRef.current) return;
            cleanupImageLoading();
            setEditMode(false);
            setAdditionalImageUrls([]);
            setAdditionalImagesMode(false);
            resetEditMutation();
          }}
          onDataRefresh={onDataRefresh}
          onEditingStateChange={setOverlayIsEditing}
          disabled={isEditing || isGenerating || isRestoring || isUpscaling} // NEW: Include isGenerating
        />
      )}

      {/* NEW: Generation Overlay with mount checking */}
      {mountedRef.current && generateMode && (
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
              setGenerateMode(false);
            }
          }}
          onDataRefresh={onDataRefresh}
          onGeneratingStateChange={setOverlayIsGenerating}
          disabled={isEditing || isGenerating || isRestoring || isUpscaling}
        />
      )}

      {/* Upscale Overlay with mount checking */}
      {mountedRef.current && upscaleMode && (
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
              setUpscaleMode(false);
            }
          }}
          onDataRefresh={onDataRefresh}
          onUpscalingStateChange={setOverlayIsUpscaling}
          disabled={isEditing || isGenerating || isRestoring || isUpscaling} // NEW: Include isGenerating
        />
      )}

      {/* Additional Images Upload with mount checking */}
      {mountedRef.current && (
        <AdditionalImagesUpload
          isVisible={additionalImagesMode}
          onToggle={() => {
            if (mountedRef.current) {
              setAdditionalImagesMode(!additionalImagesMode);
            }
          }}
          onImagesUpdate={handleAdditionalImagesUpdate}
          disabled={isEditing || isGenerating || isRestoring} // NEW: Include isGenerating
          maxImages={3}
          maxSizeMB={10}
        />
      )}

      {/* Enhanced loading and error indicators with better positioning */}
      {shouldShowLoadingIndicator && (
        <Alert
          severity="info"
          sx={{
            mt: 1,
            position: "relative",
            zIndex: 10,
            animation: "fadeIn 0.3s ease-in-out",
            "@keyframes fadeIn": {
              from: { opacity: 0, transform: "translateY(-10px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                border: "2px solid rgba(25, 118, 210, 0.3)",
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
            Loading high-resolution image...
            {retryAttempts > 0 &&
              ` (Attempt ${retryAttempts + 1}/${MAX_RETRY_ATTEMPTS + 1})`}
          </Typography>
        </Alert>
      )}

      {loadError && (
        <Alert
          severity="warning"
          sx={{
            mt: 1,
            position: "relative",
            zIndex: 10,
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
                  const imageUrl =
                    currentlyViewingVersion?.signedUrl || imageData?.signedUrl;
                  if (imageUrl) {
                    setLoadError(null);
                    loadHighResImage(imageUrl);
                  }
                }}
                disabled={isLoadingHighRes}
              >
                Retry
              </Button>
            ) : undefined
          }
        >
          <Typography variant="body2">{loadError}</Typography>
        </Alert>
      )}

      {/* Info Alerts with better conditional rendering */}
      {mountedRef.current &&
        hasMultipleVersions &&
        !versionsMode &&
        !historyMode &&
        !editMode &&
        !generateMode && // NEW: Include generateMode in condition
        !shouldShowLoadingIndicator && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              This {getItemName()} has {totalVersions} version
              {totalVersions !== 1 ? "s" : ""}
              {totalEdits > 0 &&
                ` with ${totalEdits} edit${totalEdits !== 1 ? "s" : ""}`}
              . Hover over the image to access version controls, generate new
              variations, or add reference images for enhanced editing.
            </Typography>
          </Alert>
        )}

      {mountedRef.current &&
        additionalImageUrls.length > 0 &&
        !editMode &&
        !generateMode && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              {additionalImageUrls.length} additional image
              {additionalImageUrls.length !== 1 ? "s" : ""} ready for
              multi-image editing. Click the edit button to create a combined
              edit with enhanced AI capabilities.
            </Typography>
          </Alert>
        )}

      {/* Error Alerts with better error handling */}
      {versionsError && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                if (mountedRef.current) {
                  refetchVersions();
                }
              }}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="body2">
            Failed to load versions: {versionsError.message}
          </Typography>
        </Alert>
      )}

      {historyError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Failed to load history: {historyError.message}
          </Typography>
        </Alert>
      )}

      {/* Development debug info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <Box
          sx={{
            mt: 1,
            p: 1,
            bgcolor: "grey.100",
            borderRadius: 1,
            fontSize: "0.75rem",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Debug: Mounted={mountedRef.current ? "true" : "false"}, Loading=
            {isLoadingHighRes ? "true" : "false"}, Loaded=
            {imageLoaded ? "true" : "false"}, Error=
            {loadError ? "true" : "false"}, Retries={retryAttempts}, Generating=
            {isGenerating ? "true" : "false"}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
