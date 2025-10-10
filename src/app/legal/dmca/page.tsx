// src/app/legal/dmca/page.tsx
"use client";

import {
  Box,
  Container,
  Typography,
  Divider,
  Paper,
  Link,
  Alert,
} from "@mui/material";
import { getCurrentBrand } from "@/config/brandConfig";

export default function DMCAPage() {
  const brand = getCurrentBrand();
  const companyName = brand.name;
  const dmcaEmail = "dmca@fram3studio.io";
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
            DMCA Copyright Policy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last Updated: {lastUpdated}
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Overview */}
        <Section title="1. Overview">
          <Typography variant="body1" paragraph>
            {companyName} respects the intellectual property rights of others
            and expects our users to do the same. In accordance with the Digital
            Millennium Copyright Act (DMCA) and other applicable laws, we have
            adopted a policy of terminating, in appropriate circumstances, users
            who are deemed to be repeat infringers.
          </Typography>
          <Typography variant="body1" paragraph>
            This policy outlines our procedures for responding to claims that
            content posted on our platform infringes the copyright of a third
            party.
          </Typography>
        </Section>

        {/* Notice Alert */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            If you believe that your copyrighted work has been copied in a way
            that constitutes copyright infringement and is accessible via our
            platform, please notify our DMCA agent as specified below.
          </Typography>
        </Alert>

        {/* Filing a DMCA Notice */}
        <Section title="2. Filing a DMCA Copyright Infringement Notice">
          <Typography variant="body1" paragraph>
            To file a notice of infringement with us, you must provide a written
            communication that includes substantially the following information:
          </Typography>

          <SubSection title="Required Information:">
            <Box component="ol" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                <strong>Identification of the copyrighted work:</strong> A
                description of the copyrighted work that you claim has been
                infringed, or if multiple copyrighted works are covered by a
                single notification, a representative list of such works.
              </ListItem>
              <ListItem>
                <strong>Identification of the infringing material:</strong> A
                description of where the material that you claim is infringing
                is located on our platform, with sufficient detail that we can
                find it (e.g., URL, screenshot, specific location).
              </ListItem>
              <ListItem>
                <strong>Your contact information:</strong> Your name, address,
                telephone number, and email address.
              </ListItem>
              <ListItem>
                <strong>Good faith statement:</strong> A statement that you have
                a good faith belief that the disputed use is not authorized by
                the copyright owner, its agent, or the law.
              </ListItem>
              <ListItem>
                <strong>Accuracy statement:</strong> A statement, made under
                penalty of perjury, that the information in your notice is
                accurate and that you are the copyright owner or authorized to
                act on the copyright owner&apos;s behalf.
              </ListItem>
              <ListItem>
                <strong>Signature:</strong> An electronic or physical signature
                of the person authorized to act on behalf of the copyright
                owner.
              </ListItem>
            </Box>
          </SubSection>

          <Alert severity="warning" sx={{ my: 3 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> Under Section 512(f) of the DMCA, any
              person who knowingly materially misrepresents that material is
              infringing may be subject to liability. Please do not make false
              claims.
            </Typography>
          </Alert>
        </Section>

        {/* DMCA Agent Contact */}
        <Section title="3. DMCA Agent Contact Information">
          <Typography variant="body1" paragraph>
            All DMCA notices should be sent to our designated DMCA agent:
          </Typography>
          <Paper
            sx={{
              p: 3,
              bgcolor: "grey.50",
              border: 1,
              borderColor: "divider",
              mb: 3,
            }}
          >
            <Typography variant="body1" paragraph>
              <strong>DMCA Agent:</strong> {companyName} Legal Department
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Email:</strong>{" "}
              <Link href={`mailto:${dmcaEmail}`} sx={{ color: "primary.main" }}>
                {dmcaEmail}
              </Link>
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Subject Line:</strong> DMCA Takedown Notice
            </Typography>
            <Typography variant="body1">
              <strong>Address:</strong> [Your Company Physical Address]
            </Typography>
          </Paper>
        </Section>

        {/* Counter-Notice */}
        <Section title="4. Filing a DMCA Counter-Notice">
          <Typography variant="body1" paragraph>
            If you believe that content you posted was removed or disabled by
            mistake or misidentification, you may file a counter-notice with us.
          </Typography>

          <SubSection title="Counter-Notice Requirements:">
            <Box component="ol" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                <strong>Your contact information:</strong> Your name, address,
                telephone number, and email address.
              </ListItem>
              <ListItem>
                <strong>Identification of the material:</strong> Description and
                location of the material that was removed or disabled.
              </ListItem>
              <ListItem>
                <strong>Good faith statement:</strong> A statement under penalty
                of perjury that you have a good faith belief that the material
                was removed or disabled as a result of mistake or
                misidentification.
              </ListItem>
              <ListItem>
                <strong>Consent to jurisdiction:</strong> A statement that you
                consent to the jurisdiction of the Federal District Court for
                the judicial district in which your address is located (or if
                outside the United States, for any judicial district in which
                {companyName} may be found), and that you will accept service of
                process from the person who provided the original DMCA notice or
                an agent of such person.
              </ListItem>
              <ListItem>
                <strong>Signature:</strong> Your physical or electronic
                signature.
              </ListItem>
            </Box>
          </SubSection>

          <Typography variant="body1" paragraph>
            Upon receipt of a valid counter-notice, we will forward it to the
            party who submitted the original DMCA notice. If we do not receive
            notice within 10-14 business days that the original complainant has
            filed a court action to restrain the allegedly infringing activity,
            we may restore the removed content.
          </Typography>
        </Section>

        {/* Our Response Process */}
        <Section title="5. Our Response to DMCA Notices">
          <Typography variant="body1" paragraph>
            When we receive a valid DMCA notice, we will:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              Remove or disable access to the allegedly infringing material
            </ListItem>
            <ListItem>
              Notify the user who posted the material that we have removed or
              disabled access to it
            </ListItem>
            <ListItem>
              Terminate repeat infringers&apos; accounts in appropriate
              circumstances
            </ListItem>
          </Box>
        </Section>

        {/* Repeat Infringer Policy */}
        <Section title="6. Repeat Infringer Policy">
          <Typography variant="body1" paragraph>
            {companyName} maintains a policy of terminating accounts of users
            who are determined to be repeat infringers. A repeat infringer
            includes any user who has received two or more DMCA notices
            regarding content they have posted.
          </Typography>
          <Typography variant="body1" paragraph>
            We may also terminate accounts at our discretion based on
            circumstances indicating that a user is an infringer, whether or not
            there have been repeated notices.
          </Typography>
        </Section>

        {/* Limitations */}
        <Section title="7. Limitations and Good Faith">
          <Typography variant="body1" paragraph>
            Please note that under Section 512(f) of the DMCA, you may be liable
            for damages (including costs and attorneys&apos; fees) if you
            materially misrepresent that material or activity is infringing.
          </Typography>
          <Typography variant="body1" paragraph>
            Before submitting a DMCA notice, please consider whether the use
            might be protected by fair use, fair dealing, or a similar exception
            under copyright law. If you are unsure, we recommend consulting with
            an attorney.
          </Typography>
        </Section>

        {/* Processing Time */}
        <Section title="8. Processing Time">
          <Typography variant="body1" paragraph>
            We aim to process all valid DMCA notices within 2-5 business days of
            receipt. Complex cases may take longer. We will notify you via email
            about the status of your notice.
          </Typography>
        </Section>

        {/* Contact Information */}
        <Section title="9. Questions and Contact">
          <Typography variant="body1" paragraph>
            If you have questions about this DMCA policy or need assistance,
            please contact us:
          </Typography>
          <Box sx={{ pl: 2, mb: 2 }}>
            <Typography variant="body1" paragraph>
              <strong>DMCA Inquiries:</strong>{" "}
              <Link href={`mailto:${dmcaEmail}`} sx={{ color: "primary.main" }}>
                {dmcaEmail}
              </Link>
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Legal Department:</strong>{" "}
              <Link
                href="mailto:legal@fram3studio.io"
                sx={{ color: "primary.main" }}
              >
                legal@fram3studio.io
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
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          mb: 2,
          color: "text.primary",
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
    <Box sx={{ mb: 2, ml: 2 }}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: 1,
          color: "text.primary",
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <Box component="li" sx={{ mb: 1 }}>
      <Typography variant="body1">{children}</Typography>
    </Box>
  );
}
