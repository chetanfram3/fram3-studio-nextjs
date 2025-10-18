// src/components/imageEditor/VersionThumbnailStrip.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Skeleton,
  Divider,
  alpha,
} from "@mui/material";
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Theaters as FilmStripIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { ImageVersion } from "@/types/storyBoard/types";
import { VersionThumbnail } from "./VersionThumbnail";
import { VersionDetailsModal } from "./VersionDetailsModal";

interface VersionThumbnailStripProps {
  allVersions: ImageVersion[];
  currentVersion?: ImageVersion;
  onVersionSelect: (version: ImageVersion) => void;
  onRestoreVersion?: (targetVersion: number) => void;
  isLoading?: boolean;
  disabled?: boolean;
  maxVisibleThumbnails?: number;
}

/**
 * Enhanced Compact Film Strip Version Thumbnail Strip with Dynamic Aspect Ratio
 *
 * Features:
 * - Film strip icon indicator on the left
 * - Vertical divider separator
 * - Dynamic aspect ratio support (16:9, 9:16, 1:1, etc.)
 * - Improved visual hierarchy
 * - Compact design maintained
 * - Smooth scrolling
 * - Loading states
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

  // Sort versions by version number descending (newest first)
  const sortedVersions = useMemo(() => {
    return [...allVersions].sort((a, b) => b.version - a.version);
  }, [allVersions]);

  // Compact filmstrip dimensions
  const thumbnailWidth = 160;
  const thumbnailHeight = 90; // Default 16:9 aspect ratio (will be dynamic per image)
  const thumbnailGap = 8;
  const containerWidth = maxVisibleThumbnails * (thumbnailWidth + thumbnailGap);
  const maxScroll = Math.max(
    0,
    sortedVersions.length * (thumbnailWidth + thumbnailGap) - containerWidth
  );

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < maxScroll;

  /**
   * Handle scroll left/right
   */
  const handleScroll = useCallback(
    (direction: "left" | "right") => {
      const scrollAmount = (thumbnailWidth + thumbnailGap) * 3; // Scroll 3 thumbnails at a time
      setScrollPosition((prev) => {
        if (direction === "left") {
          return Math.max(0, prev - scrollAmount);
        } else {
          return Math.min(maxScroll, prev + scrollAmount);
        }
      });
    },
    [maxScroll, thumbnailWidth, thumbnailGap]
  );

  /**
   * Handle thumbnail click
   */
  const handleThumbnailClick = useCallback(
    (version: ImageVersion) => {
      if (!disabled) {
        onVersionSelect(version);
      }
    },
    [disabled, onVersionSelect]
  );

  /**
   * Handle info button click
   */
  const handleInfoClick = useCallback(
    (e: React.MouseEvent, version: ImageVersion) => {
      e.stopPropagation();
      setSelectedVersion(version);
      setModalOpen(true);
    },
    []
  );

  /**
   * Handle modal close
   */
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedVersion(null);
  }, []);

  // No versions - don't render anything
  if (sortedVersions.length === 0) {
    return null;
  }

  // Loading state
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
          {/* Loading thumbnails */}
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
                  <VersionThumbnail
                    key={version.version}
                    version={version}
                    isCurrentVersion={isCurrentVersion}
                    disabled={disabled}
                    thumbnailWidth={thumbnailWidth}
                    thumbnailHeight={thumbnailHeight}
                    onThumbnailClick={handleThumbnailClick}
                    onInfoClick={handleInfoClick}
                  />
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
        onClose={handleModalClose}
        onRestore={onRestoreVersion}
        onSelect={onVersionSelect}
      />
    </>
  );
}
