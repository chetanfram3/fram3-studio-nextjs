// src/utils/consentHelpers.ts

import type {
    CookieConsent,
    ConsentPreferences,
    TermsAcceptance,
    PrivacyPolicyAcceptance
} from '@/types/consent';
import type { UserProfile } from '@/types/profile';
import logger from '@/utils/logger';

// =============================================================================
// CONSTANTS
// =============================================================================

export const CONSENT_VERSION = '1.0';
export const TERMS_VERSION = '1.0';
export const PRIVACY_VERSION = '1.0';

export const CONSENT_STORAGE_KEY = 'cookie_consent_preferences';

// Consent expiration in months (for annual re-consent if required)
export const CONSENT_EXPIRY_MONTHS = 12;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Check if user has valid cookie consent
 * Priority: User Profile > LocalStorage
 */
export function hasValidConsent(
    userProfile: UserProfile | null | undefined,
    consentType: 'cookies' | 'terms' | 'privacy' = 'cookies'
): boolean {
    // Priority 1: Check user profile (for logged-in users)
    if (userProfile?.extendedInfo?.details?.consentPreferences) {
        const prefs = userProfile.extendedInfo.details.consentPreferences;

        switch (consentType) {
            case 'cookies':
                if (prefs.cookieConsent) {
                    return (
                        prefs.cookieConsent.version === CONSENT_VERSION &&
                        !isConsentExpired(prefs.cookieConsent.timestamp)
                    );
                }
                break;

            case 'terms':
                if (prefs.termsAccepted) {
                    return (
                        prefs.termsAccepted.accepted &&
                        prefs.termsAccepted.version === TERMS_VERSION
                    );
                }
                break;

            case 'privacy':
                if (prefs.privacyPolicyAccepted) {
                    return (
                        prefs.privacyPolicyAccepted.accepted &&
                        prefs.privacyPolicyAccepted.version === PRIVACY_VERSION
                    );
                }
                break;
        }
    }

    // Priority 2: Check localStorage (for non-logged-in users)
    const stored = getConsentFromLocalStorage();
    if (!stored) return false;

    try {
        switch (consentType) {
            case 'cookies':
                if (stored.cookieConsent) {
                    return (
                        stored.cookieConsent.version === CONSENT_VERSION &&
                        !isConsentExpired(stored.cookieConsent.timestamp)
                    );
                }
                break;

            case 'terms':
                if (stored.termsAccepted) {
                    return (
                        stored.termsAccepted.accepted &&
                        stored.termsAccepted.version === TERMS_VERSION
                    );
                }
                break;

            case 'privacy':
                if (stored.privacyPolicyAccepted) {
                    return (
                        stored.privacyPolicyAccepted.accepted &&
                        stored.privacyPolicyAccepted.version === PRIVACY_VERSION
                    );
                }
                break;
        }
    } catch (e) {
        logger.error('Error validating consent:', e);
        return false;
    }

    return false;
}

/**
 * Check if consent has expired (for annual re-consent)
 */
