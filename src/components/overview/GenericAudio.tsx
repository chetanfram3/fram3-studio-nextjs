"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  MenuItem,
  Alert,
  CircularProgress,
  LinearProgress,
  Select,
  FormControl,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  MoreVert as MoreVertIcon,
  Star as StarIcon,
  MusicNote as MusicIcon,
  SurroundSound as FoleyIcon,
  Mic as RoomToneIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import AudioPlayer from "@/components/common/AudioPlayer";
import { useAudioVersions } from "@/hooks/useAudio";
import { useAudioRefetch } from "@/hooks/useAudioRefetch";
import {
  editFoleyAudioPrompt,
  editRoomToneAudioPrompt,
  editMusicAudioPrompt,
  processFoleyAudio,
  processRoomToneAudio,
  processMusicAudio,
  restoreAudioVersion,
} from "@/services/audioService";
import { AudioType, AudioStatus } from "@/types/audio";
import CustomToast from "@/components/common/CustomToast";
import { VersionHistoryDialog } from "./VersionHistory";
import { PromptEditDialog } from "./PromptEditDialog";
import { AudioMenu } from "./AudioMenu";
import { ModelTier } from "@/components/common/ModelTierSelector";
import { getCurrentBrand } from "@/config/brandConfig";
import logger from "@/utils/logger";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface GenericAudioData {
  sceneId: number;
  foleyId?: number;
  roomToneId?: number;
  musicId?: number;
  prompt: string;
  currentVersion: number;
  destinationPath: string;
  duration: number;
  audioMetrics?: {
    duration: number;
    meanVolume?: number;
    maxVolume?: number;
    rmsDb?: number;
    peakDb?: number;
  };
  // Legacy fields for display
  foleyDescription?: string;
  roomToneDescription?: string;
  musicDescription?: string;
  foleyName?: string;
  roomToneName?: string;
  musicName?: string;
}

interface GenericAudioComponentProps {
  scriptId: string;
  versionId: string;
  audioType: AudioType;
  audioData: GenericAudioData;
  onUpdate?: () => void;
  compact?: boolean;
  showVersionBadge?: boolean;
  allowEditing?: boolean;
  displayName?: string;
  displayDescription?: string;
  icon?: React.ReactNode;
  isAudioProcessorCompleted?: boolean;
}

// ===========================
// CONFIGURATION
// ===========================

const AUDIO_TYPE_CONFIG: Record<
  AudioType,
  {
    name: string;
    icon: React.ReactNode;
    description: string;
    editService: ((params: any) => Promise<any>) | null;
    processService: ((params: any) => Promise<any>) | null;
  }
> = {
  foley: {
    name: "Foley",
    icon: <FoleyIcon />,
    description: "Sound effects",
    editService: editFoleyAudioPrompt,
    processService: processFoleyAudio,
  },
  roomTone: {
    name: "Room Tone",
    icon: <RoomToneIcon />,
    description: "Ambient background",
    editService: editRoomToneAudioPrompt,
    processService: processRoomToneAudio,
  },
  music: {
    name: "Music",
    icon: <MusicIcon />,
    description: "Background music",
    editService: editMusicAudioPrompt,
    processService: processMusicAudio,
  },
  dialogue: {
    name: "Dialogue",
    icon: <RoomToneIcon />,
    description: "Spoken dialogue",
    editService: null,
    processService: null,
  },
  sceneSummary: {
    name: "Scene Summary",
    icon: <RoomToneIcon />,
    description: "Scene narration",
    editService: null,
    processService: null,
  },
};

// ===========================
// HELPER FUNCTIONS
// ===========================

const validateAudioValue = (
  value: unknown,
  defaultValue: number = 0
): number => {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  const numValue =
    typeof value === "number" ? value : parseFloat(String(value));

  if (isNaN(numValue) || !isFinite(numValue)) {
    logger.warn("Invalid audio value detected, using default", {
      value,
      defaultValue,
    });
    return defaultValue;
  }

  return Math.max(0, numValue);
};

// ===========================
// MAIN COMPONENT
// ===========================

