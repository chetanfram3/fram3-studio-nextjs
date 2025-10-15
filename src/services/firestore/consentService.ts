// src/services/firestore/consentService.ts

import {
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    limit,
    getDocs,
    Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { ConsentPreferences } from "@/types/consent";
import { LEGAL_VERSIONS, isVersionOutdated } from "@/config/legalVersions";
import logger from "@/utils/logger";

/**
 * Firestore Consent Service
 * 
 * Manages user consent preferences directly in Firestore.
 * Follows the same pattern as fcmService for consistency.
 * 
 * Collection Structure:
 * users/{uid}/consents/current - Current consent document
 * users/{uid}/consents/current/history/{timestamp} - Audit trail
 * 
 * Features:
 * - Direct Firebase writes (no backend API needed)
 * - Automatic audit trail
 * - Version tracking
 * - IP address and user agent logging
 */

// =============================================================================
// TYPES
// =============================================================================

interface FirestoreConsentData extends ConsentPreferences {
    lastUpdated: ReturnType<typeof serverTimestamp>;
    userId: string;
    userAgent: string;
    ipAddress?: string;
}

interface ConsentHistoryEntry {
    consent: ConsentPreferences;
    timestamp: ReturnType<typeof serverTimestamp>;
    userAgent: string;
    ipAddress?: string;
    action: "created" | "updated";
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get user agent string
 */
function getUserAgent(): string {
    return typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
}

/**
 * Get user IP address (client-side approximation)
 * Note: This is limited on client-side, consider backend logging for accurate IP
 */
async function getIpAddress(): Promise<string | undefined> {
    try {
        // This is a simple client-side approach
        // For production, consider using a backend endpoint
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        return data.ip;
    } catch (error) {
        logger.warn("Could not fetch IP address:", error);
        return undefined;
    }
}

// =============================================================================
// CORE CONSENT FUNCTIONS
// =============================================================================

/**
 * Save consent preferences to Firestore
 * 
 * @param consent - Consent preferences to save
 * @returns Promise that resolves when save is complete
 * @throws Error if user is not authenticated or save fails
 * 
 * @example
 * await saveConsentToFirestore({
 *   termsAccepted: {
 *     accepted: true,
 *     version: "1.0",
 *     timestamp: new Date().toISOString()
 *   }
 * });
 */
export async function saveConsentToFirestore(
    consent: ConsentPreferences
): Promise<void> {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No authenticated user");
        }

        logger.debug("Saving consent to Firestore for user:", user.uid);

        // Get IP address (optional, for audit trail)
        const ipAddress = await getIpAddress();

        // Reference to current consent document
        const consentRef = doc(db, "users", user.uid, "consents", "current");

        // Prepare consent data
        const consentData: FirestoreConsentData = {
            ...consent,
            lastUpdated: serverTimestamp(),
            userId: user.uid,
            userAgent: getUserAgent(),
            ipAddress,
        };

        // Save to Firestore (merge to preserve other fields)
        await setDoc(consentRef, consentData, { merge: true });

        // Add to history for audit trail
        await addToConsentHistory(user.uid, consent, "updated");

        logger.debug("Consent saved successfully to Firestore");
    } catch (error) {
        logger.error("Error saving consent to Firestore:", error);
        throw error;
    }
}

/**
 * Get consent preferences from Firestore
 * 
 * @returns Promise with consent preferences or null if not found
 * @throws Error if user is not authenticated
 * 
 * @example
 * const consent = await getConsentFromFirestore();
 * if (consent?.termsAccepted?.accepted) {
 *   // User has accepted terms
 * }
 */
export async function getConsentFromFirestore(): Promise<ConsentPreferences | null> {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No authenticated user");
        }

        logger.debug("Fetching consent from Firestore for user:", user.uid);

        const consentRef = doc(db, "users", user.uid, "consents", "current");
        const consentSnap = await getDoc(consentRef);

        if (!consentSnap.exists()) {
            logger.debug("No consent data found in Firestore");
            return null;
        }

        const data = consentSnap.data();

        // Extract only the consent preferences (remove metadata)
        const consent: ConsentPreferences = {
            termsAccepted: data.termsAccepted,
            privacyPolicyAccepted: data.privacyPolicyAccepted,
            copyrightPolicyAccepted: data.copyrightPolicyAccepted,
            cookieConsent: data.cookieConsent,
        };

        logger.debug("Consent fetched successfully from Firestore");
        return consent;
    } catch (error) {
        logger.error("Error fetching consent from Firestore:", error);
        throw error;
    }
}

/**
 * Check if user needs to update consent (version mismatch)
 * 
 * @returns Promise with boolean indicating if update is needed
 * @throws Error if user is not authenticated
 * 
 * @example
 * const needsUpdate = await needsConsentUpdate();
 * if (needsUpdate) {
 *   // Show consent update modal
 * }
 */
export async function needsConsentUpdate(): Promise<boolean> {
    try {
        const consent = await getConsentFromFirestore();

        // No consent = needs acceptance
        if (!consent) {
            logger.debug("No consent found - user needs to accept");
            return true;
        }

        // Check if terms version is outdated
        const termsOutdated =
            !consent.termsAccepted ||
            isVersionOutdated(
                consent.termsAccepted.version,
                LEGAL_VERSIONS.TERMS
            );

        // Check if privacy policy version is outdated
        const privacyOutdated =
            !consent.privacyPolicyAccepted ||
            isVersionOutdated(
                consent.privacyPolicyAccepted.version,
                LEGAL_VERSIONS.PRIVACY
            );

        // Check if copyright policy version is outdated
        const copyrightOutdated =
            !consent.copyrightPolicyAccepted ||
            isVersionOutdated(
                consent.copyrightPolicyAccepted.version,
                LEGAL_VERSIONS.COPYRIGHT
            );

        const needsUpdate = termsOutdated || privacyOutdated || copyrightOutdated;

        if (needsUpdate) {
            logger.debug(
                "Consent is outdated:",
                { termsOutdated, privacyOutdated, copyrightOutdated }
            );
        }

        return needsUpdate;
    } catch (error) {
        logger.error("Error checking consent version:", error);
        // Default to requiring consent if error occurs (safer approach)
        return true;
    }
}

