// src/components/aiScriptGen/components/BrandDetailsSection.tsx
"use client";

import { useState, useCallback, useMemo, JSX } from "react";
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
  useTheme,
} from "@mui/material";
import {
  KeyboardArrowDown as ChevronDownIcon,
  KeyboardArrowUp as ChevronUpIcon,
  Add,
} from "@mui/icons-material";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { FormValues } from "../types";
import SectionCloseButton from "./SectionCloseButton";
import { getCurrentBrand } from "@/config/brandConfig";

interface BrandDetailsSectionProps {
  form: UseFormReturn<FormValues>;
}

type TabValue = 0 | 1;

const BrandDetailsSection = ({
  form,
}: BrandDetailsSectionProps): JSX.Element => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { control, watch, setValue } = form;

  // State
  const [activeTab, setActiveTab] = useState<TabValue>(0);
  const [newValue, setNewValue] = useState("");
  const [newTone, setNewTone] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoize static option arrays
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

  // Watch form values
  const values = watch("brandDetails.brandValues") || [];
  const selectedVoice = watch("brandDetails.voiceAndTone.brandVoice");
  const toneKeywords = watch("brandDetails.voiceAndTone.toneKeywords") || [];
  const selectedStrategy = watch(
    "brandDetails.competitiveAnalysis.competitiveStrategy"
  );

  // Handlers
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: TabValue): void => {
      setActiveTab(newValue);
    },
    []
  );

  const toggleExpanded = useCallback((): void => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleAddValue = useCallback((): void => {
    if (!newValue.trim()) return;
    setValue("brandDetails.brandValues", [...values, newValue.trim()]);
    setNewValue("");
  }, [newValue, values, setValue]);

  const handleAddTone = useCallback((): void => {
    if (!newTone.trim()) return;
    setValue("brandDetails.voiceAndTone.toneKeywords", [
      ...toneKeywords,
      newTone.trim(),
    ]);
    setNewTone("");
  }, [newTone, toneKeywords, setValue]);

  const handleDeleteValue = useCallback(
    (index: number): void => {
      const newValues = [...values];
      newValues.splice(index, 1);
      setValue("brandDetails.brandValues", newValues);
    },
    [values, setValue]
  );

  const handleDeleteTone = useCallback(
    (index: number): void => {
      const newKeywords = [...toneKeywords];
      newKeywords.splice(index, 1);
      setValue("brandDetails.voiceAndTone.toneKeywords", newKeywords);
    },
    [toneKeywords, setValue]
  );

  const handleVoiceSelect = useCallback(
    (option: string): void => {
      setValue("brandDetails.voiceAndTone.brandVoice", option);
    },
    [setValue]
  );

  const handleStrategySelect = useCallback(
    (option: string): void => {
      setValue("brandDetails.competitiveAnalysis.competitiveStrategy", option);
    },
    [setValue]
  );

  // Memoize gradient for dividers
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
            height: 30,
            width: 4,
            background: dividerGradient,
            mr: 2,
            borderRadius: 2,
          }}
        />
        <Typography
          variant="h5"
          fontWeight={600}
          sx={{ fontFamily: brand.fonts.heading }}
        >
          Brand Details
        </Typography>
        <SectionCloseButton
          sectionId="brand"
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
          }}
        />
      </Box>

      {/* Brand Identity */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          bgcolor: "background.paper",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
            justifyContent: "center",
          }}
        >
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              height: 24,
              width: 4,
              background: dividerGradient,
              mr: 1,
              borderRadius: 2,
            }}
          />
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ fontFamily: brand.fonts.heading }}
          >
            Brand Identity
          </Typography>
        </Box>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            "& .MuiTab-root": {
              fontFamily: brand.fonts.body,
            },
          }}
        >
          <Tab label="Vision" />
          <Tab label="Mission" />
        </Tabs>

        {activeTab === 0 && (
          <Controller
            name="brandDetails.identity.visionStatement"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                placeholder="Enter the brand's vision statement"
                multiline
                rows={2}
                sx={{
                  mt: 2,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "background.paper",
                    fontFamily: brand.fonts.body,
                  },
                }}
              />
            )}
          />
        )}

        {activeTab === 1 && (
          <Controller
            name="brandDetails.identity.missionStatement"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                placeholder="Enter the brand's mission statement"
                multiline
                rows={2}
                sx={{
                  mt: 2,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "background.paper",
                    fontFamily: brand.fonts.body,
                  },
                }}
              />
            )}
          />
        )}

        <Typography
          variant="subtitle1"
          fontWeight={600}
          textAlign="center"
          sx={{
            mt: 3,
            display: "block",
            fontFamily: brand.fonts.heading,
          }}
        >
          Brand Values
        </Typography>

        <Box sx={{ display: "flex", gap: 1, my: 1 }}>
          <TextField
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            fullWidth
            placeholder="Add core brand values"
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "background.paper",
                fontFamily: brand.fonts.body,
              },
            }}
          />
          <Button
            onClick={handleAddValue}
            variant="contained"
            color="primary"
            sx={{
              fontFamily: brand.fonts.body,
            }}
          >
            <Add />
          </Button>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
          {values.map((value, index) => (
            <Chip
              key={index}
              label={value}
              onDelete={() => handleDeleteValue(index)}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                color: "primary.main",
                fontFamily: brand.fonts.body,
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
      </Paper>

      {/* Voice & Tone */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          bgcolor: "background.paper",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
            justifyContent: "center",
          }}
        >
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              height: 24,
              width: 4,
              background: dividerGradient,
              mr: 1,
              borderRadius: 2,
            }}
          />
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ fontFamily: brand.fonts.heading }}
          >
            Voice & Tone
          </Typography>
        </Box>

        <Typography
          variant="subtitle2"
          fontWeight={600}
          textAlign="center"
          sx={{
            mb: 1,
            display: "block",
            fontFamily: brand.fonts.heading,
          }}
        >
          Brand Voice
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 1,
            mb: 2,
          }}
        >
          {voiceOptions.map((option) => {
            const isSelected = selectedVoice === option;
            return (
              <Button
                key={option}
                variant={isSelected ? "contained" : "outlined"}
                onClick={() => handleVoiceSelect(option)}
                sx={{
                  bgcolor: isSelected
                    ? alpha(theme.palette.primary.main, 0.2)
                    : "background.paper",
                  borderColor: isSelected
                    ? alpha(theme.palette.primary.dark, 0.3)
                    : "divider",
                  color: isSelected ? "primary.main" : "text.primary",
                  "&:hover": {
                    bgcolor: isSelected ? "primary.main" : "action.hover",
                    color: isSelected ? "primary.contrastText" : "text.primary",
                  },
                  textTransform: "none",
                  py: 0.8,
                  fontSize: "0.95rem",
                  fontFamily: brand.fonts.body,
                }}
              >
                {option}
              </Button>
            );
          })}
        </Box>

        <Typography
          variant="subtitle2"
          fontWeight={600}
          textAlign="center"
          sx={{
            mb: 1,
            display: "block",
            fontFamily: brand.fonts.heading,
          }}
        >
          Tone Keywords
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
          <TextField
            value={newTone}
            onChange={(e) => setNewTone(e.target.value)}
            fullWidth
            placeholder="Add tone keywords (e.g., Witty, Sarcastic, Urgent)"
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "background.paper",
                fontFamily: brand.fonts.body,
              },
            }}
          />
          <Button
            onClick={handleAddTone}
            variant="contained"
            color="primary"
            sx={{
              fontFamily: brand.fonts.body,
            }}
          >
            <Add />
          </Button>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {toneKeywords.map((keyword, index) => (
            <Chip
              key={index}
              label={keyword}
              onDelete={() => handleDeleteTone(index)}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                color: "primary.main",
                fontFamily: brand.fonts.body,
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
      </Paper>

      {/* Competitive Analysis */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: "background.paper",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                height: 28,
                width: 4,
                background: dividerGradient,
                mr: 1,
                borderRadius: 2,
              }}
            />
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Competitive Analysis
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={toggleExpanded}
            color="primary"
            sx={{ ml: 1 }}
          >
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </IconButton>
        </Box>

        <Collapse in={isExpanded}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            textAlign="center"
            sx={{
              mb: 1,
              display: "block",
              fontFamily: brand.fonts.heading,
            }}
          >
            Competitor Notes
          </Typography>

          <Controller
            name="brandDetails.competitiveAnalysis.competitorNotes"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={2}
                placeholder="Enter notes about competitors"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "background.paper",
                    fontFamily: brand.fonts.body,
                  },
                }}
              />
            )}
          />

          <Typography
            variant="subtitle1"
            textAlign="center"
            fontWeight={600}
            sx={{
              mt: 2,
              mb: 1,
              display: "block",
              fontFamily: brand.fonts.heading,
            }}
          >
            Competitive Strategy
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {strategyOptions.map((option) => {
              const isSelected = selectedStrategy === option;
              return (
                <Button
                  key={option}
                  fullWidth
                  variant={isSelected ? "contained" : "outlined"}
                  onClick={() => handleStrategySelect(option)}
                  sx={{
                    textTransform: "none",
                    justifyContent: "flex-start",
                    bgcolor: isSelected
                      ? alpha(theme.palette.primary.main, 0.2)
                      : "background.paper",
                    borderColor: isSelected
                      ? alpha(theme.palette.primary.dark, 0.3)
                      : "divider",
                    color: isSelected ? "primary.main" : "text.primary",
                    "&:hover": {
                      bgcolor: isSelected ? "primary.main" : "action.hover",
                      color: isSelected
                        ? "primary.contrastText"
                        : "text.primary",
                    },
                    py: 0.5,
                    fontSize: "1rem",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {option}
                </Button>
              );
            })}
          </Box>

          <Box mt={2}>
            <TextField
              value={selectedStrategy || ""}
              fullWidth
              disabled
              sx={{
                textAlign: "center",
                bgcolor: "background.default",
                mt: 1,
                "& .MuiOutlinedInput-root": {
                  fontFamily: brand.fonts.body,
                },
              }}
              InputProps={{
                sx: { textAlign: "center", justifyContent: "center" },
              }}
            />
          </Box>
        </Collapse>
      </Paper>
    </Paper>
  );
};

BrandDetailsSection.displayName = "BrandDetailsSection";

export default BrandDetailsSection;
