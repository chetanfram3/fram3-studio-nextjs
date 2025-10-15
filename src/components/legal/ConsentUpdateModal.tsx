// src/components/legal/ConsentUpdateModal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

interface ConsentUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => Promise<void>;
  version?: string;
  changes?: string[];
}

/**
 * Consent Update Modal
 *
 * Displays when terms/privacy policy are updated
 * Blocks user from proceeding until they accept
 *
 * Features:
 * - Theme-aware styling
 * - Loading state during acceptance
 * - Success feedback
 * - Links to view updated documents
 *
 * @example
 * <ConsentUpdateModal
 *   open={needsUpdate}
 *   onClose={() => {}}
 *   onAccept={handleAccept}
 *   version="1.1"
 *   changes={["Updated data retention policy", "Added GDPR compliance"]}
 * />
 */
export default function ConsentUpdateModal({
  open,
  onClose,
  onAccept,
  version = "1.0",
  changes = [],
}: ConsentUpdateModalProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    try {
      await onAccept();
      // Success - modal will close via onClose
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update consent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          backgroundColor: "background.paper",
          backgroundImage: "none !important",
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
              ? "rgba(0, 0, 0, 0.85)"
              : "rgba(0, 0, 0, 0.7)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: brand.fonts.heading,
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <InfoOutlinedIcon color="primary" />
        <Typography
          variant="h6"
          component="span"
          sx={{
            fontFamily: brand.fonts.heading,
            color: "text.primary",
          }}
        >
          Terms Updated
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: "background.paper", py: 3 }}>
        <Stack spacing={2}>
          <Alert
            severity="info"
            icon={<CheckCircleOutlineIcon />}
            sx={{
              bgcolor: "background.default",
              border: 1,
              borderColor: "primary.main",
              "& .MuiAlert-icon": {
                color: "primary.main",
              },
            }}
          >
            <Typography variant="body2" color="text.primary">
              We&apos;ve updated our Terms of Service and Privacy Policy to
              version {version}
            </Typography>
          </Alert>

          <Box>
            <Typography
              variant="body1"
              color="text.primary"
              sx={{ mb: 1, fontWeight: 600 }}
            >
              What&apos;s New:
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please review the updated terms before continuing to use our
              services.
            </Typography>

            {changes.length > 0 && (
              <Box
                component="ul"
                sx={{
                  pl: 2,
                  my: 2,
                  "& li": {
                    color: "text.secondary",
                    mb: 1,
                  },
                }}
              >
                {changes.map((change, index) => (
                  <li key={index}>
                    <Typography variant="body2">{change}</Typography>
                  </li>
                ))}
              </Box>
            )}
          </Box>

          <Divider sx={{ borderColor: "divider" }} />

          <Typography variant="body2" color="text.secondary">
            By continuing, you acknowledge that you have read and agree to our
            updated Terms of Service and Privacy Policy.
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                bgcolor: "background.default",
                border: 1,
                borderColor: "error.main",
              }}
            >
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          p: 2,
          gap: 1,
        }}
      >
        <Button
          href="/legal/terms"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "text.secondary",
            "&:hover": {
              color: "primary.main",
            },
          }}
          onClick={(e) => e.stopPropagation()}
        >
          View Terms
        </Button>
        <Button
          href="/legal/privacy"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "text.secondary",
            "&:hover": {
              color: "primary.main",
            },
          }}
          onClick={(e) => e.stopPropagation()}
        >
          View Privacy
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAccept}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={16} color="inherit" /> : null
          }
          sx={{
            minWidth: 140,
            fontWeight: 600,
            borderRadius: `${brand.borderRadius}px`,
          }}
        >
          {loading ? "Accepting..." : "Accept & Continue"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
