// src/components/auth/UnifiedAuthGuard.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthRedirect } from "@/hooks/auth/useAuthRedirect";
import { useSubscription } from "@/hooks/auth/useSubscription";
import { useAuthStore } from "@/store/authStore";
import LoadingDots from "@/components/common/LoadingDots";
import {
  Box,
  Container,
  Alert,
  Typography,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import BlockIcon from "@mui/icons-material/Block";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { getCurrentBrand } from "@/config/brandConfig";
import logger from "@/utils/logger";

// ============================================
// TYPE DEFINITIONS
// ============================================

type AccessLevel = "public" | "authenticated" | "admin" | "superadmin";

interface UnifiedAuthGuardProps {
  children: ReactNode;

  // Access control
  requiresAccess?: AccessLevel;

  // Redirect configuration
  redirectTo?: string;
  redirectIfAuthenticated?: string;

  // Feature checks
  checkOnboarding?: boolean;
  onboardingPath?: string;

  // UI customization
  loadingText?: string;
  showAccessDenied?: boolean;
  customAccessDeniedMessage?: string;

  // Debugging
  debugMode?: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Unified Authentication Guard
 *
 * Single component that handles ALL auth scenarios:
 * - Public pages (redirects if authenticated)
 * - Protected pages (requires authentication)
 * - Admin pages (requires admin role)
 * - Super admin pages (requires super admin)
 * - Onboarding checks
 *
 * Replaces: AuthGuard, AdminGuard, AuthRedirect
 *
 * @example
 * // Public page (auth pages)
 * <UnifiedAuthGuard requiresAccess="public" redirectIfAuthenticated="/dashboard">
 *   <SignInForm />
 * </UnifiedAuthGuard>
 *
 * @example
 * // Protected page
 * <UnifiedAuthGuard requiresAccess="authenticated" checkOnboarding={true}>
 *   <Dashboard />
 * </UnifiedAuthGuard>
 *
 * @example
 * // Admin page
 * <UnifiedAuthGuard requiresAccess="admin">
 *   <AdminPanel />
 * </UnifiedAuthGuard>
 */
export default function UnifiedAuthGuard({
  children,
  requiresAccess = "public",
  redirectTo = "/signin",
  redirectIfAuthenticated = "/dashboard",
  checkOnboarding = false,
  onboardingPath = "/create-now",
  loadingText,
  showAccessDenied = true,
  customAccessDeniedMessage,
  debugMode = false,
}: UnifiedAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const brand = getCurrentBrand();

  const [accessCheckComplete, setAccessCheckComplete] = useState(false);

  // Use the redirect hook for auth state management
  const { isRedirecting, loading, user, profileLoaded } = useAuthRedirect({
    requireAuth: requiresAccess !== "public",
    redirectTo,
    redirectIfAuthenticated:
      requiresAccess === "public" ? redirectIfAuthenticated : undefined,
    checkOnboarding,
    onboardingPath,
  });

  // Get subscription info for role checks
  const { isAdmin, isSuperAdmin, accessLevel, isEnabled } = useSubscription();
  const { claims } = useAuthStore();

  // Debug logging
  useEffect(() => {
    if (debugMode) {
      logger.debug("[UnifiedAuthGuard] State:", {
        pathname,
        requiresAccess,
        user: user?.email,
        isAdmin,
        isSuperAdmin,
        accessLevel,
        isEnabled,
        loading,
        isRedirecting,
        profileLoaded,
      });
    }
  }, [
    debugMode,
    pathname,
    requiresAccess,
    user,
    isAdmin,
    isSuperAdmin,
    accessLevel,
    isEnabled,
    loading,
    isRedirecting,
    profileLoaded,
  ]);

  // Check if user meets access requirements
  const hasAccess = checkAccess(
    requiresAccess,
    user,
    isAdmin,
    isSuperAdmin,
    isEnabled
  );

  // Mark access check as complete after loading finishes
  useEffect(() => {
    if (!loading && !isRedirecting) {
      setAccessCheckComplete(true);
    }
  }, [loading, isRedirecting]);

  // ============================================
  // RENDER: Loading State
  // ============================================

  if (loading || isRedirecting) {
    const text = loadingText || getDefaultLoadingText(requiresAccess);
    return <LoadingDots isLoading={true} text={text} />;
  }

  // ============================================
  // RENDER: Access Denied
  // ============================================

  if (accessCheckComplete && !hasAccess && requiresAccess !== "public") {
    if (!showAccessDenied) {
      // Silent fail - don't render anything
      return null;
    }

    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
          }}
        >
          <Stack spacing={3} alignItems="center" sx={{ textAlign: "center" }}>
            {/* Icon */}
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                bgcolor: "error.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: theme.shadows[4],
              }}
            >
              <BlockIcon
                sx={{
                  fontSize: 64,
                  color: "error.main",
                }}
              />
            </Box>

            {/* Title */}
            <Typography
              variant="h3"
              fontFamily={brand.fonts.heading}
              sx={{ fontWeight: 700 }}
            >
              Access Denied
            </Typography>

            {/* Message */}
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 400 }}
            >
              {customAccessDeniedMessage ||
                getDefaultAccessDeniedMessage(requiresAccess)}
            </Typography>

            <Divider sx={{ width: "100%", my: 2 }} />

            {/* Access Level Info */}
            <Alert
              severity="info"
              icon={<SecurityIcon />}
              sx={{
                width: "100%",
                textAlign: "left",
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
              }}
            >
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Required Access Level:</strong>{" "}
                  {getAccessLevelDescription(requiresAccess)}
                </Typography>
                <Typography variant="body2">
                  <strong>Your Access Level:</strong>{" "}
                  {user ? accessLevel || "Basic User" : "Not Authenticated"}
                </Typography>
                {!isEnabled && user && (
                  <Typography variant="body2" color="warning.main">
                    <strong>Note:</strong> Your account is pending activation
                  </Typography>
                )}
              </Stack>
            </Alert>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
                  textTransform: "none",
                }}
              >
                Go Back
              </Button>
              <Button
                variant="contained"
                onClick={() => router.push("/dashboard")}
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
                  textTransform: "none",
                }}
              >
                Go to Dashboard
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
    );
  }

  // ============================================
  // RENDER: Success - User Has Access
  // ============================================

  return <>{children}</>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if user meets the required access level
 */