export default function GenericAudioComponent({
  scriptId,
  versionId,
  audioType,
  audioData,
  onUpdate,
  isAudioProcessorCompleted,
  compact = false,
  showVersionBadge = true,
  allowEditing = true,
}: GenericAudioComponentProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ===========================
  // STATE
  // ===========================

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlaybackVersion, setSelectedPlaybackVersion] = useState<
    number | null
  >(null);

  // ===========================
  // API INTEGRATION
  // ===========================

  const shouldLoadData = Boolean(
    scriptId && versionId && audioData.sceneId > 0
  );

  const {
    versions,
    totalVersions,
    currentVersion,
    isRestoringVersion,
    error: versionsError,
    isLoading: isLoadingVersions,
  } = useAudioVersions(
    scriptId,
    versionId,
    audioType,
    audioData.sceneId,
    undefined,
    audioType === "foley" ? audioData.foleyId : undefined,
    audioType === "roomTone" ? audioData.roomToneId : undefined,
    audioType === "music" ? audioData.musicId : undefined,
    {
      enabled: shouldLoadData,
      staleTime: 1000 * 60 * 5,
    }
  );

  const { smartRefetch } = useAudioRefetch(scriptId, versionId);

  // ===========================
  // DERIVED STATE
  // ===========================

  const currentPrompt = useMemo(() => {
    return versions.current?.prompt || audioData.prompt || "";
  }, [versions.current, audioData.prompt]);

  const originalPrompt = useMemo(() => {
    const currentActions = versions.current?.actions || [];
    if (currentActions.length > 0) {
      const firstAction = currentActions[0];
      return firstAction.type === "initial_creation"
        ? firstAction.prompt
        : audioData.prompt;
    }
    return audioData.prompt;
  }, [versions.current, audioData.prompt]);

  const hasBeenEdited = useMemo(() => {
    return (versions.current?.actions?.length || 0) > 1;
  }, [versions.current]);

  const totalEdits = useMemo(() => {
    return (
      versions.current?.actions?.filter(
        (action) =>
          action.type === "prompt_edit" || action.type === "content_generation"
      ).length || 0
    );
  }, [versions.current]);

  const currentAudioVersionData = useMemo(() => {
    if (selectedPlaybackVersion === null) {
      const currentVersionData = versions.current;
      const prompt =
        currentVersionData?.prompt ||
        currentPrompt ||
        audioData.prompt ||
        "No content";
      const path =
        currentVersionData?.destinationPath || audioData.destinationPath || "";
      const rawDuration = currentVersionData?.duration || audioData.duration;
      const duration = validateAudioValue(rawDuration, 0);

      const description =
        currentVersionData?.description ||
        audioData.musicDescription ||
        audioData.foleyDescription ||
        audioData.roomToneDescription ||
        null;
      const modelTier = currentVersionData?.modelTier;

      return {
        destinationPath: path,
        duration: duration,
        prompt: prompt,
        version: currentVersion || 1,
        isCurrent: true,
        status:
          (currentVersionData?.status as AudioStatus) ||
          ("draft" as AudioStatus),
        hasAudio: currentVersionData?.hasContent || Boolean(path),
        description: description,
        modelTier: modelTier,
      };
    } else {
      const archivedVersions = versions.archived || {};
      const selectedVersion = archivedVersions[selectedPlaybackVersion];
      const validDuration = validateAudioValue(selectedVersion?.duration, 0);

      return {
        destinationPath: selectedVersion?.destinationPath || "",
        duration: validDuration,
        prompt: selectedVersion?.prompt || "No content",
        version: selectedPlaybackVersion,
        isCurrent: false,
        status:
          (selectedVersion?.status as AudioStatus) || ("draft" as AudioStatus),
        hasAudio:
          selectedVersion?.hasContent ||
          Boolean(selectedVersion?.destinationPath),
        description: selectedVersion?.description || null,
        modelTier: selectedVersion?.modelTier,
      };
    }
  }, [
    selectedPlaybackVersion,
    versions.current,
    versions.archived,
    currentPrompt,
    audioData,
    currentVersion,
  ]);

  const availableVersions = useMemo(() => {
    const versionsList: Array<{
      version: number;
      label: string;
      isCurrent: boolean;
      hasAudio: boolean;
    }> = [];

    if (versions.current) {
      versionsList.push({
        version: currentVersion || 1,
        label: `Version ${currentVersion || 1} (Current)`,
        isCurrent: true,
        hasAudio: versions.current.hasContent || false,
      });
    }

    const archivedVersions = versions.archived || {};
    Object.values(archivedVersions)
      .sort((a: any, b: any) => (b.version || 0) - (a.version || 0))
      .forEach((version: any) => {
        if (version.version) {
          versionsList.push({
            version: version.version,
            label: `Version ${version.version}`,
            isCurrent: false,
            hasAudio: version.hasContent || false,
          });
        }
      });

    return versionsList;
  }, [versions, currentVersion]);

  const isCurrentlyProcessing = useMemo(() => {
    return isProcessing || isRestoringVersion;
  }, [isProcessing, isRestoringVersion]);

  const shouldShowStatusChip = useMemo(() => {
    const status = currentAudioVersionData.status;
    return status !== "generated" && !currentAudioVersionData.hasAudio;
  }, [currentAudioVersionData.status, currentAudioVersionData.hasAudio]);

  // Computed values
  const isLoadingData = isLoadingVersions;
  const hasErrors = !!versionsError;
  const hasVersionedAudio = totalVersions > 0;
  const hasMultipleVersions = totalVersions > 1;
  const audioConfig = AUDIO_TYPE_CONFIG[audioType];

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const handleVersionPlayback = useCallback((versionNumber: number | null) => {
    setSelectedPlaybackVersion(versionNumber);
  }, []);

  const formatDuration = useCallback((seconds?: number): string => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  }, []);

  const handleEditPrompt = useCallback(() => {
    const initialPrompt = currentPrompt || audioData.prompt || "";
    setEditedPrompt(initialPrompt);
    setShowPromptDialog(true);
    setMenuAnchor(null);
  }, [currentPrompt, audioData.prompt]);

  // ===========================
  // EVENT HANDLERS (Continued)
  // ===========================

  const handleSavePrompt = useCallback(
    async (modelTier: ModelTier) => {
      if (!editedPrompt.trim()) {
        CustomToast.error("Prompt cannot be empty");
        return;
      }

      setIsProcessing(true);
      try {
        const audioConfig = AUDIO_TYPE_CONFIG[audioType];
        const editService = audioConfig.editService;

        if (!editService) {
          throw new Error(`Edit service not available for ${audioType}`);
        }

        const baseParams = {
          scriptId,
          versionId,
          sceneId: audioData.sceneId,
          newPrompt: editedPrompt.trim(),
          generateAudio: true,
        };

        const params: any = { ...baseParams, modelTier: modelTier };
        if (audioType === "foley" && audioData.foleyId !== undefined) {
          params.foleyId = audioData.foleyId;
        } else if (
          audioType === "roomTone" &&
          audioData.roomToneId !== undefined
        ) {
          params.roomToneId = audioData.roomToneId;
        } else if (audioType === "music" && audioData.musicId !== undefined) {
          params.musicId = audioData.musicId;
        }

        await editService(params);
        CustomToast.success(
          `${audioConfig.name} prompt updated and audio regenerated`
        );
        setShowPromptDialog(false);

        await smartRefetch("audio_generation", {
          scriptId,
          versionId,
          audioType: audioType,
          sceneId: audioData.sceneId,
          foleyId: audioType === "foley" ? audioData.foleyId : undefined,
          roomToneId:
            audioType === "roomTone" ? audioData.roomToneId : undefined,
          musicId: audioType === "music" ? audioData.musicId : undefined,
        });

        onUpdate?.();
      } catch (error: any) {
        logger.error(`Error updating ${audioType} prompt`, error);
        CustomToast.error(
          error.message || `Failed to update ${audioType} prompt`
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [
      editedPrompt,
      scriptId,
      versionId,
      audioData,
      audioType,
      smartRefetch,
      onUpdate,
    ]
  );

  const handleEditPromptOnly = useCallback(
    async (modelTier: ModelTier) => {
      if (!editedPrompt.trim()) {
        CustomToast.error("Prompt cannot be empty");
        return;
      }

      setIsProcessing(true);
      try {
        const audioConfig = AUDIO_TYPE_CONFIG[audioType];
        const editService = audioConfig.editService;

        if (!editService) {
          throw new Error(`Edit service not available for ${audioType}`);
        }

        const baseParams = {
          scriptId,
          versionId,
          sceneId: audioData.sceneId,
          newPrompt: editedPrompt.trim(),
          generateAudio: false,
        };

        const params: any = { ...baseParams, modelTier: modelTier };
        if (audioType === "foley" && audioData.foleyId !== undefined) {
          params.foleyId = audioData.foleyId;
        } else if (
          audioType === "roomTone" &&
          audioData.roomToneId !== undefined
        ) {
          params.roomToneId = audioData.roomToneId;
        } else if (audioType === "music" && audioData.musicId !== undefined) {
          params.musicId = audioData.musicId;
        }

        await editService(params);
        CustomToast.success(`${audioConfig.name} prompt updated`);
        setShowPromptDialog(false);

        await smartRefetch("prompt_edit", {
          scriptId,
          versionId,
          audioType: audioType,
          sceneId: audioData.sceneId,
          foleyId: audioType === "foley" ? audioData.foleyId : undefined,
          roomToneId:
            audioType === "roomTone" ? audioData.roomToneId : undefined,
          musicId: audioType === "music" ? audioData.musicId : undefined,
        });

        onUpdate?.();
      } catch (error: any) {
        logger.error(`Error updating ${audioType} prompt only`, error);
        CustomToast.error(
          error.message || `Failed to update ${audioType} prompt`
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [
      editedPrompt,
      scriptId,
      versionId,
      audioData,
      audioType,
      smartRefetch,
      onUpdate,
    ]
  );

  const handleRegenerateAudio = useCallback(async () => {
    setIsProcessing(true);
    try {
      const audioConfig = AUDIO_TYPE_CONFIG[audioType];
      const processService = audioConfig.processService;

      if (!processService) {
        throw new Error(`Process service not available for ${audioType}`);
      }

      const baseParams = {
        scriptId,
        versionId,
        sceneId: audioData.sceneId,
        options: {
          sourcePrompt: currentPrompt || audioData.prompt,
          regenerationReason: "manual_regeneration",
          modelTier: currentAudioVersionData.modelTier,
        },
      };

      const params = {
        ...baseParams,
        ...(audioType === "foley" &&
          audioData.foleyId && { foleyId: audioData.foleyId }),
        ...(audioType === "music" &&
          audioData.musicId && { musicId: audioData.musicId }),
        ...(audioType === "roomTone" &&
          audioData.roomToneId && { roomToneId: audioData.roomToneId }),
      };

      await processService(params);
      CustomToast.success(`${audioConfig.name} audio regenerated successfully`);

      await smartRefetch("audio_generation", {
        scriptId,
        versionId,
        audioType: audioType,
        sceneId: audioData.sceneId,
        foleyId: audioType === "foley" ? audioData.foleyId : undefined,
        roomToneId: audioType === "roomTone" ? audioData.roomToneId : undefined,
        musicId: audioType === "music" ? audioData.musicId : undefined,
      });

      onUpdate?.();
    } catch (error: any) {
      logger.error(`Error regenerating ${audioType} audio`, error);
      CustomToast.error(
        error.message || `Failed to regenerate ${audioType} audio`
      );
    } finally {
      setIsProcessing(false);
    }
    handleMenuClose();
  }, [
    scriptId,
    versionId,
    audioData,
    audioType,
    currentPrompt,
    currentAudioVersionData.modelTier,
    smartRefetch,
    onUpdate,
    handleMenuClose,
  ]);

  const handleRestoreVersion = useCallback(
    async (targetVersion: number) => {
      try {
        const restoreParams: any = {
          scriptId,
          versionId,
          audioType: audioType,
          sceneId: audioData.sceneId,
          targetVersion,
        };

        if (audioType === "foley" && audioData.foleyId !== undefined) {
          restoreParams.foleyId = audioData.foleyId;
        } else if (
          audioType === "roomTone" &&
          audioData.roomToneId !== undefined
        ) {
          restoreParams.roomToneId = audioData.roomToneId;
        } else if (audioType === "music" && audioData.musicId !== undefined) {
          restoreParams.musicId = audioData.musicId;
        }

        await restoreAudioVersion(restoreParams);
        CustomToast.success(`Restored to version ${targetVersion}`);
        setSelectedPlaybackVersion(null);

        await smartRefetch("version_restore", {
          scriptId,
          versionId,
          audioType: audioType,
          sceneId: audioData.sceneId,
          foleyId: audioType === "foley" ? audioData.foleyId : undefined,
          roomToneId:
            audioType === "roomTone" ? audioData.roomToneId : undefined,
          musicId: audioType === "music" ? audioData.musicId : undefined,
        });

        onUpdate?.();
      } catch (error: any) {
        logger.error(`Error restoring ${audioType} version`, error);
        CustomToast.error(
          error.message || `Failed to restore ${audioType} version`
        );
      }
    },
    [scriptId, versionId, audioType, audioData, smartRefetch, onUpdate]
  );

  // ===========================
  // EARLY RETURNS
  // ===========================

  if (isLoadingData) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="caption">Loading {audioType} data...</Typography>
      </Box>
    );
  }

  if (hasErrors) {
    return (
      <Box sx={{ p: 1 }}>
        <Alert severity="error" sx={{ fontSize: "0.875rem" }}>
          Failed to load {audioType} data: {versionsError?.message}
        </Alert>
      </Box>
    );
  }

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1 }}>
      {/* Header with Description and Menu */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          mb: 1,
        }}
      >
        {/* Description */}
        {currentAudioVersionData.description && (
          <Box sx={{ flex: 1, display: "flex", alignItems: "stretch", gap: 1 }}>
            <Box
              sx={{
                width: 3,
                bgcolor: "primary.main",
                borderRadius: `${brand.borderRadius}px`,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontStyle: "italic",
                fontSize: "0.875rem",
                lineHeight: 1.4,
                p: 1,
                bgcolor: "action.hover",
                borderRadius: `${brand.borderRadius}px`,
                flex: 1,
              }}
            >
              {currentAudioVersionData.description}
            </Typography>
          </Box>
        )}

        {/* Menu Button */}
        {allowEditing && (
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            sx={{
              color: "primary.main",
              flexShrink: 0,
              transition: theme.transitions.create(["color", "transform"], {
                duration: theme.transitions.duration.short,
              }),
              "&:hover": {
                transform: "scale(1.1)",
              },
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Version Selection and Badges */}
      <Box
        sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}
      >
        {showVersionBadge && hasVersionedAudio && (
          <>
            <Chip
              size="small"
              label={`v${currentAudioVersionData.version}`}
              color={currentAudioVersionData.isCurrent ? "primary" : "default"}
              icon={
                currentAudioVersionData.isCurrent ? <StarIcon /> : undefined
              }
              sx={{
                fontSize: "0.75rem",
                height: 20,
                borderRadius: `${brand.borderRadius}px`,
              }}
            />
            {totalEdits > 0 && (
              <Chip
                size="small"
                label={`${totalEdits} edit${totalEdits !== 1 ? "s" : ""}`}
                variant="outlined"
                sx={{
                  fontSize: "0.75rem",
                  height: 20,
                  borderRadius: `${brand.borderRadius}px`,
                }}
              />
            )}
            {shouldShowStatusChip && (
              <Chip
                size="small"
                label={currentAudioVersionData.status}
                color={
                  currentAudioVersionData.status === "error"
                    ? "error"
                    : "default"
                }
                variant="outlined"
                sx={{
                  fontSize: "0.75rem",
                  height: 20,
                  borderRadius: `${brand.borderRadius}px`,
                }}
              />
            )}
            {currentAudioVersionData.status === "draft" &&
              !currentAudioVersionData.hasAudio && (
                <Chip
                  size="small"
                  label="No Audio"
                  color="warning"
                  variant="outlined"
                  icon={<WarningIcon />}
                  sx={{
                    fontSize: "0.75rem",
                    height: 20,
                    borderRadius: `${brand.borderRadius}px`,
                  }}
                />
              )}
          </>
        )}

        {/* Version Selector */}
        {hasMultipleVersions && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedPlaybackVersion || currentVersion}
              onChange={(e) => {
                const value = e.target.value as number;
                handleVersionPlayback(value === currentVersion ? null : value);
              }}
              size="small"
              sx={{ fontSize: "0.75rem", height: 24 }}
            >
              {availableVersions.map((version) => (
                <MenuItem key={version.version} value={version.version}>
                  {version.label}
                  {version.hasAudio && " ♪"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Audio Player */}
      {currentAudioVersionData.hasAudio &&
        currentAudioVersionData.destinationPath && (
          <Box sx={{ mt: 1 }}>
            {!currentAudioVersionData.isCurrent && (
              <Alert severity="info" sx={{ mb: 1, fontSize: "0.75rem" }}>
                <Typography variant="caption">
                  Previewing Version {currentAudioVersionData.version} (Not
                  Current)
                </Typography>
              </Alert>
            )}

            {(() => {
              const audioPath = currentAudioVersionData.destinationPath;
              const audioDuration = currentAudioVersionData.duration;

              if (!audioPath || typeof audioPath !== "string") {
                return (
                  <Alert severity="warning" sx={{ fontSize: "0.75rem" }}>
                    <Typography variant="caption">
                      Invalid audio path for {audioConfig.name}
                    </Typography>
                  </Alert>
                );
              }

              const getAudioPlayerType = (type: string) => {
                switch (type) {
                  case "roomTone":
                    return "roomtone";
                  default:
                    return type;
                }
              };

              return (
                <AudioPlayer
                  audioPath={audioPath}
                  initialDuration={validateAudioValue(audioDuration, 0)}
                  audioType={getAudioPlayerType(audioType) as any}
                  key={`${audioType}-${currentAudioVersionData.version}-optimized`}
                />
              );
            })()}

            {!currentAudioVersionData.isCurrent && (
              <Button
                size="small"
                startIcon={<StarIcon />}
                onClick={() =>
                  handleRestoreVersion(currentAudioVersionData.version)
                }
                disabled={isRestoringVersion}
                sx={{
                  mt: 1,
                  fontSize: "0.75rem",
                  bgcolor: "primary.light",
                  color: "primary.contrastText",
                  transition: theme.transitions.create(["background-color"], {
                    duration: theme.transitions.duration.short,
                  }),
                  "&:hover": {
                    bgcolor: "primary.main",
                  },
                }}
              >
                Set Default
              </Button>
            )}
          </Box>
        )}

      {/* Processing Indicator */}
      {isCurrentlyProcessing && (
        <LinearProgress variant="indeterminate" sx={{ mt: 1 }} />
      )}

      {/* Dialogs and Menus */}
      {allowEditing && (
        <>
          <AudioMenu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            audioType={audioType}
            onEditPrompt={handleEditPrompt}
            onRegenerateAudio={handleRegenerateAudio}
            onShowVersionHistory={() => setShowVersionHistory(true)}
            isProcessing={isCurrentlyProcessing}
            hasVersionedAudio={hasVersionedAudio}
            totalVersions={totalVersions}
            isAudioProcessorCompleted={isAudioProcessorCompleted}
          />

          <PromptEditDialog
            open={showPromptDialog}
            onClose={() => setShowPromptDialog(false)}
            audioType={audioType}
            editedPrompt={editedPrompt}
            onPromptChange={setEditedPrompt}
            onSavePrompt={handleSavePrompt}
            onEditPromptOnly={handleEditPromptOnly}
            isProcessing={isCurrentlyProcessing}
            hasBeenEdited={hasBeenEdited}
            originalPrompt={originalPrompt}
            isAudioProcessorCompleted={isAudioProcessorCompleted}
          />

          {/* Version History Dialog */}
          <VersionHistoryDialog
            showVersionHistory={showVersionHistory}
            setShowVersionHistory={setShowVersionHistory}
            audioConfig={{ name: audioConfig.name }}
            totalVersions={totalVersions}
            totalEdits={totalEdits}
            versions={versions}
            formatDuration={formatDuration}
            validateAudioValue={validateAudioValue}
            audioType={audioType}
            AudioPlayer={AudioPlayer}
            selectedPlaybackVersion={selectedPlaybackVersion}
            isRestoringVersion={isRestoringVersion}
            handleVersionPlayback={handleVersionPlayback}
            handleRestoreVersion={handleRestoreVersion}
          />
        </>
      )}
    </Box>
  );
}
