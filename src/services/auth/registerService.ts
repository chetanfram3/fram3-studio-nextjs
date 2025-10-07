import { createUserWithEmailAndPassword, User, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { RegisterData } from '@/types/auth';
import { handleAuthError } from '@/utils/errorHandlers';
import { createUserProfile } from '../userService';
import { getDefaultProfilePic } from '@/utils/imageUtils';
import { createDefaultProfile } from '@/utils/profileHelpers';
import logger from '@/utils/logger';

/**
 * Register a new user with email and password
 * Creates both Firebase auth user and backend profile
 */
export async function registerUser(data: RegisterData): Promise<{ user: User }> {
    try {
        logger.debug('Starting registration for:', data.email);

        // Step 1: Create Firebase authentication user
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
        );

        const firebaseUser = userCredential.user;
        logger.debug('Firebase user created:', firebaseUser.uid);

        // Step 2: Prepare display name
        const displayName = data.displayName || `${data.firstName} ${data.lastName}`.trim();

        // Step 3: Get default profile picture
        const profilePic = getDefaultProfilePic(displayName);

        // Step 4: Update Firebase profile with display name and photo
        try {
            await updateProfile(firebaseUser, {
                displayName,
                photoURL: profilePic,
            });
            logger.debug('Firebase profile updated');
        } catch (profileError) {
            logger.warn('Failed to update Firebase profile, continuing...', profileError);
        }

        // Step 5: Get fresh ID token for backend authentication
        const idToken = await firebaseUser.getIdToken(true);

        // Step 6: Create default profile data
        const defaultProfile = createDefaultProfile(data.email, displayName);

        // Step 7: Prepare complete user data for backend
        const userData = {
            ...defaultProfile,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            displayName,
            profilePic,
            uid: firebaseUser.uid,
            emailVerified: firebaseUser.emailVerified,
            providerData: [
                {
                    providerId: 'password',
                    email: data.email,
                },
            ],
        };

        // Step 8: Create user profile in backend
        try {
            await createUserProfile(idToken, userData);
            logger.debug('Backend profile created successfully');
        } catch (backendError) {
            logger.error('Backend profile creation failed:', backendError);
            // Note: User is created in Firebase but not in backend
            // The profile will be created on next login via social auth handler
            logger.warn('User created in Firebase but backend profile failed. Will retry on login.');
        }

        logger.debug('Registration completed successfully');

        return {
            user: firebaseUser,
        };
    } catch (error) {
        logger.error('Registration error:', error);
        throw handleAuthError(error);
    }
}

/**
 * Validate registration data before submission
 */
export function validateRegistrationData(data: RegisterData): {
    isValid: boolean;
    errors: Record<string, string>;
} {
    const errors: Record<string, string> = {};

    // Validate first name
    if (!data.firstName || data.firstName.trim().length < 2) {
        errors.firstName = 'First name must be at least 2 characters';
    }

    // Validate last name
    if (!data.lastName || data.lastName.trim().length < 2) {
        errors.lastName = 'Last name must be at least 2 characters';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        errors.email = 'Please enter a valid email address';
    }

    // Validate phone number (basic)
    if (!data.phoneNumber) {
        errors.phoneNumber = 'Phone number is required';
    } else {
        const phoneDigits = data.phoneNumber.replace(/\D/g, '');
        if (phoneDigits.length < 10 || phoneDigits.length > 15) {
            errors.phoneNumber = 'Please enter a valid phone number';
        }
    }

    // Validate password
    if (!data.password || data.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
    } else {
        if (!/\d/.test(data.password)) {
            errors.password = 'Password must contain at least one number';
        } else if (!/[!@#$%^&*]/.test(data.password)) {
            errors.password = 'Password must contain at least one special character';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}