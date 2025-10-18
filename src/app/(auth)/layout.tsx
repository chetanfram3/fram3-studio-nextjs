"use client";

import { ReactNode } from "react";
import { Box } from "@mui/material";
import { UnifiedAuthGuard } from "@/components/auth";

/**
 * Auth Layout
 * Wrapper for all authentication pages (signin, signup, forgot-password, etc.)
 * Automatically redirects authenticated users to dashboard
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <UnifiedAuthGuard
      requiresAccess="public"
      redirectIfAuthenticated="/dashboard"
    >
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
        }}
      >
        {children}
      </Box>
    </UnifiedAuthGuard>
  );
}
