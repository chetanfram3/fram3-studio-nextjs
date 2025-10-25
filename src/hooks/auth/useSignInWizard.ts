// src/hooks/auth/useSignInWizard.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { updateUserProfile } from '@/services/profileService';
import { auth } from '@/lib/firebase';
import { UserProfile } from '@/types/profile';
import logger from '@/utils/logger';

/**
 * Hook to manage Sign-In Wizard state and lifecycle
 * 
 * Shows the wizard when:
 * - User is authenticated (user !== null)
 * - Profile is not loaded (profileLoaded === false)
 * - Not currently loading
 * 
 * @returns Wizard state and handlers
 */
export function useSignInWizard() {
  const { user, profileLoaded, loading, setProfileLoaded, setError } = useAuthStore();
  const [showWizard, setShowWizard] = useState(false);
  const [wizardLoading, setWizardLoading] = useState(false);

  // Determine if wizard should be shown
  useEffect(() => {
    const shouldShow = user !== null && !profileLoaded && !loading;

    if (shouldShow) {
      logger.debug('Sign-in wizard: Conditions met to show wizard', {
        hasUser: !!user,
        profileLoaded,
        loading
      });
    }

    setShowWizard(shouldShow);
  }, [user, profileLoaded, loading]);

  /**
   * Handle profile creation from wizard
   */
  const handleProfileCreation = async (profileData: Partial<UserProfile>) => {
    if (!user) {
      logger.error('Sign-in wizard: No user found during profile creation');
      throw new Error('No authenticated user found');
    }

    setWizardLoading(true);
    setError(null);

    try {
      logger.debug('Sign-in wizard: Updating profile via API');

      // Use updateUserProfile instead of createUserProfile
      // This calls PUT /user/profileUpdate which uses merge: true
      // So it will create the profile if it doesn't exist
      await updateUserProfile(profileData);

      logger.debug('Sign-in wizard: Profile created/updated successfully');

      // Update auth store
      setProfileLoaded(true);
      setError(null);

      // Hide wizard
      setShowWizard(false);

      // Optionally refresh the page to ensure all profile-dependent data loads
      // Uncomment if needed:
      // window.location.reload();
    } catch (error) {
      logger.error('Sign-in wizard: Profile creation failed', error);
      setWizardLoading(false);
      throw error; // Re-throw to let wizard handle the error display
    } finally {
      setWizardLoading(false);
    }
  };

  /**
   * Handle wizard cancellation (sign out)
   */
  const handleWizardCancel = async () => {
    try {
      logger.debug('Sign-in wizard: User cancelled - signing out');
      await auth.signOut();
      setShowWizard(false);
    } catch (error) {
      logger.error('Sign-in wizard: Sign out failed', error);
      setError('Failed to sign out');
    }
  };

  return {
    showWizard,
    wizardLoading,
    user,
    handleProfileCreation,
    handleWizardCancel,
  };
}