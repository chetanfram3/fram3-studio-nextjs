// src/components/legal/CookieConsentBanner.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Link,
  IconButton,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CookieIcon from "@mui/icons-material/Cookie";
import { getCurrentBrand } from "@/config/brandConfig";
import { updateConsentPreferences } from "@/services/consentService";
import {
  hasValidConsent,
  saveConsentToLocalStorage,
  createDefaultCookieConsent,
  createFullCookieConsent,
  initializeTrackingServices,
  CONSENT_VERSION,
} from "@/utils/consentHelpers";
import type { CookieConsent, ConsentPreferences } from "@/types/consent";
import type { UserProfile } from "@/types/profile";
import logger from "@/utils/logger";

interface CookieConsentBannerProps {
  userProfile?: UserProfile | null;
}

export default function CookieConsentBanner({
  userProfile,
}: CookieConsentBannerProps) {
  const brand = getCurrentBrand();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Consent preferences state
  const [preferences, setPreferences] = useState<CookieConsent>(
    createDefaultCookieConsent()
  );

  // Check if user has already given consent
  useEffect(() => {
    checkConsentStatus();
  }, [userProfile]);

  const checkConsentStatus = () => {
    // Check if user has valid consent
    if (hasValidConsent(userProfile, "cookies")) {
      setShowBanner(false);

      // Initialize services with existing consent
      const consent =
        userProfile?.extendedInfo?.details?.consentPreferences?.cookieConsent;
      if (consent) {
        initializeTrackingServices(consent);
      }

      return;
    }

    // No valid consent found, show banner
    setShowBanner(true);
    logger.debug("No valid cookie consent found, showing banner");
  };

  const handleAcceptAll = async () => {
    const fullConsent = createFullCookieConsent();
    await saveConsent(fullConsent);
  };

  const handleAcceptSelected = async () => {
    await saveConsent({
      ...preferences,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    });
  };

  const handleRejectAll = async () => {
    const minimalConsent = createDefaultCookieConsent();
    await saveConsent(minimalConsent);
  };

  const saveConsent = async (consent: CookieConsent) => {
    setIsLoading(true);

    try {
      // Step 1: Always save to localStorage first (immediate persistence)
      saveConsentToLocalStorage({ cookieConsent: consent });
      logger.debug("Consent saved to localStorage");

      // Step 2: Initialize tracking services
      initializeTrackingServices(consent);

      // Step 3: If user is logged in, save to backend
      if (userProfile?.uid) {
        const consentPreferences: ConsentPreferences = {
          cookieConsent: consent,
        };

        await updateConsentPreferences(consentPreferences);
        logger.debug("Consent saved to backend");
      } else {
        logger.debug("User not logged in, consent saved to localStorage only");
      }

      // Step 4: Hide banner
      setShowBanner(false);
      setShowDetails(false);
    } catch (error) {
      logger.error("Failed to save consent:", error);
      alert("Failed to save your preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreference = (key: keyof CookieConsent) => {
    if (key === "necessary") return; // Necessary cookies cannot be disabled

    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const CookieCategory = ({
    title,
    description,
    required,
    checked,
    onChange,
  }: {
    title: string;
    description: string;
    required?: boolean;
    checked: boolean;
    onChange: () => void;
  }) => (
    <Box sx={{ mb: 2, p: 2, bgcolor: "background.default", borderRadius: 1 }}>
      <FormControlLabel
        control={
          <Checkbox checked={checked} onChange={onChange} disabled={required} />
        }
        label={
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {title} {required && <span style={{ color: "#f44336" }}>*</span>}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          </Box>
        }
        sx={{ alignItems: "flex-start", m: 0, width: "100%" }}
      />
    </Box>
  );

  if (!showBanner) return null;

  return (
    <>
      {/* Simple Banner (default view) */}
      {!showDetails && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "background.paper",
            boxShadow: 3,
            zIndex: 9999,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              maxWidth: 1200,
              mx: "auto",
              p: { xs: 2, sm: 3 },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "center" },
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", gap: 2, flex: 1 }}>
              <CookieIcon
                sx={{
                  fontSize: 32,
                  color: "primary.main",
                  flexShrink: 0,
                }}
              />
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  We value your privacy
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  We use cookies to enhance your browsing experience, serve
                  personalized content, and analyze our traffic. By clicking
                  "Accept All", you consent to our use of cookies.{" "}
                  <Link
                    href="/legal/privacy"
                    target="_blank"
                    sx={{ textDecoration: "underline" }}
                  >
                    Learn more
                  </Link>
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexDirection: { xs: "column", sm: "row" },
                flexShrink: 0,
              }}
            >
              <Button
                variant="outlined"
                onClick={() => setShowDetails(true)}
                disabled={isLoading}
                sx={{ borderRadius: `${brand.borderRadius}px` }}
              >
                Customize
              </Button>
              <Button
                variant="outlined"
                onClick={handleRejectAll}
                disabled={isLoading}
                sx={{ borderRadius: `${brand.borderRadius}px` }}
              >
                Reject All
              </Button>
              <Button
                variant="contained"
                onClick={handleAcceptAll}
                disabled={isLoading}
                sx={{ borderRadius: `${brand.borderRadius}px` }}
              >
                Accept All
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Detailed Settings Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => !isLoading && setShowDetails(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: `${brand.borderRadius * 1.5}px`,
            backgroundImage: "none !important",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CookieIcon />
            <span>Cookie Preferences</span>
          </Box>
          <IconButton
            onClick={() => setShowDetails(false)}
            disabled={isLoading}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 3 }}>
            We use cookies and similar technologies to help personalize content,
            tailor and measure ads, and provide a better experience. By clicking
            accept, you agree to this use of cookies and data.
          </Alert>

          <Typography variant="body2" color="text.secondary" paragraph>
            You can customize which types of cookies you want to allow. Note
            that blocking some types of cookies may impact your experience on
            our website.
          </Typography>

          <CookieCategory
            title="Necessary Cookies"
            description="Essential for the website to function. These cookies enable core functionality such as security, network management, and accessibility. You cannot opt-out of these cookies."
            required
            checked={preferences.necessary}
            onChange={() => {}}
          />

          <CookieCategory
            title="Analytics Cookies"
            description="Help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website and services."
            checked={preferences.analytics}
            onChange={() => togglePreference("analytics")}
          />

          <CookieCategory
            title="Marketing Cookies"
            description="Used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user."
            checked={preferences.marketing}
            onChange={() => togglePreference("marketing")}
          />

          <CookieCategory
            title="Preference Cookies"
            description="Enable the website to remember information that changes the way the website behaves or looks, such as your preferred language or region."
            checked={preferences.preferences}
            onChange={() => togglePreference("preferences")}
          />

          <Box
            sx={{ mt: 3, p: 2, bgcolor: "background.default", borderRadius: 1 }}
          >
            <Typography variant="caption" color="text.secondary">
              <strong>Version:</strong> {CONSENT_VERSION} |{" "}
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleRejectAll}
            disabled={isLoading}
            sx={{ borderRadius: `${brand.borderRadius}px` }}
          >
            Reject All
          </Button>
          <Button
            variant="outlined"
            onClick={handleAcceptSelected}
            disabled={isLoading}
            sx={{ borderRadius: `${brand.borderRadius}px` }}
          >
            Save Preferences
          </Button>
          <Button
            variant="contained"
            onClick={handleAcceptAll}
            disabled={isLoading}
            sx={{ borderRadius: `${brand.borderRadius}px` }}
          >
            Accept All
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
