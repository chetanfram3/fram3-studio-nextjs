"use client";

import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts";
import { ModerationCategory } from "@/types/analysis";
import { formatModerationData } from "./chartUtils";

/**
 * ModerationChart - Displays moderation confidence scores over different categories
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - No manual useCallback/useMemo unless necessary
 *
 * Theme integration:
 * - Uses theme.palette.primary.main for chart color
 * - Respects light/dark mode automatically
 * - No hardcoded colors or spacing
 *
 * @param moderationCategories - Array of moderation categories with confidence scores
 */

interface ModerationChartProps {
  moderationCategories: ModerationCategory[];
}

export default function ModerationChart({
  moderationCategories,
}: ModerationChartProps) {
  const theme = useTheme();
  const { data, labels } = formatModerationData(moderationCategories);

  // If no significant data, show nothing (parent will handle empty state)
  if (data.length === 0) {
    return null;
  }

  return (
    <Box sx={{ width: "100%", height: 400 }}>
      <LineChart
        series={[
          {
            data,
            label: "Confidence Score (%)",
            area: true,
            showMark: true,
            color: theme.palette.primary.main, // Theme-aware primary color
            valueFormatter: (value: number | null) =>
              value !== null ? `${value.toFixed(1)}%` : "N/A",
          },
        ]}
        xAxis={[
          {
            scaleType: "band",
            data: labels,
            tickLabelStyle: {
              angle: 45,
              textAnchor: "start",
              fontSize: 12,
            },
          },
        ]}
        yAxis={[
          {
            min: 0,
            max: 100,
            valueFormatter: (value: number) => `${value}%`,
          },
        ]}
        height={400}
        margin={{ left: 70, bottom: 70, right: 30, top: 30 }}
        slotProps={{
          legend: {
            direction: "horizontal",
            position: { vertical: "top", horizontal: "center" },
          },
        }}
      />
    </Box>
  );
}
