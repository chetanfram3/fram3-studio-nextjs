// src/components/analysisLibrary/FeaturedProject.tsx
"use client";

import {
  useState,
  useEffect,
  Suspense,
  startTransition,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Skeleton,
  Chip,
  Fade,
  alpha,
  type Theme,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
} from "@mui/material";
import {
  VisibilityOutlined as ViewIcon,
  EditOutlined as EditIcon,
  AccessTimeOutlined as TimeIcon,
  PhotoCameraOutlined as ImageEditIcon,
  CloseOutlined as CloseIcon,
  LocalOfferOutlined as TagIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import NextImage from "next/image";
import { FavoriteButton } from "./FavouriteButton";
import { useScriptDashboardAnalysis } from "@/hooks/scripts/useScriptDashboardAnalysis";
import { ActorAvatars } from "@/components/common/ActorInfoAvatar";
import { ShotImageViewer } from "@/components/imageEditor/ShotImageViewer";
import type { Actor, ApiActorData, ApiResponse } from "@/types/overview/types";
import type { SxProps } from "@mui/system";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import logger from "@/utils/logger";

interface FeaturedProjectProps {
  title: string;
  brand?: string;
  productCategory?: string;
  version: string;
  createdAt: number;
  lastModifiedAt: number;
  signedUrl?: string;
  scriptId: string;
  versionId: string;
  favourite: boolean;
  onView: () => void;
  onEdit: () => void;
}

interface KeyVisualData {
  signedUrl?: string;
  thumbnailPath?: string;
  versions?: {
    current?: {
      version: number;
      signedUrl: string;
      thumbnailPath: string;
      isCurrent: boolean;
      destinationPath?: string;
      lastEditedAt?: string | null;
    };
    archived?: Record<string, unknown>;
    totalVersions: number;
    totalEdits: number;
    editHistory?: unknown[];
  };
}

// ✅ CORRECT: Original theme-aware styles
const styles = {
  paper: (theme: Theme): SxProps => ({
    position: "relative",
    borderRadius: 2,
    overflow: "hidden",
    mb: 4,
    border: `2px solid ${theme.palette.primary.main}`,
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    "&:hover": {
      transform: "translateY(-5px)",
      boxShadow: theme.shadows[10],
    },
  }),
  imageContainer: (theme: Theme): SxProps => ({
    position: "relative",
    paddingTop: "56.25%",
    width: "100%",
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: theme.palette.background.default,
  }),
  image: (aspectRatio: number | null) => ({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: aspectRatio !== null && aspectRatio >= 1 ? "cover" : "contain",
    transition: "transform 0.6s ease, opacity 0.3s ease",
    "&:hover": {
      transform: "scale(1.05)",
    },
  }),
  imageLoader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 2,
  },
  overlay: (theme: Theme): SxProps => ({
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    p: 3,
    // ✅ Theme-aware gradient overlay
    background:
      theme.palette.mode === "dark"
        ? // Dark mode: Dark overlay with good contrast
          `linear-gradient(to top, ${alpha(
            theme.palette.background.default,
            0.95
          )} 0%, ${alpha(theme.palette.background.default, 0.85)} 70%, ${alpha(
            theme.palette.background.default,
            0.4
          )} 100%)`
        : // Light mode: Light overlay for better readability
          `linear-gradient(to top, ${alpha(
            theme.palette.background.paper,
            0.98
          )} 0%, ${alpha(theme.palette.background.paper, 0.92)} 70%, ${alpha(
            theme.palette.background.paper,
            0.5
          )} 100%)`,
    // ✅ Use theme text color
    color: theme.palette.text.primary,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  }),
  actionButtons: {
    position: "absolute",
    bottom: 16,
    right: 16,
    display: "flex",
    gap: 1,
    alignItems: "center",
  },
  actionButton: (theme: Theme): SxProps => ({
    color: theme.palette.text.primary,
    width: 42,
    height: 42,
    // ✅ Theme-aware button background
    backgroundColor:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.background.paper, 0.5)
        : alpha(theme.palette.background.paper, 0.8),
    backdropFilter: "blur(5px)",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.8),
      transform: "scale(1.1)",
    },
  }),
  editImageButton: (theme: Theme): SxProps => ({
    position: "absolute",
    top: 16,
    right: 60,
    color: theme.palette.text.primary,
    width: 36,
    height: 36,
    // ✅ Theme-aware button background
    backgroundColor:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.background.paper, 0.5)
        : alpha(theme.palette.background.paper, 0.8),
    backdropFilter: "blur(5px)",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.8),
      transform: "scale(1.1)",
    },
  }),
  brandChip: (theme: Theme): SxProps => ({
    position: "absolute",
    top: 16,
    left: 16,
    backdropFilter: "blur(5px)",
    color: theme.palette.primary.main,
    // ✅ Theme-aware chip background
    background:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.background.paper, 0.7)
        : alpha(theme.palette.background.paper, 0.9),
    fontWeight: "bold",
    fontFamily: getCurrentBrand().fonts.body,
  }),
  versionChip: (theme: Theme): SxProps => ({
    position: "absolute",
    top: 16,
    right: 16,
    backdropFilter: "blur(5px)",
    color: theme.palette.primary.main,
    // ✅ Theme-aware chip background
    background:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.background.paper, 0.7)
        : alpha(theme.palette.background.paper, 0.9),
    fontWeight: "bold",
    fontFamily: getCurrentBrand().fonts.body,
  }),
  metaContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    mt: 1,
  },
  metadata: (theme: Theme): SxProps => ({
    display: "flex",
    alignItems: "center",
    gap: 0.5,
    mt: 0.5,
    color: theme.palette.text.secondary,
  }),
  dialog: {
    "& .MuiDialog-paper": {
      maxWidth: "min(90vw, 1600px)",
      maxHeight: "min(90vh, 1000px)",
      width: "92vw",
      height: "88vh",
      margin: "auto",
      borderRadius: 1,
    },
  },
  dialogContent: (theme: Theme): SxProps => ({
    p: 1,
    overflow: "hidden",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: theme.palette.background.default,
  }),
  shotImageViewerContainer: (theme: Theme): SxProps => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
    position: "relative",
    borderRadius: 1,
    border: 1,
    borderColor: theme.palette.divider,
  }),
  dialogTitle: (theme: Theme): SxProps => ({
    py: 1.5,
    px: 2,
    backgroundColor: theme.palette.background.default,
    borderBottom: 1,
    borderColor: theme.palette.divider,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }),
  emptyStateContainer: {
    p: 4,
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
} as const;

