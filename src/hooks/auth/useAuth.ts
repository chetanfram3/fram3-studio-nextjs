'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { checkUserProfile } from '@/services/userService';
import { deleteFCMToken } from '@/services/fcmService';
import logger from '@/utils/logger';

/**
 * Custom hook for managing authentication state
 * Listens to Firebase auth changes and updates store
 * Checks backend profile existence
 */
export function useAuth() {
  const {
    user,
    loading,
    error,
    profileLoaded,
    setUser,
    setLoading,
    setProfileLoaded,
    setError
  } = useAuthStore();

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    logger.debug('Setting up auth state listener');

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
        try {
          logger.debug('Auth state changed:', firebaseUser?.email || 'null');

          setUser(firebaseUser);

          if (firebaseUser) {
            // User is signed in
            logger.debug('User authenticated, checking profile...');

            try {
              // Get fresh token
              const idToken = await firebaseUser.getIdToken(true);

              // Check if profile exists in backend
              const profileExists = await checkUserProfile(idToken);

              if (profileExists) {
                logger.debug('Profile loaded successfully');
                setProfileLoaded(true);
                setError(null);
              } else {
                logger.warn('Profile not found in backend');
                setProfileLoaded(false);
                setError('Profile not found. Please complete registration.');
              }
            } catch (profileError) {
              logger.error('Error checking profile:', profileError);
              setError('Failed to load user profile');
              setProfileLoaded(false);
            }
          } else {
            // User is signed out
            logger.debug('User signed out');
            setProfileLoaded(false);
            setError(null);
          }

          setLoading(false);
          setInitialized(true);
        } catch (error) {
          logger.error('Error in auth state change handler:', error);
          setError(error instanceof Error ? error.message : 'Authentication error');
          setLoading(false);
          setInitialized(true);
        }
      },
      (error) => {
        logger.error('Auth state observer error:', error);
        setError(error.message);
        setLoading(false);
        setInitialized(true);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      logger.debug('Cleaning up auth state listener');
      unsubscribe();
    };
  }, [setUser, setLoading, setProfileLoaded, setError]);

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
  const { user } = useAuth();
  return !!user;
}

/**
 * Hook to get current user or null
 */
export function useCurrentUser(): User | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to require authentication (redirect if not authenticated)
 */
export function useRequireAuth(redirectUrl = '/signin') {
  const { user, loading, initialized } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

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