"use client";

import { useMemo, useEffect, useState, startTransition } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  useTheme,
  Skeleton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { FontDetails } from "@/types/market/types";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import logger from "@/utils/logger";
import { loadGoogleFonts } from "@/utils/fontLoadingUtils";

interface FontDetailsSectionProps {
  fontDetails?: FontDetails;
  brandName?: string;
  brandSlogan?: string;
  /**
   * Enable dynamic font loading for fonts not in layout.tsx
   * Default: false (assumes fonts are pre-loaded in layout.tsx)
   */
  enableDynamicLoading?: boolean;
}

/**
 * FontDetailsSection - Display font details with live previews
 *
 * Performance optimizations:
 * - React 19 compiler handles automatic optimization
 * - useMemo only for complex font processing
 * - Theme-aware styling (no hardcoded colors)
 * - Uses Next.js font loading via CSS (no WebFont.load overhead)
 * - Optional dynamic loading with startTransition for non-blocking UI
 *
 * Font Loading Strategies:
 *
 * 1. Static Pre-loading (Recommended - Fastest):
 *    - Add fonts to src/app/layout.tsx using next/font/google
 *    - Automatic optimization, subsetting, and preloading
 *    - Zero runtime overhead
 *    - Best for known fonts used across the app
 *
 * 2. Dynamic Loading (Optional - Flexible):
 *    - Set enableDynamicLoading={true}
 *    - Loads fonts on-demand using CSS Font Loading API
 *    - Non-blocking with startTransition
 *    - Best for user-generated/unknown fonts
 *    - Slower initial render but more flexible
 *
 * Example usage in layout.tsx:
 * ```typescript
 * import { Roboto } from "next/font/google";
 *
 * const roboto = Roboto({
 *   weight: ["400", "500", "700"],
 *   subsets: ["latin"],
 *   variable: "--font-roboto",
 *   display: "swap",
 * });
 * ```
 */
