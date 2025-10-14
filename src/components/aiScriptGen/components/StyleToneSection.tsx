// src/modules/scripts/components/StyleToneSection.tsx
import React, { useState } from "react";
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
import { FormValues } from "../types";
import SectionCloseButton from "./SectionCloseButton";

interface StyleToneSectionProps {
  form: UseFormReturn<FormValues>;
}

const StyleToneSection: React.FC<StyleToneSectionProps> = ({ form }) => {
  const { control, watch, setValue } = form;
  const styleAndTone = watch("campaignDetails.styleAndTone") || {};
  const [visualKeyword, setVisualKeyword] = useState("");
  const [soundKeyword, setSoundKeyword] = useState("");

  const handleAdd = (
    key: "visualStyleKeywords" | "soundDesignKeywords",
    value: string,
    setter: (v: string) => void
  ) => {
    if (!value.trim()) return;
    const current = styleAndTone[key] || [];
    setValue(`campaignDetails.styleAndTone.${key}`, [...current, value.trim()]);
    setter("");
  };

  const handleRemove = (
    key: "visualStyleKeywords" | "soundDesignKeywords",
    index: number
  ) => {
    const current = styleAndTone[key] || [];
    setValue(
      `campaignDetails.styleAndTone.${key}`,
      current.filter((_, i) => i !== index)
    );
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        borderRadius: 1,
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
            background: (theme) =>
              `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
            mr: 2,
            borderRadius: 2,
          }}
        />
        <Typography variant="h5" fontWeight={600}>
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
          sx={{ textAlign: "center", display: "block", mb: 1 }}
        >
          Visual Style Keywords
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          {(styleAndTone.visualStyleKeywords || []).map(
            (word: string, index: number) => (
              <Chip
                key={index}
                label={word}
                onDelete={() => handleRemove("visualStyleKeywords", index)}
                sx={{
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
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
            onKeyDown={(e) =>
              e.key === "Enter" &&
              handleAdd("visualStyleKeywords", visualKeyword, setVisualKeyword)
            }
            sx={{
              bgcolor: "background.default",
              "& .MuiOutlinedInput-root": {
                color: "text.primary",
              },
            }}
          />
          <Button
            variant="contained"
            disabled={!visualKeyword.trim()}
            onClick={() =>
              handleAdd("visualStyleKeywords", visualKeyword, setVisualKeyword)
            }
            sx={{
              minWidth: 40,
              bgcolor: "secondary.main",
              "&:hover": {
                bgcolor: "secondary.dark",
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
          sx={{ textAlign: "center", display: "block", mb: 1 }}
        >
          Sound Design Keywords
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          {(styleAndTone.soundDesignKeywords || []).map(
            (word: string, index: number) => (
              <Chip
                key={index}
                label={word}
                onDelete={() => handleRemove("soundDesignKeywords", index)}
                sx={{
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
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
            onKeyDown={(e) =>
              e.key === "Enter" &&
              handleAdd("soundDesignKeywords", soundKeyword, setSoundKeyword)
            }
            sx={{
              bgcolor: "background.default",
              "& .MuiOutlinedInput-root": {
                color: "text.primary",
              },
            }}
          />
          <Button
            variant="contained"
            disabled={!soundKeyword.trim()}
            onClick={() =>
              handleAdd("soundDesignKeywords", soundKeyword, setSoundKeyword)
            }
            sx={{
              minWidth: 40,
              bgcolor: "secondary.main",
              "&:hover": {
                bgcolor: "secondary.dark",
              },
            }}
          >
            <Add fontSize="small" />
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default StyleToneSection;
