// src/app/legal/terms/page.tsx
"use client";

import {
  Box,
  Container,
  Typography,
  Divider,
  Paper,
  Link,
} from "@mui/material";
import { getCurrentBrand } from "@/config/brandConfig";

export default function TermsOfServicePage() {
  const brand = getCurrentBrand();
  const companyName = brand.name;
  const companyEmail = "legal@fram3studio.io";
  const lastUpdated = "January 9, 2025";

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 6 },
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontFamily: brand.fonts.heading,
              fontWeight: 700,
              color: "text.primary",
              mb: 2,
            }}
          >
            Terms of Service
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last Updated: {lastUpdated}
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Agreement to Terms */}
        <Section title="1. Agreement to Terms">
          <Typography variant="body1" paragraph>
            By accessing or using {companyName}&apos;s services, you agree to be
            bound by these Terms of Service and all applicable laws and
            regulations. If you do not agree with any of these terms, you are
            prohibited from using our services.
          </Typography>
          <Typography variant="body1" paragraph>
            These terms apply to all visitors, users, and others who access or
            use our platform.
          </Typography>
        </Section>

        {/* Use License */}
        <Section title="2. Use License">
          <Typography variant="body1" paragraph>
            Subject to your compliance with these Terms, we grant you a limited,
            non-exclusive, non-transferable, revocable license to access and use
            our services for your personal or business use.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            You may not:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>Modify or copy the materials on our platform</ListItem>
            <ListItem>
              Use the materials for any commercial purpose without authorization
            </ListItem>
            <ListItem>
              Attempt to reverse engineer any software on our platform
            </ListItem>
            <ListItem>Remove any copyright or proprietary notations</ListItem>
            <ListItem>
              Transfer the materials to another person or &quot;mirror&quot; on
              any other server
            </ListItem>
            <ListItem>
              Use automated systems (bots, scrapers) without permission
            </ListItem>
            <ListItem>Interfere with or disrupt our services</ListItem>
          </Box>
        </Section>

        {/* Account Registration */}
        <Section title="3. Account Registration">
          <Typography variant="body1" paragraph>
            To access certain features, you must register for an account. You
            agree to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              Provide accurate, current, and complete information
            </ListItem>
            <ListItem>Maintain and update your information as needed</ListItem>
            <ListItem>Maintain the security of your password</ListItem>
            <ListItem>
              Accept responsibility for all activities under your account
            </ListItem>
            <ListItem>Notify us immediately of any unauthorized use</ListItem>
          </Box>
          <Typography variant="body1" paragraph>
            We reserve the right to suspend or terminate accounts that violate
            these terms.
          </Typography>
        </Section>

        {/* Subscriptions and Payments */}
        <Section title="4. Subscriptions and Payments">
          <SubSection title="4.1 Pricing">
            <Typography variant="body1" paragraph>
              Subscription fees are stated on our pricing page. We reserve the
              right to change prices with 30 days&apos; notice to existing
              subscribers.
            </Typography>
          </SubSection>

          <SubSection title="4.2 Billing">
            <Typography variant="body1" paragraph>
              Subscriptions are billed in advance on a recurring basis (monthly
              or annually). You authorize us to charge your payment method
              automatically.
            </Typography>
          </SubSection>

          <SubSection title="4.3 Refunds">
            <Typography variant="body1" paragraph>
              Refunds are provided at our discretion. Generally, we offer:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                14-day money-back guarantee for new subscribers
              </ListItem>
              <ListItem>
                Pro-rated refunds for annual plans (within 30 days)
              </ListItem>
              <ListItem>
                No refunds for monthly plans after the billing date
              </ListItem>
            </Box>
          </SubSection>

          <SubSection title="4.4 Cancellation">
            <Typography variant="body1" paragraph>
              You may cancel your subscription at any time. Cancellations take
              effect at the end of the current billing period. No partial
              refunds for unused time.
            </Typography>
          </SubSection>
        </Section>

        {/* Acceptable Use */}
        <Section title="5. Acceptable Use Policy">
          <Typography variant="body1" paragraph>
            You agree not to use our services to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>Violate any laws or regulations</ListItem>
            <ListItem>Infringe on intellectual property rights</ListItem>
            <ListItem>
              Upload malicious code, viruses, or harmful software
            </ListItem>
            <ListItem>Harass, abuse, or harm other users</ListItem>
            <ListItem>Spam or send unsolicited communications</ListItem>
            <ListItem>Impersonate others or provide false information</ListItem>
            <ListItem>Collect user data without consent</ListItem>
            <ListItem>Engage in fraudulent or illegal activities</ListItem>
          </Box>
          <Typography variant="body1" paragraph>
            Violation of this policy may result in immediate account
            termination.
          </Typography>
        </Section>

        {/* Content Ownership */}
        <Section title="6. Content Ownership and Rights">
          <SubSection title="6.1 Your Content">
            <Typography variant="body1" paragraph>
              You retain ownership of content you upload or create on our
              platform. By uploading content, you grant us a worldwide,
              non-exclusive license to use, store, and display your content to
              provide our services.
            </Typography>
          </SubSection>

          <SubSection title="6.2 Our Content">
            <Typography variant="body1" paragraph>
              All materials on our platform (text, graphics, logos, code, etc.)
              are owned by {companyName} or our licensors and protected by
              copyright and intellectual property laws.
            </Typography>
          </SubSection>

          <SubSection title="6.3 Generated Content">
            <Typography variant="body1" paragraph>
              Content generated using our AI tools is owned by you, subject to
              our license terms. We do not claim ownership of AI-generated
              content.
            </Typography>
          </SubSection>
        </Section>

        {/* Privacy */}
        <Section title="7. Privacy">
          <Typography variant="body1" paragraph>
            Your privacy is important to us. Our collection and use of personal
            information is governed by our{" "}
            <Link
              href="/legal/privacy"
              sx={{ color: "primary.main", textDecoration: "underline" }}
            >
              Privacy Policy
            </Link>
            , which is incorporated into these Terms by reference.
          </Typography>
        </Section>

        {/* Disclaimer */}
        <Section title="8. Disclaimer of Warranties">
          <Typography variant="body1" paragraph sx={{ fontWeight: 600 }}>
            OUR SERVICES ARE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF
            ANY KIND, EITHER EXPRESS OR IMPLIED.
          </Typography>
          <Typography variant="body1" paragraph>
            We do not warrant that:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              Our services will be uninterrupted or error-free
            </ListItem>
            <ListItem>Defects will be corrected</ListItem>
            <ListItem>
              Our servers are free of viruses or harmful components
            </ListItem>
            <ListItem>
              Results from using our services will be accurate or reliable
            </ListItem>
          </Box>
        </Section>

        {/* Limitation of Liability */}
        <Section title="9. Limitation of Liability">
          <Typography variant="body1" paragraph>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {companyName.toUpperCase()}{" "}
            SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA,
            OR USE.
          </Typography>
          <Typography variant="body1" paragraph>
            Our total liability to you for any claims shall not exceed the
            amount you paid us in the 12 months preceding the claim.
          </Typography>
        </Section>

        {/* Indemnification */}
        <Section title="10. Indemnification">
          <Typography variant="body1" paragraph>
            You agree to indemnify and hold harmless {companyName}, its
            officers, directors, employees, and agents from any claims, damages,
            losses, liabilities, and expenses (including legal fees) arising
            from:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>Your use of our services</ListItem>
            <ListItem>Your violation of these Terms</ListItem>
            <ListItem>Your violation of any rights of another party</ListItem>
            <ListItem>Content you upload or create</ListItem>
          </Box>
        </Section>

        {/* Termination */}
        <Section title="11. Termination">
          <Typography variant="body1" paragraph>
            We may terminate or suspend your account and access to our services
            immediately, without prior notice, for any reason, including:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>Violation of these Terms</ListItem>
            <ListItem>Fraudulent or illegal activity</ListItem>
            <ListItem>Non-payment of fees</ListItem>
            <ListItem>At our sole discretion</ListItem>
          </Box>
          <Typography variant="body1" paragraph>
            Upon termination, your right to use our services will immediately
            cease. We may delete your data after a 30-day grace period.
          </Typography>
        </Section>

        {/* Changes to Terms */}
        <Section title="12. Changes to Terms">
          <Typography variant="body1" paragraph>
            We reserve the right to modify these Terms at any time. We will
            notify you of significant changes by:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>Posting updated Terms on our website</ListItem>
            <ListItem>Sending an email notification</ListItem>
            <ListItem>Displaying a prominent notice on our platform</ListItem>
          </Box>
          <Typography variant="body1" paragraph>
            Your continued use after changes constitutes acceptance of the new
            Terms.
          </Typography>
        </Section>

        {/* Governing Law */}
        <Section title="13. Governing Law">
          <Typography variant="body1" paragraph>
            These Terms shall be governed by and construed in accordance with
            the laws of [Your Jurisdiction], without regard to its conflict of
            law provisions.
          </Typography>
          <Typography variant="body1" paragraph>
            Any disputes arising from these Terms shall be resolved in the
            courts of [Your Jurisdiction].
          </Typography>
        </Section>

        {/* Dispute Resolution */}
        <Section title="14. Dispute Resolution">
          <Typography variant="body1" paragraph>
            Before filing a lawsuit, you agree to try to resolve disputes
            through negotiation or mediation. Most concerns can be resolved
            quickly by contacting our support team.
          </Typography>
        </Section>

        {/* Contact Information */}
        <Section title="15. Contact Us">
          <Typography variant="body1" paragraph>
            If you have questions about these Terms, please contact us:
          </Typography>
          <Box sx={{ pl: 2, mb: 2 }}>
            <Typography variant="body1" paragraph>
              <strong>Email:</strong>{" "}
              <Link
                href={`mailto:${companyEmail}`}
                sx={{ color: "primary.main" }}
              >
                {companyEmail}
              </Link>
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Support:</strong>{" "}
              <Link
                href="mailto:support@fram3studio.io"
                sx={{ color: "primary.main" }}
              >
                support@fram3studio.io
              </Link>
            </Typography>
            <Typography variant="body1">
              <strong>Address:</strong> [Your Company Address]
            </Typography>
          </Box>
        </Section>

        {/* Footer */}
        <Divider sx={{ my: 4 }} />
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </Typography>
          <Box
            sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 2 }}
          >
            <Link
              href="/legal/privacy"
              sx={{ color: "primary.main", fontSize: "0.875rem" }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/legal/cookies"
              sx={{ color: "primary.main", fontSize: "0.875rem" }}
            >
              Cookie Policy
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

// Helper Components
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const brand = getCurrentBrand();
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        sx={{
          fontFamily: brand.fonts.heading,
          fontWeight: 600,
          color: "text.primary",
          mb: 2,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 3, ml: 2 }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <Typography variant="body1" sx={{ mb: 1 }}>
        {children}
      </Typography>
    </li>
  );
}
