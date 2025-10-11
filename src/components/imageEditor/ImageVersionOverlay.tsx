"use client";

import { useState } from "react";
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
  useTheme,
  Tooltip,
  Popover,
  Portal,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Restore as RestoreIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Image as ImageIcon,
  History as HistoryIcon,
  Layers as LayersIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as Calendar,
} from "@mui/icons-material";
import { ImageVersion } from "@/types/storyBoard/types";

// Consolidated Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: 16,
    border: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.paper,
    boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.15)}`,
    maxWidth: 1200,
    width: "100%",
    maxHeight: "90vh",
    overflow: "hidden",
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  background: `linear-gradient(135deg, #667eea, #764ba2)`,
  borderRadius: 12,
  width: 32,
  height: 32,
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.875rem",
  padding: "6px 12px",
  minWidth: "auto",
  transition: "all 0.2s ease",
  "&:hover": { transform: "translateY(-1px)" },
}));

const VersionCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "cardvariant",
})<{ cardvariant?: "current" | "viewing" | "archived" }>(
  ({ theme, cardvariant }) => ({
    borderRadius: 12,
    padding: theme.spacing(2),
    border:
      cardvariant === "current"
        ? `2px solid ${theme.palette.primary.main}`
        : cardvariant === "viewing"
          ? `2px solid ${theme.palette.secondary.main}`
          : `1px solid ${theme.palette.divider}`,
    background:
      cardvariant === "current"
        ? alpha(theme.palette.primary.main, 0.03)
        : cardvariant === "viewing"
          ? alpha(theme.palette.secondary.main, 0.03)
          : theme.palette.background.paper,
    cursor: "pointer",
    "&:hover": {
      borderColor:
        cardvariant === "current"
          ? theme.palette.primary.main
          : theme.palette.secondary.main,
      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
      transform: "translateY(-1px)",
    },
  })
);

const MetadataChip = styled(Chip)(({ theme }) => ({
  borderRadius: 8,
  fontSize: "0.75rem",
  fontWeight: 500,
  height: 24,
  background: alpha(theme.palette.text.primary, 0.05),
  border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
  "& .MuiChip-icon": { fontSize: 14, marginLeft: 4 },
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "none",
  "&:before": { display: "none" },
  "& .MuiAccordionSummary-root": {
    borderRadius: 12,
    minHeight: 48,
    "&.Mui-expanded": { borderBottomRadius: 0 },
  },
  "& .MuiAccordionDetails-root": {
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottomRadius: 12,
  },
}));

const HistoryCard = styled(Paper)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(1.5),
  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
  background: alpha(theme.palette.secondary.main, 0.03),
  position: "relative",
  cursor: "pointer",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: 3,
    height: "100%",
    background: theme.palette.secondary.main,
    borderRadius: "0 8px 8px 0",
  },
  "&:hover": {
    transform: "translateX(4px)",
    borderColor: alpha(theme.palette.secondary.main, 0.4),
  },
}));

interface ImageVersionModalProps {
  allVersions: ImageVersion[];
  currentlyViewingVersion?: ImageVersion;
  totalVersions: number;
  totalEdits: number;
  historyData: any[];
  isLoading: boolean;
  isLoadingVersions: boolean;
  isLoadingHistory: boolean;
  isEditing: boolean;
  isRestoring: boolean;
  isUpscaling: boolean;
  open: boolean;
  onClose: () => void;
  onVersionSelect: (
    version: ImageVersion,
    direction: "left-to-right" | "right-to-left",
    skipThumbnail: boolean
  ) => void;
  onRestoreVersion: (targetVersion: number) => void;
  itemName: string;
  formatDate: (dateString: string) => string;
}

interface HistoryItem {
  timestamp: string;
  fromVersion: number;
  toVersion: number;
  editType: string;
  previousPath: string;
  newPath: string;
  prompt?: string;
  seed?: number;
  restoredFromVersion?: number;
}

const truncateText = (text: string, maxLength: number) =>
  text.length <= maxLength ? text : text.substring(0, maxLength) + "...";

