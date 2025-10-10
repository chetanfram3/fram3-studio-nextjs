// src/services/auth/phoneLinkingService.ts
import {
  linkWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import logger from '@/utils/logger';
import { handleAuthError } from '@/utils/errorHandlers';

/**
 * Initialize reCAPTCHA for phone linking
 */
export function initializePhoneLinkingRecaptcha(
  containerId: string,
  callbacks?: {
    onSuccess?: () => void;
    onExpired?: () => void;
    onError?: () => void;
  }
): RecaptchaVerifier {
  try {
    logger.debug('Initializing reCAPTCHA for phone linking');

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
        logger.debug('reCAPTCHA verified for phone linking');
        callbacks?.onSuccess?.();
      },
      'expired-callback': () => {
        logger.warn('reCAPTCHA expired for phone linking');
        callbacks?.onExpired?.();
      },
      'error-callback': () => {
        logger.error('reCAPTCHA error for phone linking');
        callbacks?.onError?.();
      },
    });

    return verifier;
  } catch (error) {
    logger.error('Error initializing phone linking reCAPTCHA:', error);
    throw error;
  }
}

/**
 * Send verification code to link phone number to account
 */
export async function sendPhoneLinkingCode(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No user signed in');
    }

    logger.debug('Sending phone linking code to:', phoneNumber);

    // Check if phone is already linked
    const phoneProvider = user.providerData.find(
      (provider) => provider.providerId === 'phone'
    );

    if (phoneProvider) {
      throw new Error('A phone number is already linked to this account. Please unlink it first.');
    }

    const confirmationResult = await linkWithPhoneNumber(
      user,
      phoneNumber,
      verifier
    );

    logger.debug('Phone linking code sent successfully');
    return confirmationResult;
  } catch (error: unknown) {
    logger.error('Error sending phone linking code:', error);

    const firebaseError = error as { code?: string };

    if (firebaseError?.code === 'auth/provider-already-linked') {
      throw new Error('This phone number is already linked to your account.');
    }

    if (firebaseError?.code === 'auth/credential-already-in-use') {
      throw new Error('This phone number is already in use by another account.');
    }

    throw handleAuthError(error);
  }
}

/**
 * Verify code and complete phone linking
 */
export async function verifyPhoneLinkingCode(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<User> {
  try {
    logger.debug('Verifying phone linking code');

    const userCredential = await confirmationResult.confirm(code);

    logger.debug('Phone number linked successfully');
    return userCredential.user;
  } catch (error: unknown) {
    logger.error('Error verifying phone linking code:', error);

    const firebaseError = error as { code?: string };

    if (firebaseError?.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid verification code. Please try again.');
    }

    if (firebaseError?.code === 'auth/code-expired') {
      throw new Error('Verification code expired. Please request a new code.');
    }

    throw handleAuthError(error);
  }
}

/**
 * Unlink phone number from account
 */
export async function unlinkPhoneNumber(): Promise<User> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No user signed in');
    }

    logger.debug('Unlinking phone number');

    const { unlink } = await import('firebase/auth');
    const updatedUser = await unlink(user, 'phone');

    logger.debug('Phone number unlinked successfully');
    return updatedUser;
  } catch (error: unknown) {
    logger.error('Error unlinking phone number:', error);

    const firebaseError = error as { code?: string };

    if (firebaseError?.code === 'auth/no-such-provider') {
      throw new Error('No phone number is linked to this account.');
    }

    throw handleAuthError(error);
  }
}

/**
 * Clean up phone linking reCAPTCHA
 */
export function cleanupPhoneLinkingRecaptcha(verifier: RecaptchaVerifier | null): void {
  if (verifier) {
    try {
      verifier.clear();
      logger.debug('Phone linking reCAPTCHA cleaned up');
    } catch (error) {
      logger.warn('Error cleaning up phone linking reCAPTCHA:', error);
    }
  }
}