// src/app/(protected)/layout.tsx
"use client";

import { useEffect } from "react";
import { Header } from "@/components/header/Header";
import { UnifiedAuthGuard, ConsentGate } from "@/components/auth";
import { SidebarProvider, Sidebar } from "@/components/sidebar";
import { Box } from "@mui/material";
import { initializeFCM } from "@/services/fcmService";
import { useNotificationStore } from "@/store/notificationStore";
import logger from "@/utils/logger";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";
import ContainerWidthControl from "@/components/layout/ContainerWidthControl";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profileLoaded } = useAuthStore();
  // Initialize FCM when user is authenticated
  useEffect(() => {
    // Wait for auth to be ready
    if (!user || !profileLoaded) {
      logger.debug("Skipping FCM - user not ready");
      return;
    }

    const setupFCM = async () => {
      try {
        await initializeFCM();
        logger.debug("FCM initialized in protected layout");
      } catch (error) {
        logger.error("Failed to initialize FCM:", error);
      }
    };

    setupFCM();
  }, [user, profileLoaded]);

  // Register service worker and listen for background messages
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          logger.debug("Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          logger.error("Service Worker registration failed:", error);
        });

      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.type === "NOTIFICATION_RECEIVED") {
          logger.debug(
            "Notification received from service worker:",
            event.data.notification
          );

          const { addNotification } = useNotificationStore.getState();
          addNotification({
            ...event.data.notification,
            createdAt: new Date(event.data.notification.createdAt),
          });
        }
      };

      navigator.serviceWorker.addEventListener("message", messageHandler);

      return () => {
        navigator.serviceWorker.removeEventListener("message", messageHandler);
      };
    }
  }, []);

  return (
    <UnifiedAuthGuard
      requiresAccess="authenticated"
      redirectTo="/signin"
      checkOnboarding={true}
      onboardingPath="/create-now"
      loadingText="Checking authentication..."
    >
      <ConsentGate>
        <SidebarProvider>
          <Box
            sx={{
              display: "flex",
              minHeight: "100vh",
              bgcolor: "background.default",
            }}
          >
            <Sidebar />

            <Box
              component="main"
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                width: "100%",
                overflow: "hidden",
                pl: 10,
                pr: 10,
              }}
            >
              <ImpersonationBanner />
              <Header />

              <Box
                sx={{
                  flexGrow: 1,
                  p: { xs: 2, sm: 3, md: 4 },
                  mt: 8,
                  overflow: "auto",
                }}
              >
                <ContainerWidthControl position="bottom-right">
                  {children}
                </ContainerWidthControl>
              </Box>
            </Box>
          </Box>
        </SidebarProvider>
      </ConsentGate>
    </UnifiedAuthGuard>
  );
}
