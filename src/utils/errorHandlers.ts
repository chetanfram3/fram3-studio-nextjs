// src/utils/errorHandlers.ts
import { FirebaseError } from 'firebase/app';

// ✅ Custom error class that preserves Firebase error codes
export class AuthError extends Error {
  code?: string;
  originalError?: unknown;

  constructor(message: string, code?: string, originalError?: unknown) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Convert Firebase authentication errors to user-friendly messages
 * ✅ Now preserves the original error code
 */
export function handleAuthError(error: unknown): AuthError {
  if (error instanceof FirebaseError) {
    let message: string;

    switch (error.code) {
      // Email/Password errors
      case 'auth/email-already-in-use':
        message = 'This email is already registered. Please sign in or use a different email.';
        break;

      case 'auth/invalid-email':
        message = 'Invalid email address. Please check and try again.';
        break;

      case 'auth/operation-not-allowed':
        message = 'This operation is not allowed. Please contact support.';
        break;

      case 'auth/weak-password':
        message = 'Password is too weak. Please use a stronger password.';
        break;

      case 'auth/user-disabled':
        message = 'This account has been disabled. Please contact support.';
        break;

      case 'auth/user-not-found':
      case 'auth/wrong-password':
        message = 'Invalid email or password. Please try again.';
        break;

      case 'auth/invalid-credential':
        message = 'Invalid credentials. Please check your email and password.';
        break;

      // Rate limiting
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later or reset your password.';
        break;

      // Popup errors
      case 'auth/popup-closed-by-user':
        message = 'Sign-in cancelled. Please try again.';
        break;

      case 'auth/popup-blocked':
        message = 'Popup blocked by browser. Please allow popups and try again.';
        break;

      case 'auth/cancelled-popup-request':
        message = 'Only one popup allowed at a time. Please close other popups.';
        break;

      // MFA errors
      case 'auth/multi-factor-auth-required':
        message = 'Multi-factor authentication required';
        break;

      case 'auth/invalid-verification-code':
        message = 'Invalid verification code. Please try again.';
        break;

      case 'auth/code-expired':
        message = 'Verification code expired. Please request a new one.';
        break;

      case 'auth/invalid-verification-id':
        message = 'Invalid verification ID. Please try again.';
        break;

      // ✅ Reauthentication error - PRESERVE CODE
      case 'auth/requires-recent-login':
        message = 'For security, please verify your identity to continue.';
        break;

      // Network errors
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection and try again.';
        break;

      case 'auth/timeout':
        message = 'Request timed out. Please try again.';
        break;

      // Token errors
      case 'auth/invalid-user-token':
      case 'auth/user-token-expired':
        message = 'Session expired. Please sign in again.';
        break;

      // Account errors
      case 'auth/account-exists-with-different-credential':
        message = 'An account already exists with this email using a different sign-in method.';
        break;

      default:
        message = error.message || 'An authentication error occurred. Please try again.';
    }

    // ✅ Return AuthError with preserved code
    return new AuthError(message, error.code, error);
  }

  if (error instanceof Error) {
    return new AuthError(error.message, undefined, error);
  }

  return new AuthError('An unexpected error occurred. Please try again.', undefined, error);
}

/**
 * Handle API errors from backend
 */
export function handleApiError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  return new Error('An error occurred while processing your request.');
}

/**
 * Format error for display to user
 */
export function formatErrorMessage(error: Error): string {
  return error.message || 'Something went wrong. Please try again.';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof FirebaseError) {
    return error.code === 'auth/network-request-failed' || error.code === 'auth/timeout';
  }

  if (error instanceof Error) {
    return error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('connection');
  }

  return false;
}

/**
 * Check if error requires re-authentication
 */
export function requiresReauth(error: unknown): boolean {
  if (error instanceof FirebaseError) {
    return error.code === 'auth/invalid-user-token' ||
      error.code === 'auth/user-token-expired' ||
      error.code === 'auth/requires-recent-login';
  }

  // ✅ Also check AuthError instances
  if (error instanceof AuthError) {
    return error.code === 'auth/requires-recent-login';
  }

  return false;
}