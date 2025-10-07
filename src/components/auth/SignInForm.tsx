'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  Container,
  CircularProgress,
} from '@mui/material';
import {
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getCurrentBrand } from '@/config/brandConfig';
import { signInWithEmail } from '@/services';
import { useMFA } from '@/hooks/auth/useMFA';
import LogoHeader from './LogoHeader';
import SocialAuthButtons from './SocialAuthButtons';
import MFADialog from './MFADialog';
import LoadingDots from '../common/LoadingDots';
import logger from '@/utils/logger';

/**
 * Sign In Form Component
 * Complete sign-in with email/password, social auth, and MFA support
 */
export default function SignInForm() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();
  const mfa = useMFA();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    logger.debug('Attempting email sign in');

    try {
      const user = await signInWithEmail(email, password);

      if (user) {
        logger.debug('Sign in successful');
        router.push('/dashboard');
      }
    } catch (err: any) {
      logger.error('Sign in error:', err);

      // Check if MFA is required
      if (err.code === 'auth/multi-factor-auth-required') {
        logger.debug('MFA required, initiating challenge');
        await mfa.handleMFAChallenge(err);
        setIsLoading(false);
      } else {
        setError(
          err.message || 'Failed to sign in. Please check your credentials.'
        );
        setIsLoading(false);
      }
    }
  };

  const handleMFAVerify = async () => {
    const user = await mfa.handleMFAVerification();

    if (user) {
      logger.debug('MFA verification successful');
      router.push('/dashboard');
    }
  };

  const handleSocialSuccess = () => {
    logger.debug('Social auth successful');
    router.push('/dashboard');
  };

  const handleSocialError = (error: string) => {
    logger.error('Social auth error:', error);
    setError(error);
  };

  const handleSocialMFA = async (mfaError: any) => {
    logger.debug('Social auth requires MFA, initiating challenge');
    setError('');
    setIsLoading(false);
    await mfa.handleMFAChallenge(mfaError);
  };

  if (isLoading && !mfa.isOpen) {
    return <LoadingDots isLoading={isLoading} text="Signing you in..." />;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: { xs: 2, md: 4 }, mb: 8 }}>
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
            variant="h4"
            align="center"
            gutterBottom
            sx={{
              fontFamily: brand.fonts.heading,
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            Welcome Back
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Social Sign In */}
          <Box sx={{ mb: 3 }}>
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Sign in with Social Media
              </Typography>
            </Divider>

            <SocialAuthButtons
              onSuccess={handleSocialSuccess}
              onError={handleSocialError}
              onMFARequired={handleSocialMFA}
              disabled={isLoading}
            />
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              or continue with email
            </Typography>
          </Divider>

          {/* Email Sign In Form */}
          <Box component="form" onSubmit={handleEmailSignIn} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                startIcon={
                  isLoading ? <CircularProgress size={20} /> : <LoginIcon />
                }
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
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Box>

            {/* Register Link */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account yet?
              </Typography>
              <Button
                onClick={() => router.push('/register')}
                variant="text"
                startIcon={<PersonAddIcon />}
                sx={{
                  mt: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Register Now
              </Button>
            </Box>

            {/* Forgot Password Link */}
            <Button
              fullWidth
              variant="text"
              onClick={() => router.push('/forgot-password')}
              sx={{
                mt: 2,
                textTransform: 'none',
                fontWeight: 500,
                color: 'text.secondary',
              }}
            >
              Forgot password?
            </Button>
          </Box>
        </Box>
      </Box>

      {/* MFA Dialog */}
      <MFADialog
        open={mfa.isOpen}
        onClose={mfa.closeDialog}
        verificationCode={mfa.verificationCode}
        onCodeChange={mfa.setVerificationCode}
        onVerify={handleMFAVerify}
        error={mfa.error}
        loading={mfa.loading}
        phoneNumber={mfa.phoneNumber}
      />
    </Container>
  );
}
