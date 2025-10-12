"use client";

// ShotImageViewer.tsx - Performance-optimized with proper type safety
import { useCallback, useMemo } from "react";
import { ImageViewerContainer, ImageData } from "./ImageViewerContainer";
import { ImageViewerConfig } from "./ImageDisplayCore";
import { Shot } from "@/types/storyBoard/types";

interface ShotImageViewerProps {
  shot?: Shot;
  sceneId?: number;
  scriptId?: string;
  versionId?: string;
  onDataRefresh?: () => void;
  onShotUpdate?: (updatedShot: Shot) => void;
  type: "shots" | "keyVisual" | "actor" | "location";
  imageData?: ImageData;
  onImageUpdate?: (updatedImageData: ImageData) => void;
  actorId?: number;
  actorVersionId?: number;
  locationId?: number;
  locationVersionId?: number;
  promptType?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";

  // Enhanced loading state support
  onLoadingChange?: (isLoading: boolean) => void;
  onError?: (errorMessage: string) => void;
}

export function ShotImageViewer({
  shot,
  sceneId,
  scriptId,
  versionId,
  onDataRefresh,
  onShotUpdate,
  type,
  imageData,
  onImageUpdate,
  actorId,
  actorVersionId,
  locationId,
  locationVersionId,
  promptType,
  aspectRatio = "16:9",
  onLoadingChange,
  onError,
}: ShotImageViewerProps) {
  // ===========================
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // ===========================

  // Validation - memoized to prevent re-running on every render
  const validationError = useMemo(() => {
    if (type === "shots" && !shot) {
      return "Shot data is required for shots type";
    }
    if (type === "keyVisual" && !imageData) {
      return "Image data is required for key visual type";
    }
    if (type === "actor" && (!imageData || !actorId || !actorVersionId)) {
      return "Actor data is incomplete for actor type";
    }
    if (
      type === "location" &&
      (!imageData || !locationId || !locationVersionId)
    ) {
      return "Location data is incomplete for location type";
    }
    if (!scriptId || !versionId) {
      return "Script ID and Version ID are required";
    }
    return null;
  }, [
    type,
    shot,
    imageData,
    actorId,
    actorVersionId,
    locationId,
    locationVersionId,
    scriptId,
    versionId,
  ]);

  // Memoize config object
  const config: ImageViewerConfig = useMemo(
    () => ({
      scriptId: scriptId || "",
      versionId: versionId || "",
      type,
      aspectRatio,
      sceneId,
      shotId: shot?.shotId,
      actorId,
      actorVersionId,
      locationId,
      locationVersionId,
      promptType,
    }),
    [
      scriptId,
      versionId,
      type,
      aspectRatio,
      sceneId,
      shot?.shotId,
      actorId,
      actorVersionId,
      locationId,
      locationVersionId,
      promptType,
    ]
  );

  // Memoize source image data
  const sourceImageData: ImageData = useMemo(
    () =>
      type === "shots"
        ? {
            signedUrl: shot?.signedUrl,
            thumbnailPath: shot?.thumbnailPath,
            versions: shot?.versions,
          }
        : imageData || { signedUrl: undefined, thumbnailPath: undefined },
    [type, shot, imageData]
  );

  // Enhanced image update handler with loading state management
  const handleImageUpdate = useCallback(
    (updatedImageData: ImageData) => {
      try {
        if (type === "shots" && onShotUpdate && shot) {
          const updatedShot: Shot = {
            ...shot,
            signedUrl: updatedImageData.signedUrl || shot.signedUrl || "",
            thumbnailPath: updatedImageData.thumbnailPath || shot.thumbnailPath,
            versions: updatedImageData.versions
              ? {
                  current: updatedImageData.versions.current,
                  archived: updatedImageData.versions.archived,
                  totalVersions: updatedImageData.versions.totalVersions || 0,
                  totalEdits: updatedImageData.versions.totalEdits || 0,
                  editHistory: updatedImageData.versions.editHistory || [],
                }
              : shot.versions,
          };
          onShotUpdate(updatedShot);
        } else if (onImageUpdate) {
          onImageUpdate(updatedImageData);
        }
      } catch (error) {
        console.error("Error updating image data:", error);
        if (onError) {
          onError("Failed to update image data");
        }
      }
    },
    [type, onShotUpdate, shot, onImageUpdate, onError]
  );

  // Enhanced data refresh handler with error handling
  const handleDataRefresh = useCallback(() => {
    try {
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      if (onError) {
        onError("Failed to refresh data");
      }
    }
  }, [onDataRefresh, onError]);

  // ===========================
  // NOW WE CAN DO EARLY RETURN AFTER ALL HOOKS
  // ===========================

  // Handle validation errors
  if (validationError) {
    console.error(`ShotImageViewer: ${validationError}`);
    if (onError) {
      onError(validationError);
    }
    return null;
  }

  return (
    <ImageViewerContainer
      config={config}
      imageData={sourceImageData}
      onImageUpdate={handleImageUpdate}
      onDataRefresh={handleDataRefresh}
      onLoadingChange={onLoadingChange}
      onError={onError}
    />
  );
}

// Export the types for external use
export type { ImageViewerConfig } from "./ImageDisplayCore";
export type { ImageData } from "./ImageViewerContainer";