function checkAccess(
  required: AccessLevel,
  user: any,
  isAdmin: boolean,
  isSuperAdmin: boolean,
  isEnabled: boolean
): boolean {
  switch (required) {
    case "public":
      // Public pages are always accessible
      return true;

    case "authenticated":
      // Must have user account and be enabled
      return !!user;

    case "admin":
      // Must be admin or superadmin AND enabled
      return (isAdmin || isSuperAdmin) && isEnabled;

    case "superadmin":
      // Must be superadmin AND enabled
      return isSuperAdmin && isEnabled;

    default:
      logger.warn("[UnifiedAuthGuard] Unknown access level:", required);
      return false;
  }
}

/**
 * Get default loading text based on access level
 */
function getDefaultLoadingText(requiresAccess: AccessLevel): string {
  switch (requiresAccess) {
    case "public":
      return "Loading...";
    case "authenticated":
      return "Checking authentication...";
    case "admin":
      return "Verifying admin access...";
    case "superadmin":
      return "Verifying super admin access...";
    default:
      return "Loading...";
  }
}

/**
 * Get default access denied message based on access level
 */
function getDefaultAccessDeniedMessage(requiresAccess: AccessLevel): string {
  switch (requiresAccess) {
    case "authenticated":
      return "You need to be signed in to access this page. Please sign in and try again.";
    case "admin":
      return "This page is restricted to administrators only. If you believe this is an error, please contact support.";
    case "superadmin":
      return "This page is restricted to super administrators only. Only the highest level of access can view this content.";
    default:
      return "You don't have permission to access this page.";
  }
}

/**
 * Get human-readable description of access level
 */
function getAccessLevelDescription(level: AccessLevel): string {
  switch (level) {
    case "public":
      return "No authentication required";
    case "authenticated":
      return "Authenticated user";
    case "admin":
      return "Admin or Super Admin";
    case "superadmin":
      return "Super Admin only";
    default:
      return "Unknown";
  }
}
