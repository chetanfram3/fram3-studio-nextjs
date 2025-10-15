'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { checkUserProfile } from '@/services/userService';
import logger from '@/utils/logger';

/**
 * Custom hook for reading authentication state
 * 
 * IMPORTANT: This hook NO LONGER creates Firebase listeners!
 * The AuthInitializer component in the root layout handles that.
 * This hook simply reads from the Zustand store.
 */
export function useAuth() {
  const { user, loading, error, profileLoaded } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Mark as initialized after first render
    // This ensures components wait for at least one render cycle
    setInitialized(true);
  }, []);

  return {
    user,
    loading,
    error,
    profileLoaded,
    initialized,
  };
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user } = useAuthStore();
  return !!user;
}

/**
 * Hook to get current user or null
 */
export function useCurrentUser() {
  const { user } = useAuthStore();
  return user;
}

/**
 * Hook to require authentication (redirect if not authenticated)
 */
export function useRequireAuth(redirectUrl = '/signin') {
  const { user, loading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized && !loading && !user) {
      setShouldRedirect(true);
    }
  }, [user, loading, initialized]);

  return {
    user,
    loading,
    shouldRedirect,
    redirectUrl,
  };
}