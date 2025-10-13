"use client";

import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  styled,
  alpha,
  Avatar,
  Typography,
  Button,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  useTheme,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  X as Close,
  RotateCcw as RestoreIcon,
  ChevronDown as ExpandMoreIcon,
  Clock,
  Calendar,
  Music,
  Edit3,
  Play,
  GitBranch,
  Zap,
  FileAudio,
  Settings,
} from "lucide-react";
import {
  Diamond as UltraIcon,
  Star as PremiumIcon,
  Circle as ProIcon,
  Zap as BasicIcon,
} from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";
import { MODEL_TIERS } from "@/components/common/ModelTierSelector";

// =============================================================================
// STYLED COMPONENTS - Theme-compliant
// =============================================================================

const CompactDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: getCurrentBrand().borderRadius * 2,
    border: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.paper,
    backgroundImage: "none !important", // Disable MUI overlay
    boxShadow: theme.shadows[24],
    maxWidth: "900px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "hidden",
  },
}));

const GradientAvatar = styled(Avatar)(() => {
  const brand = getCurrentBrand();
  return {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    borderRadius: brand.borderRadius,
    width: 32,
    height: 32,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  };
});

const CompactButton = styled(Button)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: brand.borderRadius,
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.875rem",
    padding: "6px 12px",
    minWidth: "auto",
    fontFamily: brand.fonts.body,
    transition: theme.transitions.create(["transform", "box-shadow"], {
      duration: theme.transitions.duration.short,
    }),
    "&:hover": {
      transform: "translateY(-1px)",
    },
  };
});

const VersionCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "cardvariant",
})<{ cardvariant?: "current" | "archived" }>(({ theme, cardvariant }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: brand.borderRadius * 1.5,
    padding: theme.spacing(2),
    border:
      cardvariant === "current"
        ? `2px solid ${theme.palette.primary.main}`
        : `1px solid ${theme.palette.divider}`,
    background:
      cardvariant === "current"
        ? alpha(theme.palette.primary.main, 0.03)
        : theme.palette.background.paper,
    transition: theme.transitions.create(["border-color", "box-shadow"], {
      duration: theme.transitions.duration.short,
    }),
    "&:hover": {
      borderColor:
        cardvariant === "current"
          ? theme.palette.primary.main
          : theme.palette.primary.light,
      boxShadow: theme.shadows[4],
    },
  };
});

const MetadataChip = styled(Chip)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: brand.borderRadius,
    fontSize: "0.75rem",
    fontWeight: 500,
    height: "24px",
    background: alpha(theme.palette.text.primary, 0.05),
    border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
    "& .MuiChip-icon": {
      fontSize: "14px",
      marginLeft: "4px",
    },
  };
});

const CompactAccordion = styled(Accordion)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: `${brand.borderRadius}px !important`,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "none",
    "&:before": {
      display: "none",
    },
    "& .MuiAccordionSummary-root": {
      borderRadius: brand.borderRadius,
      minHeight: "48px",
      "&.Mui-expanded": {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      },
    },
    "& .MuiAccordionDetails-root": {
      borderTop: `1px solid ${theme.palette.divider}`,
      borderBottomLeftRadius: brand.borderRadius,
      borderBottomRightRadius: brand.borderRadius,
    },
  };
});

const EditHistoryCard = styled(Paper)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: brand.borderRadius,
    padding: theme.spacing(1.5),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    background: alpha(theme.palette.primary.main, 0.03),
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: "3px",
      height: "100%",
      background: theme.palette.primary.main,
      borderRadius: `0 ${brand.borderRadius}px ${brand.borderRadius}px 0`,
    },
  };
});