// ===========================
// UTILITY FUNCTIONS
// ===========================

const getTimeAgo = (timestamp: number): string => {
  try {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000)
      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  } catch (e) {
    logger.error("Error calculating time ago:", e);
    return "Unknown time";
  }
};

const formatDate = (timestamp: number): string => {
  try {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    logger.error("Error formatting date:", e);
    return "Invalid date";
  }
};

const extractActors = (data: Record<string, unknown> | undefined): Actor[] => {
  if (!data) return [];

  const actors: Actor[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (
      key === "keyVisualSignedUrl" ||
      key === "keyVisualThumbnailPath" ||
      key === "keyVisualVersions"
    )
      return;

    if (value && typeof value === "object" && "actorName" in value) {
      const apiActor = value as ApiActorData;

      const actor: Actor = {
        actorName: apiActor.actorName,
        actorId: apiActor.actorId,
        actorVersionId: apiActor.actorVersionId,
        actorArchetype: apiActor.actorArchetype,
        actorType: apiActor.actorType,
        sceneIds: apiActor.sceneIds,
        gender: apiActor.gender,
        celebrity: {
          celebrityName: "",
          celebrityDetails: {
            fame: "",
          },
          isCelebrity: apiActor.celebrity?.isCelebrity || "No",
        },
        signedUrl: apiActor.signedUrl || "",
        signedProfileUrl: apiActor.signedProfileUrl || undefined,
        faceDetection: apiActor.faceDetection || undefined,
        thumbnailPath: apiActor.thumbnailPath,
        versions: apiActor.versions,
      };

      actors.push(actor);
    }
  });

  return actors;
};

// ===========================
// IMAGE COMPONENT WITH OPTIMIZATION
// ===========================

interface OptimizedImageProps {
  src: string;
  alt: string;
  aspectRatio: number | null;
  onError: () => void;
  onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  isLoading: boolean;
}

function OptimizedImage({
  src,
  alt,
  aspectRatio,
  onError,
  onLoad,
  isLoading,
}: OptimizedImageProps) {
  if (!src || src === "/placeHolder.webp") {
    return (
      <Box
        component="img"
        src="/placeHolder.webp"
        alt={alt}
        sx={styles.image(aspectRatio)}
      />
    );
  }

  // Use Next.js Image for local images
  return (
    <NextImage
      src={src}
      alt={alt}
      fill
      style={{
        objectFit:
          aspectRatio !== null && aspectRatio >= 1 ? "cover" : "contain",
        opacity: isLoading ? 0.7 : 1,
        transition: "opacity 0.3s ease, transform 0.6s ease",
      }}
      priority={true}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
      onError={onError}
      quality={85}
    />
  );
}

