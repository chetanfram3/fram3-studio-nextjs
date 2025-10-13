"use client";

import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useMemo, useCallback } from "react";

interface GroundingMetadataProps {
  groundingMetadata?: {
    webSearchQueries?: string[];
    searchEntryPoint?: {
      renderedContent?: string;
    };
    retrievalMetadata?: Record<string, unknown>;
  };
}

interface Section {
  key: string;
  title: string;
  content: string[] | string | Record<string, unknown> | undefined;
  impact: "High" | "Medium" | "Low";
  type: "queries" | "html" | "json";
}

export function GroundingMetadata({
  groundingMetadata,
}: GroundingMetadataProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Memoize sections to avoid recalculation on every render
  const sections = useMemo(() => {
    if (!groundingMetadata) return [];

    const { webSearchQueries, searchEntryPoint, retrievalMetadata } =
      groundingMetadata;

    const allSections: Section[] = [
      {
        key: "webSearchQueries",
        title: "Fram3 Queries",
        content: webSearchQueries,
        impact: "High",
        type: "queries",
      },
      {
        key: "searchEntryPoint",
        title: "Entry Point",
        content: searchEntryPoint?.renderedContent,
        impact: "Medium",
        type: "html",
      },
      {
        key: "retrievalMetadata",
        title: "Retrieval Metadata",
        content: retrievalMetadata,
        impact: "Low",
        type: "json",
      },
    ];

    return allSections.filter(
      (section) =>
        section.content &&
        (Array.isArray(section.content) ? section.content.length > 0 : true)
    );
  }, [groundingMetadata]);

  // Memoize click handler for HTML content
  const handleHtmlClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "A" || target.closest("a")) {
      e.preventDefault();
      const link =
        target.tagName === "A"
          ? (target as HTMLAnchorElement)
          : (target.closest("a") as HTMLAnchorElement);
      if (link?.href) {
        window.open(link.href, "_blank", "noopener,noreferrer");
      }
    }
  }, []);

  const renderContent = useCallback(
    (
      content: string[] | string | Record<string, unknown> | undefined,
      type: string
    ) => {
      switch (type) {
        case "queries":
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {(content as string[]).map((query, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1,
                    bgcolor: "action.hover",
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                  }}
                >
                  <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {query}
                  </Typography>
                </Box>
              ))}
            </Box>
          );
        case "html":
          return (
            <Box
              sx={{
                p: 2,
                borderRadius: `${brand.borderRadius * 0.5}px`,
                border: 1,
                borderColor: "divider",
                maxHeight: 300,
                overflow: "auto",
              }}
            >
              <Box
                dangerouslySetInnerHTML={{ __html: content as string }}
                onClick={handleHtmlClick}
                sx={{
                  "& .container": {
                    fontSize: "12px !important",
                    backgroundColor: theme.palette.background.default,
                  },
                  "& .chip": {
                    fontSize: "11px !important",
                    padding: "2px 8px !important",
                    margin: "0 4px !important",
                    cursor: "pointer !important",
                    whiteSpace: "normal !important",
                    wordWrap: "break-word !important",
                    wordBreak: "break-word !important",
                    maxWidth: "200px !important",
                    display: "inline-block !important",
                    backgroundColor: `${theme.palette.primary.main} !important`,
                    color: `${theme.palette.primary.contrastText} !important`,
                    borderColor: `${theme.palette.primary.dark} !important`,
                    "&:hover": {
                      backgroundColor: `${theme.palette.primary.dark} !important`,
                    },
                  },
                  "& .carousel": {
                    whiteSpace: "normal !important",
                    display: "flex !important",
                    flexWrap: "wrap !important",
                    gap: "8px !important",
                  },
                  "& a": {
                    cursor: "pointer !important",
                    whiteSpace: "normal !important",
                    wordWrap: "break-word !important",
                    wordBreak: "break-word !important",
                  },
                }}
              />
            </Box>
          );
        case "json":
          return (
            <Box
              sx={{
                p: 2,
                bgcolor: "action.hover",
                borderRadius: `${brand.borderRadius * 0.5}px`,
                border: 1,
                borderColor: "divider",
              }}
            >
              <Typography
                component="pre"
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "12px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {JSON.stringify(content, null, 2)}
              </Typography>
            </Box>
          );
        default:
          return (
            <Typography variant="body2" color="text.secondary">
              {String(content)}
            </Typography>
          );
      }
    },
    [theme.palette, brand.borderRadius, handleHtmlClick]
  );

  if (!groundingMetadata || sections.length === 0) {
    return null;
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
        Metadata
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Information about the sources and queries used for this analysis
      </Typography>

      {sections.map(({ key, title, content, impact, type }) => (
        <Accordion
          key={`grounding-${key}`}
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
              <Typography sx={{ fontWeight: "medium", color: "text.primary" }}>
                {title}
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
              {type === "queries" && Array.isArray(content) && (
                <Chip
                  label={`${content.length} queries`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: "11px",
                    borderColor: "text.secondary",
                    color: "text.secondary",
                  }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>{renderContent(content, type)}</AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

GroundingMetadata.displayName = "GroundingMetadata";