export function isConsentExpired(
    timestamp: string,
    maxAgeMonths: number = CONSENT_EXPIRY_MONTHS
): boolean {
    try {
        const consentDate = new Date(timestamp);
        const now = new Date();
        const ageInMonths =
            (now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

        return ageInMonths > maxAgeMonths;
    } catch (e) {
        logger.error('Error checking consent expiry:', e);
        return true; // If can't parse, assume expired to be safe
    }
}

/**
 * Should we re-prompt the user for consent?
 */
export function shouldRepromptConsent(
    userProfile: UserProfile | null | undefined,
    maxAgeMonths: number = CONSENT_EXPIRY_MONTHS
): boolean {
    const consentPrefs = userProfile?.extendedInfo?.details?.consentPreferences?.cookieConsent;

    // No consent found
    if (!consentPrefs) return true;

    // Version changed
    if (consentPrefs.version !== CONSENT_VERSION) return true;

    // Consent expired
    if (isConsentExpired(consentPrefs.timestamp, maxAgeMonths)) return true;

    return false;
}

// =============================================================================
// LOCALSTORAGE FUNCTIONS
// =============================================================================

/**
 * Save consent to localStorage
 * Merges with existing preferences
 */
export function saveConsentToLocalStorage(
    preferences: ConsentPreferences
): void {
    try {
        const existing = getConsentFromLocalStorage();

        const updated: ConsentPreferences = {
            ...existing,
            ...preferences
        };

        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
        logger.debug('Consent saved to localStorage', updated);
    } catch (e) {
        logger.error('Failed to save consent to localStorage:', e);
    }
}

/**
 * Get consent from localStorage
 */
export function getConsentFromLocalStorage(): ConsentPreferences | null {
    try {
        const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as ConsentPreferences;
        return parsed;
    } catch (e) {
        logger.error('Failed to parse consent from localStorage:', e);
        return null;
    }
}

/**
 * Clear consent from localStorage
 */
export function clearConsentFromLocalStorage(): void {
    try {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
        logger.debug('Consent cleared from localStorage');
    } catch (e) {
        logger.error('Failed to clear consent from localStorage:', e);
    }
}

/**
 * Get specific consent type from localStorage
 */
export function getSpecificConsent<T extends keyof ConsentPreferences>(
    key: T
): ConsentPreferences[T] | null {
    const all = getConsentFromLocalStorage();
    return all?.[key] || null;
}

// =============================================================================
// COOKIE CONSENT FACTORY FUNCTIONS
// =============================================================================

/**
 * Create default cookie consent (only necessary cookies)
 */
export function createDefaultCookieConsent(): CookieConsent {
    return {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION
    };
}

/**
 * Create full cookie consent (all cookies accepted)
 */
export function createFullCookieConsent(): CookieConsent {
    return {
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: true,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION
    };
}

/**
 * Create custom cookie consent
 */
export function createCustomCookieConsent(
    analytics: boolean,
    marketing: boolean,
    preferences: boolean
): CookieConsent {
    return {
        necessary: true, // Always true
        analytics,
        marketing,
        preferences,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION
    };
}

// =============================================================================
// TERMS & PRIVACY FACTORY FUNCTIONS
// =============================================================================

/**
 * Create terms acceptance
 */
export function createTermsAcceptance(accepted: boolean = true): TermsAcceptance {
    return {
        accepted,
        version: TERMS_VERSION,
        timestamp: new Date().toISOString()
    };
}

/**
 * Create privacy policy acceptance
 */
export function createPrivacyAcceptance(accepted: boolean = true): PrivacyPolicyAcceptance {
    return {
        accepted,
        version: PRIVACY_VERSION,
        timestamp: new Date().toISOString()
    };
}

// =============================================================================
// TRACKING SERVICE INITIALIZATION
// =============================================================================

/**
 * Initialize analytics and tracking services based on consent
 */
export function initializeTrackingServices(consent: CookieConsent): void {
    logger.debug('Initializing tracking services with consent:', consent);

    // Always enabled: Necessary cookies
    console.log('✓ Necessary cookies enabled (authentication, security)');

    // Analytics cookies
    if (consent.analytics) {
        initializeAnalytics();
    } else {
        disableAnalytics();
    }

    // Marketing cookies
    if (consent.marketing) {
        initializeMarketing();
    } else {
        disableMarketing();
    }

    // Preference cookies
    if (consent.preferences) {
        console.log('✓ Preference cookies enabled (theme, language, settings)');
    } else {
        console.log('✗ Preference cookies disabled');
    }
}

/**
 * Initialize Google Analytics
 */
function initializeAnalytics(): void {
    try {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            // Update consent mode
            (window as any).gtag('consent', 'update', {
                analytics_storage: 'granted'
            });

            // Initialize GA if not already initialized
            const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
            if (GA_MEASUREMENT_ID) {
                (window as any).gtag('config', GA_MEASUREMENT_ID);
            }

            logger.debug('✓ Google Analytics enabled');
            console.log('✓ Analytics cookies enabled (Google Analytics)');
        } else {
            console.log('✓ Analytics cookies enabled (GA not loaded)');
        }
    } catch (e) {
        logger.error('Failed to initialize analytics:', e);
    }
}

/**
 * Disable Google Analytics
 */
function disableAnalytics(): void {
    try {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('consent', 'update', {
                analytics_storage: 'denied'
            });
        }
        console.log('✗ Analytics cookies disabled');
        logger.debug('Analytics disabled');
    } catch (e) {
        logger.error('Failed to disable analytics:', e);
    }
}

/**
 * Initialize Marketing pixels and tracking
 */
