// src/app/(protected)/story/[scriptId]/version/[versionId]/[[...tab]]/page.tsx
"use client";

import { AuthGuard } from "@/components/auth";
import StoryPage from "@/components/storyMain/page";

/**
 * Story Page
 * Protected route - requires authentication
 * Displays user's script analysis as tabs
 */
export default function DashboardPage() {
  return (
    <AuthGuard
      requireAuth={true}
      redirectTo="/signin"
      loadingText="Loading your library..."
    >
      <StoryPage />
    </AuthGuard>
  );
}
