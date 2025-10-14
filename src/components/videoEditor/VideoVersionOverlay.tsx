// VideoVersionOverlay.tsx - Ported to Next.js 15 with React 19 optimizations
"use client";

import { useState, useMemo, useCallback, startTransition, JSX } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  Typography,
  Chip,
  Stack,
  Button,
  Divider,
  Paper,
  styled,
  alpha,
  Tooltip,
  Popover,
  Portal,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from "@mui/material";
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Restore as RestoreIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Videocam as VideoIcon,
  History as HistoryIcon,
  Layers as LayersIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as Calendar,
  Warning as WarningIcon,
  Error as ErrorIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import {
  Diamond as UltraIcon,
  Star as PremiumIcon,
  Circle as ProIcon,
  Zap as BasicIcon,
} from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import { VideoVersion } from "./VideoViewerContainer";
import { MODEL_TIERS } from "@/components/common/ModelTierSelector";
import logger from "@/utils/logger";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * History item representing a video generation event
 */
interface HistoryItem {
  timestamp: string;
  fromVersion: number;
  toVersion: number;
  generationType: string;
  previousVideoPath?: string;
  newVideoPath: string;
  prompt?: string;
  seed?: number;
  imageVersion?: number;
  audioVersion?: number;
  restoredFromVersion?: number;
  modelTier?: number;
}

/**
 * Props for VideoVersionModal component
 */
interface VideoVersionModalProps {
  allVersions: VideoVersion[];
  currentlyViewingVersion?: VideoVersion;
  totalVersions: number;
  totalEdits: number;
  historyData: HistoryItem[];
  isLoading: boolean;
  isLoadingVersions: boolean;
  isLoadingHistory: boolean;
  isGenerating: boolean;
  isRestoring: boolean;
  open: boolean;
  onClose: () => void;
  onVersionSelect: (
    version: VideoVersion,
    direction: "left-to-right" | "right-to-left",
    skipThumbnail: boolean
  ) => void;
  onRestoreVersion: (targetVersion: number) => void;
  formatDate: (dateString: string) => string;
}

/**
 * Props for PromptDetailPopover component
 */
interface PromptDetailPopoverProps {
  item: HistoryItem | VideoVersion;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Model tier display information
 */
interface ModelTierInfo {
  label: string;
  color: string;
  icon: JSX.Element;
}

/**
 * Version card variant types
 */
type VersionCardVariant = "current" | "viewing" | "archived";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get human-readable label for generation type
 */
const getGenerationTypeLabel = (generationType: string): string => {
  switch (generationType) {
    case "text_to_video":
      return "Generate";
    case "text_to_video_dummy":
      return "Demo Generate";
    case "text_to_video_pending":
      return "Pending";
    case "version_restore":
      return "Restore";
    case "batch_generation":
      return "Batch Generate";
    case "lipsync_generation":
      return "Lipsync";
    case "lip_sync_only":
      return "LipSync Only";
    case "image_to_video":
      return "Image to Video";
    default:
      return generationType;
  }
};

/**
 * Get model tier display information
 */
const getModelTierInfo = (modelTier: number): ModelTierInfo | null => {
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

/**
 * Truncate text to specified length
 */
const truncateText = (text: string, maxLength: number): string =>
  text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;

// ==========================================
// STYLED COMPONENTS
// ==========================================

const StyledDialog = styled(Dialog)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    "& .MuiDialog-paper": {
      borderRadius: `${brand.borderRadius * 2}px`,
      border: `1px solid ${theme.palette.divider}`,
      background: theme.palette.background.paper,
      boxShadow: theme.shadows[24],
      maxWidth: 1200,
      width: "100%",
      maxHeight: "90vh",
      overflow: "hidden",
    },
  };
});

const StyledAvatar = styled(Avatar)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    borderRadius: `${brand.borderRadius}px`,
    width: 32,
    height: 32,
    boxShadow: theme.shadows[2],
  };
});

const StyledButton = styled(Button)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: `${brand.borderRadius}px`,
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.875rem",
    padding: "6px 12px",
    minWidth: "auto",
    transition: theme.transitions.create(["transform", "box-shadow"], {
      duration: theme.transitions.duration.short,
    }),
    fontFamily: brand.fonts.body,
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: theme.shadows[4],
    },
  };
});

