// src/app/(protected)/dashboard/page.tsx
"use client";

import { AuthGuard } from "@/components/auth";
import StoryPage from "@/components/storyMain/page";

/**
 * Dashboard Page - My Library
 * Protected route - requires authentication
 * Displays user's script library with grid view and featured project
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
