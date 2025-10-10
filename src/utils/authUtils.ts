import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '@/types/auth';
import logger from '@/utils/logger';

/**
 * Extract user data from Firebase User object
 * Useful for creating user profiles from social auth
 */
export function extractUserData(user: FirebaseUser): Partial<UserProfile> {
  const displayName = user.displayName || user.email?.split('@')[0] || '';
  const nameParts = displayName.split(' ');
  
  return {
    uid: user.uid,
    email: user.email || '',
    displayName,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    profilePic: user.photoURL || undefined,
    phoneNumber: user.phoneNumber || undefined,
    emailVerified: user.emailVerified,
  };
}

/**
 * Generate a default profile picture URL using UI Avatars
 */
export function getDefaultProfilePic(displayName: string): string {
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=200&bold=true`;
}

/**
 * Process Google profile picture URL to get higher resolution
 */
export function processGoogleProfilePic(url: string): string {
  // Remove size parameter to get higher resolution
  return url.replace(/=s\d+-c/, '=s400-c');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Check if it has 10-15 digits
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Format display name from first and last name
 */
export function formatDisplayName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Parse JWT token (without verification)
 * Used for debugging/display purposes only
 */
export function parseJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    logger.debug("Error:", error);
    return null;
  }
}