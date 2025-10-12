"use client";

import { useMemo } from "react";
import { Box } from "@mui/material";
import Plotly from "plotly.js-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import type { Scene } from "@/types/overview/emotionTypes";

const Plot = createPlotlyComponent(Plotly);

interface SentimentChart2DProps {
  scenes: Scene[];
}

/**
 * SentimentChart2D - Optimized 2D sentiment chart component
 *
 * Performance optimizations:
 * - Theme-aware styling (no hardcoded colors)
 * - React 19 compiler optimizations
 * - Strategic memoization for expensive computations
 * - Brand fonts integration
 * - Memoized chart data and layout
 */
export function SentimentChart2D({ scenes }: SentimentChart2DProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const sceneData = useMemo(() => {
    const sceneIds: number[] = [];
    const valencePoints: number[] = [];
    const characterValencePoints: number[] = [];
    const musicValencePoints: number[] = [];
    const labels: string[] = [];

    scenes.forEach((scene) => {
      const storylineValences = scene.lines
        .filter((line) => line.sentimentAnalysis?.valence !== undefined)
        .map((line) => line.sentimentAnalysis.valence);

      const characterValences = scene.lines
        .filter((line) => line.characterSentiment?.valence !== undefined)
        .map((line) => line.characterSentiment.valence);

      const musicValences = scene.lines
        .filter((line) => line.musicSentiment?.valence !== undefined)
        .map((line) => line.musicSentiment.valence);

      const averageValence =
        storylineValences.length > 0
          ? storylineValences.reduce((sum, val) => sum + val, 0) /
            storylineValences.length
          : 0;

      const averageCharacterValence =
        characterValences.length > 0
          ? characterValences.reduce((sum, val) => sum + val, 0) /
            characterValences.length
          : 0;

      const averageMusicValence =
        musicValences.length > 0
          ? musicValences.reduce((sum, val) => sum + val, 0) /
            musicValences.length
          : 0;

      sceneIds.push(scene.sceneId);
      valencePoints.push(averageValence);
      characterValencePoints.push(averageCharacterValence);
      musicValencePoints.push(averageMusicValence);
      labels.push(
        `Scene ${scene.sceneId}<br>` +
          `Story: ${averageValence.toFixed(2)}<br>` +
          `Character: ${averageCharacterValence.toFixed(2)}<br>` +
          `Music: ${averageMusicValence.toFixed(2)}`
      );
    });

    return {
      sceneIds,
      valencePoints,
      characterValencePoints,
      musicValencePoints,
      labels,
    };
  }, [scenes]);

  const plotData = useMemo(
    () => [
      {
        type: "scatter" as const,
        mode: "lines+markers",
        x: sceneData.sceneIds,
        y: sceneData.valencePoints,
        marker: {
          size: 6,
          color: theme.palette.primary.main,
        },
        line: {
          color: theme.palette.primary.main,
          width: 2,
        },
        text: sceneData.labels,
        hoverinfo: "text",
        name: "Story",
      },
      {
        type: "scatter" as const,
        mode: "lines+markers",
        x: sceneData.sceneIds,
        y: sceneData.characterValencePoints,
        marker: {
          size: 6,
          color: theme.palette.info.main,
        },
        line: {
          color: theme.palette.info.main,
          width: 2,
        },
        name: "Character",
      },
      {
        type: "scatter" as const,
        mode: "lines+markers",
        x: sceneData.sceneIds,
        y: sceneData.musicValencePoints,
        marker: {
          size: 6,
          color: theme.palette.success.main,
        },
        line: {
          color: theme.palette.success.main,
          width: 2,
        },
        name: "Music",
      },
    ],
    [
      sceneData,
      theme.palette.primary.main,
      theme.palette.info.main,
      theme.palette.success.main,
    ]
  );

  const plotLayout = useMemo(
    () => ({
      autosize: true,
      margin: { l: 30, r: 10, t: 10, b: 40 },
      showlegend: true,
      legend: {
        orientation: "h" as const,
        yanchor: "bottom" as const,
        y: -0.2,
        xanchor: "center" as const,
        x: 0.5,
        font: {
          size: 9,
          family: brand.fonts.body,
          color: theme.palette.text.primary,
        },
      },
      xaxis: {
        title: "Scene",
        tickfont: {
          size: 9,
          family: brand.fonts.body,
          color: theme.palette.text.primary,
        },
        titlefont: {
          family: brand.fonts.body,
          color: theme.palette.text.primary,
        },
        showgrid: false,
        zeroline: false,
      },
      yaxis: {
        title: "Valence",
        range: [-10, 10] as [number, number],
        tickfont: {
          size: 9,
          family: brand.fonts.body,
          color: theme.palette.text.primary,
        },
        titlefont: {
          family: brand.fonts.body,
          color: theme.palette.text.primary,
        },
        showgrid: true,
        gridcolor: theme.palette.divider,
        zeroline: true,
        zerolinecolor: theme.palette.divider,
      },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: {
        size: 9,
        color: theme.palette.text.primary,
        family: brand.fonts.body,
      },
    }),
    [theme.palette.text.primary, theme.palette.divider, brand.fonts.body]
  );

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
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
        useResizeHandler={true}
      />
    </Box>
  );
}

SentimentChart2D.displayName = "SentimentChart2D";
