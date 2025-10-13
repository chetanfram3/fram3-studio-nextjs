"use client";

import { Box } from "@mui/material";
import { BarChart } from "@mui/x-charts";
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";

interface MetricData {
  benchmark: number;
  user: number;
  suggestion?: string;
}

interface BenchmarkData {
  visualImpact?: MetricData;
  emotionalResonance?: MetricData;
  pacing?: MetricData;
  productPlacement?: MetricData;
}

interface BenchBarChartProps {
  data?: BenchmarkData;
}

export default function BenchBarChart({ data }: BenchBarChartProps) {
  const theme = useTheme();

  // Memoize benchmark data only when data changes
  const benchmarkData = useMemo(() => {
    if (!data) return [];

    const {
      visualImpact = { benchmark: 0, user: 0, suggestion: "" },
      emotionalResonance = { benchmark: 0, user: 0, suggestion: "" },
      pacing = { benchmark: 0, user: 0, suggestion: "" },
      productPlacement = { benchmark: 0, user: 0, suggestion: "" },
    } = data;

    return [
      {
        metric: "Visual Impact",
        benchmark: visualImpact.benchmark ?? 0,
        user: visualImpact.user ?? 0,
        suggestion: visualImpact.suggestion || "No suggestion available",
      },
      {
        metric: "Emotional Resonance",
        benchmark: emotionalResonance.benchmark ?? 0,
        user: emotionalResonance.user ?? 0,
        suggestion: emotionalResonance.suggestion || "No suggestion available",
      },
      {
        metric: "Pacing",
        benchmark: pacing.benchmark ?? 0,
        user: pacing.user ?? 0,
        suggestion: pacing.suggestion || "No suggestion available",
      },
      {
        metric: "Product Placement",
        benchmark: productPlacement.benchmark ?? 0,
        user: productPlacement.user ?? 0,
        suggestion: productPlacement.suggestion || "No suggestion available",
      },
    ];
  }, [data]);

  // Memoize series configuration - theme.palette references are stable
  const seriesConfig = useMemo(
    () => [
      {
        dataKey: "benchmark",
        label: "Benchmark",
        valueFormatter: (value: number | null) => `${value ?? 0}%`,
        color: theme.palette.primary.main,
      },
      {
        dataKey: "user",
        label: "Your Script",
        valueFormatter: (value: number | null) => `${value ?? 0}%`,
        color: theme.palette.text.secondary,
      },
      {
        dataKey: "userSuggestion",
        label: "Suggestion",
        valueFormatter: (_: number | null, context: { dataIndex?: number }) => {
          const dataIndex = context.dataIndex ?? 0;
          return benchmarkData[dataIndex]?.suggestion || "";
        },
        color: theme.palette.primary.dark,
      },
    ],
    [
      theme.palette.primary.main,
      theme.palette.primary.dark,
      theme.palette.text.secondary,
      benchmarkData,
    ]
  );

  if (!data) {
    return null;
  }

  return (
    <Box>
      <BarChart
        dataset={benchmarkData}
        layout="horizontal"
        series={seriesConfig}
        yAxis={[
          {
            scaleType: "band",
            dataKey: "metric",
          },
        ]}
        xAxis={[
          {
            min: 0,
            max: 100,
            tickNumber: 5,
            valueFormatter: (value: number) => `${value}%`,
          },
        ]}
        slotProps={{
          bar: {
            radius: 0,
          },
          legend: {
            position: {
              horizontal: "center",
              vertical: "bottom",
            },
          },
        }}
        height={350}
        sx={{
          "& .MuiChartsAxis-line": {
            stroke: theme.palette.divider,
          },
          "& .MuiChartsAxis-tick": {
            stroke: theme.palette.divider,
          },
          "& .MuiChartsAxis-label": {
            fill: theme.palette.text.secondary,
          },
        }}
      />
    </Box>
  );
}

BenchBarChart.displayName = "BenchBarChart";
