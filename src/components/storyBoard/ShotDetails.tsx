// ShotDetails.tsx - Ported to Next.js 15 with React 19 optimizations
"use client";

import { useMemo, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
} from "@mui/material";
import {
  Videocam as CameraIcon,
  Height as AngleIcon,
  MovieFilter as MovementIcon,
  Timer as DurationIcon,
  Movie as SceneIcon,
  PhotoCamera as ShotIcon,
  GraphicEq as MicIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import { Shot, Scene } from "@/types/storyBoard/types";
import { ShotParameter } from "./ShotParameter";
import { SceneDetails } from "./SceneDetails";
import AudioPlayer from "@/components/common/AudioPlayer";
import { MediaTabsViewer } from "./MediaTabsViewer";
import logger from "@/utils/logger";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Props for ShotDetails component
 */
interface ShotDetailsProps {
  shot?: Shot;
  sceneId?: number;
  selectedScene?: Scene;
  scriptId?: string;
  versionId?: string;
  onDataRefresh?: () => void;
  onShotUpdate?: (updatedShot: Shot, sceneId: number) => void;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";
  isVideoGenerated?: boolean;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * ShotDetails Component
 *
 * Displays comprehensive shot information including:
 * - Media viewer (image/video tabs)
 * - Shot parameters (size, angle, movement, duration)
 * - Dialogue list with audio playback
 * - Scene details (characters, locations)
 *
 * Features:
 * - Responsive layout (portrait vs landscape)
 * - Theme-aware styling
 * - Audio playback integration
 * - Shot update handling
 *
 * @component
 */
export function ShotDetails({
  shot,
  sceneId,
  selectedScene,
  scriptId,
  versionId,
  onDataRefresh,
  onShotUpdate,
  aspectRatio = "16:9",
  isVideoGenerated = false,
}: ShotDetailsProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  // ==========================================
  // MEMOIZED VALUES
  // ==========================================

  // React 19: useMemo for portrait mode check
  const isPortraitMode = useMemo(() => aspectRatio === "9:16", [aspectRatio]);

  // React 19: useMemo for dialogues
  const dialogues = useMemo(() => shot?.dialogues || [], [shot?.dialogues]);

  // React 19: useMemo for scene data
  const sceneData = useMemo(() => {
    if (!selectedScene) return null;
    return {
      characters: selectedScene.characters || [],
      locationDetails: selectedScene.locationDetails || [],
    };
  }, [selectedScene?.characters, selectedScene?.locationDetails]);

  // ==========================================
  // CALLBACKS
  // ==========================================

  // React 19: useCallback for shot update handler
  const handleShotUpdate = useCallback(
    (updatedShot: Shot) => {
      if (onShotUpdate && sceneId) {
        logger.debug("Shot updated", { sceneId, shotId: updatedShot.shotId });
        onShotUpdate(updatedShot, sceneId);
      }
    },
    [onShotUpdate, sceneId]
  );

  // React 19: useCallback for rendering shot parameters
  const renderShotParameters = useCallback(
    () => (
      <Card
        sx={{
          mb: 2,
          p: 2,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: "background.default",
          borderTop: isPortraitMode ? 0 : 2,
          borderColor: "primary.main",
          height: isPortraitMode ? "fit-content" : "auto",
          boxShadow: theme.shadows[2],
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontFamily: brand.fonts.heading,
              color: "text.primary",
            }}
          >
            Shot Parameters
          </Typography>

          <Stack spacing={2} sx={{ width: "100%" }}>
            {/* Description */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
                sx={{ fontFamily: brand.fonts.body, fontWeight: 600 }}
              >
                Description
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.875rem",
                  fontFamily: brand.fonts.body,
                  color: "text.primary",
                }}
              >
                {shot?.shotDescription || "No description available"}
              </Typography>
            </Box>

            {/* Shot Parameters List */}
            <Stack spacing={1.5} sx={{ width: "100%" }}>
              <ShotParameter
                icon={CameraIcon}
                label="Shot Size"
                value={shot?.shotSize || "Not specified"}
                compact={isPortraitMode}
              />
              <ShotParameter
                icon={AngleIcon}
                label="Camera Angle"
                value={shot?.cameraAngle || "Not specified"}
                compact={isPortraitMode}
              />
              <ShotParameter
                icon={MovementIcon}
                label="Camera Movement"
                value={shot?.cameraMovement || "Not specified"}
                compact={isPortraitMode}
              />
              <ShotParameter
                icon={DurationIcon}
                label="Duration"
                value={shot?.shotDuration || "Not specified"}
                compact={isPortraitMode}
              />
            </Stack>

            {/* Dialogues Section */}
            {dialogues.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ fontFamily: brand.fonts.body, fontWeight: 600 }}
                >
                  Dialogues
                </Typography>
                <List disablePadding>
                  {dialogues.map((dialogue, index) => (
                    <ListItem
                      key={`dialogue-${dialogue.actorId || index}`}
                      sx={{
                        px: 0,
                        py: 1,
                        borderRadius: `${brand.borderRadius * 0.5}px`,
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "primary.main",
                          }}
                        >
                          <MicIcon
                            sx={{
                              fontSize: 18,
                              color: isDarkMode ? "grey.900" : "white",
                            }}
                          />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            component="span"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                              sx={{
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                fontFamily: brand.fonts.body,
                              }}
                            >
                              {dialogue.actorName || "Unknown Actor"}
                            </Typography>
                            {dialogue.audioVersion && (
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{
                                  bgcolor: "primary.main",
                                  color: isDarkMode ? "grey.900" : "white",
                                  px: 0.5,
                                  py: 0.25,
                                  borderRadius: `${brand.borderRadius * 0.25}px`,
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  fontFamily: brand.fonts.body,
                                }}
                              >
                                v{dialogue.audioVersion}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box component="div">
                            <Box
                              component="span"
                              sx={{
                                fontStyle: "italic",
                                color: "text.secondary",
                                display: "block",
                                mb: dialogue.audio?.path ? 1 : 0,
                                fontSize: "0.75rem",
                                fontFamily: brand.fonts.body,
                              }}
                            >
                              &quot;
                              {dialogue.dialogueContent ||
                                "No dialogue content"}
                              &quot;
                            </Box>
                            {dialogue.audio?.path && (
                              <Box sx={{ mt: 1 }}>
                                <AudioPlayer
                                  audioPath={dialogue.audio.path}
                                  initialDuration={dialogue.audio?.duration}
                                  audioType="dialogue"
                                />
                              </Box>
                            )}
                          </Box>
                        }
                        primaryTypographyProps={{
                          variant: "body2",
                          color: "text.primary",
                          component: "div",
                          sx: { fontSize: "0.875rem" },
                        }}
                        secondaryTypographyProps={{
                          component: "div",
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    ),
    [
      shot,
      isPortraitMode,
      dialogues,
      brand.borderRadius,
      brand.fonts.heading,
      brand.fonts.body,
      theme.shadows,
      isDarkMode,
    ]
  );

  // React 19: useCallback for rendering scene details
  const renderSceneDetails = useCallback(
    () =>
      sceneData ? (
        <SceneDetails sceneData={sceneData} compact={isPortraitMode} />
      ) : null,
    [sceneData, isPortraitMode]
  );

  // ==========================================
  // RENDER
  // ==========================================

  // Early return for no data
  if (!shot || !sceneId) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
        }}
      >
        <Typography
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          No shot details available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: isPortraitMode ? 2 : 3,
        height: "100%",
        overflow: "auto",
        bgcolor: "background.default",
      }}
    >
      {/* Scene and Shot IDs - only show in landscape mode */}
      {!isPortraitMode && (
        <Box
          sx={{
            display: "flex",
            gap: 4,
            mb: 3,
            alignItems: "center",
            p: 2,
            bgcolor: "background.paper",
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SceneIcon sx={{ color: "primary.main" }} />
            <Typography
              variant="h6"
              sx={{
                fontFamily: brand.fonts.heading,
                color: "text.primary",
              }}
            >
              Scene {sceneId}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShotIcon sx={{ color: "primary.main" }} />
            <Typography
              variant="h6"
              sx={{
                fontFamily: brand.fonts.heading,
                color: "text.primary",
              }}
            >
              Shot {shot.shotId ?? "?"}
            </Typography>
          </Box>
        </Box>
      )}

      {isPortraitMode ? (
        // 9:16 Layout - Only show details, no media (media is in center panel)
        <>
          {renderShotParameters()}
          {renderSceneDetails()}
        </>
      ) : (
        // 16:9 Layout - Show media + details
        <>
          {/* Media Viewer with Tabs Component */}
          <Box
            sx={{
              mb: 2,
              borderRadius: `${brand.borderRadius}px`,
              overflow: "visible",
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              position: "relative",
              isolation: "isolate",
              boxShadow: theme.shadows[2],
            }}
          >
            <MediaTabsViewer
              shot={shot}
              sceneId={sceneId}
              scriptId={scriptId}
              versionId={versionId}
              onDataRefresh={onDataRefresh}
              onShotUpdate={handleShotUpdate}
              aspectRatio={aspectRatio}
              isVideoGenerated={isVideoGenerated}
            />
          </Box>

          {/* Shot Parameters and Scene Details */}
          {renderShotParameters()}
          {renderSceneDetails()}
        </>
      )}
    </Box>
  );
}
