import { FirebaseError } from 'firebase/app';

/**
 * Convert Firebase authentication errors to user-friendly messages
 */
export function handleAuthError(error: unknown): Error {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      // Email/Password errors
      case 'auth/email-already-in-use':
        return new Error('This email is already registered. Please sign in or use a different email.');
      
      case 'auth/invalid-email':
        return new Error('Invalid email address. Please check and try again.');
      
      case 'auth/operation-not-allowed':
        return new Error('This operation is not allowed. Please contact support.');
      
      case 'auth/weak-password':
        return new Error('Password is too weak. Please use a stronger password.');
      
      case 'auth/user-disabled':
        return new Error('This account has been disabled. Please contact support.');
      
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return new Error('Invalid email or password. Please try again.');
      
      case 'auth/invalid-credential':
        return new Error('Invalid credentials. Please check your email and password.');
      
      // Rate limiting
      case 'auth/too-many-requests':
        return new Error('Too many failed attempts. Please try again later or reset your password.');
      
      // Popup errors
      case 'auth/popup-closed-by-user':
        return new Error('Sign-in cancelled. Please try again.');
      
      case 'auth/popup-blocked':
        return new Error('Popup blocked by browser. Please allow popups and try again.');
      
      case 'auth/cancelled-popup-request':
        return new Error('Only one popup allowed at a time. Please close other popups.');
      
      // MFA errors
      case 'auth/multi-factor-auth-required':
        return new Error('Multi-factor authentication required');
      
      case 'auth/invalid-verification-code':
        return new Error('Invalid verification code. Please try again.');
      
      case 'auth/code-expired':
        return new Error('Verification code expired. Please request a new one.');
      
      case 'auth/invalid-verification-id':
        return new Error('Invalid verification ID. Please try again.');
      
      // Network errors
      case 'auth/network-request-failed':
        return new Error('Network error. Please check your connection and try again.');
      
      case 'auth/timeout':
        return new Error('Request timed out. Please try again.');
      
      // Token errors
      case 'auth/invalid-user-token':
      case 'auth/user-token-expired':
        return new Error('Session expired. Please sign in again.');
      
      // Account errors
      case 'auth/account-exists-with-different-credential':
        return new Error('An account already exists with this email using a different sign-in method.');
      
      case 'auth/credential-already-in-use':
        return new Error('This credential is already associated with a different account.');
      
      // Default
      default:
        console.error('Unhandled Firebase error:', error.code, error.message);
        return new Error(error.message || 'Authentication failed. Please try again.');
    }
  }
  
  if (error instanceof Error) {
    return error;
  }
  
  return new Error('An unknown error occurred. Please try again.');
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
  
  return false;
}