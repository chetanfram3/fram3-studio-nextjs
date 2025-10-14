"use client";

import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { Shot, StoryBoardData } from "@/types/storyBoard/types";
import { ShotList } from "./ShotList";
import { ShotDetails } from "./ShotDetails";
import { MediaTabsViewer } from "./MediaTabsViewer";
import VideoGenerationProgress from "./VideoGenerationProgress";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";
import { AnalysisInProgress } from "@/components/common/AnalysisInProgress";
import { useScriptDashboardAnalysis } from "@/hooks/scripts/useScriptDashboardAnalysis";
import { ApprovalButtonsContainer } from "@/components/common/componentStatus/ApprovalButton";
import StandaloneFeedbackPanel from "@/components/common/FeedbackSystem";

interface StoryBoardLayoutProps {
  scriptId?: string;
  versionId?: string;
}

export default function StoryBoardLayout({
  scriptId = "",
  versionId = "",
}: StoryBoardLayoutProps) {
  const theme = useTheme();
  const { data, isLoading, refetch } =
    useScriptDashboardAnalysis<StoryBoardData>(
      scriptId,
      versionId,
      "storyBoard"
    );

  const [selectedShot, setSelectedShot] = useState<Shot | undefined>(undefined);
  const [selectedSceneId, setSelectedSceneId] = useState<number | null>(null);

  // Local state to manage updated shots and maintain context
  const [localScenesData, setLocalScenesData] = useState(data?.scenes || []);

  // Update local data when API data changes
  useEffect(() => {
    if (data?.scenes) {
      setLocalScenesData(data.scenes);
    }
  }, [data?.scenes]);

  // Set initial selected shot when data loads
  useEffect(() => {
    if (!localScenesData?.length) return;

    // Only set initial selection if no shot is currently selected
    if (!selectedShot) {
      const firstScene = localScenesData[0];
      if (!firstScene?.lines?.length) return;

      const firstLine = firstScene.lines[0];
      if (!firstLine?.shots?.length) return;

      setSelectedShot(firstLine.shots[0]);
      setSelectedSceneId(firstScene.sceneId);
    }
  }, [localScenesData, selectedShot]);

  // Handle video generation completion
  const handleVideoGenerated = () => {
    console.log("Video generation completed - refreshing storyboard data");
    refetch(); // Refresh the storyboard data to get updated video URLs
  };

  if (isLoading) {
    return <LoadingAnimation message="Loading story board visuals..." />;
  }

  if (!data) {
    return (
      <AnalysisInProgress message="Story board analysis is in progress. Please check back later" />
    );
  }

  const selectedScene = selectedSceneId
    ? localScenesData?.find((scene) => scene.sceneId === selectedSceneId)
    : undefined;

  const handleShotSelect = (shot: Shot, sceneId: number) => {
    setSelectedShot(shot);
    setSelectedSceneId(sceneId);
  };

  // Handle targeted shot updates without losing context
  const handleShotUpdate = (updatedShot: Shot, sceneId: number) => {
    console.log("Updating shot:", updatedShot.shotId, "in scene:", sceneId);

    // Update the shot in local scenes data
    setLocalScenesData((prevScenes) => {
      return prevScenes.map((scene) => {
        if (scene.sceneId === sceneId) {
          return {
            ...scene,
            lines:
              scene.lines?.map((line) => ({
                ...line,
                shots:
                  line.shots?.map((shot) =>
                    shot.shotId === updatedShot.shotId ? updatedShot : shot
                  ) || [],
              })) || [],
          };
        }
        return scene;
      });
    });

    // Update the currently selected shot if it matches
    if (
      selectedShot?.shotId === updatedShot.shotId &&
      selectedSceneId === sceneId
    ) {
      setSelectedShot(updatedShot);
    }

    console.log("Shot updated successfully in local state");
  };

  // Function to refresh data after edits (fallback for full refresh)
  const handleDataRefresh = () => {
    console.log("Performing full data refresh...");
    refetch().then(() => {
      console.log("Data refresh completed");
    });
  };

  // Get aspect ratio from data, defaulting to 16:9 if not specified
  const aspectRatio = data.aspectRatio || "16:9";

  // Get video generation status
  const isVideoGenerated = data.isVideoGenerated || false;

  // Determine layout based on aspect ratio
  const isPortraitMode = aspectRatio === "9:16";

  if (isPortraitMode) {
    // 9:16 Layout - Three columns: thumbnails (left), media (center), details + video gen (right)
    return (
      <Box
        sx={{
          display: "flex",
          height: "100%",
          bgcolor: "background.default",
          borderTop: 4,
          borderColor: "primary.main",
        }}
      >
        {/* Left Sidebar - Shot List (Thumbnails) */}
        <Box
          sx={{
            width: "20%",
            minWidth: "200px",
            borderRight: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          <ShotList
            scenes={localScenesData || []}
            selectedShot={selectedShot}
            selectedSceneId={selectedSceneId}
            onShotSelect={handleShotSelect}
            aspectRatio={aspectRatio}
          />
        </Box>

        {/* Center Area - Media Viewer with Tabs */}
        <Box
          sx={{
            width: "45%",
            borderRight: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
          }}
        >
          {selectedShot && selectedScene ? (
            <Box
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              {/* Scene and Shot IDs Header */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  px: 2,
                  py: 1,
                  alignItems: "center",
                  borderBottom: 1,
                  borderColor: "divider",
                  bgcolor: "background.default",
                  flexShrink: 0,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6" color="primary">
                    Scene {selectedSceneId}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6" color="primary">
                    Shot {selectedShot.shotId || "?"}
                  </Typography>
                </Box>
                {/* Video indicator */}
                {isVideoGenerated && selectedShot.videoSignedUrl && (
                  <Box
                    sx={{
                      bgcolor: "success.main",
                      color: "common.white",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Video Ready
                  </Box>
                )}
              </Box>

              {/* Media Viewer */}
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflow: "visible",
                  p: 1,
                }}
              >
                <MediaTabsViewer
                  shot={selectedShot}
                  sceneId={selectedSceneId as number}
                  scriptId={scriptId}
                  versionId={versionId}
                  onDataRefresh={handleDataRefresh}
                  onShotUpdate={(updatedShot) =>
                    handleShotUpdate(updatedShot, selectedSceneId as number)
                  }
                  aspectRatio={aspectRatio}
                  isVideoGenerated={isVideoGenerated}
                />
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                p: 4,
                textAlign: "center",
              }}
            >
              <Typography color="text.secondary">
                Select a shot from the list to view media
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right Sidebar - Shot Details + Video Generation */}
        <Box
          sx={{
            width: "35%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "background.default",
          }}
        >
          {/* Shot Details - Scrollable */}
          <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {selectedShot && selectedScene ? (
              <ShotDetails
                shot={selectedShot}
                sceneId={selectedSceneId as number}
                selectedScene={selectedScene}
                scriptId={scriptId}
                versionId={versionId}
                onDataRefresh={handleDataRefresh}
                onShotUpdate={handleShotUpdate}
                aspectRatio={aspectRatio}
                isVideoGenerated={isVideoGenerated}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 4,
                  textAlign: "center",
                }}
              >
                <Typography color="text.secondary">
                  Select a shot to view details
                </Typography>
              </Box>
            )}
          </Box>

          {/* Video Generation Progress - Fixed at bottom */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              p: 2,
            }}
          >
            <ApprovalButtonsContainer
              scriptId={scriptId}
              versionId={versionId}
              showImageApproval={true}
              showVideoApproval={true}
            />
          </Box>

          <VideoGenerationProgress
            scriptId={scriptId}
            versionId={versionId}
            onVideoGenerated={handleVideoGenerated}
            refetchStoryBoard={refetch}
          />
        </Box>
      </Box>
    );
  }

  // 16:9 Layout - Two columns: sidebar (left), main content with shot details + video gen (right)
  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        bgcolor: "background.default",
        borderTop: 4,
        borderColor: "primary.main",
      }}
    >
      {/* Sidebar with Shot List */}
      <Box
        sx={{
          width: { xs: "35%", md: "25%" },
          borderRight: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        <ShotList
          scenes={localScenesData || []}
          selectedShot={selectedShot}
          selectedSceneId={selectedSceneId}
          onShotSelect={handleShotSelect}
          aspectRatio={aspectRatio}
        />
      </Box>

      {/* Main Content Area - Shot Details + Video Generation */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Shot Details - Scrollable content */}
        <Box sx={{ flex: 1, overflow: "auto", p: 2, minHeight: 0 }}>
          {selectedShot && selectedScene ? (
            <ShotDetails
              shot={selectedShot}
              sceneId={selectedSceneId as number}
              selectedScene={selectedScene}
              scriptId={scriptId}
              versionId={versionId}
              onDataRefresh={handleDataRefresh}
              onShotUpdate={handleShotUpdate}
              aspectRatio={aspectRatio}
              isVideoGenerated={isVideoGenerated}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                p: 4,
                textAlign: "center",
              }}
            >
              <Typography color="text.secondary">
                Select a shot from the list to view details
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            p: 2,
          }}
        >
          <ApprovalButtonsContainer
            scriptId={scriptId}
            versionId={versionId}
            showImageApproval={true}
            showVideoApproval={true}
          />
        </Box>

        {/* Video Generation Progress - Fixed at bottom */}
        <VideoGenerationProgress
          scriptId={scriptId}
          versionId={versionId}
          onVideoGenerated={handleVideoGenerated}
          refetchStoryBoard={refetch}
        />
      </Box>
      {/* Feedback Component */}
      {scriptId && versionId && (
        <StandaloneFeedbackPanel
          page="visuals"
          scriptId={scriptId}
          versionId={versionId}
        />
      )}
    </Box>
  );
}

StoryBoardLayout.displayName = "StoryBoardLayout";
