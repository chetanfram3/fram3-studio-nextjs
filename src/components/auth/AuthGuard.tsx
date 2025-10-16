"use client";

import { ReactNode } from "react";
import { useAuthRedirect } from "@/hooks/auth/useAuthRedirect";
import LoadingDots from "@/components/common/LoadingDots";

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  redirectIfAuthenticated?: string;
  loadingText?: string;
  checkOnboarding?: boolean;
  onboardingPath?: string;
}

/**
 * Authentication guard component
 * Protects routes and handles redirects based on auth state
 */
export default function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/signin",
  redirectIfAuthenticated = "/dashboard",
  loadingText,
  checkOnboarding = false,
  onboardingPath = "/create-now",
}: AuthGuardProps) {
  const { isRedirecting, loading } = useAuthRedirect({
    requireAuth,
    redirectTo,
    redirectIfAuthenticated,
    checkOnboarding,
    onboardingPath,
  });

  // Show loading state while checking auth or redirecting
  if (loading || isRedirecting) {
    const text =
      loadingText ||
      (requireAuth ? "Checking authentication..." : "Loading...");

    return <LoadingDots isLoading={true} text={text} />;
  }

  // Render children when auth state is resolved
  return <>{children}</>;
}
