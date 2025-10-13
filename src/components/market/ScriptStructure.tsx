"use client";

import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useMemo, useCallback } from "react";
import type { ScriptStructure as ScriptStructureType } from "@/types/market/types";

interface ScriptStructureSectionProps {
  structure?: ScriptStructureType;
}

interface Section {
  key: string;
  content: string;
  impact: "High" | "Medium" | "Low";
}

export function ScriptStructure({ structure }: ScriptStructureSectionProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Memoize section formatting function
  const formatSectionTitle = useCallback((key: string): string => {
    return key.replace(/([A-Z])/g, " $1").trim();
  }, []);

  // Memoize sections array
  const sections = useMemo(() => {
    if (!structure?.tvcStructure) return [];

    const allSections: Section[] = [
      {
        key: "hook",
        content: structure.tvcStructure.hook,
        impact: "High",
      },
      {
        key: "body",
        content: structure.tvcStructure.body,
        impact: "Medium",
      },
      {
        key: "callToAction",
        content: structure.tvcStructure.callToAction,
        impact: "High",
      },
    ];

    return allSections.filter((section) => section.content);
  }, [structure]);

  if (!structure?.tvcStructure) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.primary">
          No script structure data available
        </Typography>
      </Box>
    );
  }

  if (sections.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.primary">
          No script sections available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
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
        color="text.primary"
        sx={{ fontFamily: brand.fonts.heading }}
      >
        Script Structure
      </Typography>

      {sections.map(({ key, content, impact }) => (
        <Accordion
          key={`section-${key}`}
          sx={{
            "&:before": { display: "none" },
            bgcolor: "background.default",
            boxShadow: "none",
            border: 1,
            borderColor: "divider",
            borderRadius: `${brand.borderRadius * 0.5}px`,
            mb: 1,
            "&:last-child": { mb: 0 },
            "&.Mui-expanded": {
              margin: "0 0 8px 0",
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}
            sx={{
              "&.Mui-expanded": {
                minHeight: 48,
                borderBottom: 1,
                borderColor: "divider",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography
                sx={{
                  textTransform: "capitalize",
                  fontWeight: "medium",
                  color: "text.primary",
                }}
              >
                {formatSectionTitle(key)}
              </Typography>
              <Chip
                label={`${impact} Impact`}
                color={impact === "High" ? "primary" : "default"}
                size="small"
                variant={impact === "High" ? "filled" : "outlined"}
                sx={{
                  ...(impact === "High" && {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                  }),
                  ...(impact === "Medium" && {
                    borderColor: "primary.main",
                    color: "primary.main",
                  }),
                }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
              {content || "No content available"}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

ScriptStructure.displayName = "ScriptStructure";
