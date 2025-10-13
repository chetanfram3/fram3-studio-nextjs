"use client";

import React from "react";
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
  AlertCircle,
  CheckCircle,
  FileAudio,
  Settings,
} from "lucide-react";
import {
  Diamond as UltraIcon,
  Star as PremiumIcon,
  Circle as ProIcon,
  Zap as BasicIcon,
} from "lucide-react";
import { MODEL_TIERS } from "@/components/common/ModelTierSelector";

// Styled Components matching AddCreditsModal
const CompactDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: "16px",
    border: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.paper,
    boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.15)}`,
    maxWidth: "900px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "hidden",
  },
}));

const GradientAvatar = styled(Avatar)(({ gradient }: { gradient: string }) => ({
  background: gradient,
  borderRadius: "12px",
  width: 32,
  height: 32,
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
}));

const CompactButton = styled(Button)(({}) => ({
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.875rem",
  padding: "6px 12px",
  minWidth: "auto",
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "translateY(-1px)",
  },
}));

const VersionCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "cardvariant",
})<{ cardvariant?: "current" | "archived" }>(({ theme, cardvariant }) => ({
  borderRadius: "12px",
  padding: theme.spacing(2),
  border:
    cardvariant === "current"
      ? `2px solid ${theme.palette.primary.main}`
      : `1px solid ${theme.palette.divider}`,
  background:
    cardvariant === "current"
      ? alpha(theme.palette.primary.main, 0.03)
      : theme.palette.background.paper,
  transition: "all 0.2s ease",
  "&:hover": {
    borderColor:
      cardvariant === "current"
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
  },
}));

const MetadataChip = styled(Chip)(({ theme }) => ({
  borderRadius: "8px",
  fontSize: "0.75rem",
  fontWeight: 500,
  height: "24px",
  background: alpha(theme.palette.text.primary, 0.05),
  border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
  "& .MuiChip-icon": {
    fontSize: "14px",
    marginLeft: "4px",
  },
}));

const CompactAccordion = styled(Accordion)(({ theme }) => ({
  borderRadius: "12px !important",
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "none",
  "&:before": {
    display: "none",
  },
  "& .MuiAccordionSummary-root": {
    borderRadius: "12px",
    minHeight: "48px",
    "&.Mui-expanded": {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
  },
  "& .MuiAccordionDetails-root": {
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottomLeftRadius: "12px",
    borderBottomRightRadius: "12px",
  },
}));

const EditHistoryCard = styled(Paper)(({ theme }) => ({
  borderRadius: "8px",
  padding: theme.spacing(1.5),
  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
  background: alpha(theme.palette.secondary.main, 0.03),
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: "3px",
    height: "100%",
    background: theme.palette.secondary.main,
    borderRadius: "0 8px 8px 0",
  },
}));

const PromptCard = styled(Box)(({ theme }) => ({
  background: alpha(theme.palette.text.primary, 0.03),
  padding: "12px 16px",
  borderRadius: "8px",
  border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
  fontStyle: "italic",
  fontSize: "0.875rem",
  lineHeight: 1.4,
  position: "relative",
  "&::before": {
    content: '"\\201C"', // Left double quotation mark
    position: "absolute",
    left: "8px",
    top: "8px",
    fontSize: "1.2rem",
    color: theme.palette.text.secondary,
    opacity: 0.5,
  },
  "&::after": {
    content: '"\\201D"', // Right double quotation mark
    position: "absolute",
    right: "8px",
    bottom: "8px",
    fontSize: "1.2rem",
    color: theme.palette.text.secondary,
    opacity: 0.5,
  },
}));

interface VersionHistoryDialogProps {
  showVersionHistory: boolean;
  setShowVersionHistory: (show: boolean) => void;
  audioConfig: {
    name: string;
  };
  totalVersions: number;
  totalEdits: number;
  versions: {
    current?: any & { modelTier?: number }; // Add modelTier
    archived?: Record<string, any & { modelTier?: number }>;
  };
  editHistory: any[];
  formatDuration: (duration: number) => string;
  validateAudioValue: (value: number, fallback: number) => number;
  audioType: string;
  selectedPlaybackVersion: number | null;
  isRestoringVersion: boolean;
  handleVersionPlayback: (version: number) => void;
  handleRestoreVersion: (version: number) => void;
  AudioPlayer: React.ComponentType<any>;
}

export const VersionHistoryDialog: React.FC<VersionHistoryDialogProps> = ({
  showVersionHistory,
  setShowVersionHistory,
  audioConfig,
  totalVersions,
  totalEdits,
  versions,
  editHistory,
  formatDuration,
  validateAudioValue,
  audioType,
  isRestoringVersion,
  handleRestoreVersion,
  AudioPlayer,
}) => {
  const theme = useTheme();

  // Helper function to get action icon
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

  // Helper function to get action color
  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "initial_creation":
        return "primary";
      case "prompt_edit":
        return "secondary";
      case "content_generation":
        return "success";
      case "version_restoration":
        return "info";
      default:
        return "default";
    }
  };

  const getModelTierInfo = (modelTier: number) => {
    switch (modelTier) {
      case MODEL_TIERS.BASIC:
        return {
          label: "Basic",
          color: "#9e9e9e",
          icon: <BasicIcon size={12} />,
        };
      case MODEL_TIERS.PRO:
        return {
          label: "Pro",
          color: "#2196f3",
          icon: <ProIcon size={12} />,
        };
      case MODEL_TIERS.PREMIUM:
        return {
          label: "Premium",
          color: "#ff9800",
          icon: <PremiumIcon size={12} />,
        };
      case MODEL_TIERS.ULTRA:
        return {
          label: "Ultra",
          color: "#9c27b0",
          icon: <UltraIcon size={12} />,
        };
      default:
        return null;
    }
  };

  // Enhanced helper to get regeneration reason display
  const formatRegenerationReason = (reason: string | undefined) => {
    if (!reason) return null;

    const reasonMap: Record<string, { label: string; color: string }> = {
      user_edit: { label: "User Edit", color: "secondary" },
      user_request: { label: "User Request", color: "primary" },
      prompt_edit_with_generation: {
        label: "Prompt + Audio",
        color: "success",
      },
      initial_generation: { label: "Initial", color: "primary" },
      draft_completion: { label: "Draft Complete", color: "info" },
      draft_completion_edited: { label: "Edited Draft", color: "warning" },
      prompt_based_regeneration: { label: "Prompt Change", color: "secondary" },
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

  // ENHANCED: Process edit history with unified versioning support
  const processedEditHistory = React.useMemo(() => {
    console.log("VersionHistory: Raw editHistory received:", editHistory);

    // Create comprehensive list from all sources
    const allVersionActions = [];
    const seenActions = new Set();

    const createActionKey = (action: any) => {
      const timestamp =
        action.timestamp?._seconds ||
        new Date(action.timestamp || 0).getTime() / 1000;
      const type = action.type || "unknown";
      const prompt =
        action.newPrompt ||
        action.finalPrompt ||
        action.originalPrompt ||
        action.prompt ||
        "";
      return `${timestamp}-${type}-${prompt.slice(0, 30)}`;
    };

    const addUniqueAction = (
      action: any,
      source: string,
      versionContext: string
    ) => {
      const actionKey = createActionKey(action);

      if (!seenActions.has(actionKey)) {
        seenActions.add(actionKey);
        allVersionActions.push({
          ...action,
          versionContext,
          source,
        });
        console.log(
          `VersionHistory: Added unique action from ${source}:`,
          action.type
        );
      }
    };

    // Priority 1: Provided edit history
    if (editHistory && editHistory.length > 0) {
      editHistory.forEach((action) => {
        addUniqueAction(action, "provided", "provided");
      });
    }

    // Priority 2: Current version actions
    if (versions.current?.actions) {
      versions.current.actions.forEach((action) => {
        addUniqueAction(
          {
            ...action,
            fromVersion: action.fromVersion || versions.current.version,
            toVersion: action.toVersion || versions.current.version,
            displayVersion: action.toVersion || versions.current.version,
          },
          "current",
          "current"
        );
      });
    }

    // Priority 3: Archived version actions
    Object.values(versions.archived || {}).forEach((version: any) => {
      if (version.actions) {
        version.actions.forEach((action) => {
          addUniqueAction(
            {
              ...action,
              fromVersion: action.fromVersion || version.version,
              toVersion: action.toVersion || version.version,
              displayVersion: action.toVersion || version.version,
            },
            `archived-v${version.version}`,
            "archived"
          );
        });
      }
    });

    // Sort chronologically
    const sortedActions = allVersionActions.sort((a, b) => {
      const timestampA =
        a.timestamp?._seconds || new Date(a.timestamp || 0).getTime() / 1000;
      const timestampB =
        b.timestamp?._seconds || new Date(b.timestamp || 0).getTime() / 1000;
      return timestampA - timestampB;
    });

    // Enhanced processing with version transitions
    const processedActions = sortedActions.map((action) => {
      let versionTransition = null;

      // Enhanced version transition detection
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
        modelTier: action.modelTier || action.currentModelTier, // ← Added this line
        totalEditsBeforeGeneration: action.totalEditsBeforeGeneration,
        // NEW: Enhanced prompt journey tracking
        promptJourney: action.promptJourney || {
          from: action.originalPrompt || action.previousPrompt,
          to: action.finalPrompt || action.newPrompt || action.prompt,
          wasEdited:
            action.promptJourney?.wasEdited ||
            (action.originalPrompt &&
              action.finalPrompt &&
              action.originalPrompt !== action.finalPrompt),
        },
        // NEW: Voice and configuration details
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
  }, [editHistory, versions]);

  return (
    <CompactDialog
      open={showVersionHistory}
      onClose={() => setShowVersionHistory(false)}
      fullWidth
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Enhanced Header */}
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
            )}, ${alpha(theme.palette.secondary.main, 0.05)})`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <GradientAvatar gradient="linear-gradient(135deg, #667eea, #764ba2)">
              <Music size={18} style={{ color: "white" }} />
            </GradientAvatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" fontSize="1.2rem">
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
              borderRadius: "10px",
              p: 1,
              background: alpha(theme.palette.background.paper, 0.8),
              "&:hover": {
                background: theme.palette.background.paper,
              },
            }}
            size="small"
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* Content */}
        <Box
          sx={{
            p: 3,
            maxHeight: "70vh",
            overflow: "auto",
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Stack spacing={3}>
            {/* Current Version - Enhanced */}
            {versions.current && (
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="700"
                  sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
                >
                  <CheckCircle size={18} color={theme.palette.success.main} />
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
                          color="primary"
                          fontWeight="bold"
                        >
                          Version {versions.current.version}
                        </Typography>
                        <Chip
                          label="Active"
                          color="primary"
                          size="small"
                          sx={{
                            borderRadius: "6px",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        />
                        {versions.current.isDraft && (
                          <Chip
                            label="Draft"
                            color="warning"
                            variant="outlined"
                            size="small"
                            sx={{
                              borderRadius: "6px",
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          />
                        )}
                      </Box>

                      <PromptCard sx={{ mb: 2 }}>
                        {versions.current.prompt || "No prompt available"}
                      </PromptCard>

                      {/* Enhanced Metadata */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                          mb: 1,
                        }}
                      >
                        {versions.current.duration > 0 && (
                          <MetadataChip
                            icon={<Clock />}
                            label={formatDuration(versions.current.duration)}
                            size="small"
                          />
                        )}
                        {(() => {
                          const modelTierInfo = getModelTierInfo(
                            versions.current.modelTier
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
                                  height: 24,
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  bgcolor: alpha(modelTierInfo.color, 0.1),
                                  color: modelTierInfo.color,
                                  border: `1px solid ${alpha(
                                    modelTierInfo.color,
                                    0.3
                                  )}`,
                                  "& .MuiChip-icon": {
                                    color: modelTierInfo.color,
                                    fontSize: 12,
                                  },
                                }}
                              />
                            </Tooltip>
                          ) : null;
                        })()}
                        {versions.current.status && (
                          <MetadataChip
                            icon={
                              versions.current.status === "generated" ? (
                                <CheckCircle />
                              ) : (
                                <AlertCircle />
                              )
                            }
                            label={versions.current.status}
                            size="small"
                            sx={{
                              color:
                                versions.current.status === "generated"
                                  ? theme.palette.success.main
                                  : theme.palette.warning.main,
                              borderColor:
                                versions.current.status === "generated"
                                  ? theme.palette.success.main
                                  : theme.palette.warning.main,
                            }}
                          />
                        )}
                        <Tooltip
                          title={(() => {
                            const dateField =
                              versions.current.lastEditedAt ||
                              versions.current.createdAt;
                            if (
                              dateField &&
                              typeof dateField === "object" &&
                              "_seconds" in dateField
                            ) {
                              return new Date(
                                dateField._seconds * 1000
                              ).toLocaleString();
                            }
                            return new Date(
                              dateField || Date.now()
                            ).toLocaleString();
                          })()}
                          arrow
                          placement="top"
                        >
                          <MetadataChip
                            icon={<Calendar />}
                            label={(() => {
                              const dateField =
                                versions.current.lastEditedAt ||
                                versions.current.createdAt;
                              if (
                                dateField &&
                                typeof dateField === "object" &&
                                "_seconds" in dateField
                              ) {
                                return new Date(
                                  dateField._seconds * 1000
                                ).toLocaleDateString();
                              }
                              return new Date(
                                dateField || Date.now()
                              ).toLocaleDateString();
                            })()}
                            size="small"
                            sx={{ cursor: "help" }}
                          />
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>

                  {/* Audio Player */}
                  {versions.current.destinationPath && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        background: alpha(
                          theme.palette.background.default,
                          0.5
                        ),
                        borderRadius: "8px",
                        border: `1px solid ${alpha(
                          theme.palette.divider,
                          0.5
                        )}`,
                      }}
                    >
                      <AudioPlayer
                        audioPath={versions.current.destinationPath}
                        initialDuration={validateAudioValue(
                          versions.current.duration,
                          0
                        )}
                        audioType={
                          audioType === "roomTone" ? "roomtone" : audioType
                        }
                        key={`history-current-${versions.current.version}`}
                      />
                    </Box>
                  )}
                </VersionCard>
              </Box>
            )}

            {/* Archived Versions - Enhanced */}
            {Object.keys(versions.archived || {}).length > 0 && (
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="700"
                  sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
                >
                  <FileAudio size={18} color={theme.palette.text.secondary} />
                  Previous Versions
                </Typography>
                <Stack spacing={2}>
                  {Object.values(versions.archived || {})
                    .sort(
                      (a: any, b: any) => (b.version || 0) - (a.version || 0)
                    )
                    .map((version: any) => (
                      <VersionCard key={version.version} cardvariant="archived">
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
                              <Typography variant="h6" fontWeight="bold">
                                Version {version.version}
                              </Typography>
                              {version.isDraft && (
                                <Chip
                                  label="Draft"
                                  color="warning"
                                  variant="outlined"
                                  size="small"
                                  sx={{
                                    borderRadius: "6px",
                                    fontWeight: 600,
                                    fontSize: "0.7rem",
                                  }}
                                />
                              )}
                            </Box>

                            <PromptCard sx={{ mb: 2 }}>
                              {version.prompt || "No prompt available"}
                            </PromptCard>

                            {/* Enhanced Metadata for Archived Versions */}
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                mb: 2,
                              }}
                            >
                              {version.duration > 0 && (
                                <MetadataChip
                                  icon={<Clock />}
                                  label={formatDuration(version.duration)}
                                  size="small"
                                />
                              )}
                              {(() => {
                                const modelTierInfo = getModelTierInfo(
                                  version.modelTier // ← FIXED: use version.modelTier instead of versions.current.modelTier
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
                                        height: 24,
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        bgcolor: alpha(
                                          modelTierInfo.color,
                                          0.1
                                        ),
                                        color: modelTierInfo.color,
                                        border: `1px solid ${alpha(
                                          modelTierInfo.color,
                                          0.3
                                        )}`,
                                        "& .MuiChip-icon": {
                                          color: modelTierInfo.color,
                                          fontSize: 12,
                                        },
                                      }}
                                    />
                                  </Tooltip>
                                ) : null;
                              })()}
                              {version.status && (
                                <MetadataChip
                                  icon={
                                    version.status === "generated" ? (
                                      <CheckCircle />
                                    ) : (
                                      <AlertCircle />
                                    )
                                  }
                                  label={version.status}
                                  size="small"
                                  sx={{
                                    color:
                                      version.status === "generated"
                                        ? theme.palette.success.main
                                        : theme.palette.warning.main,
                                    borderColor:
                                      version.status === "generated"
                                        ? theme.palette.success.main
                                        : theme.palette.warning.main,
                                  }}
                                />
                              )}
                              <Tooltip
                                title={(() => {
                                  const dateField =
                                    version.createdAt || version.lastEditedAt;
                                  if (
                                    dateField &&
                                    typeof dateField === "object" &&
                                    "_seconds" in dateField
                                  ) {
                                    return new Date(
                                      dateField._seconds * 1000
                                    ).toLocaleString();
                                  }
                                  return new Date(
                                    dateField || Date.now()
                                  ).toLocaleString();
                                })()}
                                arrow
                                placement="top"
                              >
                                <MetadataChip
                                  icon={<Calendar />}
                                  label={(() => {
                                    const dateField =
                                      version.createdAt || version.lastEditedAt;
                                    if (
                                      dateField &&
                                      typeof dateField === "object" &&
                                      "_seconds" in dateField
                                    ) {
                                      return new Date(
                                        dateField._seconds * 1000
                                      ).toLocaleDateString();
                                    }
                                    return new Date(
                                      dateField || Date.now()
                                    ).toLocaleDateString();
                                  })()}
                                  size="small"
                                  sx={{ cursor: "help" }}
                                />
                              </Tooltip>
                              {/* Enhanced: Show regeneration reason if available */}
                              {version.regenerationReason &&
                                (() => {
                                  const reasonInfo = formatRegenerationReason(
                                    version.regenerationReason
                                  );
                                  return reasonInfo ? (
                                    <MetadataChip
                                      label={reasonInfo.label}
                                      size="small"
                                      sx={{
                                        color:
                                          theme.palette[reasonInfo.color]
                                            ?.main ||
                                          theme.palette.text.secondary,
                                        borderColor:
                                          theme.palette[reasonInfo.color]
                                            ?.main || theme.palette.divider,
                                        background: alpha(
                                          theme.palette[reasonInfo.color]
                                            ?.main ||
                                            theme.palette.text.secondary,
                                          0.1
                                        ),
                                      }}
                                    />
                                  ) : null;
                                })()}
                            </Box>
                          </Box>

                          <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                            <CompactButton
                              size="small"
                              startIcon={<RestoreIcon size={14} />}
                              onClick={() =>
                                handleRestoreVersion(version.version)
                              }
                              disabled={isRestoringVersion}
                              variant="outlined"
                              color="secondary"
                            >
                              Restore
                            </CompactButton>
                          </Box>
                        </Box>

                        {/* Audio Player for Archived Versions */}
                        {version.destinationPath && (
                          <Box
                            sx={{
                              mt: 2,
                              p: 2,
                              background: alpha(
                                theme.palette.background.default,
                                0.3
                              ),
                              borderRadius: "8px",
                              border: `1px solid ${alpha(
                                theme.palette.divider,
                                0.3
                              )}`,
                            }}
                          >
                            <AudioPlayer
                              audioPath={version.destinationPath}
                              initialDuration={validateAudioValue(
                                version.duration,
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
                      </VersionCard>
                    ))}
                </Stack>
              </Box>
            )}

            {/* ENHANCED: Edit History with comprehensive action support */}
            {processedEditHistory.length > 0 ? (
              <Box>
                <CompactAccordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      borderRadius: "12px",
                      backgroundColor: theme.palette.background.default,
                      "&.Mui-expanded": {
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="700">
                        Complete Edit History
                      </Typography>
                      <Chip
                        label={`${processedEditHistory.length} actions`}
                        size="small"
                        sx={{
                          borderRadius: "6px",
                          background: alpha(theme.palette.info.main, 0.1),
                          border: `1px solid ${alpha(
                            theme.palette.info.main,
                            0.3
                          )}`,
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
                      borderBottomLeftRadius: "12px",
                      borderBottomRightRadius: "12px",
                    }}
                  >
                    <Stack spacing={2}>
                      {processedEditHistory.map((edit: any, index: number) => {
                        const actionColor = getActionColor(edit.type);
                        const actionIcon = getActionIcon(edit.type);

                        return (
                          <EditHistoryCard key={index}>
                            <Box sx={{ pl: 1 }}>
                              {/* Enhanced Header */}
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

                              {/* Enhanced Action Content */}
                              <Box sx={{ mb: 2 }}>
                                {/* Prompt Edit Actions */}
                                {edit.type === "prompt_edit" && (
                                  <Box>
                                    {(edit.previousPrompt ||
                                      edit.enhancedMetadata?.promptJourney
                                        ?.from) &&
                                      (edit.newPrompt ||
                                        edit.enhancedMetadata?.promptJourney
                                          ?.to) && (
                                        <Box sx={{ mt: 1 }}>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ mb: 1, display: "block" }}
                                          >
                                            <strong>From:</strong>
                                          </Typography>
                                          <PromptCard
                                            sx={{
                                              mb: 1,
                                              fontSize: "0.8rem",
                                              padding: "8px 12px",
                                            }}
                                          >
                                            {edit.previousPrompt ||
                                              edit.enhancedMetadata
                                                ?.promptJourney?.from ||
                                              "Previous prompt"}
                                          </PromptCard>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ mb: 1, display: "block" }}
                                          >
                                            <strong>To:</strong>
                                          </Typography>
                                          <PromptCard
                                            sx={{
                                              fontSize: "0.8rem",
                                              padding: "8px 12px",
                                            }}
                                          >
                                            {edit.newPrompt ||
                                              edit.enhancedMetadata
                                                ?.promptJourney?.to ||
                                              "New prompt"}
                                          </PromptCard>
                                        </Box>
                                      )}
                                    {edit.enhancedMetadata
                                      ?.isVersionCreation && (
                                      <Chip
                                        size="small"
                                        label="New Version Created"
                                        color="info"
                                        variant="outlined"
                                        sx={{
                                          mt: 1,
                                          fontSize: "0.7rem",
                                          height: 20,
                                        }}
                                      />
                                    )}
                                  </Box>
                                )}

                                {/* Content Generation Actions */}
                                {edit.type === "content_generation" && (
                                  <Box>
                                    {/* Show prompt journey if available */}
                                    {edit.enhancedMetadata?.promptJourney
                                      ?.wasEdited && (
                                      <Box sx={{ mt: 1, mb: 2 }}>
                                        <Typography
                                          variant="caption"
                                          color="success.main"
                                          sx={{
                                            mb: 1,
                                            display: "block",
                                            fontWeight: 600,
                                          }}
                                        >
                                          Generated from edited prompt:
                                        </Typography>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            gap: 1,
                                            alignItems: "center",
                                            mb: 1,
                                          }}
                                        >
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            <strong>Original:</strong>
                                          </Typography>
                                          <PromptCard
                                            sx={{
                                              flex: 1,
                                              fontSize: "0.75rem",
                                              padding: "6px 10px",
                                            }}
                                          >
                                            {edit.enhancedMetadata.promptJourney
                                              .from ||
                                              edit.originalPrompt ||
                                              "Original prompt"}
                                          </PromptCard>
                                        </Box>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            gap: 1,
                                            alignItems: "center",
                                          }}
                                        >
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            <strong>Final:</strong>
                                          </Typography>
                                          <PromptCard
                                            sx={{
                                              flex: 1,
                                              fontSize: "0.75rem",
                                              padding: "6px 10px",
                                            }}
                                          >
                                            {edit.enhancedMetadata.promptJourney
                                              .to ||
                                              edit.finalPrompt ||
                                              "Final prompt"}
                                          </PromptCard>
                                        </Box>
                                      </Box>
                                    )}

                                    {/* Show final prompt if no journey */}
                                    {!edit.enhancedMetadata?.promptJourney
                                      ?.wasEdited &&
                                      (edit.finalPrompt ||
                                        edit.originalPrompt ||
                                        edit.prompt) && (
                                        <Box sx={{ mt: 1, mb: 2 }}>
                                          <Typography
                                            variant="caption"
                                            color="success.main"
                                            sx={{
                                              mb: 1,
                                              display: "block",
                                              fontWeight: 600,
                                            }}
                                          >
                                            Generated audio for:
                                          </Typography>
                                          <PromptCard
                                            sx={{
                                              fontSize: "0.8rem",
                                              padding: "8px 12px",
                                            }}
                                          >
                                            {edit.finalPrompt ||
                                              edit.originalPrompt ||
                                              edit.prompt}
                                          </PromptCard>
                                        </Box>
                                      )}

                                    {/* Enhanced metadata chips */}
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 0.5,
                                        mt: 1,
                                      }}
                                    >
                                      {edit.enhancedMetadata?.duration && (
                                        <MetadataChip
                                          icon={<Clock />}
                                          label={formatDuration(
                                            edit.enhancedMetadata.duration
                                          )}
                                          size="small"
                                        />
                                      )}

                                      {(() => {
                                        const modelTierInfo = getModelTierInfo(
                                          edit.enhancedMetadata?.modelTier // ← FIXED: use edit.enhancedMetadata?.modelTier
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
                                                border: `1px solid ${alpha(
                                                  modelTierInfo.color,
                                                  0.3
                                                )}`,
                                                "& .MuiChip-icon": {
                                                  color: modelTierInfo.color,
                                                  fontSize: 10,
                                                },
                                              }}
                                            />
                                          </Tooltip>
                                        ) : null;
                                      })()}

                                      {edit.enhancedMetadata
                                        ?.totalEditsBeforeGeneration > 0 && (
                                        <MetadataChip
                                          label={`${edit.enhancedMetadata.totalEditsBeforeGeneration} edits`}
                                          size="small"
                                          sx={{
                                            background: alpha(
                                              theme.palette.info.main,
                                              0.1
                                            ),
                                            borderColor:
                                              theme.palette.info.main,
                                            color: theme.palette.info.main,
                                          }}
                                        />
                                      )}
                                      {edit.enhancedMetadata
                                        ?.regenerationReason &&
                                        (() => {
                                          const reasonInfo =
                                            formatRegenerationReason(
                                              edit.enhancedMetadata
                                                .regenerationReason
                                            );
                                          return reasonInfo ? (
                                            <MetadataChip
                                              label={reasonInfo.label}
                                              size="small"
                                              sx={{
                                                color:
                                                  theme.palette[
                                                    reasonInfo.color
                                                  ]?.main ||
                                                  theme.palette.text.secondary,
                                                borderColor:
                                                  theme.palette[
                                                    reasonInfo.color
                                                  ]?.main ||
                                                  theme.palette.divider,
                                                background: alpha(
                                                  theme.palette[
                                                    reasonInfo.color
                                                  ]?.main ||
                                                    theme.palette.text
                                                      .secondary,
                                                  0.1
                                                ),
                                              }}
                                            />
                                          ) : null;
                                        })()}
                                      {edit.enhancedMetadata?.wasCompleted && (
                                        <Chip
                                          size="small"
                                          label="Completed"
                                          color="success"
                                          variant="outlined"
                                          sx={{
                                            fontSize: "0.7rem",
                                            height: 20,
                                          }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                )}

                                {/* Version Restoration Actions */}
                                {edit.type === "version_restoration" && (
                                  <Box>
                                    {/* Enhanced version transition with source */}
                                    <Box sx={{ mt: 1, mb: 2 }}>
                                      <Typography
                                        variant="caption"
                                        color="info.main"
                                        sx={{
                                          mb: 1,
                                          display: "block",
                                          fontWeight: 600,
                                        }}
                                      >
                                        Restored version{" "}
                                        {edit.sourceVersion ||
                                          edit.restoredFromVersion}{" "}
                                        as new version{" "}
                                        {edit.toVersion || edit.displayVersion}
                                      </Typography>

                                      {/* Show the transition clearly */}
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                          p: 1,
                                          borderRadius: "8px",
                                          background: alpha(
                                            theme.palette.info.main,
                                            0.05
                                          ),
                                          border: `1px solid ${alpha(
                                            theme.palette.info.main,
                                            0.1
                                          )}`,
                                        }}
                                      >
                                        <Chip
                                          label={`Source: v${
                                            edit.sourceVersion ||
                                            edit.restoredFromVersion
                                          }`}
                                          size="small"
                                          color="info"
                                          variant="outlined"
                                          sx={{
                                            fontSize: "0.7rem",
                                            height: 20,
                                          }}
                                        />
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          →
                                        </Typography>
                                        <Chip
                                          label={`New: v${
                                            edit.toVersion ||
                                            edit.displayVersion
                                          }`}
                                          size="small"
                                          color="primary"
                                          variant="contained"
                                          sx={{
                                            fontSize: "0.7rem",
                                            height: 20,
                                          }}
                                        />
                                      </Box>
                                    </Box>

                                    {/* Show prompt changes if available */}
                                    {edit.previousPrompt &&
                                      edit.newPrompt &&
                                      edit.previousPrompt !==
                                        edit.newPrompt && (
                                        <Box sx={{ mt: 2 }}>
                                          <Typography
                                            variant="caption"
                                            color="info.main"
                                            sx={{
                                              mb: 1,
                                              display: "block",
                                              fontWeight: 600,
                                            }}
                                          >
                                            Prompt restored from v
                                            {edit.sourceVersion ||
                                              edit.restoredFromVersion}
                                            :
                                          </Typography>
                                          <Box
                                            sx={{
                                              display: "flex",
                                              gap: 1,
                                              alignItems: "center",
                                              mb: 1,
                                            }}
                                          >
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                            >
                                              <strong>
                                                Previous (v{edit.fromVersion}):
                                              </strong>
                                            </Typography>
                                            <PromptCard
                                              sx={{
                                                flex: 1,
                                                fontSize: "0.75rem",
                                                padding: "6px 10px",
                                              }}
                                            >
                                              {edit.previousPrompt}
                                            </PromptCard>
                                          </Box>
                                          <Box
                                            sx={{
                                              display: "flex",
                                              gap: 1,
                                              alignItems: "center",
                                            }}
                                          >
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                            >
                                              <strong>
                                                Restored (v{edit.sourceVersion}
                                                ):
                                              </strong>
                                            </Typography>
                                            <PromptCard
                                              sx={{
                                                flex: 1,
                                                fontSize: "0.75rem",
                                                padding: "6px 10px",
                                              }}
                                            >
                                              {edit.newPrompt ||
                                                edit.restoredPrompt}
                                            </PromptCard>
                                          </Box>
                                        </Box>
                                      )}

                                    {/* Show single prompt if no comparison available */}
                                    {(!edit.previousPrompt ||
                                      !edit.newPrompt ||
                                      edit.previousPrompt === edit.newPrompt) &&
                                      (edit.restoredPrompt ||
                                        edit.newPrompt) && (
                                        <Box sx={{ mt: 1 }}>
                                          <Typography
                                            variant="caption"
                                            color="info.main"
                                            sx={{
                                              mb: 1,
                                              display: "block",
                                              fontWeight: 600,
                                            }}
                                          >
                                            Restored prompt from v
                                            {edit.sourceVersion ||
                                              edit.restoredFromVersion}
                                            :
                                          </Typography>
                                          <PromptCard
                                            sx={{
                                              fontSize: "0.8rem",
                                              padding: "8px 12px",
                                            }}
                                          >
                                            {edit.restoredPrompt ||
                                              edit.newPrompt}
                                          </PromptCard>
                                        </Box>
                                      )}

                                    {/* Show additional metadata */}
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 0.5,
                                        mt: 1,
                                      }}
                                    >
                                      {edit.contentGenerated && (
                                        <Chip
                                          size="small"
                                          label="Audio Restored"
                                          color="success"
                                          variant="outlined"
                                          sx={{
                                            fontSize: "0.7rem",
                                            height: 20,
                                          }}
                                        />
                                      )}
                                      {edit.fromCompletedVersion && (
                                        <Chip
                                          size="small"
                                          label="From Completed Version"
                                          color="info"
                                          variant="outlined"
                                          sx={{
                                            fontSize: "0.7rem",
                                            height: 20,
                                          }}
                                        />
                                      )}
                                      {edit.contentPath && (
                                        <MetadataChip
                                          icon={<FileAudio />}
                                          label="Audio File"
                                          size="small"
                                          sx={{
                                            background: alpha(
                                              theme.palette.success.main,
                                              0.1
                                            ),
                                            borderColor:
                                              theme.palette.success.main,
                                            color: theme.palette.success.main,
                                          }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                )}

                                {/* Initial Creation Actions */}
                                {edit.type === "initial_creation" && (
                                  <Box>
                                    {(edit.newPrompt || edit.prompt) && (
                                      <Box sx={{ mt: 1 }}>
                                        <Typography
                                          variant="caption"
                                          color="primary.main"
                                          sx={{
                                            mb: 1,
                                            display: "block",
                                            fontWeight: 600,
                                          }}
                                        >
                                          Initial prompt:
                                        </Typography>
                                        <PromptCard
                                          sx={{
                                            fontSize: "0.8rem",
                                            padding: "8px 12px",
                                          }}
                                        >
                                          {edit.newPrompt || edit.prompt}
                                        </PromptCard>
                                      </Box>
                                    )}
                                    <Box
                                      sx={{ display: "flex", gap: 0.5, mt: 1 }}
                                    >
                                      {edit.contentGenerated && (
                                        <Chip
                                          size="small"
                                          label="Audio Generated"
                                          color="success"
                                          variant="outlined"
                                          sx={{
                                            fontSize: "0.7rem",
                                            height: 20,
                                          }}
                                        />
                                      )}
                                      {(() => {
                                        const modelTierInfo = getModelTierInfo(
                                          edit.enhancedMetadata?.modelTier // ← FIXED: use edit.enhancedMetadata?.modelTier
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
                                                border: `1px solid ${alpha(
                                                  modelTierInfo.color,
                                                  0.3
                                                )}`,
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
                                  </Box>
                                )}

                                {/* Fallback for other action types */}
                                {![
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
                              </Box>

                              {/* Action Footer */}
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
                      borderRadius: "12px",
                      backgroundColor: theme.palette.background.default,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="700">
                        Edit History
                      </Typography>
                      <Chip
                        label="No history"
                        size="small"
                        sx={{
                          borderRadius: "6px",
                          background: alpha(theme.palette.warning.main, 0.1),
                          border: `1px solid ${alpha(
                            theme.palette.warning.main,
                            0.3
                          )}`,
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
                      borderBottomLeftRadius: "12px",
                      borderBottomRightRadius: "12px",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No edit history available for this audio item. This might
                      be a newly created item or the history data hasn't been
                      populated yet.
                    </Typography>
                  </AccordionDetails>
                </CompactAccordion>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Enhanced Footer */}
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
};
