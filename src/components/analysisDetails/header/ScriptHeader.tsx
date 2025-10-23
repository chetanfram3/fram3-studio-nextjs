"use client";

import { Typography, Box, Divider, Chip, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { BackButton } from "@/components/storyMain/BackButton";
import type { ScriptDetails } from "@/types";

interface ScriptHeaderProps {
  details: ScriptDetails;
}

/**
 * ScriptHeader - Displays script title, description, and version information
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Minimal re-renders with proper prop structure
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts
 * - Respects light/dark mode automatically
 */
export function ScriptHeader({ details }: ScriptHeaderProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
      {/* Back Button */}
      <BackButton
        homePath="/dashboard"
        showHomeButton={false}
        sx={{
          color: "primary.main",
          borderColor: "primary.main",
          "&:hover": {
            bgcolor: "action.hover",
            borderColor: "primary.dark",
          },
          transition: theme.transitions.create([
            "background-color",
            "border-color",
          ]),
        }}
      />

      {/* Vertical Divider */}
      <Divider
        orientation="vertical"
        flexItem
        sx={{
          borderRightWidth: 2,
          borderColor: "primary.main",
          alignSelf: "stretch",
        }}
      />

      {/* Title and Metadata */}
      <Box sx={{ flex: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <Typography
            variant="h1"
            sx={{
              fontFamily: brand.fonts.heading,
              fontWeight: "normal",
              textTransform: "uppercase",
              color: "text.primary",
            }}
          >
            {details.title}
          </Typography>

          <Chip
            label={`Version ${details.version.versionNumber}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{
              fontFamily: brand.fonts.body,
              fontWeight: 600,
            }}
          />
        </Stack>

        {details.description && (
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontFamily: brand.fonts.body,
              maxWidth: "800px",
            }}
          >
            {details.description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
