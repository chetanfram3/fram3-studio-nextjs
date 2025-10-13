"use client";

import { Box, Typography } from "@mui/material";
import { Video, ImageIcon } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useMemo, useCallback } from "react";
import type { ScriptInfo } from "@/types/storyMain/types";
import { AnalysisInProgress } from "@/components/common/AnalysisInProgress";
import StandaloneFeedbackPanel from "@/components/common/FeedbackSystem";

interface VideoEditorProps {
  scriptId: string;
  versionId: string;
  scriptInfo: ScriptInfo;
}

export default function VideoEditor({
  scriptId,
  versionId,
  scriptInfo,
}: VideoEditorProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Memoize completion status checks
  const { isVideoEditorCompleted, isVideoProcessorCompleted } = useMemo(() => {
    return {
      isVideoEditorCompleted:
        scriptInfo?.statuses?.videoEditor?.status === "Completed",
      isVideoProcessorCompleted:
        scriptInfo?.statuses?.videoProcessor?.status === "Completed",
    };
  }, [scriptInfo?.statuses]);

  // Memoize click handlers
  const handleAviaEditorClick = useCallback(() => {
    const aviaUrl = process.env.NEXT_PUBLIC_AVIA_URL;
    window.open(
      `${aviaUrl}/?scriptId=${scriptId}&versionId=${versionId}`,
      "_blank"
    );
  }, [scriptId, versionId]);

  const handleVideoEditorClick = useCallback(() => {
    const aviaUrl = process.env.NEXT_PUBLIC_AVIA_URL;
    window.open(
      `${aviaUrl}/?scriptId=${scriptId}&versionId=${versionId}&videoEditor=2`,
      "_blank"
    );
  }, [scriptId, versionId]);

  if (!isVideoEditorCompleted) {
    return (
      <AnalysisInProgress message="The video is still being processed. Please check back later." />
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "top",
        minHeight: "50vh",
        textAlign: "center",
        p: 4,
        backgroundColor: "action.hover",
        borderRadius: `${brand.borderRadius}px`,
        boxShadow: theme.shadows[2],
      }}
    >
      <Box
        component="img"
        src="https://storage.googleapis.com/fram3-ext/Web2/img/avia-poster.png"
        alt="Avia Editor"
        sx={{ width: 120, mb: 3, opacity: 0.9 }}
      />
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 600,
          fontFamily: brand.fonts.heading,
          color: "primary.main",
        }}
      >
        Continue Editing with Avia
      </Typography>
      <Typography
        variant="body1"
        sx={{
          mb: 4,
          maxWidth: 600,
          color: "text.secondary",
        }}
      >
        Our advanced AI editor provides powerful editing experiences for your
        script. Choose your preferred editing mode below.
      </Typography>

      {/* Editor Buttons Container */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 3,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Avia Editor Button */}
        <Box
          component="button"
          onClick={handleAviaEditorClick}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            py: 1.5,
            px: 4,
            border: "none",
            borderRadius: `${brand.borderRadius}px`,
            backgroundColor: "primary.main",
            color: "primary.contrastText",
            fontSize: "1rem",
            fontWeight: 500,
            fontFamily: brand.fonts.body,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: theme.shadows[4],
            minWidth: "200px",
            "&:hover": {
              backgroundColor: "primary.dark",
              transform: "translateY(-2px)",
              boxShadow: theme.shadows[8],
            },
            "&:active": {
              transform: "translateY(0)",
              boxShadow: theme.shadows[2],
            },
          }}
        >
          <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
            Still Editor
          </Box>
          <ImageIcon size={18} style={{ marginLeft: "4px" }} />
        </Box>

        {/* Video Editor Button */}
        <Box
          component="button"
          onClick={
            isVideoProcessorCompleted ? handleVideoEditorClick : undefined
          }
          disabled={!isVideoProcessorCompleted}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            py: 1.5,
            px: 4,
            border: "none",
            borderRadius: `${brand.borderRadius}px`,
            backgroundColor: isVideoProcessorCompleted
              ? "primary.dark"
              : "action.disabledBackground",
            color: isVideoProcessorCompleted
              ? "primary.contrastText"
              : "action.disabled",
            fontSize: "1rem",
            fontWeight: 500,
            fontFamily: brand.fonts.body,
            cursor: isVideoProcessorCompleted ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            boxShadow: isVideoProcessorCompleted ? theme.shadows[4] : "none",
            minWidth: "200px",
            opacity: isVideoProcessorCompleted ? 1 : 0.6,
            "&:hover": isVideoProcessorCompleted
              ? {
                  backgroundColor: "primary.main",
                  transform: "translateY(-2px)",
                  boxShadow: theme.shadows[8],
                }
              : {},
            "&:active": isVideoProcessorCompleted
              ? {
                  transform: "translateY(0)",
                  boxShadow: theme.shadows[2],
                }
              : {},
          }}
        >
          <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
            Video Editor
          </Box>
          <Video size={18} style={{ marginLeft: "4px" }} />
        </Box>
      </Box>

      {/* Video Processing Status Message */}
      {!isVideoProcessorCompleted && (
        <Box sx={{ mt: 3, maxWidth: 500 }}>
          <Typography
            variant="body2"
            sx={{
              color: "primary.contrastText",
              backgroundColor: "primary.main",
              p: 2,
              borderRadius: `${brand.borderRadius * 0.5}px`,
              border: 1,
              borderColor: "primary.dark",
              fontWeight: 500,
            }}
          >
            <strong>Video Editor unavailable:</strong> Run the video processing
            pipeline first to access the Video Editor with generated videos and
            lip-sync capabilities.
          </Typography>
        </Box>
      )}

      {/* Editor Descriptions */}
      <Box
        sx={{
          mt: 4,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          maxWidth: 800,
          width: "100%",
        }}
      >
        <Box
          sx={{
            flex: 1,
            p: 3,
            backgroundColor: "background.paper",
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontFamily: brand.fonts.heading,
              color: "text.primary",
              mb: 1,
            }}
          >
            AVIA Still Editor
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Standard editing experience with images, audio, and timeline
            controls. Perfect for quick edits and content refinement.
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            p: 3,
            backgroundColor: isVideoProcessorCompleted
              ? "action.selected"
              : "background.paper",
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: isVideoProcessorCompleted ? "primary.main" : "divider",
            opacity: isVideoProcessorCompleted ? 1 : 0.6,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontFamily: brand.fonts.heading,
              color: "text.primary",
              mb: 1,
            }}
          >
            AVIA Video Editor
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Advanced editing with generated videos, lip-sync capabilities, and
            enhanced visual effects. Requires video processing pipeline
            completion.
          </Typography>
        </Box>
      </Box>

      {/* Feedback Component */}
      {scriptId && versionId && (
        <Box sx={{ mt: 4 }}>
          <StandaloneFeedbackPanel
            page="editor"
            scriptId={scriptId}
            versionId={versionId}
          />
        </Box>
      )}
    </Box>
  );
}

VideoEditor.displayName = "VideoEditor";
