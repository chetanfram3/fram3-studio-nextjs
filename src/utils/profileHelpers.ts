// src/utils/profileHelpers.ts
import { UserProfile } from '@/types/profile';

export const DEFAULT_PROFILE_PIC = 'https://ui-avatars.com/api/?background=random';
export const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1444628838545-ac4016a5418a?w=1600&h=400&fit=crop';

/**
 * Create default profile structure
 */
export const createDefaultProfile = (
  email: string, 
  displayName?: string
): Partial<UserProfile> => ({
  uid: '',
  email,
  emailVerified: false,
  displayName: displayName || '',
  photoURL: `${DEFAULT_PROFILE_PIC}&name=${encodeURIComponent(displayName || '')}`,
  providerData: [],
  metadata: {
    creationTime: '',
    lastSignInTime: '',
    lastRefreshTime: ''
  },
  extendedInfo: {
    details: {
      firstName: displayName?.split(' ')[0] || '',
      lastName: displayName?.split(' ').slice(1).join(' ') || '',
      dob: null,
      address: {
        street: '',
        city: '',
        state: '',
        country: 'IN', // Default to India
        postalCode: '',
      },
      gstin: null,
      preferences: {
        theme: 'dark', // Default to dark mode
        language: 'en',
      },
      genre: [],
      expertise: []
    }
  }
});

/**
 * Normalize profile data from API
 * Ensures all required fields exist with proper defaults
 */
export const normalizeProfile = (profile: Partial<UserProfile>): UserProfile => {
  return {
    uid: profile.uid || '',
    email: profile.email || '',
    emailVerified: profile.emailVerified || false,
    phoneNumber: profile.phoneNumber || '',
    displayName: profile.displayName || '',
    photoURL: profile.photoURL || '',
    providerData: profile.providerData || [],
    metadata: profile.metadata || {
      creationTime: '',
      lastSignInTime: '',
      lastRefreshTime: ''
    },
    extendedInfo: {
      details: {
        firstName: profile.extendedInfo?.details?.firstName || '',
        lastName: profile.extendedInfo?.details?.lastName || '',
        dob: profile.extendedInfo?.details?.dob || null,
        address: {
          street: profile.extendedInfo?.details?.address?.street || '',
          city: profile.extendedInfo?.details?.address?.city || '',
          state: profile.extendedInfo?.details?.address?.state || '',
          country: profile.extendedInfo?.details?.address?.country || 'IN',
          postalCode: profile.extendedInfo?.details?.address?.postalCode || '',
        },
        gstin: profile.extendedInfo?.details?.gstin || null,
        preferences: {
          theme: profile.extendedInfo?.details?.preferences?.theme || 'dark',
          language: profile.extendedInfo?.details?.preferences?.language || 'en'
        },
        genre: profile.extendedInfo?.details?.genre || [],
        expertise: profile.extendedInfo?.details?.expertise || []
      }
    }
  };
};

/**
 * Validate GSTIN format
 */
const validateGSTIN = (gstin: string): boolean => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstinRegex.test(gstin)) {
    return false;
  }

  // Validate state code (01-37)
  const stateCode = parseInt(gstin.substr(0, 2));
  return stateCode >= 1 && stateCode <= 37;
};

/**
 * Validate profile data before submission
 * Returns array of error messages
 */
export const validateProfile = (profile: UserProfile): string[] => {
  const errors: string[] = [];

  // Basic info validation
  if (!profile.extendedInfo.details.firstName?.trim()) {
    errors.push('First name is required');
  }
  
  if (!profile.extendedInfo.details.lastName?.trim()) {
    errors.push('Last name is required');
  }
  
  if (!profile.displayName?.trim()) {
    errors.push('Display name is required');
  }

  // Email validation (should always exist but check anyway)
  if (!profile.email?.trim()) {
    errors.push('Email is required');
  }

  // GSTIN validation
  const gstin = profile.extendedInfo.details.gstin;
  if (gstin) {
    if (gstin.number && !validateGSTIN(gstin.number)) {
      errors.push('Invalid GSTIN format. Expected format: 29ABCDE1234F1Z5');
    }
    if (gstin.number && !gstin.companyName?.trim()) {
      errors.push('Company name is required when GSTIN is provided');
    }
  }

  // Phone number validation (if provided)
  if (profile.phoneNumber) {
    const phoneDigits = profile.phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      errors.push('Phone number must be at least 10 digits');
    }
  }

  return errors;
};

/**
 * Format user initials from display name
 */
export const getUserInitials = (displayName: string): string => {
  if (!displayName) return 'U';
  
  const parts = displayName.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Format full name from first and last name
 */
export const getFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

/**
 * Check if profile is complete (all required fields filled)
 */
export const isProfileComplete = (profile: UserProfile): boolean => {
  return !!(
    profile.email &&
    profile.displayName &&
    profile.extendedInfo.details.firstName &&
    profile.extendedInfo.details.lastName &&
    profile.phoneNumber
  );
};

/**
 * Get profile completion percentage
 */
export const getProfileCompletionPercentage = (profile: UserProfile): number => {
  const fields = [
    profile.email,
    profile.displayName,
    profile.phoneNumber,
    profile.photoURL,
    profile.extendedInfo.details.firstName,
    profile.extendedInfo.details.lastName,
    profile.extendedInfo.details.address.street,
    profile.extendedInfo.details.address.city,
    profile.extendedInfo.details.address.state,
    profile.extendedInfo.details.address.country,
    profile.extendedInfo.details.address.postalCode,
  ];

  const filledFields = fields.filter(field => field && field.toString().trim()).length;
  return Math.round((filledFields / fields.length) * 100);
};