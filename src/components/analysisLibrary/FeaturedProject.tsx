// src/components/analysisLibrary/FeaturedProject.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  LocalOfferOutlined as TagIcon,
  PhotoCameraOutlined as ImageEditIcon,
  CloseOutlined as CloseIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { FavoriteButton } from "./FavouriteButton";
import { useScriptDashboardAnalysis } from "@/hooks/scripts/useScriptDashboardAnalysis";
import { ActorAvatars } from "@/components/common/ActorInfoAvatar";
import { ShotImageViewer } from "@/components/imageEditor/ShotImageViewer";
import type { Actor, ApiResponse, ApiActorData } from "@/types/overview/types";
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

// Enhanced styles object with animations and visual improvements
const styles = {
  paper: (theme: Theme): SxProps => ({
    position: "relative",
    borderRadius: 2,
    overflow: "hidden",
    mb: 4,
    border: `2px solid ${theme.palette.secondary.main}`,
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    "&:hover": {
      transform: "translateY(-5px)",
      boxShadow: theme.shadows[10],
    },
  }),
  imageContainer: {
    position: "relative",
    paddingTop: "56.25%", // 16:9 Aspect Ratio
    width: "100%",
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "black", // Black background for object-fit: contain
  },
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
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    p: 3,
    background:
      "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.4) 100%)",
    color: "white",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  actionButtons: {
    position: "absolute",
    bottom: 16,
    right: 16,
    display: "flex",
    gap: 1,
    alignItems: "center",
  },
  actionButton: (theme: Theme): SxProps => ({
    color: "white",
    width: 42,
    height: 42,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(5px)",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: theme.palette.divider,
      transform: "scale(1.1)",
    },
  }),
  editImageButton: (theme: Theme): SxProps => ({
    position: "absolute",
    top: 16,
    right: 60,
    color: "white",
    width: 36,
    height: 36,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(5px)",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: alpha(theme.palette.secondary.main, 0.8),
      transform: "scale(1.1)",
    },
  }),
  brandChip: (theme: Theme): SxProps => ({
    position: "absolute",
    top: 16,
    left: 16,
    backdropFilter: "blur(5px)",
    color: theme.palette.primary.main,
    background: alpha(theme.palette.primary.contrastText, 0.4),
    fontWeight: "bold",
  }),
  versionChip: (theme: Theme): SxProps => ({
    position: "absolute",
    top: 16,
    right: 16,
    backdropFilter: "blur(5px)",
    color: theme.palette.primary.main,
    background: alpha(theme.palette.primary.contrastText, 0.4),
    fontWeight: "bold",
  }),
  metaContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    mt: 1,
  },
  metadata: {
    display: "flex",
    alignItems: "center",
    gap: 0.5,
    mt: 0.5,
  },
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
  dialogContent: {
    p: 1,
    overflow: "hidden",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "background.default",
  },
  shotImageViewerContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
    position: "relative",
    borderRadius: 1,
    border: 1,
    borderColor: "divider",
  },
  dialogTitle: {
    py: 1.5,
    px: 2,
    backgroundColor: "background.default",
    borderBottom: 1,
    borderColor: "divider",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
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

export const FeaturedProject: React.FC<FeaturedProjectProps> = React.memo(
  ({
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
  }) => {
    const theme = useTheme();
    const [isHovered, setIsHovered] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDialogLoading, setIsDialogLoading] = useState(false);
    const [currentImageSrc, setCurrentImageSrc] =
      useState<string>("/placeHolder.webp");
    const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(
      null
    );

    // Use the correct type that matches ShotImageViewer's imageData prop
    const [localKeyVisualData, setLocalKeyVisualData] = useState<{
      signedUrl?: string;
      thumbnailPath?: string;
      versions?: {
        current: {
          version: number;
          signedUrl: string;
          thumbnailPath: string;
          isCurrent: boolean;
          destinationPath?: string;
          lastEditedAt?: string | null;
        };
        archived: Record<number, unknown>;
        totalVersions?: number;
        totalEdits?: number;
        editHistory?: unknown[];
      };
    } | null>(null);

    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    // Fetch data with optimized stale time
    const { data, error, isLoading, refetch } =
      useScriptDashboardAnalysis<ApiResponse>(scriptId, versionId, "actorInfo");

    // Function to detect image aspect ratio
    const detectImageAspectRatio = useCallback(
      (imgElement: HTMLImageElement) => {
        if (imgElement.naturalWidth && imgElement.naturalHeight) {
          const ratio = imgElement.naturalWidth / imgElement.naturalHeight;
          setImageAspectRatio(ratio);
          logger.debug(
            "FeaturedProject: Image aspect ratio detected:",
            ratio,
            ratio >= 1 ? "landscape (cover)" : "portrait (contain)"
          );
        }
      },
      []
    );

    const canEditKeyVisual = useMemo(() => {
      // Check if we have any valid image source (in order of preference)
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

    // FIXED: Main data effect - handles API data when available
    useEffect(() => {
      logger.debug("FeaturedProject: Data effect triggered", {
        data,
        signedUrl,
        isLoading,
      });

      if (data) {
        // Use API data when available
        const newKeyVisualData = {
          signedUrl: data.keyVisualSignedUrl || signedUrl || undefined,
          thumbnailPath: data.keyVisualThumbnailPath || signedUrl || undefined,
          versions: data.keyVisualVersions
            ? {
                current: {
                  version: data.keyVisualVersions.current.version,
                  signedUrl: data.keyVisualVersions.current.signedUrl,
                  thumbnailPath: data.keyVisualVersions.current.thumbnailPath,
                  isCurrent: data.keyVisualVersions.current.isCurrent,
                  destinationPath:
                    data.keyVisualVersions.current.destinationPath,
                  lastEditedAt: data.keyVisualVersions.current.lastEditedAt,
                },
                archived: data.keyVisualVersions.archived,
                totalVersions: data.keyVisualVersions.totalVersions,
                totalEdits: data.keyVisualVersions.totalEdits,
                editHistory: data.keyVisualVersions.editHistory,
              }
            : undefined,
        };

        setLocalKeyVisualData(newKeyVisualData);
        logger.debug(
          "FeaturedProject: Updated keyVisual data from API:",
          newKeyVisualData
        );

        // Handle image progression
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

          if (highResUrl && highResUrl !== thumbnailUrl) {
            setIsImageLoading(true);
            const img = new Image();
            img.onload = () => {
              setCurrentImageSrc(highResUrl);
              setIsImageLoading(false);
              detectImageAspectRatio(img);
            };
            img.onerror = () => setIsImageLoading(false);
            img.src = highResUrl;
          }
        } else if (highResUrl) {
          setIsImageLoading(true);
          setCurrentImageSrc(highResUrl);
        } else {
          // FIXED: API returned no image data
          setIsImageLoading(false);
          setCurrentImageSrc("/placeHolder.webp");
        }
      } else if (!isLoading && !data) {
        // FIXED: API finished loading but returned no data
        setIsImageLoading(false);
      }
    }, [data, signedUrl, isLoading, detectImageAspectRatio]);

    // FIXED: Separate effect for fallback data (only runs when no API data AND no local data)
    useEffect(() => {
      // Only create fallback if we have no API data and no local data
      if (
        !data &&
        !localKeyVisualData &&
        signedUrl &&
        signedUrl.trim() !== "" &&
        signedUrl !== "/placeHolder.webp"
      ) {
        const fallbackData = {
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
        };

        logger.debug(
          "FeaturedProject: Using fallback data from props:",
          fallbackData
        );
        setLocalKeyVisualData(fallbackData);

        // Detect aspect ratio from fallback image
        const img = new Image();
        img.onload = () => detectImageAspectRatio(img);
        img.src = signedUrl;
      }
    }, [data, signedUrl, localKeyVisualData, detectImageAspectRatio]);

    // FIXED: Reset when scriptId changes - properly handle empty strings
    useEffect(() => {
      setImageError(false);
      setLocalKeyVisualData(null);
      setImageAspectRatio(null);

      // FIXED: Handle empty strings properly and set loading state
      const immediateUrl =
        signedUrl && signedUrl.trim() !== "" ? signedUrl : "/placeHolder.webp";

      // Set loading state if we're expecting API data
      const shouldLoadFromApi = !signedUrl || signedUrl.trim() === "";
      setIsImageLoading(shouldLoadFromApi);

      setCurrentImageSrc(immediateUrl);
      logger.debug(
        `FeaturedProject: Script changed to ${scriptId}, showing:`,
        immediateUrl,
        `shouldLoadFromApi: ${shouldLoadFromApi}`
      );
    }, [scriptId, signedUrl, user?.uid]);

    // Keyboard shortcut for better UX
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

    // Force refetch when component becomes visible
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
    }, [scriptId, refetch, user?.uid]);

    // ENHANCED: Ensure edit button appears as soon as any image data is available
    useEffect(() => {
      // Force re-evaluation of canEditKeyVisual when key dependencies change
      logger.debug("FeaturedProject: Edit availability check", {
        hasLocalData: !!localKeyVisualData,
        hasApiData: !!data,
        hasSignedUrl: !!signedUrl,
        currentSrc: currentImageSrc,
        canEdit: canEditKeyVisual,
      });
    }, [
      localKeyVisualData,
      data,
      signedUrl,
      currentImageSrc,
      canEditKeyVisual,
    ]);

    // Calculate time since last modification
    const getTimeAgo = (timestamp: number): string => {
      try {
        const now = new Date();
        const date = new Date(timestamp);
        const diffInSeconds = Math.floor(
          (now.getTime() - date.getTime()) / 1000
        );

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
        logger.error("FeaturedProject: Error calculating time ago:", e);
        return "Unknown time";
      }
    };

    // Safe date formatting with fallback
    const formatDate = (timestamp: number): string => {
      try {
        return new Date(timestamp).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch (e) {
        logger.error("FeaturedProject: Error formatting date:", e);
        return "Invalid date";
      }
    };

    // Event handlers
    const handleViewClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
      e.preventDefault();
      e.stopPropagation();
      onView();
    };

    const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
      e.preventDefault();
      e.stopPropagation();
      onEdit();
    };

    const handleImageClick = (e: React.MouseEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      if (localKeyVisualData) {
        setIsDialogLoading(true);
        setIsEditDialogOpen(true);
        setTimeout(() => setIsDialogLoading(false), 100);
      }
    };

    const handleEditImageClick = (
      e: React.MouseEvent<HTMLButtonElement>
    ): void => {
      e.preventDefault();
      e.stopPropagation();

      // Enhanced: Create minimal data structure if none exists
      if (
        !localKeyVisualData &&
        (signedUrl || currentImageSrc !== "/placeHolder.webp")
      ) {
        const fallbackData = {
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
        };

        logger.debug(
          "FeaturedProject: Creating fallback data for edit dialog:",
          fallbackData
        );
        setLocalKeyVisualData(fallbackData);
      }

      setIsDialogLoading(true);
      setIsEditDialogOpen(true);
      setTimeout(() => setIsDialogLoading(false), 100);
    };

    const handleCloseEditDialog = (): void => {
      setIsEditDialogOpen(false);
      setIsDialogLoading(false);

      // Refresh API data when dialog closes to sync any changes
      setTimeout(() => {
        logger.debug(
          "FeaturedProject: Dialog closed, refreshing API data now..."
        );
        refetch();
        queryClient.invalidateQueries({ queryKey: ["scripts"] });
      }, 500);
    };

    // CRITICAL: Enhanced keyVisual update handler
    const handleKeyVisualUpdate = useCallback(
      (updatedImageData: {
        newCurrentImagePath?: string;
        signedUrl?: string;
        newThumbnailPath?: string;
        thumbnailPath?: string;
        newCurrentVersion?: number;
        versions?: {
          current?: { version: number };
          archived?: Record<number, unknown>;
          totalVersions?: number;
          totalEdits?: number;
          editHistory?: unknown[];
        };
      }) => {
        logger.debug(
          "FeaturedProject: KeyVisual updated with data:",
          updatedImageData
        );

        // Extract URLs from the API response
        const newHighResUrl =
          updatedImageData.newCurrentImagePath || updatedImageData.signedUrl;
        const newThumbnailPath =
          updatedImageData.newThumbnailPath || updatedImageData.thumbnailPath;

        logger.debug(
          "FeaturedProject: Extracted URLs - highRes:",
          newHighResUrl,
          "thumbnail:",
          newThumbnailPath
        );

        // Create data structure that will trigger ShotImageViewer's high-res loading
        const newKeyVisualData = {
          signedUrl: newHighResUrl,
          thumbnailPath: newThumbnailPath,
          versions: {
            current: {
              version:
                updatedImageData.newCurrentVersion ||
                updatedImageData.versions?.current?.version ||
                1,
              signedUrl: newHighResUrl || "",
              thumbnailPath: newThumbnailPath || "",
              isCurrent: true,
              destinationPath: newHighResUrl || "",
              lastEditedAt: new Date().toISOString(),
            },
            archived: updatedImageData.versions?.archived || {},
            totalVersions: updatedImageData.versions?.totalVersions || 1,
            totalEdits: updatedImageData.versions?.totalEdits || 1,
            editHistory: updatedImageData.versions?.editHistory || [],
          },
        };

        logger.debug(
          "FeaturedProject: Setting keyVisual data to trigger ShotImageViewer high-res loading:",
          newKeyVisualData
        );
        setLocalKeyVisualData(newKeyVisualData);

        logger.debug(
          "FeaturedProject: Edit completed, NOT refreshing API data to avoid interfering with ShotImageViewer"
        );
      },
      []
    );

    // Handle data refresh
    const handleDataRefresh = useCallback(() => {
      refetch();
    }, [refetch]);

    // Extract actors from the API response
    const extractActors = (): Actor[] => {
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
              celebrityDetails: {},
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

    // Render actor avatars
    const renderActorAvatars = () => {
      if (!data) {
        return null;
      }

      const actors = extractActors();

      if (actors.length === 0) {
        return null;
      }

      return <ActorAvatars actors={actors} />;
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
          <Box sx={styles.imageContainer} onClick={handleImageClick}>
            {isImageLoading && (
              <Box sx={styles.imageLoader}>
                <CircularProgress size={40} color="secondary" />
              </Box>
            )}

            <Box
              component="img"
              src={currentImageSrc}
              alt={title || "Project thumbnail"}
              sx={{
                ...styles.image(imageAspectRatio),
                opacity: isImageLoading ? 0.7 : 1,
                filter: isImageLoading ? "blur(2px)" : "none",
                transition: "opacity 0.3s ease, filter 0.3s ease",
              }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                logger.error(
                  "FeaturedProject: Image failed to load, setting error state"
                );
                setImageError(true);
                setIsImageLoading(false);
                e.currentTarget.src = "/placeHolder.webp";
              }}
              onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
                logger.debug(
                  "FeaturedProject: Image onLoad triggered for:",
                  currentImageSrc
                );
                setIsImageLoading(false);
                detectImageAspectRatio(e.currentTarget);
              }}
            />

            {brand && (
              <Chip
                icon={<TagIcon />}
                label={`${brand}${
                  productCategory ? ` · ${productCategory}` : ""
                }`}
                size="small"
                sx={styles.brandChip(theme)}
              />
            )}

            <Chip
              label={`${version || "N/A"}`}
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
            <Box sx={styles.overlay}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {title || "Untitled Project"}
              </Typography>

              <Box sx={styles.metaContainer}>
                <Box>
                  <Box sx={styles.metadata}>
                    <TimeIcon fontSize="small" />
                    <Typography variant="caption" color="grey.300">
                      Created: {formatDate(createdAt)}
                    </Typography>
                  </Box>

                  <Box sx={styles.metadata}>
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
            {renderActorAvatars()}
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

        {/* Edit Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          maxWidth={false}
          sx={styles.dialog}
        >
          <DialogTitle sx={styles.dialogTitle}>
            <Typography variant="h6">Edit Key Visual</Typography>
            <IconButton
              onClick={handleCloseEditDialog}
              size="small"
              aria-label="Close dialog"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={styles.dialogContent}>
            {isDialogLoading ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <CircularProgress size={40} color="secondary" />
              </Box>
            ) : localKeyVisualData ? (
              <Box sx={styles.shotImageViewerContainer}>
                <ShotImageViewer
                  scriptId={scriptId}
                  versionId={versionId}
                  type="keyVisual"
                  imageData={{
                    signedUrl: localKeyVisualData.signedUrl,
                    thumbnailPath: localKeyVisualData.thumbnailPath,
                    versions: localKeyVisualData.versions as never,
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
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

FeaturedProject.displayName = "FeaturedProject";

// Enhanced Skeleton component with smooth animations
export const FeaturedProjectSkeleton: React.FC = () => {
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
      <Box sx={styles.imageContainer}>
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

      <Box sx={styles.overlay}>
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
};

FeaturedProjectSkeleton.displayName = "FeaturedProjectSkeleton";
