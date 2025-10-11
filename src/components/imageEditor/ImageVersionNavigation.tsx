"use client";

import { useState } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Fade,
  Chip,
} from "@mui/material";
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
} from "@mui/icons-material";
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
  // Local state to handle button hover independently
  const [buttonHover, setButtonHover] = useState({
    leftArrow: false,
    rightArrow: false,
  });

  const currentIndex = allVersions.findIndex(
    (v) => v.version === currentlyViewingVersion?.version
  );
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < allVersions.length - 1;
  const hasMultipleVersions = allVersions.length > 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onVersionSelect(allVersions[currentIndex - 1], "left-to-right", true);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onVersionSelect(allVersions[currentIndex + 1], "right-to-left", true);
    }
  };

  // Determine if controls should be visible
  const shouldShowLeftArrow =
    showOverlays || buttonHover.leftArrow || versionsMode || historyMode;
  const shouldShowRightArrow =
    showOverlays || buttonHover.rightArrow || versionsMode || historyMode;

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
              onMouseEnter={() =>
                setButtonHover((prev) => ({ ...prev, leftArrow: true }))
              }
              onMouseLeave={() =>
                setButtonHover((prev) => ({ ...prev, leftArrow: false }))
              }
            >
              <Tooltip title="Previous version">
                <span>
                  <IconButton
                    onClick={handlePrevious}
                    disabled={
                      !canGoPrevious || isEditing || isRestoring || isUpscaling
                    }
                    sx={{
                      bgcolor: "rgba(0,0,0,0.7)",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                      "&:disabled": { bgcolor: "rgba(0,0,0,0.3)" },
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
              onMouseEnter={() =>
                setButtonHover((prev) => ({ ...prev, rightArrow: true }))
              }
              onMouseLeave={() =>
                setButtonHover((prev) => ({ ...prev, rightArrow: false }))
              }
            >
              <Tooltip title="Next version">
                <span>
                  <IconButton
                    onClick={handleNext}
                    disabled={
                      !canGoNext || isEditing || isRestoring || isUpscaling
                    }
                    sx={{
                      bgcolor: "rgba(0,0,0,0.7)",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                      "&:disabled": { bgcolor: "rgba(0,0,0,0.3)" },
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
            color={currentlyViewingVersion.isCurrent ? "secondary" : "warning"}
            size="small"
            sx={{
              bgcolor: "secondary.dark",
              color: "secondary.contrastText",
            }}
          />
        </Box>
      )}
    </>
  );
}