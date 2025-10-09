// src/components/legal/GDPRTerms.tsx
"use client";

import { Box, Typography, Link, Divider } from "@mui/material";
import { getCurrentBrand } from "@/config/brandConfig";

interface GDPRTermsProps {
  compact?: boolean;
}

export default function GDPRTerms({ compact = false }: GDPRTermsProps) {
  const brand = getCurrentBrand();

  if (compact) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">
          By deleting your account, you agree to our{" "}
          <Link href="/legal/privacy" target="_blank" underline="hover">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/legal/gdpr" target="_blank" underline="hover">
            GDPR Rights
          </Link>
          .
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: 400, overflowY: "auto", pr: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Account Deletion & Data Privacy
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ fontWeight: 600, mt: 2 }}
      >
        1. What Happens When You Delete Your Account
      </Typography>
      <Typography variant="body2" paragraph>
        When you request account deletion, the following occurs:
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body2">
            <strong>Immediate:</strong> Your account is marked for deletion and
            you will be logged out.
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            <strong>30-Day Grace Period:</strong> Your data enters a 30-day
            retrieval window where you can cancel the deletion.
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            <strong>After 30 Days:</strong> All your data is permanently and
            irreversibly deleted.
          </Typography>
        </li>
      </Box>

      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ fontWeight: 600, mt: 2 }}
      >
        2. Data That Will Be Deleted
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body2">
            Your profile information (name, email, phone)
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            All projects and generated content
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Payment information and transaction history
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Files stored in our cloud storage
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Usage analytics and preferences
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            API keys and authentication tokens
          </Typography>
        </li>
      </Box>

      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ fontWeight: 600, mt: 2 }}
      >
        3. Data We Must Retain (Legal Requirements)
      </Typography>
      <Typography variant="body2" paragraph>
        Due to legal and regulatory requirements, we must retain certain data
        for up to 7 years:
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body2">Tax and accounting records</Typography>
        </li>
        <li>
          <Typography variant="body2">
            Payment transaction records (anonymized)
          </Typography>
        </li>
        <li>
          <Typography variant="body2">Fraud prevention data</Typography>
        </li>
        <li>
          <Typography variant="body2">Legal compliance records</Typography>
        </li>
      </Box>
      <Typography variant="body2" paragraph>
        This data is anonymized and cannot be linked back to you.
      </Typography>

      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ fontWeight: 600, mt: 2 }}
      >
        4. 30-Day Retrieval Window
      </Typography>
      <Typography variant="body2" paragraph>
        During the 30-day grace period:
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body2">
            You can cancel the deletion by signing in again
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Your account remains inactive but data is preserved
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            You will receive reminder emails at 7, 14, and 28 days
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            After 30 days, deletion becomes permanent and irreversible
          </Typography>
        </li>
      </Box>

      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ fontWeight: 600, mt: 2 }}
      >
        5. Your GDPR Rights
      </Typography>
      <Typography variant="body2" paragraph>
        Under GDPR, you have the following rights:
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body2">
            <strong>Right to Erasure:</strong> Request deletion of your personal
            data
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            <strong>Right to Data Portability:</strong> Download your data
            before deletion
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            <strong>Right to Object:</strong> Cancel deletion during grace
            period
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            <strong>Right to Information:</strong> Know what data we hold about
            you
          </Typography>
        </li>
      </Box>

      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ fontWeight: 600, mt: 2 }}
      >
        6. Important Warnings
      </Typography>
      <Box
        sx={{
          p: 2,
          bgcolor: "error.main",
          color: "error.contrastText",
          borderRadius: `${brand.borderRadius}px`,
          mb: 2,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          ⚠️ PERMANENT ACTION
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          After the 30-day grace period, your data cannot be recovered. Please
          download any important content before proceeding.
        </Typography>
      </Box>

      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ fontWeight: 600, mt: 2 }}
      >
        7. Contact Information
      </Typography>
      <Typography variant="body2" paragraph>
        For questions about data deletion or your GDPR rights:
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        <li>
          <Typography variant="body2">
            Email:{" "}
            <Link href="mailto:privacy@fram3studio.io">
              privacy@fram3studio.io
            </Link>
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            DPO:{" "}
            <Link href="mailto:dpo@fram3studio.io">dpo@fram3studio.io</Link>
          </Typography>
        </li>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="caption" color="text.secondary">
        Last Updated: {new Date().toLocaleDateString()}
      </Typography>
    </Box>
  );
}
