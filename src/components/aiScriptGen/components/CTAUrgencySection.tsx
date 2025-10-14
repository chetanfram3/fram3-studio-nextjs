// src/components/aiScriptGen/components/CTAUrgencySection.tsx
"use client";

import { useState, useMemo, useCallback, JSX } from "react";
import {
  Box,
  Typography,
  Chip,
  Slider,
  Collapse,
  Button,
  TextField,
  IconButton,
  alpha,
  useTheme,
} from "@mui/material";
import { ChevronDown } from "lucide-react";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { FormValues } from "../types";
import { getCurrentBrand } from "@/config/brandConfig";

type UrgencyLevel = "Informational" | "Consideration" | "Urgent Action";

type CTALevel = "primary" | "secondary";

interface SuggestedCTAs {
  primary: string[];
  secondary: string[];
}

interface CTAUrgencySectionProps {
  form: UseFormReturn<FormValues>;
}

const getUrgencyLevel = (value: number): UrgencyLevel => {
  if (value < 33) return "Informational";
  if (value < 66) return "Consideration";
  return "Urgent Action";
};

const suggestedCTAs: Record<UrgencyLevel, SuggestedCTAs> = {
  Informational: {
    primary: ["Learn More", "Explore", "Discover"],
    secondary: ["View Details", "Read More"],
  },
  Consideration: {
    primary: ["Get Started", "Sign Up", "Try Free"],
    secondary: ["Request Demo", "Contact Us"],
  },
  "Urgent Action": {
    primary: ["Buy Now", "Act Now", "Limited Offer"],
    secondary: ["Limited Time", "Don't Miss Out"],
  },
};

