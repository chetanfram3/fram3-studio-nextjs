// src/services/consentService.ts

import { auth } from '@/lib/firebase';
import { API_BASE_URL } from '@/config/constants';
import logger from '@/utils/logger';
import type { ConsentPreferences, ConsentUpdatePayload } from '@/types/consent';

/**
 * Update user consent preferences in backend
 * Generic API that handles all consent types (cookies, terms, privacy)
 * 
 * @param preferences - Consent preferences to update
 * @returns Promise that resolves when update is complete
 * @throws Error if update fails or user is not authenticated
 */
export async function updateConsentPreferences(
    preferences: ConsentPreferences
): Promise<void> {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error('No authentication token available');
    }

    logger.debug('Updating consent preferences', preferences);

    const payload: ConsentUpdatePayload = {
        consentPreferences: preferences
    };

    const response = await fetch(`${API_BASE_URL}/user/consent`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({
            message: 'Failed to update consent preferences'
        }));
        logger.error('Failed to update consent preferences:', error);
        throw new Error(error.message || 'Failed to update consent preferences');
    }

    const data = await response.json();
    logger.debug('Consent preferences updated successfully', data);
}

/**
 * Get user consent preferences from backend
 * Fetches the full user profile and extracts consent preferences
 * 
 * @returns Promise with consent preferences or null if not found
 */
export async function getConsentPreferences(): Promise<ConsentPreferences | null> {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        logger.debug('No authentication token, cannot fetch consent preferences');
        return null;
    }

    try {
        logger.debug('Fetching consent preferences from profile');

        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            logger.warn('Failed to fetch profile for consent preferences');
            return null;
        }

        const data = await response.json();
        const consentPrefs = data.data?.extendedInfo?.details?.consentPreferences;

        if (consentPrefs) {
            logger.debug('Consent preferences retrieved from profile');
            return consentPrefs;
        }

        logger.debug('No consent preferences found in profile');
        return null;
    } catch (error) {
        logger.error('Error fetching consent preferences:', error);
        return null;
    }
}

/**
 * Delete user consent preferences
 * Removes all consent preferences from user profile
 * 
 * @returns Promise that resolves when deletion is complete
 * @throws Error if deletion fails or user is not authenticated
 */
export async function deleteConsentPreferences(): Promise<void> {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error('No authentication token available');
    }

    logger.debug('Deleting consent preferences');

    const response = await fetch(`${API_BASE_URL}/user/consent`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({
            message: 'Failed to delete consent preferences'
        }));
        logger.error('Failed to delete consent preferences:', error);
        throw new Error(error.message || 'Failed to delete consent preferences');
    }

    logger.debug('Consent preferences deleted successfully');
}

/**
 * Batch update multiple consent types at once
 * Useful when user accepts terms, privacy, and cookies together
 * 
 * @param preferences - Multiple consent preferences to update
 * @returns Promise that resolves when all updates are complete
 */
export async function batchUpdateConsent(
    preferences: ConsentPreferences
): Promise<void> {
    return updateConsentPreferences(preferences);
}

/**
 * Export user consent data (GDPR compliance)
 * Returns all consent-related data for the user
 * 
 * @returns Promise with consent data export
 */
export async function exportConsentData(): Promise<ConsentPreferences | null> {
    return getConsentPreferences();
}

// =============================================================================
// HELPER FUNCTIONS FOR SPECIFIC CONSENT TYPES
// =============================================================================

/**
 * Update only cookie consent
 */
export async function updateCookieConsent(
    cookieConsent: ConsentPreferences['cookieConsent']
): Promise<void> {
    if (!cookieConsent) {
        throw new Error('Cookie consent is required');
    }

    return updateConsentPreferences({ cookieConsent });
}

/**
 * Update only terms acceptance
 */
export async function updateTermsAcceptance(
    termsAccepted: ConsentPreferences['termsAccepted']
): Promise<void> {
    if (!termsAccepted) {
        throw new Error('Terms acceptance is required');
    }

    return updateConsentPreferences({ termsAccepted });
}

/**
 * Update only privacy policy acceptance
 */
export async function updatePrivacyAcceptance(
    privacyPolicyAccepted: ConsentPreferences['privacyPolicyAccepted']
): Promise<void> {
    if (!privacyPolicyAccepted) {
        throw new Error('Privacy policy acceptance is required');
    }

    return updateConsentPreferences({ privacyPolicyAccepted });
}

// =============================================================================
// EXPORT DEFAULT
// =============================================================================

const consentService = {
    updateConsentPreferences,
    getConsentPreferences,
    deleteConsentPreferences,
    batchUpdateConsent,
    exportConsentData,
    updateCookieConsent,
    updateTermsAcceptance,
    updatePrivacyAcceptance
};

export default consentService;