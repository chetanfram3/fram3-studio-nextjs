// src/app/legal/privacy/page.tsx
"use client";

import {
  Box,
  Container,
  Typography,
  Divider,
  Link,
  Paper,
} from "@mui/material";
import { getCurrentBrand } from "@/config/brandConfig";

export default function PrivacyPolicyPage() {
  const brand = getCurrentBrand();
  const companyName = brand.name;
  const companyEmail = "privacy@fram3studio.io";
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
            Privacy Policy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last Updated: {lastUpdated}
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Introduction */}
        <Section title="1. Introduction">
          <Typography variant="body1" paragraph>
            Welcome to {companyName}. We respect your privacy and are committed
            to protecting your personal data. This privacy policy explains how
            we collect, use, and safeguard your information when you use our
            services.
          </Typography>
          <Typography variant="body1" paragraph>
            This policy applies to all users of our platform, whether you're a
            visitor, registered user, or subscriber. By using our services, you
            agree to the collection and use of information in accordance with
            this policy.
          </Typography>
        </Section>

        {/* Information We Collect */}
        <Section title="2. Information We Collect">
          <SubSection title="2.1 Information You Provide">
            <Typography variant="body1" paragraph>
              We collect information that you voluntarily provide when you:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>Create an account (name, email, password)</ListItem>
              <ListItem>
                Complete your profile (phone number, address, preferences)
              </ListItem>
              <ListItem>
                Make payments (billing information, payment method)
              </ListItem>
              <ListItem>Upload content or create projects</ListItem>
              <ListItem>Contact customer support</ListItem>
              <ListItem>Participate in surveys or feedback</ListItem>
            </Box>
          </SubSection>

          <SubSection title="2.2 Information Collected Automatically">
            <Typography variant="body1" paragraph>
              When you use our services, we automatically collect:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                Usage data (pages visited, features used, time spent)
              </ListItem>
              <ListItem>
                Device information (browser type, operating system, IP address)
              </ListItem>
              <ListItem>Cookies and tracking technologies</ListItem>
              <ListItem>Error logs and diagnostic data</ListItem>
            </Box>
          </SubSection>

          <SubSection title="2.3 Information from Third Parties">
            <Typography variant="body1" paragraph>
              We may receive information from third-party services when you:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                Sign in with social media accounts (Google, Facebook, etc.)
              </ListItem>
              <ListItem>Use payment processors for transactions</ListItem>
              <ListItem>Interact with third-party integrations</ListItem>
            </Box>
          </SubSection>
        </Section>

        {/* How We Use Your Information */}
        <Section title="3. How We Use Your Information">
          <Typography variant="body1" paragraph>
            We use your information for the following purposes:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              <strong>Service Delivery:</strong> To provide, maintain, and
              improve our platform
            </ListItem>
            <ListItem>
              <strong>Account Management:</strong> To create and manage your
              account
            </ListItem>
            <ListItem>
              <strong>Communications:</strong> To send you updates, newsletters,
              and support messages
            </ListItem>
            <ListItem>
              <strong>Payments:</strong> To process transactions and manage
              billing
            </ListItem>
            <ListItem>
              <strong>Analytics:</strong> To understand how users interact with
              our platform
            </ListItem>
            <ListItem>
              <strong>Security:</strong> To detect and prevent fraud, abuse, and
              security incidents
            </ListItem>
            <ListItem>
              <strong>Legal Compliance:</strong> To comply with legal
              obligations and enforce our terms
            </ListItem>
            <ListItem>
              <strong>Marketing:</strong> To send promotional content (with your
              consent)
            </ListItem>
          </Box>
        </Section>

        {/* Cookies and Tracking */}
        <Section title="4. Cookies and Tracking Technologies">
          <Typography variant="body1" paragraph>
            We use cookies and similar tracking technologies to enhance your
            experience. You can control cookie preferences through our{" "}
            <Link
              href="#"
              sx={{ color: "primary.main", textDecoration: "underline" }}
            >
              Cookie Settings
            </Link>
            .
          </Typography>

          <SubSection title="4.1 Types of Cookies We Use">
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                <strong>Necessary Cookies:</strong> Essential for site
                functionality (always enabled)
              </ListItem>
              <ListItem>
                <strong>Analytics Cookies:</strong> Help us understand user
                behavior and improve our services
              </ListItem>
              <ListItem>
                <strong>Marketing Cookies:</strong> Used to deliver relevant
                advertisements
              </ListItem>
              <ListItem>
                <strong>Preference Cookies:</strong> Remember your settings and
                preferences
              </ListItem>
            </Box>
          </SubSection>
        </Section>

        {/* Data Sharing */}
        <Section title="5. How We Share Your Information">
          <Typography variant="body1" paragraph>
            We do not sell your personal information. We may share your data
            with:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              <strong>Service Providers:</strong> Third parties who help us
              operate our platform (hosting, analytics, payment processing)
            </ListItem>
            <ListItem>
              <strong>Business Partners:</strong> When you authorize
              integrations with third-party services
            </ListItem>
            <ListItem>
              <strong>Legal Requirements:</strong> When required by law or to
              protect our rights
            </ListItem>
            <ListItem>
              <strong>Business Transfers:</strong> In connection with mergers,
              acquisitions, or asset sales
            </ListItem>
          </Box>
        </Section>

        {/* Data Security */}
        <Section title="6. Data Security">
          <Typography variant="body1" paragraph>
            We implement industry-standard security measures to protect your
            data, including:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>Encryption of data in transit and at rest</ListItem>
            <ListItem>Regular security audits and penetration testing</ListItem>
            <ListItem>Access controls and authentication mechanisms</ListItem>
            <ListItem>Employee training on data protection</ListItem>
            <ListItem>Incident response procedures</ListItem>
          </Box>
          <Typography variant="body1" paragraph>
            While we strive to protect your data, no method of transmission over
            the internet is 100% secure. We cannot guarantee absolute security.
          </Typography>
        </Section>

        {/* Your Rights */}
        <Section title="7. Your Privacy Rights">
          <Typography variant="body1" paragraph>
            Depending on your location, you may have the following rights:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              <strong>Access:</strong> Request a copy of your personal data
            </ListItem>
            <ListItem>
              <strong>Correction:</strong> Update or correct inaccurate
              information
            </ListItem>
            <ListItem>
              <strong>Deletion:</strong> Request deletion of your data (right to
              be forgotten)
            </ListItem>
            <ListItem>
              <strong>Portability:</strong> Receive your data in a portable
              format
            </ListItem>
            <ListItem>
              <strong>Objection:</strong> Object to certain data processing
              activities
            </ListItem>
            <ListItem>
              <strong>Restriction:</strong> Request limitation of data
              processing
            </ListItem>
            <ListItem>
              <strong>Withdraw Consent:</strong> Withdraw previously given
              consent
            </ListItem>
          </Box>
          <Typography variant="body1" paragraph>
            To exercise these rights, contact us at{" "}
            <Link
              href={`mailto:${companyEmail}`}
              sx={{ color: "primary.main" }}
            >
              {companyEmail}
            </Link>
            .
          </Typography>
        </Section>

        {/* Data Retention */}
        <Section title="8. Data Retention">
          <Typography variant="body1" paragraph>
            We retain your personal data only as long as necessary for the
            purposes outlined in this policy or as required by law:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              <strong>Active Accounts:</strong> Data retained while your account
              is active
            </ListItem>
            <ListItem>
              <strong>Closed Accounts:</strong> 30-day grace period before
              permanent deletion
            </ListItem>
            <ListItem>
              <strong>Legal Requirements:</strong> Some data retained for 7
              years (tax, accounting)
            </ListItem>
            <ListItem>
              <strong>Anonymized Data:</strong> May be retained indefinitely for
              analytics
            </ListItem>
          </Box>
        </Section>

        {/* Children's Privacy */}
        <Section title="9. Children's Privacy">
          <Typography variant="body1" paragraph>
            Our services are not intended for children under 13 years of age. We
            do not knowingly collect personal information from children. If we
            discover that a child has provided us with personal data, we will
            delete it immediately.
          </Typography>
        </Section>

        {/* International Transfers */}
        <Section title="10. International Data Transfers">
          <Typography variant="body1" paragraph>
            Your information may be transferred to and processed in countries
            other than your own. We ensure appropriate safeguards are in place
            to protect your data in compliance with applicable data protection
            laws.
          </Typography>
        </Section>

        {/* Changes to Policy */}
        <Section title="11. Changes to This Policy">
          <Typography variant="body1" paragraph>
            We may update this privacy policy from time to time. We will notify
            you of significant changes by:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>Posting the updated policy on our website</ListItem>
            <ListItem>Sending an email notification</ListItem>
            <ListItem>Displaying a prominent notice on our platform</ListItem>
          </Box>
          <Typography variant="body1" paragraph>
            Your continued use of our services after changes constitutes
            acceptance of the updated policy.
          </Typography>
        </Section>

        {/* Contact Us */}
        <Section title="12. Contact Us">
          <Typography variant="body1" paragraph>
            If you have questions about this privacy policy or our data
            practices, please contact us:
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
              <strong>Data Protection Officer:</strong>{" "}
              <Link
                href="mailto:dpo@fram3studio.io"
                sx={{ color: "primary.main" }}
              >
                dpo@fram3studio.io
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