function PromptDetailPopover({
  item,
  anchorEl,
  open,
  onClose,
}: {
  item: HistoryItem | ImageVersion;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}) {
  const isHistoryItem = "editType" in item;

  const getEditTypeLabel = (editType: string) => {
    switch (editType) {
      case "flux_pro_kontext":
        return "Edit";
      case "text_to_image":
        return "Generate";
      case "version_restore":
        return "Restore";
      default:
        return editType.startsWith("upscale_")
          ? `Upscale ${editType.split("_")[1]}`
          : "Unknown";
    }
  };

  return (
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
            borderRadius: 2,
            p: 2,
            zIndex: 10000,
          },
        },
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" color="white" fontWeight="bold">
            {isHistoryItem
              ? `${getEditTypeLabel((item as HistoryItem).editType)} Details`
              : "Version Details"}
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
            Version{" "}
            {isHistoryItem
              ? (item as HistoryItem).toVersion
              : (item as ImageVersion).version}
          </Typography>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />
        {item.prompt && (
          <Box>
            <Typography
              variant="body2"
              color="secondary.main"
              fontWeight="medium"
              gutterBottom
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
            color="secondary.main"
            fontWeight="medium"
            gutterBottom
          >
            Technical Details
          </Typography>
          <Stack spacing={0.5}>
            {item.seed && (
              <Typography variant="caption" color="rgba(255,255,255,0.8)">
                Seed: {item.seed}
              </Typography>
            )}
            {isHistoryItem && (
              <Typography variant="caption" color="rgba(255,255,255,0.8)">
                Type: {getEditTypeLabel((item as HistoryItem).editType)}
              </Typography>
            )}
            <Typography variant="caption" color="rgba(255,255,255,0.8)">
              Timestamp: {new Date(item.timestamp).toLocaleString()}
            </Typography>
            {(item as HistoryItem).restoredFromVersion && (
              <Typography variant="caption" color="rgba(255,255,255,0.8)">
                Restored from Version:{" "}
                {(item as HistoryItem).restoredFromVersion}
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Popover>
  );
}

export function ImageVersionModal({
  allVersions,
  currentlyViewingVersion,
  totalVersions,
  totalEdits,
  historyData,
  isLoadingVersions,
  isLoadingHistory,
  isEditing,
  isRestoring,
  isUpscaling,
  open,
  onClose,
  onVersionSelect,
  onRestoreVersion,
  itemName,
  formatDate,
}: ImageVersionModalProps) {
  const theme = useTheme();
  const [popoverAnchor, setPopoverAnchor] = useState<{
    element: HTMLElement;
    item: HistoryItem | ImageVersion;
  } | null>(null);
  const currentIndex = allVersions.findIndex(
    (v) => v.version === currentlyViewingVersion?.version
  );

  const handleVersionClick = (
    event: React.MouseEvent<HTMLElement>,
    item: ImageVersion | HistoryItem
  ) => {
    if (item.prompt) {
      setPopoverAnchor({ element: event.currentTarget, item });
    }
  };

  return (
    <>
      <StyledDialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogContent sx={{ p: 0 }}>
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
              <StyledAvatar>
                <ImageIcon sx={{ color: "white", fontSize: 18 }} />
              </StyledAvatar>
              <Box>
                <Typography variant="h6" fontWeight="bold" fontSize="1.2rem">
                  {itemName.charAt(0).toUpperCase() + itemName.slice(1)} -
                  Version History
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
                        background: alpha(theme.palette.secondary.main, 0.1),
                        borderColor: theme.palette.secondary.main,
                        color: theme.palette.secondary.main,
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
                    <IconButton
                      onClick={() =>
                        currentIndex > 0 &&
                        onVersionSelect(
                          allVersions[currentIndex - 1],
                          "left-to-right",
                          true
                        )
                      }
                      disabled={
                        currentIndex <= 0 ||
                        isEditing ||
                        isRestoring ||
                        isUpscaling
                      }
                      sx={{ borderRadius: 8, "&:disabled": { opacity: 0.3 } }}
                      size="small"
                    >
                      <PrevIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Next version">
                    <IconButton
                      onClick={() =>
                        currentIndex < allVersions.length - 1 &&
                        onVersionSelect(
                          allVersions[currentIndex + 1],
                          "right-to-left",
                          true
                        )
                      }
                      disabled={
                        currentIndex >= allVersions.length - 1 ||
                        isEditing ||
                        isRestoring ||
                        isUpscaling
                      }
                      sx={{ borderRadius: 8, "&:disabled": { opacity: 0.3 } }}
                      size="small"
                    >
                      <NextIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              <IconButton
                onClick={onClose}
                sx={{
                  borderRadius: 10,
                  p: 1,
                  background: alpha(theme.palette.background.paper, 0.8),
                  "&:hover": { background: theme.palette.background.paper },
                }}
                size="small"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box
            sx={{
              p: 3,
              maxHeight: "70vh",
              overflow: "auto",
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="700"
                  sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
                >
                  <LayersIcon
                    sx={{ fontSize: 18, color: theme.palette.text.secondary }}
                  />{" "}
                  All Versions ({totalVersions})
                </Typography>
                {isLoadingVersions ? (
                  <Typography
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 3 }}
                  >
                    Loading versions...
                  </Typography>
                ) : allVersions.length > 0 ? (
                  <Stack spacing={2}>
                    {allVersions.map((version) => (
                      <VersionCard
                        key={version.version}
                        cardvariant={
                          version.isCurrent
                            ? "current"
                            : version.version ===
                                currentlyViewingVersion?.version
                              ? "viewing"
                              : "archived"
                        }
                        onClick={(e) => {
                          onVersionSelect(version, "left-to-right", false);
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
                              <Typography variant="h6" fontWeight="bold">
                                Version {version.version}
                              </Typography>
                              {version.isCurrent && (
                                <Chip
                                  label="Current"
                                  color="primary"
                                  size="small"
                                  sx={{
                                    borderRadius: 6,
                                    fontWeight: 600,
                                    fontSize: "0.7rem",
                                  }}
                                />
                              )}
                              {version.version ===
                                currentlyViewingVersion?.version && (
                                <Chip
                                  label="Viewing"
                                  color="secondary"
                                  variant="outlined"
                                  size="small"
                                  sx={{
                                    borderRadius: 6,
                                    fontWeight: 600,
                                    fontSize: "0.7rem",
                                  }}
                                />
                              )}
                            </Box>
                            <Box
                              sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
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
                              {version.prompt && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "text.secondary",
                                    mt: 0.5,
                                    fontStyle: "italic",
                                  }}
                                >
                                  {truncateText(version.prompt, 60)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          {!version.isCurrent && (
                            <StyledButton
                              size="small"
                              startIcon={<RestoreIcon fontSize="small" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestoreVersion(version.version);
                              }}
                              disabled={isRestoring}
                              variant="outlined"
                              color="secondary"
                            >
                              Restore
                            </StyledButton>
                          )}
                        </Box>
                      </VersionCard>
                    ))}
                  </Stack>
                ) : (
                  <Typography
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 3 }}
                  >
                    No versions available
                  </Typography>
                )}
              </Box>
              {historyData.length > 0 && (
                <StyledAccordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      borderRadius: 12,
                      backgroundColor: theme.palette.background.default,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="700">
                        Edit History
                      </Typography>
                      <Chip
                        label={`${totalEdits} edits`}
                        size="small"
                        sx={{
                          borderRadius: 6,
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
                      borderBottomRadius: 12,
                    }}
                  >
                    <Stack spacing={2}>
                      {isLoadingHistory ? (
                        <Typography
                          sx={{
                            color: "text.secondary",
                            textAlign: "center",
                            py: 3,
                          }}
                        >
                          Loading history...
                        </Typography>
                      ) : (
                        historyData
                          .sort(
                            (a: any, b: any) =>
                              new Date(b.timestamp).getTime() -
                              new Date(a.timestamp).getTime()
                          )
                          .map((item: any, index: number) => (
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
                                      >
                                        {item.editType ===
                                        "flux_pro_kontext" ? (
                                          <>
                                            V{item.fromVersion} → V
                                            {item.toVersion}
                                          </>
                                        ) : item.editType ===
                                          "text_to_image" ? (
                                          <>New Image → V{item.toVersion}</>
                                        ) : item.editType ===
                                          "version_restore" ? (
                                          <>
                                            Restored V{item.restoredFromVersion}{" "}
                                            as V{item.toVersion}
                                          </>
                                        ) : item.editType.startsWith(
                                            "upscale_"
                                          ) ? (
                                          <>
                                            Upscaled{" "}
                                            {item.editType.split("_")[1]} V
                                            {item.fromVersion} → V
                                            {item.toVersion}
                                          </>
                                        ) : (
                                          <>
                                            V{item.fromVersion} → V
                                            {item.toVersion}
                                          </>
                                        )}
                                      </Typography>
                                      {item.prompt && (
                                        <InfoIcon
                                          sx={{
                                            color: "text.secondary",
                                            fontSize: 16,
                                          }}
                                        />
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
                                      }}
                                      noWrap
                                    >
                                      {formatDate(item.timestamp)}
                                      {item.seed && (
                                        <span style={{ marginLeft: 8 }}>
                                          • Seed: {item.seed}
                                        </span>
                                      )}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={
                                      item.editType === "flux_pro_kontext"
                                        ? "Edit"
                                        : item.editType === "text_to_image"
                                          ? "Generate"
                                          : item.editType === "version_restore"
                                            ? "Restore"
                                            : item.editType.startsWith(
                                                  "upscale_"
                                                )
                                              ? `Upscale ${
                                                  item.editType.split("_")[1]
                                                }`
                                              : "Unknown"
                                    }
                                    size="small"
                                    sx={{
                                      bgcolor: "secondary.main",
                                      color: "secondary.contrastText",
                                      border: `1px solid ${alpha(
                                        theme.palette.divider,
                                        0.2
                                      )}`,
                                      minWidth: 60,
                                    }}
                                  />
                                </Stack>
                              </Box>
                            </HistoryCard>
                          ))
                      )}
                    </Stack>
                  </AccordionDetails>
                </StyledAccordion>
              )}
            </Stack>
          </Box>
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
              Image version management
            </Typography>
            <StyledButton onClick={onClose} variant="contained" color="primary">
              Close
            </StyledButton>
          </Box>
        </DialogContent>
      </StyledDialog>
      <Portal>
        {popoverAnchor && (
          <PromptDetailPopover
            item={popoverAnchor.item}
            anchorEl={popoverAnchor.element}
            open={Boolean(popoverAnchor)}
            onClose={() => setPopoverAnchor(null)}
          />
        )}
      </Portal>
    </>
  );
}
