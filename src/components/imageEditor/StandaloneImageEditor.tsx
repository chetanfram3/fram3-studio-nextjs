// src/components/imageEditor/StandaloneImageEditor.tsx
"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  Suspense,
} from "react";
import {
  Box,
  Paper,
  Typography,
  Skeleton,
  IconButton,
  Tooltip,
  Collapse,
  Stack,
  Badge,
  Chip,
  alpha,
} from "@mui/material";
import {
  Edit as EditIcon,
  AutoAwesome as GenerateIcon,
  ZoomIn as UpscaleIcon,
  Layers as LayersIcon,
  History as HistoryIcon, // ADDED: History icon
  ExpandLess as CollapseUpIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { ImageViewerConfig } from "./ImageDisplayCore";
import { ImageEditOverlay } from "./ImageEditOverlay";
import { ImageGenerationOverlay } from "./ImageGenerationOverlay";
import { ImageUpscaleOverlay } from "./ImageUpscaleOverlay";
import { ImageVersion } from "@/types/storyBoard/types";
import { useImageEditor, useImageVersions } from "@/hooks/useImageEditor";
import logger from "@/utils/logger";
import { VersionThumbnailStrip } from "./VersionThumbnailStrip";
import { ImageEditorToolbar, type ToolbarButton } from "./ImageEditorToolbar";
import { EditHistoryTimeline } from "./EditHistoryTimeline"; // ADDED: Import EditHistoryTimeline

interface StandaloneImageEditorProps {
  config?: ImageViewerConfig;
  imageData?: {
    signedUrl?: string;
    thumbnailPath?: string;
    versions?: {
      current: ImageVersion;
      archived: Record<number, ImageVersion>;
      totalVersions?: number;
      totalEdits?: number;
      editHistory?: unknown[];
    };
  };
  onImageUpdate?: (updatedImageData: unknown) => void;
  onDataRefresh?: () => void;
  defaultMode?: "edit" | "generate" | "upscale" | "versions";
}

type EditorMode =
  | "edit"
  | "generate"
  | "upscale"
  | "versions"
  | "history"
  | null; // ADDED: "history" to EditorMode

/**
 * StandaloneImageEditor - Overlays displayed on top of image (like ImageViewerContainer)
 *
 * Features:
 * - Image takes maximum available space
 * - Bottom toolbar with icon buttons
 * - Edit/Generate/Upscale overlays appear ON TOP of the image (not in separate panel)
 * - Versions use collapsible film strip at bottom
 * - History timeline in collapsible panel // ADDED: History feature
 * - Clean toggle system matching ImageViewerContainer pattern
 */
export function StandaloneImageEditor({
  config,
  imageData,
  onImageUpdate,
  onDataRefresh,
  defaultMode = "generate",
}: StandaloneImageEditorProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // State
  const [currentImageSrc, setCurrentImageSrc] =
    useState<string>("/placeHolder.webp");
  const [currentlyViewingVersion, setCurrentlyViewingVersion] = useState<
    ImageVersion | undefined
  >();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeMode, setActiveMode] = useState<EditorMode>(() => {
    return config ? null : defaultMode;
  });
  const [additionalImageUrls, setAdditionalImageUrls] = useState<string[]>([]);
  const [additionalImagesMode, setAdditionalImagesMode] = useState(false);

  // Overlay states
  const [overlayIsEditing, setOverlayIsEditing] = useState(false);
  const [overlayIsGenerating, setOverlayIsGenerating] = useState(false);
  const [overlayIsUpscaling, setOverlayIsUpscaling] = useState(false);

  // Ref for high-res image loading
  const highResImageRef = useRef<HTMLImageElement | null>(null);
  // Track which URLs we've already loaded to prevent re-loading
  const loadedHighResUrls = useRef<Set<string>>(new Set());
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    // If config exists and we're showing the default mode overlay,
    // clear it (this shouldn't happen but acts as a safeguard)
    if (config && activeMode === defaultMode) {
      setActiveMode(null);
    }
  }, [config, activeMode, defaultMode]);

  // Hook parameters (only if config provided)
  const hookParams = useMemo(() => {
    if (!config) return null;

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

  // Hooks (conditional based on config)
  const {
    isEditing,
    isGenerating,
    isRestoring,
    isUpscaling,
    restoreVersionAsync,
    resetEditMutation,
    resetGenerateMutation,
    resetRestoreMutation,
    resetUpscaleMutation,
  } = useImageEditor(
    hookParams || { scriptId: "", versionId: "", type: "shots" }
  );

  const {
    data: imageVersionsData,
    isLoading: isLoadingVersions,
    refetch: refetchVersions,
  } = useImageVersions(
    hookParams || { scriptId: "", versionId: "", type: "shots" }
  );

  // Get all versions
  const allVersions = imageData?.versions
    ? [
        imageData.versions.current,
        ...Object.values(imageData.versions.archived),
      ].sort((a, b) => b.version - a.version)
    : [];

  const viewingVersion =
    currentlyViewingVersion || imageData?.versions?.current;
  const totalVersions =
    imageData?.versions?.totalVersions || imageVersionsData?.totalVersions || 0;

  // ADDED: Extract edit history data
  const totalEdits = imageData?.versions?.totalEdits || 0;
  const editHistory = (imageData?.versions?.editHistory || []) as any[];

  // Function to load high-res image in background
  const loadHighResImage = useCallback((imageUrl: string) => {
    // Don't reload if we've already loaded this URL
    if (!imageUrl || loadedHighResUrls.current.has(imageUrl)) {
      return;
    }

    // Cancel any pending image load
    if (highResImageRef.current) {
      highResImageRef.current.onload = null;
      highResImageRef.current.onerror = null;
      highResImageRef.current = null;
    }

    // Create new image loader
    const img = new Image();
    highResImageRef.current = img;

    img.onload = () => {
      if (highResImageRef.current === img) {
        logger.info("High-res image loaded successfully", { url: imageUrl });
        loadedHighResUrls.current.add(imageUrl);
        setCurrentImageSrc(imageUrl);
        highResImageRef.current = null;
      }
    };

    img.onerror = () => {
      if (highResImageRef.current === img) {
        logger.error("Failed to load high-res image, keeping thumbnail", {
          url: imageUrl,
        });
        highResImageRef.current = null;
      }
    };

    logger.debug("Loading high-res image", { url: imageUrl });
    img.src = imageUrl;
  }, []);

  // Initialize image with progressive loading
  useEffect(() => {
    if (imageData?.versions?.current) {
      const thumbnailUrl = imageData.versions.current.thumbnailPath;
      const highResUrl = imageData.versions.current.signedUrl;

      // Show thumbnail immediately
      if (thumbnailUrl) {
        setCurrentImageSrc(thumbnailUrl);
        setCurrentlyViewingVersion(imageData.versions.current);
        setImageLoaded(true);

        // Preload high-res in background
        if (highResUrl && highResUrl !== thumbnailUrl) {
          loadHighResImage(highResUrl);
        }
      } else if (highResUrl) {
        // No thumbnail, load high-res directly
        setCurrentImageSrc(highResUrl);
        setCurrentlyViewingVersion(imageData.versions.current);
      }
    } else if (imageData?.thumbnailPath) {
      setCurrentImageSrc(imageData.thumbnailPath);

      // Try to load high-res if available
      if (
        imageData.signedUrl &&
        imageData.signedUrl !== imageData.thumbnailPath
      ) {
        loadHighResImage(imageData.signedUrl);
      }
    }
  }, [imageData, loadHighResImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (highResImageRef.current) {
        highResImageRef.current.onload = null;
        highResImageRef.current.onerror = null;
        highResImageRef.current = null;
      }
      // Clear the loaded URLs set on unmount
      loadedHighResUrls.current.clear();
    };
  }, []);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.naturalWidth && img.naturalHeight) {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        logger.debug("Image dimensions extracted", {
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }
      setImageLoaded(true);
    },
    []
  );

  // Handlers
  const handleModeToggle = useCallback((mode: EditorMode) => {
    setActiveMode((current) => (current === mode ? null : mode));
  }, []);

  const handleEditComplete = useCallback(
    (result: unknown) => {
      setActiveMode(null);
      setAdditionalImagesMode(false);
      setAdditionalImageUrls([]);
      setOverlayIsEditing(false);
      if (config) {
        refetchVersions();
      }
      if (onDataRefresh) onDataRefresh();
    },
    [config, refetchVersions, onDataRefresh]
  );

  const handleGenerateComplete = useCallback(
    (result: unknown) => {
      setActiveMode(null);
      setOverlayIsEditing(false);
      if (config) {
        refetchVersions();
      }
      if (onDataRefresh) onDataRefresh();
    },
    [config, refetchVersions, onDataRefresh]
  );

  const handleUpscaleComplete = useCallback(
    (result: unknown) => {
      setActiveMode(null);
      setOverlayIsEditing(false);
      if (config) {
        refetchVersions();
      }
      if (onDataRefresh) onDataRefresh();
    },
    [config, refetchVersions, onDataRefresh]
  );

  const handleVersionSelect = useCallback(
    (version: ImageVersion) => {
      logger.info("Version selected", { version: version.version });

      // Don't reload if already viewing this exact version
      if (currentlyViewingVersion?.version === version.version) {
        logger.debug("Already viewing this version, skipping reload");
        return;
      }

      // Cancel any pending loads
      if (highResImageRef.current) {
        highResImageRef.current.onload = null;
        highResImageRef.current.onerror = null;
        highResImageRef.current = null;
      }

      setCurrentlyViewingVersion(version);

      // Check if high-res is already loaded in cache
      const highResAlreadyLoaded =
        version.signedUrl && loadedHighResUrls.current.has(version.signedUrl);

      if (highResAlreadyLoaded) {
        // High-res already loaded, show it directly
        logger.debug("High-res already cached, showing directly");
        setCurrentImageSrc(version.signedUrl!);
        setImageLoaded(true);
      } else {
        // Progressive loading: thumbnail first, then high-res
        if (version.thumbnailPath) {
          setCurrentImageSrc(version.thumbnailPath);
          setImageLoaded(true);

          // Load high-res in background if different from thumbnail
          if (
            version.signedUrl &&
            version.signedUrl !== version.thumbnailPath
          ) {
            loadHighResImage(version.signedUrl);
          }
        } else if (version.signedUrl) {
          // No thumbnail, load signedUrl directly
          setCurrentImageSrc(version.signedUrl);
          setImageLoaded(true);
          // Mark as loaded to prevent re-loading
          loadedHighResUrls.current.add(version.signedUrl);
        }
      }
    },
    [currentlyViewingVersion, loadHighResImage]
  );

  // ADDED: Handle version jump from history timeline
  const handleVersionJump = useCallback(
    (version: number) => {
      const targetVersion = allVersions.find((v) => v.version === version);
      if (targetVersion) {
        handleVersionSelect(targetVersion);
        setActiveMode(null); // Close history panel
      }
    },
    [allVersions, handleVersionSelect]
  );

  const handleRestoreVersion = useCallback(
    async (targetVersion: number) => {
      if (!config) return;

      try {
        logger.info("Restoring version", { targetVersion });

        // Build restore params based on config type
        const restoreParams: any = {
          scriptId: config.scriptId,
          versionId: config.versionId,
          type: config.type,
          targetVersion,
        };

        // Add type-specific params
        if (config.type === "shots") {
          restoreParams.sceneId = config.sceneId;
          restoreParams.shotId = config.shotId;
        } else if (config.type === "actor") {
          restoreParams.actorId = config.actorId;
          restoreParams.actorVersionId = config.actorVersionId;
        } else if (config.type === "location") {
          restoreParams.locationId = config.locationId;
          restoreParams.locationVersionId = config.locationVersionId;
          restoreParams.promptType = config.promptType;
        }

        // Call the restore mutation
        await restoreVersionAsync(restoreParams);

        // Refetch versions to get updated data
        refetchVersions();

        // Call parent refresh if provided
        if (onDataRefresh) {
          onDataRefresh();
        }

        logger.info("Version restored successfully", { targetVersion });
      } catch (error) {
        logger.error("Failed to restore version", { error, targetVersion });
      }
    },
    [config, restoreVersionAsync, refetchVersions, onDataRefresh]
  );

  const isProcessing =
    isEditing ||
    isGenerating ||
    isRestoring ||
    isUpscaling ||
    overlayIsEditing ||
    overlayIsGenerating ||
    overlayIsUpscaling;

  // Toolbar button config
  const toolbarButtons = [
    {
      id: "versions",
      label: "Versions",
      icon: <LayersIcon />,
      active: activeMode === "versions",
      onClick: () => handleModeToggle("versions"),
      disabled: !config || totalVersions === 0,
      tooltip: "View all versions",
      badge: totalVersions > 0 ? totalVersions : undefined,
    },
    // ADDED: History button
    {
      id: "history",
      label: "History",
      icon: <HistoryIcon />,
      active: activeMode === "history",
      onClick: () => handleModeToggle("history"),
      disabled: !config || totalEdits === 0,
      tooltip: "View edit history",
      badge: totalEdits > 0 ? totalEdits : undefined,
    },
    {
      id: "edit",
      label: "Edit",
      icon: <EditIcon />,
      active: activeMode === "edit",
      onClick: () => handleModeToggle("edit"),
      disabled: !config || isProcessing,
      tooltip: "Edit current image",
    },
    {
      id: "generate",
      label: "Generate",
      icon: <GenerateIcon />,
      active: activeMode === "generate",
      onClick: () => handleModeToggle("generate"),
      disabled: isProcessing,
      tooltip: "Generate new image",
    },
    {
      id: "upscale",
      label: "Upscale",
      icon: <UpscaleIcon />,
      active: activeMode === "upscale",
      onClick: () => handleModeToggle("upscale"),
      disabled: !config || isProcessing,
      tooltip: "Upscale image quality",
    },
  ];

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        overflow: "hidden",
        position: "relative", // CRITICAL - positioning context for overlays
      }}
    >
      {/* Main Content Area - Takes Maximum Space */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          p: 1,
          gap: 1,
          overflow: "hidden",
        }}
      >
        {/* Image Container */}
        <Box
          sx={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Image Loading Skeleton */}
          {!imageLoaded && (
            <Skeleton
              variant="rectangular"
              sx={{
                width: "100%",
                height: "100%",
                borderRadius: `${brand.borderRadius}px`,
              }}
            />
          )}

          {/* Main Image */}
          <Box
            component="img"
            src={currentImageSrc}
            alt={
              config
                ? `${config.type} version ${viewingVersion?.version || "current"}`
                : "Image preview"
            }
            onLoad={handleImageLoad}
            onError={() => {
              logger.error("Failed to load image");
              setImageLoaded(true);
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: `${brand.borderRadius}px`,
              boxShadow: theme.shadows[8],
              display: imageLoaded ? "block" : "none",
            }}
          />
          {/* Version Badge (Top Right) - Overlay on image */}
          {viewingVersion && (
            <Box
              sx={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 15,
              }}
            >
              <Chip
                label={`V${viewingVersion.version}`}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.background.paper, 0.95),
                  backdropFilter: "blur(12px)",
                  fontFamily: brand.fonts.body,
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  height: 24,
                  px: 1,
                  border: 1,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: "text.primary",
                  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.15)}`,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.9),
                    color: "primary.contrastText",
                    borderColor: "primary.main",
                    transform: "scale(1.05)",
                  },
                }}
              />
            </Box>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <Box
              sx={{
                position: "absolute",
                top: 24,
                left: "50%",
                transform: "translateX(-50%)",
                bgcolor: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: "blur(10px)",
                px: 3,
                py: 1.5,
                borderRadius: `${brand.borderRadius}px`,
                boxShadow: theme.shadows[4],
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                zIndex: 20,
              }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  border: 2,
                  borderColor: "primary.main",
                  borderTopColor: "transparent",
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
                sx={{ fontFamily: brand.fonts.body, fontWeight: 500 }}
              >
                {overlayIsEditing && "Editing image..."}
                {overlayIsGenerating && "Generating image..."}
                {overlayIsUpscaling && "Upscaling image..."}
                {isRestoring && "Restoring version..."}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Version Strip - Collapsible panel below image */}
        <Collapse in={activeMode === "versions"}>
          <Paper
            elevation={8}
            sx={{
              borderTop: 2,
              borderColor: "primary.main",
              borderTopLeftRadius: `${brand.borderRadius}px`,
              borderTopRightRadius: `${brand.borderRadius}px`,
              bgcolor: "background.paper",
              overflow: "auto",
            }}
          >
            {config && allVersions.length > 0 && (
              <VersionThumbnailStrip
                allVersions={allVersions}
                currentVersion={viewingVersion}
                onVersionSelect={handleVersionSelect}
                onRestoreVersion={handleRestoreVersion}
                isLoading={isLoadingVersions}
                disabled={isProcessing}
                maxVisibleThumbnails={8}
              />
            )}
          </Paper>
        </Collapse>

        {/* ADDED: History Timeline - Collapsible panel below image */}
        <Collapse in={activeMode === "history"}>
          <Paper
            elevation={8}
            sx={{
              borderTop: 2,
              borderColor: "secondary.main",
              borderTopLeftRadius: `${brand.borderRadius}px`,
              borderTopRightRadius: `${brand.borderRadius}px`,
              bgcolor: "background.paper",
              overflow: "auto",
              maxHeight: 400,
            }}
          >
            {config && editHistory.length > 0 && (
              <Box sx={{ p: 2 }}>
                <EditHistoryTimeline
                  editHistory={editHistory}
                  currentVersion={viewingVersion?.version || 0}
                  onVersionJump={handleVersionJump}
                  compact={false}
                />
              </Box>
            )}
          </Paper>
        </Collapse>

        {/* Bottom Toolbar - Fixed Height */}
        <ImageEditorToolbar buttons={toolbarButtons} compact={true} />
      </Box>

      {/* OVERLAYS - Positioned absolutely against parent Box */}
      {/* Edit Overlay */}
      {activeMode === "edit" && config && (
        <Suspense fallback={<Skeleton variant="rectangular" height={200} />}>
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
            onAdditionalImagesUpdate={setAdditionalImageUrls}
            additionalImagesMode={additionalImagesMode}
            onAdditionalImagesModeToggle={() =>
              setAdditionalImagesMode(!additionalImagesMode)
            }
            onEditComplete={handleEditComplete}
            onCancel={() => {
              setActiveMode(null);
              setAdditionalImagesMode(false);
              setAdditionalImageUrls([]);
              resetEditMutation();
            }}
            onEditingStateChange={setOverlayIsEditing}
            disabled={isProcessing && !overlayIsEditing}
          />
        </Suspense>
      )}

      {/* Generate Overlay */}
      {activeMode === "generate" && (
        <Suspense fallback={<Skeleton variant="rectangular" height={200} />}>
          <ImageGenerationOverlay
            scriptId={config?.scriptId || ""}
            versionId={config?.versionId || ""}
            type={config?.type || "shots"}
            viewingVersion={viewingVersion}
            sceneId={config?.sceneId}
            shotId={config?.shotId}
            actorId={config?.actorId}
            actorVersionId={config?.actorVersionId}
            locationId={config?.locationId}
            locationVersionId={config?.locationVersionId}
            promptType={config?.promptType}
            onGenerateComplete={handleGenerateComplete}
            onCancel={() => {
              setActiveMode(null);
              if (config) resetGenerateMutation();
            }}
            onGeneratingStateChange={setOverlayIsGenerating}
            disabled={isProcessing && !overlayIsGenerating}
          />
        </Suspense>
      )}

      {/* Upscale Overlay */}
      {activeMode === "upscale" && config && (
        <Suspense fallback={<Skeleton variant="rectangular" height={200} />}>
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
              setActiveMode(null);
              resetUpscaleMutation();
            }}
            onUpscalingStateChange={setOverlayIsUpscaling}
            disabled={isProcessing && !overlayIsUpscaling}
          />
        </Suspense>
      )}
    </Box>
  );
}
