import { UnifiedAuthGuard } from "@/components/auth";
import { Box, Button, Typography } from "@mui/material";
import { Coins } from "lucide-react";
import Link from "next/link";

export default function CreativeLandingPage() {
  return (
    <UnifiedAuthGuard
      requiresAccess="public"
      redirectIfAuthenticated="/dashboard"
    >
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Credit Badge - Top Right */}
        <Box
          sx={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 50,
            bgcolor: "background.paper",
            border: "2px solid",
            borderColor: "primary.main",
            borderRadius: "100px",
            px: 3,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            boxShadow: 8,
            backdropFilter: "blur(8px)",
          }}
        >
          <Coins style={{ width: 20, height: 20, color: "#FFD700" }} />
          <Typography
            sx={{
              color: "text.primary",
              fontWeight: 600,
              fontSize: "1.125rem",
            }}
          >
            --
          </Typography>
        </Box>

        {/* Background Elements */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: "25%",
              left: "25%",
              width: 384,
              height: 384,
              bgcolor: "primary.main",
              borderRadius: "50%",
              filter: "blur(100px)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: "25%",
              right: "25%",
              width: 384,
              height: 384,
              bgcolor: "primary.main",
              borderRadius: "50%",
              filter: "blur(100px)",
            }}
          />
        </Box>

        {/* Content */}
        <Box
          sx={{
            textAlign: "center",
            px: 3,
            position: "relative",
            zIndex: 10,
            maxWidth: 1200,
          }}
        >
          {/* Heading */}
          <Typography
            variant="h1"
            sx={{
              fontSize: {
                xs: "2.5rem",
                sm: "3.5rem",
                md: "5rem",
                lg: "6rem",
                xl: "7rem",
              },
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "primary.main",
              mb: 3,
            }}
          >
            Unleash your
            <br />
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Imagination
            </Box>
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: "1.125rem", sm: "1.25rem" },
              color: "text.secondary",
              mb: 6,
              maxWidth: 800,
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            Create stunning visuals, videos, and content with the power of AI.
            Your creative journey starts here.
          </Typography>

          {/* CTA Button */}
          <Button
            component={Link}
            href="/signin"
            variant="contained"
            size="large"
            sx={{
              height: 64,
              px: 6,
              fontSize: "1.125rem",
              fontWeight: 700,
              borderRadius: 4,
              textTransform: "none",
              boxShadow: 8,
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 12,
              },
            }}
          >
            Create now for free
          </Button>

          {/* Features */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              justifyContent: "center",
              gap: { xs: 2, sm: 4 },
              mt: 4,
            }}
          >
            {[
              "No credit card required",
              "100 free credits",
              "Instant access",
            ].map((feature) => (
              <Box
                key={feature}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.875rem",
                  }}
                >
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </UnifiedAuthGuard>
  );
}
