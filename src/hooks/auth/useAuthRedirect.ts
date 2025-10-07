'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from './useAuth';
import logger from '@/utils/logger';

/**
 * Hook to handle authentication-based redirects
 */
export function useAuthRedirect(options?: {
  requireAuth?: boolean;
  redirectTo?: string;
  redirectIfAuthenticated?: string;
}) {
  const {
    requireAuth = false,
    redirectTo = '/signin',
    redirectIfAuthenticated = '/dashboard',
  } = options || {};

  const { user, loading, initialized, profileLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Wait for initialization
    if (!initialized || loading) {
      return;
    }

    // Redirect unauthenticated users to sign in
    if (requireAuth && !user) {
      logger.debug('User not authenticated, redirecting to:', redirectTo);
      const returnUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
      router.push(returnUrl);
      return;
    }

    // Redirect authenticated users away from auth pages
    if (!requireAuth && user && profileLoaded) {
      const from = searchParams?.get('from');
      const destination = from || redirectIfAuthenticated;
      logger.debug('User authenticated, redirecting to:', destination);
      router.push(destination);
    }
  }, [
    user,
    loading,
    initialized,
    profileLoaded,
    requireAuth,
    redirectTo,
    redirectIfAuthenticated,
    pathname,
    searchParams,
    router,
  ]);

  return {
    isRedirecting: (requireAuth && !user) || (!requireAuth && !!user && profileLoaded),
    user,
    loading,
  };
}

/**
 * Hook specifically for protected routes
 */
export function useProtectedRoute(redirectTo = '/signin') {
  return useAuthRedirect({
    requireAuth: true,
    redirectTo,
  });
}

/**
 * Hook specifically for auth pages (signin, register, etc.)
 */
export function useAuthPage(redirectIfAuthenticated = '/dashboard') {
  return useAuthRedirect({
    requireAuth: false,
    redirectIfAuthenticated,
  });
}