// src/app/legal/copyright/page.tsx
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

export default function CopyrightPage() {
  const brand = getCurrentBrand();
  const companyName = "Fram3 Studio";
  const copyrightEmail = "copyright@fram3studio.io";
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
            Copyright Policy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last Updated: {lastUpdated}
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Copyright Notice */}
        <Section title="1. Copyright Notice">
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              All content on {companyName}'s Script-to-Video AI platform,
              including but not limited to text, graphics, logos, icons, images,
              audio clips, video clips, AI-generated videos, animations, data
              compilations, software, and the compilation thereof, is the
              property of {companyName}, its users, or its content suppliers and
              is protected by international copyright laws.
            </Typography>
          </Alert>
          <Typography variant="body1" paragraph>
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </Typography>
          <Typography variant="body1" paragraph>
            The content, organization, graphics, design, compilation, AI
            algorithms, video generation technology, digital conversion, and
            other matters related to our platform are protected under applicable
            copyrights, trademarks, and other proprietary rights. Copying,
            redistribution, use, or publication of any such content or any part
            of our platform is strictly prohibited without our express written
            permission.
          </Typography>
        </Section>

        {/* Ownership of Content */}
        <Section title="2. Ownership of Platform Content">
          <SubSection title="2.1 Fram3 Studio-Owned Content">
            <Typography variant="body1" paragraph>
              {companyName} owns or has the rights to use all proprietary
              content that is part of our Script-to-Video AI platform,
              including:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>Platform design, layout, and user interface</ListItem>
              <ListItem>AI algorithms and video generation technology</ListItem>
              <ListItem>Software, source code, and compiled code</ListItem>
              <ListItem>Fram3 Studio logos, trademarks, and branding</ListItem>
              <ListItem>
                Marketing materials, documentation, and tutorials
              </ListItem>
              <ListItem>Template libraries and pre-built assets</ListItem>
              <ListItem>
                Stock footage, music, and media libraries we provide
              </ListItem>
              <ListItem>
                Platform-generated graphics and visual elements
              </ListItem>
            </Box>
          </SubSection>

          <SubSection title="2.2 User Scripts and Input Content">
            <Typography variant="body1" paragraph>
              When you upload scripts, text, images, or other input content to
              our platform:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                <strong>You retain full ownership</strong> of your original
                scripts and input materials
              </ListItem>
              <ListItem>
                <strong>You grant us a license</strong> to process, analyze, and
                use your content to generate videos and provide our AI services
              </ListItem>
              <ListItem>
                <strong>You represent and warrant</strong> that you have the
                legal right to upload and use such content
              </ListItem>
              <ListItem>
                <strong>You remain responsible</strong> for ensuring your
                content does not infringe on others' intellectual property
                rights
              </ListItem>
              <ListItem>
                <strong>You agree not to upload</strong> copyrighted material
                without proper authorization or licensing
              </ListItem>
            </Box>
          </SubSection>

          <SubSection title="2.3 AI-Generated Videos">
            <Typography variant="body1" paragraph>
              Videos generated using {companyName}'s AI technology:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                <strong>Are owned by you</strong>, the user who created them
                using our platform
              </ListItem>
              <ListItem>
                <strong>May be used by you</strong> for any lawful commercial or
                personal purpose
              </ListItem>
              <ListItem>
                <strong>Must not infringe</strong> on third-party intellectual
                property rights
              </ListItem>
              <ListItem>
                <strong>May be used by {companyName}</strong> in anonymized,
                watermarked form for marketing, demonstrations, and service
                improvement (unless you have a premium plan with full privacy)
              </ListItem>
              <ListItem>
                <strong>Are subject to</strong> the terms of any third-party
                assets (stock footage, music, fonts) included in the generation
              </ListItem>
            </Box>
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Important:</strong> While you own the AI-generated
                videos, you are responsible for ensuring all input content and
                the resulting video comply with copyright laws. {companyName} is
                not liable for copyright infringement arising from
                user-generated content.
              </Typography>
            </Alert>
          </SubSection>

          <SubSection title="2.4 Templates and Pre-Built Assets">
            <Typography variant="body1" paragraph>
              Templates, scenes, and pre-built assets provided by {companyName}:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                Remain the intellectual property of {companyName} or our
                licensors
              </ListItem>
              <ListItem>
                Are licensed to you for use within the platform only
              </ListItem>
              <ListItem>
                May be used in your generated videos without additional
                attribution
              </ListItem>
              <ListItem>
                Cannot be extracted, resold, or redistributed separately from
                videos created on our platform
              </ListItem>
            </Box>
          </SubSection>
        </Section>

        {/* License Grant */}
        <Section title="3. License Grant to Users">
          <Typography variant="body1" paragraph>
            Subject to your compliance with our Terms of Service, {companyName}{" "}
            grants you a limited, non-exclusive, non-transferable,
            non-sublicensable, revocable license to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              Access and use our Script-to-Video AI platform for creating videos
            </ListItem>
            <ListItem>
              Generate videos using your scripts and our AI technology
            </ListItem>
            <ListItem>
              Use templates, stock assets, and pre-built elements we provide
            </ListItem>
            <ListItem>
              Download and distribute videos you create through our platform
            </ListItem>
            <ListItem>
              Use AI-generated content for commercial or personal purposes
            </ListItem>
          </Box>

          <Typography variant="body1" paragraph>
            This license does NOT permit you to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              Reverse engineer, decompile, or attempt to extract our AI
              algorithms
            </ListItem>
            <ListItem>
              Remove watermarks or branding (unless subscribed to a premium
              plan)
            </ListItem>
            <ListItem>
              Redistribute, resell, or sublicense our templates or platform
              assets separately
            </ListItem>
            <ListItem>
              Use our platform to create content that infringes others'
              copyrights
            </ListItem>
            <ListItem>
              Copy, modify, or create derivative works of our platform software
            </ListItem>
            <ListItem>
              Use automated systems to scrape or mass-download our content
            </ListItem>
            <ListItem>
              Remove any copyright, trademark, or proprietary notices from our
              platform
            </ListItem>
          </Box>
        </Section>

        {/* Third-Party Content */}
        <Section title="4. Third-Party Content and Media Libraries">
          <Typography variant="body1" paragraph>
            {companyName}'s platform may include licensed content from third
            parties:
          </Typography>

          <SubSection title="4.1 Stock Footage and Images">
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                Licensed from providers like Shutterstock, Pexels, Unsplash, and
                others
              </ListItem>
              <ListItem>
                Subject to the original licensing terms of those providers
              </ListItem>
              <ListItem>
                May be used in your videos created through our platform
              </ListItem>
              <ListItem>
                Cannot be extracted and used outside of videos created on our
                platform
              </ListItem>
            </Box>
          </SubSection>

          <SubSection title="4.2 Music and Audio">
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                Licensed from royalty-free music libraries and composers
              </ListItem>
              <ListItem>
                Cleared for commercial use when included in your generated
                videos
              </ListItem>
              <ListItem>
                May require attribution depending on the specific license (check
                video details)
              </ListItem>
              <ListItem>
                Cannot be extracted as standalone audio files for separate
                distribution
              </ListItem>
            </Box>
          </SubSection>

          <SubSection title="4.3 Fonts and Typography">
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                All fonts used in our platform are properly licensed
              </ListItem>
              <ListItem>
                Licensed for embedding in videos created through our service
              </ListItem>
              <ListItem>
                Font files themselves remain property of their respective
                creators
              </ListItem>
            </Box>
          </SubSection>

          <Typography variant="body1" paragraph>
            If you believe any third-party content on our platform infringes
            your copyright, please see our{" "}
            <Link href="/legal/dmca" sx={{ color: "primary.main" }}>
              DMCA Policy
            </Link>
            .
          </Typography>
        </Section>

        {/* User Responsibilities */}
        <Section title="5. User Responsibilities for Copyright Compliance">
          <Typography variant="body1" paragraph>
            When using {companyName}, you are responsible for:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              <strong>Owning or licensing</strong> all scripts, text, and
              content you upload
            </ListItem>
            <ListItem>
              <strong>Not uploading</strong> copyrighted material without proper
              authorization
            </ListItem>
            <ListItem>
              <strong>Respecting trademark rights</strong> when creating branded
              content
            </ListItem>
            <ListItem>
              <strong>Obtaining necessary permissions</strong> for any real
              people, brands, or logos featured in your content
            </ListItem>
            <ListItem>
              <strong>Complying with fair use guidelines</strong> if using
              copyrighted material for commentary, criticism, or education
            </ListItem>
            <ListItem>
              <strong>Indemnifying {companyName}</strong> against copyright
              claims arising from your content
            </ListItem>
          </Box>

          <Alert severity="error" sx={{ my: 3 }}>
            <Typography variant="body2">
              <strong>Violation Notice:</strong> Users who repeatedly upload
              copyrighted content without authorization will have their accounts
              terminated in accordance with our DMCA repeat infringer policy.
            </Typography>
          </Alert>
        </Section>

        {/* Responsible AI Use and Celebrity Rights */}
        <Section title="6. Responsible AI Use and Personality Rights">
          <SubSection title="6.1 Celebrity Images, Likenesses, and Voices">
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>CRITICAL REQUIREMENT:</strong> The use of any
                celebrity's image, likeness, voice, or persona through our AI
                platform is STRICTLY PROHIBITED unless you possess explicit
                legal authorization, licensing rights, or written consent from
                the individual or their legal representatives.
              </Typography>
            </Alert>

            <Typography variant="body1" paragraph>
              When creating AI-generated content featuring real individuals:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                <strong>You MUST have rights:</strong> You are solely
                responsible for obtaining all necessary rights, licenses, and
                permissions to use any person's image, likeness, voice, or other
                identifying characteristics
              </ListItem>
              <ListItem>
                <strong>No unauthorized celebrity content:</strong> Creating,
                distributing, or monetizing content featuring celebrities,
                public figures, or any identifiable person without authorization
                is prohibited
              </ListItem>
              <ListItem>
                <strong>Voice cloning restrictions:</strong> AI-generated voices
                that mimic real individuals require explicit consent from that
                individual or their estate
              </ListItem>
              <ListItem>
                <strong>Deepfake prohibition:</strong> Creating deceptive or
                misleading content that falsely depicts real people is strictly
                prohibited
              </ListItem>
              <ListItem>
                <strong>Right of publicity:</strong> We respect individuals'
                rights to control commercial use of their identity, including
                name, image, likeness, and voice
              </ListItem>
            </Box>
          </SubSection>

          <SubSection title="6.2 Prohibited Uses of AI Technology">
            <Typography variant="body1" paragraph>
              You may NOT use {companyName}'s AI platform to create content
              that:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                Impersonates or falsely represents any real person without
                authorization
              </ListItem>
              <ListItem>
                Creates non-consensual intimate or explicit content featuring
                real individuals
              </ListItem>
              <ListItem>
                Generates misleading political content featuring public figures
              </ListItem>
              <ListItem>
                Creates fraudulent endorsements or testimonials from celebrities
                or public figures
              </ListItem>
              <ListItem>
                Produces content that could damage an individual's reputation or
                violate their privacy rights
              </ListItem>
              <ListItem>
                Generates content for harassment, defamation, or malicious
                purposes
              </ListItem>
              <ListItem>
                Creates synthetic media designed to deceive or manipulate
                audiences
              </ListItem>
            </Box>
          </SubSection>

          <SubSection title="6.3 Required Documentation">
            <Typography variant="body1" paragraph>
              If you create content featuring identifiable individuals, you must
              be able to provide upon request:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                Written consent or authorization from the individual
              </ListItem>
              <ListItem>
                Valid licensing agreements for commercial use of likeness
              </ListItem>
              <ListItem>
                Model release forms if using real people's images
              </ListItem>
              <ListItem>
                Voice talent agreements for voice cloning or synthesis
              </ListItem>
              <ListItem>Estate permissions for deceased individuals</ListItem>
            </Box>

            <Typography variant="body1" paragraph>
              {companyName} reserves the right to request proof of authorization
              at any time and will remove content or terminate accounts if
              proper documentation cannot be provided.
            </Typography>
          </SubSection>

          <SubSection title="6.4 Transparency and Disclosure Requirements">
            <Typography variant="body1" paragraph>
              When distributing AI-generated content featuring real individuals:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                <strong>Clearly disclose</strong> that content is AI-generated
                when it could be mistaken for authentic footage
              </ListItem>
              <ListItem>
                <strong>Do not mislead audiences</strong> into believing
                synthetic content is real or endorsed by the depicted individual
              </ListItem>
              <ListItem>
                <strong>Include appropriate disclaimers</strong> for parody,
                satire, or commentary content
              </ListItem>
              <ListItem>
                <strong>Comply with platform policies</strong> on synthetic
                media disclosure when posting to social media or video platforms
              </ListItem>
            </Box>
          </SubSection>

          <SubSection title="6.5 Consequences of Violations">
            <Alert severity="error" sx={{ my: 2 }}>
              <Typography variant="body2">
                Violations of personality rights and unauthorized use of
                celebrity images, voices, or likenesses will result in:
              </Typography>
              <Box component="ul" sx={{ pl: 3, mt: 1 }}>
                <Box component="li" sx={{ mb: 0.5 }}>
                  <Typography variant="body2">
                    <strong>Immediate content removal</strong>
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 0.5 }}>
                  <Typography variant="body2">
                    <strong>Account suspension or permanent termination</strong>
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 0.5 }}>
                  <Typography variant="body2">
                    <strong>Legal action and liability</strong> - you are solely
                    responsible for any legal claims arising from unauthorized
                    use
                  </Typography>
                </Box>
                <Box component="li">
                  <Typography variant="body2">
                    <strong>Cooperation with law enforcement</strong> if content
                    violates applicable laws
                  </Typography>
                </Box>
              </Box>
            </Alert>
          </SubSection>

          <SubSection title="6.6 Reporting Unauthorized Use">
            <Typography variant="body1" paragraph>
              If you believe your image, likeness, or voice is being used
              without authorization on our platform:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <ListItem>
                Contact our legal team immediately at{" "}
                <Link
                  href="mailto:abuse@fram3studio.io"
                  sx={{ color: "primary.main" }}
                >
                  abuse@fram3studio.io
                </Link>
              </ListItem>
              <ListItem>
                Provide identification proving you are the affected individual
                or authorized representative
              </ListItem>
              <ListItem>
                Specify the infringing content with URLs or detailed
                descriptions
              </ListItem>
              <ListItem>
                Include a statement that you have not authorized the use
              </ListItem>
            </Box>

            <Typography variant="body1" paragraph>
              We will investigate reports promptly and take appropriate action
              within 24-48 hours.
            </Typography>
          </SubSection>
        </Section>

        {/* Fair Use */}
        <Section title="7. Fair Use and Educational Exceptions">
          <Typography variant="body1" paragraph>
            Nothing in this policy restricts uses permitted by copyright law,
            including:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              Fair use for commentary, criticism, news reporting, teaching, or
              research
            </ListItem>
            <ListItem>
              Fair dealing (in applicable jurisdictions outside the United
              States)
            </ListItem>
            <ListItem>Educational use in non-profit academic settings</ListItem>
            <ListItem>
              Parody and transformative works that add new meaning or message
            </ListItem>
          </Box>

          <Typography variant="body1" paragraph>
            However, fair use is determined on a case-by-case basis. If you plan
            to use copyrighted material in your videos, we recommend:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>Consulting with a legal professional</ListItem>
            <ListItem>
              Using only small portions necessary for your purpose
            </ListItem>
            <ListItem>
              Adding significant original commentary or transformation
            </ListItem>
            <ListItem>
              Providing proper attribution to the original source
            </ListItem>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note on Celebrity Parody:</strong> Even parody and satire
              content featuring celebrities must not violate personality rights
              or create misleading representations. Clearly label satirical
              content and ensure it's transformative enough to qualify for fair
              use protection.
            </Typography>
          </Alert>
        </Section>

        {/* Trademarks */}
        <Section title="8. Trademarks and Branding">
          <Typography variant="body1" paragraph>
            "Fram3 Studio," our logo, and associated marks are trademarks or
            registered trademarks of {companyName}. You may not use these marks
            without our prior written permission, except:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              To accurately describe that you used our platform to create your
              video
            </ListItem>
            <ListItem>
              In unaltered form as part of a link to fram3studio.io
            </ListItem>
            <ListItem>
              For news reporting or factual references about our service
            </ListItem>
          </Box>

          <Typography variant="body1" paragraph>
            You must NOT:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              Imply endorsement or partnership without authorization
            </ListItem>
            <ListItem>
              Use our marks in a way that causes confusion about the source
            </ListItem>
            <ListItem>Modify or alter our logos or branding</ListItem>
            <ListItem>
              Use our marks in domain names or social media handles without
              permission
            </ListItem>
          </Box>
        </Section>

        {/* Reporting Infringement */}
        <Section title="9. Reporting Copyright Infringement">
          <Typography variant="body1" paragraph>
            If you believe content on our platform or videos created through our
            service infringe your copyright, you may file a DMCA takedown
            notice. See our{" "}
            <Link
              href="/legal/dmca"
              sx={{ color: "primary.main", textDecoration: "underline" }}
            >
              DMCA Policy
            </Link>{" "}
            for detailed instructions on how to submit a proper notice.
          </Typography>

          <Typography variant="body1" paragraph>
            For general copyright inquiries or permission requests:
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
              <strong>Copyright Inquiries:</strong>{" "}
              <Link
                href={`mailto:${copyrightEmail}`}
                sx={{ color: "primary.main" }}
              >
                {copyrightEmail}
              </Link>
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>DMCA Takedowns:</strong>{" "}
              <Link
                href="mailto:dmca@fram3studio.io"
                sx={{ color: "primary.main" }}
              >
                dmca@fram3studio.io
              </Link>
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Personality Rights Violations:</strong>{" "}
              <Link
                href="mailto:abuse@fram3studio.io"
                sx={{ color: "primary.main" }}
              >
                abuse@fram3studio.io
              </Link>
            </Typography>
            <Typography variant="body1">
              <strong>Response Time:</strong> We aim to respond within 2-5
              business days
            </Typography>
          </Paper>
        </Section>

        {/* Permissions and Licensing */}
        <Section title="10. Requesting Permissions and Commercial Licensing">
          <Typography variant="body1" paragraph>
            If you wish to use {companyName}'s technology, templates, or content
            beyond the scope of standard user licenses, you must obtain written
            permission. This includes:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              White-label or rebranded versions of our platform
            </ListItem>
            <ListItem>API access for custom integrations at scale</ListItem>
            <ListItem>
              Reselling or redistributing our templates or assets
            </ListItem>
            <ListItem>
              Using our brand or technology in your marketing materials
            </ListItem>
            <ListItem>Enterprise licensing for large organizations</ListItem>
          </Box>

          <Typography variant="body1" paragraph>
            To request commercial licensing, contact{" "}
            <Link
              href="mailto:business@fram3studio.io"
              sx={{ color: "primary.main" }}
            >
              business@fram3studio.io
            </Link>{" "}
            with details about your intended use.
          </Typography>
        </Section>

        {/* Attribution Requirements */}
        <Section title="11. Attribution Requirements">
          <Typography variant="body1" paragraph>
            For free-tier users, videos may include a {companyName} watermark.
            Premium subscribers can remove watermarks, but we appreciate (though
            don't require) attribution such as:
          </Typography>

          <Paper
            sx={{
              p: 2,
              bgcolor: "grey.50",
              border: 1,
              borderColor: "divider",
              mb: 2,
            }}
          >
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              "Created with Fram3 Studio"
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              "Video generated using fram3studio.io"
            </Typography>
          </Paper>

          <Typography variant="body1" paragraph>
            When using our content with permission, you must:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              Not remove copyright notices from templates or assets
            </ListItem>
            <ListItem>
              Provide attribution as specified in license agreements
            </ListItem>
            <ListItem>
              Not imply endorsement without explicit authorization
            </ListItem>
          </Box>
        </Section>

        {/* International Copyright */}
        <Section title="12. International Copyright Compliance">
          <Typography variant="body1" paragraph>
            {companyName} respects international copyright laws and treaties,
            including:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              Berne Convention for the Protection of Literary and Artistic Works
            </ListItem>
            <ListItem>WIPO Copyright Treaty (WCT)</ListItem>
            <ListItem>
              Digital Millennium Copyright Act (DMCA) - United States
            </ListItem>
            <ListItem>European Union Copyright Directive</ListItem>
            <ListItem>
              Local copyright laws in all jurisdictions where we operate
            </ListItem>
          </Box>

          <Typography variant="body1" paragraph>
            Our platform is accessible globally, and you must comply with
            copyright laws in your jurisdiction when creating and distributing
            videos.
          </Typography>
        </Section>

        {/* AI and Machine Learning */}
        <Section title="13. AI Training and Machine Learning">
          <Typography variant="body1" paragraph>
            {companyName} uses machine learning to improve our Script-to-Video
            AI technology:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              We may use anonymized, aggregated data to train and improve our AI
              models
            </ListItem>
            <ListItem>
              Your specific scripts and generated videos are not used for
              training without consent
            </ListItem>
            <ListItem>
              Enterprise customers can opt out of any data usage for model
              training
            </ListItem>
            <ListItem>
              We respect copyright in all training data and do not intentionally
              train on copyrighted material without proper licensing
            </ListItem>
          </Box>
        </Section>

        {/* Updates to Policy */}
        <Section title="14. Changes to This Copyright Policy">
          <Typography variant="body1" paragraph>
            We may update this Copyright Policy to reflect changes in our
            services, technology, or legal requirements. When we make changes:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <ListItem>
              The "Last Updated" date at the top of this page will be revised
            </ListItem>
            <ListItem>
              Significant changes will be announced via email or platform
              notification
            </ListItem>
            <ListItem>
              Your continued use after changes constitutes acceptance of the
              updated policy
            </ListItem>
          </Box>
        </Section>

        {/* Contact Information */}
        <Section title="15. Contact Us">
          <Typography variant="body1" paragraph>
            For questions, concerns, or requests regarding this Copyright
            Policy:
          </Typography>
          <Box sx={{ pl: 2, mb: 2 }}>
            <Typography variant="body1" paragraph>
              <strong>Copyright Inquiries:</strong>{" "}
              <Link
                href={`mailto:${copyrightEmail}`}
                sx={{ color: "primary.main" }}
              >
                {copyrightEmail}
              </Link>
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>DMCA Notices:</strong>{" "}
              <Link
                href="mailto:dmca@fram3studio.io"
                sx={{ color: "primary.main" }}
              >
                dmca@fram3studio.io
              </Link>
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Personality Rights / Abuse Reports:</strong>{" "}
              <Link
                href="mailto:abuse@fram3studio.io"
                sx={{ color: "primary.main" }}
              >
                abuse@fram3studio.io
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
            <Typography variant="body1" paragraph>
              <strong>Business Inquiries:</strong>{" "}
              <Link
                href="mailto:business@fram3studio.io"
                sx={{ color: "primary.main" }}
              >
                business@fram3studio.io
              </Link>
            </Typography>
            <Typography variant="body1">
              <strong>Website:</strong>{" "}
              <Link
                href="https://fram3studio.io"
                sx={{ color: "primary.main" }}
                target="_blank"
              >
                https://fram3studio.io
              </Link>
            </Typography>
          </Box>
        </Section>
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
          fontSize: "1.1rem",
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
