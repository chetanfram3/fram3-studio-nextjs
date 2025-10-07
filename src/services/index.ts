/**
 * Central export for all authentication and user services
 */

// Auth Services
export {
  signInWithEmail,
  signOut,
  resetPassword,
  updateUserProfile as updateFirebaseProfile,
  sendVerificationEmail,
  getCurrentUserToken,
  isAuthenticated,
  getCurrentUser,
  registerUser,
} from './auth/authService';

// Registration Service
export {
  registerUser as registerNewUser,
  validateRegistrationData,
} from './auth/registerService';

// Social Auth Services
export {
  handleSocialSignIn,
  checkRedirectResult,
  handleGoogleSignIn,
  handleFacebookSignIn,
  handleTwitterSignIn,
  handleAppleSignIn,
  linkSocialProvider,
  getEnabledProviders,
  isProviderLinked,
} from './auth/socialAuthService';

// Social Auth Handler
export {
  handleSocialAuthSuccess,
  updateSocialAuthProfile,
  getProviderDisplayName,
  getProviderInfo,
} from './auth/socialAuth';

// User Services
export {
  checkUserProfile,
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getUserById,
  searchUsers,
  uploadProfilePicture,
} from './userService';

// ReCAPTCHA Services
export {
  validateRecaptcha,
  isRecaptchaEnabled,
  getRecaptchaSiteKey,
  loadRecaptchaScript,
  executeRecaptcha,
  isScoreAcceptable,
  getRiskLevel,
  resetRecaptcha,
} from './auth/reCaptchaService';

// MFA Services
export {
  initializeRecaptchaVerifier,
  enrollPhoneMFA,
  completePhoneMFAEnrollment,
  getMFAResolver,
  sendMFAVerificationCode,
  completeMFASignIn,
  unenrollMFA,
  getEnrolledMFAFactors,
  isMFAEnabled,
  getPhoneNumberFromHint,
  formatPhoneNumberMasked,
} from './auth/mfaService';

// Impersonation Services (Optional)
export {
  startImpersonation,
  stopImpersonation,
  isImpersonating,
  getImpersonationInfo,
} from './auth/impersonationService';

// Types
export type { ImpersonationResponse } from './auth/impersonationService';