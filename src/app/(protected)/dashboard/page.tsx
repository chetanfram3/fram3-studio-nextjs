// src/app/(protected)/dashboard/page.tsx
"use client";

import MyLibrary from "@/components/analysisLibrary/MyLibrary";

/**
 * Dashboard Page - My Library
 * Protected route - requires authentication
 * Displays user's script library with grid view and featured project
 */
export default function DashboardPage() {
  return <MyLibrary />;
}
