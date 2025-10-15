// src/modules/scripts/ScriptorLayout.tsx
"use client";

import React from "react";
import { Box, Container, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

interface ScriptorLayoutProps {
  children: React.ReactNode;
}

/**
 * ScriptorLayout - Layout wrapper for Scriptor module
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - No unnecessary useEffect for font loading (use Next.js font loading instead)
 * - Simple functional component for auto-optimization
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts (not hardcoded 'Orbitron')
 * - Respects light/dark mode automatically
 * - No hardcoded colors or spacing
 *
 * Porting changes:
 * - Removed useEffect for Google Fonts (should use Next.js font optimization)
 * - Replaced hardcoded 'Orbitron' with brand.fonts.heading
 * - Replaced color="primary.main" with theme palette
 * - Replaced color="secondary.main" with theme palette
 * - Used responsive spacing from theme
 * - Made component auto-optimized by React 19 compiler
 */
export function ScriptorLayout({ children }: ScriptorLayoutProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box
      sx={{
        color: "text.primary",
        minHeight: "100vh",
        pt: { xs: 3, md: 4 },
        pb: { xs: 6, md: 8 },
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: { xs: 4, md: 6 },
            position: "relative",
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontFamily: brand.fonts.heading,
              fontWeight: 700,
              letterSpacing: 2,
              textAlign: "center",
              color: "text.primary",
            }}
          >
            SCRPT
            <Box
              component="span"
              sx={{
                color: theme.palette.primary.main,
              }}
            >
              E0
            </Box>
            R
          </Typography>

          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              right: 0,
              fontSize: "0.9rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "text.secondary",
              opacity: 0.7,
              fontStyle: "italic",
              fontFamily: brand.fonts.body,
            }}
          >
            Story as a Service
          </Typography>
        </Box>

        {/* Main Content - Align to match screenshot */}
        <Box
          sx={{
            maxWidth: { xs: "100%", md: "85%" },
            mx: "auto",
            px: { xs: 0, md: 3 },
          }}
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
}

export default ScriptorLayout;
