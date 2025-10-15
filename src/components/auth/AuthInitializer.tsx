// src/components/auth/AuthInitializer.tsx
"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { checkUserProfile } from "@/services/userService";
import logger from "@/utils/logger";

/**
 * AuthInitializer
 * Sets up a SINGLE global Firebase auth listener for the entire app.
 */
export function AuthInitializer() {
  const { setUser, setLoading, setProfileLoaded, setError } = useAuthStore();

  useEffect(() => {
    logger.debug("🔐 Initializing GLOBAL auth listener");

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          logger.debug("🔄 Auth state changed:", firebaseUser?.email || "signed out");

          setUser(firebaseUser);

          if (firebaseUser) {
            logger.debug("✅ User authenticated, verifying profile...");

            try {
              const idToken = await firebaseUser.getIdToken(true);
              const profileExists = await checkUserProfile(idToken);

              if (profileExists) {
                logger.debug("✅ Profile verified");
                setProfileLoaded(true);
                setError(null);
              } else {
                logger.warn("⚠️ Profile not found");
                setProfileLoaded(false);
                setError("Profile not found. Please complete registration.");
              }
            } catch (profileError) {
              logger.error("❌ Profile verification failed:", profileError);
              setError("Failed to load user profile");
              setProfileLoaded(false);
            }
          } else {
            logger.debug("🚪 User signed out");
            setProfileLoaded(false);
            setError(null);
          }

          setLoading(false);
        } catch (error) {
          logger.error("❌ Auth state error:", error);
          setError(error instanceof Error ? error.message : "Authentication error");
          setLoading(false);
        }
      },
      (error) => {
        logger.error("❌ Auth listener error:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      logger.debug("🧹 Cleaning up GLOBAL auth listener");
      unsubscribe();
    };
  }, [setUser, setLoading, setProfileLoaded, setError]);

  return null;
}