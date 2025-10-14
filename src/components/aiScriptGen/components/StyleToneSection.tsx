"use client";

import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Chip,
  Button,
  Divider,
  Paper,
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
interface StyleToneSectionProps {
  form: UseFormReturn<FormValues>;
}

type KeywordType = "visualStyleKeywords" | "soundDesignKeywords";

/**
 * StyleToneSection - Style and tone configuration component
 *
 * Performance optimizations:
 * - React 19 compiler auto-optimizes (no manual memo needed)
 * - useCallback for event handlers
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
export default function StyleToneSection({ form }: StyleToneSectionProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // FORM STATE
  // ==========================================
  const { control, watch, setValue } = form;
  const styleAndTone = watch("campaignDetails.styleAndTone") || {};

  // ==========================================
  // LOCAL STATE
  // ==========================================
  const [visualKeyword, setVisualKeyword] = useState("");
  const [soundKeyword, setSoundKeyword] = useState("");

  // ==========================================
  // EVENT HANDLERS (useCallback for stability)
  // ==========================================
  const handleAdd = useCallback(
    (key: KeywordType, value: string, setter: (v: string) => void) => {
      if (!value.trim()) return;

      const current = (styleAndTone[key] || []) as string[];
      setValue(`campaignDetails.styleAndTone.${key}`, [
        ...current,
        value.trim(),
      ]);
      setter("");
    },
    [styleAndTone, setValue]
  );

  const handleRemove = useCallback(
    (key: KeywordType, index: number) => {
      const current = (styleAndTone[key] || []) as string[];
      setValue(
        `campaignDetails.styleAndTone.${key}`,
        current.filter((_, i) => i !== index)
      );
    },
    [styleAndTone, setValue]
  );

  const handleVisualKeywordKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd("visualStyleKeywords", visualKeyword, setVisualKeyword);
      }
    },
    [visualKeyword, handleAdd]
  );

  const handleSoundKeywordKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd("soundDesignKeywords", soundKeyword, setSoundKeyword);
      }
    },
    [soundKeyword, handleAdd]
  );

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Paper
      elevation={1}
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
          Style & Tone
        </Typography>
        <SectionCloseButton
          sectionId="style"
          sx={{ position: "absolute", right: 0 }}
        />
      </Box>

      {/* Visual Style Keywords */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{
            textAlign: "center",
            display: "block",
            mb: 1,
            color: "text.primary",
          }}
        >
          Visual Style Keywords
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          {((styleAndTone.visualStyleKeywords || []) as string[]).map(
            (word: string, index: number) => (
              <Chip
                key={index}
                label={word}
                onDelete={() => handleRemove("visualStyleKeywords", index)}
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
            value={visualKeyword}
            onChange={(e) => setVisualKeyword(e.target.value)}
            placeholder="Add visual style keyword"
            onKeyDown={handleVisualKeywordKeyDown}
            sx={{
              bgcolor: "background.default",
              "& .MuiOutlinedInput-root": {
                color: "text.primary",
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
            disabled={!visualKeyword.trim()}
            onClick={() =>
              handleAdd("visualStyleKeywords", visualKeyword, setVisualKeyword)
            }
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

      {/* Sound Design Keywords */}
      <Box>
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{
            textAlign: "center",
            display: "block",
            mb: 1,
            color: "text.primary",
          }}
        >
          Sound Design Keywords
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          {((styleAndTone.soundDesignKeywords || []) as string[]).map(
            (word: string, index: number) => (
              <Chip
                key={index}
                label={word}
                onDelete={() => handleRemove("soundDesignKeywords", index)}
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
            value={soundKeyword}
            onChange={(e) => setSoundKeyword(e.target.value)}
            placeholder="Add sound design keyword"
            onKeyDown={handleSoundKeywordKeyDown}
            sx={{
              bgcolor: "background.default",
              "& .MuiOutlinedInput-root": {
                color: "text.primary",
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
            disabled={!soundKeyword.trim()}
            onClick={() =>
              handleAdd("soundDesignKeywords", soundKeyword, setSoundKeyword)
            }
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
    </Paper>
  );
}

StyleToneSection.displayName = "StyleToneSection";