/**
 * Delete consent preferences from Firestore
 * Used when user withdraws consent or deletes account
 * 
 * @returns Promise that resolves when deletion is complete
 * @throws Error if user is not authenticated
 */
export async function deleteConsentFromFirestore(): Promise<void> {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No authenticated user");
        }

        logger.debug("Deleting consent from Firestore for user:", user.uid);

        const consentRef = doc(db, "users", user.uid, "consents", "current");

        // Mark as deleted with timestamp (soft delete for audit purposes)
        await setDoc(
            consentRef,
            {
                deleted: true,
                deletedAt: serverTimestamp(),
            },
            { merge: true }
        );

        // Add deletion to history
        await addToConsentHistory(user.uid, {}, "updated");

        logger.debug("Consent deleted successfully from Firestore");
    } catch (error) {
        logger.error("Error deleting consent from Firestore:", error);
        throw error;
    }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Accept terms and privacy policy (used during sign-up)
 * 
 * @returns Promise that resolves when acceptance is saved
 * 
 * @example
 * // During social sign-in
 * await acceptTermsAndPrivacy();
 */
export async function acceptTermsAndPrivacy(isFirstLogin: boolean): Promise<void> {
    const consent: ConsentPreferences = {
        termsAccepted: {
            accepted: true,
            version: LEGAL_VERSIONS.TERMS,
            timestamp: new Date().toISOString(),
        },
        privacyPolicyAccepted: {
            accepted: true,
            version: LEGAL_VERSIONS.PRIVACY,
            timestamp: new Date().toISOString(),
        },
        copyrightPolicyAccepted: {
            accepted: true,
            version: LEGAL_VERSIONS.COPYRIGHT,
            timestamp: new Date().toISOString(),
        },
    };

    await saveConsentToFirestore(consent);
}

/**
 * Update cookie consent preferences only
 * 
 * @param cookieConsent - Cookie consent preferences
 * @returns Promise that resolves when update is complete
 * 
 * @example
 * await updateCookieConsent({
 *   necessary: true,
 *   analytics: true,
 *   marketing: false,
 *   preferences: true,
 *   timestamp: new Date().toISOString(),
 *   version: "1.0"
 * });
 */
export async function updateCookieConsent(
    cookieConsent: ConsentPreferences["cookieConsent"]
): Promise<void> {
    if (!cookieConsent) {
        throw new Error("Cookie consent is required");
    }

    const consent: ConsentPreferences = {
        cookieConsent,
    };

    await saveConsentToFirestore(consent);
}

// =============================================================================
// AUDIT TRAIL / HISTORY
// =============================================================================

/**
 * Add consent change to history (audit trail)
 * Internal function - automatically called by save operations
 * 
 * @param userId - User ID
 * @param consent - Consent preferences
 * @param action - Action type (created/updated)
 */
async function addToConsentHistory(
    userId: string,
    consent: ConsentPreferences,
    action: "created" | "updated"
): Promise<void> {
    try {
        const historyRef = collection(
            db,
            "users",
            userId,
            "consents",
            "current",
            "history"
        );

        const ipAddress = await getIpAddress();

        const historyEntry: ConsentHistoryEntry = {
            consent,
            timestamp: serverTimestamp(),
            userAgent: getUserAgent(),
            ipAddress,
            action,
        };

        await addDoc(historyRef, historyEntry);

        logger.debug("Consent history entry added");
    } catch (error) {
        // Non-critical error - log but don't throw
        logger.warn("Failed to save consent history:", error);
    }
}

/**
 * Get consent history for user (for audit/compliance purposes)
 * 
 * @param limitCount - Maximum number of history entries to retrieve
 * @returns Promise with array of consent history entries
 * @throws Error if user is not authenticated
 * 
 * @example
 * const history = await getConsentHistory(10);
 * history.forEach(entry => {
 *   console.log(entry.action, entry.timestamp);
 * });
 */
export async function getConsentHistory(
    limitCount: number = 10
): Promise<ConsentHistoryEntry[]> {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No authenticated user");
        }

        logger.debug(
            `Fetching consent history for user: ${user.uid} (limit: ${limitCount})`
        );

        const historyRef = collection(
            db,
            "users",
            user.uid,
            "consents",
            "current",
            "history"
        );

        const q = query(historyRef, orderBy("timestamp", "desc"), limit(limitCount));
        const querySnapshot = await getDocs(q);

        const history: ConsentHistoryEntry[] = [];
        querySnapshot.forEach((doc) => {
            history.push(doc.data() as ConsentHistoryEntry);
        });

        logger.debug(`Retrieved ${history.length} consent history entries`);
        return history;
    } catch (error) {
        logger.error("Error fetching consent history:", error);
        throw error;
    }
}

// =============================================================================
// EXPORT DEFAULT SERVICE OBJECT
// =============================================================================

const firestoreConsentService = {
    saveConsentToFirestore,
    getConsentFromFirestore,
    needsConsentUpdate,
    deleteConsentFromFirestore,
    acceptTermsAndPrivacy,
    updateCookieConsent,
    getConsentHistory,
};

export default firestoreConsentService;