"use client";

import { useEffect, useMemo } from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ArrowLeft } from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ScriptorLayoutProps {
  children: React.ReactNode;
  containerSize?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  fullWidth?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonLabel?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScriptorLayout({
  children,
  containerSize = "lg",
  fullWidth = false,
  showBackButton = false,
  onBackClick,
  backButtonLabel = "Back to Generator",
}: ScriptorLayoutProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Load Orbitron font
  useEffect(() => {
    // Check if font is already loaded
    if (document.querySelector('link[href*="Orbitron"]')) {
      return;
    }

    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap";
    link.rel = "stylesheet";
    link.crossOrigin = "anonymous";

    document.head.appendChild(link);

    return () => {
      // Only remove if the link still exists
      if (link.parentNode) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // Memoize container max width calculation
  const containerMaxWidth = useMemo(() => {
    if (fullWidth) return false;
    return containerSize;
  }, [fullWidth, containerSize]);

  // Memoize content max width
  const contentMaxWidth = useMemo(() => {
    if (fullWidth) return "100%";
    return { xs: "100%", md: "85%" };
  }, [fullWidth]);

  // Memoize padding values
  const containerPadding = useMemo(() => {
    return fullWidth ? 0 : undefined;
  }, [fullWidth]);

  const contentPadding = useMemo(() => {
    if (fullWidth) return 0;
    return { xs: 0, md: 3 };
  }, [fullWidth]);

  // Handle back button click
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
        minHeight: "100vh",
        pt: 4,
        pb: 8,
        width: "100%",
      }}
    >
      <Container
        maxWidth={containerMaxWidth}
        sx={{
          px: containerPadding,
        }}
      >
        {/* Header with integrated back button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 6,
            position: "relative",
          }}
        >
          {/* Left side - Back button */}
          <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
            {showBackButton && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ArrowLeft size={18} />}
                onClick={handleBackClick}
                sx={{
                  borderRadius: `${brand.borderRadius * 3}px`,
                  textTransform: "none",
                  fontWeight: 500,
                  fontFamily: brand.fonts.body,
                  transition: theme.transitions.create(
                    ["transform", "background-color", "border-color"],
                    {
                      duration: theme.transitions.duration.shorter,
                    }
                  ),
                  borderColor: "secondary.main",
                  color: "secondary.main",
                  "&:hover": {
                    transform: "translateX(-3px)",
                    borderColor: "secondary.dark",
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? theme.palette.secondary.main + "14"
                        : theme.palette.secondary.light + "1A",
                  },
                  px: 2.5,
                  py: 1,
                }}
              >
                {backButtonLabel}
              </Button>
            )}
          </Box>

          {/* Center - Logo */}
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontFamily: "'Orbitron', " + brand.fonts.heading,
                fontWeight: 700,
                letterSpacing: 2,
                textAlign: "center",
                color: "primary.main",
                fontSize: {
                  xs: "2rem",
                  sm: "2.5rem",
                  md: "3rem",
                },
                userSelect: "none",
              }}
            >
              SCRPT
              <Box
                component="span"
                sx={{
                  color: "secondary.main",
                  display: "inline-block",
                }}
              >
                0
              </Box>
              R
            </Typography>
          </Box>

          {/* Right side - Tagline */}
          <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.9rem",
                color: "text.secondary",
                opacity: 0.7,
                fontStyle: "italic",
                fontFamily: brand.fonts.body,
                display: { xs: "none", sm: "block" },
              }}
            >
              Story as a Service
            </Typography>
          </Box>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            maxWidth: contentMaxWidth,
            mx: "auto",
            px: contentPadding,
          }}
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
}
