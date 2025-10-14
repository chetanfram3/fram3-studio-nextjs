"use client";

import { useState, useMemo, useCallback } from "react";
import { Box, IconButton, Tooltip, Fade, Chip } from "@mui/material";
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import logger from "@/utils/logger";
import { VideoVersion } from "./VideoViewerContainer";

interface VideoVersionNavigationProps {
  allVersions: VideoVersion[];
  currentlyViewingVersion: VideoVersion | undefined;
  showOverlays: boolean;
  versionsMode: boolean;
  historyMode: boolean;
  isGenerating: boolean;
  isRestoring: boolean;
  onVersionSelect: (
    version: VideoVersion,
    direction: "left-to-right" | "right-to-left",
    skipThumbnail: boolean
  ) => void;
}

export function VideoVersionNavigation({
  allVersions,
  currentlyViewingVersion,
  showOverlays,
  versionsMode,
  historyMode,
  isGenerating,
  isRestoring,
  onVersionSelect,
}: VideoVersionNavigationProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE
  // ==========================================
  const [buttonHover, setButtonHover] = useState({
    leftArrow: false,
    rightArrow: false,
  });

  // ==========================================
  // COMPUTED VALUES (Memoized)
  // ==========================================
  const currentIndex = useMemo(
    () =>
      allVersions.findIndex(
        (v) => v.version === currentlyViewingVersion?.version
      ),
    [allVersions, currentlyViewingVersion?.version]
  );

  const canGoPrevious = useMemo(() => currentIndex > 0, [currentIndex]);

  const canGoNext = useMemo(
    () => currentIndex < allVersions.length - 1,
    [currentIndex, allVersions.length]
  );

  const hasMultipleVersions = useMemo(
    () => allVersions.length > 1,
    [allVersions.length]
  );

  const previousVersion = useMemo(
    () => (canGoPrevious ? allVersions[currentIndex - 1] : null),
    [canGoPrevious, allVersions, currentIndex]
  );

  const nextVersion = useMemo(
    () => (canGoNext ? allVersions[currentIndex + 1] : null),
    [canGoNext, allVersions, currentIndex]
  );

  const shouldShowLeftArrow = useMemo(
    () => showOverlays || buttonHover.leftArrow || versionsMode || historyMode,
    [showOverlays, buttonHover.leftArrow, versionsMode, historyMode]
  );

  const shouldShowRightArrow = useMemo(
    () => showOverlays || buttonHover.rightArrow || versionsMode || historyMode,
    [showOverlays, buttonHover.rightArrow, versionsMode, historyMode]
  );

  // ==========================================
  // HELPER FUNCTIONS (Memoized)
  // ==========================================
  const getVersionStatus = useCallback((version: VideoVersion | null) => {
    if (!version) return "No version";
    const hasVideo = !!(
      version.videoSignedUrl || version.lipsyncVideoSignedUrl
    );
    return hasVideo ? "Available" : "No Video";
  }, []);

  // ==========================================
  // EVENT HANDLERS (Memoized)
  // ==========================================
  const handlePrevious = useCallback(() => {
    if (canGoPrevious) {
      const targetVersion = allVersions[currentIndex - 1];
      logger.debug(`Navigating to previous version ${targetVersion.version}`, {
        hasVideoSignedUrl: !!targetVersion.videoSignedUrl,
        hasLipsyncUrl: !!targetVersion.lipsyncVideoSignedUrl,
        generationType: targetVersion.generationType,
      });
      onVersionSelect(targetVersion, "left-to-right", true);
    }
  }, [canGoPrevious, allVersions, currentIndex, onVersionSelect]);

  const handleNext = useCallback(() => {
    if (canGoNext) {
      const targetVersion = allVersions[currentIndex + 1];
      logger.debug(`Navigating to next version ${targetVersion.version}`, {
        hasVideoSignedUrl: !!targetVersion.videoSignedUrl,
        hasLipsyncUrl: !!targetVersion.lipsyncVideoSignedUrl,
        generationType: targetVersion.generationType,
      });
      onVersionSelect(targetVersion, "right-to-left", true);
    }
  }, [canGoNext, allVersions, currentIndex, onVersionSelect]);

  const handleLeftArrowEnter = useCallback(() => {
    setButtonHover((prev) => ({ ...prev, leftArrow: true }));
  }, []);

  const handleLeftArrowLeave = useCallback(() => {
    setButtonHover((prev) => ({ ...prev, leftArrow: false }));
  }, []);

  const handleRightArrowEnter = useCallback(() => {
    setButtonHover((prev) => ({ ...prev, rightArrow: true }));
  }, []);

  const handleRightArrowLeave = useCallback(() => {
    setButtonHover((prev) => ({ ...prev, rightArrow: false }));
  }, []);

  return (
    <>
      {/* Version Navigation Arrows */}
      {hasMultipleVersions && (
        <>
          <Fade in={shouldShowLeftArrow} timeout={{ enter: 200, exit: 500 }}>
            <Box
              sx={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
              onMouseEnter={handleLeftArrowEnter}
              onMouseLeave={handleLeftArrowLeave}
            >
              <Tooltip
                title={
                  canGoPrevious
                    ? `Previous: V${
                        previousVersion?.version
                      } (${getVersionStatus(previousVersion)})`
                    : "No previous version"
                }
                placement="right"
              >
                <span>
                  <IconButton
                    onClick={handlePrevious}
                    disabled={!canGoPrevious || isGenerating || isRestoring}
                    sx={{
                      bgcolor: "rgba(0,0,0,0.7)",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                      "&:disabled": { bgcolor: "rgba(0,0,0,0.3)" },
                      transition: "all 0.2s ease-in-out",
                      opacity: !canGoPrevious ? 0.5 : 1,
                    }}
                  >
                    <PrevIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Fade>

          <Fade in={shouldShowRightArrow} timeout={{ enter: 200, exit: 500 }}>
            <Box
              sx={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
              onMouseEnter={handleRightArrowEnter}
              onMouseLeave={handleRightArrowLeave}
            >
              <Tooltip
                title={
                  canGoNext
                    ? `Next: V${nextVersion?.version} (${getVersionStatus(
                        nextVersion
                      )})`
                    : "No next version"
                }
                placement="left"
              >
                <span>
                  <IconButton
                    onClick={handleNext}
                    disabled={!canGoNext || isGenerating || isRestoring}
                    sx={{
                      bgcolor: "rgba(0,0,0,0.7)",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                      "&:disabled": { bgcolor: "rgba(0,0,0,0.3)" },
                      transition: "all 0.2s ease-in-out",
                      opacity: !canGoNext ? 0.5 : 1,
                    }}
                  >
                    <NextIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Fade>
        </>
      )}

      {/* Version Indicator */}
      {currentlyViewingVersion && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            zIndex: 10,
          }}
        >
          <Chip
            label={`V${currentlyViewingVersion.version}${
              currentlyViewingVersion.isCurrent ? " (Current)" : ""
            }${
              !currentlyViewingVersion.videoSignedUrl &&
              !currentlyViewingVersion.lipsyncVideoSignedUrl
                ? " (No Video)"
                : ""
            }`}
            color="primary"
            size="small"
            sx={{
              bgcolor: currentlyViewingVersion.isCurrent
                ? "primary.dark"
                : "primary.main",
              color: "primary.contrastText",
              fontFamily: brand.fonts.body,
              ...(!currentlyViewingVersion.videoSignedUrl &&
                !currentlyViewingVersion.lipsyncVideoSignedUrl && {
                  animation: "errorPulse 2s ease-in-out infinite",
                  "@keyframes errorPulse": {
                    "0%": { opacity: 1 },
                    "50%": { opacity: 0.7 },
                    "100%": { opacity: 1 },
                  },
                }),
            }}
          />
        </Box>
      )}

      {/* Version Count Indicator (when hovering) */}
      {hasMultipleVersions &&
        (buttonHover.leftArrow || buttonHover.rightArrow) && (
          <Fade in timeout={200}>
            <Box
              sx={{
                position: "absolute",
                bottom: 8,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                bgcolor: "rgba(0,0,0,0.7)",
                color: "white",
                px: 1.5,
                py: 0.5,
                borderRadius: `${brand.borderRadius * 0.5}px`,
                fontSize: "0.75rem",
                fontFamily: brand.fonts.body,
                pointerEvents: "none",
              }}
            >
              {currentIndex + 1} of {allVersions.length} versions
            </Box>
          </Fade>
        )}

      {/* Keyboard Navigation Hint */}
      {hasMultipleVersions && showOverlays && !isGenerating && !isRestoring && (
        <Fade in timeout={300}>
          <Box
            sx={{
              position: "absolute",
              bottom: 25,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9,
              bgcolor: "rgba(0,0,0,0.6)",
              color: "white",
              px: 1,
              py: 0.5,
              borderRadius: `${brand.borderRadius * 0.25}px`,
              fontSize: "0.65rem",
              fontFamily: brand.fonts.body,
              pointerEvents: "none",
              opacity: 0.8,
            }}
          >
            Use ← → arrow keys to navigate
          </Box>
        </Fade>
      )}
    </>
  );
}
