/**
 * Central export for all custom hooks
 */

// Authentication hooks
export {
  useAuth,
  useIsAuthenticated,
  useCurrentUser,
  useRequireAuth,
} from './auth/useAuth';

// ReCAPTCHA hooks
export {
  useRecaptcha,
  useRecaptchaManual,
  useRecaptchaAvailable,
  useRecaptchaPreload,
} from './auth/useRecaptcha';

// MFA hooks
export {
  useMFA,
  useIsMFAEnabled,
  useMFAEnrollment,
} from './auth/useMFA';

// Redirect hooks
export {
  useAuthRedirect,
  useProtectedRoute,
  useAuthPage,
} from './auth/useAuthRedirect';

// Form validation hooks
export {
  useFormValidation,
  validationRules,
} from './auth/useFormValidation';