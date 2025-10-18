// src/app/(protected)/legal/page.tsx

import { Metadata } from "next";
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Stack,
  Grid,
} from "@mui/material";
import Link from "next/link";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  Description as TermsIcon,
  Security as PrivacyIcon,
  Cookie as CookieIcon,
  Copyright as CopyrightIcon,
  Gavel as LegalIcon,
} from "@mui/icons-material";
import { LEGAL_VERSIONS } from "@/config/legalVersions";

export const metadata: Metadata = {
  title: "Legal Information",
  description:
    "Terms of Service, Privacy Policy, Cookie Policy, and Copyright Information",
};

/**
 * Legal Overview Page
 *
 * Central hub for all legal documents and policies
 * - Summarizes key policies
 * - Provides quick navigation to full documents
 * - Theme-aware design
 * - Fully responsive layout
 * - Uses MUI Grid v7 API
 *
 * Location: /legal
 * Protected Route: Available to all authenticated users
 */
export default function LegalOverviewPage() {
  const brand = getCurrentBrand();
  const companyName = brand.name;
  const companyEmail = "legal@fram3studio.io";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <LegalIcon
            sx={{
              fontSize: 48,
              color: "primary.main",
              mr: 2,
            }}
          />
        </Box>
        <Typography
          variant="h3"
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: 700,
            color: "text.primary",
            mb: 2,
          }}
        >
          Legal Information
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            maxWidth: 700,
            mx: "auto",
            fontSize: "1.1rem",
          }}
        >
          Your privacy and legal rights are important to us. Review our policies
          to understand how we protect and serve you.
        </Typography>
      </Box>

      {/* Legal Documents Grid - MUI v7 API with 2-column layout */}
      <Grid
        container
        spacing={3}
        sx={{
          mb: 6,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
          },
        }}
      >
        {/* Terms of Service */}
        <Grid>
          <LegalCard
            title="Terms of Service"
            icon={<TermsIcon sx={{ fontSize: 32 }} />}
            version={LEGAL_VERSIONS.TERMS}
            description="Understand your rights and responsibilities when using our services. Covers user accounts, acceptable use, intellectual property, and dispute resolution."
            highlights={[
              "Account Requirements",
              "User Responsibilities",
              "Content Ownership",
              "Service Terms",
            ]}
            href="/legal/terms"
          />
        </Grid>

        {/* Privacy Policy */}
        <Grid>
          <LegalCard
            title="Privacy Policy"
            icon={<PrivacyIcon sx={{ fontSize: 32 }} />}
            version={LEGAL_VERSIONS.PRIVACY}
            description="Learn how we collect, use, protect, and share your personal information. Includes data rights, security measures, and contact information."
            highlights={[
              "Data Collection",
              "Information Usage",
              "Data Protection",
              "Your Rights",
            ]}
            href="/legal/privacy"
          />
        </Grid>

        {/* Cookie Policy */}
        <Grid>
          <LegalCard
            title="Cookie Policy"
            icon={<CookieIcon sx={{ fontSize: 32 }} />}
            version={LEGAL_VERSIONS.COOKIES}
            description="Discover how we use cookies and similar technologies to enhance your experience. Manage your cookie preferences and understand tracking."
            highlights={[
              "Types of Cookies",
              "Cookie Management",
              "Third-Party Cookies",
              "Your Choices",
            ]}
            href="/legal/cookies"
          />
        </Grid>

        {/* Copyright Policy */}
        <Grid>
          <LegalCard
            title="Copyright Policy"
            icon={<CopyrightIcon sx={{ fontSize: 32 }} />}
            version={LEGAL_VERSIONS.COPYRIGHT}
            description="Understand our copyright protection policies, DMCA procedures, and intellectual property rights. Learn how to report infringements."
            highlights={[
              "Copyright Ownership",
              "DMCA Compliance",
              "Fair Use Guidelines",
              "Reporting Process",
            ]}
            href="/legal/copyright"
          />
        </Grid>
      </Grid>

      {/* Last Updated Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: `${brand.borderRadius}px`,
          mb: 4,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
            color: "text.primary",
            mb: 2,
          }}
        >
          Updates & Changes
        </Typography>
        <Typography variant="body1" paragraph sx={{ color: "text.secondary" }}>
          We may update our legal documents from time to time to reflect changes
          in our practices or for legal, operational, or regulatory reasons. We
          will notify you of any material changes through email or a prominent
          notice on our platform.
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          <strong>Current Version:</strong> All documents are at version{" "}
          {LEGAL_VERSIONS.TERMS}
          <br />
          <strong>Last Updated:</strong> {new Date().getFullYear()}
        </Typography>
      </Paper>

      {/* Contact Section */}
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
        <Typography
          variant="h6"
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
            color: "text.primary",
            mb: 2,
          }}
        >
          Questions or Concerns?
        </Typography>
        <Typography variant="body1" paragraph sx={{ color: "text.secondary" }}>
          If you have any questions about our legal policies or need
          clarification on any terms, please don&apos;t hesitate to contact us.
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            <strong>Email:</strong>{" "}
            <Link
              href={`mailto:${companyEmail}`}
              style={{
                color: "inherit",
                textDecoration: "underline",
              }}
            >
              {companyEmail}
            </Link>
          </Typography>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            <strong>Support:</strong>{" "}
            <Link
              href="mailto:support@fram3studio.io"
              style={{
                color: "inherit",
                textDecoration: "underline",
              }}
            >
              support@fram3studio.io
            </Link>
          </Typography>
        </Stack>
      </Paper>

      {/* Footer */}
      <Divider sx={{ my: 4 }} />
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
}

// Helper Component: Legal Card
interface LegalCardProps {
  title: string;
  icon: React.ReactNode;
  version: string;
  description: string;
  highlights: string[];
  href: string;
}

function LegalCard({
  title,
  icon,
  version,
  description,
  highlights,
  href,
}: LegalCardProps) {
  const brand = getCurrentBrand();

  return (
    <Paper
      component={Link}
      href={href}
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: `${brand.borderRadius}px`,
        textDecoration: "none",
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: "primary.main",
          transform: "translateY(-4px)",
          boxShadow: 3,
          "& .card-icon": {
            color: "primary.main",
            transform: "scale(1.1)",
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Box
          className="card-icon"
          sx={{
            color: "text.secondary",
            transition: "all 0.3s ease",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
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
            variant="caption"
            sx={{
              color: "text.secondary",
              fontFamily: brand.fonts.body,
            }}
          >
            Version {version}
          </Typography>
        </Box>
      </Box>

      {/* Description */}
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mb: 2,
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>

      {/* Highlights */}
      <Box sx={{ mt: "auto" }}>
        <Divider sx={{ mb: 2 }} />
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            mb: 1,
            display: "block",
          }}
        >
          Key Topics:
        </Typography>
        <Stack spacing={0.5}>
          {highlights.map((highlight, index) => (
            <Typography
              key={index}
              variant="caption"
              sx={{
                color: "text.secondary",
                display: "flex",
                alignItems: "center",
                "&:before": {
                  content: '"•"',
                  mr: 1,
                  color: "primary.main",
                  fontWeight: 700,
                },
              }}
            >
              {highlight}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}
