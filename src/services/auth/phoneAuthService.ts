// src/services/auth/phoneAuthService.ts
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import logger from '@/utils/logger';
import { handleAuthError } from '@/utils/errorHandlers';

/**
 * Initialize reCAPTCHA verifier for phone sign-in
 */
export function initializePhoneRecaptcha(
  containerId: string,
  callbacks?: {
    onSuccess?: () => void;
    onExpired?: () => void;
    onError?: () => void;
  }
): RecaptchaVerifier {
  try {
    logger.debug('Initializing phone sign-in reCAPTCHA');

    // Clear existing container content
    const container = document.getElementById(containerId);
    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        logger.debug('reCAPTCHA verified for phone sign-in');
        callbacks?.onSuccess?.();
      },
      'expired-callback': () => {
        logger.warn('reCAPTCHA expired for phone sign-in');
        callbacks?.onExpired?.();
      },
      'error-callback': () => {
        logger.error('reCAPTCHA error for phone sign-in');
        callbacks?.onError?.();
      },
    });

    return verifier;
  } catch (error) {
    logger.error('Error initializing phone reCAPTCHA:', error);
    throw error;
  }
}

/**
 * Send verification code to phone number
 */
export async function sendPhoneVerificationCode(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  try {
    logger.debug('Sending verification code to:', phoneNumber);

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      verifier
    );

    logger.debug('Verification code sent successfully');
    return confirmationResult;
  } catch (error: any) {
    logger.error('Error sending verification code:', error);
    throw handleAuthError(error);
  }
}

/**
 * Verify phone number with code and complete sign-in
 */
export async function verifyPhoneCode(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<User> {
  try {
    logger.debug('Verifying phone code');

    const userCredential = await confirmationResult.confirm(code);

    logger.debug('Phone sign-in successful');
    return userCredential.user;
  } catch (error: any) {
    logger.error('Error verifying phone code:', error);
    
    if (error?.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid verification code. Please try again.');
    }
    
    if (error?.code === 'auth/code-expired') {
      throw new Error('Verification code expired. Please request a new code.');
    }
    
    throw handleAuthError(error);
  }
}

/**
 * Clean up phone reCAPTCHA
 */
export function cleanupPhoneRecaptcha(verifier: RecaptchaVerifier | null): void {
  if (verifier) {
    try {
      verifier.clear();
      logger.debug('Phone reCAPTCHA cleaned up');
    } catch (error) {
      logger.warn('Error cleaning up phone reCAPTCHA:', error);
    }
  }
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (digits.length === 10) {
    // US format: (555) 123-4567
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // US with country code: +1 (555) 123-4567
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else if (digits.length > 10) {
    // International format: +XX XXX XXX XXXX
    return `+${digits.slice(0, -10)} ${digits.slice(-10, -7)} ${digits.slice(-7, -4)} ${digits.slice(-4)}`;
  }
  
  return phoneNumber;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Must have at least 10 digits
  return digits.length >= 10;
}