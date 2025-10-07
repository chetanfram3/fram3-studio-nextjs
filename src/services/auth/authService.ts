import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    User,
    updateProfile,
    sendEmailVerification
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { RegisterData } from '@/types/auth';
import { registerUser } from './registerService';
import { handleAuthError } from '@/utils/errorHandlers';
import logger from '@/utils/logger';

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
    try {
        logger.debug('Attempting email sign in for:', email);

        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        logger.debug('Sign in successful:', userCredential.user.uid);
        return userCredential.user;
    } catch (error) {
        logger.error('Email sign-in error:', error);
        throw handleAuthError(error);
    }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
    try {
        logger.debug('Signing out user');
        await firebaseSignOut(auth);
        logger.debug('Sign out successful');
    } catch (error) {
        logger.error('Sign-out error:', error);
        throw handleAuthError(error);
    }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
    try {
        logger.debug('Sending password reset email to:', email);

        await sendPasswordResetEmail(auth, email, {
            url: `${window.location.origin}/signin`,
            handleCodeInApp: false,
        });

        logger.debug('Password reset email sent successfully');
    } catch (error) {
        logger.error('Password reset error:', error);
        throw handleAuthError(error);
    }
}

/**
 * Update user profile
 */
export async function updateUserProfile(user: User, data: {
    displayName?: string;
    photoURL?: string;
}): Promise<void> {
    try {
        logger.debug('Updating user profile:', user.uid);

        await updateProfile(user, data);

        logger.debug('Profile updated successfully');
    } catch (error) {
        logger.error('Profile update error:', error);
        throw handleAuthError(error);
    }
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(user: User): Promise<void> {
    try {
        logger.debug('Sending verification email to:', user.email);

        await sendEmailVerification(user, {
            url: `${window.location.origin}/dashboard`,
            handleCodeInApp: false,
        });

        logger.debug('Verification email sent successfully');
    } catch (error) {
        logger.error('Verification email error:', error);
        throw handleAuthError(error);
    }
}

/**
 * Get current user ID token
 */
export async function getCurrentUserToken(forceRefresh = false): Promise<string | null> {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return null;
        }

        const token = await currentUser.getIdToken(forceRefresh);
        return token;
    } catch (error) {
        logger.error('Token retrieval error:', error);
        throw handleAuthError(error);
    }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return !!auth.currentUser;
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

// Re-export registerUser from registerService
export { registerUser };