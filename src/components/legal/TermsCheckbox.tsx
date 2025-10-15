// src/components/legal/TermsCheckbox.tsx
"use client";

import { memo } from "react";
import {
  Checkbox,
  FormControlLabel,
  Link,
  Typography,
  Box,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

/**
 * Terms and Conditions Checkbox Component
 * 
 * Displays a checkbox with links to legal documents
 * Follows theme and brand guidelines for consistent styling
 * 
 * @example
 * <TermsCheckbox
 *   checked={accepted}
 *   onChange={setAccepted}
 *   error={!accepted && submitted}
 *   helperText="You must accept the terms to continue"
 * />
 */
function TermsCheckbox({
  checked,
  onChange,
  disabled = false,
  error = false,
  helperText,
}: TermsCheckboxProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box sx={{ width: "100%" }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            color="primary"
            sx={{
              color: error ? "error.main" : "text.secondary",
              "&.Mui-checked": {
                color: "primary.main",
              },
            }}
          />
        }
        label={
          <Typography
            variant="body2"
            sx={{
              color: error ? "error.main" : "text.secondary",
              fontFamily: brand.fonts.body,
            }}
          >
            I agree to the{" "}
            <Link
              href="/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "primary.main",
                textDecoration: "underline",
                fontWeight: 500,
                "&:hover": {
                  color: "primary.light",
                },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              Terms of Service
            </Link>
            ,{" "}
            <Link
              href="/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "primary.main",
                textDecoration: "underline",
                fontWeight: 500,
                "&:hover": {
                  color: "primary.light",
                },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </Link>
            , and{" "}
            <Link
              href="/legal/cookies"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "primary.main",
                textDecoration: "underline",
                fontWeight: 500,
                "&:hover": {
                  color: "primary.light",
                },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              Cookie Policy
            </Link>
          </Typography>
        }
        sx={{
          alignItems: "flex-start",
          m: 0,
          "& .MuiFormControlLabel-label": {
            pt: 0.5,
          },
        }}
      />

      {helperText && (
        <Typography
          variant="caption"
          sx={{
            color: error ? "error.main" : "text.secondary",
            display: "block",
            mt: 0.5,
            ml: 4,
            fontFamily: brand.fonts.body,
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(TermsCheckbox);