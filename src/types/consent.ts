// src/types/consent.ts

/**
 * Cookie Consent Preferences
 * Represents user's cookie consent choices
 */
export interface CookieConsent {
    /** Necessary cookies - always true, required for site functionality */
    necessary: boolean;

    /** Analytics cookies - Google Analytics, usage tracking */
    analytics: boolean;

    /** Marketing cookies - Advertising, retargeting pixels */
    marketing: boolean;

    /** Preference cookies - Language, theme, user settings */
    preferences: boolean;

    /** ISO datetime when consent was given */
    timestamp: string;

    /** Consent policy version (for re-prompting when policy changes) */
    version: string;
}

/**
 * Terms & Conditions Acceptance
 */
export interface TermsAcceptance {
    /** Whether user accepted the terms */
    accepted: boolean;

    /** Version of terms accepted */
    version: string;

    /** ISO datetime when terms were accepted */
    timestamp: string;
}

/**
 * Privacy Policy Acceptance
 */
export interface PrivacyPolicyAcceptance {
    /** Whether user accepted the privacy policy */
    accepted: boolean;

    /** Version of privacy policy accepted */
    version: string;

    /** ISO datetime when privacy policy was accepted */
    timestamp: string;
}

/**
 * Complete Consent Preferences
 * Stored in Firestore: users/{uid}/consents/current
 * 
 * This is a generic structure that can hold multiple types of consent
 * (cookies, terms, privacy policy, etc.)
 */
export interface ConsentPreferences {
    /** Cookie consent preferences */
    cookieConsent?: CookieConsent;

    /** Terms & conditions acceptance */
    termsAccepted?: TermsAcceptance;

    /** Privacy policy acceptance */
    privacyPolicyAccepted?: PrivacyPolicyAcceptance;

    /** 🆕 NEW: Track if this is user's first login/consent acceptance */
    firstLogin?: boolean;
}

/**
 * Consent Update Payload
 * Used when calling the backend API to update consent
 */
export interface ConsentUpdatePayload {
    consentPreferences: ConsentPreferences;
}

/**
 * Consent History Entry
 * Optional: Track history of consent changes for audit trail
 */
export interface ConsentHistoryEntry {
    type: 'cookies' | 'terms' | 'privacy';
    action: 'accepted' | 'rejected' | 'updated';
    preferences: CookieConsent | TermsAcceptance | PrivacyPolicyAcceptance;
    timestamp: string;
    version: string;
}

/**
 * Consent Status
 * Used for displaying current consent status
 */
export interface ConsentStatus {
    hasConsent: boolean;
    cookiesEnabled: {
        necessary: boolean;
        analytics: boolean;
        marketing: boolean;
        preferences: boolean;
    };
    termsAccepted: boolean;
    privacyAccepted: boolean;
    lastUpdated: string;
    version: string;
}

/**
 * Cookie Category Details
 * Metadata about each cookie category
 */
export interface CookieCategory {
    id: keyof Pick<CookieConsent, 'necessary' | 'analytics' | 'marketing' | 'preferences'>;
    title: string;
    description: string;
    required: boolean;
    examples?: string[];
}

/**
 * 🆕 NEW: Consent Gate State
 * Used by useConsentGate hook and ConsentGate component
 */
export interface ConsentGateState {
    /** Should the consent modal be shown? */
    showModal: boolean;

    /** Is this the user's first time accepting consent? */
    isFirstLogin: boolean;

    /** Does the consent need to be updated (version mismatch)? */
    needsUpdate: boolean;

    /** Is the consent check in progress? */
    loading: boolean;

    /** Error message if consent check failed */
    error: string | null;
}

/**
 * Predefined Cookie Categories
 */
export const COOKIE_CATEGORIES: CookieCategory[] = [
    {
        id: 'necessary',
        title: 'Necessary Cookies',
        description: 'Essential for the website to function. These cookies enable core functionality such as security, network management, and accessibility. You cannot opt-out of these cookies.',
        required: true,
        examples: [
            'Authentication tokens',
            'Security tokens',
            'Session management'
        ]
    },
    {
        id: 'analytics',
        title: 'Analytics Cookies',
        description: 'Help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website and services.',
        required: false,
        examples: [
            'Google Analytics',
            'Usage statistics',
            'Performance monitoring'
        ]
    },
    {
        id: 'marketing',
        title: 'Marketing Cookies',
        description: 'Used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user.',
        required: false,
        examples: [
            'Google Ads',
            'Facebook Pixel',
            'Retargeting pixels'
        ]
    },
    {
        id: 'preferences',
        title: 'Preference Cookies',
        description: 'Enable the website to remember information that changes the way the website behaves or looks, such as your preferred language or region.',
        required: false,
        examples: [
            'Language settings',
            'Theme preferences',
            'Region selection'
        ]
    }
];