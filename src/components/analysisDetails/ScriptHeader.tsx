"use client";

import { Typography, Stack, Chip, Box, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { BackButton } from "@/components/storyMain/BackButton";
import type { ScriptDetails } from "@/types";

/**
 * ScriptHeader - Displays script title, description, and version information
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - Uses theme transitions for smooth interactions
 * - No hardcoded colors or spacing
 *
 * @param details - Script details including title, description, and version
 */

interface ScriptHeaderProps {
  details: ScriptDetails;
}

export default function ScriptHeader({ details }: ScriptHeaderProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
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
        }}
      />

      <Divider
        orientation="vertical"
        flexItem
        sx={{
          borderRightWidth: 2,
          borderColor: "primary.main",
          height: "140px",
        }}
      />

      <Box>
        <Typography
          variant="h1"
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: "normal",
            fontStyle: "normal",
            textTransform: "uppercase",
            color: "text.primary",
          }}
        >
          {details.title}
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{
            mt: 1,
            color: "text.secondary",
            fontStyle: "italic",
            fontFamily: brand.fonts.body,
          }}
        >
          {details.description}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          sx={{ mb: 2, mt: 2 }}
        >
          <Chip
            label={`Version ${details.version.versionNumber}`}
            variant="outlined"
            sx={{
              textTransform: "none",
              borderColor: "primary.main",
              color: "primary.main",
              fontFamily: brand.fonts.body,
              borderRadius: `${brand.borderRadius}px`,
              transition: theme.transitions.create(
                ["background-color", "border-color"],
                { duration: theme.transitions.duration.shorter }
              ),
              "&:hover": {
                bgcolor: "action.hover",
                borderColor: "primary.dark",
              },
            }}
          />
        </Stack>
      </Box>
    </Box>
  );
}
