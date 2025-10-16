// src/hooks/auth/useAuthRedirect.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from './useAuth';
import { useTokenClaims } from './useTokenClaims';
import { useAuthStore } from '@/store/authStore';
import logger from '@/utils/logger';

interface UseAuthRedirectOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  redirectIfAuthenticated?: string;
  checkOnboarding?: boolean;
  onboardingPath?: string;
}

/**
 * Hook to handle authentication-based redirects with token claims support
 */
export function useAuthRedirect(options?: UseAuthRedirectOptions) {
  const {
    requireAuth = false,
    redirectTo = '/signin',
    redirectIfAuthenticated = '/dashboard',
    checkOnboarding = false,
    onboardingPath = '/create-now',
  } = options || {};

  const { user, loading, initialized, profileLoaded } = useAuth();
  const { claims } = useAuthStore(); // 🆕 NEW: Get claims
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Automatically extract and store token claims
  useTokenClaims();

  useEffect(() => {
    // Wait for initialization
    if (!initialized || loading) {
      setIsRedirecting(false);
      return;
    }

    // Redirect unauthenticated users to sign in
    if (requireAuth && !user) {
      logger.debug('User not authenticated, redirecting to:', redirectTo);
      setIsRedirecting(true);
      const returnUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
      router.push(returnUrl);
      return;
    }

    // 🆕 NEW: Check for new user onboarding (HIGHEST PRIORITY for authenticated users)
    if (requireAuth && user && profileLoaded && checkOnboarding) {
      const isNewUser = claims?.isNewUser ?? false;
      const isOnOnboardingPage = pathname.startsWith(onboardingPath);

      if (isNewUser && !isOnOnboardingPage) {
        logger.debug('New user detected, redirecting to onboarding:', onboardingPath);
        setIsRedirecting(true);
        router.push(`${onboardingPath}?firstTime=true`);
        return;
      }
    }

    // Redirect authenticated users away from auth pages
    if (!requireAuth && user && profileLoaded) {
      logger.debug('User authenticated, redirecting from auth page');
      setIsRedirecting(true);
      const from = searchParams?.get('from') || searchParams?.get('returnUrl');
      const destination = from || redirectIfAuthenticated;
      logger.debug('Redirecting to:', destination);
      router.push(destination);
      return;
    }

    // No redirect needed
    setIsRedirecting(false);
  }, [
    user,
    loading,
    initialized,
    profileLoaded,
    claims,
    requireAuth,
    redirectTo,
    redirectIfAuthenticated,
    checkOnboarding,
    onboardingPath,
    pathname,
    searchParams,
    router,
  ]);

  return {
    isRedirecting,
    user,
    loading,
    initialized,
    profileLoaded,
  };
}