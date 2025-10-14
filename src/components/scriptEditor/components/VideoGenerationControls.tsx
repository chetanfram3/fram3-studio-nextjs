"use client";

import React, { useEffect, useRef } from "react";
import {
  Box,
  Button,
  Paper,
  useTheme,
  alpha,
  useMediaQuery,
} from "@mui/material";
import { VideoCameraFrontOutlined as VideoIcon } from "@mui/icons-material";
import ProcessingModeSelector, {
  ProcessingMode,
  AspectRatio,
  ModelTierConfig, 
} from "@/components/common/ProcessingModeSelector";

interface VideoGenerationControlsProps {
  processingMode: ProcessingMode;
  aspectRatio: AspectRatio;
  pauseBeforeSettings: string[];
  modelTiers: ModelTierConfig;
  onProcessingOptionsChange: (
    mode: ProcessingMode,
    ratio: AspectRatio,
    pauseBefore: string[],
    modelTiers: ModelTierConfig
  ) => void;
  onGenerateVideo: () => void;
  isSaving: boolean;
}

const VideoGenerationControls: React.FC<VideoGenerationControlsProps> = ({
  processingMode,
  aspectRatio,
  pauseBeforeSettings,
  modelTiers,
  onProcessingOptionsChange,
  onGenerateVideo,
  isSaving,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when content expands
  useEffect(() => {
    if (!containerRef.current) return;

    // Create a MutationObserver to detect DOM changes
    const observer = new MutationObserver((mutations) => {
      // Check if any mutation actually changed the height
      let heightChanged = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" || mutation.type === "childList") {
          heightChanged = true;
        }
      });

      if (heightChanged) {
        // Small delay to ensure DOM has updated
        setTimeout(() => {
          if (containerRef.current) {
            // Scroll the element into view smoothly
            containerRef.current.scrollIntoView({
              behavior: "smooth",
              block: "end",
              inline: "nearest",
            });
          }
        }, 100);
      }
    });

    // Observe changes to the container and its descendants
    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        mt: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          borderRadius: 1,
          background: theme.palette.background.default,
          border: 1,
          borderColor: theme.palette.secondary.light,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "flex-start" },
            gap: { xs: 2, sm: 2, md: 3 },
            maxWidth: "100%",
          }}
        >
          {/* Processing Mode Selector */}
          <Box
            sx={{
              flex: { xs: "1 1 auto", md: "1 1 70%" },
              minWidth: 0, // Prevents flex item from overflowing
            }}
          >
            <ProcessingModeSelector
              onChange={onProcessingOptionsChange}
              initialMode={processingMode}
              initialAspectRatio={aspectRatio}
              initialModelTiers={modelTiers}
              initialGenerateImages={true}
              initialGenerateAudio={true}
              initialGenerateVideo={true}
            />
          </Box>

          {/* Generate Video Button */}
          <Box
            sx={{
              flex: { xs: "0 0 auto", md: "0 0 auto" },
              display: "flex",
              justifyContent: { xs: "stretch", md: "flex-end" },
              alignItems: "flex-start",
              minWidth: { xs: "100%", md: "200px" },
            }}
          >
            <Button
              variant="contained"
              onClick={onGenerateVideo}
              disabled={isSaving}
              startIcon={<VideoIcon />}
              fullWidth={isMobile || isTablet}
              sx={{
                backgroundColor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
                py: { xs: 1.5, sm: 1.25 },
                px: { xs: 2, sm: 3 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
                fontWeight: 600,
                whiteSpace: "nowrap",
                boxShadow: 2,
                "&:hover": {
                  backgroundColor: theme.palette.secondary.dark,
                  boxShadow: 4,
                },
                "&:disabled": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.5),
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              Generate Video
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default VideoGenerationControls;
