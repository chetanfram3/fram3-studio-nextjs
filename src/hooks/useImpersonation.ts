'use client';

import { useState, useCallback, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { startImpersonation, stopImpersonation } from '@/services/auth/impersonationService';
import { useAuth } from '@/hooks/auth/useAuth';
import logger from '@/utils/logger';

// ===========================
// TYPE DEFINITIONS
// ===========================

/**
 * Target user information returned from impersonation start
 */
interface TargetUserInfo {
  uid: string;
  email: string;
  displayName?: string | null;
  [key: string]: unknown;
}

/**
 * Return type for the useImpersonation hook
 */
interface UseImpersonationReturn {
  /**
   * Whether currently impersonating another user
   */
  isImpersonating: boolean;

  /**
   * UID of the original admin user (before impersonation)
   */
  originalUser: string | null;

  /**
   * Current user (either original or impersonated)
   */
  currentUser: ReturnType<typeof useAuth>['user'];

  /**
   * Start impersonating a target user
   * @param targetUserId - UID of the user to impersonate
   * @returns Promise resolving to target user information
   * @throws Error if impersonation fails
   */
  startImpersonatingUser: (targetUserId: string) => Promise<TargetUserInfo>;

  /**
   * Stop impersonating and return to original admin user
   * @throws Error if stopping impersonation fails
   */
  stopImpersonatingUser: () => Promise<void>;
}

// ===========================
// MAIN HOOK
// ===========================

/**
 * Hook for managing user impersonation (admin feature)
 * 
 * Allows admin users to impersonate other users for support purposes.
 * Automatically detects impersonation state from token claims and provides
 * functions to start/stop impersonation.
 * 
 * @returns Object with impersonation state and control functions
 * 
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { 
 *     isImpersonating, 
 *     originalUser,
 *     startImpersonatingUser, 
 *     stopImpersonatingUser 
 *   } = useImpersonation();
 * 
 *   const handleImpersonate = async (userId: string) => {
 *     try {
 *       const targetUser = await startImpersonatingUser(userId);
 *       console.log('Now impersonating:', targetUser.email);
 *     } catch (error) {
 *       console.error('Failed to impersonate user:', error);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       {isImpersonating && (
 *         <Alert>
 *           Impersonating user. Original admin: {originalUser}
 *           <Button onClick={stopImpersonatingUser}>Stop</Button>
 *         </Alert>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useImpersonation(): UseImpersonationReturn {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUser, setOriginalUser] = useState<string | null>(null);
  const { user } = useAuth();

  // ==========================================
  // EFFECT: MONITOR AUTH STATE FOR IMPERSONATION
  // ==========================================

  /**
   * Listen for auth state changes and check token claims
   * to detect if currently impersonating
   */
  useEffect(() => {
    logger.debug('Setting up impersonation state listener');

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Force refresh token to get latest claims
          const tokenResult = await getIdTokenResult(currentUser, true);
          const isCurrentlyImpersonating = !!tokenResult.claims.impersonatedBy;

          setIsImpersonating(isCurrentlyImpersonating);

          if (isCurrentlyImpersonating) {
            const impersonatorId = tokenResult.claims.impersonatedBy as string;
            setOriginalUser(impersonatorId);

            logger.info('Impersonation detected', {
              impersonatorId,
              targetUserId: currentUser.uid,
              targetEmail: currentUser.email
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
      } else {
        // User signed out
        logger.debug('User signed out, clearing impersonation state');
        setIsImpersonating(false);
        setOriginalUser(null);
      }
    });

    // Cleanup listener on unmount
    return () => {
      logger.debug('Cleaning up impersonation state listener');
      unsubscribe();
    };
  }, []);

  // ==========================================
  // IMPERSONATION CONTROL FUNCTIONS
  // ==========================================

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
      await signInWithCustomToken(auth, response.token);

      // Update state
      setIsImpersonating(true);

      logger.info('Successfully started impersonating user', {
        targetUserId,
        targetEmail: response.targetUser.email
      });

      // Return the target user data directly (it already matches TargetUserInfo type)
      return response.targetUser as TargetUserInfo;
    } catch (error) {
      logger.error('Failed to start impersonation', {
        targetUserId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Reset state on error
      setIsImpersonating(false);
      setOriginalUser(null);

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
        currentUserId: auth.currentUser?.uid
      });

      // Call backend to stop impersonation (returns admin token)
      await stopImpersonation();

      // Reset state
      setIsImpersonating(false);
      setOriginalUser(null);

      logger.info('Successfully stopped impersonation');
    } catch (error) {
      logger.error('Failed to stop impersonation', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }, [originalUser]);

  // ==========================================
  // RETURN INTERFACE
  // ==========================================

  return {
    isImpersonating,
    originalUser,
    startImpersonatingUser,
    stopImpersonatingUser,
    currentUser: user,
  };
}

// ===========================
// EXPORT TYPES
// ===========================

export type { TargetUserInfo, UseImpersonationReturn };