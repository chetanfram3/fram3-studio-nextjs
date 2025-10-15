// src/app/test/legal-agreement/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Divider,
  Alert,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  TermsCheckbox,
  ConsentUpdateModal,
  LegalAgreementWrapper,
} from "@/components/legal";
import {
  acceptTermsAndPrivacy,
  getConsentFromFirestore,
  needsConsentUpdate,
  updateCookieConsent,
  getConsentHistory,
  deleteConsentFromFirestore,
} from "@/services/firestore";
import { useAuthStore } from "@/store/authStore";
import type { ConsentPreferences } from "@/types/consent";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningIcon from "@mui/icons-material/Warning";

/**
 * Legal Agreement UI Test Page (with Firebase)
 *
 * Interactive demo page to test all legal agreement components
 * AND real Firebase/Firestore operations
 */
export default function LegalAgreementTestPage() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { user } = useAuthStore();

  // UI State
  const [termsChecked, setTermsChecked] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Firebase State
  const [firebaseLoading, setFirebaseLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [consentData, setConsentData] = useState<ConsentPreferences | null>(
    null
  );
  const [needsUpdate, setNeedsUpdate] = useState<boolean | null>(null);
  const [consentHistory, setConsentHistory] = useState<any[]>([]);

  // Fetch consent on mount
  useEffect(() => {
    if (user) {
      fetchConsent();
    }
  }, [user]);

  // =========================================================================
  // FIREBASE OPERATIONS
  // =========================================================================

  /**
   * Fetch current consent from Firestore
   */
  const fetchConsent = async () => {
    if (!user) {
      setFirebaseError("No authenticated user");
      return;
    }

    setFirebaseLoading(true);
    setFirebaseError(null);

    try {
      const consent = await getConsentFromFirestore();
      setConsentData(consent);

      // Check if needs update
      const needsUpdateResult = await needsConsentUpdate();
      setNeedsUpdate(needsUpdateResult);
    } catch (error) {
      setFirebaseError(
        error instanceof Error ? error.message : "Failed to fetch consent"
      );
    } finally {
      setFirebaseLoading(false);
    }
  };

  /**
   * Save consent to Firestore (accept terms)
   */
  const handleSaveConsent = async () => {
    if (!user) {
      setFirebaseError("No authenticated user. Please sign in first.");
      return;
    }

    setFirebaseLoading(true);
    setFirebaseError(null);

    try {
      // Check if consent exists to determine if first login
      const existingConsent = await getConsentFromFirestore();
      const isFirstLogin = !existingConsent;

      await acceptTermsAndPrivacy(isFirstLogin);
      await fetchConsent(); // Refresh data
      alert("✅ Consent saved to Firestore successfully!");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to save consent";
      setFirebaseError(errorMsg);
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setFirebaseLoading(false);
    }
  };

  /**
   * Update cookie consent
   */
  const handleUpdateCookies = async () => {
    if (!user) {
      setFirebaseError("No authenticated user. Please sign in first.");
      return;
    }

    setFirebaseLoading(true);
    setFirebaseError(null);

    try {
      await updateCookieConsent({
        necessary: true,
        analytics: true,
        marketing: false,
        preferences: true,
        timestamp: new Date().toISOString(),
        version: "1.0",
      });
      await fetchConsent(); // Refresh data
      alert("✅ Cookie consent updated successfully!");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to update cookies";
      setFirebaseError(errorMsg);
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setFirebaseLoading(false);
    }
  };

  /**
   * Fetch consent history
   */
  const handleFetchHistory = async () => {
    if (!user) {
      setFirebaseError("No authenticated user. Please sign in first.");
      return;
    }

    setFirebaseLoading(true);
    setFirebaseError(null);

    try {
      const history = await getConsentHistory(10);
      setConsentHistory(history);
      alert(`✅ Fetched ${history.length} history entries`);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch history";
      setFirebaseError(errorMsg);
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setFirebaseLoading(false);
    }
  };

  /**
   * Delete consent (soft delete)
   */
  const handleDeleteConsent = async () => {
    if (!user) {
      setFirebaseError("No authenticated user. Please sign in first.");
      return;
    }

    if (
      !confirm("Are you sure you want to delete consent data? (Soft delete)")
    ) {
      return;
    }

    setFirebaseLoading(true);
    setFirebaseError(null);

    try {
      await deleteConsentFromFirestore();
      await fetchConsent(); // Refresh data
      alert("✅ Consent deleted successfully!");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to delete consent";
      setFirebaseError(errorMsg);
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setFirebaseLoading(false);
    }
  };

  // =========================================================================
  // UI HANDLERS
  // =========================================================================

  const handleConsentUpdate = async () => {
    await handleSaveConsent();
    setShowUpdateModal(false);
  };

  const handleSubmit = () => {
    if (!termsChecked) {
      setTermsError(true);
      return;
    }
    setTermsError(false);
    setSubmitted(true);
    alert("Form submitted successfully! ✅");
  };

  const resetTests = () => {
    setTermsChecked(false);
    setTermsError(false);
    setSubmitted(false);
    setShowUpdateModal(false);
    setFirebaseError(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Typography
          variant="h3"
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: 700,
            color: "text.primary",
            mb: 2,
          }}
        >
          Legal Agreement + Firebase Test
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Interactive demo with real Firestore operations
        </Typography>

        {/* Auth Status */}
        {user ? (
          <Chip
            label={`Signed in as: ${user.email}`}
            color="success"
            icon={<CheckCircleIcon />}
          />
        ) : (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
            You must be signed in to test Firebase operations. Please sign in
            first.
          </Alert>
        )}
      </Box>

      <Stack spacing={4}>
        {/* Firebase Operations Section */}
        {user && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              bgcolor: "background.paper",
              border: 2,
              borderColor: "primary.main",
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: brand.fonts.heading,
                    fontWeight: 600,
                    color: "primary.main",
                    mb: 1,
                  }}
                >
                  🔥 Firebase Firestore Operations
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Test real Firebase operations (reads/writes to Firestore)
                </Typography>
              </Box>

              <Divider />

              {/* Error Alert */}
              {firebaseError && (
                <Alert severity="error" onClose={() => setFirebaseError(null)}>
                  {firebaseError}
                </Alert>
              )}

              {/* Current Consent Data */}
              <Card sx={{ bgcolor: "background.default" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: brand.fonts.heading, mb: 2 }}
                  >
                    Current Consent Data
                  </Typography>

                  {firebaseLoading && !consentData ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 3 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : consentData ? (
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Terms Accepted:
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          {consentData.termsAccepted?.accepted
                            ? "✅ Yes"
                            : "❌ No"}{" "}
                          (v{consentData.termsAccepted?.version || "N/A"})
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Privacy Accepted:
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          {consentData.privacyPolicyAccepted?.accepted
                            ? "✅ Yes"
                            : "❌ No"}{" "}
                          (v
                          {consentData.privacyPolicyAccepted?.version || "N/A"})
                        </Typography>
                      </Box>

                      {consentData.cookieConsent && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Cookie Consent:
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip
                              label="Necessary"
                              size="small"
                              color={
                                consentData.cookieConsent.necessary
                                  ? "success"
                                  : "default"
                              }
                            />
                            <Chip
                              label="Analytics"
                              size="small"
                              color={
                                consentData.cookieConsent.analytics
                                  ? "success"
                                  : "default"
                              }
                            />
                            <Chip
                              label="Marketing"
                              size="small"
                              color={
                                consentData.cookieConsent.marketing
                                  ? "success"
                                  : "default"
                              }
                            />
                          </Stack>
                        </Box>
                      )}

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Needs Update:
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          {needsUpdate ? "⚠️ Yes" : "✅ No"}
                        </Typography>
                      </Box>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No consent data found. Click &quot;Save Consent&quot; to
                      create.
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={
                    firebaseLoading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <CloudUploadIcon />
                    )
                  }
                  onClick={handleSaveConsent}
                  disabled={firebaseLoading}
                >
                  Save Consent
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={
                    firebaseLoading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <RefreshIcon />
                    )
                  }
                  onClick={fetchConsent}
                  disabled={firebaseLoading}
                >
                  Refresh
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleUpdateCookies}
                  disabled={firebaseLoading}
                >
                  Update Cookies
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<CloudDownloadIcon />}
                  onClick={handleFetchHistory}
                  disabled={firebaseLoading}
                >
                  View History
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteConsent}
                  disabled={firebaseLoading}
                >
                  Delete Consent
                </Button>
              </Stack>

              {/* Consent History */}
              {consentHistory.length > 0 && (
                <Card sx={{ bgcolor: "background.default" }}>
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ fontFamily: brand.fonts.heading, mb: 2 }}
                    >
                      Consent History (Last {consentHistory.length} entries)
                    </Typography>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Action</TableCell>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>User Agent</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {consentHistory.map((entry, index) => (
                            <TableRow key={index}>
                              <TableCell>{entry.action || "N/A"}</TableCell>
                              <TableCell>
                                {entry.timestamp
                                  ? new Date(
                                      entry.timestamp.seconds * 1000
                                    ).toLocaleString()
                                  : "N/A"}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.75rem" }}>
                                {entry.userAgent?.substring(0, 50) || "N/A"}...
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Paper>
        )}

        {/* Original UI Tests */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: `${brand.borderRadius}px`,
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: brand.fonts.heading,
                  fontWeight: 600,
                  color: "text.primary",
                  mb: 1,
                }}
              >
                Test 1: Terms Checkbox Component
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Basic checkbox with links to legal documents
              </Typography>
            </Box>

            <Divider />

            <TermsCheckbox checked={termsChecked} onChange={setTermsChecked} />

            <Box>
              <Typography variant="caption" color="text.secondary">
                State: {termsChecked ? "✅ Checked" : "❌ Unchecked"}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Test 2: Checkbox with Error */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: `${brand.borderRadius}px`,
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: brand.fonts.heading,
                  fontWeight: 600,
                  color: "text.primary",
                  mb: 1,
                }}
              >
                Test 2: Checkbox with Error State
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shows error when terms are not accepted
              </Typography>
            </Box>

            <Divider />

            <TermsCheckbox
              checked={termsChecked}
              onChange={setTermsChecked}
              error={termsError}
              helperText={
                termsError ? "You must accept the terms to continue" : undefined
              }
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              startIcon={<PlayArrowIcon />}
            >
              Submit (Trigger Validation)
            </Button>

            {submitted && (
              <Alert
                severity="success"
                icon={<CheckCircleIcon />}
                sx={{ bgcolor: "background.default" }}
              >
                Form submitted successfully!
              </Alert>
            )}
          </Stack>
        </Paper>

        {/* Test 3: Legal Agreement Wrapper */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: `${brand.borderRadius}px`,
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: brand.fonts.heading,
                  fontWeight: 600,
                  color: "text.primary",
                  mb: 1,
                }}
              >
                Test 3: Legal Agreement Wrapper
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete wrapper with checkbox and content area
              </Typography>
            </Box>

            <Divider />

            <LegalAgreementWrapper
              checked={termsChecked}
              onChange={setTermsChecked}
              error={termsError}
              errorMessage="You must accept the terms to continue"
            >
              <Stack spacing={2}>
                <Alert severity="info" icon={<InfoIcon />}>
                  Auth buttons would go here
                </Alert>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={!termsChecked}
                  onClick={() => alert("Sign in clicked!")}
                >
                  Continue with Google
                </Button>
              </Stack>
            </LegalAgreementWrapper>
          </Stack>
        </Paper>

        {/* Test 4: Consent Update Modal */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: `${brand.borderRadius}px`,
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: brand.fonts.heading,
                  fontWeight: 600,
                  color: "text.primary",
                  mb: 1,
                }}
              >
                Test 4: Consent Update Modal
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Modal shown when legal documents are updated
              </Typography>
            </Box>

            <Divider />

            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowUpdateModal(true)}
              startIcon={<PlayArrowIcon />}
            >
              Open Consent Update Modal
            </Button>

            <ConsentUpdateModal
              open={showUpdateModal}
              onClose={() => setShowUpdateModal(false)}
              onAccept={handleConsentUpdate}
              version="1.1"
              changes={[
                "Updated data retention policy",
                "Added GDPR compliance details",
                "Clarified cookie usage",
              ]}
            />
          </Stack>
        </Paper>

        {/* Test Controls */}
        <Card
          sx={{
            bgcolor: "background.default",
            border: 1,
            borderColor: "primary.main",
          }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: brand.fonts.heading }}
                >
                  Test Controls
                </Typography>
                <Chip label="Debug" color="primary" size="small" />
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current State:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label={`Terms: ${termsChecked ? "Checked" : "Unchecked"}`}
                    color={termsChecked ? "success" : "default"}
                    size="small"
                  />
                  <Chip
                    label={`Error: ${termsError ? "Yes" : "No"}`}
                    color={termsError ? "error" : "default"}
                    size="small"
                  />
                  <Chip
                    label={`Firebase: ${consentData ? "Loaded" : "Empty"}`}
                    color={consentData ? "success" : "default"}
                    size="small"
                  />
                </Stack>
              </Box>

              <Button
                variant="outlined"
                color="primary"
                onClick={resetTests}
                fullWidth
              >
                Reset All Tests
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Test 5: ConsentGate Flow */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            bgcolor: "background.paper",
            border: 2,
            borderColor: "success.main",
            borderRadius: `${brand.borderRadius}px`,
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: brand.fonts.heading,
                  fontWeight: 600,
                  color: "success.main",
                  mb: 1,
                }}
              >
                🎯 Test 5: ConsentGate Flow (Sign-In Enforcement)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Test the complete sign-in consent enforcement flow
              </Typography>
            </Box>

            <Divider />

            <Alert severity="success" icon={<CheckCircleIcon />}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                How to test ConsentGate:
              </Typography>
              <Box component="ol" sx={{ pl: 2, m: 0 }}>
                <li>
                  <Typography variant="body2">Sign out if signed in</Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Go to sign-in page and sign in
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    If no consent exists → Modal should appear (blocking)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Accept consent → Modal closes, app loads
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Refresh page → No modal (consent exists)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Update LEGAL_VERSIONS → Sign in → Update modal appears
                  </Typography>
                </li>
              </Box>
            </Alert>

            <Alert severity="info">
              <Typography variant="body2">
                <strong>Note:</strong> ConsentGate is integrated into the app
                layout. To test, wrap your protected routes or entire app with{" "}
                <code>&lt;ConsentGate&gt;</code> component.
              </Typography>
            </Alert>

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="contained"
                color="primary"
                href="/dashboard"
                sx={{ minWidth: 160 }}
              >
                Go to Dashboard (Test Live)
              </Button>
              <Button
                variant="outlined"
                color="primary"
                href="/auth/signin"
                sx={{ minWidth: 160 }}
              >
                Go to Sign-In Page
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Documentation */}
        <Alert severity="info" icon={<InfoIcon />}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Firebase Testing Instructions:
          </Typography>
          <Box component="ol" sx={{ pl: 2, m: 0 }}>
            <li>
              <Typography variant="body2">
                Make sure you&apos;re signed in (check chip at top)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Click &quot;Save Consent&quot; to write to Firestore
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Open Firebase Console → Firestore → Check
                users/[your-uid]/consents/current
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Click &quot;View History&quot; to see audit trail
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Try &quot;Update Cookies&quot; and &quot;Refresh&quot; to see
                changes
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Test ConsentGate by deleting consent and signing in again
              </Typography>
            </li>
          </Box>
        </Alert>
      </Stack>
    </Container>
  );
}
