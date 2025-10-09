// src/hooks/auth/useMFA.ts
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { RecaptchaVerifier, MultiFactorResolver, User } from 'firebase/auth';
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
  handleMFAChallenge: (error: any) => Promise<void>;
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
    };
  }, []);

  /**
   * Handle MFA challenge from sign-in error
   */
  const handleMFAChallenge = useCallback(async (mfaError: any) => {
    setLoading(true);
    setError('');

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
        const phoneHint = mfaResolver.hints[0] as any;
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
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
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
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

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
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }
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
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }
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
  factors: any[];
  loading: boolean;
} {
  const [isEnabled, setIsEnabled] = useState(false);
  const [factors, setFactors] = useState<any[]>([]);
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
  // ✅ Add a flag to track if we're retrying after reauth
  const isRetryingAfterReauth = useRef(false);

  /**
   * Start enrollment process
   */
  const startEnrollment = useCallback(async (phoneNumber: string) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setNeedsReauth(false);
    pendingPhoneNumberRef.current = phoneNumber;

    try {
      logger.debug('Starting MFA enrollment for phone:', phoneNumber);

      // Initialize reCAPTCHA
      const verifier = initializeRecaptchaVerifier('recaptcha-container', {
        onError: () => setError('reCAPTCHA verification failed'),
      });

      recaptchaVerifierRef.current = verifier;
      await verifier.verify();

      // Enroll phone
      const vId = await enrollPhoneMFA(phoneNumber, verifier);
      setVerificationId(vId);

      logger.debug('Enrollment initiated, verification code sent');
    } catch (err: any) {

      // ✅ Now we can check err.code because AuthError preserves it
      const errorCode = err?.code || '';

      if (errorCode === 'auth/requires-recent-login') {
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
  }, []);

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
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        }
        pendingPhoneNumberRef.current = '';
        isRetryingAfterReauth.current = false;
      } catch (err) {
        logger.error('MFA enrollment completion error:', err);
        setError(err instanceof Error ? err.message : 'Failed to complete enrollment');
      } finally {
        setLoading(false);
      }
    },
    [verificationId]
  );

  /**
   * Clear reauthentication flag and retry enrollment
   */
  const clearReauthFlag = useCallback(() => {
    logger.debug('Clearing reauth flag and retrying enrollment');

    // ✅ Set flag to indicate we're retrying after reauth
    isRetryingAfterReauth.current = true;

    setNeedsReauth(false);
    setError('');

    // ✅ Use setTimeout to ensure state updates have completed
    setTimeout(() => {
      const phoneNumber = pendingPhoneNumberRef.current;
      if (phoneNumber) {
        logger.debug('Retrying enrollment after successful reauthentication');
        startEnrollment(phoneNumber);
      } else {
        logger.warn('No phone number stored for retry after reauth');
        isRetryingAfterReauth.current = false;
      }
    }, 100);
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
    isRetryingAfterReauth.current = false;

    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      } catch (e) {
        logger.warn('Failed to clear recaptcha verifier:', e);
      }
    }
  }, []);

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