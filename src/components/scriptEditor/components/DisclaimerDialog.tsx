// src/modules/scripts/DisclaimerDialog.tsx
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Link,
  Checkbox,
  FormControlLabel,
  Divider,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { InfoOutlined, Close as CloseIcon } from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import CustomToast from "@/components/common/CustomToast";

interface DisclaimerDialogProps {
  open: boolean;
  onClose: () => void;
  disclaimer: string | undefined | null;
}

/**
 * DisclaimerDialog - Modal dialog for displaying and accepting disclaimers
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Simple state management with useState
 * - Auto-optimized by React 19 compiler
 *
 * Theme integration:
 * - Uses theme.palette for all colors (no hardcoded colors)
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - Uses primary color for main actions (not secondary)
 * - Follows MFADialog pattern for consistent styling
 *
 * Porting changes:
 * - Replaced Backdrop/Fade with standard Dialog (MUI handles this)
 * - Changed secondary color usage to primary (following theme guide)
 * - Removed hardcoded colors and alpha values
 * - Used brand.borderRadius instead of hardcoded values
 * - Added proper Dialog pattern following MFADialog reference
 * - Replaced Paper with Dialog component
 * - Added theme-aware backdrop
 * - Used DialogTitle, DialogContent, DialogActions for structure
 */
export function DisclaimerDialog({
  open,
  onClose,
  disclaimer,
}: DisclaimerDialogProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  // ==========================================
  // STATE
  // ==========================================
  const [accepted, setAccepted] = useState(false);

  // ==========================================
  // EARLY RETURN
  // ==========================================
  // If no disclaimer is provided, don't show the dialog
  if (!disclaimer) {
    return null;
  }

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleAccept = () => {
    if (!accepted) {
      CustomToast("warning", "Please accept the terms and conditions");
      return;
    }
    onClose();
    CustomToast("success", "Disclaimer accepted");
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "background.paper",
          backgroundImage: "none !important", // CRITICAL: Disable MUI's elevation overlay
          borderRadius: `${brand.borderRadius * 1.5}px`,
          border: 2,
          borderColor: "primary.main",
          boxShadow: theme.shadows[24],
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.8)"
              : "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 2,
          py: 2.5,
          px: 3,
          fontFamily: brand.fonts.heading,
        }}
      >
        <InfoOutlined
          sx={{
            color: "primary.main",
            fontSize: 28,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "text.primary",
            fontFamily: brand.fonts.heading,
            flexGrow: 1,
          }}
        >
          Important Disclaimer
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: "text.secondary",
            "&:hover": {
              color: "text.primary",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          py: 3,
          px: 3,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            color: "text.secondary",
            whiteSpace: "pre-wrap",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            fontFamily: brand.fonts.body,
          }}
        >
          {disclaimer}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                sx={{
                  color: "primary.main",
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
                  color: "text.primary",
                  fontFamily: brand.fonts.body,
                }}
              >
                I have read and agree to the disclaimer and{" "}
                <Link
                  href="https://fram3studio.io/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: "primary.main",
                    textDecoration: "none",
                    fontWeight: 500,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Terms & Conditions of Service
                </Link>
              </Typography>
            }
          />
        </Box>
      </DialogContent>

      {/* Footer with action buttons */}
      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          onClick={handleClose}
          sx={{
            borderColor: "divider",
            color: "text.primary",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: "action.hover",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAccept}
          disabled={!accepted}
          sx={{
            px: 3,
            fontWeight: 600,
            "&:disabled": {
              bgcolor: "action.disabledBackground",
              color: "action.disabled",
            },
          }}
        >
          Accept & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DisclaimerDialog;
