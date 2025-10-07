import { User } from 'firebase/auth';
import logger from '@/utils/logger';
import { checkUserProfile, createUserProfile } from '../userService';
import { extractUserData } from '@/utils/authUtils';
import { processGoogleProfilePic, getDefaultProfilePic } from '@/utils/imageUtils';
import { createDefaultProfile } from '@/utils/profileHelpers';

/**
 * Handle successful social authentication
 * Checks if user profile exists in backend, creates if not
 */
export async function handleSocialAuthSuccess(user: User): Promise<{
    user: User;
    isNewUser: boolean;
}> {
    try {
        logger.debug('Processing social auth for user:', user.uid);

        // Get fresh ID token
        const idToken = await user.getIdToken(true);

        // Check if user profile exists in backend
        const profileExists = await checkUserProfile(idToken);

        if (!profileExists) {
            logger.debug('New social auth user detected, creating profile...');

            // Extract user data from Firebase User object
            const userData = extractUserData(user);

            // Process profile picture
            let profilePic = user.photoURL;

            // Optimize Google profile pictures
            if (profilePic && profilePic.includes('googleusercontent.com')) {
                profilePic = processGoogleProfilePic(profilePic);
            }

            // Use default if no profile picture
            if (!profilePic) {
                profilePic = getDefaultProfilePic(userData.displayName || user.email || 'User');
            }

            // Create default profile structure
            const defaultProfile = createDefaultProfile(
                user.email || '',
                userData.displayName || user.email?.split('@')[0] || 'User'
            );

            // Prepare complete user data for backend
            const completeUserData = {
                ...defaultProfile,
                ...userData,
                uid: user.uid,
                profilePic,
                emailVerified: user.emailVerified,
                providerData: user.providerData.map(provider => ({
                    providerId: provider?.providerId || '',
                    email: provider?.email || user.email || '',
                    federatedId: provider?.uid || '',
                    rawId: provider?.uid || '',
                })),
            };

            // Create user profile in backend
            await createUserProfile(idToken, completeUserData);

            logger.debug('User profile created successfully');

            return {
                user,
                isNewUser: true,
            };
        }

        logger.debug('Existing user profile found');

        return {
            user,
            isNewUser: false,
        };
    } catch (error) {
        logger.error('Error in social auth success handler:', error);
        throw error;
    }
}

/**
 * Update user profile after social auth
 * Used when additional information is needed
 */
export async function updateSocialAuthProfile(
    user: User,
    additionalData: {
        phoneNumber?: string;
        firstName?: string;
        lastName?: string;
    }
): Promise<void> {
    try {
        logger.debug('Updating social auth profile:', user.uid);

        const idToken = await user.getIdToken(true);

        // This would call a backend endpoint to update the profile
        // Implementation depends on your backend API
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

        const response = await fetch(`${API_BASE_URL}/user/update`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(additionalData),
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        logger.debug('Profile updated successfully');
    } catch (error) {
        logger.error('Error updating social auth profile:', error);
        throw error;
    }
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(providerId: string): string {
    switch (providerId) {
        case 'google.com':
            return 'Google';
        case 'facebook.com':
            return 'Facebook';
        case 'twitter.com':
            return 'Twitter';
        case 'apple.com':
            return 'Apple';
        case 'password':
            return 'Email/Password';
        default:
            return providerId;
    }
}

/**
 * Get provider icon/color for UI
 */
export function getProviderInfo(providerId: string): {
    name: string;
    color: string;
    icon: string;
} {
    switch (providerId) {
        case 'google.com':
            return { name: 'Google', color: '#DB4437', icon: 'google' };
        case 'facebook.com':
            return { name: 'Facebook', color: '#4267B2', icon: 'facebook' };
        case 'twitter.com':
            return { name: 'Twitter', color: '#1DA1F2', icon: 'twitter' };
        case 'apple.com':
            return { name: 'Apple', color: '#000000', icon: 'apple' };
        case 'password':
            return { name: 'Email', color: '#666666', icon: 'email' };
        default:
            return { name: providerId, color: '#999999', icon: 'account' };
    }
}