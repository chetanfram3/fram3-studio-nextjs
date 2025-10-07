"use client";

import { useState } from "react";
import { Alert, Button, Snackbar } from "@mui/material";
import { useAuthStore } from "@/store/authStore";
import { sendEmailVerification } from "firebase/auth";

export function EmailVerificationAlert() {
  const { user, claims } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  if (!user) return null;

  // If email is verified, check for is_enabled
  if (user.emailVerified) {
    if (claims?.is_enabled === false) {
      return (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            "& .MuiAlert-action": {
              alignItems: "center",
            },
          }}
        >
          Account activation pending. We are gradually enabling accounts to
          manage AI server load. You will receive an email when activated!
        </Alert>
      );
    }
    return null;
  }

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await sendEmailVerification(user);
      setSnackbar({
        open: true,
        message: "Verification email sent successfully!",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error sending verification email. Please try again later.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Alert
        severity="info"
        action={
          <Button
            color="secondary"
            size="small"
            onClick={handleResendVerification}
            disabled={loading}
          >
            {loading ? "Sending..." : "Resend Verification"}
          </Button>
        }
        sx={{
          mb: 2,
          "& .MuiAlert-action": {
            alignItems: "center",
          },
        }}
      >
        Please verify your email address to access all features
      </Alert>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
