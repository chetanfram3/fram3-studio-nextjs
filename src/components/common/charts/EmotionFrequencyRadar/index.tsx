"use client";

import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import type { Scene } from "@/types/overview/emotionTypes";
import {
  extractEmotionFrequencies,
  prepareChartData,
} from "./utils/dataTransformers";
import { useChartConfig } from "./config/chartConfig";

// Register required Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface EmotionFrequencyRadarProps {
  scenes: Scene[];
}

/**
 * EmotionFrequencyRadar - Optimized radar chart component
 *
 * Performance optimizations:
 * - Theme-aware styling (no hardcoded colors)
 * - React 19 compiler optimizations
 * - Strategic memoization for expensive computations
 * - Brand fonts integration
 */
export function EmotionFrequencyRadar({ scenes }: EmotionFrequencyRadarProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // CHART CONFIGURATION
  // ==========================================
  const { options, colors } = useChartConfig();

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const frequencies = useMemo(
    () => extractEmotionFrequencies(scenes),
    [scenes]
  );

  const chartData = useMemo(
    () => prepareChartData(frequencies, colors),
    [frequencies, colors]
  );

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "primary.main",
        borderRadius: `${brand.borderRadius}px`,
        padding: 2,
        backgroundColor: "background.paper",
        width: "100%",
        height: 800,
      }}
    >
      <Box sx={{ width: "100%", height: 600 }}>
        <Typography
          variant="h5"
          gutterBottom
          align="center"
          sx={{
            color: "primary.main",
            fontFamily: brand.fonts.heading,
          }}
        >
          Emotion Frequency Distribution
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          gutterBottom
          sx={{
            fontFamily: brand.fonts.body,
          }}
        >
          Frequency of different emotions
        </Typography>
        <Radar data={chartData} options={options} />
      </Box>
    </Box>
  );
}

EmotionFrequencyRadar.displayName = "EmotionFrequencyRadar";
