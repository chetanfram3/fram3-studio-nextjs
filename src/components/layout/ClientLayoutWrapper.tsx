// src/components/layout/ClientLayoutWrapper.tsx
"use client";

import { ReactNode } from "react";
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
  return (
    <>
      {children}
      <Footer />
      <CookieConsentBanner />
    </>
  );
}
