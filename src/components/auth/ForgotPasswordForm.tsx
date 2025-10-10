'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import {
  Login as LoginIcon,
  Email as EmailIcon,
  LockReset as LockResetIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getCurrentBrand } from '@/config/brandConfig';
import { resetPassword } from '@/services';
import { LogoHeader } from '@/components/auth';
import logger from '@/utils/logger';

/**
 * Forgot Password Form Component
 * Allows users to request a password reset email
 */
export default function ForgotPasswordForm() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate email
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    logger.debug('Requesting password reset for:', email);

    try {
      await resetPassword(email);
      setSuccess(true);
      logger.debug('Password reset email sent successfully');
    } catch (err) {
      logger.error('Password reset error:', err);
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ mt: { xs: 4, md: 8 }, mb: 4 }}>
        <LogoHeader />

        <Box
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: `${brand.borderRadius * 1.5}px`,
            border: 2,
            borderColor: 'primary.main',
            bgcolor: 'background.paper',
          }}
        >
          <Typography
            component="h1"
            variant="h5"
            align="center"
            gutterBottom
            sx={{
              fontFamily: brand.fonts.heading,
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            Reset Password
          </Typography>

          <Typography
            variant="body2"
            align="center"
            sx={{ mb: 3, color: 'text.secondary' }}
          >
            Enter your email address and we shall send you a link to reset your password
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Password reset email sent! Please check your inbox and follow the instructions.
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              required
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || success}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || success}
                startIcon={<LockResetIcon />}
                sx={{
                  py: 1.5,
                  px: 4,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: `${brand.borderRadius / 2}px`,
                  transition: theme.transitions.create(['all']),
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                  },
                }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Remember your password?
              </Typography>
              <Button
                onClick={() => router.push('/signin')}
                variant="text"
                startIcon={<LoginIcon />}
                sx={{
                  mt: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Sign in here
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}