// src/hooks/useConsentCheck.ts
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { needsConsentUpdate } from "@/services/firestore/consentService";
import logger from "@/utils/logger";

interface ConsentCheckResult {
  needsUpdate: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to check if user needs to update consent
 * 
 * Checks if the user's accepted legal document versions
 * match the current versions. Returns loading state and
 * whether an update is needed.
 * 
 * Features:
 * - Automatic check on mount and user change
 * - Loading state management
 * - Error handling
 * - Requires authentication
 * - Manual refetch capability
 * 
 * @returns Object with needsUpdate flag, loading state, error, and refetch function
 * 
 * @example
 * function MyComponent() {
 *   const { needsUpdate, loading, refetch } = useConsentCheck();
 *   
 *   if (loading) return <Loading />;
 *   if (needsUpdate) return <ConsentUpdateModal onAccept={refetch} />;
 *   return <DashboardContent />;
 * }
 */
export function useConsentCheck(): ConsentCheckResult {
  const { user } = useAuthStore();
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkConsent = async () => {
    // Reset state
    setError(null);
    setLoading(true);

    // No user = no consent to check
    if (!user) {
      setNeedsUpdate(false);
      setLoading(false);
      return;
    }

    try {
      logger.debug("Checking consent for user:", user.uid);
      
      // Check if consent needs update using Firestore service
      const needsUpdateResult = await needsConsentUpdate();
      setNeedsUpdate(needsUpdateResult);

      if (needsUpdateResult) {
        logger.debug("User needs to update consent");
      } else {
        logger.debug("User consent is up to date");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to check consent";
      logger.error("Error checking consent:", errorMessage);
      setError(errorMessage);
      // Default to requiring consent on error (safer approach)
      setNeedsUpdate(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConsent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Re-check when user changes

  return {
    needsUpdate,
    loading,
    error,
    refetch: checkConsent, // Allow manual refetch after consent update
  };
}