interface VersionCardProps {
  cardvariant?: VersionCardVariant;
  hasVideo?: boolean;
}

const VersionCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "cardvariant" && prop !== "hasVideo",
})<VersionCardProps>(({ theme, cardvariant, hasVideo = true }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: `${brand.borderRadius}px`,
    padding: theme.spacing(2),
    border:
      cardvariant === "current"
        ? `2px solid ${theme.palette.primary.main}`
        : cardvariant === "viewing"
          ? `2px solid ${theme.palette.primary.main}`
          : !hasVideo
            ? `2px solid ${theme.palette.error.main}`
            : `1px solid ${theme.palette.divider}`,
    background:
      cardvariant === "current"
        ? alpha(theme.palette.primary.main, 0.03)
        : cardvariant === "viewing"
          ? alpha(theme.palette.primary.main, 0.03)
          : !hasVideo
            ? alpha(theme.palette.error.main, 0.03)
            : theme.palette.background.paper,
    cursor: "pointer",
    position: "relative",
    transition: theme.transitions.create(
      ["border-color", "box-shadow", "transform"],
      {
        duration: theme.transitions.duration.short,
      }
    ),
    "&:hover": {
      borderColor:
        cardvariant === "current"
          ? theme.palette.primary.main
          : cardvariant === "viewing"
            ? theme.palette.primary.main
            : !hasVideo
              ? theme.palette.error.main
              : theme.palette.primary.main,
      boxShadow: theme.shadows[4],
      transform: "translateY(-1px)",
    },
    ...(!hasVideo && {
      animation: "errorPulse 3s ease-in-out infinite",
      "@keyframes errorPulse": {
        "0%": { opacity: 1 },
        "50%": { opacity: 0.8 },
        "100%": { opacity: 1 },
      },
    }),
  };
});

const MetadataChip = styled(Chip)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: `${brand.borderRadius}px`,
    fontSize: "0.75rem",
    fontWeight: 500,
    height: 24,
    fontFamily: brand.fonts.body,
    background: alpha(theme.palette.text.primary, 0.05),
    border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
    "& .MuiChip-icon": { fontSize: 14, marginLeft: 4 },
  };
});

const StyledAccordion = styled(Accordion)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: `${brand.borderRadius}px`,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "none",
    "&:before": { display: "none" },
    "& .MuiAccordionSummary-root": {
      borderRadius: `${brand.borderRadius}px`,
      minHeight: 48,
      "&.Mui-expanded": { borderBottomRadius: 0 },
    },
    "& .MuiAccordionDetails-root": {
      borderTop: `1px solid ${theme.palette.divider}`,
      borderBottomRadius: `${brand.borderRadius}px`,
    },
  };
});

const HistoryCard = styled(Paper)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: `${brand.borderRadius}px`,
    padding: theme.spacing(1.5),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    background: alpha(theme.palette.primary.main, 0.03),
    position: "relative",
    cursor: "pointer",
    transition: theme.transitions.create(["transform", "border-color"], {
      duration: theme.transitions.duration.short,
    }),
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: 3,
      height: "100%",
      background: theme.palette.primary.main,
      borderRadius: `0 ${brand.borderRadius}px ${brand.borderRadius}px 0`,
    },
    "&:hover": {
      transform: "translateX(4px)",
      borderColor: alpha(theme.palette.primary.main, 0.4),
    },
  };
});

// ==========================================
// PROMPT DETAIL POPOVER COMPONENT
// ==========================================

/**
 * Popover displaying detailed information about a version or history item
 */
