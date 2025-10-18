"use client";

import { Suspense } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Fade,
  Stack,
  Typography,
  Badge,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { AutoFixHighOutlined as EditIcon } from "@mui/icons-material";
import {
  ImageUpscale as UpscaleIcon,
  Plus as PlusIcon,
  ExpandIcon,
  History as HistoryIcon,
  Wand2 as GenerateIcon,
} from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { ImageVersion } from "@/types/storyBoard/types";
import logger from "@/utils/logger";

export interface ImageViewerConfig {
  scriptId: string;
  versionId: string;
  type: "shots" | "keyVisual" | "actor" | "location";
  aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";

  // Type-specific required props
  sceneId?: number;
  shotId?: number;
  actorId?: number;
  actorVersionId?: number;
  locationId?: number;
  locationVersionId?: number;
  promptType?: string;
}

interface ImageDisplayCoreProps {
  currentImageSrc: string;
  nextImageSrc: string;
  isTransitioning: boolean;
  wipeDirection: "left-to-right" | "right-to-left";
  aspectRatio: number;
  imageLoaded: boolean;
  hasSignedUrl: boolean;
  altText: string;
  onImageLoad: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  showOverlays: boolean;
  hasMultipleVersions: boolean;

  // Control states
  editMode: boolean;
  generateMode: boolean;
  upscaleMode: boolean;
  versionsMode: boolean;
  historyMode: boolean;
  additionalImagesMode: boolean;

  // Action handlers
  onEditClick: () => void;
  onGenerateClick: () => void;
  onUpscaleClick: () => void;
  onAdditionalImagesClick: () => void;
  onVersionsClick: () => void;
  onHistoryClick: () => void;

  // State flags
  isEditing: boolean;
  isGenerating: boolean;
  isRestoring: boolean;
  isUpscaling: boolean;
  overlayIsEditing: boolean;
  overlayIsGenerating: boolean;
  overlayIsUpscaling: boolean;
  additionalImageUrls: string[];
  viewingVersion?: ImageVersion;
  config: ImageViewerConfig;

  // Version/History data
  totalVersions: number;
  totalEdits: number;
  isLoadingVersions: boolean;
  isLoadingHistory: boolean;

  // Enhanced loading states
  isLoadingHighRes?: boolean;
  loadingProgress?: number;
  hasLoadError?: boolean;
  loadErrorMessage?: string | null;
}

/**
 * ImageDisplayCore - Optimized core image display component
 *
 * Performance optimizations:
 * - Next.js Image for ALL images including signed URLs (30-50% smaller)
 * - Progressive loading (thumbnail → high-res)
 * - Suspense boundaries for lazy loading
 * - Theme-aware styling (no hardcoded colors)
 * - No manual memoization (React 19 compiler handles it)
 *
 * IMPORTANT: Next.js Image works with signed URLs!
 * - Requires next.config.js remotePatterns configuration
 * - Optimizes on-the-fly and caches results
 * - Preserves signed URL tokens in requests
 */
