"use client";

import { AuthGuard } from "@/components/auth";
import ScriptLibraryPage from "@/components/scriptLibrary";

/**
 * Payments Page
 * Protected route - requires authentication
 */
export default function ProfilePage() {
  return (
    <AuthGuard
      requireAuth={true}
      redirectTo="/signin"
      loadingText="Loading your script library..."
    >
      <ScriptLibraryPage />
    </AuthGuard>
  );
}
