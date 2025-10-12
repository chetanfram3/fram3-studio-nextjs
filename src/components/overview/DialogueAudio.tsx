"use client";

import React, { useState, useCallback, useMemo, startTransition } from "react";
import {
  Box,
  Typography,
  Avatar,
  Tooltip,
  IconButton,
  Button,
  Chip,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
  Select,
  FormControl,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  Info as InfoIcon,
  Circle as CircleIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import AudioPlayer from "@/components/common/AudioPlayer";
import { useAudioData, useAudioVersions } from "@/hooks/useAudio";
import { useAudioRefetch } from "@/hooks/useAudioRefetch";
import {
  editDialogueAudioPrompt,
  processDialogueAudio,
  restoreAudioVersion,
} from "@/services/audioService";
import CustomToast from "@/components/common/CustomToast";
import { PromptEditDialog } from "./PromptEditDialog";
import { AudioMenu } from "./AudioMenu";
import type { UnifiedAudioItem, AudioStatus } from "@/types/audio";
import { ModelTier } from "@/components/common/ModelTierSelector";

interface DialogueData {
  actorId?: number;
  actorName?: string;
  dialogueContent?: string;
  audio?: {
    path?: string;
    duration?: number;
    processing?: number;
  };
}

interface ActorData {
  actorId: number;
  actorName?: string;
  signedUrl?: string;
  signedProfileUrl?: string;
}

interface DialogueAudioComponentProps {
  scriptId: string;
  versionId: string;
  sceneId: number;
  shotId?: number;
  dialogueId: number;
  dialogue: DialogueData;
  actor?: ActorData;
  onUpdate?: () => void;
  compact?: boolean;
  showVersionBadge?: boolean;
  allowEditing?: boolean;
  isAudioProcessorCompleted: boolean;
}

const DEFAULT_AVATAR = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=random`;

export default function DialogueAudioComponent({
  scriptId,
  versionId,
  sceneId,
  shotId,
  dialogueId,
  dialogue,
  actor,
  onUpdate,
  isAudioProcessorCompleted,
  compact = false,
  showVersionBadge = true,
  allowEditing = true,
}: DialogueAudioComponentProps) {
  // ==========================================
  // THEME & BRANDING (Required for all components)
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE DECLARATIONS
  // ==========================================
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlaybackVersion, setSelectedPlaybackVersion] = useState<
    number | null
  >(null);

  // ==========================================
  // VALIDATION UTILITY
  // ==========================================
  const validateAudioValue = useCallback(
    (value: unknown, defaultValue = 0): number => {
      if (value === null || value === undefined || value === "") {
        return defaultValue;
      }

      const numValue =
        typeof value === "number" ? value : parseFloat(String(value));

      if (isNaN(numValue) || !isFinite(numValue)) {
        console.warn(
          `Invalid audio value detected: ${value}, using default: ${defaultValue}`
        );
        return defaultValue;
      }

      return Math.max(0, numValue);
    },
    []
  );

  // ==========================================
  // DATA FETCHING HOOKS
  // ==========================================
  const shouldLoadData = Boolean(
    scriptId && versionId && sceneId && dialogueId > 0
  );

  const {
    audioData,
    getDialogueAudio,
    isLoading: isLoadingDialogueData,
    isFetching: isFetchingDialogueData,
    error: dialogueDataError,
    processDialogue,
    isProcessingDialogue,
  } = useAudioData(scriptId, versionId, {
    enabled: shouldLoadData,
    audioTypes: ["dialogue"],
    includeActions: false,
    staleTime: 1000 * 30,
  });

  const {
    totalVersions,
    currentVersion,
    versions,
    isRestoringVersion,
    isLoading: isLoadingVersions,
    error: versionsError,
    restoreVersion: restoreVersionMutation,
    getVersionByNumber,
  } = useAudioVersions(
    scriptId,
    versionId,
    "dialogue",
    sceneId,
    dialogueId,
    undefined,
    undefined,
    undefined,
    {
      enabled: shouldLoadData,
      staleTime: 1000 * 30,
    }
  );

  const { smartRefetch } = useAudioRefetch(scriptId, versionId);

  // ==========================================
  // COMPUTED VALUES (Using useMemo for expensive computations)
  // ==========================================
  const currentDialogueAudio = useMemo((): UnifiedAudioItem | null => {
    if (!shouldLoadData) return null;
    return getDialogueAudio(sceneId, dialogueId);
  }, [shouldLoadData, getDialogueAudio, sceneId, dialogueId]);

  const currentPrompt = useMemo(() => {
    return currentDialogueAudio?.prompt || dialogue.dialogueContent || "";
  }, [currentDialogueAudio, dialogue.dialogueContent]);

  const originalPrompt = useMemo(() => {
    const hasActions =
      currentDialogueAudio?.actions && currentDialogueAudio.actions.length > 0;
    if (hasActions) {
      const firstAction = currentDialogueAudio!.actions[0];
      return firstAction.type === "initial_creation"
        ? firstAction.newPrompt
        : dialogue.dialogueContent;
    }
    return dialogue.dialogueContent;
  }, [currentDialogueAudio, dialogue.dialogueContent]);

  const hasBeenEdited = useMemo(() => {
    return currentDialogueAudio?.totalEdits
      ? currentDialogueAudio.totalEdits > 0
      : false;
  }, [currentDialogueAudio]);

  const totalEdits = useMemo(() => {
    return currentDialogueAudio?.totalEdits || 0;
  }, [currentDialogueAudio]);

  // ==========================================
  // VERSION MANAGEMENT
  // ==========================================
  const currentAudioData = useMemo(() => {
    if (selectedPlaybackVersion === null) {
      const currentVersionData = versions.current;
      const prompt =
        currentVersionData?.prompt ||
        currentPrompt ||
        dialogue.dialogueContent ||
        "No dialogue content";
      const path =
        currentVersionData?.destinationPath ||
        currentDialogueAudio?.destinationPath ||
        dialogue.audio?.path ||
        "";
      const duration =
        currentVersionData?.duration ||
        currentDialogueAudio?.duration ||
        dialogue.audio?.duration;
      const modelTier = currentVersionData?.modelTier;

      return {
        destinationPath: path,
        duration: duration,
        prompt: prompt,
        version: currentVersion || 1,
        isCurrent: true,
        status: versions.current?.status,
        hasAudio: currentDialogueAudio?.hasAudio || Boolean(path),
        dialogueClassification: currentVersionData?.dialogueClassification,
        modelTier: modelTier,
      };
    } else {
      const selectedVersion = versions.archived?.[selectedPlaybackVersion];
      return {
        destinationPath: selectedVersion?.destinationPath || "",
        duration: selectedVersion?.duration,
        prompt: selectedVersion?.prompt || "No dialogue content",
        version: selectedPlaybackVersion,
        isCurrent: false,
        status: selectedVersion?.status || ("draft" as AudioStatus),
        hasAudio:
          selectedVersion?.hasAudio ||
          Boolean(selectedVersion?.destinationPath),
        dialogueClassification: selectedVersion?.dialogueClassification,
        modelTier: selectedVersion?.modelTier,
      };
    }
  }, [
    selectedPlaybackVersion,
    versions.current,
    versions.archived,
    currentDialogueAudio,
    dialogue,
    currentPrompt,
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

    Object.values(versions.archived || {})
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

  const actorInfo = useMemo(
    () => ({
      id: dialogue.actorId || actor?.actorId,
      name: dialogue.actorName || actor?.actorName || "Unknown Actor",
      avatar:
        actor?.signedProfileUrl ||
        actor?.signedUrl ||
        DEFAULT_AVATAR(dialogue.actorName || actor?.actorName || "Unknown"),
    }),
    [dialogue.actorId, dialogue.actorName, actor]
  );

  // ==========================================
  // COMPONENTS (Memoized for performance)
  // ==========================================
  const DialogueTypeIndicator = useCallback(
    ({ classification }: { classification?: any }) => {
      const isOnScreen = classification?.dialogueType === "onScreenDialogue";
      const color = isOnScreen
        ? theme.palette.success.main
        : theme.palette.grey[500];
      const tooltip = isOnScreen ? "On-Screen Dialogue" : "Off-Screen Dialogue";

      return (
        <Tooltip title={tooltip}>
          <CircleIcon
            sx={{
              fontSize: "0.75rem",
              color: color,
              ml: 0.5,
            }}
          />
        </Tooltip>
      );
    },
    [theme]
  );

  const StatusIndicator = useCallback(() => {
    const isCurrentlyProcessing =
      isProcessing || isRestoringVersion || isProcessingDialogue;
    const hasErrors = !!(dialogueDataError || versionsError);

    if (isCurrentlyProcessing) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Processing...
          </Typography>
        </Box>
      );
    }

    if (hasErrors) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isAudioProcessorCompleted && (
            <Tooltip title="Error loading audio data">
              <ErrorIcon color="error" fontSize="small" />
            </Tooltip>
          )}

          <Tooltip title="Audio processing is pending to be run">
            <InfoIcon color="info" fontSize="small" />
          </Tooltip>
        </Box>
      );
    }

    if (currentAudioData.hasAudio && currentAudioData.destinationPath) {
      return null;
    }

    return (
      <Tooltip title="No audio generated">
        <WarningIcon color="warning" fontSize="small" />
      </Tooltip>
    );
  }, [
    isProcessing,
    isRestoringVersion,
    isProcessingDialogue,
    dialogueDataError,
    versionsError,
    isAudioProcessorCompleted,
    currentAudioData,
    scriptId,
    versionId,
  ]);

  // ==========================================
  // EVENT HANDLERS (Using useCallback for optimization)
  // ==========================================
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const handleVersionPlayback = useCallback((versionNumber: number | null) => {
    startTransition(() => {
      setSelectedPlaybackVersion(versionNumber);
    });
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
    const initialPrompt = currentPrompt || dialogue.dialogueContent || "";
    setEditedPrompt(initialPrompt);
    setShowPromptDialog(true);
    setMenuAnchor(null);
  }, [currentPrompt, dialogue.dialogueContent]);

  const handleSavePrompt = useCallback(
    async (modelTier: ModelTier) => {
      if (!editedPrompt.trim()) {
        CustomToast.error("Prompt cannot be empty");
        return;
      }

      setIsProcessing(true);
      try {
        await editDialogueAudioPrompt({
          scriptId,
          versionId,
          sceneId,
          dialogueId,
          newPrompt: editedPrompt.trim(),
          generateAudio: true,
          modelTier: modelTier,
        });

        CustomToast.success("Dialogue prompt updated and audio regenerated");
        setShowPromptDialog(false);

        await smartRefetch("audio_generation", {
          scriptId,
          versionId,
          audioType: "dialogue",
          sceneId,
          dialogueId,
        });

        onUpdate?.();
      } catch (error: unknown) {
        console.error("Error updating prompt:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update prompt";
        CustomToast.error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [
      editedPrompt,
      scriptId,
      versionId,
      sceneId,
      dialogueId,
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
        await editDialogueAudioPrompt({
          scriptId,
          versionId,
          sceneId,
          dialogueId,
          newPrompt: editedPrompt.trim(),
          generateAudio: false,
          modelTier: modelTier,
        });

        CustomToast.success("Dialogue prompt updated");
        setShowPromptDialog(false);

        await smartRefetch("prompt_edit", {
          scriptId,
          versionId,
          audioType: "dialogue",
          sceneId,
          dialogueId,
        });

        onUpdate?.();
      } catch (error: unknown) {
        console.error("Error updating prompt only:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update prompt";
        CustomToast.error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [
      editedPrompt,
      scriptId,
      versionId,
      sceneId,
      dialogueId,
      smartRefetch,
      onUpdate,
    ]
  );

  const handleRegenerateAudio = useCallback(async () => {
    setIsProcessing(true);
    try {
      await processDialogueAudio({
        scriptId,
        versionId,
        sceneId,
        dialogueId,
        options: {
          sourcePrompt: currentPrompt || dialogue.dialogueContent,
          regenerationReason: "manual_regeneration",
          modelTier: currentAudioData.modelTier,
        },
      });

      CustomToast.success("Audio regenerated successfully");

      await smartRefetch("audio_generation", {
        scriptId,
        versionId,
        audioType: "dialogue",
        sceneId,
        dialogueId,
      });

      onUpdate?.();
    } catch (error: unknown) {
      console.error("Error regenerating audio:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to regenerate audio";
      CustomToast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
    handleMenuClose();
  }, [
    scriptId,
    versionId,
    sceneId,
    dialogueId,
    currentPrompt,
    dialogue.dialogueContent,
    currentAudioData.modelTier,
    smartRefetch,
    onUpdate,
    handleMenuClose,
  ]);

  const handleRestoreVersion = useCallback(
    async (targetVersion: number) => {
      try {
        await restoreAudioVersion({
          scriptId,
          versionId,
          audioType: "dialogue",
          sceneId,
          dialogueId,
          targetVersion,
        });

        CustomToast.success(`Restored to version ${targetVersion}`);

        setSelectedPlaybackVersion(null);

        await smartRefetch("version_restore", {
          scriptId,
          versionId,
          audioType: "dialogue",
          sceneId,
          dialogueId,
        });

        onUpdate?.();
      } catch (error: unknown) {
        console.error("Error restoring version:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to restore version";
        CustomToast.error(errorMessage);
      }
    },
    [scriptId, versionId, sceneId, dialogueId, smartRefetch, onUpdate]
  );

  // ==========================================
  // COMPUTED STATE
  // ==========================================
  const isCurrentlyProcessing =
    isProcessing || isRestoringVersion || isProcessingDialogue;
  const hasErrors = !!(dialogueDataError || versionsError);
  const isLoadingData = isLoadingDialogueData || isLoadingVersions;
  const hasVersionedAudio = totalVersions > 0;
  const hasMultipleVersions = totalVersions > 1;

  // ==========================================
  // EARLY RETURNS
  // ==========================================
  if (dialogueId <= 0) {
    return (
      <Alert severity="warning" size="small">
        Invalid dialogue ID: {dialogueId}. Cannot load audio data.
      </Alert>
    );
  }

  if (isLoadingData) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="caption" color="text.secondary">
          Loading audio data...
        </Typography>
      </Box>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  if (compact) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1 }}>
        {/* Actor and Status Row */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            src={actorInfo.avatar}
            alt={actorInfo.name}
            sx={{ width: 32, height: 32 }}
          />
          <Typography
            variant="subtitle2"
            sx={{ flex: 1, color: "text.primary" }}
          >
            {actorInfo.name}
          </Typography>
          <DialogueTypeIndicator
            classification={currentAudioData.dialogueClassification}
          />
          <StatusIndicator />
          {allowEditing && (
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{
                color: "primary.main",
                "&:hover": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                },
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Dialogue Content */}
        <Typography
          variant="body2"
          color="text.primary"
          sx={{
            fontStyle: "italic",
            pl: 1,
            borderLeft: 2,
            borderColor: "primary.main",
            fontSize: "0.875rem",
          }}
        >
          &quot;{currentAudioData.prompt}&quot;
        </Typography>

        {/* Version Selection and Badge */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {showVersionBadge && hasVersionedAudio && (
            <>
              <Chip
                size="small"
                label={`v${currentAudioData.version}`}
                color={currentAudioData.isCurrent ? "primary" : "default"}
                icon={currentAudioData.isCurrent ? <StarIcon /> : undefined}
                sx={{ fontSize: "0.75rem", height: 20 }}
              />
              {totalEdits > 0 && (
                <Chip
                  size="small"
                  label={`${totalEdits} edit${totalEdits !== 1 ? "s" : ""}`}
                  variant="outlined"
                  sx={{
                    fontSize: "0.75rem",
                    height: 20,
                    borderColor: "primary.main",
                  }}
                />
              )}
              {(selectedPlaybackVersion === null
                ? versions.current?.isDraft
                : versions.archived?.[selectedPlaybackVersion]?.isDraft) && (
                <Chip
                  size="small"
                  label="Draft"
                  color="warning"
                  variant="outlined"
                  sx={{ fontSize: "0.75rem", height: 20 }}
                />
              )}
            </>
          )}

          {/* Version Selector */}
          {hasMultipleVersions && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={selectedPlaybackVersion || currentVersion}
                onChange={(e) =>
                  handleVersionPlayback(
                    e.target.value === currentVersion
                      ? null
                      : (e.target.value as number)
                  )
                }
                size="small"
                sx={{
                  fontSize: "0.75rem",
                  height: 24,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "primary.main",
                  },
                }}
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
        {currentAudioData.hasAudio && currentAudioData.destinationPath && (
          <Box sx={{ mt: 1 }}>
            {!currentAudioData.isCurrent && (
              <Alert
                severity="info"
                size="small"
                sx={{
                  mb: 1,
                  bgcolor: "background.paper",
                  color: "text.primary",
                }}
              >
                <Typography variant="caption">
                  Previewing Version {currentAudioData.version} (Not Current)
                </Typography>
              </Alert>
            )}

            <AudioPlayer
              audioPath={currentAudioData.destinationPath}
              initialDuration={validateAudioValue(currentAudioData.duration, 0)}
              audioType="dialogue"
            />

            {!currentAudioData.isCurrent && (
              <Button
                size="small"
                startIcon={<StarIcon />}
                onClick={() => handleRestoreVersion(currentAudioData.version)}
                disabled={isRestoringVersion}
                color="primary"
                variant="outlined"
                sx={{
                  mt: 1,
                  fontSize: "0.75rem",
                  borderColor: "primary.main",
                  "&:hover": {
                    borderColor: "primary.dark",
                  },
                }}
              >
                Set as Default
              </Button>
            )}
          </Box>
        )}

        {/* Processing Indicator */}
        {isCurrentlyProcessing && (
          <LinearProgress
            variant="indeterminate"
            sx={{
              mt: 1,
              bgcolor: "background.paper",
              "& .MuiLinearProgress-bar": {
                bgcolor: "primary.main",
              },
            }}
          />
        )}

        {/* Menu */}
        {allowEditing && (
          <AudioMenu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            audioType="dialogue"
            onEditPrompt={handleEditPrompt}
            onRegenerateAudio={handleRegenerateAudio}
            onShowVersionHistory={() => setShowVersionHistory(true)}
            isProcessing={isCurrentlyProcessing}
            hasVersionedAudio={hasVersionedAudio}
            totalVersions={totalVersions}
            isAudioProcessorCompleted={isAudioProcessorCompleted}
          />
        )}

        {/* Prompt Edit Dialog */}
        <PromptEditDialog
          open={showPromptDialog}
          onClose={() => setShowPromptDialog(false)}
          audioType="dialogue"
          editedPrompt={editedPrompt}
          onPromptChange={setEditedPrompt}
          onSavePrompt={handleSavePrompt}
          onEditPromptOnly={handleEditPromptOnly}
          isProcessing={isCurrentlyProcessing}
          hasBeenEdited={hasBeenEdited}
          originalPrompt={originalPrompt}
          placeholder="Enter dialogue content..."
          isAudioProcessorCompleted={isAudioProcessorCompleted}
        />

        {/* Version History Dialog */}
      </Box>
    );
  }

  // Full version
  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        bgcolor: "background.paper",
        borderColor: "primary.main",
        borderRadius: `${brand.borderRadius}px`,
      }}
    >
      <CardContent>
        <Typography variant="h6" color="text.primary">
          Full version not implemented - using compact mode
        </Typography>
      </CardContent>
    </Card>
  );
}

DialogueAudioComponent.displayName = "DialogueAudioComponent";
