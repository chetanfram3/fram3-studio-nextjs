import React, { useState } from "react";
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
import { FormValues } from "../types";
import SectionCloseButton from "./SectionCloseButton";

interface StoryDetailsSectionProps {
  form: UseFormReturn<FormValues>;
}

const StoryDetailsSection: React.FC<StoryDetailsSectionProps> = ({ form }) => {
  const { control, watch, setValue } = form;
  const story = watch("storyDetails");

  const [newPlotElement, setNewPlotElement] = useState("");
  const [newCharacter, setNewCharacter] = useState("");
  const [newSetting, setNewSetting] = useState("");

  // Define which fields are arrays to help TypeScript
  const arrayFields: (keyof FormValues["storyDetails"])[] = [
    "plotElements",
    "characters",
    "settings",
  ];

  const handleAddItem = (
    field: keyof FormValues["storyDetails"],
    value: string,
    stateSetter: (v: string) => void
  ) => {
    if (!value.trim()) return;

    // Check if the field is one of our array fields
    if (arrayFields.includes(field)) {
      const currentValues = (story?.[field] as string[]) || [];
      setValue(`storyDetails.${field}`, [
        ...currentValues,
        value.trim(),
      ] as any);
      stateSetter("");
    }
  };

  const handleRemoveItem = (
    field: keyof FormValues["storyDetails"],
    index: number
  ) => {
    // Check if the field is one of our array fields
    if (arrayFields.includes(field)) {
      const currentValues = (story?.[field] as string[]) || [];
      setValue(
        `storyDetails.${field}`,
        currentValues.filter((_, i) => i !== index) as any
      );
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 1,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        position: "relative",
      }}
    >
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
          sx={{ display: "block", mb: 1, textAlign: "center" }}
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
                },
                "& .MuiOutlinedInput-root": {
                  color: "text.primary",
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
          sx={{ display: "block", mb: 1, textAlign: "center" }}
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
                "& .MuiInputBase-input": {
                  textAlign: "center",
                },
                bgcolor: "background.default",
                "& .MuiOutlinedInput-root": {
                  color: "text.primary",
                },
              }}
            />
          )}
        />
      </Box>

      {/* Dynamic Fields */}
      {[
        {
          label: "Plot Elements",
          key: "plotElements",
          state: newPlotElement,
          setState: setNewPlotElement,
          placeholder: "Add a plot element",
        },
        {
          label: "Characters",
          key: "characters",
          state: newCharacter,
          setState: setNewCharacter,
          placeholder: "Add a character",
        },
        {
          label: "Settings",
          key: "settings",
          state: newSetting,
          setState: setNewSetting,
          placeholder: "Add a setting",
        },
      ].map(({ label, key, state, setState, placeholder }) => (
        <Box sx={{ mb: 3 }} key={key}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ display: "block", mb: 1, textAlign: "center" }}
          >
            {label}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
            {((story?.[key as keyof typeof story] as string[]) || []).map(
              (item, i) => (
                <Chip
                  key={i}
                  label={item}
                  onDelete={() =>
                    handleRemoveItem(key as keyof typeof story, i)
                  }
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
              value={state}
              placeholder={placeholder}
              onChange={(e) => setState(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                handleAddItem(key as keyof typeof story, state, setState)
              }
              sx={{
                "& .MuiInputBase-input": {
                  textAlign: "center",
                },
                bgcolor: "background.default",
                "& .MuiOutlinedInput-root": {
                  color: "text.primary",
                },
              }}
            />
            <Button
              variant="contained"
              size="small"
              disabled={!state.trim()}
              onClick={() =>
                handleAddItem(key as keyof typeof story, state, setState)
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
      ))}
    </Paper>
  );
};

export default StoryDetailsSection;
