"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import type { EmotionData } from "@/types/overview/emotionTypes";
import { SentimentChart2D } from "@/components/common/charts/Sentiment2DChart";
import { EmotionFrequencyRadar } from "@/components/common/charts/EmotionFrequencyRadar";
import { SceneLevelPieChart } from "@/components/common/charts/SceneLevelPieChart";
import { SentimentChart3D } from "@/components/common/charts/Sentiment3DChart";

interface SentimentAnalysisProps {
  data?: EmotionData | null;
}

/**
 * SentimentAnalysis - Optimized sentiment analysis display component
 *
 * Performance optimizations:
 * - Theme-aware styling (no hardcoded colors)
 * - React 19 compiler optimizations
 * - Proper useCallback for event handlers
 * - Strategic dialog management
 */
export function SentimentAnalysis({ data }: SentimentAnalysisProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE
  // ==========================================
  const [dialogOpen, setDialogOpen] = useState(false);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  // ==========================================
  // EARLY RETURN
  // ==========================================
  if (!data?.scenes || data.scenes.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          No sentiment analysis data available
        </Typography>
      </Box>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <>
      <Box
        sx={{
          p: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{
              fontWeight: "medium",
              color: "text.primary",
              fontFamily: brand.fonts.heading,
            }}
          >
            Sentiment Analysis
          </Typography>
          <Button
            variant="text"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={handleOpenDialog}
            aria-label="View detailed sentiment analysis"
            sx={{
              color: "primary.main",
              fontFamily: brand.fonts.body,
              "&:hover": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
              },
            }}
          >
            Details
          </Button>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            position: "relative",
          }}
        >
          <SentimentChart2D scenes={data.scenes} />
        </Box>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.default",
            backgroundImage: "none !important",
            minHeight: "80vh",
            borderRadius: `${brand.borderRadius * 1.5}px`,
            border: 2,
            borderColor: "primary.main",
          },
        }}
        BackdropProps={{
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.8)",
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        >
          <Typography
            variant="h6"
            component="span"
            sx={{
              color: "text.primary",
              fontFamily: brand.fonts.heading,
            }}
          >
            Detailed Sentiment Analysis
          </Typography>
          <IconButton
            aria-label="close dialog"
            onClick={handleCloseDialog}
            sx={{
              color: "text.secondary",
              "&:hover": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 3,
            bgcolor: "background.default",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {/* 3D Sentiment Chart */}
            <Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: "primary.main",
                  fontFamily: brand.fonts.heading,
                }}
              >
                3D Emotion Distribution
              </Typography>
              <SentimentChart3D scenes={data.scenes} />
            </Box>

            {/* Emotion Frequency Radar */}
            <Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: "primary.main",
                  fontFamily: brand.fonts.heading,
                }}
              >
                Emotion Distribution
              </Typography>
              <EmotionFrequencyRadar scenes={data.scenes} />
            </Box>

            {/* Scene Level Pie Chart */}
            <Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: "primary.main",
                  fontFamily: brand.fonts.heading,
                }}
              >
                Scene Distribution
              </Typography>
              <SceneLevelPieChart scenes={data.scenes} />
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

SentimentAnalysis.displayName = "SentimentAnalysis";
