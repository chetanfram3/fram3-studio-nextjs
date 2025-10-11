"use client";

// ShotImageViewer.tsx - Updated to use modular components with loading state support
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
  onImageUpdate?: (updatedImageData: any) => void;
  actorId?: number;
  actorVersionId?: number;
  locationId?: number;
  locationVersionId?: number;
  promptType?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "auto"; // Dynamic aspect ratio support

  // NEW: Enhanced loading state support
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
  aspectRatio = "16:9", // Default to 16:9
  onLoadingChange,
  onError,
}: ShotImageViewerProps) {
  // Runtime validation
  if (type === "shots" && !shot) {
    console.error(
      "ShotImageViewer: 'shot' prop is required when type is 'shots'"
    );
    if (onError) {
      onError("Shot data is required for shots type");
    }
    return null;
  }
  if (type === "keyVisual" && !imageData) {
    console.error(
      "ShotImageViewer: 'imageData' prop is required when type is 'keyVisual'"
    );
    if (onError) {
      onError("Image data is required for key visual type");
    }
    return null;
  }
  if (type === "actor" && (!imageData || !actorId || !actorVersionId)) {
    console.error(
      "ShotImageViewer: 'imageData', 'actorId', and 'actorVersionId' props are required when type is 'actor'"
    );
    if (onError) {
      onError("Actor data is incomplete for actor type");
    }
    return null;
  }
  if (
    type === "location" &&
    (!imageData || !locationId || !locationVersionId)
  ) {
    console.error(
      "ShotImageViewer: 'imageData', 'locationId', and 'locationVersionId' props are required when type is 'location'"
    );
    if (onError) {
      onError("Location data is incomplete for location type");
    }
    return null;
  }

  if (!scriptId || !versionId) {
    console.error("ShotImageViewer: 'scriptId' and 'versionId' are required");
    if (onError) {
      onError("Script ID and Version ID are required");
    }
    return null;
  }

  // Create config object
  const config: ImageViewerConfig = {
    scriptId,
    versionId,
    type,
    aspectRatio,
    sceneId,
    shotId: shot?.shotId,
    actorId,
    actorVersionId,
    locationId,
    locationVersionId,
    promptType,
  };

  // Determine source data based on type
  const sourceImageData: ImageData =
    type === "shots"
      ? {
          signedUrl: shot?.signedUrl,
          thumbnailPath: shot?.thumbnailPath,
          versions: shot?.versions,
        }
      : imageData!;

  // NEW: Enhanced image update handler with loading state management
  const handleImageUpdate = (updatedImageData: ImageData) => {
    try {
      if (type === "shots" && onShotUpdate && shot) {
        const updatedShot: Shot = {
          ...shot,
          // Handle optional signedUrl
          signedUrl: updatedImageData.signedUrl || shot.signedUrl || "",
          thumbnailPath: updatedImageData.thumbnailPath || shot.thumbnailPath,
          // Convert ImageData.versions to Shot.versions format
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
      console.error("❌ Error updating image data:", error);
      if (onError) {
        onError("Failed to update image data");
      }
    }
  };

  // NEW: Enhanced data refresh handler with error handling
  const handleDataRefresh = () => {
    try {
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
      if (onError) {
        onError("Failed to refresh data");
      }
    }
  };

  // NEW: Create a wrapper component that manages loading states and errors
  return (
    <ImageViewerContainer
      config={config}
      imageData={sourceImageData}
      onImageUpdate={handleImageUpdate}
      onDataRefresh={handleDataRefresh}
      // NEW: Pass through loading and error handlers
      onLoadingChange={onLoadingChange}
      onError={onError}
    />
  );
}

// Export the types for external use
export type { ImageViewerConfig } from "./ImageDisplayCore";
export type { ImageData } from "./ImageViewerContainer";
