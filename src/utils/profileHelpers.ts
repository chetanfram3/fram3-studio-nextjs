import { UserProfile, CreateUserPayload } from '@/types/auth';

/**
 * Create a default user profile structure
 * Used when creating new users
 */
export function createDefaultProfile(email: string, displayName: string): Partial<UserProfile> {
  const nameParts = displayName.split(' ');
  
  return {
    email,
    displayName,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    phoneNumber: '',
    role: 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Merge user data with default profile
 * Ensures all required fields are present
 */
export function mergeWithDefaults(
  userData: Partial<UserProfile>, 
  defaults: Partial<UserProfile>
): Partial<UserProfile> {
  return {
    ...defaults,
    ...userData,
    // Always update timestamp
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Validate required profile fields
 */
export function validateProfileData(profile: Partial<UserProfile>): {
  isValid: boolean;
  missingFields: string[];
} {
  const requiredFields: (keyof UserProfile)[] = ['email', 'displayName', 'uid'];
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (!profile[field]) {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Create user payload for backend API
 */
export function createUserPayload(
  uid: string,
  profile: Partial<UserProfile>
): CreateUserPayload {
  return {
    uid,
    email: profile.email || '',
    displayName: profile.displayName || '',
    profilePic: profile.profilePic,
    phoneNumber: profile.phoneNumber,
    firstName: profile.firstName,
    lastName: profile.lastName,
    emailVerified: profile.emailVerified || false,
    role: profile.role || 'user',
    status: profile.status || 'active',
    providerUserInfo: profile.providerData,
  };
}

/**
 * Format user profile for display
 */
export function formatUserProfile(profile: UserProfile): {
  fullName: string;
  initials: string;
  emailDomain: string;
} {
  const fullName = profile.displayName || `${profile.firstName} ${profile.lastName}`.trim();
  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const emailDomain = profile.email.split('@')[1] || '';
  
  return {
    fullName,
    initials,
    emailDomain,
  };
}

/**
 * Check if profile is complete
 */
export function isProfileComplete(profile: Partial<UserProfile>): boolean {
  return !!(
    profile.email &&
    profile.displayName &&
    profile.firstName &&
    profile.lastName
  );
}

/**
 * Get missing profile fields
 */
export function getMissingProfileFields(profile: Partial<UserProfile>): string[] {
  const optionalFields = ['firstName', 'lastName', 'phoneNumber', 'profilePic'];
  const missing: string[] = [];
  
  for (const field of optionalFields) {
    if (!profile[field as keyof UserProfile]) {
      missing.push(field);
    }
  }
  
  return missing;
}

/**
 * Sanitize profile data before sending to backend
 * Removes undefined/null values and trims strings
 */
export function sanitizeProfileData(profile: Partial<UserProfile>): Partial<UserProfile> {
  const sanitized: Partial<UserProfile> = {};
  
  for (const [key, value] of Object.entries(profile)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string') {
        sanitized[key as keyof UserProfile] = value.trim() as any;
      } else {
        sanitized[key as keyof UserProfile] = value as any;
      }
    }
  }
  
  return sanitized;
}