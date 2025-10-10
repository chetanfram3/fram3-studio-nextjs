// src/hooks/auth/useMFA.ts
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { RecaptchaVerifier, MultiFactorResolver, User, MultiFactorError } from 'firebase/auth';
import {
  initializeRecaptchaVerifier,
  getMFAResolver,
  sendMFAVerificationCode,
  completeMFASignIn,
  getEnrolledMFAFactors,
  isMFAEnabled as checkMFAEnabled,
  enrollPhoneMFA,
  completePhoneMFAEnrollment,
  formatPhoneNumberMasked,
  unenrollMFA,
  clearRecaptchaContainer
} from '@/services/auth/mfaService';
import logger from '@/utils/logger';

interface UseMFAReturn {
  isOpen: boolean;
  verificationId: string;
  verificationCode: string;
  error: string;
  loading: boolean;
  phoneNumber: string;
  setVerificationCode: (code: string) => void;
  handleMFAChallenge: (error: MultiFactorError) => Promise<void>;
  handleMFAVerification: () => Promise<User | null>;
  closeDialog: () => void;
  reset: () => void;
}

/**
 * Custom hook for MFA (Multi-Factor Authentication) management
 */
export function useMFA(): UseMFAReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Initialize reCAPTCHA container
   */
  useEffect(() => {
    // Create container if it doesn't exist
    let container = document.getElementById('recaptcha-container') as HTMLDivElement;

    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      container.style.display = 'none';
      document.body.appendChild(container);
      recaptchaContainerRef.current = container;
      logger.debug('MFA reCAPTCHA container created');
    } else {
      recaptchaContainerRef.current = container;
    }

    return () => {
      // Cleanup
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (e) {
          logger.warn('Failed to clear reCAPTCHA verifier:', e);
        }
      }
      // Clear container content
      clearRecaptchaContainer('recaptcha-container');
    };
  }, []);

  /**
   * Handle MFA challenge from sign-in error
   */
  const handleMFAChallenge = useCallback(async (mfaError: MultiFactorError) => {
    setLoading(true);
    setError('');

    // ✅ Clean up any existing reCAPTCHA
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      } catch (e) {
        logger.warn('Failed to clear existing reCAPTCHA:', e);
      }
    }
    clearRecaptchaContainer('recaptcha-container');

    try {
      logger.debug('Handling MFA challenge');

      // Get resolver from error
      const mfaResolver = getMFAResolver(mfaError);
      setResolver(mfaResolver);

      // Initialize reCAPTCHA verifier
      const verifier = initializeRecaptchaVerifier('recaptcha-container', {
        onError: () => {
          setError('reCAPTCHA verification failed. Please try again.');
          setIsOpen(false);
        },
        onExpired: () => {
          setError('reCAPTCHA expired. Please try again.');
          setIsOpen(false);
        },
      });

      recaptchaVerifierRef.current = verifier;

      // Verify reCAPTCHA
      await verifier.verify();

      // Send verification code
      const vId = await sendMFAVerificationCode(mfaResolver, verifier);
      setVerificationId(vId);

      // Extract phone number from hint
      if (mfaResolver.hints.length > 0) {
        const phoneHint = mfaResolver.hints[0] as { phoneNumber?: string };
        const maskedPhone = formatPhoneNumberMasked(phoneHint.phoneNumber || '');
        setPhoneNumber(maskedPhone);
      }

      setIsOpen(true);
      logger.debug('MFA challenge initiated, dialog opened');
    } catch (err) {
      logger.error('MFA challenge error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to initiate multi-factor authentication'
      );

      // Cleanup verifier on error
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (e) {
          logger.warn('Failed to clear reCAPTCHA on error:', e);
        }
      }
      clearRecaptchaContainer('recaptcha-container');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verify MFA code and complete sign-in
   */
  const handleMFAVerification = useCallback(async (): Promise<User | null> => {
    if (!resolver || !verificationId || !verificationCode) {
      setError('Missing verification information');
      return null;
    }

    setLoading(true);
    setError('');

    try {
      logger.debug('Verifying MFA code');

      const user = await completeMFASignIn(resolver, verificationId, verificationCode);

      logger.debug('MFA verification successful');

      // Cleanup
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (e) {
          logger.warn('Failed to clear reCAPTCHA after verification:', e);
        }
      }
      clearRecaptchaContainer('recaptcha-container');

      setIsOpen(false);
      setVerificationCode('');
      setVerificationId('');
      setResolver(null);

      return user;
    } catch (err) {
      logger.error('MFA verification error:', err);
      setError(
        err instanceof Error && err.message.includes('invalid-verification-code')
          ? 'Invalid verification code. Please try again.'
          : 'Failed to verify code. Please try again.'
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [resolver, verificationId, verificationCode]);

  /**
   * Close MFA dialog
   */
  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setVerificationCode('');
    setError('');

    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      } catch (e) {
        logger.warn('Failed to clear reCAPTCHA on close:', e);
      }
    }
    clearRecaptchaContainer('recaptcha-container');
  }, []);

  /**
   * Reset all MFA state
   */
  const reset = useCallback(() => {
    setIsOpen(false);
    setVerificationId('');
    setVerificationCode('');
    setError('');
    setLoading(false);
    setPhoneNumber('');
    setResolver(null);

    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      } catch (e) {
        logger.warn('Failed to clear reCAPTCHA on reset:', e);
      }
    }
    clearRecaptchaContainer('recaptcha-container');
  }, []);

  return {
    isOpen,
    verificationId,
    verificationCode,
    error,
    loading,
    phoneNumber,
    setVerificationCode,
    handleMFAChallenge,
    handleMFAVerification,
    closeDialog,
    reset,
  };
}

