"use client";

import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { SceneCard } from "./SceneCard";
import type { Scene, Shot } from "@/types/storyBoard/types";

interface ShotListProps {
  scenes?: Scene[];
  selectedShot?: Shot | null;
  selectedSceneId?: number | null;
  onShotSelect: (shot: Shot, sceneId: number) => void;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";
}

export function ShotList({
  scenes = [],
  selectedShot,
  selectedSceneId,
  onShotSelect,
  aspectRatio = "16:9",
}: ShotListProps) {
  const theme = useTheme();

  // Early return if no scenes available
  if (!scenes?.length) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          bgcolor: "background.paper",
        }}
      >
        <Typography color="text.secondary">No scenes available</Typography>
      </Box>
    );
  }

  const handleShotSelect = (shot: Shot, sceneId: number) => {
    if (!shot || !sceneId) return;
    onShotSelect(shot, sceneId);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.default",
        }}
      >
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          Shot List ({scenes.length} {scenes.length === 1 ? "Scene" : "Scenes"})
        </Typography>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflow: "auto",
          p: 2,
          bgcolor: "background.default",
        }}
      >
        {scenes.map(
          (scene) =>
            scene && (
              <SceneCard
                key={`scene-${scene.sceneId || Date.now()}`}
                scene={scene}
                selectedShot={selectedShot}
                selectedSceneId={selectedSceneId}
                onShotSelect={(shot) => handleShotSelect(shot, scene.sceneId)}
                aspectRatio={aspectRatio}
              />
            )
        )}
      </Box>
    </Box>
  );
}

ShotList.displayName = "ShotList";
