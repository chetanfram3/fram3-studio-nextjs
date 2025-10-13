"use client";

import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import { MetricsCards } from "./MetricsCards";
import { BrandCompetitor } from "./BrandCompetitor";
import { ScriptStructure } from "./ScriptStructure";
import { ScriptMetrics } from "./ScriptMetrics";
import { BenchmarkComparison } from "./BenchmarkComparison";
import { ScriptRating } from "./ScriptRating";
import { GroundingMetadata } from "./GroundingMetadata";
import { useScriptDashboardAnalysis } from "@/hooks/scripts/useScriptDashboardAnalysis";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";
import { AnalysisInProgress } from "@/components/common/AnalysisInProgress";
import StandaloneFeedbackPanel from "@/components/common/FeedbackSystem";
import type { MarketResearch as MarketResearchType } from "@/types/market/types";

interface MarketResearchProps {
  scriptId?: string;
  versionId?: string;
}

export default function MarketResearch({
  scriptId,
  versionId,
}: MarketResearchProps) {
  const {
    data: marketResearch,
    isLoading,
    error,
  } = useScriptDashboardAnalysis<MarketResearchType>(
    scriptId || "",
    versionId || "",
    "marketResearch"
  );

  // Memoize destructured data to avoid recalculation
  const {
    metrics,
    scriptMetrics,
    brandCompetitor,
    benchmarkComparison,
    scriptStructure,
    scriptRating,
    groundingMetadata,
    brandOverview,
    metricsScriptRating,
    targetAudience,
  } = useMemo(() => {
    if (!marketResearch) {
      return {
        metrics: undefined,
        scriptMetrics: undefined,
        brandCompetitor: undefined,
        benchmarkComparison: undefined,
        scriptStructure: undefined,
        scriptRating: undefined,
        groundingMetadata: undefined,
        brandOverview: undefined,
        metricsScriptRating: undefined,
        targetAudience: undefined,
      };
    }

    const {
      metrics: metricsData,
      scriptMetrics: scriptMetricsData,
      brandCompetitor: brandCompetitorData,
      benchmarkComparison: benchmarkComparisonData,
      scriptStructure: scriptStructureData,
      scriptRating: scriptRatingData,
      groundingMetadata: groundingMetadataData,
    } = marketResearch;

    return {
      metrics: metricsData,
      scriptMetrics: scriptMetricsData,
      brandCompetitor: brandCompetitorData,
      benchmarkComparison: benchmarkComparisonData,
      scriptStructure: scriptStructureData,
      scriptRating: scriptRatingData,
      groundingMetadata: groundingMetadataData,
      brandOverview: metricsData?.brandOverview,
      metricsScriptRating: metricsData?.scriptRating,
      targetAudience: metricsData?.targetAudience,
    };
  }, [marketResearch]);

  if (isLoading) {
    return (
      <LoadingAnimation message="Market Research analysis data is loading" />
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.primary">
          An error occurred while loading market research data
        </Typography>
      </Box>
    );
  }

  if (!marketResearch) {
    return (
      <AnalysisInProgress message="Market Research analysis is in progress. Please check back later" />
    );
  }

  return (
    <>
      <MetricsCards
        brandOverview={brandOverview}
        scriptRating={metricsScriptRating}
        targetAudience={targetAudience}
      />
      <Box
        sx={{
          display: "grid",
          gap: 4,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          mt: 4,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {brandCompetitor && <BrandCompetitor data={brandCompetitor} />}
          {scriptStructure && <ScriptStructure structure={scriptStructure} />}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {scriptMetrics && <ScriptMetrics scriptMetrics={scriptMetrics} />}
          {benchmarkComparison && (
            <BenchmarkComparison benchmarkComparison={benchmarkComparison} />
          )}
          {scriptRating && (
            <Box id="script-rating">
              <ScriptRating scriptRating={scriptRating} />
            </Box>
          )}
        </Box>
      </Box>

      {/* Grounding Metadata Section */}
      {groundingMetadata && (
        <Box sx={{ mt: 4 }}>
          <GroundingMetadata groundingMetadata={groundingMetadata} />
        </Box>
      )}

      {/* Feedback Component */}
      {scriptId && versionId && (
        <Box sx={{ mt: 4 }}>
          <StandaloneFeedbackPanel
            page="market"
            scriptId={scriptId}
            versionId={versionId}
          />
        </Box>
      )}
    </>
  );
}

MarketResearch.displayName = "MarketResearch";
