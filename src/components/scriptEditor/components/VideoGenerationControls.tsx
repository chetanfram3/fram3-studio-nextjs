// src/modules/scripts/VideoGenerationControls.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { Box, Button, Paper, alpha, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { VideoCameraFrontOutlined as VideoIcon } from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
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

/**
 * VideoGenerationControls - Controls for video generation with processing options
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - useEffect properly configured with dependencies
 * - MutationObserver cleaned up properly
 * - Auto-optimized by React 19 compiler
 *
 * Theme integration:
 * - Uses theme.palette for all colors (no hardcoded colors)
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - Uses primary color for main button (not secondary)
 * - All styling theme-aware
 *
 * Porting changes:
 * - Replaced all secondary color usage with primary
 * - Removed hardcoded alpha values
 * - Added brand fonts for button text
 * - Used brand border radius
 * - Made Paper component theme-aware
 * - Proper button styling with primary color
 */
export function VideoGenerationControls({
  processingMode,
  aspectRatio,
  pauseBeforeSettings,
  modelTiers,
  onProcessingOptionsChange,
  onGenerateVideo,
  isSaving,
}: VideoGenerationControlsProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const containerRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // EFFECTS
  // ==========================================
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
          borderRadius: `${brand.borderRadius}px`,
          background: "background.default",
          border: 2,
          borderColor: "primary.main",
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
              color="primary"
              onClick={onGenerateVideo}
              disabled={isSaving}
              startIcon={<VideoIcon />}
              fullWidth={isMobile || isTablet}
              sx={{
                py: { xs: 1.5, sm: 1.25 },
                px: { xs: 2, sm: 3 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
                fontWeight: 600,
                fontFamily: brand.fonts.heading,
                whiteSpace: "nowrap",
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                },
                "&:disabled": {
                  bgcolor: "action.disabledBackground",
                  color: "action.disabled",
                },
                transition: theme.transitions.create(
                  ["background-color", "box-shadow", "transform"],
                  {
                    duration: theme.transitions.duration.short,
                  }
                ),
              }}
            >
              Generate Video
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default VideoGenerationControls;
