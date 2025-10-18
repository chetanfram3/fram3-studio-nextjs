// src/components/auth/ConsentGate.tsx
"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import { useConsentGate } from "@/hooks/auth/useConsentGate";
import { LEGAL_VERSIONS } from "@/config/legalVersions";
import LockIcon from "@mui/icons-material/Lock";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LoadingDots from "../common/LoadingDots";

interface ConsentGateProps {
  children: ReactNode;
}

/**
 * Consent Gate Component
 *
 * Blocks application access until user accepts legal agreements.
 * Works across all sign-in methods (email, Google, Facebook, etc.)
 *
 * Features:
 * - Blocking modal (cannot close via backdrop/escape)
 * - Different UI for first login vs consent update
 * - Accept button saves consent to Firestore
 * - Decline button logs user out
 * - Automatic version checking
 *
 * Usage:
 * Wrap your app or protected routes:
 *
 * @example
 * <ConsentGate>
 *   <YourAppContent />
 * </ConsentGate>
 */
export default function ConsentGate({ children }: ConsentGateProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();
  const pathname = usePathname();

  const {
    showModal,
    isFirstLogin,
    needsUpdate,
    loading,
    error,
    handleAccept,
    handleDecline,
  } = useConsentGate();

  // Show loading state while checking consent
  if (loading && !showModal) {
    return <LoadingDots isLoading={true} text="Checking your account status" />;
  }

  // If no modal needed, render children
  if (!showModal) {
    return <>{children}</>;
  }
  const isOnboardingPage =
    pathname === "/create-now" || pathname.startsWith("/create-now");
  // Render blocking consent modal
  return (
    <>
      {/* Render children behind modal (blocked) */}
      {/* ✅ Conditionally render children behind modal */}
      {!isOnboardingPage && (
        <Box sx={{ filter: "blur(4px)", pointerEvents: "none" }}>
          {children}
        </Box>
      )}

      {/* Blocking Consent Modal */}
      <Dialog
        open={showModal}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            backgroundColor: "background.paper",
            backgroundImage: "none !important",
            borderRadius: `${brand.borderRadius * 1.5}px`,
            border: 2,
            borderColor: isFirstLogin ? "primary.main" : "warning.main",
            boxShadow: theme.shadows[24],
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: isDarkMode
                ? "rgba(0, 0, 0, 0.9)"
                : "rgba(0, 0, 0, 0.8)",
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
            gap: 1.5,
            py: 2.5,
          }}
        >
          {isFirstLogin ? (
            <LockIcon color="primary" sx={{ fontSize: 28 }} />
          ) : (
            <InfoOutlinedIcon color="warning" sx={{ fontSize: 28 }} />
          )}
          <Typography
            variant="h5"
            component="span"
            sx={{
              fontFamily: brand.fonts.heading,
              color: "text.primary",
              fontWeight: 600,
            }}
          >
            {isFirstLogin
              ? "Welcome! Terms & Conditions Agreement"
              : "Terms Updated - Action Required"}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ bgcolor: "background.paper", py: 3 }}>
          <Stack spacing={3}>
            {/* Error Alert */}
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

            {/* First Login Message */}
            {isFirstLogin && (
              <>
                <Typography variant="body1" color="text.primary">
                  Before continuing, please review and accept our legal
                  agreements to use our services.
                </Typography>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.primary"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    You must accept:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="text.primary">
                            Terms of Service (v{LEGAL_VERSIONS.TERMS})
                          </Typography>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="text.primary">
                            Privacy Policy (v{LEGAL_VERSIONS.PRIVACY})
                          </Typography>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="text.primary">
                            Copyright (v{LEGAL_VERSIONS.COOKIES})
                          </Typography>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="text.primary">
                            Cookie Policy (v{LEGAL_VERSIONS.COOKIES})
                          </Typography>
                        }
                      />
                    </ListItem>
                  </List>
                </Box>
              </>
            )}

            {/* Update Required Message */}
            {needsUpdate && !isFirstLogin && (
              <>
                <Alert
                  severity="warning"
                  icon={<WarningAmberIcon />}
                  sx={{
                    bgcolor: "background.default",
                    border: 1,
                    borderColor: "warning.main",
                  }}
                >
                  <Typography variant="body2" color="text.primary">
                    We&apos;ve updated our legal documents to version{" "}
                    {LEGAL_VERSIONS.TERMS}. Please review and accept to continue
                    using our services.
                  </Typography>
                </Alert>

                <Typography variant="body2" color="text.secondary">
                  Your continued use of our platform requires acceptance of the
                  updated Terms of Service and Privacy Policy.
                </Typography>
              </>
            )}

            <Divider sx={{ borderColor: "divider" }} />

            {/* Review Links */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1 }}
              >
                Review our legal documents:
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  href="/legal/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{
                    color: "primary.main",
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  Terms of Service
                </Button>
                <Button
                  href="/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{
                    color: "primary.main",
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  Privacy Policy
                </Button>
                <Button
                  href="/legal/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{
                    color: "primary.main",
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  Copyright© Policy
                </Button>
                <Button
                  href="/legal/cookies"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{
                    color: "primary.main",
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  Cookie Policy
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ borderColor: "divider" }} />

            {/* Consent Notice */}
            <Typography variant="caption" color="text.secondary">
              By clicking &quot;Accept & Continue&quot;, you acknowledge that
              you have read, understood, and agree to be bound by our Terms of
              Service, Privacy Policy, and Cookie Policy.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
            p: 2.5,
            gap: 1.5,
          }}
        >
          <Button
            variant="outlined"
            color="error"
            onClick={handleDecline}
            disabled={loading}
            sx={{
              minWidth: 120,
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            Decline & Logout
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
              minWidth: 160,
              fontWeight: 600,
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            {loading ? "Saving..." : "Accept & Continue"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
