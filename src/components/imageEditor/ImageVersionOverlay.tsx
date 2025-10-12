"use client";

// ImageVersionOverlay.tsx - Fully theme-compliant and performance-optimized
import { useState, useMemo, useCallback } from "react";
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
import { getCurrentBrand } from "@/config/brandConfig";
import { ImageVersion } from "@/types/storyBoard/types";

// Consolidated Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: getCurrentBrand().borderRadius * 2,
    border: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.paper,
    backgroundImage: "none !important",
    boxShadow: theme.shadows[24],
    maxWidth: 1200,
    width: "100%",
    maxHeight: "90vh",
    overflow: "hidden",
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  borderRadius: getCurrentBrand().borderRadius,
  width: 32,
  height: 32,
  boxShadow: theme.shadows[2],
}));

const StyledButton = styled(Button)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: brand.borderRadius,
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.875rem",
    padding: "6px 12px",
    minWidth: "auto",
    fontFamily: brand.fonts.body,
    transition: "all 0.2s ease",
    "&:hover": { transform: "translateY(-1px)" },
  };
});

const VersionCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "cardvariant",
})<{ cardvariant?: "current" | "viewing" | "archived" }>(({
  theme,
  cardvariant,
}) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: brand.borderRadius * 1.5,
    padding: theme.spacing(2),
    border:
      cardvariant === "current"
        ? `2px solid ${theme.palette.primary.main}`
        : cardvariant === "viewing"
          ? `2px solid ${theme.palette.primary.light}`
          : `1px solid ${theme.palette.divider}`,
    background:
      cardvariant === "current"
        ? alpha(theme.palette.primary.main, 0.05)
        : cardvariant === "viewing"
          ? alpha(theme.palette.primary.light, 0.05)
          : theme.palette.background.paper,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor:
        cardvariant === "current"
          ? theme.palette.primary.main
          : theme.palette.primary.light,
      boxShadow: theme.shadows[4],
      transform: "translateY(-1px)",
    },
  };
});

const MetadataChip = styled(Chip)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: brand.borderRadius,
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
    borderRadius: brand.borderRadius * 1.5,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "none",
    "&:before": { display: "none" },
    "& .MuiAccordionSummary-root": {
      borderRadius: brand.borderRadius * 1.5,
      minHeight: 48,
      "&.Mui-expanded": { borderBottomRadius: 0 },
    },
    "& .MuiAccordionDetails-root": {
      borderTop: `1px solid ${theme.palette.divider}`,
      borderBottomRadius: brand.borderRadius * 1.5,
    },
  };
});

const HistoryCard = styled(Paper)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    borderRadius: brand.borderRadius,
    padding: theme.spacing(1.5),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    background: alpha(theme.palette.primary.main, 0.03),
    position: "relative",
    cursor: "pointer",
    transition: "all 0.2s ease",
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

interface ImageVersionModalProps {
  allVersions: ImageVersion[];
  currentlyViewingVersion?: ImageVersion;
  totalVersions: number;
  totalEdits: number;
  historyData: HistoryItem[];
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
  const theme = useTheme();
  const brand = getCurrentBrand();
  const isHistoryItem = "editType" in item;

