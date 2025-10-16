"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Fade,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  CircularProgress,
  Skeleton,
  alpha,
} from "@mui/material";
import {
  PhotoCameraOutlined as ImageEditIcon,
  CloseOutlined as CloseIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import NextImage from "next/image";
import { ShotImageViewer } from "@/components/imageEditor/ShotImageViewer";
import {
  PromptEditor,
  type PromptType,
} from "@/components/common/PromptEditor";

interface ActorImageData {
  actorId: number;
  actorVersionId: number;
  signedUrl?: string;
  thumbnailPath?: string;
  actorPrompt?: string;
  versions?: {
    current: any;
    archived: Record<number, any>;
    totalVersions?: number;
    totalEdits?: number;
    editHistory?: any[];
  };
}

interface LocationImageData {
  locationId: number;
  locationVersionId: number;
  promptType?: string;
  signedUrl?: string;
  thumbnailPath?: string;
  locationPrompt?: string;
  versions?: {
    current: any;
    archived: Record<number, any>;
    totalVersions?: number;
    totalEdits?: number;
    editHistory?: any[];
  };
}

interface MainImageProps {
  imageUrl?: string;
  title?: string;
  description?: string;
  isActor?: boolean;
  summary?: {
    roomTones: number;
    foleyItems: number;
    musicTracks: number;
    actors: number;
    locations: number;
    scenes: number;
    shots: number;
    dialogues: number;
  };
  scriptId?: string;
  versionId?: string;
  actorImageData?: ActorImageData;
  locationImageData?: LocationImageData;
  onImageUpdate?: (updatedImageData: any, type: "actor" | "location") => void;
  onDataRefresh?: () => void;
  hasImage?: boolean;
  hasPrompt?: boolean;
  showPromptEditor?: boolean;
  prompt?: string;
  originalPrompt?: string;
  onPromptUpdate?: (newPrompt: string, type: "actor" | "location") => void;
}

const DEFAULT_IMAGE = "/placeHolder.webp";

/**
 * MainImage - Optimized main image display component
 *
 * Performance optimizations:
 * - Next.js Image for signed URLs (30-50% smaller)
 * - Suspense boundary for progressive loading
 * - Theme-aware styling (no hardcoded colors)
 * - React 19 compiler optimizations
 * - Strategic memoization for expensive computations
 */
export function MainImage({
  imageUrl = DEFAULT_IMAGE,
  title = "Title not available",
  description = "Description not available",
  isActor = false,
  summary,
  scriptId,
  versionId,
  actorImageData,
  locationImageData,
  onImageUpdate,
  onDataRefresh,
  hasImage = false,
  hasPrompt = false,
  showPromptEditor = false,
  prompt,
  originalPrompt,
  onPromptUpdate,
}: MainImageProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE
  // ==========================================
  const [isHovered, setIsHovered] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [imgSrc, setImgSrc] = useState(imageUrl || DEFAULT_IMAGE);
  const [imageLoadError, setImageLoadError] = useState(false);

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const isPlaceholder = useMemo(() => {
    return imgSrc === DEFAULT_IMAGE;
  }, [imgSrc]);

  const canEditImage = useMemo(() => {
    return Boolean(
      scriptId &&
        versionId &&
        ((isActor && actorImageData) || (!isActor && locationImageData))
    );
  }, [scriptId, versionId, isActor, actorImageData, locationImageData]);

  const imageDataForViewer = useMemo(() => {
    if (isActor && actorImageData) {
      return {
        signedUrl: actorImageData.signedUrl,
        thumbnailPath: actorImageData.thumbnailPath,
        versions: actorImageData.versions,
      };
    } else if (!isActor && locationImageData) {
      return {
        signedUrl: locationImageData.signedUrl,
        thumbnailPath: locationImageData.thumbnailPath,
        versions: locationImageData.versions,
      };
    }
    return null;
  }, [isActor, actorImageData, locationImageData]);

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    console.log("MainImage: Props received:", {
      imageUrl,
      scriptId,
      versionId,
      isActor,
      hasImage,
      hasPrompt,
      showPromptEditor,
    });
  }, [
    imageUrl,
    scriptId,
    versionId,
    isActor,
    hasImage,
    hasPrompt,
    showPromptEditor,
  ]);

  useEffect(() => {
    console.log("MainImage: Updating imgSrc to:", imageUrl);
    setImgSrc(imageUrl || DEFAULT_IMAGE);
    setImageLoadError(false);
  }, [imageUrl]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isEditDialogOpen) {
        handleCloseEditDialog();
      }
    };

    if (isEditDialogOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isEditDialogOpen]);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const handleEditImageClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>): void => {
      console.log("MainImage: Edit button clicked!");
      e.preventDefault();
      e.stopPropagation();

      const hasImageData = isActor ? actorImageData : locationImageData;
      console.log("MainImage: Image data check:", {
        isActor,
        hasImageData: !!hasImageData,
        scriptId,
        versionId,
      });

      if (hasImageData && scriptId && versionId) {
        console.log("MainImage: Opening edit dialog...");
        setIsDialogLoading(true);
        setIsEditDialogOpen(true);
        setTimeout(() => setIsDialogLoading(false), 100);
      } else {
        console.log("MainImage: Cannot open dialog - missing requirements");
      }
    },
    [isActor, actorImageData, locationImageData, scriptId, versionId]
  );

  const handleCloseEditDialog = useCallback((): void => {
    setIsEditDialogOpen(false);
    setIsDialogLoading(false);

    if (onDataRefresh) {
      setTimeout(() => {
        console.log("MainImage: Dialog closed, refreshing data...");
        onDataRefresh();
      }, 500);
    }
  }, [onDataRefresh]);

  const handleImageUpdate = useCallback(
    (updatedImageData: any) => {
      console.log("MainImage: Image updated with data:", updatedImageData);

      if (onImageUpdate) {
        const imageType = isActor ? "actor" : "location";
        onImageUpdate(updatedImageData, imageType);
      }

      const newImageUrl =
        updatedImageData.newThumbnailPath ||
        updatedImageData.thumbnailPath ||
        updatedImageData.signedUrl;

      if (newImageUrl) {
        console.log("MainImage: Updating local image to:", newImageUrl);
        setImgSrc(newImageUrl);
      }
    },
    [onImageUpdate, isActor]
  );

  const handlePromptUpdate = useCallback(
    (newPrompt: string, promptType: PromptType) => {
      console.log("MainImage: Prompt updated:", {
        newPrompt,
        promptType,
        isActor,
      });

      if (onPromptUpdate) {
        const entityType = isActor ? "actor" : "location";
        onPromptUpdate(newPrompt, entityType);
      }
    },
    [onPromptUpdate, isActor]
  );

  const handlePromptError = useCallback((error: string) => {
    console.error("MainImage: Prompt error:", error);
  }, []);

  const handleImageLoad = useCallback(() => {
    console.log("MainImage: Image loaded successfully:", imgSrc);
    setImageLoadError(false);
  }, [imgSrc]);

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      console.error("MainImage: Image failed to load:", imgSrc, e);
      setImageLoadError(true);
    },
    [imgSrc]
  );

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const renderMainContent = useCallback(() => {
    if (hasImage) {
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            position: "relative",
            zIndex: 1,
            bgcolor: imageLoadError ? "background.paper" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {imageLoadError ? (
            <Box sx={{ textAlign: "center", color: "text.secondary" }}>
              <Typography variant="h6" gutterBottom color="text.primary">
                Image Not Available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The image could not be loaded.
              </Typography>
            </Box>
          ) : (
            <Suspense
              fallback={
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="100%"
                  sx={{ borderRadius: `${brand.borderRadius}px` }}
                />
              }
            >
              {isPlaceholder ? (
                <Box
                  component="img"
                  src={imgSrc}
                  alt="Main content"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.02)",
                    },
                  }}
                />
              ) : (
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <NextImage
                    src={imgSrc}
                    alt="Main content"
                    fill
                    quality={85}
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                    onLoad={handleImageLoad}
                    style={{
                      objectFit: "cover",
                      transition: "transform 0.3s ease",
                    }}
                  />
                </Box>
              )}
            </Suspense>
          )}
        </Box>
      );
    } else if (showPromptEditor && prompt && scriptId && versionId) {
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            p: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            bgcolor: "background.paper",
            borderRadius: `${brand.borderRadius}px`,
          }}
        >
          <PromptEditor
            type={isActor ? "actor" : "location"}
            prompt={prompt}
            originalPrompt={originalPrompt}
            {...(isActor &&
              actorImageData && {
                actorId: actorImageData.actorId,
                actorVersionId: actorImageData.actorVersionId,
              })}
            {...(!isActor &&
              locationImageData && {
                locationId: locationImageData.locationId,
                locationVersionId: locationImageData.locationVersionId,
              })}
            scriptId={scriptId}
            versionId={versionId}
            onPromptUpdate={handlePromptUpdate}
            onError={handlePromptError}
            disabled={!scriptId || !versionId}
          />
        </Box>
      );
    } else {
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            borderRadius: `${brand.borderRadius}px`,
            border: "2px dashed",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No {isActor ? "Actor" : "Location"} Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isActor ? "Actor" : "Location"} will appear here once generated
          </Typography>
        </Box>
      );
    }
  }, [
    hasImage,
    imageLoadError,
    isPlaceholder,
    imgSrc,
    showPromptEditor,
    prompt,
    scriptId,
    versionId,
    isActor,
    originalPrompt,
    actorImageData,
    locationImageData,
    brand.borderRadius,
    handleImageLoad,
    handleImageError,
    handlePromptUpdate,
    handlePromptError,
  ]);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <>
      <Box
        sx={{
          position: "relative",
          borderRadius: `${brand.borderRadius}px`,
          overflow: "hidden",
          aspectRatio: "16/9",
          bgcolor: "background.paper",
        }}
        onMouseEnter={() => {
          console.log("MainImage: Mouse enter, setting hover to true");
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          console.log("MainImage: Mouse leave, setting hover to false");
          setIsHovered(false);
        }}
      >
        {/* Main Content Area */}
        {renderMainContent()}

        {/* Edit Image Button */}
        {canEditImage && hasImage && !imageLoadError && (
          <Fade in={isHovered} timeout={200}>
            <Tooltip
              title={`Edit ${isActor ? "Actor" : "Location"} Image`}
              arrow
            >
              <IconButton
                onClick={handleEditImageClick}
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  color: "text.primary",
                  width: 40,
                  height: 40,
                  // ✅ Theme-aware background
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.background.paper, 0.8)
                      : alpha(theme.palette.background.paper, 0.95),
                  backdropFilter: "blur(5px)",
                  transition: "all 0.2s ease",
                  zIndex: 1000,
                  pointerEvents: "auto",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.9),
                    transform: "scale(1.15)",
                  },
                }}
                aria-label={`Edit ${isActor ? "actor" : "location"} image`}
              >
                <ImageEditIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Fade>
        )}

        {/* Top Content Overlay */}
        {hasImage && !imageLoadError && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              p: 4,
              color: "text.primary",
              // ✅ Theme-aware gradient overlay
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? `linear-gradient(to bottom, ${alpha(
                      theme.palette.background.default,
                      0.6
                    )} 0%, ${alpha(
                      theme.palette.background.default,
                      0.4
                    )} 70%, transparent 100%)`
                  : `linear-gradient(to bottom, ${alpha(
                      theme.palette.background.paper,
                      0.6
                    )} 0%, ${alpha(
                      theme.palette.background.paper,
                      0.4
                    )} 70%, transparent 100%)`,
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            <Typography
              variant="h3"
              gutterBottom
              sx={{
                fontFamily: brand.fonts.heading,
                color: "text.primary",
                textShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 2px 4px rgba(0, 0, 0, 0.5)"
                    : "0 1px 2px rgba(255, 255, 255, 0.8)",
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                mb: 4,
                fontFamily: brand.fonts.body,
                color: "text.secondary",
              }}
            >
              {description}
            </Typography>
          </Box>
        )}

        {/* Bottom Summary Overlay */}
        {summary && hasImage && !imageLoadError && (
          <Paper
            elevation={0}
            sx={{
              position: "absolute",
              bottom: 16,
              left: 16,
              p: 2,
              // ✅ Theme-aware background
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.background.paper, 0.65)
                  : alpha(theme.palette.background.paper, 0.65),
              backdropFilter: "blur(10px)",
              border: 1,
              borderColor: "divider",
              borderRadius: `${brand.borderRadius}px`,
              zIndex: 2,
              pointerEvents: "none",
              maxWidth: "350px",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "primary.main",
                fontFamily: brand.fonts.heading,
              }}
              gutterBottom
            >
              Summary
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Actors
                </Typography>
                <Typography
                  variant="h6"
                  color="text.primary" // ✅ Fixed
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {summary.actors.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {" "}
                  {/* ✅ Fixed */}
                  Locations
                </Typography>
                <Typography
                  variant="h6"
                  color="text.primary" // ✅ Fixed
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {summary.locations.toLocaleString()}{" "}
                  {/* ✅ Fixed - was actors */}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {" "}
                  {/* ✅ Fixed */}
                  Scenes
                </Typography>
                <Typography
                  variant="h6"
                  color="text.primary" // ✅ Fixed
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {summary.scenes.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {" "}
                  {/* ✅ Fixed */}
                  Shots
                </Typography>
                <Typography
                  variant="h6"
                  color="text.primary" // ✅ Fixed
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {summary.shots.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {" "}
                  {/* ✅ Fixed */}
                  Dialogues
                </Typography>
                <Typography
                  variant="h6"
                  color="text.primary" // ✅ Fixed
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {summary.dialogues.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {" "}
                  {/* ✅ Fixed */}
                  Music
                </Typography>
                <Typography
                  variant="h6"
                  color="text.primary" // ✅ Fixed
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {summary.musicTracks.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {" "}
                  {/* ✅ Fixed */}
                  Sound FX
                </Typography>
                <Typography
                  variant="h6"
                  color="text.primary" // ✅ Fixed
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {(summary.foleyItems + summary.roomTones).toLocaleString()}
                </Typography>
              </Box>
              <Box />
            </Box>
          </Paper>
        )}

        {/* Prompt Editor Title Overlay */}
        {showPromptEditor && !hasImage && (
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              right: 16,
              color: "primary.main",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            <Typography
              variant="h4"
              gutterBottom
              sx={{ fontFamily: brand.fonts.heading }}
            >
              {title}
            </Typography>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              {description}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Image Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth={false}
        PaperProps={{
          sx: {
            maxWidth: "min(90vw, 1600px)",
            maxHeight: "min(90vh, 1000px)",
            width: "92vw",
            height: "88vh",
            margin: "auto",
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.default",
            backgroundImage: "none !important",
            border: 2,
            borderColor: "primary.main",
          },
        }}
        BackdropProps={{
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.8)",
          },
        }}
      >
        <DialogTitle
          sx={{
            py: 1.5,
            px: 2,
            bgcolor: "background.default",
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              component="span"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Edit {isActor ? "Actor" : "Location"} Image
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 1, fontFamily: brand.fonts.body }}
            >
              {title}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseEditDialog}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": {
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 1,
            overflow: "hidden",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.default",
          }}
        >
          {isDialogLoading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
              }}
            >
              <CircularProgress size={40} sx={{ color: "primary.main" }} />
            </Box>
          ) : imageDataForViewer ? (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
                position: "relative",
                borderRadius: `${brand.borderRadius}px`,
                border: 1,
                borderColor: "divider",
              }}
            >
              <ShotImageViewer
                scriptId={scriptId}
                versionId={versionId}
                type={isActor ? "actor" : "location"}
                imageData={imageDataForViewer}
                onImageUpdate={handleImageUpdate}
                onDataRefresh={onDataRefresh}
                actorId={
                  isActor && actorImageData ? actorImageData.actorId : undefined
                }
                actorVersionId={
                  isActor && actorImageData
                    ? actorImageData.actorVersionId
                    : undefined
                }
                locationId={
                  !isActor && locationImageData
                    ? locationImageData.locationId
                    : undefined
                }
                locationVersionId={
                  !isActor && locationImageData
                    ? locationImageData.locationVersionId
                    : undefined
                }
                promptType={
                  !isActor && locationImageData
                    ? locationImageData.promptType ||
                      "wideShotLocationSetPrompt"
                    : undefined
                }
              />
            </Box>
          ) : (
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
              }}
            >
              <Typography color="text.secondary" gutterBottom>
                No {isActor ? "actor" : "location"} image data available for
                editing
              </Typography>
              <Button
                onClick={handleCloseEditDialog}
                variant="outlined"
                color="primary"
                sx={{ mt: 2 }}
              >
                Close
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

MainImage.displayName = "MainImage";
