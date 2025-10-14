import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Divider,
  Button,
  useTheme,
  IconButton,
  Fade,
  Collapse,
  Slider,
  alpha,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  KeyboardArrowUp as ChevronUpIcon,
  KeyboardArrowDown as ChevronDownIcon,
} from "@mui/icons-material";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";
import EmotionWheel from "./EmotionWheel";
import GenderIdentityPicker from "./GenderIdentityPicker";
import EmotionalArc from "./EmotionalArc";
import { demographicData } from "../data/demographicData";
import SectionCloseButton from "./SectionCloseButton";

interface AudienceDetailsSectionProps {
  form: UseFormReturn<FormValues>;
}

const AudienceDetailsSection: React.FC<AudienceDetailsSectionProps> = ({
  form,
}) => {
  const theme = useTheme();
  const [currentPanel, setCurrentPanel] = useState("");
  const [emotionSelectionMode, setEmotionSelectionMode] = useState<
    "start" | "middle" | "end"
  >("start");
  const [isDraggingEmotion, setIsDraggingEmotion] = useState<number | null>(
    null
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Updated to match new type structure
  const audienceDetails = form.watch("audienceDetails") || {};

  // Toggle age range selection
  const handleToggleAgeRange = (range: string) => {
    const currentAgeRanges = audienceDetails.demographics?.age || [];
    if (currentAgeRanges.includes(range)) {
      form.setValue(
        "audienceDetails.demographics.age",
        currentAgeRanges.filter((r) => r !== range),
        { shouldDirty: true }
      );
    } else {
      form.setValue(
        "audienceDetails.demographics.age",
        [...currentAgeRanges, range],
        {
          shouldDirty: true,
        }
      );
    }
  };

  // Handle emotion selection
  const handleEmotionSelect = (emotion: string) => {
    // Update the emotionList array with the selected emotion
    const currentEmotionList = audienceDetails.emotionalTone?.emotionList || [];
    form.setValue(
      "audienceDetails.emotionalTone.emotionList",
      [...currentEmotionList, emotion].slice(-3), // Keep only last 3 emotions
      { shouldDirty: true }
    );

    const currentEmotions = audienceDetails.emotionalTone?.emotionalArc || [];
    let newEmotions = [...currentEmotions];

    if (currentEmotions.length < 3) {
      newEmotions = [
        ...currentEmotions,
        {
          emotion,
          intensity: audienceDetails.emotionalTone?.emotionIntensity || 60,
        },
      ];
      if (currentEmotions.length === 0) setEmotionSelectionMode("middle");
      else if (currentEmotions.length === 1) setEmotionSelectionMode("end");
    } else {
      if (emotionSelectionMode === "start")
        newEmotions[0] = {
          emotion,
          intensity: audienceDetails.emotionalTone?.emotionIntensity || 60,
        };
      else if (emotionSelectionMode === "middle")
        newEmotions[1] = {
          emotion,
          intensity: audienceDetails.emotionalTone?.emotionIntensity || 60,
        };
      else
        newEmotions[2] = {
          emotion,
          intensity: audienceDetails.emotionalTone?.emotionIntensity || 60,
        };
    }

    form.setValue("audienceDetails.emotionalTone.emotionalArc", newEmotions, {
      shouldDirty: true,
    });
  };

  // Handle emotion intensity change
  const handleEmotionIntensityChange = (
    _event: Event,
    newValue: number | number[]
  ) => {
    form.setValue(
      "audienceDetails.emotionalTone.emotionIntensity",
      typeof newValue === "number" ? newValue : newValue[0],
      { shouldDirty: true }
    );
  };

  // Handle drag and drop for emotion reordering
  const handleDragStart = (index: number) => {
    setIsDraggingEmotion(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isDraggingEmotion === null) return;

    const currentEmotions = audienceDetails.emotionalTone.emotionalArc || [];
    const updated = [...currentEmotions];
    const [draggedEmotion] = updated.splice(isDraggingEmotion, 1);
    updated.splice(index, 0, draggedEmotion);

    form.setValue("audienceDetails.emotionalTone.emotionalArc", updated, {
      shouldDirty: true,
    });
    setIsDraggingEmotion(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setIsDraggingEmotion(null);
    setDragOverIndex(null);
  };

  // Remove an emotion
  const removeEmotion = (index: number) => {
    const currentEmotions = audienceDetails.emotionalTone.emotionalArc || [];
    const newEmotions = currentEmotions.filter((_, i) => i !== index);

    form.setValue("audienceDetails.emotionalTone.emotionalArc", newEmotions, {
      shouldDirty: true,
    });

    if (newEmotions.length === 0) setEmotionSelectionMode("start");
    else if (newEmotions.length === 1) setEmotionSelectionMode("middle");
    else setEmotionSelectionMode("end");
  };

  // Reset all emotions
  const resetEmotions = () => {
    form.setValue("audienceDetails.emotionalTone.emotionalArc", [], {
      shouldDirty: true,
    });
    form.setValue("audienceDetails.emotionalTone.emotionList", [], {
      shouldDirty: true,
    });
    setEmotionSelectionMode("start");
  };

  // Get color for an emotion
  const getEmotionColor = (emotion: string) => {
    const emotionSegment = demographicData.emotionSegments.find(
      (segment) => segment.emotion === emotion
    );
    return emotionSegment ? emotionSegment.color1 : "#FFFFFF";
  };

  const handleToggleSex = (sexId: string) => {
    const currentSelectedSex = audienceDetails.demographics?.sex || [];
    const currentSexArray = Array.isArray(currentSelectedSex)
      ? currentSelectedSex
      : currentSelectedSex
      ? [currentSelectedSex]
      : [];

    // Toggle logic: add or remove based on current selection
    if (currentSexArray.includes(sexId)) {
      form.setValue(
        "audienceDetails.demographics.sex",
        currentSexArray.filter((id) => id !== sexId),
        { shouldDirty: true }
      );
    } else {
      form.setValue(
        "audienceDetails.demographics.sex",
        [...currentSexArray, sexId],
        { shouldDirty: true }
      );
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 1,
        bgcolor: theme.palette.background.paper,
        border: 1,
        borderColor: theme.palette.divider,
        mb: 4,
        position: "relative",
        width: "100%", // Ensure the Paper takes full width
      }}
    >
      <SectionCloseButton
        sectionId="audience"
        sx={{ position: "absolute", right: 12 }}
      />
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
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
          Audience Details
        </Typography>
      </Box>

      {/* Main Container - This is the key part that's been fixed */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: "100%",
        }}
      >
        {/* Left Column */}
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            pr: { xs: 0, md: 1.5 },
            mb: { xs: 3, md: 0 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 0,
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              bgcolor: theme.palette.background.paper,
              border: 0,
              borderRadius: 1,
              boxSizing: "border-box",
              width: "100%",
            }}
          >
            <Box
              sx={{
                bgcolor: theme.palette.background.default,
                border: "1px solid",
                borderRadius: 1,
                borderColor: "divider",
                mt: 0,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1.5,
                  pl: 1,
                  pr: 2,
                  pt: 1.5,
                }}
              >
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    height: 22,
                    width: 4,
                    background: (theme) =>
                      `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                    mr: 1,
                    borderRadius: 2,
                  }}
                />
                <Typography variant="subtitle2" fontWeight={500}>
                  Demographics
                </Typography>
              </Box>

              <Box sx={{ px: 2, mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mb: 0.5,
                    fontWeight: 500,
                    color: "text.secondary",
                    textAlign: "center",
                  }}
                >
                  Sex
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {demographicData.sexOptions.map((option) => {
                    // Check if the current option is selected
                    const sexValue = audienceDetails.demographics.sex;
                    const isSelected = Array.isArray(sexValue)
                      ? sexValue.includes(option.id)
                      : sexValue === option.id;

                    return (
                      <Button
                        key={option.id}
                        variant={isSelected ? "contained" : "outlined"}
                        onClick={() => handleToggleSex(option.id)}
                        startIcon={<Box component="span">{option.icon}</Box>}
                        sx={{
                          flex: 1,
                          border: 1,
                          bgcolor: isSelected
                            ? alpha(theme.palette.secondary.main, 0.2)
                            : "background.paper",
                          borderColor: isSelected
                            ? alpha(theme.palette.secondary.dark, 0.3)
                            : "divider",
                          color: isSelected ? "secondary.main" : "text.primary",
                          "&:hover": {
                            bgcolor: isSelected
                              ? "secondary.main"
                              : "action.hover",
                            color: isSelected
                              ? "secondary.contrastText"
                              : "text.primary",
                          },
                          textTransform: "none",
                          py: 0.1,
                          fontSize: "0.80rem",
                        }}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </Box>
                {(() => {
                  const sexValue = audienceDetails.demographics.sex;
                  const hasOtherSex = Array.isArray(sexValue)
                    ? sexValue.includes("other-sex")
                    : sexValue === "other-sex";

                  return hasOtherSex ? (
                    <Fade in={hasOtherSex}>
                      <TextField
                        fullWidth
                        placeholder="Specify sex"
                        value={audienceDetails.demographics.customSex || ""}
                        onChange={(e) =>
                          form.setValue(
                            "audienceDetails.demographics.customSex",
                            e.target.value,
                            {
                              shouldDirty: true,
                            }
                          )
                        }
                        sx={{
                          mt: 1,
                          bgcolor: "background.paper",
                          "& .MuiInputBase-input": {
                            textAlign: "center",
                          },
                          "& .MuiOutlinedInput-root": {
                            "&.Mui-focused fieldset": {
                              borderColor: "secondary.main",
                            },
                          },
                        }}
                        size="small"
                      />
                    </Fade>
                  ) : null;
                })()}
              </Box>

              <Box sx={{ px: 2, mb: 1.5 }}>
                <GenderIdentityPicker form={form} />
              </Box>

              <Box sx={{ px: 2, mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mb: 0.5,
                    fontWeight: 500,
                    color: "text.secondary",
                    textAlign: "center",
                  }}
                >
                  Age Demographics
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 1,
                    width: "100%",
                  }}
                >
                  {demographicData.ageRanges.map((demo) => {
                    const isSelected = (
                      audienceDetails.demographics?.age || []
                    ).includes(demo.range);

                    return (
                      <Box
                        key={demo.range}
                        onClick={() => handleToggleAgeRange(demo.range)}
                        sx={{
                          p: 1,
                          border: 1,
                          borderRadius: 1,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          bgcolor: isSelected
                            ? alpha(theme.palette.secondary.main, 0.2)
                            : theme.palette.background.paper,
                          borderColor: isSelected
                            ? alpha(theme.palette.secondary.dark, 0.3)
                            : theme.palette.divider,
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: isSelected
                              ? alpha(theme.palette.secondary.main, 0.3)
                              : alpha(theme.palette.secondary.main, 0.4),
                            borderColor: isSelected
                              ? theme.palette.secondary.main
                              : alpha(theme.palette.text.primary, 0.2),
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              color: isSelected
                                ? theme.palette.secondary.main
                                : theme.palette.text.primary,
                            }}
                          >
                            {demo.range}
                          </Typography>
                          {isSelected && (
                            <CheckIcon
                              fontSize="small"
                              sx={{
                                width: 16,
                                height: 16,
                                color: theme.palette.secondary.main,
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.7rem",
                            color: isSelected
                              ? alpha(theme.palette.secondary.main, 0.8)
                              : theme.palette.text.secondary,
                          }}
                        >
                          {demo.label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Box
                sx={{
                  py: 1.5,
                  bgcolor: theme.palette.background.paper,
                  border: "1px solid",
                  borderColor: "divider",
                  m: 2,
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mb: 0.5,
                    fontWeight: 500,
                    color: "text.secondary",
                    textAlign: "center",
                  }}
                >
                  Custom Age Range
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <TextField
                    type="number"
                    size="small"
                    value={
                      audienceDetails.demographics?.customAgeRange?.start || 20
                    }
                    onChange={(e) =>
                      form.setValue(
                        "audienceDetails.demographics.customAgeRange",
                        {
                          start: Number.parseInt(e.target.value),
                          end:
                            audienceDetails.demographics?.customAgeRange?.end ||
                            40,
                        },
                        { shouldDirty: true }
                      )
                    }
                    inputProps={{ min: 0, max: 100 }}
                    sx={{ width: 65, bgcolor: "background.paper" }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    to
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={
                      audienceDetails.demographics?.customAgeRange?.end || 40
                    }
                    onChange={(e) =>
                      form.setValue(
                        "audienceDetails.demographics.customAgeRange",
                        {
                          start:
                            audienceDetails.demographics?.customAgeRange
                              ?.start || 20,
                          end: Number.parseInt(e.target.value),
                        },
                        { shouldDirty: true }
                      )
                    }
                    inputProps={{ min: 0, max: 100 }}
                    sx={{ width: 65, bgcolor: "background.paper" }}
                  />
                </Box>
              </Box>
            </Box>
            <Box
              sx={{
                bgcolor: theme.palette.background.default,
                border: "1px solid",
                borderRadius: 1,
                borderColor: "divider",
                mt: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1.5,
                  pl: 1,
                  pr: 1,
                  pt: 1.5,
                }}
              >
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    height: 22,
                    width: 4,
                    background: (theme) =>
                      `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                    mr: 1,
                    borderRadius: 2,
                  }}
                />
                <Typography variant="subtitle2" fontWeight={500}>
                  Audience Psychology
                </Typography>
              </Box>
              <Box
                sx={{
                  mb: 1.5,
                  border: "1px solid",
                  borderRadius: 1,
                  borderColor: "divider",
                  p: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 500,
                      color: "text.secondary",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{
                        height: 18,
                        width: 4,
                        background: (theme) =>
                          `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                        mr: 0.5,
                        borderRadius: 2,
                      }}
                    />
                    Target Audience Persona
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.08)",
                      px: 1,
                      py: 0.25,
                      borderRadius: 5,
                      fontSize: "0.65rem",
                      color: "text.secondary",
                    }}
                  >
                    Who they are
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Describe your ideal audience persona (e.g., 'Tech-savvy professionals who value work-life balance')"
                  value={audienceDetails.audiencePersona || ""}
                  onChange={(e) =>
                    form.setValue(
                      "audienceDetails.audiencePersona",
                      e.target.value,
                      {
                        shouldDirty: true,
                      }
                    )
                  }
                  sx={{ bgcolor: "background.paper" }}
                />
              </Box>
              <Box
                sx={{
                  mb: 1.5,
                  border: "1px solid",
                  borderRadius: 1,
                  borderColor: "divider",
                  p: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 500,
                      color: "text.secondary",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{
                        height: 18,
                        width: 4,
                        background: (theme) =>
                          `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                        mr: 0.5,
                        borderRadius: 2,
                      }}
                    />
                    Psychographics
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.08)",
                      px: 1,
                      py: 0.25,
                      borderRadius: 5,
                      fontSize: "0.65rem",
                      color: "text.secondary",
                    }}
                  >
                    Traits & values
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={1}
                  placeholder="Describe your audience's values, interests, and behaviors"
                  value={audienceDetails.psychographics || ""}
                  onChange={(e) =>
                    form.setValue(
                      "audienceDetails.psychographics",
                      e.target.value,
                      {
                        shouldDirty: true,
                      }
                    )
                  }
                  sx={{ bgcolor: "background.paper" }}
                />
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr", // Two equal columns
                  gap: 2,
                  px: 1,
                  mb: 1.5,
                  width: "100%",
                }}
              >
                {/* Pain Points Section */}
                <Box
                  sx={{
                    p: 1,
                    border: "1px solid",
                    borderRadius: 1,
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      mb: 0.5,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 500,
                        color: "text.secondary",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        fontSize: "0.65rem",
                      }}
                    >
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          height: 16,
                          width: 4,
                          background: (theme) =>
                            `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                          mr: 0.25,
                          borderRadius: 2,
                        }}
                      />
                      Pain Points
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.08)",
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 5,
                        fontSize: "0.6rem",
                        color: "text.secondary",
                      }}
                    >
                      Challenges
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={2} // Increased from 1 to 2 for twice the height
                    placeholder="Describe specific problems or frustrations of the audience"
                    value={audienceDetails.painPoints || ""}
                    onChange={(e) =>
                      form.setValue(
                        "audienceDetails.painPoints",
                        e.target.value,
                        { shouldDirty: true }
                      )
                    }
                    sx={{
                      bgcolor: "background.paper",
                      "& .MuiInputBase-root": {
                        minHeight: "80px", // Additional height control
                      },
                    }}
                  />
                </Box>

                {/* Aspirations Section */}
                <Box
                  sx={{
                    p: 1,
                    border: "1px solid",
                    borderRadius: 1,
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      mb: 0.5,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 500,
                        color: "text.secondary",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        fontSize: "0.65rem",
                      }}
                    >
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          height: 16,
                          width: 4,
                          background: (theme) =>
                            `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                          mr: 0.25,
                          borderRadius: 2,
                        }}
                      />
                      Aspirations
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.08)",
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 5,
                        fontSize: "0.6rem",
                        color: "text.secondary",
                      }}
                    >
                      Goals
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={2} // Increased from 1 to 2 for twice the height
                    placeholder="Describe hopes, dreams, or desired future states of the audience"
                    value={audienceDetails.aspirations || ""}
                    onChange={(e) =>
                      form.setValue(
                        "audienceDetails.aspirations",
                        e.target.value,
                        { shouldDirty: true }
                      )
                    }
                    sx={{
                      bgcolor: "background.paper",
                      "& .MuiInputBase-root": {
                        minHeight: "80px", // Additional height control
                      },
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ px: 2, mb: 2 }}>
                <Box
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    bgcolor: "background.paper",
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() =>
                      setCurrentPanel(
                        currentPanel === "interests" ? "" : "interests"
                      )
                    }
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 500,
                        color: "text.secondary",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          height: 16,
                          width: 4,
                          background: (theme) =>
                            `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                          mr: 0.5,
                          borderRadius: 2,
                        }}
                      />
                      Interests & Activities
                    </Typography>
                    <IconButton size="small" sx={{ color: "text.secondary" }}>
                      {currentPanel === "interests" ? (
                        <ChevronUpIcon fontSize="small" />
                      ) : (
                        <ChevronDownIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Box>

                  <Collapse in={currentPanel === "interests"}>
                    <Box sx={{ p: 1.5 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="List key hobbies, activities, or interests of your target audience"
                        value={audienceDetails.interestActivities || ""}
                        onChange={(e) =>
                          form.setValue(
                            "audienceDetails.interestActivities",
                            e.target.value,
                            {
                              shouldDirty: true,
                            }
                          )
                        }
                        sx={{ bgcolor: "background.paper" }}
                      />
                    </Box>
                  </Collapse>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Right Column */}
        <Box sx={{ width: { xs: "100%", md: "50%" }, pl: { xs: 0, md: 1.5 } }}>
          <Paper
            elevation={0}
            sx={{
              p: 0,
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              bgcolor: theme.palette.background.default,
              border: 0,
              borderRadius: 1,
              boxSizing: "border-box",
              width: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 1.5,
                pl: 1,
                pr: 2,
                pt: 1.5,
              }}
            >
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  height: 22,
                  width: 4,
                  background: (theme) =>
                    `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                  mr: 1,
                  borderRadius: 2,
                }}
              />
              <Typography variant="subtitle2" fontWeight={500}>
                Emotional Tone
              </Typography>
            </Box>

            {/* Currently selecting indicator */}
            <Box sx={{ px: 2, mb: 2, width: "100%", boxSizing: "border-box" }}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.primary"
                    fontWeight={400}
                  >
                    Currently selecting:
                  </Typography>
                  <Typography
                    variant="caption"
                    color="secondary.main"
                    fontWeight={600}
                  >
                    {emotionSelectionMode === "start"
                      ? "Starting Emotion"
                      : emotionSelectionMode === "middle"
                      ? "Middle Emotion"
                      : "Ending Emotion"}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    mt: 1,
                    height: 3,
                    bgcolor: "divider",
                    borderRadius: 5,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      height: "100%",
                      bgcolor: "secondary.main",
                      borderRadius: 5,
                      transition: "width 0.3s ease-in-out",
                    }}
                    style={{
                      width: `${
                        (audienceDetails.emotionalTone?.emotionalArc?.length ||
                          0) === 0
                          ? 0
                          : (audienceDetails.emotionalTone?.emotionalArc
                              ?.length || 0) === 1
                          ? 33
                          : (audienceDetails.emotionalTone?.emotionalArc
                              ?.length || 0) === 2
                          ? 66
                          : 100
                      }%`,
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Emotion Wheel */}
            <Box
              sx={{
                px: 2,
                mb: 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <EmotionWheel
                selectedEmotion={
                  audienceDetails.emotionalTone?.emotionList?.length
                    ? audienceDetails.emotionalTone.emotionList[
                        audienceDetails.emotionalTone.emotionList.length - 1
                      ]
                    : ""
                }
                onSelectEmotion={handleEmotionSelect}
              />
            </Box>

            {/* Selected Emotion Display */}
            <Box sx={{ px: 2, mb: 2, width: "100%", boxSizing: "border-box" }}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  textAlign: "center",
                  minHeight: 60,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="secondary.main"
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    overflowWrap: "break-word",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    fontSize: "0.875rem",
                    lineHeight: 1.2,
                  }}
                >
                  {audienceDetails.emotionalTone?.emotionList?.length
                    ? audienceDetails.emotionalTone.emotionList[
                        audienceDetails.emotionalTone.emotionList.length - 1
                      ]
                        .charAt(0)
                        .toUpperCase() +
                      audienceDetails.emotionalTone.emotionList[
                        audienceDetails.emotionalTone.emotionList.length - 1
                      ].slice(1)
                    : "No emotion selected"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.primary"
                  sx={{
                    overflowWrap: "break-word",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    fontSize: "0.625rem",
                    lineHeight: 1.1,
                  }}
                >
                  {(() => {
                    // Safely access the latest emotion
                    const emotionList =
                      audienceDetails.emotionalTone?.emotionList;
                    const latestEmotion =
                      emotionList && emotionList.length > 0
                        ? emotionList[emotionList.length - 1]
                        : null;

                    // Find the description for the emotion
                    return latestEmotion
                      ? demographicData.emotionSegments.find(
                          (e) => e.emotion === latestEmotion
                        )?.description ||
                          "Select an emotion to see its description"
                      : "Select an emotion to see its description";
                  })()}
                </Typography>
              </Box>
            </Box>

            {/* Emotion Intensity Slider */}
            <Box sx={{ px: 2, mb: 2, width: "100%", boxSizing: "border-box" }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  display: "block",
                  color: "text.secondary",
                  textAlign: "center",
                }}
              >
                Emotion Intensity
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight="600"
                >
                  Subtle
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight="600"
                >
                  Intense
                </Typography>
              </Box>
              <Slider
                value={audienceDetails.emotionalTone.emotionIntensity || 60}
                onChange={handleEmotionIntensityChange}
                min={0}
                max={100}
                sx={{
                  color: "secondary.main",
                  height: 3,
                  width: "100%",
                  boxSizing: "border-box",
                  "& .MuiSlider-thumb": {
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    transition: "all 0.2s ease-in-out",
                    "&:hover, &.Mui-active": {
                      boxShadow: `0px 0px 0px 8px ${theme.palette.secondary.main}26`,
                    },
                  },
                  "& .MuiSlider-rail": {
                    opacity: 0.3,
                    backgroundColor: "secondary.main",
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  textAlign: "center",
                  mt: 1,
                  color: "secondary.main",
                }}
              >
                {audienceDetails.emotionalTone.emotionIntensity || 60}%
              </Typography>
            </Box>

            {/* Emotional Arc */}
            <EmotionalArc
              form={form}
              audience={audienceDetails}
              resetEmotions={resetEmotions}
              removeEmotion={removeEmotion}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              handleDragEnd={handleDragEnd}
              isDraggingEmotion={isDraggingEmotion}
              dragOverIndex={dragOverIndex}
              getEmotionColor={getEmotionColor}
            />
          </Paper>
        </Box>
      </Box>
    </Paper>
  );
};

export default AudienceDetailsSection;
