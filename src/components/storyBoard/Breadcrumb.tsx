"use client";

import { Typography, Link, Breadcrumbs } from "@mui/material";
import { Home } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

interface BreadcrumbProps {
  scene?: number | null;
  shot?: number | null;
}

export function Breadcrumb({ scene, shot }: BreadcrumbProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  if (!scene && !shot) {
    return (
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          color="inherit"
          href="/"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            fontFamily: brand.fonts.body,
            "&:hover": {
              textDecoration: "underline",
              color: "primary.main",
            },
          }}
        >
          <Home sx={{ mr: 0.5, color: "primary.main" }} fontSize="inherit" />
          Home
        </Link>
      </Breadcrumbs>
    );
  }

  return (
    <Breadcrumbs
      aria-label="breadcrumb"
      sx={{
        "& .MuiBreadcrumbs-separator": {
          mx: 1,
          color: "text.secondary",
        },
      }}
    >
      <Link
        color="inherit"
        href="/"
        sx={{
          display: "flex",
          alignItems: "center",
          textDecoration: "none",
          fontFamily: brand.fonts.body,
          "&:hover": {
            textDecoration: "underline",
            color: "primary.main",
          },
        }}
      >
        <Home
          sx={{ mr: 0.5, color: "primary.main" }}
          fontSize="inherit"
          aria-label="Home"
        />
        Home
      </Link>

      {scene && (
        <Link
          color="inherit"
          href={`/scene/${scene}`}
          sx={{
            textDecoration: "none",
            fontFamily: brand.fonts.body,
            "&:hover": {
              textDecoration: "underline",
              color: "primary.main",
            },
          }}
        >
          Scene {scene}
        </Link>
      )}

      {shot && (
        <Typography
          color="text.primary"
          aria-current="page"
          sx={{ fontFamily: brand.fonts.body }}
        >
          Shot {shot}
        </Typography>
      )}
    </Breadcrumbs>
  );
}