// ===========================
// ACTORS SECTION WITH SUSPENSE
// ===========================

function ActorsSection({
  data,
}: {
  data: Record<string, unknown> | undefined;
}) {
  const actors = extractActors(data);

  if (actors.length === 0) {
    return null;
  }

  return <ActorAvatars actors={actors} />;
}

// ===========================
// MAIN COMPONENT
// ===========================

export function FeaturedProject({
  title,
  brand,
  productCategory,
  version,
  createdAt,
  lastModifiedAt,
  signedUrl,
  scriptId,
  versionId,
  favourite,
  onView,
  onEdit,
}: FeaturedProjectProps) {
  const theme = useTheme();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // State management
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [localKeyVisualData, setLocalKeyVisualData] =
    useState<KeyVisualData | null>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState("/placeHolder.webp");
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  // Parallel data fetching
  const { data, isLoading, refetch } = useScriptDashboardAnalysis<ApiResponse>(
    scriptId,
    versionId,
    "actorInfo"
  );

  // Detect image aspect ratio
  const detectImageAspectRatio = useCallback((imgElement: HTMLImageElement) => {
    if (imgElement.naturalWidth && imgElement.naturalHeight) {
      const ratio = imgElement.naturalWidth / imgElement.naturalHeight;
      setImageAspectRatio(ratio);
      logger.debug(
        "Image aspect ratio detected:",
        ratio,
        ratio >= 1 ? "landscape (cover)" : "portrait (contain)"
      );
    }
  }, []);

  // Check if edit is available
  const canEditKeyVisual = useMemo(() => {
    return !!(
      (localKeyVisualData &&
        (localKeyVisualData.signedUrl || localKeyVisualData.thumbnailPath)) ||
      (data && (data.keyVisualSignedUrl || data.keyVisualThumbnailPath)) ||
      (signedUrl &&
        signedUrl.trim() !== "" &&
        signedUrl !== "/placeHolder.webp") ||
      (currentImageSrc && currentImageSrc !== "/placeHolder.webp")
    );
  }, [localKeyVisualData, data, signedUrl, currentImageSrc]);

  const shouldShowEditButton = canEditKeyVisual && !isImageLoading;
  const isEditButtonDisabled =
    isImageLoading || (!localKeyVisualData && isLoading);

  // Effect 1: Update key visual data from API (parallel with image loading)
  useEffect(() => {
    if (data) {
      const newKeyVisualData = {
        signedUrl: data.keyVisualSignedUrl || signedUrl || undefined,
        thumbnailPath: data.keyVisualThumbnailPath || signedUrl || undefined,
        versions: data.keyVisualVersions || undefined,
      };

      setLocalKeyVisualData(newKeyVisualData);

      // Progressive image loading: show thumbnail first, then high-res
      const thumbnailUrl = newKeyVisualData.thumbnailPath;
      const highResUrl =
        newKeyVisualData.versions?.current?.signedUrl ||
        newKeyVisualData.signedUrl;

      if (thumbnailUrl) {
        setCurrentImageSrc(thumbnailUrl);
        setIsImageLoading(false);

        // Detect aspect ratio from thumbnail
        const thumbImg = new Image();
        thumbImg.onload = () => detectImageAspectRatio(thumbImg);
        thumbImg.src = thumbnailUrl;

        // Preload high-res in background
        if (highResUrl && highResUrl !== thumbnailUrl) {
          setIsImageLoading(true);
          const img = new Image();
          img.onload = () => {
            startTransition(() => {
              setCurrentImageSrc(highResUrl);
              setIsImageLoading(false);
              detectImageAspectRatio(img);
            });
          };
          img.onerror = () => setIsImageLoading(false);
          img.src = highResUrl;
        }
      } else if (highResUrl) {
        setIsImageLoading(true);
        setCurrentImageSrc(highResUrl);
      }
    }
  }, [data, signedUrl, detectImageAspectRatio]);

  // Effect 2: Fallback data when no API data
  useEffect(() => {
    if (
      !data &&
      !localKeyVisualData &&
      signedUrl &&
      signedUrl.trim() !== "" &&
      signedUrl !== "/placeHolder.webp"
    ) {
      setLocalKeyVisualData({
        signedUrl: signedUrl,
        thumbnailPath: signedUrl,
        versions: {
          current: {
            version: 1,
            signedUrl: signedUrl,
            thumbnailPath: signedUrl,
            isCurrent: true,
            destinationPath: signedUrl,
            lastEditedAt: new Date().toISOString(),
          },
          archived: {},
          totalVersions: 1,
          totalEdits: 0,
          editHistory: [],
        },
      });

      const img = new Image();
      img.onload = () => detectImageAspectRatio(img);
      img.src = signedUrl;
    }
  }, [data, signedUrl, localKeyVisualData, detectImageAspectRatio]);

  // Effect 3: Reset on script change
  useEffect(() => {
    setImageError(false);
    setLocalKeyVisualData(null);
    setImageAspectRatio(null);

    const immediateUrl =
      signedUrl && signedUrl.trim() !== "" ? signedUrl : "/placeHolder.webp";
    setCurrentImageSrc(immediateUrl);
    logger.debug(`Script changed to ${scriptId}, showing:`, immediateUrl);
  }, [scriptId, signedUrl]);

  // Effect 4: Intersection Observer for visibility-based refetch
  useEffect(() => {
    const currentElement = document.querySelector(
      `[data-script-id="${scriptId}"]`
    );

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          refetch();
        }
      },
      { threshold: 0.1 }
    );

    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [scriptId, refetch]);

  // Effect 5: Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isEditDialogOpen) {
        setIsEditDialogOpen(false);
        setIsDialogLoading(false);
      }
    };

    if (isEditDialogOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isEditDialogOpen]);

  // Event handlers
  const handleViewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onView();
  };

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit();
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (localKeyVisualData) {
      setIsDialogLoading(true);
      setIsEditDialogOpen(true);
      setTimeout(() => setIsDialogLoading(false), 100);
    }
  };

  const handleEditImageClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !localKeyVisualData &&
      (signedUrl || currentImageSrc !== "/placeHolder.webp")
    ) {
      setLocalKeyVisualData({
        signedUrl: signedUrl || currentImageSrc,
        thumbnailPath: signedUrl || currentImageSrc,
        versions: {
          current: {
            version: 1,
            signedUrl: signedUrl || currentImageSrc,
            thumbnailPath: signedUrl || currentImageSrc,
            isCurrent: true,
            destinationPath: signedUrl || currentImageSrc,
            lastEditedAt: new Date().toISOString(),
          },
          archived: {},
          totalVersions: 1,
          totalEdits: 0,
          editHistory: [],
        },
      });
    }

    setIsDialogLoading(true);
    setIsEditDialogOpen(true);
    setTimeout(() => setIsDialogLoading(false), 100);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setIsDialogLoading(false);

    setTimeout(() => {
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["scriptDashboardAnalysis", scriptId, versionId, user?.uid],
      });
    }, 500);
  };

  const handleKeyVisualUpdate = useCallback(() => {
    // Don't interfere with ShotImageViewer's internal updates
  }, []);

  const handleDataRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleImageError = () => {
    logger.error("Image failed to load");
    setImageError(true);
    setIsImageLoading(false);
    setCurrentImageSrc("/placeHolder.webp");
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    logger.debug("Image loaded:", currentImageSrc);
    setIsImageLoading(false);
    detectImageAspectRatio(e.currentTarget);
  };

  return (
    <>
      <Paper
        elevation={isHovered ? 8 : 3}
        sx={styles.paper(theme)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-script-id={scriptId}
      >
        <Box sx={styles.imageContainer(theme)} onClick={handleImageClick}>
          {isImageLoading && (
            <Box sx={styles.imageLoader}>
              <CircularProgress size={40} color="primary" />
            </Box>
          )}

          <OptimizedImage
            src={currentImageSrc}
            alt={title || "Project thumbnail"}
            aspectRatio={imageAspectRatio}
            onError={handleImageError}
            onLoad={handleImageLoad}
            isLoading={isImageLoading}
          />

          {brand && (
            <Chip
              icon={<TagIcon />}
              label={`${brand}${productCategory ? ` · ${productCategory}` : ""}`}
              size="small"
              sx={styles.brandChip(theme)}
            />
          )}

          <Chip
            label={version || "N/A"}
            size="small"
            sx={styles.versionChip(theme)}
          />

          {shouldShowEditButton && (
            <Fade in={isHovered} timeout={200}>
              <Tooltip
                title={
                  isImageLoading
                    ? "Loading high-resolution image..."
                    : localKeyVisualData
                      ? "Edit Key Visual"
                      : isLoading
                        ? "Loading editor..."
                        : "Edit Key Visual"
                }
                arrow
              >
                <IconButton
                  onClick={handleEditImageClick}
                  sx={{
                    ...styles.editImageButton(theme),
                    opacity: isEditButtonDisabled ? 0.5 : 1,
                    cursor: isEditButtonDisabled ? "wait" : "pointer",
                  }}
                  aria-label="Edit key visual"
                  disabled={isEditButtonDisabled}
                >
                  <ImageEditIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Fade>
          )}
        </Box>

        <Fade in={true} timeout={500}>
          <Box sx={styles.overlay(theme)}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {title || "Untitled Project"}
            </Typography>

            <Box sx={styles.metaContainer}>
              <Box>
                <Box sx={styles.metadata(theme)}>
                  <TimeIcon fontSize="small" />
                  <Typography variant="caption">
                    Created: {formatDate(createdAt)}
                  </Typography>
                </Box>

                <Box sx={styles.metadata(theme)}>
                  <TimeIcon fontSize="small" />
                  <Typography variant="caption" sx={{ fontWeight: "medium" }}>
                    Updated: {getTimeAgo(lastModifiedAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Fade>

        <Box sx={styles.actionButtons}>
          <Suspense fallback={null}>
            <ActorsSection data={data} />
          </Suspense>
          <Tooltip title="View Details" arrow>
            <IconButton
              onClick={handleViewClick}
              sx={styles.actionButton(theme)}
              aria-label="View project details"
            >
              <ViewIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Script" arrow>
            <IconButton
              onClick={handleEditClick}
              sx={styles.actionButton(theme)}
              aria-label="Edit project"
            >
              <EditIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <FavoriteButton scriptId={scriptId} initialFavorite={favourite} />
        </Box>
      </Paper>

      {/* KeyVisual Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth={false}
        sx={styles.dialog}
      >
        <DialogTitle sx={styles.dialogTitle(theme)}>
          <Typography variant="h6">Edit Key Visual</Typography>
          <IconButton
            onClick={handleCloseEditDialog}
            size="small"
            aria-label="Close dialog"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={styles.dialogContent(theme)}>
          <Suspense
            fallback={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <CircularProgress size={40} color="primary" />
              </Box>
            }
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
                <CircularProgress size={40} color="primary" />
              </Box>
            ) : localKeyVisualData ? (
              <Box sx={styles.shotImageViewerContainer(theme)}>
                <ShotImageViewer
                  scriptId={scriptId}
                  versionId={versionId}
                  type="keyVisual"
                  imageData={{
                    signedUrl: localKeyVisualData.signedUrl,
                    thumbnailPath: localKeyVisualData.thumbnailPath,
                    versions: localKeyVisualData.versions as any,
                  }}
                  onImageUpdate={handleKeyVisualUpdate}
                  onDataRefresh={handleDataRefresh}
                />
              </Box>
            ) : (
              <Box sx={styles.emptyStateContainer}>
                <Typography color="text.secondary" gutterBottom>
                  No key visual data available for editing
                </Typography>
                <Button
                  onClick={handleCloseEditDialog}
                  variant="outlined"
                  sx={{ mt: 2 }}
                >
                  Close
                </Button>
              </Box>
            )}
          </Suspense>
        </DialogContent>
      </Dialog>
    </>
  );
}

FeaturedProject.displayName = "FeaturedProject";

// Enhanced Skeleton component
export function FeaturedProjectSkeleton() {
  const theme = useTheme();
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((prev) => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Paper elevation={3} sx={styles.paper(theme)}>
      <Box sx={styles.imageContainer(theme)}>
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: pulse ? 0.8 : 0.6,
            transition: "opacity 1.5s ease",
          }}
        />

        <Skeleton
          variant="rounded"
          width={120}
          height={32}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
          }}
        />

        <Skeleton
          variant="rounded"
          width={60}
          height={32}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
          }}
        />
      </Box>

      <Box sx={styles.overlay(theme)}>
        <Skeleton width="60%" height={32} sx={{ mb: 1 }} />

        <Box sx={styles.metaContainer}>
          <Box>
            <Skeleton width="120px" height={24} />
            <Skeleton width="160px" height={24} />
          </Box>

          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      </Box>

      <Box sx={styles.actionButtons}>
        <Skeleton variant="circular" width={42} height={42} sx={{ mr: 1 }} />
        <Skeleton variant="circular" width={42} height={42} sx={{ mr: 1 }} />
        <Skeleton variant="circular" width={42} height={42} />
      </Box>
    </Paper>
  );
}

FeaturedProjectSkeleton.displayName = "FeaturedProjectSkeleton";