const PromptCard = styled(Box)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    background: alpha(theme.palette.text.primary, 0.03),
    padding: "12px 16px",
    borderRadius: brand.borderRadius,
    border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
    fontStyle: "italic",
    fontSize: "0.875rem",
    lineHeight: 1.4,
    position: "relative",
    fontFamily: brand.fonts.body,
    color: theme.palette.text.primary,
    "&::before": {
      content: '"\\201C"',
      position: "absolute",
      left: "8px",
      top: "8px",
      fontSize: "1.2rem",
      color: theme.palette.text.secondary,
      opacity: 0.5,
    },
    "&::after": {
      content: '"\\201D"',
      position: "absolute",
      right: "8px",
      bottom: "8px",
      fontSize: "1.2rem",
      color: theme.palette.text.secondary,
      opacity: 0.5,
    },
  };
});

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface VersionData {
  version: number;
  prompt?: string;
  destinationPath?: string;
  duration?: number;
  modelTier?: number;
  status?: string;
  isDraft?: boolean;
  timestamp?: { _seconds: number } | string;
  actions?: ActionData[];
  [key: string]: unknown;
}

interface PromptJourney {
  from?: string;
  to?: string;
  wasEdited?: boolean;
}

interface ActionData {
  type: string;
  timestamp?: { _seconds: number } | string;
  fromVersion?: number;
  toVersion?: number;
  displayVersion?: number;
  newPrompt?: string;
  finalPrompt?: string;
  originalPrompt?: string;
  previousPrompt?: string;
  source?: string;
  versionContext?: string;
  versionTransition?: string | null;
  enhancedMetadata?: {
    hasVersionTransition: boolean;
    isVersionCreation: boolean;
    isContentGeneration: boolean;
    isInitialCreation: boolean;
    regenerationReason?: string;
    wasCompleted?: boolean;
    duration?: number;
    model?: string;
    modelTier?: number;
    totalEditsBeforeGeneration?: number;
    promptJourney?: PromptJourney;
    voiceConfig?: unknown;
    actorId?: number;
    narratorId?: number;
    audioMetrics?: unknown;
    contentPath?: string;
  };
  prompt?: string;
  regenerationReason?: string;
  wasCompleted?: boolean;
  duration?: number;
  model?: string;
  currentModel?: string;
  modelTier?: number;
  currentModelTier?: number;
  totalEditsBeforeGeneration?: number;
  promptJourney?: {
    from?: string;
    to?: string;
    wasEdited?: boolean;
  };
  voiceConfig?: unknown;
  currentVoiceConfig?: unknown;
  actorId?: number;
  narratorId?: number;
  audioMetrics?: unknown;
  metadata?: unknown;
  contentPath?: string;
  destinationPath?: string;
  sourceVersion?: number;
  restoredFromVersion?: number;
  contentGenerated?: boolean;
  fromCompletedVersion?: boolean;
  completedDraftVersion?: number;
  [key: string]: unknown;
}

