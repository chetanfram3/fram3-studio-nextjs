// src/modules/scripts/ScriptorLayout.tsx
import React, { useEffect } from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface ScriptorLayoutProps {
  children: React.ReactNode;
  containerSize?: "xs" | "sm" | "md" | "lg" | "xl";  // Add containerSize prop
  fullWidth?: boolean;  // Optional fullWidth prop
  showBackButton?: boolean;  // Control back button visibility
  onBackClick?: () => void;  // Handler for back button click
  backButtonLabel?: string;  // Custom label for back button
}

const ScriptorLayout: React.FC<ScriptorLayoutProps> = ({ 
  children, 
  containerSize = "lg",  // Default to "lg" for backward compatibility
  fullWidth = false,     // Default to false
  showBackButton = false,
  onBackClick = () => {},
  backButtonLabel = "Back to Generator"
}) => {
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
        width: "100%"
      }}
    >
      <Container 
        maxWidth={fullWidth ? false : containerSize}
        sx={{ 
          px: fullWidth ? 0 : undefined // Remove padding when fullWidth is true
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
                startIcon={<ArrowBackIcon />}
                onClick={onBackClick}
                sx={{
                  borderRadius: "24px",
                  textTransform: "none",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateX(-3px)",
                  }
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
                fontFamily: "'Orbitron', Inter",
                fontWeight: 700,
                letterSpacing: 2,
                textAlign: "center",
              }}
            >
              SCRPT
              <Box component="span" sx={{ color: "secondary.main" }}>
                0
              </Box>
              R
            </Typography>
          </Box>

          {/* Right side - Empty space or future elements */}
          <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.9rem",
                opacity: 0.7,
                fontStyle: "italic",
              }}
            >
              Story as a Service
            </Typography>
          </Box>
        </Box>

        {/* Main Content - Now with dynamic width based on props */}
        <Box
          sx={{
            maxWidth: fullWidth ? "100%" : { xs: "100%", md: "85%" },
            mx: "auto",
            px: fullWidth ? 0 : { xs: 0, md: 3 },
          }}
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
};

export default ScriptorLayout;