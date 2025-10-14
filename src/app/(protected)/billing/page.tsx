"use client";

import { AuthGuard } from "@/components/auth";
import BillingPage from "@/components/cr3ditSys/index";

/**
 * Payments Page
 * Protected route - requires authentication
 */
export default function ProfilePage() {
  return (
    <AuthGuard
      requireAuth={true}
      redirectTo="/signin"
      loadingText="Loading billing..."
    >
      <BillingPage />
    </AuthGuard>
  );
}
