// src/app/legal/cookies/page.tsx
"use client";

import {
  Box,
  Container,
  Typography,
  Divider,
  Paper,
  Button,
  Link,
} from "@mui/material";
import { getCurrentBrand } from "@/config/brandConfig";
import { clearConsentFromLocalStorage } from "@/utils/consentHelpers";

export default function CookiesPolicyPage() {
  const brand = getCurrentBrand();
  const companyName = brand.name;
  const lastUpdated = "January 9, 2025";

  const handleChangePreferences = () => {
    clearConsentFromLocalStorage();
    window.location.reload();
  };

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
            Cookie Policy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last Updated: {lastUpdated}
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Change Preferences Button */}
        <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleChangePreferences}
            sx={{ borderRadius: `${brand.borderRadius}px` }}
          >
            Change Cookie Preferences
          </Button>
        </Box>

        {/* Introduction */}
        <Section title="1. What Are Cookies?">
          <Typography variant="body1" paragraph>
            Cookies are small text files that are placed on your device when you
            visit a website. They are widely used to make websites work more
            efficiently and provide information to website owners.
          </Typography>
          <Typography variant="body1" paragraph>
            Cookies allow us to recognize you, remember your preferences, and
            improve your overall experience on our platform.
          </Typography>
        </Section>

        {/* Types of Cookies */}
        <Section title="2. Types of Cookies We Use">
          <CookieCategory
            title="2.1 Necessary Cookies (Always Active)"
            description="These cookies are essential for the website to function properly. They enable core functionality such as security, network management, and accessibility."
            examples={[
              "Authentication tokens - Keep you logged in",
              "Security tokens - Prevent CSRF attacks",
              "Session management - Remember your current session",
              "Load balancing - Distribute traffic efficiently",
            ]}
            canDisable={false}
          />

          <CookieCategory
            title="2.2 Analytics Cookies (Optional)"
            description="These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously."
            examples={[
              "Google Analytics - Track page views and user behavior",
              "Usage statistics - Understand feature usage",
              "Performance monitoring - Identify slow pages",
              "Error tracking - Detect and fix bugs",
            ]}
            canDisable={true}
          />

          <CookieCategory
            title="2.3 Marketing Cookies (Optional)"
            description="These cookies track your activity across websites to display relevant advertisements and measure campaign effectiveness."
            examples={[
              "Google Ads - Display targeted advertisements",
              "Facebook Pixel - Track conversions from ads",
              "Retargeting pixels - Show ads for products you viewed",
              "Campaign tracking - Measure ad performance",
            ]}
            canDisable={true}
          />

          <CookieCategory
            title="2.4 Preference Cookies (Optional)"
            description="These cookies remember your preferences and settings to provide a personalized experience."
            examples={[
              "Theme preference - Dark or light mode",
              "Language selection - Remember your preferred language",
              "Region settings - Your country or timezone",
              "UI preferences - Collapsed/expanded sidebars",
            ]}
            canDisable={true}
          />
        </Section>

        {/* How We Use Cookies */}
        <Section title="3. How We Use Cookies">
          <Typography variant="body1" paragraph>
            We use cookies for the following purposes:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              <strong>Authentication:</strong> To keep you logged in across
              sessions
            </ListItem>
            <ListItem>
              <strong>Security:</strong> To protect against fraud and
              unauthorized access
            </ListItem>
            <ListItem>
              <strong>Performance:</strong> To analyze site performance and
              identify issues
            </ListItem>
            <ListItem>
              <strong>Personalization:</strong> To remember your preferences and
              settings
            </ListItem>
            <ListItem>
              <strong>Analytics:</strong> To understand user behavior and
              improve our services
            </ListItem>
            <ListItem>
              <strong>Marketing:</strong> To deliver relevant advertisements
              (with your consent)
            </ListItem>
          </Box>
        </Section>

        {/* Third-Party Cookies */}
        <Section title="4. Third-Party Cookies">
          <Typography variant="body1" paragraph>
            Some cookies on our website are set by third-party services we use:
          </Typography>

          <SubSection title="Google Analytics">
            <Typography variant="body1" paragraph>
              We use Google Analytics to understand how users interact with our
              website. Google Analytics uses cookies to collect anonymous
              information about your visit.
            </Typography>
            <Typography variant="body1" paragraph>
              Learn more:{" "}
              <Link
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener"
                sx={{ color: "primary.main" }}
              >
                Google Privacy Policy
              </Link>
            </Typography>
          </SubSection>

          <SubSection title="Payment Processors">
            <Typography variant="body1" paragraph>
              When you make a payment, our payment processors may set cookies to
              process your transaction securely. We do not store your payment
              card information.
            </Typography>
          </SubSection>

          <SubSection title="Social Media">
            <Typography variant="body1" paragraph>
              If you share content using social media buttons, those platforms
              may set cookies to track this activity.
            </Typography>
          </SubSection>
        </Section>

        {/* Managing Cookies */}
        <Section title="5. Managing Your Cookie Preferences">
          <Typography variant="body1" paragraph>
            You have several options to manage cookies:
          </Typography>

          <SubSection title="5.1 Through Our Cookie Banner">
            <Typography variant="body1" paragraph>
              When you first visit our website, you&apos;ll see a cookie consent
              banner. You can:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>Accept all cookies</ListItem>
              <ListItem>
                Reject all optional cookies (keep only necessary)
              </ListItem>
              <ListItem>
                Customize your preferences for each cookie category
              </ListItem>
            </Box>
            <Typography variant="body1" paragraph>
              You can change your preferences anytime by clicking the button at
              the top of this page.
            </Typography>
          </SubSection>

          <SubSection title="5.2 Through Your Browser">
            <Typography variant="body1" paragraph>
              Most browsers allow you to control cookies through their settings:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                <strong>Chrome:</strong> Settings → Privacy and Security →
                Cookies
              </ListItem>
              <ListItem>
                <strong>Firefox:</strong> Options → Privacy & Security → Cookies
              </ListItem>
              <ListItem>
                <strong>Safari:</strong> Preferences → Privacy → Cookies
              </ListItem>
              <ListItem>
                <strong>Edge:</strong> Settings → Privacy → Cookies
              </ListItem>
            </Box>
            <Typography variant="body1" paragraph>
              Note: Blocking all cookies may prevent some features from working
              properly.
            </Typography>
          </SubSection>

          <SubSection title="5.3 Opt-Out Tools">
            <Typography variant="body1" paragraph>
              You can opt out of specific tracking services:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                <Link
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener"
                  sx={{ color: "primary.main" }}
                >
                  Google Analytics Opt-out
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  href="http://optout.aboutads.info/"
                  target="_blank"
                  rel="noopener"
                  sx={{ color: "primary.main" }}
                >
                  Digital Advertising Alliance Opt-out
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  href="http://www.youronlinechoices.eu/"
                  target="_blank"
                  rel="noopener"
                  sx={{ color: "primary.main" }}
                >
                  Your Online Choices (EU)
                </Link>
              </ListItem>
            </Box>
          </SubSection>
        </Section>

        {/* Cookie Lifespan */}
        <Section title="6. How Long Do Cookies Last?">
          <Typography variant="body1" paragraph>
            Cookies have different lifespans:
          </Typography>

          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              <strong>Session Cookies:</strong> Deleted when you close your
              browser
            </ListItem>
            <ListItem>
              <strong>Persistent Cookies:</strong> Remain for a set period
              (days, months, or years)
            </ListItem>
            <ListItem>
              <strong>Our Cookies:</strong> Typically last 1 year, then require
              renewal
            </ListItem>
          </Box>
        </Section>

        {/* Updates to Policy */}
        <Section title="7. Updates to This Policy">
          <Typography variant="body1" paragraph>
            We may update this cookie policy to reflect changes in our practices
            or for legal reasons. When we make significant changes, we&apos;ll
            notify you by:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>Updating the &quot;Last Updated&quot; date</ListItem>
            <ListItem>Showing a notice on our website</ListItem>
            <ListItem>Requesting consent again if required</ListItem>
          </Box>
        </Section>

        {/* Contact */}
        <Section title="8. Contact Us">
          <Typography variant="body1" paragraph>
            If you have questions about our use of cookies, please contact us:
          </Typography>
          <Box sx={{ pl: 2, mb: 2 }}>
            <Typography variant="body1" paragraph>
              <strong>Email:</strong>{" "}
              <Link
                href="mailto:privacy@fram3studio.io"
                sx={{ color: "primary.main" }}
              >
                privacy@fram3studio.io
              </Link>
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Privacy Policy:</strong>{" "}
              <Link href="/legal/privacy" sx={{ color: "primary.main" }}>
                View our Privacy Policy
              </Link>
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

function CookieCategory({
  title,
  description,
  examples,
  canDisable,
}: {
  title: string;
  description: string;
  examples: string[];
  canDisable: boolean;
}) {
  const brand = getCurrentBrand();
  return (
    <Box
      sx={{
        mb: 3,
        p: 3,
        bgcolor: "background.default",
        borderRadius: `${brand.borderRadius}px`,
        border: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "text.primary" }}
        >
          {title}
        </Typography>
        {!canDisable && (
          <Typography
            variant="caption"
            sx={{
              bgcolor: "error.main",
              color: "error.contrastText",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            REQUIRED
          </Typography>
        )}
        {canDisable && (
          <Typography
            variant="caption"
            sx={{
              bgcolor: "success.main",
              color: "success.contrastText",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            OPTIONAL
          </Typography>
        )}
      </Box>

      <Typography variant="body1" paragraph>
        {description}
      </Typography>

      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Examples:
      </Typography>
      <Box component="ul" sx={{ pl: 3, mb: 0 }}>
        {examples.map((example, index) => (
          <li key={index}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {example}
            </Typography>
          </li>
        ))}
      </Box>
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
