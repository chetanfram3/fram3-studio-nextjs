// src/components/auth/SignInWizardProvider.tsx
"use client";

import { useSignInWizard } from "@/hooks/auth/useSignInWizard";
import SignInWizard from "./SignInWizard";

/**
 * Sign-In Wizard Provider
 *
 * Global component that monitors authentication state and shows
 * the profile setup wizard when a user signs in without a profile.
 *
 * This should be placed high in the component tree (e.g., in RootLayout)
 * to ensure it's available throughout the app.
 *
 * How it works:
 * 1. Monitors auth state via useSignInWizard hook
 * 2. Shows wizard when user is authenticated but has no profile
 * 3. Handles profile creation via API
 * 4. Allows user to sign out if they don't want to complete setup
 *
 * @example
 * // In app/layout.tsx or similar
 * <SignInWizardProvider>
 *   <YourApp />
 * </SignInWizardProvider>
 */
export default function SignInWizardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    showWizard,
    user,
    handleProfileCreation,
    handleWizardCancel,
  } = useSignInWizard();

  return (
    <>
      {children}
      {showWizard && user && (
        <SignInWizard
          open={showWizard}
          user={user}
          onComplete={handleProfileCreation}
          onCancel={handleWizardCancel}
        />
      )}
    </>
  );
}
