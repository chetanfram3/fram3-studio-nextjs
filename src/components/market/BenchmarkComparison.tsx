"use client";

import { Box, Typography, Link } from "@mui/material";
import { Launch as LaunchIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";
import type { BenchmarkComparison } from "@/types/market/types";
import BenchBarChart from "./BarChartBenchmark";

interface BenchmarkComparisonProps {
  benchmarkComparison?: BenchmarkComparison;
}

export function BenchmarkComparison({
  benchmarkComparison,
}: BenchmarkComparisonProps) {
  const theme = useTheme();

  // Memoize derived data to avoid recalculations
  const {
    benchData,
    userScriptTitle,
    userBrandArchetype,
    benchmarkScript,
    comparativeAnalysis,
  } = useMemo(() => {
    if (!benchmarkComparison) {
      return {
        benchData: null,
        userScriptTitle: null,
        userBrandArchetype: null,
        benchmarkScript: null,
        comparativeAnalysis: null,
      };
    }

    const data = benchmarkComparison.benchmarkComparison;
    return {
      benchData: data,
      userScriptTitle: benchmarkComparison.userScriptTitle,
      userBrandArchetype: benchmarkComparison.userBrandArchetype,
      benchmarkScript: data?.benchmarkScript,
      comparativeAnalysis: data?.userScriptComparison?.comparativeAnalysis,
    };
  }, [benchmarkComparison]);

  // Early return if no data available
  if (!benchmarkComparison) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.primary">
          No benchmark comparison data available
        </Typography>
      </Box>
    );
  }

  // Early return if essential data is missing
  if (!benchData?.benchmarkScript) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.primary">
          Benchmark script data not available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: theme.shape.borderRadius,
        bgcolor: "background.default",
        border: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h5" color="text.primary">
          Benchmark Comparison
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Benchmark
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {benchmarkScript?.title || "Title not available"}
            </Typography>
          </Box>
          {benchmarkScript?.videoLink && (
            <Link
              href={benchmarkScript.videoLink}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "primary.main",
                textDecoration: "none",
                "&:hover": {
                  color: "primary.dark",
                  textDecoration: "underline",
                },
              }}
            >
              <LaunchIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">Watch Video</Typography>
            </Link>
          )}
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            User Script
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userScriptTitle || "Title not available"}{" "}
            {userBrandArchetype ? `(${userBrandArchetype})` : ""}
          </Typography>
        </Box>
      </Box>

      {comparativeAnalysis ? (
        <BenchBarChart data={comparativeAnalysis} />
      ) : (
        <Box sx={{ p: 2 }}>
          <Typography color="text.secondary">
            Comparative analysis data not available
          </Typography>
        </Box>
      )}
    </Box>
  );
}

BenchmarkComparison.displayName = "BenchmarkComparison";
