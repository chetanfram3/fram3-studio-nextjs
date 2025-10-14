"use client";

import { AuthGuard } from "@/components/auth";
import { AnalysisPage } from "@/components/scriptAnalysis/AnalysisDialog";

/**
 * Ai Script Library Page
 * Protected route - requires authentication
 */
export default function ProfilePage() {
  return (
    <AuthGuard
      requireAuth={true}
      redirectTo="/signin"
      loadingText="Loading your script library..."
    >
      <AnalysisPage />
    </AuthGuard>
  );
}
