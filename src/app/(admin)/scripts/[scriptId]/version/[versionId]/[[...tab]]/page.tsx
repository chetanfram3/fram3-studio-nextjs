// src/app/(admin)/scripts/[scriptId]/version/[versionId]/[[...tab]]/page.tsx
"use client";

import ScriptDetailsPage from "@/components/analysisDetails/ScriptDetails";

/**
 * Story Page
 * Protected route - requires authentication
 * Displays user's script analysis as tabs
 */
export default function ScriptDetails() {
  return <ScriptDetailsPage />;
}
