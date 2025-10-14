// src/modules/scripts/ScriptorLayout.tsx
"use client";

import React, { useEffect } from "react";
import { Box, Container, Typography } from "@mui/material";

interface ScriptorLayoutProps {
  children: React.ReactNode;
}

const ScriptorLayout: React.FC<ScriptorLayoutProps> = ({ children }) => {
  // Load Orbitron font using React's useEffect
  useEffect(() => {
    // Create link element for Google Fonts
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap";
    link.rel = "stylesheet";

    // Append to the document head
    document.head.appendChild(link);

    // Clean up function to remove the link when component unmounts
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        color: "primary.main",
        minHeight: "100vh",
        pt: 4,
        pb: 8,
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 6,
            position: "relative",
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontFamily: "'Orbitron', Inter",
              fontWeight: 700,
              letterSpacing: 2,
              textAlign: "center",
            }}
          >
            SCRPT
            <Box component="span" sx={{ color: "secondary.main" }}>
              E0
            </Box>
            R
          </Typography>

          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              right: 0,
              fontSize: "0.9REM",
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.7,
              fontStyle: "italic",
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
};

export default ScriptorLayout;