/**
 * Hook to check if MFA is enabled for current user
 */
export function useIsMFAEnabled(): {
  isEnabled: boolean;
  factors: unknown[];
  loading: boolean;
} {
  const [isEnabled, setIsEnabled] = useState(false);
  const [factors, setFactors] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const enabled = checkMFAEnabled();
      const enrolledFactors = getEnrolledMFAFactors();

      setIsEnabled(enabled);
      setFactors(enrolledFactors);
    } catch (error) {
      logger.error('Error checking MFA status:', error);
      setIsEnabled(false);
      setFactors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isEnabled,
    factors,
    loading,
  };
}

/**
 * Hook for MFA enrollment with reauthentication support
 */
export function useMFAEnrollment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const pendingPhoneNumberRef = useRef<string>('');
  const containerIdRef = useRef<string>('recaptcha-container-enrollment'); // ✅ Unique base ID
  const attemptCounterRef = useRef<number>(0); // ✅ Track attempts

  /**
   * Generate a unique container ID for each attempt
   */
  const getUniqueContainerId = useCallback(() => {
    attemptCounterRef.current += 1;
    return `${containerIdRef.current}-${Date.now()}-${attemptCounterRef.current}`;
  }, []);

  /**
   * Clean up reCAPTCHA verifier and remove container
   */
  const cleanupRecaptcha = useCallback((containerId?: string) => {
    // Clear verifier
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
        logger.debug('reCAPTCHA verifier cleaned up');
      } catch (e) {
        logger.warn('Failed to clear reCAPTCHA verifier:', e);
      }
    }

    // Remove the specific container if provided
    if (containerId) {
      const container = document.getElementById(containerId);
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
        logger.debug('reCAPTCHA container removed:', containerId);
      }
    }

    // Also clean up any orphaned containers
    const orphanedContainers = document.querySelectorAll('[id^="recaptcha-container-enrollment"]');
    orphanedContainers.forEach((container) => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });
  }, []);

  /**
   * Create a fresh container for reCAPTCHA
   */
  const createFreshContainer = useCallback((containerId: string): HTMLDivElement => {
    // Remove existing container if it exists
    const existing = document.getElementById(containerId);
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    // Create new container
    const container = document.createElement('div');
    container.id = containerId;
    container.style.display = 'none';
    document.body.appendChild(container);
    logger.debug('Fresh reCAPTCHA container created:', containerId);

    return container;
  }, []);

  /**
   * Start enrollment process
   */
  const startEnrollment = useCallback(async (phoneNumber: string) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setNeedsReauth(false);
    pendingPhoneNumberRef.current = phoneNumber;

    // Generate unique container ID for this attempt
    const containerId = getUniqueContainerId();

    // Clean up any previous attempts
    cleanupRecaptcha();

    try {
      logger.debug('Starting MFA enrollment for phone:', phoneNumber);

      // ✅ CREATE THE FRESH CONTAINER FIRST
      createFreshContainer(containerId);

      // Initialize reCAPTCHA with the unique container
      const verifier = initializeRecaptchaVerifier(containerId, {
        onError: () => {
          setError('reCAPTCHA verification failed');
          cleanupRecaptcha(containerId);
        },
      });

      recaptchaVerifierRef.current = verifier;

      // Verify reCAPTCHA
      await verifier.verify();

      // Enroll phone
      const vId = await enrollPhoneMFA(phoneNumber, verifier);
      setVerificationId(vId);

      logger.debug('Enrollment initiated, verification code sent');
    } catch (err: unknown) {
      // Clean up reCAPTCHA on error
      cleanupRecaptcha(containerId);

      const firebaseError = err as { code?: string };

      if (firebaseError?.code === 'auth/requires-recent-login') {
        logger.debug('Reauthentication required - detected from error code');
        setNeedsReauth(true);
        setError('Please verify your identity to continue.');
      } else {
        logger.error('MFA enrollment error:', err);
        setError(err instanceof Error ? err.message : 'Failed to start enrollment');
      }
    } finally {
      setLoading(false);
    }
  }, [getUniqueContainerId, cleanupRecaptcha, createFreshContainer]);


  /**
   * Complete enrollment with verification code
   */
  const completeEnrollment = useCallback(
    async (code: string, displayName: string) => {
      if (!verificationId) {
        setError('No verification ID available');
        return;
      }

      setLoading(true);
      setError('');

      try {
        logger.debug('Completing MFA enrollment');

        await completePhoneMFAEnrollment(verificationId, code, displayName);

        setSuccess(true);
        logger.debug('MFA enrollment completed successfully');

        // Cleanup
        cleanupRecaptcha();
        pendingPhoneNumberRef.current = '';
      } catch (err) {
        logger.error('MFA enrollment completion error:', err);
        setError(err instanceof Error ? err.message : 'Failed to complete enrollment');
      } finally {
        setLoading(false);
      }
    },
    [verificationId, cleanupRecaptcha]
  );

  /**
   * Clear reauthentication flag and retry enrollment
   */
  const clearReauthFlag = useCallback(() => {
    setNeedsReauth(false);
    setError('');

    // Retry enrollment with stored phone number if available
    const phoneNumber = pendingPhoneNumberRef.current;
    if (phoneNumber) {
      logger.debug('Retrying enrollment after reauthentication');
      // ✅ Longer delay to ensure Firebase internal state is clean
      setTimeout(() => {
        startEnrollment(phoneNumber);
      }, 500); // Increased from 100ms to 500ms
    }
  }, [startEnrollment]);

  /**
   * Reset enrollment state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError('');
    setVerificationId('');
    setSuccess(false);
    setNeedsReauth(false);
    pendingPhoneNumberRef.current = '';
    attemptCounterRef.current = 0;

    cleanupRecaptcha();
  }, [cleanupRecaptcha]);

  return {
    loading,
    error,
    verificationId,
    success,
    needsReauth,
    startEnrollment,
    completeEnrollment,
    reset,
    clearReauthFlag,
  };
}

/**
 * Hook for MFA removal with reauthentication support
 */
