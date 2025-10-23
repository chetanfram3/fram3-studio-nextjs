"use client";

import { Suspense } from "react";
import { Box } from "@mui/material";
import { AnalysisList } from "./AnalysisList";
import { LoadingState } from "../shared";

interface ScriptAnalysisSectionProps {
  scriptId: string;
  versionId: string;
}

/**
 * ScriptAnalysisSection - Container for all analysis results
 * 
 * Uses Suspense for progressive loading
 */
export function ScriptAnalysisSection({
  scriptId,
  versionId,
}: ScriptAnalysisSectionProps) {
  return (
    <Box sx={{ mt: 2 }}>
      <Suspense fallback={<LoadingState message="Loading analyses..." />}>
        <AnalysisList scriptId={scriptId} versionId={versionId} />
      </Suspense>
    </Box>
  );
}