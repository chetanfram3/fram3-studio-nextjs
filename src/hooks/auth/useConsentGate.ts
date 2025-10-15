// src/hooks/auth/useConsentGate.ts

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
    getConsentFromFirestore,
    acceptTermsAndPrivacy,
    needsConsentUpdate,
} from "@/services/firestore";
import { auth } from "@/lib/firebase";
import type { ConsentGateState } from "@/types/consent";
import logger from "@/utils/logger";

/**
 * Consent Gate Hook
 * 
 * Manages consent enforcement logic for sign-in flow.
 * Checks consent status on user authentication and provides
 * handlers for accepting or declining consent.
 * 
 * Features:
 * - Automatic consent check on user change
 * - Detects first login vs returning user
 * - Detects version mismatches (outdated consent)
 * - Handles accept/decline actions
 * - Logs out user on decline
 * 
 * @returns Object with modal state and action handlers
 * 
 * @example
 * function MyApp() {
 *   const { showModal, isFirstLogin, handleAccept, handleDecline } = useConsentGate();
 *   
 *   if (showModal) {
 *     return <ConsentModal onAccept={handleAccept} onDecline={handleDecline} />;
 *   }
 *   
 *   return <DashboardContent />;
 * }
 */
export function useConsentGate() {
    const { user } = useAuthStore();
    const router = useRouter();

    const [state, setState] = useState<ConsentGateState>({
        showModal: false,
        isFirstLogin: false,
        needsUpdate: false,
        loading: true,
        error: null,
    });

    /**
     * Check consent status for authenticated user
     */
    const checkConsentStatus = useCallback(async () => {
        // No user = no consent to check
        if (!user) {
            setState({
                showModal: false,
                isFirstLogin: false,
                needsUpdate: false,
                loading: false,
                error: null,
            });
            return;
        }

        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
            logger.debug("Checking consent status for user:", user.uid);

            // 1. Fetch current consent from Firestore
            const consent = await getConsentFromFirestore();

            // 2. No consent? → First login
            if (!consent) {
                logger.debug("No consent found - first login detected");
                setState({
                    showModal: true,
                    isFirstLogin: true,
                    needsUpdate: false,
                    loading: false,
                    error: null,
                });
                return;
            }

            // 3. Check if consent needs update (version mismatch)
            const updateNeeded = await needsConsentUpdate();

            if (updateNeeded) {
                logger.debug("Consent needs update - version mismatch detected");
                setState({
                    showModal: true,
                    isFirstLogin: false,
                    needsUpdate: true,
                    loading: false,
                    error: null,
                });
                return;
            }

            // 4. Consent is valid and up-to-date
            logger.debug("Consent is valid and up-to-date");
            setState({
                showModal: false,
                isFirstLogin: false,
                needsUpdate: false,
                loading: false,
                error: null,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to check consent status";
            logger.error("Error checking consent status:", errorMessage);

            // On error, show modal to be safe (require consent)
            setState({
                showModal: true,
                isFirstLogin: true,
                needsUpdate: false,
                loading: false,
                error: errorMessage,
            });
        }
    }, [user]);

    /**
     * Handle user accepting consent
     */
    const handleAccept = useCallback(async () => {
        if (!user) {
            logger.warn("Cannot accept consent - no user authenticated");
            return;
        }

        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
            logger.debug("User accepting consent", {
                isFirstLogin: state.isFirstLogin,
                needsUpdate: state.needsUpdate,
            });

            // Save consent to Firestore
            await acceptTermsAndPrivacy(state.isFirstLogin);

            // Close modal - consent accepted
            setState({
                showModal: false,
                isFirstLogin: false,
                needsUpdate: false,
                loading: false,
                error: null,
            });

            logger.debug("Consent accepted and saved successfully");
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Failed to save consent";
            logger.error("Error accepting consent:", errorMessage);

            setState((prev) => ({
                ...prev,
                loading: false,
                error: errorMessage,
            }));
        }
    }, [user, state.isFirstLogin, state.needsUpdate]);

    /**
     * Handle user declining consent
     * Logs out user and redirects to sign-in page
     */
    const handleDecline = useCallback(async () => {
        logger.debug("User declined consent - logging out");

        setState((prev) => ({ ...prev, loading: true }));

        try {
            // Sign out from Firebase
            await auth.signOut();

            // Clear auth store
            useAuthStore.getState().logout();

            // Close modal
            setState({
                showModal: false,
                isFirstLogin: false,
                needsUpdate: false,
                loading: false,
                error: null,
            });

            // Redirect to sign-in page
            router.push("/signin");

            logger.debug("User logged out successfully after declining consent");
        } catch (error) {
            logger.error("Error during logout after declining consent:", error);

            // Still try to redirect even if logout fails
            router.push("/signin");
        }
    }, [router]);

    /**
     * Check consent status when user changes
     */
    useEffect(() => {
        checkConsentStatus();
    }, [checkConsentStatus]);

    return {
        ...state,
        handleAccept,
        handleDecline,
        refetch: checkConsentStatus, // Allow manual refetch
    };
}