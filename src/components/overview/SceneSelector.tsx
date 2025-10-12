"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  AvatarGroup,
  Divider,
  Tooltip,
  Chip,
  Alert,
} from "@mui/material";
import {
  LocationOn,
  AccessTime,
  MovieCreationOutlined as MovieIcon,
  ShutterSpeedOutlined as SceneDurationIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import DialogueAudioComponent from "./DialogueAudio";
import { AudioElements } from "./AudioElements";
import type { Scene, Actor, Location } from "@/types/overview/types";
import _ from "lodash";
import AudioPlayer from "@/components/common/AudioPlayer";

interface SceneSelectorProps {
  scriptId?: string;
  versionId?: string;
  scenes?: Scene[];
  selectedScene?: Scene | null;
  actors?: Actor[];
  locations?: Location[];
  onSceneChange: (scene: Scene) => void;
  onAudioUpdate?: () => void;
  isAudioProcessorCompleted: boolean;
}

const DEFAULT_AVATAR = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=random`;

/**
 * SceneSelector - Optimized scene selection and display component
 *
 * Performance optimizations:
 * - Theme-aware styling (no hardcoded colors)
 * - React 19 compiler optimizations
 * - Strategic memoization for expensive computations
 * - Proper useCallback for handlers
 */
export function SceneSelector({
  scriptId,
  versionId,
  scenes = [],
  selectedScene,
  actors = [],
  locations = [],
  onSceneChange,
  onAudioUpdate,
  isAudioProcessorCompleted,
}: SceneSelectorProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE
  // ==========================================
  const [sceneAudioStats, setSceneAudioStats] = useState({
    totalDialogues: 0,
    withAudio: 0,
    isLoading: false,
  });

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const canProcessAudio = useMemo(
    () => Boolean(scriptId && versionId),
    [scriptId, versionId]
  );

  const formatDuration = useCallback((seconds?: number | null): string => {
    if (!seconds) return "0:00";
    const minutes = _.floor(seconds / 60);
    const remainingSeconds = _.padStart((seconds % 60).toString(), 2, "0");
    return `${minutes}:${remainingSeconds}`;
  }, []);

  const sceneActors = useMemo(() => {
    if (!selectedScene) return [];
    return actors.filter((actor) =>
      actor.sceneIds?.includes(selectedScene.sceneId)
    );
  }, [actors, selectedScene]);

  const sceneLocation = useMemo(() => {
    if (!selectedScene) return undefined;
    return locations.find((location) =>
      location.sceneIds?.includes(selectedScene.sceneId)
    );
  }, [locations, selectedScene]);

  const findActor = useCallback(
    (actorId?: number): Actor | undefined => {
      if (!actorId) return undefined;
      return actors.find((actor) => actor.actorId === actorId);
    },
    [actors]
  );

  const sceneStats = useMemo(() => {
    if (!selectedScene) {
      return {
        totalShots: 0,
        dialogueShots: 0,
        shotsWithAudio: 0,
        audioPercentage: 0,
      };
    }

    const totalShots = selectedScene.shots?.length || 0;
    const { totalDialogues, withAudio } = sceneAudioStats;
    const audioPercentage =
      totalDialogues > 0 ? Math.round((withAudio / totalDialogues) * 100) : 0;

    return {
      totalShots,
      dialogueShots: totalDialogues,
      shotsWithAudio: withAudio,
      audioPercentage,
    };
  }, [selectedScene, sceneAudioStats]);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const updateAudioStats = useCallback(() => {
    if (!selectedScene?.shots) {
      setSceneAudioStats({ totalDialogues: 0, withAudio: 0, isLoading: false });
      return;
    }

    const totalDialogues = selectedScene.shots.reduce(
      (total, shot) => total + (shot.dialogues?.length || 0),
      0
    );

    const withAudio = selectedScene.shots.reduce(
      (total, shot) =>
        total +
        (shot.dialogues?.filter((dialogue) => dialogue.audio?.path).length ||
          0),
      0
    );

    setSceneAudioStats({
      totalDialogues,
      withAudio,
      isLoading: false,
    });
  }, [selectedScene?.shots]);

  const handleAudioUpdate = useCallback(() => {
    console.log("SceneSelector: Audio updated by child component");
    updateAudioStats();
    onAudioUpdate?.();
  }, [updateAudioStats, onAudioUpdate]);

  const handleDialogueStatusUpdate = useCallback(
    (shotId: number, hasAudio: boolean) => {
      console.log(
        `SceneSelector: Dialogue status updated for shot ${shotId}: ${hasAudio}`
      );
      setTimeout(updateAudioStats, 100);
    },
    [updateAudioStats]
  );

  const handleSceneChange = useCallback(
    (sceneId: number) => {
      const scene = scenes.find((s) => s.sceneId === sceneId);
      if (scene) onSceneChange(scene);
    },
    [scenes, onSceneChange]
  );

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    updateAudioStats();
  }, [updateAudioStats]);

  // ==========================================
  // EARLY RETURNS
  // ==========================================
  if (!selectedScene || scenes.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">No scene data available</Typography>
      </Box>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Box
      sx={{
        mt: 1,
        width: "100%",
        border: 1,
        borderRadius: `${brand.borderRadius}px`,
        borderColor: "divider",
      }}
    >
      {/* Scene Selection Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          mb: 3,
          bgcolor: "background.default",
          p: 2,
          borderRadius: `${brand.borderRadius}px`,
        }}
      >
        {/* Scene Dropdown */}
        <FormControl sx={{ minWidth: 200 }}>
          <Select
            value={selectedScene.sceneId}
            onChange={(e) => handleSceneChange(e.target.value as number)}
            variant="outlined"
            sx={{
              bgcolor: "background.default",
              "& .MuiSelect-select": {
                py: 1,
                fontWeight: "medium",
                color: "text.primary",
                fontFamily: brand.fonts.body,
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.main",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.light",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.dark",
              },
            }}
          >
            {scenes.map((scene) => (
              <MenuItem key={scene.sceneId} value={scene.sceneId}>
                Scene {scene.sceneId.toString().padStart(2, "0")}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Scene Metadata */}
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Location */}
          {sceneLocation && (
            <Tooltip title="Location Name">
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <LocationOn sx={{ color: "primary.main" }} />
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.primary",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {_.capitalize(sceneLocation.locationName || "")}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Time */}
          {sceneLocation?.setting?.timeOfDay && (
            <Tooltip title="Time of Day">
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <AccessTime sx={{ color: "primary.main" }} />
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.primary",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {_.capitalize(sceneLocation.setting.timeOfDay)}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Scene Duration */}
          {selectedScene.sceneDuration && (
            <Tooltip title="Scene Duration">
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <SceneDurationIcon sx={{ color: "primary.main" }} />
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.primary",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {formatDuration(Number(selectedScene.sceneDuration))}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Audio Statistics */}
          {canProcessAudio && (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Chip
                size="small"
                label={`${sceneStats.shotsWithAudio}/${sceneStats.dialogueShots} audio`}
                color={
                  sceneStats.audioPercentage > 80
                    ? "success"
                    : sceneStats.audioPercentage > 50
                      ? "warning"
                      : "default"
                }
                variant="outlined"
                sx={{
                  borderColor:
                    sceneStats.audioPercentage > 80
                      ? "success.main"
                      : sceneStats.audioPercentage > 50
                        ? "warning.main"
                        : "divider",
                }}
              />
              {sceneAudioStats.isLoading && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Updating...
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Right Aligned: Actors and AvatarGroup */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            marginLeft: "auto",
            gap: 2,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: "text.primary",
              fontFamily: brand.fonts.body,
            }}
          >
            Actors ({sceneActors.length})
          </Typography>

          {sceneActors.length > 0 && (
            <AvatarGroup
              max={4}
              sx={{
                "& .MuiAvatar-root": {
                  width: 64,
                  height: 64,
                  border: 2,
                  borderColor: "background.paper",
                },
              }}
            >
              {sceneActors.map((actor) => (
                <Tooltip
                  key={actor.actorId}
                  title={actor.actorName || "Unknown Actor"}
                >
                  <Avatar
                    alt={actor.actorName || "Actor"}
                    src={
                      actor.signedProfileUrl ||
                      actor.signedUrl ||
                      DEFAULT_AVATAR(actor.actorName || "Unknown")
                    }
                  />
                </Tooltip>
              ))}
            </AvatarGroup>
          )}
        </Box>
      </Box>

      {/* Scene Content */}
      <Box sx={{ px: 2, mb: 3, display: "flex", alignItems: "center" }}>
        <MovieIcon sx={{ color: "primary.main", mr: 2 }} />
        <Typography
          variant="body1"
          gutterBottom
          sx={{
            color: "primary.main",
            fontStyle: "italic",
            fontFamily: brand.fonts.body,
          }}
        >
          {selectedScene.sceneTextContent || "No scene content available"}
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Audio Processing Alert */}
      {!canProcessAudio && (
        <Box sx={{ px: 2, mb: 2 }}>
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{
              bgcolor: "background.paper",
              color: "text.primary",
              "& .MuiAlert-icon": {
                color: "warning.main",
              },
            }}
          >
            Audio processing features are disabled. Script ID and Version ID are
            required.
          </Alert>
        </Box>
      )}

      {/* Main Content Area - Split Layout */}
      <Box
        sx={{
          display: "flex",
          px: 2,
          gap: 3,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* Shots Table - 70% */}
        <Box sx={{ width: { xs: "100%", md: "70%" }, overflow: "hidden" }}>
          <Table
            sx={{
              "& .MuiTableCell-head": {
                bgcolor: "background.default",
                fontWeight: "bold",
                fontFamily: brand.fonts.heading,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell width="50%">
                  <Typography
                    variant="h5"
                    sx={{
                      color: "text.primary",
                      fontFamily: brand.fonts.heading,
                    }}
                  >
                    Visuals
                  </Typography>
                </TableCell>
                <TableCell width="50%">
                  <Typography
                    variant="h5"
                    sx={{
                      color: "text.primary",
                      fontFamily: brand.fonts.heading,
                    }}
                  >
                    Audio
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(selectedScene.shots || []).map((shot) => (
                <TableRow key={shot.shotId} hover>
                  {/* Visuals Column */}
                  <TableCell sx={{ verticalAlign: "top" }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: "primary.main",
                          fontFamily: brand.fonts.heading,
                        }}
                      >
                        Shot {shot.shotId}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{
                          mt: 1,
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        {shot.shotDescription || "No description available"}
                      </Typography>
                      {shot.shotSize && (
                        <Chip
                          label={shot.shotSize}
                          size="small"
                          sx={{
                            mt: 1,
                            color: "primary.main",
                            borderColor: "primary.main",
                            "&:hover": {
                              backgroundColor: "primary.main",
                              color: "primary.contrastText",
                            },
                          }}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>

                  {/* Audio Column */}
                  <TableCell sx={{ verticalAlign: "top" }}>
                    {shot.dialogues && shot.dialogues.length > 0 ? (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {/* Multiple Dialogues Header */}
                        {shot.hasMultipleDialogues && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <Chip
                              size="small"
                              label={`${shot.dialogueCount} dialogues`}
                              variant="outlined"
                              color="primary"
                              sx={{
                                fontSize: "0.75rem",
                                borderColor: "primary.main",
                              }}
                            />
                          </Box>
                        )}

                        {/* Render each dialogue */}
                        {shot.dialogues.map((dialogue, index) => (
                          <Box
                            key={dialogue.dialogueId}
                            sx={{
                              p: shot.hasMultipleDialogues ? 2 : 0,
                              border: shot.hasMultipleDialogues ? 1 : 0,
                              borderColor: "divider",
                              borderRadius: `${brand.borderRadius}px`,
                              bgcolor: shot.hasMultipleDialogues
                                ? "background.paper"
                                : "transparent",
                              position: "relative",
                            }}
                          >
                            {/* Dialogue Index */}
                            {shot.hasMultipleDialogues && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 4,
                                  right: 8,
                                  fontSize: "0.75rem",
                                  color: "text.secondary",
                                  fontWeight: "medium",
                                  fontFamily: brand.fonts.body,
                                }}
                              >
                                #{index + 1}
                              </Box>
                            )}

                            {canProcessAudio ? (
                              <DialogueAudioComponent
                                scriptId={scriptId!}
                                versionId={versionId!}
                                sceneId={selectedScene.sceneId}
                                shotId={shot.shotId}
                                dialogueId={dialogue.dialogueId}
                                dialogue={{
                                  actorId: dialogue.actorId,
                                  actorName: dialogue.actorName,
                                  dialogueContent: dialogue.dialogueContent,
                                  audio: dialogue.audio,
                                }}
                                actor={findActor(dialogue.actorId)}
                                onUpdate={handleAudioUpdate}
                                compact={true}
                                showVersionBadge={true}
                                allowEditing={true}
                                isAudioProcessorCompleted={
                                  isAudioProcessorCompleted
                                }
                              />
                            ) : (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  {dialogue.actorId && (
                                    <>
                                      {(() => {
                                        const actor = findActor(
                                          dialogue.actorId
                                        );
                                        return actor ? (
                                          <Tooltip
                                            title={
                                              actor.actorName || "Unknown Actor"
                                            }
                                          >
                                            <Avatar
                                              src={
                                                actor.signedProfileUrl ||
                                                actor.signedUrl ||
                                                DEFAULT_AVATAR(
                                                  actor.actorName || "Unknown"
                                                )
                                              }
                                              alt={actor.actorName || "Actor"}
                                              sx={{ width: 48, height: 48 }}
                                            />
                                          </Tooltip>
                                        ) : null;
                                      })()}
                                    </>
                                  )}
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      color: "text.primary",
                                      fontFamily: brand.fonts.body,
                                    }}
                                  >
                                    {dialogue.actorName || "Unknown Actor"}
                                  </Typography>
                                </Box>

                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                  sx={{
                                    fontStyle: "italic",
                                    my: 1,
                                    pl: 2,
                                    borderLeft: 2,
                                    borderColor: "primary.main",
                                    fontFamily: brand.fonts.body,
                                  }}
                                >
                                  &quot;
                                  {dialogue.dialogueContent ||
                                    "No dialogue content"}
                                  &quot;
                                </Typography>

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
                            )}
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        No dialogue in this shot
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Audio Elements */}
        <Box sx={{ width: { xs: "100%", md: "30%" } }}>
          <AudioElements
            scriptId={scriptId}
            versionId={versionId}
            selectedScene={selectedScene}
            onAudioUpdate={handleAudioUpdate}
            canProcessAudio={canProcessAudio}
            isAudioProcessorCompleted={isAudioProcessorCompleted}
          />
        </Box>
      </Box>
    </Box>
  );
}

SceneSelector.displayName = "SceneSelector";
