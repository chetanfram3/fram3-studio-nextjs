"use client";

import { useState } from "react";
import { IconButton, Stack, Tooltip } from "@mui/material";
import {
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  X as TwitterIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import {
  handleGoogleSignIn,
  handleFacebookSignIn,
  handleTwitterSignIn,
} from "@/services";
import { getCurrentBrand } from "@/config/brandConfig";
import logger from "@/utils/logger";

interface SocialAuthButtonsProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onMFARequired?: (error: any) => void;
  onLoadingChange?: (isLoading: boolean) => void;
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
  onLoadingChange,
  disabled = false,
}: SocialAuthButtonsProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [loading, setLoading] = useState<string | null>(null);

  const socialProviders: SocialProvider[] = [
    {
      name: "Google",
      icon: GoogleIcon,
      handler: handleGoogleSignIn,
      hoverColor: "#DB4437",
    },
    {
      name: "Facebook",
      icon: FacebookIcon,
      handler: handleFacebookSignIn,
      hoverColor: "#4267B2",
    },
    {
      name: "Twitter",
      icon: TwitterIcon,
      handler: handleTwitterSignIn,
      hoverColor: theme.palette.primary.light, // Use theme's primary.light (gold)
    },
  ];

  const handleSocialAuth = async (provider: SocialProvider) => {
    if (disabled || loading) return;

    setLoading(provider.name);
    onLoadingChange?.(true); // ✅ Notify parent loading started
    logger.debug(`Initiating ${provider.name} sign in`);

    try {
      await provider.handler();
      logger.debug(`${provider.name} sign in successful`);
      onLoadingChange?.(false); // ✅ Clear loading on success
      onSuccess?.();
    } catch (error: any) {
      // Check multiple ways the error code might be present
      const errorCode = error?.code || error?.error?.code || "";

      // Check if MFA is required
      if (
        errorCode === "auth/multi-factor-auth-required" ||
        error?.message?.includes("multi-factor-auth-required")
      ) {
        logger.debug("MFA required for social sign-in, passing to handler");

        if (onMFARequired) {
          // Pass the raw error to the parent to handle MFA
          // DON'T clear loading here - let parent handle it
          onMFARequired(error);
        } else {
          // Fallback if no MFA handler provided
          onLoadingChange?.(false); // ✅ Clear loading on error
          onError?.(
            "Multi-factor authentication is required. Please complete MFA setup."
          );
        }
      } else {
        logger.error(`${provider.name} sign in error:`, error);
        // Other errors - clear loading
        onLoadingChange?.(false); // ✅ Clear loading on error
        const errorMessage =
          error?.message || `Failed to sign in with ${provider.name}`;
        onError?.(errorMessage);
      }
    } finally {
      setLoading(null); // ✅ Only clear internal loading state
      // DON'T call onLoadingChange here - it's already handled in try/catch
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
                  borderColor: "divider",
                  borderRadius: 2, // Larger radius (16px with default spacing)
                  p: 1.5,
                  transition: theme.transitions.create(["all"]),
                  opacity: isLoading ? 0.6 : 1,
                  "& svg": {
                    transition: theme.transitions.create(["color"]),
                    fontSize: "1.5rem",
                  },
                  "&:hover": {
                    backgroundColor: "action.hover",
                    borderColor: provider.hoverColor,
                    "& svg": {
                      color: provider.hoverColor,
                    },
                  },
                  "&:disabled": {
                    borderColor: "action.disabled",
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
