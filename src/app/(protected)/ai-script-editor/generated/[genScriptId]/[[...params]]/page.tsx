"use client";

import { AuthGuard } from "@/components/auth";
import ScriptEditorPage from "@/components/scriptEditor/page";

/**
 * Ai Script Library Page
 * Protected route - requires authentication
 */
export default function ScriptEditor() {
  return (
    <AuthGuard
      requireAuth={true}
      redirectTo="/signin"
      loadingText="Loading Fram3 AI script generator..."
    >
      <ScriptEditorPage />
    </AuthGuard>
  );
}
