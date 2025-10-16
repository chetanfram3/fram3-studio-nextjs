// src/components/auth/AuthRedirect.tsx
"use client";

import { ReactNode } from "react";
import { useAuthRedirect } from "@/hooks/auth/useAuthRedirect";

interface AuthRedirectProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * AuthRedirect - Lightweight wrapper for public auth pages
 *
 * Redirects authenticated users away from auth pages (signin, register, etc.)
 * Uses useAuthRedirect hook for consistent redirect logic
 *
 * Unlike AuthGuard, this component:
 * - Does NOT show loading screens (renders children immediately)
 * - Does NOT block rendering (allows MFA flows to work)
 * - Just triggers redirect logic in the background
 */
export default function AuthRedirect({
  children,
  redirectTo = "/dashboard",
}: AuthRedirectProps) {
  // ✅ Use the hook - this is now the ONLY redirect logic
  useAuthRedirect({
    requireAuth: false,
    redirectIfAuthenticated: redirectTo,
  });

  // Always render children immediately - no loading screens
  // This allows auth flows (like MFA) to work without interference
  return <>{children}</>;
}