const CTAUrgencySection = ({ form }: CTAUrgencySectionProps): JSX.Element => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [expanded, setExpanded] = useState(false);

  // Watch form values
  const urgencyValue = form.watch("formatAndCTA.ctaUrgencyCategory");
  const customCTA = form.watch("formatAndCTA.customCTA") || "";
  const primaryCTAs = form.watch("formatAndCTA.ctaPrimary") || [];
  const secondaryCTAs = form.watch("formatAndCTA.ctaSecondary") || [];

  // Compute urgency level with proper type conversion
  const urgency = useMemo((): number => {
    if (urgencyValue && !isNaN(Number(urgencyValue))) {
      return Number(urgencyValue);
    }
    if (urgencyValue === "consideration") return 50;
    if (urgencyValue === "Informational" || urgencyValue === "information") {
      return 20;
    }
    if (urgencyValue === "Urgent Action" || urgencyValue === "urgent") {
      return 80;
    }
    return 50; // Default
  }, [urgencyValue]);

  // Ensure arrays for selected CTAs
  const selectedPrimary = useMemo((): string[] => {
    return Array.isArray(primaryCTAs)
      ? primaryCTAs
      : primaryCTAs
        ? [primaryCTAs]
        : [];
  }, [primaryCTAs]);

  const selectedSecondary = useMemo((): string[] => {
    return Array.isArray(secondaryCTAs)
      ? secondaryCTAs
      : secondaryCTAs
        ? [secondaryCTAs]
        : [];
  }, [secondaryCTAs]);

  const urgencyLabel = useMemo(
    (): UrgencyLevel => getUrgencyLevel(urgency),
    [urgency]
  );

  const toggleExpanded = useCallback((): void => {
    setExpanded((prev) => !prev);
  }, []);

  // Handle CTA selection/deselection
  const handleCtaSelect = useCallback(
    (cta: string, level: CTALevel): void => {
      if (level === "primary") {
        const currentValue = form.watch("formatAndCTA.ctaPrimary");
        const current: string[] = Array.isArray(currentValue)
          ? [...currentValue]
          : typeof currentValue === "string" && currentValue !== ""
            ? [currentValue]
            : [];

        if (current.includes(cta)) {
          form.setValue(
            "formatAndCTA.ctaPrimary",
            current.filter((item) => item !== cta),
            { shouldDirty: true }
          );
        } else {
          form.setValue("formatAndCTA.ctaPrimary", [...current, cta], {
            shouldDirty: true,
          });
        }
      } else {
        const currentValue = form.watch("formatAndCTA.ctaSecondary");
        const current: string[] = Array.isArray(currentValue)
          ? [...currentValue]
          : typeof currentValue === "string" && currentValue !== ""
            ? [currentValue]
            : [];

        if (current.includes(cta)) {
          form.setValue(
            "formatAndCTA.ctaSecondary",
            current.filter((item) => item !== cta),
            { shouldDirty: true }
          );
        } else {
          form.setValue("formatAndCTA.ctaSecondary", [...current, cta], {
            shouldDirty: true,
          });
        }
      }
    },
    [form]
  );

  const handleCustomCtaChange = useCallback(
    (value: string): void => {
      form.setValue("formatAndCTA.customCTA", value || null, {
        shouldDirty: true,
      });
    },
    [form]
  );

  const handleUrgencyChange = useCallback(
    (_: Event, newValue: number | number[]): void => {
      const value = Array.isArray(newValue) ? newValue[0] : newValue;
      form.setValue("formatAndCTA.ctaUrgencyCategory", value.toString(), {
        shouldDirty: true,
      });
    },
    [form]
  );

  const handleDeleteSelectedCTA = useCallback(
    (cta: string, level: CTALevel): void => {
      const current = level === "primary" ? selectedPrimary : selectedSecondary;
      form.setValue(
        level === "primary"
          ? "formatAndCTA.ctaPrimary"
          : "formatAndCTA.ctaSecondary",
        current.filter((item) => item !== cta),
        { shouldDirty: true }
      );
    },
    [form, selectedPrimary, selectedSecondary]
  );

  const handleDeleteCustomCTA = useCallback((): void => {
    form.setValue("formatAndCTA.customCTA", null, {
      shouldDirty: true,
    });
  }, [form]);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle2"
        sx={{
          mb: 2,
          fontFamily: brand.fonts.heading,
        }}
      >
        Call to Action (CTA)
      </Typography>
      <Box
        sx={{
          backgroundColor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Header */}
        <Box
          onClick={toggleExpanded}
          sx={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: 1,
            borderBottomColor: "divider",
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ fontFamily: brand.fonts.body }}>
              CTA Urgency
            </Typography>
            <Chip
              label={urgencyLabel}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                color: "primary.main",
                fontSize: "0.8rem",
                height: 20,
                fontWeight: 500,
                fontFamily: brand.fonts.body,
              }}
            />
          </Box>
          <IconButton size="small" color="primary">
            <ChevronDown
              size={18}
              style={{
                transition: "transform 0.2s ease",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </IconButton>
        </Box>

        {/* Collapsible Content */}
        <Collapse in={expanded}>
          <Box sx={{ px: 2, pb: 2 }}>
            {/* Urgency Scale Labels */}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography
                variant="caption"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Informational
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Urgent Action
              </Typography>
            </Box>

            {/* Urgency Slider */}
            <Slider
              value={urgency}
              onChange={handleUrgencyChange}
              min={0}
              max={100}
              step={1}
              marks={[
                { value: 0 },
                { value: 33 },
                { value: 66 },
                { value: 100 },
              ]}
              sx={{
                color: "primary.main",
                height: 8,
                "& .MuiSlider-track": { border: "none", height: 8 },
                "& .MuiSlider-rail": {
                  height: 8,
                  opacity: 0.5,
                  backgroundColor: theme.palette.divider,
                },
                "& .MuiSlider-thumb": {
                  height: 18,
                  width: 18,
                  border: "2px solid #FFFFFF",
                  backgroundColor: "primary.main",
                  "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
                    boxShadow: "inherit",
                  },
                },
                "& .MuiSlider-mark": {
                  backgroundColor: "primary.main",
                  height: 8,
                  width: 8,
                  borderRadius: "50%",
                  marginTop: 0,
                },
              }}
            />

            {/* Suggested CTAs */}
            <Box
              sx={{
                bgcolor: "background.default",
                borderRadius: `${brand.borderRadius}px`,
                border: "1px solid",
                borderColor: "divider",
                p: 2,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  mb: 1,
                  display: "block",
                  fontFamily: brand.fonts.body,
                }}
              >
                Suggested CTAs - {urgencyLabel}
              </Typography>

              {(["primary", "secondary"] as const).map((level) => {
                const currentSelected =
                  level === "primary" ? selectedPrimary : selectedSecondary;

                return (
                  <Box key={level} sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        mb: 1,
                        display: "block",
                        color: "text.secondary",
                        textAlign: "center",
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Typography>

                    {/* CTA Buttons */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {suggestedCTAs[urgencyLabel][level].map((cta) => {
                        const isSelected = currentSelected.includes(cta);

                        return (
                          <Button
                            key={cta}
                            size="small"
                            variant="contained"
                            onClick={() => handleCtaSelect(cta, level)}
                            sx={{
                              fontSize: "0.8rem",
                              py: 0.5,
                              px: 1.5,
                              textTransform: "none",
                              fontFamily: brand.fonts.body,
                              borderWidth: 1,
                              borderStyle: "solid",
                              bgcolor: isSelected
                                ? alpha(theme.palette.primary.main, 0.2)
                                : "background.paper",
                              borderColor: isSelected
                                ? alpha(theme.palette.primary.dark, 0.3)
                                : "divider",
                              color: isSelected
                                ? "primary.main"
                                : "text.primary",
                              "&:hover": {
                                bgcolor: isSelected
                                  ? "primary.main"
                                  : alpha(theme.palette.primary.main, 0.1),
                                color: isSelected
                                  ? "primary.contrastText"
                                  : "primary.main",
                              },
                            }}
                          >
                            {cta}
                          </Button>
                        );
                      })}
                    </Box>

                    {/* Selected CTAs as Chips */}
                    {currentSelected.length > 0 && (
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                        }}
                      >
                        {currentSelected.map((cta) => (
                          <Chip
                            key={cta}
                            label={cta}
                            size="small"
                            onDelete={() => handleDeleteSelectedCTA(cta, level)}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: "primary.main",
                              fontSize: "0.7rem",
                              height: "24px",
                              fontFamily: brand.fonts.body,
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* Custom CTA Input */}
      <Controller
        name="formatAndCTA.customCTA"
        control={form.control}
        render={({ field }) => (
          <TextField
            {...field}
            value={field.value === null ? "" : field.value}
            fullWidth
            placeholder="Custom CTA (e.g., Buy Now, Visit Website)"
            size="small"
            onChange={(e) => handleCustomCtaChange(e.target.value)}
            sx={{
              mt: 2,
              "& .MuiOutlinedInput-root": {
                color: "text.primary",
                bgcolor: "background.paper",
                fontFamily: brand.fonts.body,
              },
            }}
          />
        )}
      />

      {/* Display Custom CTA as Chip */}
      {customCTA && (
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              display: "block",
              fontFamily: brand.fonts.body,
            }}
          >
            Custom CTA
          </Typography>
          <Chip
            label={customCTA}
            size="small"
            onDelete={handleDeleteCustomCTA}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
              fontSize: "0.75rem",
              height: "24px",
              fontFamily: brand.fonts.body,
            }}
          />
        </Box>
      )}
    </Box>
  );
};

CTAUrgencySection.displayName = "CTAUrgencySection";

export default CTAUrgencySection;
