"use client";

import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { SvgIconComponent } from "@mui/icons-material";

interface ShotParameterProps {
  icon: SvgIconComponent;
  label?: string;
  value?: string | null;
  compact?: boolean;
}

export function ShotParameter({
  icon: Icon,
  label = "Parameter",
  value = "Not specified",
  compact = false,
}: ShotParameterProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: compact ? 0.75 : 1,
        minHeight: compact ? 36 : 48,
      }}
    >
      <Icon
        color="primary"
        sx={{
          mt: 0.5,
          fontSize: compact ? 16 : 20,
        }}
      />
      <Box>
        <Typography
          variant={compact ? "caption" : "subtitle2"}
          color="text.secondary"
          gutterBottom
          sx={{
            fontSize: compact ? "0.6875rem" : undefined,
            lineHeight: compact ? 1.2 : undefined,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant={compact ? "body2" : "body1"}
          color={value === "Not specified" ? "text.secondary" : "text.primary"}
          sx={{
            fontSize: compact ? "0.75rem" : undefined,
            lineHeight: compact ? 1.3 : undefined,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

ShotParameter.displayName = "ShotParameter";
