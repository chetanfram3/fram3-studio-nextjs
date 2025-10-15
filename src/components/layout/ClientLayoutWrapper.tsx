// src/components/layout/ClientLayoutWrapper.tsx
"use client";

import { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import { Footer } from "@/components/footer";
import CookieConsentBanner from "@/components/legal/CookieConsentBanner";

interface ClientLayoutWrapperProps {
  children: ReactNode;
}

/**
 * Client-side wrapper for components that need client hooks
 * This separates client components from the server-side root layout
 */
export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const { user } = useAuthStore();
  
  // Only show footer if user is NOT logged in
  const showFooter = !user;

  return (
    <>
      {children}
      {showFooter && <Footer />}
      <CookieConsentBanner />
    </>
  );
}