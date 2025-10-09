// src/services/auth/reauthService.ts
import {
    reauthenticateWithCredential,
    EmailAuthProvider,
    reauthenticateWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    TwitterAuthProvider,
    User,
    AuthCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import logger from '@/utils/logger';
import { handleAuthError } from '@/utils/errorHandlers';

/**
 * Reauthenticate user with email and password
 */
export async function reauthenticateWithPassword(
    password: string
): Promise<User> {
    try {
        const user = auth.currentUser;

        if (!user || !user.email) {
            throw new Error('No user signed in or email not available');
        }

        logger.debug('Reauthenticating user with password');

        const credential = EmailAuthProvider.credential(user.email, password);
        const result = await reauthenticateWithCredential(user, credential);

        logger.debug('Reauthentication successful');
        return result.user;
    } catch (error: any) {
        // ✅ Don't transform MFA errors - let them bubble up
        if (error?.code === 'auth/multi-factor-auth-required') {
            logger.debug('MFA required during password reauthentication');
            throw error;
        }
        logger.error('Reauthentication error:', error);
        throw handleAuthError(error);
    }
}

/**
 * Reauthenticate user with their social provider
 */
export async function reauthenticateWithProvider(
    providerId: string
): Promise<User> {
    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error('No user signed in');
        }

        logger.debug('Reauthenticating user with provider:', providerId);

        let provider;
        switch (providerId) {
            case 'google.com':
                provider = new GoogleAuthProvider();
                break;
            case 'facebook.com':
                provider = new FacebookAuthProvider();
                break;
            case 'twitter.com':
                provider = new TwitterAuthProvider();
                break;
            default:
                throw new Error(`Unsupported provider: ${providerId}`);
        }

        const result = await reauthenticateWithPopup(user, provider);

        logger.debug('Reauthentication successful');
        return result.user;
    } catch (error: any) {
        // ✅ Don't transform MFA errors - let them bubble up
        if (error?.code === 'auth/multi-factor-auth-required') {
            logger.debug('MFA required during provider reauthentication');
            throw error;
        }
        logger.error('Reauthentication error:', error);
        throw handleAuthError(error);
    }
}

/**
 * Get user's primary sign-in method
 */
export function getUserSignInMethod(): {
    method: 'password' | 'google.com' | 'facebook.com' | 'twitter.com' | 'unknown';
    providerId: string;
} {
    const user = auth.currentUser;

    if (!user || !user.providerData || user.providerData.length === 0) {
        return { method: 'unknown', providerId: '' };
    }

    // Get the first provider (primary sign-in method)
    const primaryProvider = user.providerData[0];
    const providerId = primaryProvider.providerId;

    if (providerId === 'password') {
        return { method: 'password', providerId };
    } else if (providerId === 'google.com') {
        return { method: 'google.com', providerId };
    } else if (providerId === 'facebook.com') {
        return { method: 'facebook.com', providerId };
    } else if (providerId === 'twitter.com') {
        return { method: 'twitter.com', providerId };
    }

    return { method: 'unknown', providerId };
}

/**
 * Check if reauthentication is needed
 * Returns true if last sign-in was more than 5 minutes ago
 */
export function needsReauthentication(): boolean {
    const user = auth.currentUser;

    if (!user || !user.metadata.lastSignInTime) {
        return false;
    }

    const lastSignIn = new Date(user.metadata.lastSignInTime).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return (now - lastSignIn) > fiveMinutes;
}

/**
 * Get time since last authentication
 */
export function getTimeSinceLastAuth(): number | null {
    const user = auth.currentUser;

    if (!user || !user.metadata.lastSignInTime) {
        return null;
    }

    const lastSignIn = new Date(user.metadata.lastSignInTime).getTime();
    const now = Date.now();

    return now - lastSignIn;
}