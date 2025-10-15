// src/hooks/useImpersonation.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken, getIdTokenResult } from 'firebase/auth';
import { startImpersonation, stopImpersonation } from '@/services/auth/impersonationService';
import { useAuth } from '@/hooks/auth/useAuth';
import logger from '@/utils/logger';

// ===========================
// TYPE DEFINITIONS
// ===========================

interface TargetUserInfo {
  uid: string;
  email: string;
  displayName?: string | null;
  [key: string]: unknown;
}

interface UseImpersonationReturn {
  isImpersonating: boolean;
  originalUser: string | null;
  currentUser: ReturnType<typeof useAuth>['user'];
  startImpersonatingUser: (targetUserId: string) => Promise<TargetUserInfo>;
  stopImpersonatingUser: () => Promise<void>;
}

// ===========================
// MAIN HOOK
// ===========================

/**
 * Hook for managing user impersonation (admin feature)
 * 
 * ✅ FIXED: No longer creates redundant auth listeners
 * ✅ Reads from existing auth state via useAuth()
 * ✅ Only checks token claims when user changes
 */
export function useImpersonation(): UseImpersonationReturn {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUser, setOriginalUser] = useState<string | null>(null);

  // ✅ Read from existing auth state (no new listener!)
  const { user } = useAuth();

  // ===========================
  // EFFECT: CHECK IMPERSONATION STATUS
  // ===========================

  /**
   * Check token claims when user changes
   * ✅ No onAuthStateChanged - just check when user prop updates
   */
  useEffect(() => {
    const checkImpersonationStatus = async () => {
      if (!user) {
        // User signed out
        logger.debug('User signed out, clearing impersonation state');
        setIsImpersonating(false);
        setOriginalUser(null);
        return;
      }

      try {
        // Get token claims (no force refresh needed - already fresh from AuthInitializer)
        const tokenResult = await getIdTokenResult(user, false);
        const isCurrentlyImpersonating = !!tokenResult.claims.impersonatedBy;

        setIsImpersonating(isCurrentlyImpersonating);

        if (isCurrentlyImpersonating) {
          const impersonatorId = tokenResult.claims.impersonatedBy as string;
          setOriginalUser(impersonatorId);

          logger.info('Impersonation detected', {
            impersonatorId,
            targetUserId: user.uid,
            targetEmail: user.email
          });
        } else {
          setOriginalUser(null);
          logger.debug('No impersonation detected');
        }
      } catch (error) {
        logger.error('Error checking impersonation status:', error);
        setIsImpersonating(false);
        setOriginalUser(null);
      }
    };

    checkImpersonationStatus();
  }, [user]); // ✅ Only depends on user from useAuth

  // ===========================
  // IMPERSONATION CONTROL FUNCTIONS
  // ===========================

  /**
   * Start impersonating a target user
   */
  const startImpersonatingUser = useCallback(async (targetUserId: string): Promise<TargetUserInfo> => {
    try {
      logger.info('Starting impersonation', { targetUserId });

      // Store original user ID before impersonation
      const currentUserId = auth.currentUser?.uid || null;
      setOriginalUser(currentUserId);

      // Call backend to initiate impersonation
      const response = await startImpersonation(targetUserId);

      logger.debug('Impersonation token received, signing in as target user');

      // Sign in with the impersonation token
      // This will trigger AuthInitializer's listener (the only listener we need)
      await signInWithCustomToken(auth, response.token);

      // Update state
      setIsImpersonating(true);

      logger.info('Successfully started impersonating user', {
        targetUserId,
        targetEmail: response.targetUser.email
      });

      return response.targetUser as TargetUserInfo;
    } catch (error) {
      logger.error('Failed to start impersonation', {
        targetUserId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, []);

  /**
   * Stop impersonating and return to original admin user
   */
  const stopImpersonatingUser = useCallback(async (): Promise<void> => {
    try {
      logger.info('Stopping impersonation', {
        originalUser,
        currentUser: user?.uid
      });

      // Call backend to stop impersonation
      await stopImpersonation();

      // This will trigger AuthInitializer's listener
      logger.debug('Impersonation stopped, auth state will update automatically');

      // Clear local state
      setIsImpersonating(false);
      setOriginalUser(null);
    } catch (error) {
      logger.error('Failed to stop impersonation', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, [originalUser, user?.uid]);

  // ===========================
  // RETURN
  // ===========================

  return {
    isImpersonating,
    originalUser,
    currentUser: user,
    startImpersonatingUser,
    stopImpersonatingUser,
  };
}