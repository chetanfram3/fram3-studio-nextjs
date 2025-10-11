"use client";

// ImageDisplayCore.tsx - Enhanced with Generate button
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
} from "@mui/material";
import { AutoFixHighOutlined as EditIcon } from "@mui/icons-material";
import {
  ImageUpscale as UpscaleIcon,
  Plus as PlusIcon,
  History as HistoryIcon,
  Layers as VersionsIcon,
  Wand2 as GenerateIcon, // NEW: Generate icon
} from "lucide-react";
import { ImageVersion } from "@/types/storyBoard/types";

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
  generateMode: boolean; // NEW: Generate mode
  upscaleMode: boolean;
  versionsMode: boolean;
  historyMode: boolean;
  additionalImagesMode: boolean;

  // Action handlers
  onEditClick: () => void;
  onGenerateClick: () => void; // NEW: Generate click handler
  onUpscaleClick: () => void;
  onAdditionalImagesClick: () => void;
  onVersionsClick: () => void;
  onHistoryClick: () => void;

  // State flags
  isEditing: boolean;
  isGenerating: boolean; // NEW: Generating state
  isRestoring: boolean;
  isUpscaling: boolean;
  overlayIsEditing: boolean;
  overlayIsGenerating: boolean; // NEW: Overlay generating state
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
  generateMode, // NEW
  upscaleMode,
  versionsMode,
  historyMode,
  additionalImagesMode,
  onEditClick,
  onGenerateClick, // NEW
  onUpscaleClick,
  onAdditionalImagesClick,
  onVersionsClick,
  onHistoryClick,
  isEditing,
  isGenerating, // NEW
  isRestoring,
  isUpscaling,
  overlayIsEditing,
  overlayIsGenerating, // NEW
  overlayIsUpscaling,
  additionalImageUrls,
  viewingVersion,
  config,
  totalVersions,
  totalEdits,
  isLoadingVersions,
  isLoadingHistory,
  isLoadingHighRes = false,
  loadingProgress = 0,
  hasLoadError = false,
  loadErrorMessage,
}: ImageDisplayCoreProps) {
  const objectFit = "cover";

  const shouldShowLoading = !imageLoaded && hasSignedUrl && !hasLoadError;
  const shouldShowError = hasLoadError && loadErrorMessage;

  const getContainerStyles = () => {
    const baseStyles = {
      mb: 2,
      width: "100%",
      bgcolor: "grey.200",
      borderRadius: 1,
      overflow: "hidden",
      position: "relative" as const,
      cursor: hasMultipleVersions ? "pointer" : "default",
    };

    return {
      ...baseStyles,
      aspectRatio: aspectRatio.toString(),
    };
  };

  const LoadingIndicator = () => (
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
        borderRadius: 2,
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.1)",
        zIndex: 20,
      }}
    >
      <CircularProgress
        size={32}
        sx={{
          color: "secondary.main",
          ...(loadingProgress > 0 && {
            "& .MuiCircularProgress-circle": {
              strokeDasharray: `${loadingProgress * 2.51}, 251`,
            },
          }),
        }}
      />
      <Stack alignItems="center" spacing={0.5}>
        <Typography variant="body2" fontWeight="medium" textAlign="center">
          {isLoadingHighRes ? "Loading high-res image..." : "Loading image..."}
        </Typography>
        {loadingProgress > 0 && (
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {Math.round(loadingProgress)}%
          </Typography>
        )}
      </Stack>
    </Box>
  );

  const ErrorIndicator = () => (
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
        borderRadius: 2,
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,0,0,0.3)",
        zIndex: 20,
        maxWidth: "80%",
      }}
    >
      <Typography variant="body2" fontWeight="medium" textAlign="center">
        ⚠️ Image Load Error
      </Typography>
      <Typography variant="caption" sx={{ opacity: 0.9, textAlign: "center" }}>
        {loadErrorMessage || "Failed to load image"}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={getContainerStyles()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Main Image Container with Reveal/Wipe Effect */}
      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
        {/* Current Image (Background Layer) */}
        <Box
          component="img"
          src={currentImageSrc}
          alt={altText}
          loading="lazy"
          onLoad={onImageLoad}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: objectFit,
            borderRadius: 1,
            transition: "filter 0.3s ease-in-out",
            filter: shouldShowLoading
              ? "blur(10px) brightness(0.7)"
              : hasLoadError
                ? "blur(2px) brightness(0.5) grayscale(50%)"
                : "none",
            ...(shouldShowLoading && {
              animation: "imageLoadingPulse 2s ease-in-out infinite",
              "@keyframes imageLoadingPulse": {
                "0%": { opacity: 0.7 },
                "50%": { opacity: 0.9 },
                "100%": { opacity: 0.7 },
              },
            }),
          }}
        />

        {/* Next Image for Wipe Effect (Overlay Layer) */}
        {isTransitioning && nextImageSrc && (
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
              objectFit: objectFit,
              borderRadius: 1,
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

        {/* Enhanced Loading Indicator */}
        {shouldShowLoading && <LoadingIndicator />}

        {/* Enhanced Error Indicator */}
        {shouldShowError && <ErrorIndicator />}

        {/* Edit and Action Controls */}
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
            {/* Main Action Buttons with Semi-transparent Black Overlay */}
            {config.scriptId &&
              config.versionId &&
              !editMode &&
              !generateMode && // NEW: Include generateMode in condition
              !versionsMode &&
              !historyMode &&
              !upscaleMode && (
                <Box
                  sx={{
                    bgcolor: "rgba(0, 0, 0, 0.6)",
                    backdropFilter: "blur(4px)",
                    borderRadius: 2,
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
                            isEditing ||
                            isGenerating || // NEW: Include isGenerating
                            isRestoring ||
                            isUpscaling ||
                            isLoadingHistory
                          }
                          sx={{
                            bgcolor: historyMode
                              ? "secondary.main"
                              : "transparent",
                            color: historyMode
                              ? "secondary.contrastText"
                              : "white",
                            "&:hover": {
                              bgcolor: "secondary.main",
                              color: "secondary.contrastText",
                            },
                            "&:disabled": {
                              bgcolor: "transparent",
                              color: "rgba(255, 255, 255, 0.3)",
                            },
                            transition: "all 0.2s ease-in-out",
                          }}
                        >
                          <Badge badgeContent={totalEdits} color="secondary">
                            <HistoryIcon size={20} />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* NEW: Generate Button */}
                    <Tooltip title="Generate new version from prompt">
                      <IconButton
                        onClick={onGenerateClick}
                        disabled={
                          isEditing ||
                          isGenerating ||
                          isRestoring ||
                          isUpscaling
                        }
                        sx={{
                          bgcolor: generateMode
                            ? "secondary.main"
                            : "transparent",
                          color: generateMode
                            ? "secondary.contrastText"
                            : "white",
                          "&:hover": {
                            bgcolor: "secondary.main",
                            color: "secondary.contrastText",
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

                    {/* Edit Button */}
                    <Tooltip title="Edit this version">
                      <IconButton
                        onClick={onEditClick}
                        disabled={
                          isEditing ||
                          isGenerating ||
                          isRestoring ||
                          isUpscaling
                        }
                        sx={{
                          bgcolor: "transparent",
                          color: "white",
                          "&:hover": {
                            bgcolor: "secondary.main",
                            color: "secondary.contrastText",
                          },
                          "&:disabled": {
                            bgcolor: "transparent",
                            color: "rgba(255, 255, 255, 0.3)",
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
                        disabled={
                          isEditing ||
                          isGenerating ||
                          isRestoring ||
                          isUpscaling
                        }
                        sx={{
                          bgcolor: "transparent",
                          color: "white",
                          "&:hover": {
                            bgcolor: "secondary.main",
                            color: "secondary.contrastText",
                          },
                          "&:disabled": {
                            bgcolor: "transparent",
                            color: "rgba(255, 255, 255, 0.3)",
                          },
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <UpscaleIcon size={20} />
                      </IconButton>
                    </Tooltip>

                    {/* Additional Images Button */}
                    <Tooltip title="Add reference images for multi-image editing">
                      <IconButton
                        onClick={onAdditionalImagesClick}
                        disabled={
                          isEditing ||
                          isGenerating ||
                          isRestoring ||
                          isUpscaling
                        }
                        sx={{
                          bgcolor: additionalImagesMode
                            ? "secondary.main"
                            : "transparent",
                          color: additionalImagesMode
                            ? "secondary.contrastText"
                            : "white",
                          "&:hover": {
                            bgcolor: "secondary.main",
                            color: "secondary.contrastText",
                          },
                          "&:disabled": {
                            bgcolor: "transparent",
                            color: "rgba(255, 255, 255, 0.3)",
                          },
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <Badge
                          badgeContent={additionalImageUrls.length || null}
                          color="secondary"
                        >
                          <PlusIcon size={20} />
                        </Badge>
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              )}
          </Box>
        </Fade>

        {/* Processing indicator - Updated to include generating */}
        {(isEditing ||
          isGenerating || // NEW: Include isGenerating
          isRestoring ||
          overlayIsUpscaling ||
          overlayIsEditing ||
          overlayIsGenerating) && ( // NEW: Include overlayIsGenerating
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
              borderRadius: 2,
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
                  borderTopColor: "secondary.main",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
              <Typography variant="body2" fontWeight="medium">
                {isEditing || overlayIsEditing
                  ? "Creating new version..."
                  : isGenerating || overlayIsGenerating // NEW: Include generating states
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
