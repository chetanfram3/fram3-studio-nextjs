// src/app/(protected)/ai/image-editor/page.tsx
"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
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
  const [isStandaloneInitMode, setIsStandaloneInitMode] = useState(false);
  const [config, setConfig] = useState<ImageViewerConfig | undefined>();

  // Check if we have params on mount
  useEffect(() => {
    const hasAnyParams = searchParams.toString().length > 0;
    const hasRequiredParams = !!scriptId && !!type;

    setIsStandaloneInitMode(!hasAnyParams);
    setHasParams(hasRequiredParams);

    if (!hasAnyParams) {
      logger.info("Image Editor: Standalone initialization mode");
      setConfig(undefined);
    } else if (hasRequiredParams) {
      const newConfig: ImageViewerConfig = {
        scriptId: scriptId!,
        versionId: type === "standalone" ? undefined : versionId!,
        type: type!,
      };

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
        newConfig.promptType = promptType || undefined;
      }

      setConfig(newConfig);
      logger.info("Image Editor: Config set", { config: newConfig });
    }
  }, [
    searchParams,
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

  const {
    data: completeImageData,
    isLoading,
    isError,
    error,
    refetch: refetchImageData,
  } = useQuery({
    queryKey: ["completeImageData", config],
    queryFn: async () => {
      if (!config) return null;

      const params: GetCompleteImageDataParams = {
        scriptId: config.scriptId,
        versionId: config.versionId,
        type: config.type,
      };

      if (config.type === "shots") {
        params.sceneId = config.sceneId;
        params.shotId = config.shotId;
      } else if (config.type === "actor") {
        params.actorId = config.actorId;
        params.actorVersionId = config.actorVersionId;
      } else if (config.type === "location") {
        params.locationId = config.locationId;
        params.locationVersionId = config.locationVersionId;
        params.promptType = config.promptType;
      }

      logger.info("Fetching complete image data", { params });
      const data = await getCompleteImageData(params);
      return transformToLegacyImageData(data);
    },
    enabled: hasParams && !!config && !isStandaloneInitMode,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const handleBack = () => {
    router.back();
  };

  const handleGoToStory = () => {
    if (scriptId && versionId) {
      router.push(`/story/${scriptId}/${versionId}`);
    }
  };

  const handleGoToLibrary = () => {
    router.push(`/ai/library/images`);
  };

  // ✅ Handle standalone asset creation response
  const handleImageUpdate = useCallback(
    (updatedImageData: any) => {
      logger.info("Image updated", { updatedImageData });

      // Check if this is a standalone asset creation response
      if (
        isStandaloneInitMode &&
        updatedImageData?.assetId &&
        updatedImageData?.type === "standalone"
      ) {
        logger.info("Standalone asset created, navigating to asset", {
          assetId: updatedImageData.assetId,
        });

        // Navigate to the newly created standalone asset
        const newUrl = `/ai/image-editor?scriptId=${updatedImageData.assetId}&type=standalone`;
        logger.info("Navigating to:", newUrl);
        router.push(newUrl);
      }
    },
    [isStandaloneInitMode, router]
  );

  // ✅ Handle data refresh
  const handleDataRefresh = useCallback(() => {
    logger.info("Data refresh requested");
    if (refetchImageData) {
      refetchImageData();
    }
  }, [refetchImageData]);

  if (hasParams && isLoading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingAnimation message="Loading image data..." />
      </Box>
    );
  }

  if (hasParams && isError) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Box sx={{ maxWidth: 600, width: "100%" }}>
          <Alert severity="error">
            <Typography variant="h6" gutterBottom>
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
          {isStandaloneInitMode ||
            (hasParams && type === "standalone" && (
              <Tooltip title="Go to Image Library">
                <IconButton
                  onClick={handleGoToLibrary}
                  color="primary"
                  size="small"
                >
                  <AutoStoriesIcon />
                </IconButton>
              </Tooltip>
            ))}
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

export default function ImageEditorPage() {
  return (
    <Suspense fallback={<LoadingAnimation message="Loading..." />}>
      <ImageEditorContent />
    </Suspense>
  );
}
