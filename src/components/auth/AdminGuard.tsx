// src/components/auth/AdminGuard.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthRedirect } from "@/hooks/auth/useAuthRedirect";
import { useSubscription } from "@/hooks/auth/useSubscription";
import { useAuthStore } from "@/store/authStore";
import LoadingDots from "@/components/common/LoadingDots";
import {
  Box,
  Paper,
  Alert,
  Typography,
  Button,
  Container,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SecurityIcon from "@mui/icons-material/Security";
import BlockIcon from "@mui/icons-material/Block";
import { getCurrentBrand } from "@/config/brandConfig";

interface AdminGuardProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
  redirectTo?: string;
  loadingText?: string;
}

/**
 * Admin guard component
 * Protects admin routes and handles redirects based on admin access
 *
 * This component:
 * 1. First checks if user is authenticated (using AuthRedirect)
 * 2. Then checks if user has admin privileges
 * 3. Optionally can require super admin access
 * 4. Shows access denied page if user is not authorized
 */
export default function AdminGuard({
  children,
  requireSuperAdmin = false,
  redirectTo = "/signin",
  loadingText = "Verifying admin access...",
}: AdminGuardProps) {
  const router = useRouter();
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Check authentication first
  const { isRedirecting, loading: authLoading } = useAuthRedirect({
    requireAuth: true,
    redirectTo,
  });

  // Get admin status from Zustand store
  const { isAdmin, isSuperAdmin, subscription, accessLevel } =
    useSubscription();
  const { user } = useAuthStore();

  // Show loading state while checking auth or redirecting
  if (authLoading || isRedirecting) {
    return <LoadingDots isLoading={true} text={loadingText} />;
  }

  // Check if user has required admin access
  const hasRequiredAccess = requireSuperAdmin ? isSuperAdmin : isAdmin;

  // If user doesn't have admin access, show access denied page
  if (!hasRequiredAccess) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: `${brand.borderRadius}px`,
            border: `2px solid ${theme.palette.error.main}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <BlockIcon
              sx={{
                fontSize: 80,
                color: "error.main",
              }}
            />
          </Box>

          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontFamily: brand.fonts.heading,
              color: "error.main",
              fontWeight: 600,
              mb: 2,
            }}
          >
            Access Denied
          </Typography>

          <Typography variant="body1" color="text.primary" sx={{ mb: 4 }}>
            {requireSuperAdmin
              ? "This page requires Super Admin privileges. You do not have permission to access this area."
              : "This page requires Admin privileges. You do not have permission to access this area."}
          </Typography>

          <Alert
            severity="error"
            icon={<SecurityIcon />}
            sx={{
              mb: 4,
              textAlign: "left",
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Your Current Access:
            </Typography>
            <Typography variant="body2" component="div">
              <strong>Email:</strong> {user?.email || "N/A"}
            </Typography>
            <Typography variant="body2" component="div">
              <strong>Subscription:</strong> {subscription}
            </Typography>
            <Typography variant="body2" component="div">
              <strong>Access Level:</strong> {accessLevel}
            </Typography>
            <Typography variant="body2" component="div" sx={{ mt: 1 }}>
              <strong>Required:</strong>{" "}
              {requireSuperAdmin ? "Super Admin" : "Admin"}
            </Typography>
          </Alert>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              sx={{
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              Go Back
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push("/dashboard")}
              sx={{
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              Go to Dashboard
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 4 }}
          >
            If you believe this is an error, please contact your system
            administrator.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // User has required access, render children
  return <>{children}</>;
}
