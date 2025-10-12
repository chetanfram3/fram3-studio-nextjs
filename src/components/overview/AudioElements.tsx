"use client";

import { useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  MusicNote as MusicIcon,
  SurroundSound as FoleyIcon,
  Mic as RoomToneIcon,
  VolumeUp as VolumeIcon,
  GraphicEq,
  Speed,
  Warning as WarningIcon,
} from "@mui/icons-material";
import AudioPlayer from "@/components/common/AudioPlayer";
import GenericAudioComponent from "./GenericAudio";
import { useAudioRefetch } from "@/hooks/useAudioRefetch";
import { getCurrentBrand } from "@/config/brandConfig";
import logger from "@/utils/logger";
import type { Scene } from "@/types/overview/types";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface AudioElementsProps {
  scriptId?: string;
  versionId?: string;
  selectedScene?: Scene | null;
  onAudioUpdate?: () => void;
  isAudioProcessorCompleted: boolean;
  canProcessAudio?: boolean;
}

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Safely parse duration values with validation
 */
const safeDuration = (duration: unknown): number => {
  if (duration === null || duration === undefined) return 0;

  const parsed =
    typeof duration === "number" ? duration : parseFloat(String(duration));

  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
    logger.warn("Invalid duration value, defaulting to 0", { duration });
    return 0;
  }

  return parsed;
};

// ===========================
// MAIN COMPONENT
// ===========================

