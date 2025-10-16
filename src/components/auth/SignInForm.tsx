// src/components/auth/SignInForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  Container,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Login as LoginIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { signInWithEmail } from "@/services";
import { useMFA } from "@/hooks/auth/useMFA";
import LogoHeader from "./LogoHeader";
import SocialAuthButtons from "./SocialAuthButtons";
import MFADialog from "./MFADialog";
import PhoneSignInForm from "./PhoneSignInForm";
import LoadingDots from "../common/LoadingDots";
import logger from "@/utils/logger";
import { MultiFactorError } from "firebase/auth";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`signin-tabpanel-${index}`}
      aria-labelledby={`signin-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `signin-tab-${index}`,
    "aria-controls": `signin-tabpanel-${index}`,
  };
}

/**
 * Sign In Form Component
 * Complete sign-in with email/password, phone, social auth, and MFA support
 */
export default function SignInForm() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const mfa = useMFA();

  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(""); // Clear errors when switching tabs
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    logger.debug("Attempting email sign in");

    try {
      await signInWithEmail(email, password);
    } catch (err: unknown) {
      // Type assertion for Firebase error
      const firebaseError = err as { code?: string; message?: string };

      // Check if MFA is required
      if (firebaseError.code === "auth/multi-factor-auth-required") {
        logger.debug("MFA required, initiating challenge");
        await mfa.handleMFAChallenge(err as MultiFactorError);
        setIsLoading(false);
      } else {
        logger.error("Sign in error:", err);

        const errorMessage =
          err instanceof Error
            ? err.message
            : firebaseError.message ||
              "Failed to sign in. Please check your credentials.";

        setError(errorMessage);
        setIsLoading(false);
      }
    }
  };

  const handleMFAVerify = async () => {
    await mfa.handleMFAVerification();
  };

  const handleSocialError = (error: string) => {
    logger.error("Social sign in error:", error);
    setError(error);
  };

  const handleSocialMFA = async (error: unknown) => {
    logger.debug("Social sign in requires MFA");
    await mfa.handleMFAChallenge(error as MultiFactorError);
  };

  const handleSocialLoadingChange = (loading: boolean) => {
    setSocialLoading(loading);
  };

  // ✅ FIXED: Only show loading when NOT in MFA dialog state
  const isAuthLoading = (isLoading || socialLoading) && !mfa.isOpen;

  // ✅ Get loading message based on state
  const getLoadingMessage = () => {
    if (isLoading) return "Signing you in...";
    if (socialLoading) return "Connecting with social provider...";
    return "Please wait...";
  };

  // ✅ Show LoadingDots only when auth is in progress AND MFA dialog is not open
  if (isAuthLoading) {
    return <LoadingDots isLoading={true} text={getLoadingMessage()} />;
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          py: 4,
        }}
      >
        <LogoHeader />

        <Box
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: `${brand.borderRadius * 1.5}px`,
            border: 2,
            borderColor: "primary.main",
            bgcolor: "background.paper",
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
              color: "text.primary",
            }}
          >
            Welcome Back
          </Typography>

          {/* Tabs for Sign In Methods */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3, mt: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="sign in options"
              variant="fullWidth"
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "primary.main",
                  height: 3,
                  borderRadius: `${brand.borderRadius}px ${brand.borderRadius}px 0 0`,
                },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontFamily: brand.fonts.heading,
                  fontSize: "1rem",
                  fontWeight: 600,
                  minHeight: 56,
                  color: "text.secondary",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    color: "primary.main",
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.02)",
                  },
                  "&.Mui-selected": {
                    color: "primary.main",
                  },
                },
              }}
            >
              <Tab
                icon={<EmailIcon />}
                iconPosition="start"
                label="Email / Social"
                {...a11yProps(0)}
              />
              <Tab
                icon={<PhoneIcon />}
                iconPosition="start"
                label="Phone"
                {...a11yProps(1)}
              />
            </Tabs>
          </Box>

          {/* Tab Panel 0: Email/Password & Social Sign In (Original Layout) */}
          <TabPanel value={activeTab} index={0}>
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
                onError={handleSocialError}
                onMFARequired={handleSocialMFA}
                onLoadingChange={handleSocialLoadingChange}
                disabled={isLoading || socialLoading}
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
                disabled={isLoading || socialLoading}
                autoComplete="email"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <EmailIcon sx={{ mr: 1, color: "text.secondary" }} />
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
                disabled={isLoading || socialLoading}
                autoComplete="current-password"
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <LockIcon sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />

              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading || socialLoading}
                  startIcon={
                    isLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <LoginIcon />
                    )
                  }
                  sx={{
                    py: 1.5,
                    px: 4,
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: `${brand.borderRadius}px`,
                  }}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </Box>
            </Box>

            {/* Forgot Password Link */}
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Button
                component={Link}
                href="/forgot-password"
                variant="text"
                disabled={isLoading || socialLoading}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >
                Forgot Password?
              </Button>
            </Box>
          </TabPanel>

          {/* Tab Panel 1: Phone Sign In */}
          <TabPanel value={activeTab} index={1}>
            <PhoneSignInForm />
          </TabPanel>

          {/* Sign Up Link */}
          <Divider sx={{ my: 3 }} />
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {"Don't have an account?"}
            </Typography>
            <Button
              component={Link}
              href="/register"
              variant="text"
              startIcon={<PersonAddIcon />}
              disabled={isLoading || socialLoading}
              sx={{
                mt: 1,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Sign up here
            </Button>
          </Box>
        </Box>
      </Box>

      {/* MFA Dialog */}
      <MFADialog
        open={mfa.isOpen}
        onClose={mfa.closeDialog}
        phoneNumber={mfa.phoneNumber}
        verificationCode={mfa.verificationCode}
        onCodeChange={mfa.setVerificationCode}
        onVerify={handleMFAVerify}
        error={mfa.error}
        loading={mfa.loading}
      />
    </Container>
  );
}
