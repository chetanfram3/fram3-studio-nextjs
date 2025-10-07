import { ReactNode } from 'react';
import { Box } from '@mui/material';

export const metadata = {
  title: 'Authentication',
  description: 'Sign in or create an account',
};

/**
 * Auth Layout
 * Wrapper for all authentication pages
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
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
  );
}