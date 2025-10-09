"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import logger from "@/utils/logger";

interface AuthRedirectProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * AuthRedirect - Lightweight component for public auth pages
 *
 * ONLY redirects if user is authenticated - does NOT interfere with auth flows
 * Use this for signin, register, forgot-password pages
 *
 * Unlike AuthGuard, this component:
 * - Does NOT use useAuth() hook (which sets up auth listeners)
 * - Does NOT show loading screens
 * - Does NOT block rendering
 * - Simply checks current auth state and redirects if needed
 */
export default function AuthRedirect({
  children,
  redirectTo = "/dashboard",
}: AuthRedirectProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // Only redirect if user is fully authenticated with profile loaded
    if (user) {
      logger.debug("User already authenticated, redirecting to:", redirectTo);
      router.push(redirectTo);
    }
  }, [user, redirectTo, router]);

  // Always render children immediately - no loading screens
  // This allows auth flows (like MFA) to work without interference
  return <>{children}</>;
}