export default function FontDetailsSection({
  fontDetails,
  brandName = "Brand Name",
  brandSlogan = "Brand Slogan",
  enableDynamicLoading = false,
}: FontDetailsSectionProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();
  const [fontsLoading, setFontsLoading] = useState(enableDynamicLoading);

  // Memoize font arrays - expensive array operations
  const { headingFonts, bodyFonts, hasAnyFonts, allFonts } = useMemo(() => {
    const headings = fontDetails?.headings?.fontFamily?.filter(Boolean) || [];
    const body = fontDetails?.body?.fontFamily?.filter(Boolean) || [];
    const all = [...new Set([...headings, ...body])];

    logger.debug("Processing font details", {
      headingFonts: headings,
      bodyFonts: body,
      hasDetails: !!fontDetails,
      enableDynamicLoading,
    });

    return {
      headingFonts: headings,
      bodyFonts: body,
      hasAnyFonts: headings.length > 0 || body.length > 0,
      allFonts: all,
    };
  }, [fontDetails, enableDynamicLoading]);

  // Dynamic font loading (optional)
  useEffect(() => {
    if (!enableDynamicLoading || allFonts.length === 0) {
      setFontsLoading(false);
      return;
    }

    const loadFonts = async () => {
      try {
        const fontsToLoad = allFonts.map((family) => ({
          family,
          options: {
            weight: ["400", "500", "600", "700"],
            display: "swap" as const,
          },
        }));

        await loadGoogleFonts(fontsToLoad);

        // Use startTransition for non-urgent UI update
        startTransition(() => {
          setFontsLoading(false);
        });

        logger.debug("All fonts loaded successfully");
      } catch (error) {
        logger.error("Error loading fonts:", error);
        // Show fonts anyway with fallbacks
        startTransition(() => {
          setFontsLoading(false);
        });
      }
    };

    loadFonts();
  }, [allFonts, enableDynamicLoading]);

  // Early return if no font details
  if (!fontDetails?.headings || !fontDetails?.body) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          No font details available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Section Header - ✅ FIXED: Use theme colors */}
      <Typography
        variant="h6"
        gutterBottom
        color="primary.main"
        sx={{
          mb: 3,
          fontWeight: 600,
          fontFamily: brand.fonts.heading,
          borderBottom: 2,
          borderColor: "primary.main",
          pb: 1,
          display: "inline-block",
        }}
      >
        Font Details
      </Typography>

      {hasAnyFonts ? (
        <Box sx={{ display: "grid", gap: 4 }}>
          {/* Headings Section */}
          {headingFonts.length > 0 && (
            <Accordion
              defaultExpanded={false}
              sx={{
                bgcolor: "background.paper",
                borderRadius: `${brand.borderRadius}px`,
                border: 1,
                borderColor: "divider",
                "&:before": {
                  display: "none", // Remove default MUI divider
                },
                boxShadow: "none",
                "&.Mui-expanded": {
                  borderColor: "primary.main",
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon
                    sx={{
                      color: "primary.main",
                    }}
                  />
                }
                aria-controls="headings-content"
                id="headings-header"
                sx={{
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                  "&.Mui-expanded": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <Typography
                  variant="subtitle1"
                  color="text.primary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Headings:{" "}
                  <Box
                    component="span"
                    sx={{
                      display: "inline",
                      whiteSpace: "pre-wrap",
                      color: "primary.main",
                      fontWeight: 500,
                    }}
                  >
                    {headingFonts.join(", ")}
                  </Box>
                </Typography>
              </AccordionSummary>

              <AccordionDetails
                sx={{
                  bgcolor: "background.default",
                  p: 2,
                }}
              >
                {fontsLoading ? (
                  // Show skeleton while fonts are loading
                  <Box sx={{ display: "grid", gap: 2 }}>
                    {headingFonts.map((_, index) => (
                      <Skeleton
                        key={`heading-skeleton-${index}`}
                        variant="rectangular"
                        height={80}
                        sx={{
                          borderRadius: `${brand.borderRadius}px`,
                          bgcolor: alpha(theme.palette.divider, 0.1),
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ display: "grid", gap: 2 }}>
                    {headingFonts.map((font, index) => (
                      <Box
                        key={`heading-font-${index}-${font}`}
                        sx={{
                          p: 3,
                          bgcolor: "background.paper",
                          borderRadius: `${brand.borderRadius}px`,
                          border: 1,
                          borderColor: "divider",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            boxShadow: theme.shadows[2],
                            borderColor: "primary.main",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        {/* Font Preview - Uses font directly */}
                        <Typography
                          sx={{
                            fontFamily: `"${font}", ${brand.fonts.heading}`,
                            fontSize: "1.5rem",
                            mb: 1,
                            color: "text.primary",
                            fontWeight: 600,
                          }}
                        >
                          {brandName}
                        </Typography>

                        {/* Font Name Label */}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "block",
                            fontFamily: brand.fonts.body,
                            fontSize: "0.75rem",
                          }}
                        >
                          {font}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Body Section */}
          {bodyFonts.length > 0 && (
            <Accordion
              defaultExpanded={false}
              sx={{
                bgcolor: "background.paper",
                borderRadius: `${brand.borderRadius}px`,
                border: 1,
                borderColor: "divider",
                "&:before": {
                  display: "none",
                },
                boxShadow: "none",
                "&.Mui-expanded": {
                  borderColor: "primary.main",
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon
                    sx={{
                      color: "primary.main",
                    }}
                  />
                }
                aria-controls="body-content"
                id="body-header"
                sx={{
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                  "&.Mui-expanded": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <Typography
                  variant="subtitle1"
                  color="text.primary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Body:{" "}
                  <Box
                    component="span"
                    sx={{
                      display: "inline",
                      whiteSpace: "pre-wrap",
                      color: "primary.main",
                      fontWeight: 500,
                    }}
                  >
                    {bodyFonts.join(", ")}
                  </Box>
                </Typography>
              </AccordionSummary>

              <AccordionDetails
                sx={{
                  bgcolor: "background.default",
                  p: 2,
                }}
              >
                {fontsLoading ? (
                  // Show skeleton while fonts are loading
                  <Box sx={{ display: "grid", gap: 2 }}>
                    {bodyFonts.map((_, index) => (
                      <Skeleton
                        key={`body-skeleton-${index}`}
                        variant="rectangular"
                        height={80}
                        sx={{
                          borderRadius: `${brand.borderRadius}px`,
                          bgcolor: alpha(theme.palette.divider, 0.1),
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ display: "grid", gap: 2 }}>
                    {bodyFonts.map((font, index) => (
                      <Box
                        key={`body-font-${index}-${font}`}
                        sx={{
                          p: 3,
                          bgcolor: "background.paper",
                          borderRadius: `${brand.borderRadius}px`,
                          border: 1,
                          borderColor: "divider",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            boxShadow: theme.shadows[2],
                            borderColor: "primary.main",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        {/* Font Preview - Uses font directly */}
                        <Typography
                          sx={{
                            fontFamily: `"${font}", ${brand.fonts.body}`,
                            mb: 1,
                            color: "text.primary",
                            fontSize: "1rem",
                            lineHeight: 1.6,
                          }}
                        >
                          {brandName} - {brandSlogan}
                        </Typography>

                        {/* Font Name Label */}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "block",
                            fontFamily: brand.fonts.body,
                            fontSize: "0.75rem",
                          }}
                        >
                          {font}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          No font families available.
        </Typography>
      )}
    </Box>
  );
}
