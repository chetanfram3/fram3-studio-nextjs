"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Chip,
  Divider,
  Paper,
  Button,
  TextField,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { Controller, UseFormReturn } from "react-hook-form";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import type { FormValues } from "../types";
import SectionCloseButton from "./SectionCloseButton";

// ==========================================
// TYPE DEFINITIONS
// ==========================================
interface StoryDetailsSectionProps {
  form: UseFormReturn<FormValues>;
}

type ArrayFieldKey = "plotElements" | "characters" | "settings";

interface DynamicFieldConfig {
  label: string;
  key: ArrayFieldKey;
  state: string;
  setState: (value: string) => void;
  placeholder: string;
}

/**
 * StoryDetailsSection - Story configuration component
 *
 * Performance optimizations:
 * - React 19 compiler auto-optimizes (no manual memo needed)
 * - useCallback for event handlers
 * - useMemo for static field configurations
 * - Theme-aware styling (no hardcoded colors)
 * - Proper dependency arrays
 *
 * Porting standards:
 * - 100% type safe (no any types)
 * - Uses theme palette for all colors (primary instead of secondary)
 * - Uses brand config for fonts/spacing
 * - No hardcoded colors, fonts, or spacing
 * - Follows MUI v7 patterns
 */
export default function StoryDetailsSection({
  form,
}: StoryDetailsSectionProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // FORM STATE
  // ==========================================
  const { control, watch, setValue } = form;
  const story = watch("storyDetails");

  // ==========================================
  // LOCAL STATE
  // ==========================================
  const [newPlotElement, setNewPlotElement] = useState("");
  const [newCharacter, setNewCharacter] = useState("");
  const [newSetting, setNewSetting] = useState("");

  // ==========================================
  // CONSTANTS (Memoized for stability)
  // ==========================================
  const arrayFields: ArrayFieldKey[] = useMemo(
    () => ["plotElements", "characters", "settings"],
    []
  );

  // Dynamic field configurations
  const dynamicFields: DynamicFieldConfig[] = useMemo(
    () => [
      {
        label: "Plot Elements",
        key: "plotElements" as ArrayFieldKey,
        state: newPlotElement,
        setState: setNewPlotElement,
        placeholder: "Add a plot element",
      },
      {
        label: "Characters",
        key: "characters" as ArrayFieldKey,
        state: newCharacter,
        setState: setNewCharacter,
        placeholder: "Add a character",
      },
      {
        label: "Settings",
        key: "settings" as ArrayFieldKey,
        state: newSetting,
        setState: setNewSetting,
        placeholder: "Add a setting",
      },
    ],
    [newPlotElement, newCharacter, newSetting]
  );

  // ==========================================
  // EVENT HANDLERS (useCallback for stability)
  // ==========================================
  const handleAddItem = useCallback(
    (
      field: keyof FormValues["storyDetails"],
      value: string,
      stateSetter: (v: string) => void
    ) => {
      if (!value.trim()) return;

      if (arrayFields.includes(field as ArrayFieldKey)) {
        const currentValues = (story?.[field] as string[] | undefined) || [];
        setValue(`storyDetails.${field}`, [...currentValues, value.trim()]);
        stateSetter("");
      }
    },
    [arrayFields, story, setValue]
  );

  const handleRemoveItem = useCallback(
    (field: keyof FormValues["storyDetails"], index: number) => {
      if (arrayFields.includes(field as ArrayFieldKey)) {
        const currentValues = (story?.[field] as string[] | undefined) || [];
        setValue(
          `storyDetails.${field}`,
          currentValues.filter((_, i) => i !== index)
        );
      }
    },
    [arrayFields, story, setValue]
  );

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: `${brand.borderRadius}px`,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        position: "relative",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 3,
          position: "relative",
        }}
      >
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            height: 30,
            width: 4,
            background: `linear-gradient(to bottom, ${alpha(
              theme.palette.primary.main,
              0.6
            )}, ${alpha(theme.palette.primary.main, 0.25)})`,
            mr: 2,
            borderRadius: `${brand.borderRadius / 4}px`,
          }}
        />
        <Typography
          variant="h5"
          fontWeight={600}
          sx={{
            color: "text.primary",
            fontFamily: brand.fonts.heading,
          }}
        >
          Story Details
        </Typography>
        <SectionCloseButton
          sectionId="story"
          sx={{ position: "absolute", right: 0 }}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Mood */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{
            display: "block",
            mb: 1,
            textAlign: "center",
            color: "text.primary",
            fontFamily: brand.fonts.heading,
          }}
        >
          Mood
        </Typography>
        <Controller
          name="storyDetails.mood"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              size="small"
              placeholder="Enter the overall mood of the commercial"
              sx={{
                bgcolor: "background.default",
                "& .MuiInputBase-input": {
                  textAlign: "center",
                  color: "text.primary",
                },
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                  },
                },
              }}
            />
          )}
        />
      </Box>

      {/* Narrative Structure */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{
            display: "block",
            mb: 1,
            textAlign: "center",
            color: "text.primary",
            fontFamily: brand.fonts.heading,
          }}
        >
          Narrative Structure
        </Typography>
        <Controller
          name="storyDetails.narrativeStructure"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              size="small"
              placeholder="Enter the narrative structure"
              sx={{
                bgcolor: "background.default",
                "& .MuiInputBase-input": {
                  textAlign: "center",
                  color: "text.primary",
                },
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                  },
                },
              }}
            />
          )}
        />
      </Box>

      {/* Dynamic Fields */}
      {dynamicFields.map(({ label, key, state, setState, placeholder }) => (
        <Box sx={{ mb: 3 }} key={key}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              display: "block",
              mb: 1,
              textAlign: "center",
              color: "text.primary",
              fontFamily: brand.fonts.heading,
            }}
          >
            {label}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
            {((story?.[key] as string[] | undefined) || []).map(
              (item: string, i: number) => (
                <Chip
                  key={i}
                  label={item}
                  onDelete={() => handleRemoveItem(key, i)}
                  sx={{
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    fontFamily: brand.fonts.body,
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                    "& .MuiChip-deleteIcon": {
                      color: "primary.contrastText",
                      "&:hover": {
                        color: alpha(theme.palette.primary.contrastText, 0.7),
                      },
                    },
                  }}
                />
              )
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              value={state}
              placeholder={placeholder}
              onChange={(e) => setState(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddItem(key, state, setState);
                }
              }}
              sx={{
                bgcolor: "background.default",
                "& .MuiInputBase-input": {
                  textAlign: "center",
                  color: "text.primary",
                },
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                  },
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={!state.trim()}
              onClick={() => handleAddItem(key, state, setState)}
              sx={{
                minWidth: 40,
                fontFamily: brand.fonts.body,
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              }}
            >
              <Add fontSize="small" />
            </Button>
          </Box>
        </Box>
      ))}
    </Paper>
  );
}

StoryDetailsSection.displayName = "StoryDetailsSection";
