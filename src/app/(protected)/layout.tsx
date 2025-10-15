// src/app/(protected)/layout.tsx
"use client";

import { useEffect } from "react";
import { Header } from "@/components/header/Header";
import { AuthGuard, ConsentGate } from "@/components/auth";
import { SidebarProvider, Sidebar } from "@/components/sidebar";
import { Box } from "@mui/material";
import { initializeFCM } from "@/services/fcmService";
import { useNotificationStore } from "@/store/notificationStore";
import logger from "@/utils/logger";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";
import ContainerWidthControl from "@/components/layout/ContainerWidthControl";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize FCM when user is authenticated
  useEffect(() => {
    const setupFCM = async () => {
      try {
        await initializeFCM();
        logger.debug("FCM initialized in protected layout");
      } catch (error) {
        logger.error("Failed to initialize FCM:", error);
      }
    };

    setupFCM();
  }, []);

  // Register service worker and listen for background messages
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          logger.debug("Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          logger.error("Service Worker registration failed:", error);
        });

      // Listen for messages from service worker (background notifications)
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.type === "NOTIFICATION_RECEIVED") {
          logger.debug(
            "Notification received from service worker:",
            event.data.notification
          );

          // Add notification to store
          const { addNotification } = useNotificationStore.getState();
          addNotification({
            ...event.data.notification,
            createdAt: new Date(event.data.notification.createdAt),
          });
        }
      };

      navigator.serviceWorker.addEventListener("message", messageHandler);

      // Cleanup listener on unmount
      return () => {
        navigator.serviceWorker.removeEventListener("message", messageHandler);
      };
    }
  }, []);

  return (
    <AuthGuard
      requireAuth={true}
      redirectTo="/signin"
      loadingText="Checking authentication..."
    >
      {/* 🆕 NEW: Wrap with ConsentGate to enforce legal agreement */}
      <ConsentGate>
        <SidebarProvider>
          <Box
            sx={{
              display: "flex",
              minHeight: "100vh",
              bgcolor: "background.default",
            }}
          >
            {/* Sidebar Component */}
            <Sidebar />

            {/* Main Content Area */}
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
              {/* Header */}
              <Header />

              {/* Page Content */}
              <Box
                sx={{
                  flexGrow: 1,
                  p: { xs: 2, sm: 3, md: 4 },
                  mt: 8, // Account for fixed header height
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
    </AuthGuard>
  );
}