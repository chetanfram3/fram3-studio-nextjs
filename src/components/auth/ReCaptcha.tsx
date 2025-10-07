'use client';

import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRecaptcha } from '@/hooks/auth/useRecaptcha';

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  action: string;
  onError?: (error: string) => void;
}

/**
 * ReCAPTCHA v3 component
 * Automatically executes and provides token
 */
export default function ReCaptcha({ onVerify, action, onError }: ReCaptchaProps) {
  const { token, isLoading, error } = useRecaptcha(action, true);

  useEffect(() => {
    if (token) {
      onVerify(token);
    }
  }, [token, onVerify]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography variant="caption" color="text.secondary">
          Verifying security...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ my: 2 }}>
        <Typography variant="caption" color="error">
          Security verification failed. Please refresh and try again.
        </Typography>
      </Box>
    );
  }

  // reCAPTCHA v3 is invisible
  return null;
}