function initializeMarketing(): void {
    try {
        if (typeof window !== 'undefined') {
            // Google Ads consent
            if ((window as any).gtag) {
                (window as any).gtag('consent', 'update', {
                    ad_storage: 'granted',
                    ad_user_data: 'granted',
                    ad_personalization: 'granted'
                });
            }

            // Facebook Pixel consent
            if ((window as any).fbq) {
                (window as any).fbq('consent', 'grant');
            }

            logger.debug('✓ Marketing tracking enabled');
            console.log('✓ Marketing cookies enabled (Advertising, Retargeting)');
        }
    } catch (e) {
        logger.error('Failed to initialize marketing:', e);
    }
}

/**
 * Disable Marketing pixels and tracking
 */
function disableMarketing(): void {
    try {
        if (typeof window !== 'undefined') {
            // Google Ads consent
            if ((window as any).gtag) {
                (window as any).gtag('consent', 'update', {
                    ad_storage: 'denied',
                    ad_user_data: 'denied',
                    ad_personalization: 'denied'
                });
            }

            // Facebook Pixel consent
            if ((window as any).fbq) {
                (window as any).fbq('consent', 'revoke');
            }
        }
        console.log('✗ Marketing cookies disabled');
        logger.debug('Marketing disabled');
    } catch (e) {
        logger.error('Failed to disable marketing:', e);
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get consent summary for display
 */
export function getConsentSummary(
    userProfile: UserProfile | null | undefined
): {
    hasConsent: boolean;
    cookieConsent?: CookieConsent;
    termsAccepted?: boolean;
    privacyAccepted?: boolean;
    consentDate?: string;
} {
    const consentPrefs = userProfile?.extendedInfo?.details?.consentPreferences;

    if (!consentPrefs) {
        return { hasConsent: false };
    }

    return {
        hasConsent: true,
        cookieConsent: consentPrefs.cookieConsent,
        termsAccepted: consentPrefs.termsAccepted?.accepted,
        privacyAccepted: consentPrefs.privacyPolicyAccepted?.accepted,
        consentDate: consentPrefs.cookieConsent?.timestamp
    };
}

/**
 * Format consent date for display
 */
export function formatConsentDate(timestamp: string): string {
    try {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return 'Unknown';
    }
}

/**
 * Merge consent preferences
 * Used when syncing localStorage to profile
 */
export function mergeConsentPreferences(
    existing: ConsentPreferences | undefined,
    updates: ConsentPreferences
): ConsentPreferences {
    return {
        ...existing,
        ...updates,
        // Keep most recent timestamp for each type
        cookieConsent: updates.cookieConsent || existing?.cookieConsent,
        termsAccepted: updates.termsAccepted || existing?.termsAccepted,
        privacyPolicyAccepted: updates.privacyPolicyAccepted || existing?.privacyPolicyAccepted
    };
}

/**
 * Check if consent needs update (version changed)
 */
export function needsConsentUpdate(
    consent: CookieConsent | undefined
): boolean {
    if (!consent) return true;
    return consent.version !== CONSENT_VERSION;
}

/**
 * Validate consent preferences structure
 */
export function isValidConsentPreferences(
    preferences: any
): preferences is ConsentPreferences {
    if (!preferences || typeof preferences !== 'object') {
        return false;
    }

    // Check cookie consent structure if present
    if (preferences.cookieConsent) {
        const cc = preferences.cookieConsent;
        if (
            typeof cc.necessary !== 'boolean' ||
            typeof cc.analytics !== 'boolean' ||
            typeof cc.marketing !== 'boolean' ||
            typeof cc.preferences !== 'boolean' ||
            typeof cc.timestamp !== 'string' ||
            typeof cc.version !== 'string'
        ) {
            return false;
        }
    }

    return true;
}

// =============================================================================
// EXPORT ALL
// =============================================================================

export default {
    // Constants
    CONSENT_VERSION,
    TERMS_VERSION,
    PRIVACY_VERSION,
    CONSENT_STORAGE_KEY,
    CONSENT_EXPIRY_MONTHS,

    // Validation
    hasValidConsent,
    isConsentExpired,
    shouldRepromptConsent,

    // LocalStorage
    saveConsentToLocalStorage,
    getConsentFromLocalStorage,
    clearConsentFromLocalStorage,
    getSpecificConsent,

    // Factory functions
    createDefaultCookieConsent,
    createFullCookieConsent,
    createCustomCookieConsent,
    createTermsAcceptance,
    createPrivacyAcceptance,

    // Tracking
    initializeTrackingServices,

    // Utilities
    getConsentSummary,
    formatConsentDate,
    mergeConsentPreferences,
    needsConsentUpdate,
    isValidConsentPreferences
};