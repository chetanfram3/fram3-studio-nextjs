// src/services/profileService.ts
import { auth } from '@/lib/firebase';
import { API_BASE_URL } from '@/config/constants';
import type { UserProfile, APIINFO } from '@/types/profile';
import logger from '@/utils/logger';

/**
 * Fetch user profile from backend
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  logger.debug('Fetching user profile from API');

  const response = await fetch(`${API_BASE_URL}/user/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    logger.error('Failed to fetch profile:', error);
    throw new Error(error.message || 'Failed to fetch profile');
  }

  const data = await response.json();
  logger.debug('Profile fetched successfully');
  
  return data.data;
}

/**
 * Fetch API info (version, subscription, etc.)
 */
export async function fetchInfo(): Promise<APIINFO> {
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  logger.debug('Fetching API info');

  const response = await fetch(`${API_BASE_URL}/user/api-info`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    logger.error('Failed to fetch API info:', error);
    throw new Error(error.message || 'Failed to fetch api info');
  }

  const data = await response.json();
  logger.debug('API info fetched successfully');
  
  return data.data;
}

/**
 * Update user profile in backend
 */
export async function updateUserProfile(profile: Partial<UserProfile>): Promise<void> {
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  logger.debug('Updating user profile');

  const response = await fetch(`${API_BASE_URL}/user/profileUpdate`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profile)
  });

  if (!response.ok) {
    const error = await response.json();
    logger.error('Failed to update profile:', error);
    throw new Error(error.message || 'Failed to update profile');
  }

  logger.debug('Profile updated successfully');
}