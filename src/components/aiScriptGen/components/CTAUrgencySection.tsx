import { useState } from "react";
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
import { Controller, UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";

type UrgencyLevel = "Informational" | "Consideration" | "Urgent Action";

const getUrgencyLevel = (value: number): UrgencyLevel => {
  if (value < 33) return "Informational";
  if (value < 66) return "Consideration";
  return "Urgent Action";
};

const suggestedCTAs: Record<
  UrgencyLevel,
  { primary: string[]; secondary: string[] }
> = {
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

interface CTAUrgencySectionProps {
  form: UseFormReturn<FormValues>;
}

const CTAUrgencySection: React.FC<CTAUrgencySectionProps> = ({ form }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false); // Collapsed by default
  const urgencyValue = form.watch("formatAndCTA.ctaUrgencyCategory");
  let urgency = 50; // Default value

  // Only try to convert to number if it looks like a number
  if (urgencyValue && !isNaN(Number(urgencyValue))) {
    urgency = Number(urgencyValue);
  } else if (urgencyValue === "consideration") {
    urgency = 50; // Map "consideration" to the middle value
  } else if (
    urgencyValue === "Informational" ||
    urgencyValue === "information"
  ) {
    urgency = 20; // Map to a lower value
  } else if (urgencyValue === "Urgent Action" || urgencyValue === "urgent") {
    urgency = 80; // Map to a higher value
  }

  const customCTA = form.watch("formatAndCTA.customCTA") || "";
  const primaryCTAs = form.watch("formatAndCTA.ctaPrimary") || [];
  const secondaryCTAs = form.watch("formatAndCTA.ctaSecondary") || [];

  // Ensure we're always working with arrays for selected CTAs
  const selectedPrimary = Array.isArray(primaryCTAs)
    ? primaryCTAs
    : primaryCTAs
    ? [primaryCTAs]
    : [];
  const selectedSecondary = Array.isArray(secondaryCTAs)
    ? secondaryCTAs
    : secondaryCTAs
    ? [secondaryCTAs]
    : [];

  const urgencyLabel = getUrgencyLevel(urgency);

  // Toggle CTA selection without affecting custom CTAs
  const handleCtaSelect = (cta: string, level: "primary" | "secondary") => {
    if (level === "primary") {
      // Get current primary CTAs safely
      const currentValue = form.watch("formatAndCTA.ctaPrimary");
      const current: string[] = Array.isArray(currentValue)
        ? [...currentValue]
        : typeof currentValue === "string" && currentValue !== ""
        ? [currentValue]
        : [];

      // Toggle selection
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
      // Get current secondary CTAs safely
      const currentValue = form.watch("formatAndCTA.ctaSecondary");
      const current: string[] = Array.isArray(currentValue)
        ? [...currentValue]
        : typeof currentValue === "string" && currentValue !== ""
        ? [currentValue]
        : [];

      // Toggle selection
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
  };

  // Handle custom CTA input without clearing primary/secondary
  const handleCustomCtaChange = (value: string) => {
    form.setValue("formatAndCTA.customCTA", value || null, {
      shouldDirty: true,
    });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Call to Action (CTA)
      </Typography>
      <Box
        sx={{
          backgroundColor: "background.paper",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          onClick={() => setExpanded((prev) => !prev)}
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
            <Typography variant="body2">CTA Urgency</Typography>
            <Chip
              label={urgencyLabel}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.secondary.main, 0.2),
                color: "secondary.main",
                fontSize: "0.8rem",
                height: 20,
                fontWeight: 500,
              }}
            />
          </Box>
          <IconButton size="small">
            <ChevronDown
              size={18}
              style={{
                transition: "transform 0.2s ease",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </IconButton>
        </Box>
        <Collapse in={expanded}>
          <Box sx={{ px: 2, pb: 2 }}>
            {/* Urgency scale */}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="caption">Informational</Typography>
              <Typography variant="caption">Urgent Action</Typography>
            </Box>
            <Slider
              value={urgency}
              onChange={(_, newValue: number) =>
                form.setValue(
                  "formatAndCTA.ctaUrgencyCategory",
                  newValue.toString(),
                  { shouldDirty: true }
                )
              }
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
                color: "secondary.main",
                height: 8,
                "& .MuiSlider-track": { border: "none", height: 8 },
                "& .MuiSlider-rail": {
                  height: 8,
                  opacity: 0.5,
                  backgroundColor: "#333333",
                },
                "& .MuiSlider-thumb": {
                  height: 18,
                  width: 18,
                  border: "2px solid white",
                  backgroundColor: "secondary.main",
                  "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
                    boxShadow: "inherit",
                  },
                },
                "& .MuiSlider-mark": {
                  backgroundColor: "secondary.main",
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
                bgcolor: theme.palette.background.default,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                p: 2,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", mb: 1, display: "block" }}
              >
                Suggested CTAs - {urgencyLabel}
              </Typography>

              {(["primary", "secondary"] as const).map((level) => (
                <Box key={level} sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      mb: 1,
                      display: "block",
                      color: "text.secondary",
                      textAlign: "center",
                    }}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {suggestedCTAs[urgencyLabel][level].map((cta) => {
                      const isSelected =
                        level === "primary"
                          ? selectedPrimary.includes(cta)
                          : selectedSecondary.includes(cta);

                      return (
                        <Button
                          key={cta}
                          size="small"
                          variant={isSelected ? "contained" : "contained"}
                          onClick={() => handleCtaSelect(cta, level)}
                          sx={{
                            fontSize: "0.8rem",
                            py: 0.5,
                            px: 1.5,
                            textTransform: "none",
                            backgroundColor: theme.palette.background.paper,
                            color: theme.palette.primary.main,
                            ...(isSelected && {
                              backgroundColor: (theme) =>
                                theme.palette.mode === "light"
                                  ? alpha(theme.palette.secondary.main, 0.2)
                                  : alpha(theme.palette.secondary.main, 0.3),
                              color: (theme) => theme.palette.secondary.main,
                            }),
                            "&:hover": {
                              backgroundColor: (theme) =>
                                isSelected
                                  ? theme.palette.mode === "light"
                                    ? alpha(theme.palette.secondary.main, 0.3)
                                    : alpha(theme.palette.secondary.main, 0.4)
                                  : alpha(theme.palette.primary.main, 0.1),
                              color: (theme) =>
                                isSelected
                                  ? theme.palette.secondary.main
                                  : theme.palette.primary.main,
                            },
                          }}
                        >
                          {cta}
                        </Button>
                      );
                    })}
                  </Box>

                  {/* Display selected CTAs as chips */}
                  {(level === "primary" ? selectedPrimary : selectedSecondary)
                    .length > 0 && (
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                      }}
                    >
                      {(level === "primary"
                        ? selectedPrimary
                        : selectedSecondary
                      ).map((cta) => (
                        <Chip
                          key={cta}
                          label={cta}
                          size="small"
                          onDelete={() => {
                            const current =
                              level === "primary"
                                ? selectedPrimary
                                : selectedSecondary;
                            form.setValue(
                              level === "primary"
                                ? "formatAndCTA.ctaPrimary"
                                : "formatAndCTA.ctaSecondary",
                              current.filter((item) => item !== cta),
                              { shouldDirty: true }
                            );
                          }}
                          sx={{
                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                            color: "secondary.main",
                            fontSize: "0.7rem",
                            height: "24px",
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
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
                bgcolor: "background.default",
              },
            }}
          />
        )}
      />

      {/* Display custom CTA as chip if entered */}
      {customCTA && (
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block" }}
          >
            Custom CTA
          </Typography>
          <Chip
            label={customCTA}
            size="small"
            onDelete={() =>
              form.setValue("formatAndCTA.customCTA", null, {
                shouldDirty: true,
              })
            }
            sx={{
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              color: "secondary.main",
              fontSize: "0.75rem",
              height: "24px",
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default CTAUrgencySection;
