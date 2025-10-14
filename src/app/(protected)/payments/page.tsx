"use client";

import { AuthGuard } from "@/components/auth";
import PaymentsPage from "@/components/payments/index";

/**
 * Payments Page
 * Protected route - requires authentication
 */
export default function ProfilePage() {
  return (
    <AuthGuard
      requireAuth={true}
      redirectTo="/signin"
      loadingText="Loading payments..."
    >
      <PaymentsPage />
    </AuthGuard>
  );
}
