// src/components/imageEditor/VersionThumbnailStrip.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Chip,
  alpha,
  Skeleton,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  CheckCircle as CurrentIcon,
  Restore as RestoreIcon,
  Theaters as FilmStripIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { ImageVersion } from "@/types/storyBoard/types";
import { format } from "date-fns";
import { ImageMetadataPanel } from "./ImageMetadataPanel";

interface VersionThumbnailStripProps {
  allVersions: ImageVersion[];
  currentVersion?: ImageVersion;
  onVersionSelect: (version: ImageVersion) => void;
  onRestoreVersion?: (version: ImageVersion) => void;
  isLoading?: boolean;
  disabled?: boolean;
  maxVisibleThumbnails?: number;
}

interface VersionDetailsModalProps {
  open: boolean;
  version: ImageVersion | null;
  isCurrent: boolean;
  onClose: () => void;
  onRestore?: (version: ImageVersion) => void;
  onSelect: (version: ImageVersion) => void;
}

/**
 * Version Details Modal - With Metadata Tab
 */
function VersionDetailsModal({
  open,
  version,
  isCurrent,
  onClose,
  onRestore,
  onSelect,
}: VersionDetailsModalProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [selectedTab, setSelectedTab] = useState(0);

  if (!version) return null;

  const formatDate = (date: string | { _seconds: number } | undefined) => {
    if (!date) return "Unknown date";
    if (typeof date === "string") {
      try {
        return format(new Date(date), "PPpp");
      } catch {
        return "Invalid date";
      }
    }
    if (typeof date === "object" && "_seconds" in date) {
      try {
        return format(new Date(date._seconds * 1000), "PPpp");
      } catch {
        return "Invalid date";
      }
    }
    return "Unknown date";
  };

  const getGenerationTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      text_to_image: "Text to Image",
      flux_pro_kontext: "Flux Pro",
      nano_banana_edit: "Nano Edit",
      upscale_2x: "2x Upscale",
      batch_generation: "Batch Generation",
    };
    return type ? labels[type] || type : "Unknown";
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: `${brand.borderRadius}px`, backgroundImage: 'none', },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: brand.fonts.heading,
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ fontFamily: brand.fonts.heading }}>
            Version {version.version}
          </Typography>
          {isCurrent && (
            <Chip
              label="Current"
              color="primary"
              size="small"
              icon={<CurrentIcon />}
            />
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            px: 2,
          }}
        >
          <Tab label="Details" sx={{ fontFamily: brand.fonts.body }} />
          <Tab label="Metadata" sx={{ fontFamily: brand.fonts.body }} />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ p: 2 }}>
          {/* Tab 0: Details */}
          {selectedTab === 0 && (
            <Stack spacing={2}>
              {/* Compact Image Preview */}
              <Box
                sx={{
                  width: "100%",
                  aspectRatio: "16/9",
                  borderRadius: `${brand.borderRadius}px`,
                  overflow: "hidden",
                  bgcolor: "background.default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  component="img"
                  src={
                    version.thumbnailPath ||
                    version.signedUrl ||
                    "/placeHolder.webp"
                  }
                  alt={`Version ${version.version}`}
                  sx={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>

              {/* Compact Info Grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 1,
                  fontSize: "0.875rem",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Version:
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {version.version}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip
                  label={isCurrent ? "Current" : "Archived"}
                  size="small"
                  color={isCurrent ? "primary" : "default"}
                  sx={{ height: 20, width: "fit-content" }}
                />

                {version.generationType && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Type:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {getGenerationTypeLabel(version.generationType)}
                    </Typography>
                  </>
                )}

                {version.aspectRatio && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Ratio:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {version.aspectRatio}
                    </Typography>
                  </>
                )}

                <Typography variant="body2" color="text.secondary">
                  Date:
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatDate(
                    isCurrent
                      ? version.lastEditedAt
                      : (version as any).archivedAt || version.lastEditedAt
                  )}
                </Typography>
              </Box>

              {/* Prompt - Compact */}
              {version.prompt && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                  >
                    Prompt
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      borderRadius: `${brand.borderRadius}px`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontFamily: "monospace",
                        lineHeight: 1.4,
                      }}
                    >
                      {version.prompt}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Stack>
          )}

          {/* Tab 1: Metadata */}
          {selectedTab === 1 && (
            <ImageMetadataPanel
              metadata={version?.imageMetadata || null}
              compact={false}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 1.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small">
          Close
        </Button>
        {!isCurrent && onRestore && (
          <Button
            onClick={() => {
              onRestore(version);
              onClose();
            }}
            variant="contained"
            size="small"
            startIcon={<RestoreIcon />}
          >
            Restore
          </Button>
        )}
        {!isCurrent && (
          <Button
            onClick={() => {
              onSelect(version);
              onClose();
            }}
            variant="contained"
            color="primary"
            size="small"
          >
            View
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

/**
 * Enhanced Compact Film Strip Version Thumbnail Strip
 *
 * Features:
 * - Film strip icon indicator on the left
 * - Vertical divider separator
 * - Improved visual hierarchy
 * - Compact design maintained
 */
export function VersionThumbnailStrip({
  allVersions,
  currentVersion,
  onVersionSelect,
  onRestoreVersion,
  isLoading = false,
  disabled = false,
  maxVisibleThumbnails = 8,
}: VersionThumbnailStripProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedVersion, setSelectedVersion] = useState<ImageVersion | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);

  // Sort versions by version number descending
  const sortedVersions = useMemo(() => {
    return [...allVersions].sort((a, b) => b.version - a.version);
  }, [allVersions]);

  // Compact filmstrip dimensions
  const thumbnailWidth = 80;
  const thumbnailHeight = 45; // 16:9 aspect ratio
  const thumbnailGap = 8;
  const containerWidth = maxVisibleThumbnails * (thumbnailWidth + thumbnailGap);
  const maxScroll = Math.max(
    0,
    sortedVersions.length * (thumbnailWidth + thumbnailGap) - containerWidth
  );

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < maxScroll;

  const handleScroll = useCallback(
    (direction: "left" | "right") => {
      const scrollAmount = (thumbnailWidth + thumbnailGap) * 3;
      setScrollPosition((prev) => {
        if (direction === "left") {
          return Math.max(0, prev - scrollAmount);
        } else {
          return Math.min(maxScroll, prev + scrollAmount);
        }
      });
    },
    [maxScroll, thumbnailWidth]
  );

  const handleThumbnailClick = useCallback(
    (version: ImageVersion) => {
      if (!disabled) {
        onVersionSelect(version);
      }
    },
    [disabled, onVersionSelect]
  );

  const handleInfoClick = useCallback(
    (e: React.MouseEvent, version: ImageVersion) => {
      e.stopPropagation();
      setSelectedVersion(version);
      setModalOpen(true);
    },
    []
  );

  if (sortedVersions.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 0.75,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: "blur(8px)",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Loading icon */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
            }}
          >
            <Skeleton variant="circular" width={24} height={24} />
          </Box>
          <Divider orientation="vertical" flexItem />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              width={thumbnailWidth}
              height={thumbnailHeight}
              sx={{ borderRadius: `${brand.borderRadius / 2}px` }}
            />
          ))}
        </Stack>
      </Paper>
    );
  }

  return (
    <>
      {/* Enhanced Compact Film Strip */}
      <Paper
        elevation={0}
        sx={{
          p: 0.75,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(12px)",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          position: "relative",
          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Film Strip Icon Indicator */}
          <Tooltip title={`${sortedVersions.length} versions`} arrow>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 32,
                height: 32,
                borderRadius: `${brand.borderRadius / 2}px`,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
                transition: "all 0.2s ease-in-out",
                cursor: "default",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  transform: "scale(1.05)",
                },
              }}
            >
              <FilmStripIcon sx={{ fontSize: 20 }} />
            </Box>
          </Tooltip>

          {/* Vertical Divider */}
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              borderColor: alpha(theme.palette.primary.main, 0.2),
              borderWidth: 1,
            }}
          />

          {/* Left Scroll Button */}
          <IconButton
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft || disabled}
            size="small"
            sx={{
              minWidth: 24,
              width: 24,
              height: 24,
              bgcolor: canScrollLeft
                ? alpha(theme.palette.primary.main, 0.08)
                : alpha(theme.palette.background.default, 0.5),
              color: canScrollLeft ? "primary.main" : "text.disabled",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.15),
              },
              "&.Mui-disabled": {
                opacity: 0.3,
                bgcolor: alpha(theme.palette.background.default, 0.3),
              },
            }}
          >
            <PrevIcon fontSize="small" />
          </IconButton>

          {/* Thumbnails Container - Film Strip Style */}
          <Box
            sx={{
              width: containerWidth,
              overflow: "hidden",
              position: "relative",
              // Enhanced film strip perforations
              "&::before, &::after": {
                content: '""',
                position: "absolute",
                top: -4,
                bottom: -4,
                width: 4,
                background: `repeating-linear-gradient(
                  0deg,
                  ${alpha(theme.palette.primary.main, 0.3)} 0px,
                  ${alpha(theme.palette.primary.main, 0.3)} 3px,
                  transparent 3px,
                  transparent 6px
                )`,
                zIndex: 1,
                borderRadius: 1,
              },
              "&::before": { left: -4 },
              "&::after": { right: -4 },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                transform: `translateX(-${scrollPosition}px)`,
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {sortedVersions.map((version) => {
                const isCurrentVersion =
                  currentVersion?.version === version.version;

                return (
                  <Box
                    key={version.version}
                    sx={{
                      position: "relative",
                      flexShrink: 0,
                    }}
                  >
                    {/* Thumbnail Frame */}
                    <Paper
                      onClick={() => handleThumbnailClick(version)}
                      elevation={isCurrentVersion ? 6 : 2}
                      sx={{
                        width: thumbnailWidth,
                        height: thumbnailHeight,
                        borderRadius: `${brand.borderRadius / 2}px`,
                        overflow: "hidden",
                        cursor: disabled ? "default" : "pointer",
                        border: 2,
                        borderColor: isCurrentVersion
                          ? "primary.main"
                          : alpha(theme.palette.divider, 0.5),
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        boxShadow: isCurrentVersion
                          ? `0 0 12px ${alpha(theme.palette.primary.main, 0.3)}`
                          : undefined,
                        "&:hover": disabled
                          ? {}
                          : {
                              borderColor: "primary.main",
                              transform: "scale(1.08) translateY(-2px)",
                              zIndex: 10,
                              boxShadow: `0 4px 16px ${alpha(
                                theme.palette.primary.main,
                                0.25
                              )}`,
                            },
                      }}
                    >
                      <Box
                        component="img"
                        src={
                          version.thumbnailPath ||
                          version.signedUrl ||
                          "/placeHolder.webp"
                        }
                        alt={`V${version.version}`}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />

                      {/* Version Number Badge - Enhanced */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 2,
                          left: 2,
                          bgcolor: alpha(theme.palette.background.paper, 0.95),
                          backdropFilter: "blur(4px)",
                          px: 0.75,
                          py: 0.25,
                          borderRadius: `${brand.borderRadius / 3}px`,
                          lineHeight: 1,
                          border: 1,
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.65rem",
                            color: isCurrentVersion
                              ? "primary.main"
                              : "text.primary",
                          }}
                        >
                          V{version.version}
                        </Typography>
                      </Box>

                      {/* Current Badge - Enhanced */}
                      {isCurrentVersion && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            p: 0.25,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `0 2px 6px ${alpha(
                              theme.palette.primary.main,
                              0.4
                            )}`,
                          }}
                        >
                          <CurrentIcon sx={{ fontSize: 12 }} />
                        </Box>
                      )}

                      {/* Info Button - Enhanced hover effect */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: `linear-gradient(to top, ${alpha(
                            theme.palette.background.paper,
                            0.95
                          )} 0%, transparent 100%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: 0,
                          transition: "opacity 0.2s ease-in-out",
                          pt: 1,
                          pb: 0.5,
                          ".MuiPaper-root:hover &": {
                            opacity: 1,
                          },
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => handleInfoClick(e, version)}
                          sx={{
                            width: 20,
                            height: 20,
                            minWidth: 20,
                            color: "primary.main",
                            bgcolor: alpha(theme.palette.background.paper, 0.9),
                            border: 1,
                            borderColor: alpha(theme.palette.primary.main, 0.2),
                            "&:hover": {
                              bgcolor: "primary.main",
                              color: "primary.contrastText",
                              borderColor: "primary.main",
                            },
                          }}
                        >
                          <InfoIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* Right Scroll Button */}
          <IconButton
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight || disabled}
            size="small"
            sx={{
              minWidth: 24,
              width: 24,
              height: 24,
              bgcolor: canScrollRight
                ? alpha(theme.palette.primary.main, 0.08)
                : alpha(theme.palette.background.default, 0.5),
              color: canScrollRight ? "primary.main" : "text.disabled",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.15),
              },
              "&.Mui-disabled": {
                opacity: 0.3,
                bgcolor: alpha(theme.palette.background.default, 0.3),
              },
            }}
          >
            <NextIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>

      {/* Version Details Modal */}
      <VersionDetailsModal
        open={modalOpen}
        version={selectedVersion}
        isCurrent={selectedVersion?.version === currentVersion?.version}
        onClose={() => setModalOpen(false)}
        onRestore={onRestoreVersion}
        onSelect={onVersionSelect}
      />
    </>
  );
}
