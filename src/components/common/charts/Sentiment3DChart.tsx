"use client";

import { useMemo, useCallback } from "react";
import logger from "@/utils/logger";
import { Box } from "@mui/material";
import Plotly from "plotly.js-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import type { Scene } from "@/types/overview/emotionTypes";
import { calculateTimePoints } from "@/utils/timeCalculator";
import type { Data } from "plotly.js";

const Plot = createPlotlyComponent(Plotly);

type CustomLine = {
  color: number[] | string;
  colorscale: string;
  width: number;
};

type CustomData = Data & {
  line?: Partial<CustomLine>;
};

interface SentimentChart3DProps {
  scenes: Scene[];
}

/**
 * SentimentChart3D - Optimized 3D sentiment chart component
 *
 * Performance optimizations:
 * - Theme-aware styling (no hardcoded colors)
 * - React 19 compiler optimizations
 * - Strategic memoization for expensive computations
 * - Brand fonts integration
 * - Memoized chart data and layout
 */
export function SentimentChart3D({ scenes }: SentimentChart3DProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();
  const isDebug = false;

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================
  const calculateAspectRatio = useCallback(
    (
      data: Data[]
    ): {
      x: number;
      y: number;
      z: number;
    } => {
      let xRange: [number, number] = [Infinity, -Infinity];
      let yRange: [number, number] = [Infinity, -Infinity];
      let zRange: [number, number] = [Infinity, -Infinity];

      data.forEach((trace) => {
        if ("x" in trace && Array.isArray(trace.x)) {
          xRange = [
            Math.min(xRange[0], ...(trace.x as number[])),
            Math.max(xRange[1], ...(trace.x as number[])),
          ];
        }
        if ("y" in trace && Array.isArray(trace.y)) {
          yRange = [
            Math.min(yRange[0], ...(trace.y as number[])),
            Math.max(yRange[1], ...(trace.y as number[])),
          ];
        }
        if ("z" in trace && Array.isArray(trace.z)) {
          zRange = [
            Math.min(zRange[0], ...(trace.z as number[])),
            Math.max(zRange[1], ...(trace.z as number[])),
          ];
        }
      });

      const xLength = xRange[1] - xRange[0];
      const yLength = yRange[1] - yRange[0];
      const zLength = zRange[1] - zRange[0];

      const maxLength = Math.max(xLength, yLength, zLength);
      return {
        x: xLength / maxLength,
        y: yLength / maxLength,
        z: zLength / maxLength,
      };
    },
    []
  );

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const sceneData = useMemo(() => {
    const valencePoints: number[] = [];
    const arousalPoints: number[] = [];
    const characterValence: number[] = [];
    const characterArousal: number[] = [];
    const musicValence: number[] = [];
    const musicArousal: number[] = [];
    const sceneLabels: string[] = [];
    const characterLabels: string[] = [];
    const musicLabels: string[] = [];

    const { timePoints, sceneBoundaries, sceneEndBoundaries } =
      calculateTimePoints(scenes);

    const formatValue = (value: number) => value.toFixed(2);
    const wrapText = (text: string | null | undefined, maxLength: number) => {
      if (!text) return "";

      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      words.forEach((word) => {
        if ((currentLine + word).length > maxLength) {
          lines.push(currentLine.trim());
          currentLine = "";
        }
        currentLine += word + " ";
      });
      lines.push(currentLine.trim());

      return lines.join("<br>");
    };

    scenes.forEach((scene) =>
      scene.lines.forEach((line) => {
        const storylineValence = line.sentimentAnalysis?.valence ?? 0;
        const storylineArousal = line.sentimentAnalysis?.arousal ?? 0;
        const characterValenceVal = line.characterSentiment?.valence ?? 0;
        const characterArousalVal = line.characterSentiment?.arousal ?? 0;
        const musicValenceVal = line.musicSentiment?.valence ?? 0;
        const musicArousalVal = line.musicSentiment?.arousal ?? 0;

        valencePoints.push(storylineValence);
        arousalPoints.push(storylineArousal);
        characterValence.push(characterValenceVal);
        characterArousal.push(characterArousalVal);
        musicValence.push(musicValenceVal);
        musicArousal.push(musicArousalVal);

        const baseLabel = `Scene ${scene.sceneId}, Line ${
          line.lineId
        }<br>${wrapText(line.content || "", 40)}`;

        sceneLabels.push(
          `${baseLabel}<br>` +
            `Overall: V:${formatValue(storylineValence)}, ` +
            `A:${formatValue(storylineArousal)}`
        );

        characterLabels.push(
          `${baseLabel}<br>` +
            `Character: V:${formatValue(characterValenceVal)}, ` +
            `A:${formatValue(characterArousalVal)}`
        );

        musicLabels.push(
          `${baseLabel}<br>` +
            `Music: V:${formatValue(musicValenceVal)}, ` +
            `A:${formatValue(musicArousalVal)}`
        );
      })
    );

    const sceneDurations = scenes.map(
      (scene) =>
        `Scene ${scene.sceneId}<br>Duration: ${scene.sceneDuration} seconds`
    );

    return {
      timePoints,
      valencePoints,
      arousalPoints,
      characterValence,
      characterArousal,
      musicValence,
      musicArousal,
      sceneLabels,
      characterLabels,
      musicLabels,
      sceneBoundaries,
      sceneEndBoundaries,
      sceneDurations,
    };
  }, [scenes]);

  const chartData = useMemo((): CustomData[] => {
    const {
      timePoints,
      valencePoints,
      arousalPoints,
      characterValence,
      characterArousal,
      musicValence,
      musicArousal,
      sceneLabels,
      characterLabels,
      musicLabels,
      sceneEndBoundaries,
      sceneDurations,
    } = sceneData;

    return [
      {
        type: "scatter3d",
        mode: "lines+markers",
        x: timePoints,
        y: valencePoints,
        z: arousalPoints,
        line: {
          color: timePoints,
          colorscale: "Viridis",
          width: 6,
        },
        marker: {
          size: timePoints.map((_, i) =>
            sceneEndBoundaries.includes(timePoints[i]) ? 6 : 4
          ),
          color: timePoints,
          colorscale: "Viridis",
          opacity: 0.8,
        },
        text: sceneLabels,
        hoverinfo: "text",
        name: "Scene Sentiment",
      },
      {
        type: "scatter3d",
        mode: "lines+markers",
        x: timePoints,
        y: characterValence,
        z: characterArousal,
        line: {
          color: timePoints,
          colorscale: "Turbo",
          width: 6,
        },
        marker: {
          size: timePoints.map((_, i) =>
            sceneEndBoundaries.includes(timePoints[i]) ? 6 : 4
          ),
          color: timePoints,
          colorscale: "Turbo",
          opacity: 0.8,
        },
        text: characterLabels,
        hoverinfo: "text",
        name: "Character Sentiment",
      },
      {
        type: "scatter3d",
        mode: "lines+markers",
        x: timePoints,
        y: musicValence,
        z: musicArousal,
        line: {
          color: timePoints,
          colorscale: "Cividis",
          width: 6,
        },
        marker: {
          size: timePoints.map((_, i) =>
            sceneEndBoundaries.includes(timePoints[i]) ? 6 : 4
          ),
          color: timePoints,
          colorscale: "Cividis",
          opacity: 0.8,
        },
        text: musicLabels,
        hoverinfo: "text",
        name: "Music Sentiment",
      },
      {
        type: "scatter3d",
        mode: "lines",
        x: sceneEndBoundaries.flatMap((boundary) => [
          boundary,
          boundary,
          boundary,
          boundary,
          null,
        ]),
        y: sceneEndBoundaries.flatMap(() => [-10, -10, 10, 10, null]),
        z: sceneEndBoundaries.flatMap(() => [-10, 10, 10, -10, null]),
        text: sceneEndBoundaries.flatMap((_, i) => [
          sceneDurations[i],
          sceneDurations[i],
          sceneDurations[i],
          sceneDurations[i],
          null,
        ]) as any,
        line: {
          color: theme.palette.primary.main,
          width: 3,
          dash: "dot",
        },
        hoverinfo: "text",
        name: "Scene End Boundaries",
        showlegend: true,
      },
    ];
  }, [sceneData, theme.palette.primary.main]);

  const aspectRatio = useMemo(() => {
    return calculateAspectRatio(chartData);
  }, [chartData, calculateAspectRatio]);

  const plotLayout = useMemo(
    () => ({
      title: {
        text: "3D Sentiment Analysis",
        x: 0.5,
        xanchor: "center" as const,
        font: {
          size: 18,
          color: theme.palette.text.primary,
          family: brand.fonts.heading,
        },
      },
      autosize: true,
      margin: { l: 0, r: 0, b: 0, t: 30 },
      showlegend: true,
      legend: {
        font: {
          family: brand.fonts.body,
          size: 14,
          color: theme.palette.text.primary,
        },
        bgcolor: theme.palette.background.paper,
        bordercolor: theme.palette.divider,
        borderwidth: 1,
        x: 1.0,
        y: 1.0,
        xanchor: "right" as const,
        yanchor: "top" as const,
      },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      scene: {
        xaxis: {
          title: "Time (seconds)",
          gridcolor: theme.palette.divider,
          zerolinecolor: theme.palette.divider,
          autorange: "reversed" as const,
          tickfont: {
            color: theme.palette.text.primary,
            family: brand.fonts.body,
          },
          titlefont: {
            color: theme.palette.text.primary,
            family: brand.fonts.body,
          },
        },
        yaxis: {
          title: "Positivity/Negativity",
          range: [-10, 10] as [number, number],
          gridcolor: theme.palette.divider,
          zerolinecolor: theme.palette.divider,
          tickfont: {
            color: theme.palette.text.primary,
            family: brand.fonts.body,
          },
          titlefont: {
            color: theme.palette.text.primary,
            family: brand.fonts.body,
          },
        },
        zaxis: {
          title: "Intensity",
          range: [-10, 10] as [number, number],
          gridcolor: theme.palette.divider,
          zerolinecolor: theme.palette.divider,
          tickfont: {
            color: theme.palette.text.primary,
            family: brand.fonts.body,
          },
          titlefont: {
            color: theme.palette.text.primary,
            family: brand.fonts.body,
          },
        },
        camera: {
          eye: {
            x: 0.39898533651829043,
            y: 1.3171993608560606,
            z: 0.31448302078678875,
          },
          up: { x: 0, y: 0, z: 1 },
          center: { x: 0, y: 0, z: 0 },
        },
        aspectratio: aspectRatio,
        bgcolor: "transparent",
      },
    }),
    [
      theme.palette.text.primary,
      theme.palette.background.paper,
      theme.palette.divider,
      brand.fonts.heading,
      brand.fonts.body,
      aspectRatio,
    ]
  );

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const handleRelayout = useCallback(
    (e: any) => {
      if (isDebug && e["scene.camera"]) {
        logger.debug("Camera Position:", e["scene.camera"]);
      }
    },
    [isDebug]
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
        padding: 1,
        backgroundColor: "background.paper",
        width: "100%",
        height: "90vh",
      }}
    >
      <Plot
        data={chartData as Data[]}
        layout={plotLayout}
        style={{ width: "100%", height: "100%" }}
        config={{
          responsive: true,
          displayModeBar: false,
          modeBarButtonsToRemove: [],
        }}
        onRelayout={handleRelayout}
      />
    </Box>
  );
}

SentimentChart3D.displayName = "SentimentChart3D";
