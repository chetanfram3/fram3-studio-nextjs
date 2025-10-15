"use client";

import { ReactNode } from 'react';
import { Box } from '@mui/material';
import AuthRedirect from '@/components/auth/AuthRedirect';

/**
 * Auth Layout
 * Wrapper for all authentication pages (signin, signup, forgot-password, etc.)
 * Automatically redirects authenticated users to dashboard
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthRedirect redirectTo="/dashboard">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </AuthRedirect>
  );
}