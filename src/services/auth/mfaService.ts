// src/services/auth/mfaService.ts
import {
    multiFactor,
    PhoneAuthProvider,
    PhoneMultiFactorGenerator,
    RecaptchaVerifier,
    MultiFactorError,
    getMultiFactorResolver,
    MultiFactorResolver,
    User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import logger from '@/utils/logger';
import { handleAuthError } from '@/utils/errorHandlers';

/**
 * Initialize reCAPTCHA verifier for phone authentication
 */
export function initializeRecaptchaVerifier(
    containerId: string,
    callbacks?: {
        onSuccess?: () => void;
        onExpired?: () => void;
        onError?: () => void;
    }
): RecaptchaVerifier {
    try {
        logger.debug('Initializing reCAPTCHA verifier for container:', containerId);

        const verifier = new RecaptchaVerifier(auth, containerId, {
            size: 'invisible',
            callback: () => {
                logger.debug('reCAPTCHA verified successfully');
                callbacks?.onSuccess?.();
            },
            'expired-callback': () => {
                logger.warn('reCAPTCHA expired');
                callbacks?.onExpired?.();
            },
            'error-callback': () => {
                logger.error('reCAPTCHA error');
                callbacks?.onError?.();
            },
        });

        return verifier;
    } catch (error) {
        logger.error('Error initializing reCAPTCHA verifier:', error);
        throw error;
    }
}

/**
 * Enroll phone number for MFA
 * FIXED: Now correctly uses multiFactorSession
 */
export async function enrollPhoneMFA(
    phoneNumber: string,
    verifier: RecaptchaVerifier
): Promise<string> {
    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error('No user signed in');
        }

        logger.debug('Starting phone MFA enrollment for:', phoneNumber);

        // Get the multi-factor session - CRITICAL for enrollment
        const multiFactorSession = await multiFactor(user).getSession();
        const phoneAuthProvider = new PhoneAuthProvider(auth);

        // FIXED: Pass session object with phoneNumber for MFA enrollment
        const verificationId = await phoneAuthProvider.verifyPhoneNumber(
            {
                phoneNumber: phoneNumber,
                session: multiFactorSession,
            },
            verifier
        );

        logger.debug('Verification code sent to phone');

        return verificationId;
    } catch (error) {
        logger.error('Error enrolling phone MFA:', error);
        throw handleAuthError(error);
    }
}

/**
 * Complete phone MFA enrollment with verification code
 */
export async function completePhoneMFAEnrollment(
    verificationId: string,
    verificationCode: string,
    displayName: string
): Promise<void> {
    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error('No user signed in');
        }

        logger.debug('Completing phone MFA enrollment');

        const phoneAuthCredential = PhoneAuthProvider.credential(
            verificationId,
            verificationCode
        );

        const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(
            phoneAuthCredential
        );

        await multiFactor(user).enroll(multiFactorAssertion, displayName);

        logger.debug('Phone MFA enrollment completed successfully');
    } catch (error) {
        logger.error('Error completing phone MFA enrollment:', error);
        throw handleAuthError(error);
    }
}

/**
 * Get MFA resolver from error
 */
export function getMFAResolver(error: MultiFactorError): MultiFactorResolver {
    try {
        logger.debug('Creating MFA resolver from error');
        return getMultiFactorResolver(auth, error);
    } catch (err) {
        logger.error('Error creating MFA resolver:', err);
        throw handleAuthError(err);
    }
}

/**
 * Send verification code for MFA challenge (during sign-in)
 */
export async function sendMFAVerificationCode(
    resolver: MultiFactorResolver,
    verifier: RecaptchaVerifier
): Promise<string> {
    try {
        logger.debug('Sending MFA verification code');

        if (resolver.hints.length === 0) {
            throw new Error('No multi-factor authentication methods found');
        }

        const phoneHint = resolver.hints[0];

        if (phoneHint.factorId !== PhoneMultiFactorGenerator.FACTOR_ID) {
            throw new Error('Only phone-based MFA is supported');
        }

        const phoneAuthProvider = new PhoneAuthProvider(auth);
        const verificationId = await phoneAuthProvider.verifyPhoneNumber(
            {
                multiFactorHint: phoneHint,
                session: resolver.session,
            },
            verifier
        );

        logger.debug('MFA verification code sent');
        return verificationId;
    } catch (error) {
        logger.error('Error sending MFA verification code:', error);
        throw handleAuthError(error);
    }
}

/**
 * Complete MFA sign-in with verification code
 */
export async function completeMFASignIn(
    resolver: MultiFactorResolver,
    verificationId: string,
    verificationCode: string
): Promise<User> {
    try {
        logger.debug('Completing MFA sign-in');

        const phoneAuthCredential = PhoneAuthProvider.credential(
            verificationId,
            verificationCode
        );

        const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(
            phoneAuthCredential
        );

        const userCredential = await resolver.resolveSignIn(multiFactorAssertion);

        logger.debug('MFA sign-in completed successfully');
        return userCredential.user;
    } catch (error) {
        logger.error('Error completing MFA sign-in:', error);
        throw handleAuthError(error);
    }
}

/**
 * Unenroll MFA factor
 */
export async function unenrollMFA(factorUid: string): Promise<void> {
    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error('No user signed in');
        }

        logger.debug('Unenrolling MFA factor:', factorUid);

        const enrolledFactors = multiFactor(user).enrolledFactors;
        const factor = enrolledFactors.find(f => f.uid === factorUid);

        if (!factor) {
            throw new Error('MFA factor not found');
        }

        await multiFactor(user).unenroll(factor);

        logger.debug('MFA factor unenrolled successfully');
    } catch (error) {
        logger.error('Error unenrolling MFA:', error);
        throw handleAuthError(error);
    }
}

/**
 * Get enrolled MFA factors for current user
 */
export function getEnrolledMFAFactors(): any[] {
    const user = auth.currentUser;

    if (!user) {
        return [];
    }

    return multiFactor(user).enrolledFactors;
}

/**
 * Check if user has MFA enabled
 */
export function isMFAEnabled(): boolean {
    const factors = getEnrolledMFAFactors();
    return factors.length > 0;
}

/**
 * Get phone number from MFA hint
 */
export function getPhoneNumberFromHint(hint: any): string {
    return hint.phoneNumber || 'Unknown';
}

/**
 * Format phone number for display (mask)
 */
export function formatPhoneNumberMasked(phoneNumber: string): string {
    if (!phoneNumber) return '';

    // Show only last 4 digits
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length <= 4) return phoneNumber;

    return `***-***-${digits.slice(-4)}`;
}