export function useMFARemoval() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);

  const pendingFactorRef = useRef<{ uid: string; displayName: string } | null>(null);

  /**
   * Start removal process
   */
  const startRemoval = useCallback(async (factorUid: string, displayName: string) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setNeedsReauth(false);
    pendingFactorRef.current = { uid: factorUid, displayName };

    try {
      logger.debug('Removing MFA factor:', factorUid);

      await unenrollMFA(factorUid);

      setSuccess(true);
      logger.debug('MFA factor removed successfully');
      pendingFactorRef.current = null;
    } catch (err: unknown) {
      // Only log as debug if it's the expected reauth error, otherwise log as error
      const firebaseError = err as { code?: string };

      if (firebaseError?.code === 'auth/requires-recent-login') {
        logger.debug('Reauthentication required for MFA removal');
        setNeedsReauth(true);
        setError('Please verify your identity to continue.');
      } else {
        logger.error('MFA removal error:', err);
        setError(err instanceof Error ? err.message : 'Failed to remove MFA factor');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear reauthentication flag and retry removal
   */
  const clearReauthFlag = useCallback(() => {
    setNeedsReauth(false);
    setError('');

    // Retry removal with stored factor if available
    const factor = pendingFactorRef.current;
    if (factor) {
      logger.debug('Retrying MFA removal after reauthentication');
      // Small delay to ensure reauthentication has propagated
      setTimeout(() => {
        startRemoval(factor.uid, factor.displayName);
      }, 100);
    }
  }, [startRemoval]);

  /**
   * Reset removal state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError('');
    setSuccess(false);
    setNeedsReauth(false);
    pendingFactorRef.current = null;
  }, []);

  return {
    loading,
    error,
    success,
    needsReauth,
    startRemoval,
    reset,
    clearReauthFlag,
  };
}