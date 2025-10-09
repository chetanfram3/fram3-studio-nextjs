// src/components/footer/Footer.tsx
"use client";

import {
  Box,
  Container,
  Typography,
  Link,
  Divider,
  Stack,
} from "@mui/material";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import { BrandLogo } from "@/components/branding";

export function Footer() {
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.02)",
        mt: "auto", // Push footer to bottom if using flex layout
      }}
    >
      <Container maxWidth="xl">
        {/* Main Footer Content */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 4, md: 8 }}
          sx={{ mb: 4 }}
        >
          {/* Brand Section */}
          <Box sx={{ flex: 1 }}>
            <BrandLogo showText={true} size="small" />
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: "text.secondary",
                maxWidth: 300,
              }}
            >
              Building amazing digital experiences with cutting-edge technology
              and modern design principles.
            </Typography>
          </Box>

          {/* Quick Links */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: brand.fonts.heading,
                fontWeight: 600,
                mb: 2,
                color: "text.primary",
              }}
            >
              Quick Links
            </Typography>
            <Stack spacing={1}>
              <FooterLink href="/dashboard">Dashboard</FooterLink>
              <FooterLink href="/profile">Profile</FooterLink>
              <FooterLink href="/dashboard/billing">Billing</FooterLink>
              <FooterLink href="/dashboard/payments">Payments</FooterLink>
            </Stack>
          </Box>

          {/* Legal Links */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: brand.fonts.heading,
                fontWeight: 600,
                mb: 2,
                color: "text.primary",
              }}
            >
              Legal
            </Typography>
            <Stack spacing={1}>
              <FooterLink href="/legal/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/legal/cookies">Cookie Policy</FooterLink>
              <FooterLink href="/legal/terms">Terms of Service</FooterLink>
              <FooterLink href="/legal/gdpr">GDPR Rights</FooterLink>
            </Stack>
          </Box>

          {/* Support */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: brand.fonts.heading,
                fontWeight: 600,
                mb: 2,
                color: "text.primary",
              }}
            >
              Support
            </Typography>
            <Stack spacing={1}>
              <FooterLink href="mailto:support@fram3studio.io">
                Contact Support
              </FooterLink>
              <FooterLink href="mailto:privacy@fram3studio.io">
                Privacy Inquiries
              </FooterLink>
              <FooterLink href="mailto:legal@fram3studio.io">
                Legal Department
              </FooterLink>
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Bottom Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          {/* Copyright */}
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            © {currentYear} {brand.name}. All rights reserved.
          </Typography>

          {/* Legal Links (Horizontal) */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Link
              href="/legal/privacy"
              sx={{
                color: "text.secondary",
                fontSize: "0.875rem",
                textDecoration: "none",
                "&:hover": {
                  color: "primary.main",
                  textDecoration: "underline",
                },
              }}
            >
              Privacy
            </Link>
            <Link
              href="/legal/cookies"
              sx={{
                color: "text.secondary",
                fontSize: "0.875rem",
                textDecoration: "none",
                "&:hover": {
                  color: "primary.main",
                  textDecoration: "underline",
                },
              }}
            >
              Cookies
            </Link>
            <Link
              href="/legal/terms"
              sx={{
                color: "text.secondary",
                fontSize: "0.875rem",
                textDecoration: "none",
                "&:hover": {
                  color: "primary.main",
                  textDecoration: "underline",
                },
              }}
            >
              Terms
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

// Helper component for footer links
function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      sx={{
        color: "text.secondary",
        fontSize: "0.875rem",
        textDecoration: "none",
        "&:hover": {
          color: "primary.main",
          textDecoration: "underline",
        },
        transition: "color 0.2s",
      }}
    >
      {children}
    </Link>
  );
}
