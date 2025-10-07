// src/hooks/useProfileForm.ts
import { useState, useCallback } from 'react';
import { UserProfile } from '@/types/profile';
import { fetchUserProfile, updateUserProfile } from '@/services/profileService';
import { normalizeProfile } from '@/utils/profileHelpers';
import logger from '@/utils/logger';

export function useProfileForm() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  /**
   * Load profile from API
   */
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.debug('Loading user profile');
      
      const data = await fetchUserProfile();
      const normalizedProfile = normalizeProfile(data);
      
      setProfile(normalizedProfile);
      setError('');
      
      logger.debug('Profile loaded successfully');
    } catch (err) {
      logger.error('Profile load error:', err);
      setError('Failed to load profile. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update a field in the profile
   * Supports nested paths like ['extendedInfo', 'details', 'firstName']
   */
  const updateField = useCallback((path: string[], value: any) => {
    setProfile((currentProfile) => {
      if (!currentProfile) return null;

      const newProfile = { ...currentProfile };
      let current: any = newProfile;

      // Navigate to the nested object, creating objects if they don't exist
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        // Create a new object reference for immutability
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }

      // Update the value
      current[path[path.length - 1]] = value;
      
      logger.debug('Field updated:', { path, value });
      
      return newProfile;
    });
  }, []);

  /**
   * Submit profile updates to API
   */
  const handleSubmit = useCallback(async () => {
    if (!profile) {
      logger.warn('Cannot submit: no profile loaded');
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      logger.debug('Submitting profile updates');
      
      // Prepare update data - only send fields that can be updated
      const updateData = {
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        phoneNumber: profile.phoneNumber,
        extendedInfo: {
          details: {
            firstName: profile.extendedInfo.details.firstName,
            lastName: profile.extendedInfo.details.lastName,
            dob: profile.extendedInfo.details.dob,
            address: profile.extendedInfo.details.address,
            gstin: profile.extendedInfo.details.gstin,
            preferences: profile.extendedInfo.details.preferences,
            genre: profile.extendedInfo.details.genre,
            expertise: profile.extendedInfo.details.expertise
          }
        }
      };

      await updateUserProfile(updateData);
      
      logger.debug('Profile updated successfully');
      
      // Reload profile to get latest data from server
      await loadProfile();
    } catch (err) {
      logger.error('Profile update error:', err);
      setError('Failed to update profile. Please try again.');
      throw err; // Re-throw so component can handle it
    } finally {
      setIsUpdating(false);
    }
  }, [profile, loadProfile]);

  return {
    profile,
    isLoading,
    isUpdating,
    error,
    loadProfile,
    updateField,
    handleSubmit,
  };
}