  // ✅ ADD THESE TYPE GUARDS
  const prompt = isHistoryItem ? item.prompt : undefined;
  const seed = isHistoryItem ? item.seed : undefined;
  const timestamp = isHistoryItem ? item.timestamp : item.lastEditedAt || "";

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
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: `${brand.borderRadius}px`,
            boxShadow: theme.shadows[8],
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
            color="text.primary"
            fontWeight="bold"
            sx={{ fontFamily: brand.fonts.body }}
          >
            {isHistoryItem
              ? `${getEditTypeLabel((item as HistoryItem).editType)} Details`
              : "Version Details"}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontFamily: brand.fonts.body }}
          >
            Version{" "}
            {isHistoryItem
              ? (item as HistoryItem).toVersion
              : (item as ImageVersion).version}
          </Typography>
        </Box>
        <Divider sx={{ borderColor: "divider" }} />
        {/* ✅ USE THE TYPE-GUARDED VARIABLES */}
        {prompt && (
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
              color="text.primary"
              sx={{
                lineHeight: 1.4,
                maxHeight: 200,
                overflow: "auto",
                fontSize: "0.8rem",
                fontFamily: brand.fonts.body,
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-track": {
                  background: theme.palette.action.hover,
                  borderRadius: brand.borderRadius,
                },
                "&::-webkit-scrollbar-thumb": {
                  background: theme.palette.divider,
                  borderRadius: brand.borderRadius,
                },
              }}
            >
              {prompt}
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
            {seed && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Seed: {seed}
              </Typography>
            )}
            {isHistoryItem && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Type: {getEditTypeLabel((item as HistoryItem).editType)}
              </Typography>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Timestamp: {new Date(timestamp).toLocaleString()}
            </Typography>
            {isHistoryItem && (item as HistoryItem).restoredFromVersion && (
              <Typography
                variant="caption"
                color="text.secondary"
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
  const brand = getCurrentBrand();
  const [popoverAnchor, setPopoverAnchor] = useState<{
    element: HTMLElement;
    item: HistoryItem | ImageVersion;
  } | null>(null);

  // Memoize current index calculation
  const currentIndex = useMemo(
    () =>
      allVersions.findIndex(
        (v) => v.version === currentlyViewingVersion?.version
      ),
    [allVersions, currentlyViewingVersion?.version]
  );

  // Memoize sorted history data
  const sortedHistoryData = useMemo(
    () =>
      [...historyData].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [historyData]
  );

  const handleVersionClick = useCallback(
    (
      event: React.MouseEvent<HTMLElement>,
      item: ImageVersion | HistoryItem
    ) => {
      if (item.prompt) {
        setPopoverAnchor({ element: event.currentTarget, item });
      }
    },
    []
  );

  const handlePrevVersion = useCallback(() => {
    if (currentIndex > 0) {
      onVersionSelect(allVersions[currentIndex - 1], "left-to-right", true);
    }
  }, [currentIndex, allVersions, onVersionSelect]);

  const handleNextVersion = useCallback(() => {
    if (currentIndex < allVersions.length - 1) {
      onVersionSelect(allVersions[currentIndex + 1], "right-to-left", true);
    }
  }, [currentIndex, allVersions, onVersionSelect]);

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
              )}, ${alpha(theme.palette.primary.light, 0.05)})`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <StyledAvatar>
                <ImageIcon sx={{ color: "white", fontSize: 18 }} />
              </StyledAvatar>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  fontSize="1.2rem"
                  sx={{ fontFamily: brand.fonts.heading }}
                >
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
                        background: alpha(theme.palette.primary.main, 0.1),
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
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
                      onClick={handlePrevVersion}
                      disabled={
                        currentIndex <= 0 ||
                        isEditing ||
                        isRestoring ||
                        isUpscaling
                      }
                      color="primary"
                      sx={{
                        borderRadius: `${brand.borderRadius}px`,
                        "&:disabled": { opacity: 0.3 },
                      }}
                      size="small"
                    >
                      <PrevIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Next version">
                    <IconButton
                      onClick={handleNextVersion}
                      disabled={
                        currentIndex >= allVersions.length - 1 ||
                        isEditing ||
                        isRestoring ||
                        isUpscaling
                      }
                      color="primary"
                      sx={{
                        borderRadius: `${brand.borderRadius}px`,
                        "&:disabled": { opacity: 0.3 },
                      }}
                      size="small"
                    >
                      <NextIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              <IconButton
                onClick={onClose}
                color="primary"
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
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
                  sx={{
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  <LayersIcon
                    sx={{ fontSize: 18, color: theme.palette.text.secondary }}
                  />{" "}
                  All Versions ({totalVersions})
                </Typography>
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
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                sx={{ fontFamily: brand.fonts.body }}
                              >
                                Version {version.version}
                              </Typography>
                              {version.isCurrent && (
                                <Chip
                                  label="Current"
                                  color="primary"
                                  size="small"
                                  sx={{
                                    borderRadius: `${brand.borderRadius}px`,
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
                                    borderRadius: `${brand.borderRadius}px`,
                                    fontWeight: 600,
                                    fontSize: "0.7rem",
                                    fontFamily: brand.fonts.body,
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
                                    fontFamily: brand.fonts.body,
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
                              color="primary"
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
                    sx={{
                      textAlign: "center",
                      py: 3,
                      fontFamily: brand.fonts.body,
                    }}
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
                      borderRadius: `${brand.borderRadius * 1.5}px`,
                      backgroundColor: theme.palette.background.default,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="700"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        Edit History
                      </Typography>
                      <Chip
                        label={`${totalEdits} edits`}
                        size="small"
                        sx={{
                          borderRadius: `${brand.borderRadius}px`,
                          background: alpha(theme.palette.info.main, 0.1),
                          border: `1px solid ${alpha(
                            theme.palette.info.main,
                            0.3
                          )}`,
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
                      backgroundColor: theme.palette.background.default,
                      borderTop: `1px solid ${theme.palette.divider}`,
                      borderBottomRadius: `${brand.borderRadius * 1.5}px`,
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
                        sortedHistoryData.map((item, index) => (
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
                                      {item.editType === "flux_pro_kontext" ? (
                                        <>
                                          V{item.fromVersion} → V
                                          {item.toVersion}
                                        </>
                                      ) : item.editType === "text_to_image" ? (
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
                                          Upscaled {item.editType.split("_")[1]}{" "}
                                          V{item.fromVersion} → V
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
                                  </Typography>
                                </Box>
                                <Chip
                                  label={getEditTypeLabel(item.editType)}
                                  size="small"
                                  sx={{
                                    bgcolor: "primary.main",
                                    color: theme.palette.getContrastText(
                                      theme.palette.primary.main
                                    ),
                                    border: `1px solid ${alpha(
                                      theme.palette.divider,
                                      0.2
                                    )}`,
                                    minWidth: 60,
                                    fontFamily: brand.fonts.body,
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
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
