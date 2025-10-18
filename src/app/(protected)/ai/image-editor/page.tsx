// src/app/(protected)/image-editor/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Alert,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import { ArrowBack as BackIcon } from "@mui/icons-material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { StandaloneImageEditor } from "@/components/imageEditor/StandaloneImageEditor";
import { ImageViewerConfig } from "@/components/imageEditor/ImageDisplayCore";
import { useQuery } from "@tanstack/react-query";
import {
  getCompleteImageData,
  transformToLegacyImageData,
  type GetCompleteImageDataParams,
} from "@/services/imageService";
import type { ImageType } from "@/types/image/types";
import logger from "@/utils/logger";
import LoadingAnimation from "@/components/common/LoadingAnimation";

function ImageEditorContent() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL parameters
  const scriptId = searchParams.get("scriptId");
  const versionId = searchParams.get("versionId");
  const type = searchParams.get("type") as ImageType | null;

  // Type-specific params
  const sceneId = searchParams.get("sceneId");
  const shotId = searchParams.get("shotId");
  const actorId = searchParams.get("actorId");
  const actorVersionId = searchParams.get("actorVersionId");
  const locationId = searchParams.get("locationId");
  const locationVersionId = searchParams.get("locationVersionId");
  const promptType = searchParams.get("promptType");

  // State
  const [hasParams, setHasParams] = useState(false);
  const [config, setConfig] = useState<ImageViewerConfig | undefined>();

  // Check if we have params on mount
  useEffect(() => {
    const hasRequiredParams = !!scriptId && !!versionId && !!type;
    setHasParams(hasRequiredParams);

    if (hasRequiredParams) {
      const newConfig: ImageViewerConfig = {
        scriptId: scriptId!,
        versionId: versionId!,
        type: type!,
      };

      // Add type-specific params
      if (type === "shots" && sceneId && shotId) {
        newConfig.sceneId = Number(sceneId);
        newConfig.shotId = Number(shotId);
      } else if (type === "actor" && actorId) {
        newConfig.actorId = Number(actorId);
        newConfig.actorVersionId = actorVersionId
          ? Number(actorVersionId)
          : undefined;
      } else if (type === "location" && locationId) {
        newConfig.locationId = Number(locationId);
        newConfig.locationVersionId = locationVersionId
          ? Number(locationVersionId)
          : undefined;
        newConfig.promptType = promptType || "wideShotLocationSetPrompt";
      }

      setConfig(newConfig);
    }
  }, [
    scriptId,
    versionId,
    type,
    sceneId,
    shotId,
    actorId,
    actorVersionId,
    locationId,
    locationVersionId,
    promptType,
  ]);

  // Fetch image data if params provided
  const {
    data: completeImageData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "imageEditor",
      scriptId,
      versionId,
      type,
      sceneId,
      shotId,
      actorId,
      locationId,
    ],
    queryFn: async () => {
      const params: GetCompleteImageDataParams = {
        scriptId: scriptId!,
        versionId: versionId!,
        type: type!,
      };

      // Add type-specific parameters
      if (type === "shots" && sceneId && shotId) {
        params.sceneId = Number(sceneId);
        params.shotId = Number(shotId);
      } else if (type === "actor" && actorId) {
        params.actorId = Number(actorId);
        params.actorVersionId = actorVersionId
          ? Number(actorVersionId)
          : undefined;
      } else if (type === "location" && locationId) {
        params.locationId = Number(locationId);
        params.locationVersionId = locationVersionId
          ? Number(locationVersionId)
          : undefined;
        params.promptType = promptType || "wideShotLocationSetPrompt";
      }

      const data = await getCompleteImageData(params);
      return transformToLegacyImageData(data);
    },
    enabled: hasParams,
    staleTime: 30000, // 30 seconds
    retry: 2,
  });

  // Get story tab number based on type
  const getStoryTabNumber = (imageType: ImageType | null): number => {
    if (!imageType) return 0;
    switch (imageType) {
      case "location":
      case "actor":
        return 0;
      case "shots":
        return 2;
      case "keyVisual":
        return 1;
      default:
        return 0;
    }
  };

  // Handler for back button
  const handleBack = () => {
    router.back();
  };

  // Handler for story button
  const handleGoToStory = () => {
    if (scriptId && versionId) {
      const tabNum = getStoryTabNumber(type);
      router.push(`/story/${scriptId}/version/${versionId}/${tabNum}`);
    }
  };

  // Handler for image updates
  const handleImageUpdate = (updatedData: unknown) => {
    logger.info("Image updated", updatedData);
    refetch();
  };

  // Handler for data refresh
  const handleDataRefresh = () => {
    refetch();
  };

  // Loading state
  if (hasParams && isLoading) {
    return <LoadingAnimation message="Image Editor is loading..." />;
  }

  // Error state
  if (hasParams && error) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Back">
                <IconButton onClick={handleBack} color="primary" size="small">
                  <BackIcon />
                </IconButton>
              </Tooltip>
              {scriptId && versionId && (
                <Tooltip title="Go to Story">
                  <IconButton
                    onClick={handleGoToStory}
                    color="primary"
                    size="small"
                  >
                    <AutoStoriesIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            <Typography variant="h5" sx={{ fontFamily: brand.fonts.heading }}>
              Image Editor
            </Typography>
          </Box>
        </Paper>

        {/* Error Content */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
          }}
        >
          <Alert
            severity="error"
            sx={{ maxWidth: 500 }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={() => refetch()}
              >
                Retry
              </IconButton>
            }
          >
            <Typography variant="subtitle2" gutterBottom>
              Failed to Load Image
            </Typography>
            <Typography variant="body2">
              {error instanceof Error
                ? error.message
                : "An unknown error occurred"}
            </Typography>
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      {/* Header with Back Button and Story Button */}
      <Paper
        elevation={0}
        sx={{
          p: 1,
          borderBottom: 1,
          borderColor: "primary.main",
          bgcolor: "background.paper",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Back">
              <IconButton onClick={handleBack} color="primary" size="small">
                <BackIcon />
              </IconButton>
            </Tooltip>
            {hasParams && scriptId && versionId && (
              <Tooltip title="Go to Story">
                <IconButton
                  onClick={handleGoToStory}
                  color="primary"
                  size="small"
                >
                  <AutoStoriesIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
          <Typography variant="h5" sx={{ fontFamily: brand.fonts.heading }}>
            Image Editor
          </Typography>
          {!hasParams && (
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                ml: 1,
                px: 1.5,
                py: 0.5,
                bgcolor: "action.hover",
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              Generate Mode
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Editor Component - Takes remaining space */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <StandaloneImageEditor
          config={config}
          imageData={hasParams ? (completeImageData as any) : undefined}
          onImageUpdate={handleImageUpdate}
          onDataRefresh={handleDataRefresh}
          defaultMode="generate"
        />
      </Box>
    </Box>
  );
}

/**
 * Image Editor Page
 *
 * URL Parameters (all optional):
 * - scriptId: Script ID
 * - versionId: Version ID
 * - type: Image type (shots, keyVisual, actor, location)
 * - sceneId: Scene ID (for shots)
 * - shotId: Shot ID (for shots)
 * - actorId: Actor ID (for actors)
 * - locationId: Location ID (for locations)
 *
 * Examples:
 * - /image-editor (Generate mode - no params)
 * - /image-editor?scriptId=123&versionId=456&type=shots&sceneId=1&shotId=2
 * - /image-editor?scriptId=123&versionId=456&type=actor&actorId=5
 */
export default function ImageEditorPage() {
  return (
    <Suspense
      fallback={<LoadingAnimation message="Loading..." />}
    >
      <ImageEditorContent />
    </Suspense>
  );
}