interface VersionHistoryDialogProps {
  showVersionHistory: boolean;
  setShowVersionHistory: (show: boolean) => void;
  audioConfig: {
    name: string;
  };
  totalVersions: number;
  totalEdits: number;
  versions: {
    current?: VersionData;
    archived?: Record<string, VersionData>;
  };
  formatDuration: (duration: number) => string;
  validateAudioValue: (value: number, fallback: number) => number;
  audioType: string;
  AudioPlayer: React.ComponentType<{
    audioPath: string;
    initialDuration: number;
    audioType: string;
    [key: string]: unknown;
  }>;
  // Optional props
  selectedPlaybackVersion?: number | null;
  isRestoringVersion?: boolean;
  handleVersionPlayback?: (version: number) => void;
  handleRestoreVersion?: (version: number) => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VersionHistoryDialog({
  showVersionHistory,
  setShowVersionHistory,
  audioConfig,
  totalVersions,
  totalEdits,
  versions,
  formatDuration,
  validateAudioValue,
  audioType,
  isRestoringVersion,
  handleRestoreVersion,
  AudioPlayer,
}: VersionHistoryDialogProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ===========================================================================
  // HELPER FUNCTIONS - Memoized per React 19 best practices
  // ===========================================================================

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "initial_creation":
        return <Zap size={16} />;
      case "prompt_edit":
        return <Edit3 size={16} />;
      case "content_generation":
        return <Play size={16} />;
      case "version_restoration":
        return <GitBranch size={16} />;
      default:
        return <Settings size={16} />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "initial_creation":
        return "primary";
      case "prompt_edit":
        return "primary";
      case "content_generation":
        return "success";
      case "version_restoration":
        return "info";
      default:
        return "primary";
    }
  };

  const getModelTierInfo = (modelTier: number) => {
    switch (modelTier) {
      case MODEL_TIERS.BASIC:
        return {
          label: "Basic",
          color: theme.palette.grey[600],
          icon: <BasicIcon size={12} />,
        };
      case MODEL_TIERS.PRO:
        return {
          label: "Pro",
          color: theme.palette.info.main,
          icon: <ProIcon size={12} />,
        };
      case MODEL_TIERS.PREMIUM:
        return {
          label: "Premium",
          color: theme.palette.warning.main,
          icon: <PremiumIcon size={12} />,
        };
      case MODEL_TIERS.ULTRA:
        return {
          label: "Ultra",
          color: theme.palette.error.main,
          icon: <UltraIcon size={12} />,
        };
      default:
        return null;
    }
  };

  const formatRegenerationReason = (reason: string | undefined) => {
    if (!reason) return null;

    const reasonMap: Record<string, { label: string; color: string }> = {
      user_edit: { label: "User Edit", color: "primary" },
      user_request: { label: "User Request", color: "primary" },
      prompt_edit_with_generation: {
        label: "Prompt + Audio",
        color: "success",
      },
      initial_generation: { label: "Initial", color: "primary" },
      draft_completion: { label: "Draft Complete", color: "info" },
      draft_completion_edited: { label: "Edited Draft", color: "warning" },
      prompt_based_regeneration: { label: "Prompt Change", color: "primary" },
      batch_regeneration: { label: "Batch Regen", color: "info" },
      force_regeneration: { label: "Force Regen", color: "error" },
    };

    return (
      reasonMap[reason] || {
        label: reason.replace(/_/g, " "),
        color: "default",
      }
    );
  };

  // ===========================================================================
  // PROCESS EDIT HISTORY - Extract from versions object only
  // React 19: useMemo for expensive computations with multiple dependencies
  // ===========================================================================

  const processedEditHistory = useMemo(() => {
    const allActions: ActionData[] = [];

    // Extract from current version
    if (versions.current?.actions) {
      allActions.push(
        ...versions.current.actions.map((action) => ({
          ...action,
          fromVersion: action.fromVersion || versions.current?.version,
          toVersion: action.toVersion || versions.current?.version,
          displayVersion: action.toVersion || versions.current?.version,
          source: "current",
          versionContext: "current",
        }))
      );
    }

    // Extract from all archived versions
    Object.entries(versions.archived || {}).forEach(([versionNum, version]) => {
      if (version?.actions) {
        allActions.push(
          ...version.actions.map((action) => ({
            ...action,
            fromVersion: action.fromVersion || version.version,
            toVersion: action.toVersion || version.version,
            displayVersion: action.toVersion || version.version,
            source: `archived-v${versionNum}`,
            versionContext: "archived",
          }))
        );
      }
    });

    // Sort chronologically by timestamp
    const sortedActions = allActions.sort((a, b) => {
      const timestampA =
        typeof a.timestamp === "object" && "_seconds" in a.timestamp
          ? a.timestamp._seconds
          : new Date(a.timestamp || 0).getTime() / 1000;
      const timestampB =
        typeof b.timestamp === "object" && "_seconds" in b.timestamp
          ? b.timestamp._seconds
          : new Date(b.timestamp || 0).getTime() / 1000;
      return timestampA - timestampB;
    });

    // Enhance with metadata
    const processedActions = sortedActions.map((action) => {
      let versionTransition = null;

      // Version transition detection
      if (
        action.fromVersion &&
        action.toVersion &&
        action.fromVersion !== action.toVersion
      ) {
        versionTransition = `v${action.fromVersion} → v${action.toVersion}`;
      } else if (action.type === "content_generation") {
        const completedVersion =
          action.completedDraftVersion ||
          action.toVersion ||
          action.displayVersion;
        if (completedVersion) {
          versionTransition = `v${completedVersion}`;
        }
      }

      const promptJourney: PromptJourney = {
        from: action.originalPrompt || action.previousPrompt,
        to: action.finalPrompt || action.newPrompt || action.prompt,
        wasEdited:
          action.promptJourney?.wasEdited ||
          Boolean(
            action.originalPrompt &&
              action.finalPrompt &&
              action.originalPrompt !== action.finalPrompt
          ),
      };

      // Enhanced metadata
      const enhancedMetadata = {
        hasVersionTransition: !!versionTransition,
        isVersionCreation:
          action.type === "prompt_edit" &&
          action.fromVersion !== action.toVersion,
        isContentGeneration: action.type === "content_generation",
        isInitialCreation: action.type === "initial_creation",
        regenerationReason: action.regenerationReason,
        wasCompleted: action.wasCompleted,
        duration: action.duration,
        model: action.model || action.currentModel,
        modelTier: action.modelTier || action.currentModelTier,
        totalEditsBeforeGeneration: action.totalEditsBeforeGeneration,
        promptJourney: action.promptJourney || promptJourney,
        voiceConfig: action.voiceConfig || action.currentVoiceConfig,
        actorId: action.actorId,
        narratorId: action.narratorId,
        audioMetrics: action.audioMetrics || action.metadata,
        contentPath: action.contentPath || action.destinationPath,
      };

      return {
        ...action,
        versionTransition,
        displayVersion:
          action.toVersion || action.displayVersion || action.fromVersion,
        enhancedMetadata,
      };
    });

    // Reverse for display (most recent first)
    return processedActions.reverse();
  }, [versions]);

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <CompactDialog
      open={showVersionHistory}
      onClose={() => setShowVersionHistory(false)}
      fullWidth
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.05
            )}, ${alpha(theme.palette.primary.main, 0.02)})`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <GradientAvatar>
              <Music size={18} style={{ color: "white" }} />
            </GradientAvatar>
            <Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                fontSize="1.2rem"
                sx={{ fontFamily: brand.fonts.heading, color: "text.primary" }}
              >
                {audioConfig.name} History
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}
              >
                <MetadataChip
                  icon={<GitBranch />}
                  label={`${totalVersions} versions`}
                  size="small"
                />
                <MetadataChip
                  icon={<Edit3 />}
                  label={`${totalEdits} edits`}
                  size="small"
                />
                <MetadataChip
                  icon={<Clock />}
                  label={`${processedEditHistory.length} actions`}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
          <IconButton
            onClick={() => setShowVersionHistory(false)}
            sx={{
              borderRadius: brand.borderRadius,
              p: 1,
              background: alpha(theme.palette.background.paper, 0.8),
              color: "text.primary",
              "&:hover": {
                background: theme.palette.background.paper,
              },
            }}
          >
            <Close size={20} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            maxHeight: "calc(90vh - 180px)",
            overflowY: "auto",
          }}
        >
          <Stack spacing={3}>
            {/* Current Version */}
            {versions.current && (
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="700"
                  sx={{ mb: 2, color: "text.primary" }}
                >
                  Current Version
                </Typography>
                <VersionCard cardvariant="current">
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.5,
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{
                            fontFamily: brand.fonts.heading,
                            color: "text.primary",
                          }}
                        >
                          Version {versions.current.version}
                        </Typography>
                        <Chip
                          label="Current"
                          color="primary"
                          size="small"
                          sx={{
                            borderRadius: brand.borderRadius,
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        />
                      </Box>

                      <PromptCard sx={{ mb: 2 }}>
                        {versions.current.prompt || "No prompt available"}
                      </PromptCard>

                      {/* Metadata */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                          mb: 2,
                        }}
                      >
                        {versions.current.duration &&
                          versions.current.duration > 0 && (
                            <MetadataChip
                              icon={<Clock />}
                              label={formatDuration(versions.current.duration)}
                              size="small"
                            />
                          )}
                        {(() => {
                          const modelTierInfo = getModelTierInfo(
                            versions.current.modelTier || 0
                          );
                          return modelTierInfo ? (
                            <Tooltip
                              title={`Generated with ${modelTierInfo.label} model`}
                            >
                              <Chip
                                icon={modelTierInfo.icon}
                                label={modelTierInfo.label}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  bgcolor: alpha(modelTierInfo.color, 0.1),
                                  color: modelTierInfo.color,
                                  border: `1px solid ${alpha(modelTierInfo.color, 0.3)}`,
                                  "& .MuiChip-icon": {
                                    color: modelTierInfo.color,
                                    fontSize: 10,
                                  },
                                }}
                              />
                            </Tooltip>
                          ) : null;
                        })()}
                        {versions.current.timestamp && (
                          <MetadataChip
                            icon={<Calendar />}
                            label={new Date(
                              typeof versions.current.timestamp === "object" &&
                              "_seconds" in versions.current.timestamp
                                ? versions.current.timestamp._seconds * 1000
                                : versions.current.timestamp
                            ).toLocaleDateString()}
                            size="small"
                          />
                        )}
                      </Box>

                      {/* Audio Player */}
                      {versions.current.destinationPath && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            background: alpha(
                              theme.palette.background.default,
                              0.3
                            ),
                            borderRadius: brand.borderRadius,
                            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                          }}
                        >
                          <AudioPlayer
                            audioPath={versions.current.destinationPath}
                            initialDuration={validateAudioValue(
                              versions.current.duration || 0,
                              0
                            )}
                            audioType={
                              audioType === "roomTone" ? "roomtone" : audioType
                            }
                            key={`history-current-${versions.current.version}`}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                </VersionCard>
              </Box>
            )}

            {/* Archived Versions */}
            {versions.archived && Object.keys(versions.archived).length > 0 && (
              <Box>
                <CompactAccordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      borderRadius: brand.borderRadius,
                      backgroundColor: theme.palette.background.default,
                      "&.Mui-expanded": {
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="700"
                        sx={{ color: "text.primary" }}
                      >
                        Archived Versions
                      </Typography>
                      <Chip
                        label={`${Object.keys(versions.archived).length} versions`}
                        size="small"
                        sx={{
                          borderRadius: brand.borderRadius,
                          background: alpha(theme.palette.primary.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                          color: theme.palette.primary.main,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      p: 2,
                      backgroundColor: theme.palette.background.default,
                      borderTop: `1px solid ${theme.palette.divider}`,
                      borderBottomLeftRadius: brand.borderRadius,
                      borderBottomRightRadius: brand.borderRadius,
                    }}
                  >
                    <Stack spacing={2}>
                      {Object.values(versions.archived)
                        .sort((a, b) => (b.version || 0) - (a.version || 0))
                        .map((version) => (
                          <VersionCard
                            key={version.version}
                            cardvariant="archived"
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                mb: 2,
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 1.5,
                                  }}
                                >
                                  <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{
                                      fontFamily: brand.fonts.heading,
                                      color: "text.primary",
                                    }}
                                  >
                                    Version {version.version}
                                  </Typography>
                                  {version.isDraft && (
                                    <Chip
                                      label="Draft"
                                      color="warning"
                                      variant="outlined"
                                      size="small"
                                      sx={{
                                        borderRadius: brand.borderRadius,
                                        fontWeight: 600,
                                        fontSize: "0.7rem",
                                      }}
                                    />
                                  )}
                                </Box>

                                <PromptCard sx={{ mb: 2 }}>
                                  {version.prompt || "No prompt available"}
                                </PromptCard>

                                {/* Metadata */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    flexWrap: "wrap",
                                    mb: 2,
                                  }}
                                >
                                  {version.duration && version.duration > 0 && (
                                    <MetadataChip
                                      icon={<Clock />}
                                      label={formatDuration(version.duration)}
                                      size="small"
                                    />
                                  )}
                                  {(() => {
                                    const modelTierInfo = getModelTierInfo(
                                      version.modelTier || 0
                                    );
                                    return modelTierInfo ? (
                                      <Tooltip
                                        title={`Generated with ${modelTierInfo.label} model`}
                                      >
                                        <Chip
                                          icon={modelTierInfo.icon}
                                          label={modelTierInfo.label}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: "0.7rem",
                                            fontWeight: 600,
                                            bgcolor: alpha(
                                              modelTierInfo.color,
                                              0.1
                                            ),
                                            color: modelTierInfo.color,
                                            border: `1px solid ${alpha(modelTierInfo.color, 0.3)}`,
                                            "& .MuiChip-icon": {
                                              color: modelTierInfo.color,
                                              fontSize: 10,
                                            },
                                          }}
                                        />
                                      </Tooltip>
                                    ) : null;
                                  })()}
                                </Box>

                                {/* Restore Button */}
                                {handleRestoreVersion && (
                                  <CompactButton
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    startIcon={<RestoreIcon size={14} />}
                                    onClick={() =>
                                      handleRestoreVersion(version.version)
                                    }
                                    disabled={isRestoringVersion}
                                    sx={{ mb: 2 }}
                                  >
                                    Restore Version
                                  </CompactButton>
                                )}

                                {/* Audio Player */}
                                {version.destinationPath && (
                                  <Box
                                    sx={{
                                      mt: 2,
                                      p: 2,
                                      background: alpha(
                                        theme.palette.background.default,
                                        0.3
                                      ),
                                      borderRadius: brand.borderRadius,
                                      border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                                    }}
                                  >
                                    <AudioPlayer
                                      audioPath={version.destinationPath}
                                      initialDuration={validateAudioValue(
                                        version.duration || 0,
                                        0
                                      )}
                                      audioType={
                                        audioType === "roomTone"
                                          ? "roomtone"
                                          : audioType
                                      }
                                      key={`history-archived-${version.version}`}
                                    />
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </VersionCard>
                        ))}
                    </Stack>
                  </AccordionDetails>
                </CompactAccordion>
              </Box>
            )}

            {/* Edit History */}
            {processedEditHistory.length > 0 ? (
              <Box>
                <CompactAccordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      borderRadius: brand.borderRadius,
                      backgroundColor: theme.palette.background.default,
                      "&.Mui-expanded": {
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="700"
                        sx={{ color: "text.primary" }}
                      >
                        Complete Edit History
                      </Typography>
                      <Chip
                        label={`${processedEditHistory.length} actions`}
                        size="small"
                        sx={{
                          borderRadius: brand.borderRadius,
                          background: alpha(theme.palette.info.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                          color: theme.palette.info.main,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      p: 2,
                      backgroundColor: theme.palette.background.default,
                      borderTop: `1px solid ${theme.palette.divider}`,
                      borderBottomLeftRadius: brand.borderRadius,
                      borderBottomRightRadius: brand.borderRadius,
                    }}
                  >
                    <Stack spacing={2}>
                      {processedEditHistory.map((edit, index) => {
                        const actionColor = getActionColor(edit.type);
                        const actionIcon = getActionIcon(edit.type);

                        return (
                          <EditHistoryCard key={index}>
                            <Box sx={{ pl: 1 }}>
                              {/* Header */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  mb: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      color:
                                        theme.palette[actionColor]?.main ||
                                        theme.palette.text.primary,
                                    }}
                                  >
                                    {actionIcon}
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight="600"
                                      sx={{ color: "inherit" }}
                                    >
                                      {edit.type === "prompt_edit" &&
                                        "Prompt Changed"}
                                      {edit.type === "content_generation" &&
                                        "Audio Generated"}
                                      {edit.type === "version_restoration" &&
                                        "Version Restored"}
                                      {edit.type === "initial_creation" &&
                                        "Initial Creation"}
                                      {![
                                        "prompt_edit",
                                        "content_generation",
                                        "version_restoration",
                                        "initial_creation",
                                      ].includes(edit.type) &&
                                        (edit.type?.replace(/_/g, " ") ||
                                          "Unknown Action")}
                                    </Typography>
                                  </Box>
                                  {edit.versionTransition && (
                                    <Chip
                                      label={edit.versionTransition}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        fontSize: "0.7rem",
                                        height: 20,
                                        borderColor:
                                          theme.palette[actionColor]?.main,
                                        color: theme.palette[actionColor]?.main,
                                      }}
                                    />
                                  )}
                                </Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight="600"
                                >
                                  {(() => {
                                    const timestamp = edit.timestamp;
                                    if (
                                      timestamp &&
                                      typeof timestamp === "object" &&
                                      "_seconds" in timestamp
                                    ) {
                                      return new Date(
                                        timestamp._seconds * 1000
                                      ).toLocaleString();
                                    }
                                    return new Date(
                                      timestamp || Date.now()
                                    ).toLocaleString();
                                  })()}
                                </Typography>
                              </Box>

                              {/* Content based on action type */}
                              {[
                                "prompt_edit",
                                "content_generation",
                                "version_restoration",
                                "initial_creation",
                              ].includes(edit.type) && (
                                <Box>
                                  {(edit.newPrompt ||
                                    edit.prompt ||
                                    edit.originalPrompt) && (
                                    <Box sx={{ mt: 1 }}>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ mb: 1, display: "block" }}
                                      >
                                        <strong>Content:</strong>
                                      </Typography>
                                      <PromptCard
                                        sx={{
                                          fontSize: "0.8rem",
                                          padding: "8px 12px",
                                        }}
                                      >
                                        {edit.newPrompt ||
                                          edit.prompt ||
                                          edit.originalPrompt}
                                      </PromptCard>
                                    </Box>
                                  )}
                                </Box>
                              )}

                              {/* Footer */}
                              <Divider sx={{ my: 1, opacity: 0.3 }} />
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Action #{processedEditHistory.length - index}
                                </Typography>
                                {edit.source && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: "0.7rem" }}
                                  >
                                    Source: {edit.source}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </EditHistoryCard>
                        );
                      })}
                    </Stack>
                  </AccordionDetails>
                </CompactAccordion>
              </Box>
            ) : (
              <Box>
                <CompactAccordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      borderRadius: brand.borderRadius,
                      backgroundColor: theme.palette.background.default,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="700"
                        sx={{ color: "text.primary" }}
                      >
                        Edit History
                      </Typography>
                      <Chip
                        label="No history"
                        size="small"
                        sx={{
                          borderRadius: brand.borderRadius,
                          background: alpha(theme.palette.warning.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                          color: theme.palette.warning.main,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      p: 2,
                      backgroundColor: theme.palette.background.default,
                      borderTop: `1px solid ${theme.palette.divider}`,
                      borderBottomLeftRadius: brand.borderRadius,
                      borderBottomRightRadius: brand.borderRadius,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No edit history available for this audio item. This might
                      be a newly created item or the history data hasn&apos;t
                      been populated yet.
                    </Typography>
                  </AccordionDetails>
                </CompactAccordion>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            background: alpha(theme.palette.background.default, 0.8),
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Unified versioning system with enhanced action tracking
          </Typography>
          <CompactButton
            onClick={() => setShowVersionHistory(false)}
            variant="contained"
            color="primary"
          >
            Close
          </CompactButton>
        </Box>
      </DialogContent>
    </CompactDialog>
  );
}

VersionHistoryDialog.displayName = "VersionHistoryDialog";