export function ImageDisplayCore({
  currentImageSrc,
  nextImageSrc,
  isTransitioning,
  wipeDirection,
  aspectRatio,
  imageLoaded,
  hasSignedUrl,
  altText,
  onImageLoad,
  onMouseEnter,
  onMouseLeave,
  showOverlays,
  hasMultipleVersions,
  editMode,
  generateMode,
  upscaleMode,
  versionsMode,
  historyMode,
  additionalImagesMode,
  onEditClick,
  onGenerateClick,
  onUpscaleClick,
  onAdditionalImagesClick,
  onHistoryClick,
  isEditing,
  isGenerating,
  isRestoring,
  isUpscaling,
  overlayIsEditing,
  overlayIsGenerating,
  overlayIsUpscaling,
  additionalImageUrls,
  config,
  totalEdits,
  isLoadingHistory,
  isLoadingHighRes = false,
  loadingProgress = 0,
  hasLoadError = false,
  loadErrorMessage,
}: ImageDisplayCoreProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  const shouldShowLoading = !imageLoaded && hasSignedUrl && !hasLoadError;
  const shouldShowError = hasLoadError && loadErrorMessage;

  // Helper: Check if any processing is happening
  const isProcessing =
    isEditing ||
    isGenerating ||
    isRestoring ||
    overlayIsUpscaling ||
    overlayIsEditing ||
    overlayIsGenerating;

  // Check if image is placeholder (only case where we don't use Next.js Image)
  const isPlaceholder = currentImageSrc === "/placeHolder.webp";

  logger.debug("Rendering image with Next.js Image optimization", {
    src: currentImageSrc,
    isPlaceholder,
    type: config.type,
  });

  const getContainerStyles = () => ({
    mb: 2,
    width: "100%",
    bgcolor: "background.paper",
    borderRadius: `${brand.borderRadius}px`,
    overflow: "hidden",
    position: "relative" as const,
    cursor: hasMultipleVersions ? "pointer" : "default",
    aspectRatio: aspectRatio.toString(),
    border: 1,
    borderColor: "divider",
  });

  const onFullScreenModeClick = () => {
    if (!config.scriptId || !config.versionId || !config.type) {
      logger.warn("Missing required config for full screen mode", { config });
      return;
    }

    // Build query params
    const params = new URLSearchParams({
      scriptId: config.scriptId,
      versionId: config.versionId,
      type: config.type,
    });

    // Add type-specific params
    if (config.type === "shots" && config.sceneId && config.shotId) {
      params.append("sceneId", config.sceneId.toString());
      params.append("shotId", config.shotId.toString());
    } else if (config.type === "actor" && config.actorId) {
      params.append("actorId", config.actorId.toString());
      if (config.actorVersionId) {
        params.append("actorVersionId", config.actorVersionId.toString());
      }
    } else if (config.type === "location" && config.locationId) {
      params.append("locationId", config.locationId.toString());
      if (config.locationVersionId) {
        params.append("locationVersionId", config.locationVersionId.toString());
      }
      if (config.promptType) {
        params.append("promptType", config.promptType);
      }
    }

    const url = `/ai/image-editor?${params.toString()}`;

    logger.info("Navigating to full screen image editor", { url });
    router.push(url);
  };

  return (
    <Box
      sx={getContainerStyles()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Main Image Container */}
      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
        {/* Current Image - ALWAYS use Next.js Image except for placeholder */}
        <Suspense fallback={<Skeleton variant="rectangular" height="100%" />}>
          {isPlaceholder ? (
            // Only use regular img for placeholder
            <Box
              component="img"
              src={currentImageSrc}
              alt={altText}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: `${brand.borderRadius}px`,
              }}
            />
          ) : (
            // Use Next.js Image for ALL real images (including signed URLs!)
            <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
              <NextImage
                src={currentImageSrc}
                alt={altText}
                fill
                quality={85}
                priority={!shouldShowLoading}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                onLoad={(e) => {
                  // Convert NextImage's onLoad to match HTMLImageElement
                  const target = e.target as HTMLImageElement;
                  onImageLoad({
                    currentTarget: target,
                  } as React.SyntheticEvent<HTMLImageElement>);
                }}
                style={{
                  objectFit: "cover",
                  borderRadius: `${brand.borderRadius}px`,
                  transition: "filter 0.3s ease-in-out",
                  filter: shouldShowLoading
                    ? "blur(10px) brightness(0.7)"
                    : hasLoadError
                      ? "blur(2px) brightness(0.5) grayscale(50%)"
                      : "none",
                }}
              />
            </Box>
          )}
        </Suspense>

        {/* Next Image for Wipe Effect */}
        {isTransitioning && nextImageSrc && (
          <Suspense fallback={null}>
            {nextImageSrc === "/placeHolder.webp" ? (
              <Box
                component="img"
                src={nextImageSrc}
                alt="Next version"
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
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
            ) : (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
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
              >
                <NextImage
                  src={nextImageSrc}
                  alt="Next version"
                  fill
                  quality={85}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  style={{
                    objectFit: "cover",
                    borderRadius: `${brand.borderRadius}px`,
                  }}
                />
              </Box>
            )}
          </Suspense>
        )}

        {/* Loading Indicator */}
        {shouldShowLoading && (
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
              color: "text.primary",
              bgcolor: "background.paper",
              px: 3,
              py: 2,
              borderRadius: `${brand.borderRadius}px`,
              backdropFilter: "blur(8px)",
              border: 1,
              borderColor: "primary.main",
              boxShadow: theme.shadows[8],
              zIndex: 20,
            }}
          >
            <CircularProgress
              size={32}
              color="primary"
              {...(loadingProgress > 0 && {
                variant: "determinate",
                value: loadingProgress,
              })}
            />
            <Stack alignItems="center" spacing={0.5}>
              <Typography
                variant="body2"
                fontWeight="medium"
                textAlign="center"
                color="text.primary"
              >
                {isLoadingHighRes ? "Loading high-res..." : "Loading..."}
              </Typography>
              {loadingProgress > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {Math.round(loadingProgress)}%
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {/* Error Indicator */}
        {shouldShowError && (
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
              color: "text.primary",
              bgcolor: "background.paper",
              px: 3,
              py: 2,
              borderRadius: `${brand.borderRadius}px`,
              backdropFilter: "blur(8px)",
              border: 1,
              borderColor: "error.main",
              boxShadow: theme.shadows[8],
              zIndex: 20,
              maxWidth: "80%",
            }}
          >
            <Typography
              variant="body2"
              fontWeight="medium"
              textAlign="center"
              color="error.main"
            >
              ⚠️ Image Load Error
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              {loadErrorMessage || "Failed to load image"}
            </Typography>
          </Box>
        )}

        {/* Action Controls */}
        <Fade
          in={
            showOverlays ||
            editMode ||
            generateMode ||
            versionsMode ||
            historyMode
          }
        >
          <Box
            sx={{
              position: "absolute",
              bottom: 8,
              left: 8,
              display: "flex",
              gap: 1,
            }}
          >
            {config.scriptId &&
              config.versionId &&
              !editMode &&
              !generateMode &&
              !versionsMode &&
              !historyMode &&
              !upscaleMode && (
                <Box
                  sx={{
                    bgcolor: "background.paper",
                    backdropFilter: "blur(4px)",
                    borderRadius: `${brand.borderRadius}px`,
                    p: 1,
                    border: 1,
                    borderColor: "primary.main",
                    boxShadow: theme.shadows[4],
                  }}
                >
                  <Stack direction="row" spacing={1}>
                    {/* History Button */}
                    {totalEdits > 0 && (
                      <Tooltip title="View edit history">
                        <IconButton
                          onClick={onHistoryClick}
                          disabled={isProcessing || isLoadingHistory}
                          color="primary"
                          sx={{
                            bgcolor: historyMode
                              ? "primary.main"
                              : "transparent",
                            color: historyMode
                              ? "primary.contrastText"
                              : "primary.main",
                            "&:hover": {
                              bgcolor: "primary.main",
                              color: "primary.contrastText",
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
                    <Tooltip title="Generate new version">
                      <IconButton
                        onClick={onGenerateClick}
                        disabled={isProcessing}
                        color="primary"
                        sx={{
                          bgcolor: generateMode
                            ? "primary.main"
                            : "transparent",
                          color: generateMode
                            ? "primary.contrastText"
                            : "primary.main",
                          "&:hover": {
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                          },
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <GenerateIcon size={20} />
                      </IconButton>
                    </Tooltip>

                    {/* Edit Button */}
                    <Tooltip title="Edit this version">
                      <IconButton
                        onClick={onEditClick}
                        disabled={isProcessing}
                        color="primary"
                        sx={{
                          "&:hover": {
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                          },
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>

                    {/* Upscale Button */}
                    <Tooltip title="Upscale this version">
                      <IconButton
                        onClick={onUpscaleClick}
                        disabled={isProcessing}
                        color="primary"
                        sx={{
                          "&:hover": {
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                          },
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <UpscaleIcon size={20} />
                      </IconButton>
                    </Tooltip>

                    {/* Additional Images Button */}
                    <Tooltip title="Add reference images">
                      <IconButton
                        onClick={onAdditionalImagesClick}
                        disabled={isProcessing}
                        color="primary"
                        sx={{
                          bgcolor: additionalImagesMode
                            ? "primary.main"
                            : "transparent",
                          color: additionalImagesMode
                            ? "primary.contrastText"
                            : "primary.main",
                          "&:hover": {
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                          },
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <Badge
                          badgeContent={additionalImageUrls.length || null}
                          color="primary"
                        >
                          <PlusIcon size={20} />
                        </Badge>
                      </IconButton>
                    </Tooltip>
                    {/* Image Editor Navigate Button */}
                    <Tooltip title="Open in full screen editor">
                      <IconButton
                        onClick={onFullScreenModeClick}
                        disabled={isProcessing}
                        color="primary"
                        sx={{
                          "&:hover": {
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                          },
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <ExpandIcon size={20} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              )}
          </Box>
        </Fade>

        {/* Processing Indicator */}
        {isProcessing && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "text.primary",
              bgcolor: "background.paper",
              px: 3,
              py: 2,
              borderRadius: `${brand.borderRadius}px`,
              zIndex: 25,
              border: 1,
              borderColor: "primary.main",
              backdropFilter: "blur(10px)",
              boxShadow: theme.shadows[8],
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <CircularProgress size={20} color="primary" />
              <Typography
                variant="body2"
                fontWeight="medium"
                color="text.primary"
              >
                {isEditing || overlayIsEditing
                  ? "Creating new version..."
                  : isGenerating || overlayIsGenerating
                    ? "Generating new image..."
                    : isRestoring
                      ? "Restoring version..."
                      : "Upscaling image..."}
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
}