function PromptDetailPopover({
  item,
  anchorEl,
  open,
  onClose,
}: PromptDetailPopoverProps) {
  const brand = getCurrentBrand();
  const isHistoryItem = "generationType" in item && "fromVersion" in item;

  // React 19: useCallback for version status detection
  const getVersionVideoStatus = useCallback((version: VideoVersion): string => {
    const hasVideo = !!(
      version.videoSignedUrl || version.lipsyncVideoSignedUrl
    );
    if (!hasVideo) {
      if (version.generationType === "text_to_video_pending") {
        return "Generation Pending";
      }
      return "No Video Available";
    }
    return "Available";
  }, []);

  // React 19: useMemo for model tier info
  const modelTierInfo = useMemo(
    () => (item.modelTier ? getModelTierInfo(item.modelTier) : null),
    [item.modelTier]
  );

  return (
    <Portal>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: "center", horizontal: "right" }}
        transformOrigin={{ vertical: "center", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              maxWidth: 400,
              bgcolor: "rgba(0,0,0,0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: `${brand.borderRadius}px`,
              p: 2,
              zIndex: 10000,
            },
          },
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography
              variant="subtitle2"
              color="white"
              fontWeight="bold"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              {isHistoryItem
                ? `${getGenerationTypeLabel((item as HistoryItem).generationType)} Details`
                : "Version Details"}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.7)",
                fontFamily: brand.fonts.body,
              }}
            >
              Version{" "}
              {isHistoryItem
                ? (item as HistoryItem).toVersion
                : (item as VideoVersion).version}
              {!isHistoryItem && (
                <Chip
                  label={getVersionVideoStatus(item as VideoVersion)}
                  size="small"
                  color={
                    getVersionVideoStatus(item as VideoVersion) === "Available"
                      ? "success"
                      : getVersionVideoStatus(item as VideoVersion) ===
                          "Generation Pending"
                        ? "warning"
                        : "error"
                  }
                  sx={{ ml: 1, height: 16, fontSize: "0.6rem" }}
                />
              )}
            </Typography>
          </Box>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />
          {item.prompt && (
            <Box>
              <Typography
                variant="body2"
                color="primary.main"
                fontWeight="medium"
                gutterBottom
                sx={{ fontFamily: brand.fonts.body }}
              >
                Prompt
              </Typography>
              <Typography
                variant="body2"
                color="white"
                sx={{
                  lineHeight: 1.4,
                  maxHeight: 200,
                  overflow: "auto",
                  fontSize: "0.8rem",
                  fontFamily: brand.fonts.body,
                  "&::-webkit-scrollbar": { width: 4 },
                  "&::-webkit-scrollbar-track": {
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 2,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(255,255,255,0.3)",
                    borderRadius: 2,
                  },
                }}
              >
                {item.prompt}
              </Typography>
            </Box>
          )}
          <Box>
            <Typography
              variant="body2"
              color="primary.main"
              fontWeight="medium"
              gutterBottom
              sx={{ fontFamily: brand.fonts.body }}
            >
              Technical Details
            </Typography>
            <Stack spacing={0.5}>
              {item.seed && (
                <Typography
                  variant="caption"
                  color="rgba(255,255,255,0.8)"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Seed: {item.seed}
                </Typography>
              )}
              {modelTierInfo && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography
                    variant="caption"
                    color="rgba(255,255,255,0.8)"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Model Tier:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: modelTierInfo.color,
                    }}
                  >
                    {modelTierInfo.icon}
                    <Typography
                      variant="caption"
                      sx={{
                        color: modelTierInfo.color,
                        fontWeight: "medium",
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      {modelTierInfo.label}
                    </Typography>
                  </Box>
                </Box>
              )}
              {isHistoryItem && (
                <Typography
                  variant="caption"
                  color="rgba(255,255,255,0.8)"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Type:{" "}
                  {getGenerationTypeLabel((item as HistoryItem).generationType)}
                </Typography>
              )}
              {(item as VideoVersion).generationType && !isHistoryItem && (
                <Typography
                  variant="caption"
                  color="rgba(255,255,255,0.8)"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Type:{" "}
                  {getGenerationTypeLabel(
                    (item as VideoVersion).generationType || "unknown"
                  )}
                </Typography>
              )}
              {(item as HistoryItem).imageVersion && (
                <Typography
                  variant="caption"
                  color="rgba(255,255,255,0.8)"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Image Version: {(item as HistoryItem).imageVersion}
                </Typography>
              )}
              {(item as HistoryItem).audioVersion && (
                <Typography
                  variant="caption"
                  color="rgba(255,255,255,0.8)"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Audio Version: {(item as HistoryItem).audioVersion}
                </Typography>
              )}
              <Typography
                variant="caption"
                color="rgba(255,255,255,0.8)"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Timestamp:{" "}
                {new Date(
                  isHistoryItem
                    ? (item as HistoryItem).timestamp
                    : (item as VideoVersion).lastEditedAt ||
                      new Date().toISOString()
                ).toLocaleString()}
              </Typography>
              {(item as HistoryItem).restoredFromVersion && (
                <Typography
                  variant="caption"
                  color="rgba(255,255,255,0.8)"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Restored from Version:{" "}
                  {(item as HistoryItem).restoredFromVersion}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </Popover>
    </Portal>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * VideoVersionModal Component
 *
 * Displays a modal for managing video versions and generation history.
 * Features:
 * - Version list with filtering
 * - Generation history accordion
 * - Version restoration
 * - Detailed popover for each version/history item
 * - Model tier badges
 * - Keyboard navigation support
 *
 * @component
 */
export function VideoVersionModal({
  allVersions,
  currentlyViewingVersion,
  totalVersions,
  totalEdits,
  historyData,
  isLoadingVersions,
  isLoadingHistory,
  isGenerating,
  isRestoring,
  open,
  onClose,
  onVersionSelect,
  onRestoreVersion,
  formatDate,
}: VideoVersionModalProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  // ==========================================
  // STATE
  // ==========================================
  const [popoverAnchor, setPopoverAnchor] = useState<{
    element: HTMLElement;
    item: HistoryItem | VideoVersion;
  } | null>(null);
  const [showInvalidVersions, setShowInvalidVersions] = useState(true);

  // ==========================================
  // COMPUTED VALUES (React 19: useMemo)
  // ==========================================
  const currentIndex = useMemo(
    () =>
      allVersions.findIndex(
        (v) => v.version === currentlyViewingVersion?.version
      ),
    [allVersions, currentlyViewingVersion?.version]
  );

  const filteredVersions = useMemo(() => {
    if (showInvalidVersions) {
      return allVersions;
    }
    return allVersions.filter(
      (version) => !!(version.videoSignedUrl || version.lipsyncVideoSignedUrl)
    );
  }, [allVersions, showInvalidVersions]);

  const invalidVersionsCount = useMemo(
    () => allVersions.length - filteredVersions.length,
    [allVersions.length, filteredVersions.length]
  );

  const sortedHistoryData = useMemo(
    () =>
      [...historyData].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [historyData]
  );

  // ==========================================
  // HELPER FUNCTIONS (React 19: useCallback)
  // ==========================================
  const hasVideo = useCallback(
    (version: VideoVersion): boolean =>
      !!(version.videoSignedUrl || version.lipsyncVideoSignedUrl),
    []
  );

  const getVersionCardVariant = useCallback(
    (version: VideoVersion): VersionCardVariant => {
      if (version.isCurrent) return "current";
      if (version.version === currentlyViewingVersion?.version)
        return "viewing";
      return "archived";
    },
    [currentlyViewingVersion?.version]
  );

  // ==========================================
  // EVENT HANDLERS (React 19: useCallback)
  // ==========================================
  const handleVersionClick = useCallback(
    (
      event: React.MouseEvent<HTMLElement>,
      item: VideoVersion | HistoryItem
    ) => {
      if (item.prompt) {
        setPopoverAnchor({ element: event.currentTarget, item });
      }
    },
    []
  );

  const handleClosePopover = useCallback(() => {
    setPopoverAnchor(null);
  }, []);

  const handleToggleFilter = useCallback(() => {
    startTransition(() => {
      setShowInvalidVersions((prev) => !prev);
    });
  }, []);

  const handleShowAll = useCallback(() => {
    startTransition(() => {
      setShowInvalidVersions(true);
    });
  }, []);

  const handleVersionSelect = useCallback(
    (
      version: VideoVersion,
      direction: "left-to-right" | "right-to-left",
      skipThumbnail: boolean
    ) => {
      startTransition(() => {
        onVersionSelect(version, direction, skipThumbnail);
      });
    },
    [onVersionSelect]
  );

  const handleRestoreVersion = useCallback(
    (versionNumber: number) => {
      logger.info(`Restoring version ${versionNumber}`);
      startTransition(() => {
        onRestoreVersion(versionNumber);
      });
    },
    [onRestoreVersion]
  );

  const handlePreviousVersion = useCallback(() => {
    if (currentIndex > 0) {
      handleVersionSelect(allVersions[currentIndex - 1], "left-to-right", true);
    }
  }, [currentIndex, allVersions, handleVersionSelect]);

  const handleNextVersion = useCallback(() => {
    if (currentIndex < allVersions.length - 1) {
      handleVersionSelect(allVersions[currentIndex + 1], "right-to-left", true);
    }
  }, [currentIndex, allVersions, handleVersionSelect]);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <>
      <StyledDialog open={open} onClose={onClose} fullWidth maxWidth="lg">
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
              )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <StyledAvatar>
                <VideoIcon
                  sx={{
                    color: isDarkMode ? "grey.900" : "white",
                    fontSize: 18,
                  }}
                />
              </StyledAvatar>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  fontSize="1.2rem"
                  sx={{
                    fontFamily: brand.fonts.heading,
                    color: "text.primary",
                  }}
                >
                  Video - Version History
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 0.5,
                  }}
                >
                  <MetadataChip
                    icon={<LayersIcon />}
                    label={`${totalVersions} versions`}
                    size="small"
                  />
                  <MetadataChip
                    icon={<HistoryIcon />}
                    label={`${totalEdits} edits`}
                    size="small"
                  />
                  {currentlyViewingVersion && (
                    <MetadataChip
                      label={`Viewing V${currentlyViewingVersion.version}`}
                      size="small"
                      sx={{
                        background: alpha(theme.palette.primary.main, 0.1),
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                      }}
                    />
                  )}
                  {invalidVersionsCount > 0 && (
                    <MetadataChip
                      icon={<WarningIcon />}
                      label={`${invalidVersionsCount} without video`}
                      size="small"
                      sx={{
                        background: alpha(theme.palette.warning.main, 0.1),
                        borderColor: theme.palette.warning.main,
                        color: theme.palette.warning.main,
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {allVersions.length > 1 && (
                <>
                  <Tooltip title="Previous version">
                    <span>
                      <IconButton
                        onClick={handlePreviousVersion}
                        disabled={
                          currentIndex <= 0 || isGenerating || isRestoring
                        }
                        sx={{
                          borderRadius: `${brand.borderRadius}px`,
                          color: "primary.main",
                          "&:disabled": { opacity: 0.3 },
                        }}
                        size="small"
                      >
                        <PrevIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Next version">
                    <span>
                      <IconButton
                        onClick={handleNextVersion}
                        disabled={
                          currentIndex >= allVersions.length - 1 ||
                          isGenerating ||
                          isRestoring
                        }
                        sx={{
                          borderRadius: `${brand.borderRadius}px`,
                          color: "primary.main",
                          "&:disabled": { opacity: 0.3 },
                        }}
                        size="small"
                      >
                        <NextIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
              <IconButton
                onClick={onClose}
                sx={{
                  borderRadius: `${brand.borderRadius * 1.5}px`,
                  p: 1,
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  color: "text.primary",
                  "&:hover": { bgcolor: theme.palette.background.paper },
                }}
                size="small"
                aria-label="Close dialog"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Content */}
          <Box
            sx={{
              p: 3,
              maxHeight: "70vh",
              overflow: "auto",
              bgcolor: "background.default",
            }}
          >
            <Stack spacing={3}>
              {/* Versions Section */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="700"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      fontFamily: brand.fonts.heading,
                      color: "text.primary",
                    }}
                  >
                    <LayersIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />{" "}
                    All Versions (
                    {showInvalidVersions
                      ? totalVersions
                      : filteredVersions.length}
                    )
                  </Typography>

                  {invalidVersionsCount > 0 && (
                    <Tooltip
                      title={
                        showInvalidVersions
                          ? "Hide versions without video"
                          : "Show all versions"
                      }
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FilterIcon />}
                        onClick={handleToggleFilter}
                        sx={{
                          fontSize: "0.75rem",
                          fontFamily: brand.fonts.body,
                          color: showInvalidVersions
                            ? "warning.main"
                            : "primary.main",
                          borderColor: showInvalidVersions
                            ? "warning.main"
                            : "primary.main",
                        }}
                      >
                        {showInvalidVersions ? "Filter Invalid" : "Show All"}
                      </Button>
                    </Tooltip>
                  )}
                </Box>

                {!showInvalidVersions && invalidVersionsCount > 0 && (
                  <Alert
                    severity="info"
                    sx={{
                      mb: 2,
                      fontSize: "0.875rem",
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    Hiding {invalidVersionsCount} version
                    {invalidVersionsCount !== 1 ? "s" : ""} without video URLs.
                    <Button
                      size="small"
                      onClick={handleShowAll}
                      sx={{
                        ml: 1,
                        fontSize: "0.75rem",
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      Show All
                    </Button>
                  </Alert>
                )}

                {isLoadingVersions ? (
                  <Typography
                    color="text.secondary"
                    sx={{
                      textAlign: "center",
                      py: 3,
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    Loading versions...
                  </Typography>
                ) : filteredVersions.length > 0 ? (
                  <Stack spacing={2}>
                    {filteredVersions.map((version) => {
                      const versionHasVideo = hasVideo(version);
                      const modelTierInfo = version.modelTier
                        ? getModelTierInfo(version.modelTier)
                        : null;

                      return (
                        <VersionCard
                          key={version.version}
                          cardvariant={getVersionCardVariant(version)}
                          hasVideo={versionHasVideo}
                          onClick={(e) => {
                            handleVersionSelect(
                              version,
                              "left-to-right",
                              false
                            );
                            handleVersionClick(e, version);
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
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
                                {version.isCurrent && (
                                  <Chip
                                    label="Current"
                                    color="primary"
                                    size="small"
                                    sx={{
                                      borderRadius: `${brand.borderRadius * 0.75}px`,
                                      fontWeight: 600,
                                      fontSize: "0.7rem",
                                      fontFamily: brand.fonts.body,
                                    }}
                                  />
                                )}
                                {version.version ===
                                  currentlyViewingVersion?.version && (
                                  <Chip
                                    label="Viewing"
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                      borderRadius: `${brand.borderRadius * 0.75}px`,
                                      fontWeight: 600,
                                      fontSize: "0.7rem",
                                      fontFamily: brand.fonts.body,
                                    }}
                                  />
                                )}
                                {!versionHasVideo && (
                                  <Chip
                                    icon={<ErrorIcon sx={{ fontSize: 12 }} />}
                                    label="No Video"
                                    color="error"
                                    size="small"
                                    sx={{
                                      borderRadius: `${brand.borderRadius * 0.75}px`,
                                      fontWeight: 600,
                                      fontSize: "0.65rem",
                                      height: 20,
                                      fontFamily: brand.fonts.body,
                                    }}
                                  />
                                )}
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  flexWrap: "wrap",
                                  mb: 1,
                                }}
                              >
                                {version.lastEditedAt && (
                                  <Tooltip
                                    title={formatDate(version.lastEditedAt)}
                                    arrow
                                    placement="top"
                                  >
                                    <MetadataChip
                                      icon={<Calendar />}
                                      label={new Date(
                                        version.lastEditedAt
                                      ).toLocaleDateString()}
                                      size="small"
                                      sx={{ cursor: "help" }}
                                    />
                                  </Tooltip>
                                )}
                                {version.generationType && (
                                  <MetadataChip
                                    label={getGenerationTypeLabel(
                                      version.generationType
                                    )}
                                    size="small"
                                    sx={{
                                      bgcolor:
                                        version.generationType ===
                                        "text_to_video_pending"
                                          ? alpha(
                                              theme.palette.warning.main,
                                              0.1
                                            )
                                          : alpha(theme.palette.info.main, 0.1),
                                      color:
                                        version.generationType ===
                                        "text_to_video_pending"
                                          ? theme.palette.warning.main
                                          : theme.palette.info.main,
                                    }}
                                  />
                                )}
                                {version.imageVersion && (
                                  <MetadataChip
                                    label={`Image v${version.imageVersion}`}
                                    size="small"
                                  />
                                )}
                                {version.audioVersion && (
                                  <MetadataChip
                                    label={`Audio v${version.audioVersion}`}
                                    size="small"
                                  />
                                )}
                                {modelTierInfo && (
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
                                        fontFamily: brand.fonts.body,
                                        bgcolor: alpha(
                                          modelTierInfo.color,
                                          0.1
                                        ),
                                        color: modelTierInfo.color,
                                        border: `1px solid ${alpha(modelTierInfo.color, 0.3)}`,
                                        "& .MuiChip-icon": {
                                          color: modelTierInfo.color,
                                          fontSize: 12,
                                        },
                                      }}
                                    />
                                  </Tooltip>
                                )}
                                {(version.lipsyncVideoSignedUrl ||
                                  version.lipsyncVideoSignedUrl) && (
                                  <MetadataChip
                                    label="Lipsync"
                                    size="small"
                                    sx={{
                                      bgcolor: "success.light",
                                      color: "success.contrastText",
                                    }}
                                  />
                                )}
                              </Box>
                              {version.prompt && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "text.secondary",
                                    fontStyle: "italic",
                                    display: "block",
                                    fontFamily: brand.fonts.body,
                                  }}
                                >
                                  {truncateText(version.prompt, 60)}
                                </Typography>
                              )}
                            </Box>
                            {!version.isCurrent && versionHasVideo && (
                              <StyledButton
                                size="small"
                                startIcon={<RestoreIcon fontSize="small" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestoreVersion(version.version);
                                }}
                                disabled={isRestoring}
                                variant="outlined"
                                color="primary"
                              >
                                Restore
                              </StyledButton>
                            )}
                            {!version.isCurrent && !versionHasVideo && (
                              <Tooltip title="Cannot restore version without video">
                                <span>
                                  <StyledButton
                                    size="small"
                                    startIcon={<WarningIcon fontSize="small" />}
                                    disabled
                                    variant="outlined"
                                    sx={{ opacity: 0.5 }}
                                  >
                                    No Video
                                  </StyledButton>
                                </span>
                              </Tooltip>
                            )}
                          </Box>
                        </VersionCard>
                      );
                    })}
                  </Stack>
                ) : (
                  <Typography
                    color="text.secondary"
                    sx={{
                      textAlign: "center",
                      py: 3,
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    {showInvalidVersions
                      ? "No versions available"
                      : "No versions with video available"}
                  </Typography>
                )}
              </Box>

              {/* History Section */}
              {historyData.length > 0 && (
                <StyledAccordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      borderRadius: `${brand.borderRadius}px`,
                      bgcolor: "background.default",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="700"
                        sx={{
                          fontFamily: brand.fonts.heading,
                          color: "text.primary",
                        }}
                      >
                        Generation History
                      </Typography>
                      <Chip
                        label={`${totalEdits} generations`}
                        size="small"
                        sx={{
                          borderRadius: `${brand.borderRadius * 0.75}px`,
                          background: alpha(theme.palette.info.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                          color: theme.palette.info.main,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          fontFamily: brand.fonts.body,
                        }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      p: 2,
                      bgcolor: "background.default",
                      borderTop: `1px solid ${theme.palette.divider}`,
                      borderBottomRadius: `${brand.borderRadius}px`,
                    }}
                  >
                    <Stack spacing={2}>
                      {isLoadingHistory ? (
                        <Typography
                          sx={{
                            color: "text.secondary",
                            textAlign: "center",
                            py: 3,
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          Loading history...
                        </Typography>
                      ) : (
                        sortedHistoryData.map((item, index) => {
                          const historyModelTierInfo = item.modelTier
                            ? getModelTierInfo(item.modelTier)
                            : null;

                          return (
                            <HistoryCard
                              key={index}
                              onClick={(e) => handleVersionClick(e, item)}
                            >
                              <Box sx={{ pl: 1 }}>
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={2}
                                >
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      spacing={1}
                                    >
                                      <Typography
                                        variant="body2"
                                        fontWeight="medium"
                                        color="text.primary"
                                        noWrap
                                        sx={{ fontFamily: brand.fonts.body }}
                                      >
                                        {item.generationType ===
                                        "text_to_video" ? (
                                          <>Generated V{item.toVersion}</>
                                        ) : item.generationType ===
                                          "text_to_video_dummy" ? (
                                          <>Demo Generated V{item.toVersion}</>
                                        ) : item.generationType ===
                                          "version_restore" ? (
                                          <>
                                            Restored V{item.restoredFromVersion}{" "}
                                            as V{item.toVersion}
                                          </>
                                        ) : item.generationType ===
                                          "batch_generation" ? (
                                          <>Batch Generated V{item.toVersion}</>
                                        ) : (
                                          <>
                                            V{item.fromVersion} → V
                                            {item.toVersion}
                                          </>
                                        )}
                                      </Typography>
                                      {item.prompt && (
                                        <Tooltip title="Click to view full prompt details">
                                          <InfoIcon
                                            sx={{
                                              color: "text.secondary",
                                              fontSize: 16,
                                              cursor: "pointer",
                                            }}
                                          />
                                        </Tooltip>
                                      )}
                                      {historyModelTierInfo && (
                                        <Tooltip
                                          title={`Generated with ${historyModelTierInfo.label} model`}
                                        >
                                          <Box
                                            sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 0.3,
                                              px: 0.5,
                                              py: 0.2,
                                              borderRadius: `${brand.borderRadius * 0.25}px`,
                                              bgcolor: alpha(
                                                historyModelTierInfo.color,
                                                0.1
                                              ),
                                              border: `1px solid ${alpha(
                                                historyModelTierInfo.color,
                                                0.3
                                              )}`,
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                color:
                                                  historyModelTierInfo.color,
                                                display: "flex",
                                              }}
                                            >
                                              {historyModelTierInfo.icon}
                                            </Box>
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                color:
                                                  historyModelTierInfo.color,
                                                fontSize: "0.65rem",
                                                fontWeight: "medium",
                                                fontFamily: brand.fonts.body,
                                              }}
                                            >
                                              {historyModelTierInfo.label}
                                            </Typography>
                                          </Box>
                                        </Tooltip>
                                      )}
                                    </Stack>
                                    {item.prompt && (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: "text.secondary",
                                          display: "block",
                                          mt: 0.5,
                                          fontStyle: "italic",
                                          fontFamily: brand.fonts.body,
                                        }}
                                      >
                                        {truncateText(item.prompt, 60)}
                                      </Typography>
                                    )}
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: "text.secondary",
                                        display: "block",
                                        fontFamily: brand.fonts.body,
                                      }}
                                      noWrap
                                    >
                                      {formatDate(item.timestamp)}
                                      {item.seed && (
                                        <span style={{ marginLeft: 8 }}>
                                          • Seed: {item.seed}
                                        </span>
                                      )}
                                      {item.imageVersion && (
                                        <span style={{ marginLeft: 8 }}>
                                          • Image v{item.imageVersion}
                                        </span>
                                      )}
                                      {item.audioVersion && (
                                        <span style={{ marginLeft: 8 }}>
                                          • Audio v{item.audioVersion}
                                        </span>
                                      )}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={
                                      item.generationType === "text_to_video"
                                        ? "Generate"
                                        : item.generationType ===
                                            "lip_sync_only"
                                          ? "LipSync Only"
                                          : item.generationType ===
                                              "text_to_video_dummy"
                                            ? "Demo"
                                            : item.generationType ===
                                                "version_restore"
                                              ? "Restore"
                                              : item.generationType ===
                                                  "batch_generation"
                                                ? "Batch"
                                                : "Unknown"
                                    }
                                    size="small"
                                    sx={{
                                      bgcolor: "primary.main",
                                      color: isDarkMode
                                        ? "grey.900"
                                        : "primary.contrastText",
                                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                      minWidth: 60,
                                      fontFamily: brand.fonts.body,
                                    }}
                                  />
                                </Stack>
                              </Box>
                            </HistoryCard>
                          );
                        })
                      )}
                    </Stack>
                  </AccordionDetails>
                </StyledAccordion>
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Video version management • Use arrow keys to navigate
            </Typography>
            <StyledButton onClick={onClose} variant="contained" color="primary">
              Close
            </StyledButton>
          </Box>
        </DialogContent>
      </StyledDialog>

      {/* Popover */}
      {popoverAnchor && (
        <PromptDetailPopover
          item={popoverAnchor.item}
          anchorEl={popoverAnchor.element}
          open={Boolean(popoverAnchor)}
          onClose={handleClosePopover}
        />
      )}
    </>
  );
}
