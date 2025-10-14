"use client";

import { AuthGuard } from "@/components/auth";
import ScriptGeneratorPage from "@/components/aiScriptGen/AdScriptGenerator";

/**
 * Ai Script Library Page
 * Protected route - requires authentication
 */
export default function ProfilePage() {
  return (
    <AuthGuard
      requireAuth={true}
      redirectTo="/signin"
      loadingText="Loading Fram3 AI script generator..."
    >
      <ScriptGeneratorPage />
    </AuthGuard>
  );
}
