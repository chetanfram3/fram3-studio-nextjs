"use client";

import { useMemo } from "react";
import { Box } from "@mui/material";
import Plotly from "plotly.js-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import type { Scene } from "@/types/overview/emotionTypes";

const Plot = createPlotlyComponent(Plotly);

interface SceneLevelPieChartProps {
  scenes: Scene[];
}

interface ChartData {
  labels: string[];
  values: number[];
  hoverTexts: string[];
}

interface ColorScheme {
  colors: string[];
  hoverColors: string[];
}

/**
 * SceneLevelPieChart - Optimized pie chart component
 *
 * Performance optimizations:
 * - Theme-aware styling (no hardcoded colors)
 * - React 19 compiler optimizations
 * - Strategic memoization for expensive computations
 * - Brand fonts integration
 */
export function SceneLevelPieChart({ scenes }: SceneLevelPieChartProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const chartData = useMemo((): ChartData => {
    const labels: string[] = [];
    const values: number[] = [];
    const hoverTexts: string[] = [];

    scenes.forEach((scene) => {
      labels.push(`Scene ${scene.sceneId}`);
      values.push(scene.sceneDuration || 0);

      const duration = scene.sceneDuration || 0;
      const description =
        scene.sceneDescription?.slice(0, 100) || "No description";
      hoverTexts.push(
        `Scene ${scene.sceneId}<br>` +
          `Duration: ${duration}s<br>` +
          `Description: ${description}${description.length >= 100 ? "..." : ""}`
      );
    });

    return { labels, values, hoverTexts };
  }, [scenes]);

  const colorScheme = useMemo((): ColorScheme => {
    const pastelColors = [
      { main: theme.palette.pastel.pink, name: "pink" },
      { main: theme.palette.pastel.peach, name: "peach" },
      { main: theme.palette.pastel.mint, name: "mint" },
      { main: theme.palette.pastel.lavender, name: "lavender" },
      { main: theme.palette.pastel.lilac, name: "lilac" },
      { main: theme.palette.pastel.coral, name: "coral" },
      { main: theme.palette.pastel.sage, name: "sage" },
      { main: theme.palette.pastel.sky, name: "sky" },
    ];

    const count = chartData.labels.length;
    return {
      colors: Array.from(
        { length: count },
        (_, index) => pastelColors[index % pastelColors.length].main.main
      ),
      hoverColors: Array.from(
        { length: count },
        (_, index) => pastelColors[index % pastelColors.length].main.dark
      ),
    };
  }, [chartData.labels.length, theme.palette.pastel]);

  const plotData = useMemo(
    () => [
      {
        labels: chartData.labels,
        values: chartData.values,
        type: "pie" as const,
        textinfo: "label+percent",
        hovertext: chartData.hoverTexts,
        hoverinfo: "text",
        marker: {
          colors: colorScheme.colors,
          line: {
            color: theme.palette.background.paper,
            width: 2,
          },
        },
        hoverlabel: {
          bgcolor: colorScheme.hoverColors,
          font: {
            family: brand.fonts.body,
            size: 14,
            color: theme.palette.background.paper,
          },
        },
      },
    ],
    [chartData, colorScheme, theme.palette.background.paper, brand.fonts.body]
  );

  const plotLayout = useMemo(
    () => ({
      title: {
        text: "Scene Duration Distribution",
        x: 0.5,
        xanchor: "center" as const,
        font: {
          family: brand.fonts.heading,
          size: 24,
          color: theme.palette.text.primary,
        },
      },
      autosize: true,
      margin: { l: 50, r: 50, b: 50, t: 80 },
      showlegend: true,
      legend: {
        orientation: "v" as const,
        font: {
          family: brand.fonts.body,
          size: 12,
          color: theme.palette.text.primary,
        },
        bgcolor: "transparent",
      },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
    }),
    [theme.palette.text.primary, brand.fonts.heading, brand.fonts.body]
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
        height: 700,
      }}
    >
      <Plot
        data={plotData}
        layout={plotLayout}
        style={{ width: "100%", height: "100%" }}
        config={{
          responsive: true,
          displayModeBar: false,
        }}
      />
    </Box>
  );
}

SceneLevelPieChart.displayName = "SceneLevelPieChart";
