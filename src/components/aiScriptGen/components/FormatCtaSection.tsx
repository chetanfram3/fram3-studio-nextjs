// src/modules/scripts/components/FormatCtaSection.tsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Collapse,
  Button,
  FormControl,
  Select,
  MenuItem,
  Slider,
  useTheme,
  Chip,
  IconButton,
  Paper,
  Stack,
  alpha,
} from "@mui/material";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Controller, UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";
import CTAUrgencySection from "./CTAUrgencySection";

interface FormatCtaSectionProps {
  form: UseFormReturn<FormValues>;
}

const FormatCtaSection: React.FC<FormatCtaSectionProps> = ({ form }) => {
  const theme = useTheme();
  const [scriptOptionsExpanded, setScriptOptionsExpanded] = useState(true);

  // Script format options
  const scriptFormatOptions = [
    { value: "two-column", label: "Two-Column A/V" },
    { value: "screenplay", label: "Screenplay" },
    { value: "narrative", label: "Narrative" },
    { value: "storyboard", label: "Storyboard Text" },
  ];

  // Aspect ratio options
  const aspectRatioOptions = [
    { value: "16:9", label: "Widescreen" },
    { value: "9:16", label: "Vertical" },
    { value: "4:3", label: "Standard" },
    { value: "1:1", label: "Square" },
    { value: "21:9", label: "Ultrawide" },
  ];

  const scriptTypeOptions = [
    { value: "commercial", label: "Commercial" },
    { value: "trailer", label: "Trailer" },
    { value: "teaser", label: "Teaser" },
    { value: "promo", label: "Promotional Video" },
    { value: "social", label: "Social Media" },
    { value: "corporate", label: "Corporate Video" },
    { value: "explainer", label: "Explainer Video" },
    { value: "documentary", label: "Documentary" },
  ];

  // Get current values
  const scriptType = form.watch("formatAndCTA.scriptType") || "commercial";
  const scriptFormat = form.watch("formatAndCTA.scriptFormat") || "two-column";
  const aspectRatio = form.watch("formatAndCTA.aspectRatio") || "16:9";
  const duration = form.watch("desiredDuration") || 30;

  return (
    <Box sx={{ mb: 4 }}>
      {/* Script Options Section */}
      <Paper
        sx={{
          mb: 3,
          bgcolor: "background.default",
          border: 1,
          borderColor: "divider",
          overflow: "hidden",
          borderRadius: 1,
        }}
      >
        {/* Script Options Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => setScriptOptionsExpanded(!scriptOptionsExpanded)}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle2" fontWeight="medium">
              Script Options
            </Typography>
            <Chip
              size="small"
              label={`${scriptType} / ${scriptFormat}`}
              sx={{
                bgcolor: alpha(theme.palette.secondary.main, 0.2),
                color: "secondary.main",
                fontSize: "0.8rem",
                height: "20px",
                fontWeight: 500,
              }}
            />
          </Box>
          <IconButton size="small">
            {scriptOptionsExpanded ? (
              <ChevronUp size={18} color={theme.palette.text.primary} />
            ) : (
              <ChevronDown size={18} color={theme.palette.text.primary} />
            )}
          </IconButton>
        </Box>

        <Collapse in={scriptOptionsExpanded}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1, textAlign: "center" }}
              >
                Script Type
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)", // 4 columns
                  gap: 0.5, // theme spacing
                  width: "100%",
                }}
              >
                {scriptTypeOptions.map((option) => (
                  <Button
                    key={option.value}
                    fullWidth
                    variant={
                      scriptType === option.value ? "contained" : "outlined"
                    }
                    onClick={() =>
                      form.setValue("formatAndCTA.scriptType", option.value)
                    }
                    sx={{
                      borderWidth: 1,
                      borderStyle: "solid",
                      bgcolor:
                        scriptType === option.value
                          ? alpha(theme.palette.secondary.main, 0.2)
                          : "transparent",
                      borderColor:
                        scriptType === option.value
                          ? alpha(theme.palette.secondary.dark, 0.3)
                          : "divider",
                      color:
                        scriptType === option.value
                          ? "secondary.main"
                          : "text.primary",
                      "&:hover": {
                        bgcolor:
                          scriptType === option.value
                            ? "secondary.main"
                            : "action.hover",
                        color:
                          scriptType === option.value
                            ? "secondary.contrastText"
                            : "primary.main",
                      },
                      px: 1.5,
                      py: 0.75,
                      textTransform: "none",
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* Script Format */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1, textAlign: "center" }}
              >
                Script Format
              </Typography>
              <Controller
                name="formatAndCTA.scriptFormat"
                control={form.control}
                render={({ field }) => (
                  <FormControl
                    fullWidth
                    size="small"
                    sx={{ bgcolor: "background.default" }}
                  >
                    <Select
                      {...field}
                      displayEmpty
                      sx={{
                        "& .MuiSelect-select": {
                          py: 1.5,
                        },
                      }}
                      renderValue={(value) =>
                        value
                          ? scriptFormatOptions.find(
                              (option) => option.value === value
                            )?.label || value
                          : "-- Select Script Format --"
                      }
                      IconComponent={(props) => (
                        <ChevronDown
                          {...props}
                          size={18}
                          color={theme.palette.secondary.dark}
                        />
                      )}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: "background.default", // Background of the full menu
                            "& .MuiMenuItem-root": {
                              justifyContent: "center", // Center menu items
                            },
                            "& .Mui-selected": {
                              color: "secondary.main", // Text color for selected item
                              bgcolor: (theme) =>
                                alpha(theme.palette.secondary.main, 0.2), // Background color for selected item
                            },
                          },
                        },
                      }}
                    >
                      {scriptFormatOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Box>

            {/* Aspect Ratio - Single row with labels below */}
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1, textAlign: "center" }}
              >
                Aspect Ratio
              </Typography>
              {/* Aspect Ratio Buttons */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${aspectRatioOptions.length}, 1fr)`,
                  gap: 0.5,
                  width: "100%",
                }}
              >
                {aspectRatioOptions.map((option) => (
                  <Button
                    key={option.value}
                    fullWidth
                    variant={
                      aspectRatio === option.value ? "contained" : "outlined"
                    }
                    onClick={() =>
                      form.setValue("formatAndCTA.aspectRatio", option.value)
                    }
                    sx={{
                      borderWidth: 1,
                      borderStyle: "solid",
                      bgcolor:
                        aspectRatio === option.value
                          ? alpha(theme.palette.secondary.main, 0.2)
                          : "transparent",
                      borderColor:
                        aspectRatio === option.value
                          ? alpha(theme.palette.secondary.dark, 0.3)
                          : "divider",
                      color:
                        aspectRatio === option.value
                          ? "secondary.main"
                          : "text.primary",
                      "&:hover": {
                        bgcolor:
                          aspectRatio === option.value
                            ? "secondary.dark"
                            : "action.hover",
                        color:
                          aspectRatio === option.value
                            ? "secondary.contrastText"
                            : "primary.main",
                      },
                      px: 1.5,
                      py: 0.75,
                      textTransform: "none",
                    }}
                  >
                    {option.value}
                  </Button>
                ))}
              </Box>

              {/* Aspect Ratio Labels */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${aspectRatioOptions.length}, 1fr)`,
                  gap: 1,
                  mt: 0.5,
                }}
              >
                {aspectRatioOptions.map((option) => (
                  <Typography
                    key={option.value}
                    variant="caption"
                    sx={{
                      display: "block",
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    {option.label}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Paper>

      {/* Call to Action & Genre/Duration Sections - CTA on left, stacked Genre and Duration on right */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr", // 33% : 66%
          gap: 3, // theme spacing
          alignItems: "start",
          mt: 3,
        }}
      >
        {/* Left Column (CTA) */}
        <CTAUrgencySection form={form} />

        {/* Right Column (Genre + Duration) */}
        <Box>
          <Stack spacing={3}>
            {/* Genre */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Genre
              </Typography>
              <Controller
                name="genre"
                control={form.control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <Select
                      {...field}
                      value={field.value || ""} // Ensure value is never null
                      displayEmpty
                      sx={{
                        bgcolor: "background.default",
                        "& .MuiSelect-select": { py: 1.5 },
                      }}
                      renderValue={(value) =>
                        value
                          ? value.charAt(0).toUpperCase() + value.slice(1) // Capitalize first letter
                          : "-- Select Genre --"
                      }
                      IconComponent={(props) => (
                        <ChevronDown
                          {...props}
                          size={18}
                          color={theme.palette.secondary.dark}
                        />
                      )}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: "background.default", // Background of the full menu
                            "& .MuiMenuItem-root": {
                              justifyContent: "center", // Center menu items
                            },
                            "& .Mui-selected": {
                              color: "secondary.main", // Text color for selected item
                              bgcolor: (theme) =>
                                alpha(theme.palette.secondary.main, 0.2), // Background color for selected item
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="">-- Select Genre --</MenuItem>
                      <MenuItem value="action">Action</MenuItem>
                      <MenuItem value="comedy">Comedy</MenuItem>
                      <MenuItem value="drama">Drama</MenuItem>
                      <MenuItem value="documentary">Documentary</MenuItem>
                      <MenuItem value="informative">Informative</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Box>

            {/* Duration */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Desired Duration
              </Typography>

              {/* Slider */}
              <Box sx={{ bgcolor: theme.palette.background.paper, p: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    0s
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    60s
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    120s
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    180s
                  </Typography>
                </Box>

                <Controller
                  name="desiredDuration"
                  control={form.control}
                  render={({ field }) => (
                    <Slider
                      {...field}
                      min={0}
                      max={180}
                      step={5}
                      marks={[
                        { value: 0 },
                        { value: 60 },
                        { value: 120 },
                        { value: 180 },
                      ]}
                      valueLabelDisplay="off"
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
                          "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible":
                            {
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
                  )}
                />

                {/* Time Counter & Custom Button aligned */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        bgcolor: alpha(theme.palette.secondary.main, 0.2),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "1.25rem",
                        color: "secondary.main",
                      }}
                    >
                      {duration}
                    </Box>
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body2">seconds</Typography>
                      <Typography variant="subtitle2" textAlign={"center"}>
                        {Math.floor(duration / 60)}:
                        {(duration % 60).toString().padStart(2, "0")}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const customValue = window.prompt(
                        "Enter custom duration (seconds):",
                        duration.toString()
                      );
                      if (customValue && !isNaN(Number(customValue))) {
                        form.setValue(
                          "desiredDuration",
                          Math.min(Math.max(Number(customValue), 0), 180)
                        );
                      }
                    }}
                    sx={{
                      borderColor: "divider",
                      color: "text.primary",
                      "&:hover": {
                        borderColor: "secondary.main",
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    Custom
                  </Button>
                </Box>
              </Box>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default FormatCtaSection;
