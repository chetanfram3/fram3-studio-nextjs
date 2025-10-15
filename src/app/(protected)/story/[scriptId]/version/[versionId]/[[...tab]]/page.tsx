// src/app/(protected)/story/[scriptId]/version/[versionId]/[[...tab]]/page.tsx
"use client";

import StoryPage from "@/components/storyMain/page";

/**
 * Story Page
 * Protected route - requires authentication
 * Displays user's script analysis as tabs
 */
export default function DashboardPage() {
  return <StoryPage />;
}
