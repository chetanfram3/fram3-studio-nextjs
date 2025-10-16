// src/components/aiScriptGen/components/BrandDetailsSection.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Divider,
  Paper,
  Button,
  TextField,
  Chip,
  Tabs,
  Tab,
  IconButton,
  alpha,
  Collapse,
} from "@mui/material";
import {
  KeyboardArrowDown as ChevronDownIcon,
  KeyboardArrowUp as ChevronUpIcon,
  Add,
} from "@mui/icons-material";
import { Controller, type UseFormReturn } from "react-hook-form";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import type { FormValues } from "../types";
import SectionCloseButton from "./SectionCloseButton";
import { useArrayField } from "@/hooks/form/useArrayField";

interface BrandDetailsSectionProps {
  form: UseFormReturn<FormValues>;
}

type TabValue = 0 | 1;

export default function BrandDetailsSection({
  form,
}: BrandDetailsSectionProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { control, watch, setValue } = form;

  // State
  const [activeTab, setActiveTab] = useState<TabValue>(0);
  const [newValue, setNewValue] = useState("");
  const [newTone, setNewTone] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // ==========================================
  // USE ARRAY FIELD HOOKS
  // ==========================================
  // Use the custom hook for array fields - automatically handles normalization
  const brandValuesField = useArrayField(form, "brandDetails.brandValues");
  const toneKeywordsField = useArrayField(
    form,
    "brandDetails.voiceAndTone.toneKeywords"
  );

  // Destructure for easier access
  const {
    values,
    addValue: addBrandValue,
    removeValue: removeBrandValue,
  } = brandValuesField;
  const {
    values: toneKeywords,
    addValue: addToneKeyword,
    removeValue: removeToneKeyword,
  } = toneKeywordsField;

  // ==========================================
  // MEMOIZED STATIC OPTIONS
  // ==========================================
  const voiceOptions = useMemo(
    () => [
      "Professional",
      "Playful",
      "Authoritative",
      "Friendly",
      "Casual",
      "Formal",
    ],
    []
  );

  const strategyOptions = useMemo(
    () => [
      "Highlight superior features",
      "Ignore competitors completely",
      "Address competitor weakness subtly",
      "Position as premium alternative",
      "Position as value alternative",
    ],
    []
  );

  // ==========================================
  // WATCH FORM VALUES
  // ==========================================
  const selectedVoice = watch("brandDetails.voiceAndTone.brandVoice");
  const selectedStrategy = watch(
    "brandDetails.competitiveAnalysis.competitiveStrategy"
  );

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: TabValue): void => {
      setActiveTab(newValue);
    },
    []
  );

  const toggleExpanded = useCallback((): void => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Brand Values handlers - now much simpler!
  const handleAddValue = useCallback((): void => {
    if (!newValue.trim()) return;
    addBrandValue(newValue);
    setNewValue("");
  }, [newValue, addBrandValue]);

  const handleDeleteValue = useCallback(
    (index: number): void => {
      removeBrandValue(index);
    },
    [removeBrandValue]
  );

  // Tone Keywords handlers - now much simpler!
  const handleAddTone = useCallback((): void => {
    if (!newTone.trim()) return;
    addToneKeyword(newTone);
    setNewTone("");
  }, [newTone, addToneKeyword]);

  const handleDeleteTone = useCallback(
    (index: number): void => {
      removeToneKeyword(index);
    },
    [removeToneKeyword]
  );

  // Voice selection handler
  const handleVoiceSelect = useCallback(
    (option: string): void => {
      setValue("brandDetails.voiceAndTone.brandVoice", option);
    },
    [setValue]
  );

  // Strategy selection handler
  const handleStrategySelect = useCallback(
    (option: string): void => {
      setValue("brandDetails.competitiveAnalysis.competitiveStrategy", option);
    },
    [setValue]
  );

  // Handle Enter key for adding values
  const handleValueKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddValue();
      }
    },
    [handleAddValue]
  );

  const handleToneKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTone();
      }
    },
    [handleAddTone]
  );

  // ==========================================
  // MEMOIZED STYLES
  // ==========================================
  const dividerGradient = useMemo(
    () =>
      `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.6)}, ${alpha(
        theme.palette.primary.main,
        0.25
      )})`,
    [theme.palette.primary.main]
  );

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: `${brand.borderRadius}px`,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
          position: "relative",
          width: "100%",
        }}
      >
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            mr: 2,
            height: 50,
            width: 4,
            background: dividerGradient,
            border: "none",
            borderRadius: `${brand.borderRadius}px`,
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontFamily: brand.fonts.heading,
              fontWeight: 600,
              color: "text.primary",
            }}
          >
            Brand Details
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontFamily: brand.fonts.body,
            }}
          >
            Define your brand identity and competitive positioning
          </Typography>
        </Box>
        <SectionCloseButton sectionId="brand" />
      </Box>

      {/* Identity Section */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{
            mb: 1.5,
            color: "text.primary",
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
          }}
        >
          Brand Identity
        </Typography>

        <Controller
          name="brandDetails.identity.visionStatement"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Vision Statement"
              fullWidth
              multiline
              rows={2}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { fontFamily: brand.fonts.body },
              }}
              InputLabelProps={{
                sx: { fontFamily: brand.fonts.body },
              }}
            />
          )}
        />

        <Controller
          name="brandDetails.identity.missionStatement"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Mission Statement"
              fullWidth
              multiline
              rows={2}
              InputProps={{
                sx: { fontFamily: brand.fonts.body },
              }}
              InputLabelProps={{
                sx: { fontFamily: brand.fonts.body },
              }}
            />
          )}
        />
      </Box>

      {/* Brand Values */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{
            mb: 1.5,
            color: "text.primary",
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
          }}
        >
          Brand Values ({values.length})
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
          <TextField
            label="Add a value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={handleValueKeyDown}
            size="small"
            fullWidth
            InputProps={{
              sx: { fontFamily: brand.fonts.body },
            }}
            InputLabelProps={{
              sx: { fontFamily: brand.fonts.body },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleAddValue}
            disabled={!newValue.trim()}
            sx={{
              border: 1,
              borderColor: "primary.main",
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <Add />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
          {values.map((value, index) => (
            <Chip
              key={index}
              label={value}
              onDelete={() => handleDeleteValue(index)}
              sx={{
                fontFamily: brand.fonts.body,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
                border: 1,
                borderColor: alpha(theme.palette.primary.main, 0.3),
                "& .MuiChip-deleteIcon": {
                  color: "primary.main",
                  "&:hover": {
                    color: "primary.dark",
                  },
                },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Voice & Tone Section */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: "text.primary",
              fontFamily: brand.fonts.heading,
              fontWeight: 600,
            }}
          >
            Voice & Tone
          </Typography>
          <IconButton
            size="small"
            onClick={toggleExpanded}
            sx={{ color: "primary.main" }}
          >
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </IconButton>
        </Box>

        <Collapse in={isExpanded}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              mb: 2,
              "& .MuiTab-root": {
                fontFamily: brand.fonts.body,
                textTransform: "none",
              },
            }}
          >
            <Tab label="Brand Voice" />
            <Tab label="Tone Keywords" />
          </Tabs>

          {/* Brand Voice Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                }}
              >
                Select your brand's primary voice
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {voiceOptions.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    onClick={() => handleVoiceSelect(option)}
                    sx={{
                      fontFamily: brand.fonts.body,
                      bgcolor:
                        selectedVoice === option
                          ? "primary.main"
                          : alpha(theme.palette.primary.main, 0.1),
                      color:
                        selectedVoice === option
                          ? "primary.contrastText"
                          : "primary.main",
                      border: 1,
                      borderColor:
                        selectedVoice === option
                          ? "primary.main"
                          : alpha(theme.palette.primary.main, 0.3),
                      cursor: "pointer",
                      transition: theme.transitions.create(
                        ["background-color", "color"],
                        {
                          duration: theme.transitions.duration.short,
                        }
                      ),
                      "&:hover": {
                        bgcolor:
                          selectedVoice === option
                            ? "primary.dark"
                            : alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Tone Keywords Tab */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                  label="Add a tone keyword"
                  value={newTone}
                  onChange={(e) => setNewTone(e.target.value)}
                  onKeyDown={handleToneKeyDown}
                  size="small"
                  fullWidth
                  InputProps={{
                    sx: { fontFamily: brand.fonts.body },
                  }}
                  InputLabelProps={{
                    sx: { fontFamily: brand.fonts.body },
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={handleAddTone}
                  disabled={!newTone.trim()}
                  sx={{
                    border: 1,
                    borderColor: "primary.main",
                    borderRadius: `${brand.borderRadius}px`,
                  }}
                >
                  <Add />
                </IconButton>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {toneKeywords.map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    onDelete={() => handleDeleteTone(index)}
                    sx={{
                      fontFamily: brand.fonts.body,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                      border: 1,
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      "& .MuiChip-deleteIcon": {
                        color: "primary.main",
                        "&:hover": {
                          color: "primary.dark",
                        },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Collapse>
      </Box>

      {/* Competitive Analysis Section */}
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            mb: 1.5,
            color: "text.primary",
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
          }}
        >
          Competitive Analysis
        </Typography>

        <Controller
          name="brandDetails.competitiveAnalysis.competitorNotes"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Competitor Notes"
              fullWidth
              multiline
              rows={2}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { fontFamily: brand.fonts.body },
              }}
              InputLabelProps={{
                sx: { fontFamily: brand.fonts.body },
              }}
            />
          )}
        />

        <Typography
          variant="body2"
          sx={{
            mb: 1,
            color: "text.secondary",
            fontFamily: brand.fonts.body,
          }}
        >
          Competitive Strategy
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {strategyOptions.map((option) => (
            <Chip
              key={option}
              label={option}
              onClick={() => handleStrategySelect(option)}
              sx={{
                fontFamily: brand.fonts.body,
                bgcolor:
                  selectedStrategy === option
                    ? "primary.main"
                    : alpha(theme.palette.primary.main, 0.1),
                color:
                  selectedStrategy === option
                    ? "primary.contrastText"
                    : "primary.main",
                border: 1,
                borderColor:
                  selectedStrategy === option
                    ? "primary.main"
                    : alpha(theme.palette.primary.main, 0.3),
                cursor: "pointer",
                transition: theme.transitions.create(
                  ["background-color", "color"],
                  {
                    duration: theme.transitions.duration.short,
                  }
                ),
                "&:hover": {
                  bgcolor:
                    selectedStrategy === option
                      ? "primary.dark"
                      : alpha(theme.palette.primary.main, 0.2),
                },
              }}
            />
          ))}
        </Box>

        {selectedStrategy === "Other" && (
          <Controller
            name="brandDetails.competitiveAnalysis.customCompetitiveStrategy"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Custom Competitive Strategy"
                fullWidth
                multiline
                rows={2}
                InputProps={{
                  sx: { fontFamily: brand.fonts.body },
                }}
                InputLabelProps={{
                  sx: { fontFamily: brand.fonts.body },
                }}
              />
            )}
          />
        )}
      </Box>
    </Paper>
  );
}
