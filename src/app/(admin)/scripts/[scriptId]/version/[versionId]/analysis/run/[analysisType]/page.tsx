"use client";

import RunAnalalysisPage from "@/components/analysisDetails/runAnalysis/StreamingAnalysisView";
import { StreamingProvider } from "@/providers/StreamingProvider";
export default function RunAnalalysis() {
  return (
    <StreamingProvider>
      <RunAnalalysisPage />;
    </StreamingProvider>
  );
}
