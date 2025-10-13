"use client";

import {
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useMemo } from "react";
import type { ScriptRating as ScriptRatingType } from "@/types/market/types";

interface ScriptRatingSectionProps {
  scriptRating?: ScriptRatingType;
}

export function ScriptRating({ scriptRating }: ScriptRatingSectionProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Memoize derived arrays
  const { strengths, areasForImprovement } = useMemo(() => {
    return {
      strengths: scriptRating?.strengths || [],
      areasForImprovement: scriptRating?.areasForImprovement || [],
    };
  }, [scriptRating]);

  if (!scriptRating) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.primary">
          No script rating data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      id="script-rating"
      sx={{
        p: 3,
        borderRadius: `${brand.borderRadius}px`,
        bgcolor: "background.default",
        border: 1,
        borderColor: "divider",
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        color="primary.main"
        fontWeight="bold"
        sx={{ fontFamily: brand.fonts.heading }}
      >
        Script Rating
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Chip
          label={scriptRating.recommendation || "No recommendation"}
          color="primary"
          variant="outlined"
          sx={{
            fontSize: "1rem",
            fontWeight: "medium",
            fontFamily: brand.fonts.body,
            px: 2,
            py: 2.5,
            borderColor: "primary.main",
            color: "primary.main",
          }}
        />
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            fontFamily: brand.fonts.heading,
            color: "text.primary",
          }}
        >
          {scriptRating.finalScore ?? 0}/100
        </Typography>
      </Box>

      {scriptRating.explanation && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="subtitle1"
            gutterBottom
            color="text.primary"
            sx={{ fontWeight: "medium" }}
          >
            Explanation
          </Typography>
          <Typography color="text.secondary">
            {scriptRating.explanation}
          </Typography>
        </Box>
      )}

      {strengths.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="subtitle1"
            gutterBottom
            color="text.primary"
            sx={{ fontWeight: "medium" }}
          >
            Strengths
          </Typography>
          <List disablePadding>
            {strengths.map((strength, index) => (
              <ListItem key={`strength-${index}`} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleIcon sx={{ color: "primary.main" }} />
                </ListItemIcon>
                <ListItemText
                  primary={strength || "No details provided"}
                  primaryTypographyProps={{
                    color: "text.secondary",
                    variant: "body2",
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {areasForImprovement.length > 0 && (
        <Box>
          <Typography
            variant="subtitle1"
            gutterBottom
            color="text.primary"
            sx={{ fontWeight: "medium" }}
          >
            Areas for Improvement
          </Typography>
          <List disablePadding>
            {areasForImprovement.map((area, index) => (
              <ListItem key={`improvement-${index}`} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <WarningIcon sx={{ color: "error.main" }} />
                </ListItemIcon>
                <ListItemText
                  primary={area || "No details provided"}
                  primaryTypographyProps={{
                    color: "text.secondary",
                    variant: "body2",
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}

ScriptRating.displayName = "ScriptRating";
