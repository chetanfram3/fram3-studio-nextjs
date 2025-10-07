// src/app/page.tsx
"use client";

import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
} from "@mui/material";
import {
  RocketLaunch as RocketIcon,
  Code as CodeIcon,
  Palette as PaletteIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudQueue as CloudIcon,
  ArrowForward as ArrowIcon,
  GitHub as GitHubIcon,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import { BrandLogo, BrandSwitcher } from "@/components/branding";
import { useThemeMode } from "@/theme";

export default function Home() {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const brand = getCurrentBrand();

  const features = [
    {
      icon: <RocketIcon fontSize="large" />,
      title: "Lightning Fast",
      description:
        "Built with Next.js 15 and optimized for performance with server components and streaming.",
    },
    {
      icon: <CodeIcon fontSize="large" />,
      title: "Developer Friendly",
      description:
        "TypeScript, ESLint, and Prettier configured out of the box for the best DX.",
    },
    {
      icon: <PaletteIcon fontSize="large" />,
      title: "Multi-Brand Theming",
      description:
        "Switch between brands seamlessly with our advanced theming system supporting light and dark modes.",
    },
    {
      icon: <SpeedIcon fontSize="large" />,
      title: "Highly Performant",
      description:
        "Optimized bundle sizes, code splitting, and lazy loading for blazing fast load times.",
    },
    {
      icon: <SecurityIcon fontSize="large" />,
      title: "Type Safe",
      description:
        "Full TypeScript support with strict mode enabled for maximum type safety.",
    },
    {
      icon: <CloudIcon fontSize="large" />,
      title: "Cloud Ready",
      description:
        "Deploy anywhere - Vercel, AWS, Google Cloud, or your own infrastructure.",
    },
  ];

  const stats = [
    { value: "100%", label: "Type Safe" },
    { value: "3+", label: "Brand Themes" },
    { value: "2", label: "Theme Modes" },
    { value: "∞", label: "Possibilities" },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: "sticky",
          bgcolor: "background.default",
          borderBottom: 1,
          borderColor: "divider",
          backdropFilter: "blur(10px)",
          backgroundColor: isDarkMode
            ? "rgba(0, 0, 0, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 2,
            }}
          >
            <BrandLogo showText={!isMobile} size="medium" />

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {!isMobile && <BrandSwitcher />}
              <IconButton
                onClick={toggleTheme}
                sx={{
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
                  "&:hover": {
                    bgcolor: "secondary.dark",
                  },
                }}
              >
                {isDarkMode ? "🌞" : "🌙"}
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          py: { xs: 8, md: 16 },
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              textAlign: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Development Badge */}
            {process.env.NODE_ENV === "development" && (
              <Chip
                label="Development Preview"
                color="warning"
                size="small"
                sx={{ mb: 3 }}
              />
            )}

            {/* Main Heading */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.5rem", md: "4rem", lg: "5rem" },
                fontWeight: 800,
                mb: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: brand.fonts.heading,
                lineHeight: 1.2,
              }}
            >
              {brand.name}
            </Typography>

            {/* Tagline */}
            <Typography
              variant="h4"
              sx={{
                mb: 4,
                color: "text.secondary",
                fontWeight: 400,
                maxWidth: "800px",
                mx: "auto",
                fontSize: { xs: "1.25rem", md: "1.75rem" },
              }}
            >
              {brand.tagline}
            </Typography>

            {/* Description */}
            <Typography
              variant="body1"
              sx={{
                mb: 6,
                color: "text.secondary",
                maxWidth: "600px",
                mx: "auto",
                fontSize: { xs: "1rem", md: "1.125rem" },
                lineHeight: 1.8,
              }}
            >
              Experience the power of multi-brand theming with seamless
              switching between brands and theme modes. Built with Next.js 15,
              Material-UI, and Tailwind CSS.
            </Typography>

            {/* CTA Buttons */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 8 }}
            >
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  "&:hover": {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                  },
                }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<GitHubIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1.125rem",
                  fontWeight: 600,
                }}
              >
                View on GitHub
              </Button>
            </Stack>

            {/* Stats - Fixed Grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(4, 1fr)",
                },
                gap: 4,
                maxWidth: "800px",
                mx: "auto",
              }}
            >
              {stats.map((stat, index) => (
                <Box key={index} sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: "primary.main",
                      mb: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="xl" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: "2rem", md: "3rem" },
              fontFamily: brand.fonts.heading,
            }}
          >
            Powerful Features
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "text.secondary",
              maxWidth: "600px",
              mx: "auto",
            }}
          >
            Everything you need to build modern, scalable applications with
            multi-brand support
          </Typography>
        </Box>

        {/* Features Grid - Fixed */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 4,
          }}
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: `0 12px 40px ${theme.palette.primary.main}40`,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 4 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: `${brand.borderRadius}px`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    color: "white",
                    mb: 3,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    fontFamily: brand.fonts.heading,
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", lineHeight: 1.8 }}
                >
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* Brand Showcase Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: `linear-gradient(135deg, ${theme.palette.secondary.main}10 0%, ${theme.palette.primary.main}10 100%)`,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: "2rem", md: "3rem" },
                fontFamily: brand.fonts.heading,
              }}
            >
              Multi-Brand Theming
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "text.secondary",
                maxWidth: "600px",
                mx: "auto",
              }}
            >
              Switch between brands instantly and see the entire application
              adapt to the new brand identity
            </Typography>
          </Box>

          <Card
            sx={{
              maxWidth: "800px",
              mx: "auto",
              p: { xs: 3, md: 6 },
              textAlign: "center",
            }}
          >
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
              Current Brand: <strong>{brand.name}</strong>
            </Typography>

            {/* Brand Colors Grid - Fixed */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 3,
                mb: 4,
              }}
            >
              <Box
                sx={{
                  p: 3,
                  borderRadius: `${brand.borderRadius}px`,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  color: "white",
                }}
              >
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Primary Gradient
                </Typography>
                <Typography variant="body2">
                  {theme.palette.primary.main} → {theme.palette.secondary.main}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 3,
                  borderRadius: `${brand.borderRadius}px`,
                  border: 2,
                  borderColor: "primary.main",
                }}
              >
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Border Radius
                </Typography>
                <Typography variant="body2">{brand.borderRadius}px</Typography>
              </Box>
            </Box>

            <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
              To switch brands permanently, update your{" "}
              <code
                style={{
                  background:
                    theme.palette.mode === "dark" ? "#333" : "#f5f5f5",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                }}
              >
                .env.local
              </code>{" "}
              file and restart the server.
            </Typography>

            {process.env.NODE_ENV === "development" && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                💡 Use the Brand Switcher in the header to preview different
                brands in development mode
              </Typography>
            )}
          </Card>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="xl" sx={{ py: { xs: 8, md: 12 } }}>
        <Card
          sx={{
            p: { xs: 4, md: 8 },
            textAlign: "center",
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: "white",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: "2rem", md: "3rem" },
              fontFamily: brand.fonts.heading,
            }}
          >
            Ready to Get Started?
          </Typography>
          <Typography
            variant="h6"
            sx={{ mb: 4, opacity: 0.9, maxWidth: "600px", mx: "auto" }}
          >
            Join thousands of developers building amazing applications with our
            multi-brand theming system
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowIcon />}
            sx={{
              px: 6,
              py: 2,
              fontSize: "1.25rem",
              bgcolor: "white",
              color: theme.palette.primary.main,
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.9)",
              },
            }}
          >
            Start Building Now
          </Button>
        </Card>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 6,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.02)",
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <BrandLogo showText={true} size="small" />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              © 2025 {brand.name}. All rights reserved.
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Built with Next.js, Material-UI & Tailwind CSS
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
