import { User as FirebaseUser } from 'firebase/auth';

/**
 * Registration form data
 */
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  displayName?: string;
}

/**
 * Authentication state management
 */
export interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  profileLoaded: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProfileLoaded: (loaded: boolean) => void;
  reset: () => void;
}

/**
 * User profile data from backend
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  profilePic?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  providerData?: ProviderData[];
}

/**
 * OAuth provider data
 */
export interface ProviderData {
  providerId: string;
  email: string;
  federatedId?: string;
  rawId?: string;
}

/**
 * Multi-factor authentication state
 */
export interface MFAState {
  isOpen: boolean;
  verificationId: string;
  verificationCode: string;
  error: string;
  loading: boolean;
}

/**
 * Password validation result
 */
export interface PasswordValidation {
  isValid: boolean;
  message: string;
}

/**
 * Social auth provider types
 */
export type SocialProvider = 'google' | 'facebook' | 'twitter' | 'apple';

/**
 * Auth form types
 */
export interface SignInFormData {
  email: string;
  password: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

/**
 * API Response types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * User creation payload for backend
 */
export interface CreateUserPayload {
  uid: string;
  email: string;
  displayName: string;
  profilePic?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  role?: string;
  status?: string;
  providerUserInfo?: ProviderData[];
}