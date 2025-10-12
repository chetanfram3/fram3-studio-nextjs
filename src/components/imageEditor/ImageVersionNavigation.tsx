"use client";

// ImageVersionNavigation.tsx - Fully theme-compliant and performance-optimized
import { useState, useMemo, useCallback } from "react";
import { Box, IconButton, Tooltip, Fade, Chip } from "@mui/material";
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { ImageVersion } from "@/types/storyBoard/types";

interface ImageVersionNavigationProps {
  allVersions: ImageVersion[];
  currentlyViewingVersion: ImageVersion | undefined;
  showOverlays: boolean;
  versionsMode: boolean;
  historyMode: boolean;
  isEditing: boolean;
  isRestoring: boolean;
  isUpscaling: boolean;
  onVersionSelect: (
    version: ImageVersion,
    direction: "left-to-right" | "right-to-left",
    skipThumbnail: boolean
  ) => void;
}

export function ImageVersionNavigation({
  allVersions,
  currentlyViewingVersion,
  showOverlays,
  versionsMode,
  historyMode,
  isEditing,
  isRestoring,
  isUpscaling,
  onVersionSelect,
}: ImageVersionNavigationProps) {
  // Theme and brand
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Local state for button hover
  const [buttonHover, setButtonHover] = useState({
    leftArrow: false,
    rightArrow: false,
  });

  // Memoize navigation calculations
  const navigationState = useMemo(() => {
    const currentIndex = allVersions.findIndex(
      (v) => v.version === currentlyViewingVersion?.version
    );
    return {
      currentIndex,
      canGoPrevious: currentIndex > 0,
      canGoNext: currentIndex < allVersions.length - 1,
      hasMultipleVersions: allVersions.length > 1,
    };
  }, [allVersions, currentlyViewingVersion?.version]);

  // Memoize visibility state
  const visibilityState = useMemo(
    () => ({
      shouldShowLeftArrow:
        showOverlays || buttonHover.leftArrow || versionsMode || historyMode,
      shouldShowRightArrow:
        showOverlays || buttonHover.rightArrow || versionsMode || historyMode,
    }),
    [showOverlays, buttonHover, versionsMode, historyMode]
  );

  // Memoize disabled state
  const isDisabled = useMemo(
    () => isEditing || isRestoring || isUpscaling,
    [isEditing, isRestoring, isUpscaling]
  );

  // Callbacks for navigation
  const handlePrevious = useCallback(() => {
    if (navigationState.canGoPrevious) {
      onVersionSelect(
        allVersions[navigationState.currentIndex - 1],
        "left-to-right",
        true
      );
    }
  }, [navigationState, allVersions, onVersionSelect]);

  const handleNext = useCallback(() => {
    if (navigationState.canGoNext) {
      onVersionSelect(
        allVersions[navigationState.currentIndex + 1],
        "right-to-left",
        true
      );
    }
  }, [navigationState, allVersions, onVersionSelect]);

  // Hover handlers
  const handleLeftHoverEnter = useCallback(() => {
    setButtonHover((prev) => ({ ...prev, leftArrow: true }));
  }, []);

  const handleLeftHoverLeave = useCallback(() => {
    setButtonHover((prev) => ({ ...prev, leftArrow: false }));
  }, []);

  const handleRightHoverEnter = useCallback(() => {
    setButtonHover((prev) => ({ ...prev, rightArrow: true }));
  }, []);

  const handleRightHoverLeave = useCallback(() => {
    setButtonHover((prev) => ({ ...prev, rightArrow: false }));
  }, []);

  return (
    <>
      {/* Version Navigation Arrows */}
      {navigationState.hasMultipleVersions && (
        <>
          <Fade
            in={visibilityState.shouldShowLeftArrow}
            timeout={{ enter: 200, exit: 500 }}
          >
            <Box
              sx={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
              onMouseEnter={handleLeftHoverEnter}
              onMouseLeave={handleLeftHoverLeave}
            >
              <Tooltip title="Previous version">
                <span>
                  <IconButton
                    onClick={handlePrevious}
                    disabled={!navigationState.canGoPrevious || isDisabled}
                    color="primary"
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      backdropFilter: "blur(10px)",
                      boxShadow: theme.shadows[4],
                      "&:hover": {
                        bgcolor: theme.palette.background.paper,
                        transform: "scale(1.1)",
                      },
                      "&:disabled": {
                        bgcolor: theme.palette.action.disabledBackground,
                        color: theme.palette.action.disabled,
                      },
                    }}
                  >
                    <PrevIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Fade>

          <Fade
            in={visibilityState.shouldShowRightArrow}
            timeout={{ enter: 200, exit: 500 }}
          >
            <Box
              sx={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
              onMouseEnter={handleRightHoverEnter}
              onMouseLeave={handleRightHoverLeave}
            >
              <Tooltip title="Next version">
                <span>
                  <IconButton
                    onClick={handleNext}
                    disabled={!navigationState.canGoNext || isDisabled}
                    color="primary"
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      backdropFilter: "blur(10px)",
                      boxShadow: theme.shadows[4],
                      "&:hover": {
                        bgcolor: theme.palette.background.paper,
                        transform: "scale(1.1)",
                      },
                      "&:disabled": {
                        bgcolor: theme.palette.action.disabledBackground,
                        color: theme.palette.action.disabled,
                      },
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

      {/* Version Indicator - Always visible when there's a version */}
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
            }`}
            color="primary"
            size="small"
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              fontFamily: brand.fonts.body,
              fontWeight: 600,
              ...(currentlyViewingVersion.isCurrent && {
                bgcolor: theme.palette.primary.main,
                color: theme.palette.getContrastText(
                  theme.palette.primary.main
                ),
              }),
              ...(!currentlyViewingVersion.isCurrent && {
                bgcolor: theme.palette.warning.main,
                color: theme.palette.getContrastText(
                  theme.palette.warning.main
                ),
              }),
            }}
          />
        </Box>
      )}
    </>
  );
}
