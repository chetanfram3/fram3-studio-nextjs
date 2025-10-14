import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import logger from '@/utils/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const INTERNAL_API_KEY = process.env.NEXT_PUBLIC_INTERNAL_API_KEY;

export interface ImpersonationResponse {
    token: string;
    targetUser: {
        uid: string;
        email: string;
        displayName: string | null;
    };
}

/**
 * Start impersonating another user (Admin only)
 * Requires INTERNAL_API_KEY
 */
export async function startImpersonation(targetUserId: string): Promise<ImpersonationResponse> {
    try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
            throw new Error('Authentication required');
        }

        logger.debug('Starting impersonation for user:', targetUserId);

        const response = await fetch(`${API_BASE_URL}/internal/impersonation/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Internal-Key': INTERNAL_API_KEY || '',
            },
            body: JSON.stringify({ targetUserId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to start impersonation');
        }

        const result = await response.json();

        // Sign in with custom token
        await signInWithCustomToken(auth, result.token);

        logger.debug('Impersonation started successfully');

        return result;
    } catch (error) {
        logger.error('Error starting impersonation:', error);
        throw error;
    }
}

/**
 * Stop impersonating and return to original user
 */
export async function stopImpersonation(): Promise<void> {
    try {
        logger.debug('Stopping impersonation');

        // Sign out to trigger re-auth with original user
        await auth.signOut();

        logger.debug('Impersonation stopped successfully');
    } catch (error) {
        logger.error('Error stopping impersonation:', error);
        throw error;
    }
}

/**
 * Check if currently impersonating
 * This would need to be tracked in your backend/state
 */
export function isImpersonating(): boolean {
    // Implementation depends on how you track impersonation state
    // Could be a custom claim in the JWT or a flag in your store
    return false;
}

/**
 * Get impersonation info
 */
export async function getImpersonationInfo(): Promise<{
    isImpersonating: boolean;
    originalUser?: string;
    targetUser?: string;
} | null> {
    try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
            return null;
        }

        const response = await fetch(`${API_BASE_URL}/internal/impersonation/info`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        logger.error('Error getting impersonation info:', error);
        return null;
    }
}