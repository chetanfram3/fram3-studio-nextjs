'use client';

import { useState } from 'react';
import { IconButton, Stack, Tooltip } from '@mui/material';
import {
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  X as TwitterIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  handleGoogleSignIn,
  handleFacebookSignIn,
  handleTwitterSignIn,
} from '@/services';
import logger from '@/utils/logger';

interface SocialAuthButtonsProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onMFARequired?: (error: any) => void;
  disabled?: boolean;
}

interface SocialProvider {
  name: string;
  icon: typeof GoogleIcon;
  handler: () => Promise<any>;
  hoverColor: string;
}

/**
 * Social authentication buttons component
 * Provides Google, Facebook, and Twitter sign-in options with MFA support
 */
export default function SocialAuthButtons({
  onSuccess,
  onError,
  onMFARequired,
  disabled = false,
}: SocialAuthButtonsProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState<string | null>(null);

  const socialProviders: SocialProvider[] = [
    {
      name: 'Google',
      icon: GoogleIcon,
      handler: handleGoogleSignIn,
      hoverColor: '#DB4437',
    },
    {
      name: 'Facebook',
      icon: FacebookIcon,
      handler: handleFacebookSignIn,
      hoverColor: '#4267B2',
    },
    {
      name: 'Twitter',
      icon: TwitterIcon,
      handler: handleTwitterSignIn,
      hoverColor: '#1DA1F2',
    },
  ];

  const handleSocialAuth = async (provider: SocialProvider) => {
    if (disabled || loading) return;

    setLoading(provider.name);
    logger.debug(`Initiating ${provider.name} sign in`);

    try {
      await provider.handler();
      logger.debug(`${provider.name} sign in successful`);
      onSuccess?.();
    } catch (error: any) {
      logger.error(`${provider.name} sign in error:`, error);

      // Check multiple ways the error code might be present
      const errorCode = error?.code || error?.error?.code || '';

      // Check if MFA is required
      if (
        errorCode === 'auth/multi-factor-auth-required' ||
        error?.message?.includes('multi-factor-auth-required')
      ) {
        logger.debug('MFA required for social sign-in, passing to handler');

        if (onMFARequired) {
          // Pass the raw error to the parent to handle MFA
          onMFARequired(error);
        } else {
          // Fallback if no MFA handler provided
          onError?.(
            'Multi-factor authentication is required. Please complete MFA setup.'
          );
        }
      } else {
        // Other errors
        const errorMessage =
          error?.message || `Failed to sign in with ${provider.name}`;
        onError?.(errorMessage);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Stack direction="row" spacing={2} justifyContent="center">
      {socialProviders.map((provider) => {
        const Icon = provider.icon;
        const isLoading = loading === provider.name;

        return (
          <Tooltip key={provider.name} title={`Sign in with ${provider.name}`}>
            <span>
              <IconButton
                onClick={() => handleSocialAuth(provider)}
                disabled={disabled || !!loading}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: `${theme.shape.borderRadius}px`,
                  p: 1.5,
                  transition: theme.transitions.create(['all']),
                  opacity: isLoading ? 0.6 : 1,
                  '& svg': {
                    transition: theme.transitions.create(['color']),
                    fontSize: '1.5rem',
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    borderColor: provider.hoverColor,
                    '& svg': {
                      color: provider.hoverColor,
                    },
                  },
                  '&:disabled': {
                    borderColor: 'action.disabled',
                    opacity: 0.4,
                  },
                }}
              >
                <Icon />
              </IconButton>
            </span>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