export function AudioElements({
  scriptId,
  versionId,
  selectedScene,
  onAudioUpdate,
  isAudioProcessorCompleted,
  canProcessAudio = true,
}: AudioElementsProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { smartRefetch } = useAudioRefetch(scriptId || "", versionId || "");

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleAudioUpdate = useCallback(async () => {
    logger.debug("AudioElements: Audio updated by child component");
    onAudioUpdate?.();
  }, [onAudioUpdate]);

  // ===========================
  // DERIVED STATE
  // ===========================

  const audioStatus = useMemo(
    () => ({
      hasMusic: !!selectedScene?.audioDetails?.music,
      hasFoley: (selectedScene?.audioDetails?.foley?.length || 0) > 0,
      hasRoomTone: !!selectedScene?.audioDetails?.roomTone,
    }),
    [selectedScene]
  );

  const hasAnyAudio =
    audioStatus.hasMusic || audioStatus.hasFoley || audioStatus.hasRoomTone;

  // ===========================
  // EARLY RETURNS
  // ===========================

  if (!selectedScene) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">No scene selected</Typography>
      </Box>
    );
  }

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <Box>
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          color: "primary.main",
          fontWeight: 600,
        }}
      >
        Audio Elements
      </Typography>

      {!canProcessAudio && (
        <Box sx={{ mb: 2 }}>
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            Audio processing features are disabled. Script ID and Version ID are
            required.
          </Alert>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* MUSIC SECTION */}
        {audioStatus.hasMusic && selectedScene.audioDetails?.music && (
          <Card
            variant="outlined"
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              borderColor: "divider",
              transition: theme.transitions.create(
                ["box-shadow", "border-color"],
                { duration: theme.transitions.duration.short }
              ),
              "&:hover": {
                borderColor: "primary.main",
                boxShadow: theme.shadows[2],
              },
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <MusicIcon sx={{ color: "primary.main" }} />
                <Typography variant="subtitle1" fontWeight="medium">
                  Background Music
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  color="text.primary"
                >
                  {selectedScene.audioDetails.music.musicName ||
                    "Background Music"}
                </Typography>

                {/* Music metadata chips */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {selectedScene.audioDetails.music.musicGenre && (
                    <Chip
                      icon={<GraphicEq />}
                      label={`Genre: ${selectedScene.audioDetails.music.musicGenre}`}
                      size="small"
                      sx={{
                        borderRadius: `${brand.borderRadius}px`,
                      }}
                    />
                  )}
                  {selectedScene.audioDetails.music.musicTempo && (
                    <Chip
                      icon={<Speed />}
                      label={`Tempo: ${selectedScene.audioDetails.music.musicTempo} BPM`}
                      size="small"
                      sx={{
                        borderRadius: `${brand.borderRadius}px`,
                      }}
                    />
                  )}
                  {selectedScene.audioDetails.music.musicKey && (
                    <Chip
                      icon={<MusicIcon />}
                      label={`Key: ${selectedScene.audioDetails.music.musicKey}`}
                      size="small"
                      sx={{
                        borderRadius: `${brand.borderRadius}px`,
                      }}
                    />
                  )}
                </Box>
              </Box>

              {canProcessAudio && scriptId && versionId ? (
                <>
                  <Divider sx={{ my: 1 }} />
                  <GenericAudioComponent
                    scriptId={scriptId}
                    versionId={versionId}
                    audioType="music"
                    audioData={{
                      sceneId: selectedScene.sceneId,
                      musicId: selectedScene.audioDetails.music.musicId,
                      prompt:
                        selectedScene.audioDetails.music
                          .musicContentDescription || "",
                      currentVersion: 1,
                      destinationPath:
                        selectedScene.audioDetails.music.musicPath || "",
                      duration: safeDuration(
                        selectedScene.audioDetails.music.duration
                      ),
                      musicName:
                        selectedScene.audioDetails.music.musicName ||
                        "Background Music",
                    }}
                    onUpdate={handleAudioUpdate}
                    compact={true}
                    showVersionBadge={true}
                    allowEditing={true}
                    displayName="Audio Editing"
                    isAudioProcessorCompleted={isAudioProcessorCompleted}
                  />
                </>
              ) : (
                selectedScene.audioDetails.music.musicPath && (
                  <Box sx={{ mt: 2 }}>
                    <AudioPlayer
                      audioPath={selectedScene.audioDetails.music.musicPath}
                      initialDuration={safeDuration(
                        selectedScene.audioDetails.music.duration
                      )}
                      audioType="music"
                      key={`fallback-music-${selectedScene.sceneId}`}
                    />
                  </Box>
                )
              )}
            </CardContent>
          </Card>
        )}

        {/* FOLEY SECTION */}
        {audioStatus.hasFoley && selectedScene.audioDetails?.foley && (
          <Card
            variant="outlined"
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              borderColor: "divider",
              transition: theme.transitions.create(
                ["box-shadow", "border-color"],
                { duration: theme.transitions.duration.short }
              ),
              "&:hover": {
                borderColor: "primary.main",
                boxShadow: theme.shadows[2],
              },
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <FoleyIcon sx={{ color: "primary.main" }} />
                <Typography variant="subtitle1" fontWeight="medium">
                  Foley Effects
                </Typography>
              </Box>

              {selectedScene.audioDetails.foley.map((foleyItem, index) => (
                <Box key={`foley-${foleyItem.foleyId}`}>
                  <Box sx={{ mb: 2, "&:last-child": { mb: 0 } }}>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      color="text.primary"
                    >
                      {foleyItem.foleyName || "Unnamed Effect"}
                    </Typography>

                    {foleyItem.foleyIntensity && (
                      <Chip
                        size="small"
                        label={`Intensity: ${foleyItem.foleyIntensity}`}
                        sx={{
                          mb: 1,
                          borderRadius: `${brand.borderRadius}px`,
                        }}
                      />
                    )}

                    {canProcessAudio && scriptId && versionId ? (
                      <GenericAudioComponent
                        scriptId={scriptId}
                        versionId={versionId}
                        audioType="foley"
                        audioData={{
                          sceneId: selectedScene.sceneId,
                          foleyId: foleyItem.foleyId,
                          prompt: foleyItem.foleyDescription || "",
                          currentVersion: 1,
                          destinationPath: foleyItem.foleyPath || "",
                          duration: safeDuration(foleyItem.duration),
                          foleyName: foleyItem.foleyName || "Unnamed Effect",
                        }}
                        onUpdate={handleAudioUpdate}
                        compact={true}
                        showVersionBadge={true}
                        allowEditing={true}
                        displayName="Audio Editing"
                        isAudioProcessorCompleted={isAudioProcessorCompleted}
                      />
                    ) : (
                      foleyItem.foleyPath && (
                        <AudioPlayer
                          audioPath={foleyItem.foleyPath}
                          initialDuration={safeDuration(foleyItem.duration)}
                          audioType="foley"
                          key={`fallback-foley-${selectedScene.sceneId}-${index}`}
                        />
                      )
                    )}
                  </Box>

                  {/* Divider after each item except the last one */}
                  {index < selectedScene.audioDetails.foley.length - 1 && (
                    <Divider
                      sx={{
                        my: 3,
                        borderColor: "divider",
                      }}
                    />
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ROOM TONE SECTION */}
        {audioStatus.hasRoomTone && selectedScene.audioDetails?.roomTone && (
          <Card
            variant="outlined"
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              borderColor: "divider",
              transition: theme.transitions.create(
                ["box-shadow", "border-color"],
                { duration: theme.transitions.duration.short }
              ),
              "&:hover": {
                borderColor: "primary.main",
                boxShadow: theme.shadows[2],
              },
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <RoomToneIcon sx={{ color: "primary.main" }} />
                <Typography variant="subtitle1" fontWeight="medium">
                  Room Tone
                </Typography>
              </Box>

              <Typography variant="subtitle2" gutterBottom color="text.primary">
                {selectedScene.audioDetails.roomTone.roomToneName ||
                  "Room Tone"}
              </Typography>

              {selectedScene.audioDetails.roomTone.ambienceIntensity && (
                <Chip
                  size="small"
                  label={`Ambience Intensity: ${selectedScene.audioDetails.roomTone.ambienceIntensity}`}
                  sx={{
                    mb: 1,
                    borderRadius: `${brand.borderRadius}px`,
                  }}
                />
              )}

              {canProcessAudio && scriptId && versionId ? (
                <>
                  <Divider sx={{ my: 2 }} />
                  <GenericAudioComponent
                    scriptId={scriptId}
                    versionId={versionId}
                    audioType="roomTone"
                    audioData={{
                      sceneId: selectedScene.sceneId,
                      roomToneId:
                        selectedScene.audioDetails.roomTone.roomToneId,
                      prompt:
                        selectedScene.audioDetails.roomTone
                          .roomToneDescription || "",
                      currentVersion: 1,
                      destinationPath:
                        selectedScene.audioDetails.roomTone.roomPath || "",
                      duration: safeDuration(
                        selectedScene.audioDetails.roomTone.duration
                      ),
                      roomToneName:
                        selectedScene.audioDetails.roomTone.roomToneName ||
                        "Room Tone",
                    }}
                    onUpdate={handleAudioUpdate}
                    compact={true}
                    showVersionBadge={true}
                    allowEditing={true}
                    displayName="Audio Editing"
                    isAudioProcessorCompleted={isAudioProcessorCompleted}
                  />
                </>
              ) : (
                selectedScene.audioDetails.roomTone.roomPath && (
                  <Box sx={{ mt: 1 }}>
                    <AudioPlayer
                      audioPath={selectedScene.audioDetails.roomTone.roomPath}
                      initialDuration={safeDuration(
                        selectedScene.audioDetails.roomTone.duration
                      )}
                      audioType="roomtone"
                      key={`fallback-roomtone-${selectedScene.sceneId}`}
                    />
                  </Box>
                )
              )}
            </CardContent>
          </Card>
        )}

        {/* EMPTY STATE */}
        {!hasAnyAudio && (
          <Card
            variant="outlined"
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              borderColor: "divider",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "text.secondary",
                }}
              >
                <VolumeIcon />
                <Typography variant="body2">
                  No additional audio elements in this scene
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}

export default AudioElements;
