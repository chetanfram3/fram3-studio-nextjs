import {
    GoogleAuthProvider,
    FacebookAuthProvider,
    TwitterAuthProvider,
    OAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { SocialProvider } from '@/types/auth';
import { handleSocialAuthSuccess } from './socialAuth';
import { handleAuthError } from '@/utils/errorHandlers';
import { useAuthStore } from '@/store/authStore';
import logger from '@/utils/logger';

/**
 * Get provider instance based on provider type
 */
function getProvider(providerType: SocialProvider) {
    switch (providerType) {
        case 'google':
            const googleProvider = new GoogleAuthProvider();
            googleProvider.setCustomParameters({
                prompt: 'select_account',
            });
            googleProvider.addScope('profile');
            googleProvider.addScope('email');
            return googleProvider;

        case 'facebook':
            const facebookProvider = new FacebookAuthProvider();
            facebookProvider.addScope('email');
            facebookProvider.addScope('public_profile');
            return facebookProvider;

        case 'twitter':
            const twitterProvider = new TwitterAuthProvider();
            return twitterProvider;

        case 'apple':
            const appleProvider = new OAuthProvider('apple.com');
            appleProvider.addScope('email');
            appleProvider.addScope('name');
            return appleProvider;

        default:
            throw new Error(`Unsupported provider: ${providerType}`);
    }
}

/**
 * Handle social sign in with popup (preferred method)
 * IMPORTANT: MFA errors are NOT caught here - they bubble up to the caller
 */
export async function handleSocialSignIn(
    providerType: SocialProvider,
    useRedirect = false
): Promise<{ user: User; isNewUser: boolean }> {
    const authStore = useAuthStore.getState();
    authStore.reset();

    try {
        authStore.setLoading(true);
        logger.debug(`Initiating ${providerType} sign in...`);

        const provider = getProvider(providerType);

        let result;

        if (useRedirect) {
            // Use redirect method (better for mobile)
            await signInWithRedirect(auth, provider);
            // The actual result will be handled by checkRedirectResult
            return { user: null as any, isNewUser: false };
        } else {
            // Use popup method (better for desktop)
            result = await signInWithPopup(auth, provider);
        }

        logger.debug('Social sign in successful:', result.user.uid);

        // Handle profile creation/checking
        const { user, isNewUser } = await handleSocialAuthSuccess(result.user);

        // Get fresh token after profile creation
        await user.getIdToken(true);

        // Update auth store
        authStore.setUser(user);
        authStore.setProfileLoaded(true);
        authStore.setError(null);

        logger.debug(`${providerType} sign in completed, isNewUser: ${isNewUser}`);

        return { user, isNewUser };
    } catch (error: any) {
        // CRITICAL: If it's an MFA error, re-throw it as-is so the UI can handle it
        if (error.code === 'auth/multi-factor-auth-required') {
            logger.debug('MFA required - re-throwing error for UI handling');
            throw error; // Re-throw the original Firebase error with code intact
        }
        // For other errors, handle normally
        logger.error('Social sign in error:', error);
        authStore.setError(error instanceof Error ? error.message : 'Social sign in failed');
        authStore.setUser(null);
        authStore.setProfileLoaded(false);
        authStore.setLoading(false);
        throw handleAuthError(error);
    }
}

/**
 * Check for redirect result (call this on app initialization)
 */
export async function checkRedirectResult(): Promise<{
    user: User;
    isNewUser: boolean;
} | null> {
    try {
        logger.debug('Checking for redirect result...');

        const result = await getRedirectResult(auth);

        if (!result) {
            logger.debug('No redirect result found');
            return null;
        }

        logger.debug('Redirect result found:', result.user.uid);

        // Handle profile creation/checking
        const { user, isNewUser } = await handleSocialAuthSuccess(result.user);

        // Get fresh token after profile creation
        await user.getIdToken(true);

        // Update auth store
        const authStore = useAuthStore.getState();
        authStore.setUser(user);
        authStore.setProfileLoaded(true);
        authStore.setError(null);

        return { user, isNewUser };
    } catch (error) {
        logger.error('Error checking redirect result:', error);
        throw handleAuthError(error);
    }
}

/**
 * Convenience functions for specific providers
 */
export const handleGoogleSignIn = (useRedirect = false) =>
    handleSocialSignIn('google', useRedirect);

export const handleFacebookSignIn = (useRedirect = false) =>
    handleSocialSignIn('facebook', useRedirect);

export const handleTwitterSignIn = (useRedirect = false) =>
    handleSocialSignIn('twitter', useRedirect);

export const handleAppleSignIn = (useRedirect = false) =>
    handleSocialSignIn('apple', useRedirect);

/**
 * Link social provider to existing account
 */
export async function linkSocialProvider(
    providerType: SocialProvider
): Promise<User> {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            throw new Error('No user signed in');
        }

        logger.debug(`Linking ${providerType} provider to user:`, currentUser.uid);

        const provider = getProvider(providerType);
        const result = await signInWithPopup(auth, provider);

        logger.debug('Provider linked successfully');

        return result.user;
    } catch (error) {
        logger.error('Provider linking error:', error);
        throw handleAuthError(error);
    }
}

/**
 * Get list of enabled providers for current user
 */
export function getEnabledProviders(): string[] {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return [];
    }

    return currentUser.providerData.map(provider => provider.providerId);
}

/**
 * Check if specific provider is linked
 */
export function isProviderLinked(providerId: string): boolean {
    const providers = getEnabledProviders();
    return providers.includes(providerId);
}