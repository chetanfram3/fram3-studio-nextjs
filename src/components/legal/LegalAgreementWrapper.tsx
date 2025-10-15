// src/components/legal/LegalAgreementWrapper.tsx
"use client";

import { ReactNode, useState } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import TermsCheckbox from "./TermsCheckbox";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

interface LegalAgreementWrapperProps {
  children: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: boolean;
  errorMessage?: string;
  title?: string;
  description?: string;
  showIcon?: boolean;
}

/**
 * Legal Agreement Wrapper
 *
 * Wraps authentication/sign-up forms with terms acceptance checkbox
 * Provides consistent styling and validation feedback
 *
 * Features:
 * - Theme-aware design
 * - Error state handling
 * - Customizable title and description
 * - Optional security icon
 *
 * @example
 * <LegalAgreementWrapper
 *   checked={termsAccepted}
 *   onChange={setTermsAccepted}
 *   error={submitted && !termsAccepted}
 *   errorMessage="You must accept the terms to continue"
 * >
 *   <SocialAuthButtons disabled={!termsAccepted} />
 * </LegalAgreementWrapper>
 */
export default function LegalAgreementWrapper({
  children,
  checked,
  onChange,
  error = false,
  errorMessage,
  title = "Review & Accept",
  description = "Please review and accept our legal agreements before continuing",
  showIcon = true,
}: LegalAgreementWrapperProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Stack spacing={3} sx={{ width: "100%" }}>
      {/* Legal Agreement Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: "background.paper",
          border: 1,
          borderColor: error ? "error.main" : "divider",
          borderRadius: `${brand.borderRadius}px`,
          transition: theme.transitions.create(["border-color", "box-shadow"]),
          ...(error && {
            boxShadow: `0 0 0 2px ${theme.palette.error.main}33`,
          }),
        }}
      >
        <Stack spacing={2}>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {showIcon && (
              <VerifiedUserIcon
                sx={{
                  color: error ? "error.main" : "primary.main",
                  fontSize: 28,
                }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: brand.fonts.heading,
                  fontWeight: 600,
                  color: "text.primary",
                  mb: 0.5,
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                }}
              >
                {description}
              </Typography>
            </Box>
          </Box>

          {/* Terms Checkbox */}
          <TermsCheckbox
            checked={checked}
            onChange={onChange}
            error={error}
            helperText={error ? errorMessage : undefined}
          />
        </Stack>
      </Paper>

      {/* Content (Auth Buttons, Forms, etc.) */}
      <Box>{children}</Box>
    </Stack>
  );
}
