// src/components/aiScriptGen/components/AudienceDetailsSection.tsx
"use client";

import { useState, useCallback, useMemo, JSX } from "react";
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
import { type UseFormReturn } from "react-hook-form";
import type { FormValues } from "../types";
import EmotionWheel from "./EmotionWheel";
import GenderIdentityPicker from "./GenderIdentityPicker";
import EmotionalArc from "./EmotionalArc";
import { demographicData } from "../data/demographicData";
import SectionCloseButton from "./SectionCloseButton";
import { getCurrentBrand } from "@/config/brandConfig";

interface AudienceDetailsSectionProps {
  form: UseFormReturn<FormValues>;
}

type EmotionSelectionMode = "start" | "middle" | "end";

const AudienceDetailsSection = ({
  form,
}: AudienceDetailsSectionProps): JSX.Element => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // State
  const [currentPanel, setCurrentPanel] = useState("");
  const [emotionSelectionMode, setEmotionSelectionMode] =
    useState<EmotionSelectionMode>("start");
  const [isDraggingEmotion, setIsDraggingEmotion] = useState<number | null>(
    null
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Watch form values
  const audienceDetails = form.watch("audienceDetails") || {};

  // Memoize static data
  const sexOptions = useMemo(() => demographicData.sexOptions, []);
  const ageRanges = useMemo(() => demographicData.ageRanges, []);
  const emotionSegments = useMemo(() => demographicData.emotionSegments, []);

  // Memoize divider gradient
  const dividerGradient = useMemo(
    () =>
      `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.6)}, ${alpha(
        theme.palette.primary.main,
        0.25
      )})`,
    [theme.palette.primary.main]
  );

  // Handlers
  const handleToggleAgeRange = useCallback(
    (range: string): void => {
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
          { shouldDirty: true }
        );
      }
    },
    [audienceDetails.demographics?.age, form]
  );

  const handleEmotionSelect = useCallback(
    (emotion: string): void => {
      const currentEmotionList =
        audienceDetails.emotionalTone?.emotionList || [];
      form.setValue(
        "audienceDetails.emotionalTone.emotionList",
        [...currentEmotionList, emotion].slice(-3),
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
    },
    [audienceDetails, emotionSelectionMode, form]
  );

  const handleEmotionIntensityChange = useCallback(
    (_event: Event, newValue: number | number[]): void => {
      form.setValue(
        "audienceDetails.emotionalTone.emotionIntensity",
        typeof newValue === "number" ? newValue : newValue[0],
        { shouldDirty: true }
      );
    },
    [form]
  );

  const handleDragStart = useCallback((index: number): void => {
    setIsDraggingEmotion(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number): void => {
      e.preventDefault();
      setDragOverIndex(index);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, index: number): void => {
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
    },
    [isDraggingEmotion, audienceDetails, form]
  );

  const handleDragEnd = useCallback((): void => {
    setIsDraggingEmotion(null);
    setDragOverIndex(null);
  }, []);

  const removeEmotion = useCallback(
    (index: number): void => {
      const currentEmotions = audienceDetails.emotionalTone.emotionalArc || [];
      const newEmotions = currentEmotions.filter((_, i) => i !== index);

      form.setValue("audienceDetails.emotionalTone.emotionalArc", newEmotions, {
        shouldDirty: true,
      });

      if (newEmotions.length === 0) setEmotionSelectionMode("start");
      else if (newEmotions.length === 1) setEmotionSelectionMode("middle");
      else setEmotionSelectionMode("end");
    },
    [audienceDetails, form]
  );

  const resetEmotions = useCallback((): void => {
    form.setValue("audienceDetails.emotionalTone.emotionalArc", [], {
      shouldDirty: true,
    });
    form.setValue("audienceDetails.emotionalTone.emotionList", [], {
      shouldDirty: true,
    });
    setEmotionSelectionMode("start");
  }, [form]);

  const getEmotionColor = useCallback(
    (emotion: string): string => {
      const emotionSegment = emotionSegments.find(
        (segment) => segment.emotion === emotion
      );
      return emotionSegment ? emotionSegment.color1 : "#FFFFFF";
    },
    [emotionSegments]
  );

  const handleToggleSex = useCallback(
    (sexId: string): void => {
      const currentSelectedSex = audienceDetails.demographics?.sex || [];
      const currentSexArray = Array.isArray(currentSelectedSex)
        ? currentSelectedSex
        : currentSelectedSex
          ? [currentSelectedSex]
          : [];

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
    },
    [audienceDetails.demographics?.sex, form]
  );

  const togglePanel = useCallback(
    (panel: string): void => {
      setCurrentPanel(currentPanel === panel ? "" : panel);
    },
    [currentPanel]
  );

  // Compute emotion arc progress percentage
  const emotionArcProgress = useMemo(() => {
    const length = audienceDetails.emotionalTone?.emotionalArc?.length || 0;
    if (length === 0) return 0;
    if (length === 1) return 33;
    if (length === 2) return 66;
    return 100;
  }, [audienceDetails.emotionalTone?.emotionalArc]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: `${brand.borderRadius}px`,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        mb: 4,
        position: "relative",
        width: "100%",
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
          Audience Details
        </Typography>
      </Box>

      {/* Main Container */}
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
              bgcolor: "background.paper",
              border: 0,
              borderRadius: `${brand.borderRadius}px`,
              boxSizing: "border-box",
              width: "100%",
            }}
          >
            {/* Demographics Section */}
            <Box
              sx={{
                bgcolor: "background.default",
                border: "1px solid",
                borderRadius: `${brand.borderRadius}px`,
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
                    background: dividerGradient,
                    mr: 1,
                    borderRadius: 2,
                  }}
                />
                <Typography
                  variant="subtitle2"
                  fontWeight={500}
                  sx={{ fontFamily: brand.fonts.heading }}
                >
                  Demographics
                </Typography>
              </Box>

              {/* Sex Selection */}
              <Box sx={{ px: 2, mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mb: 0.5,
                    fontWeight: 500,
                    color: "text.secondary",
                    textAlign: "center",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  Sex
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {sexOptions.map((option) => {
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
                          borderStyle: "solid",
                          bgcolor: isSelected
                            ? alpha(theme.palette.primary.main, 0.2)
                            : "transparent",
                          borderColor: isSelected
                            ? alpha(theme.palette.primary.dark, 0.3)
                            : "divider",
                          color: isSelected ? "primary.main" : "text.primary",
                          "&:hover": {
                            bgcolor: isSelected
                              ? "primary.main"
                              : "action.hover",
                            color: isSelected
                              ? "primary.contrastText"
                              : "text.primary",
                          },
                          textTransform: "none",
                          py: 0.1,
                          fontSize: "0.80rem",
                          fontFamily: brand.fonts.body,
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
                            { shouldDirty: true }
                          )
                        }
                        sx={{
                          mt: 1,
                          bgcolor: "background.paper",
                          "& .MuiInputBase-input": {
                            textAlign: "center",
                            fontFamily: brand.fonts.body,
                          },
                          "& .MuiOutlinedInput-root": {
                            "&.Mui-focused fieldset": {
                              borderColor: "primary.main",
                            },
                          },
                        }}
                        size="small"
                      />
                    </Fade>
                  ) : null;
                })()}
              </Box>

              {/* Gender Identity Picker */}
              <Box sx={{ px: 2, mb: 1.5 }}>
                <GenderIdentityPicker form={form} />
              </Box>

              {/* Age Demographics */}
              <Box sx={{ px: 2, mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mb: 0.5,
                    fontWeight: 500,
                    color: "text.secondary",
                    textAlign: "center",
                    fontFamily: brand.fonts.body,
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
                  {ageRanges.map((demo) => {
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
                          borderRadius: `${brand.borderRadius}px`,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          bgcolor: isSelected
                            ? alpha(theme.palette.primary.main, 0.2)
                            : "background.paper",
                          borderColor: isSelected
                            ? alpha(theme.palette.primary.dark, 0.3)
                            : "divider",
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: isSelected
                              ? "primary.main"
                              : alpha(theme.palette.primary.main, 0.1),
                            borderColor: isSelected
                              ? "primary.dark"
                              : alpha(theme.palette.primary.main, 0.3),
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
                                ? "primary.main"
                                : "text.primary",
                              fontFamily: brand.fonts.body,
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
                                color: "primary.main",
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.7rem",
                            color: isSelected
                              ? alpha(theme.palette.primary.main, 0.8)
                              : "text.secondary",
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          {demo.label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* Custom Age Range */}
              <Box
                sx={{
                  py: 1.5,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  m: 2,
                  borderRadius: `${brand.borderRadius}px`,
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
                    fontFamily: brand.fonts.body,
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
                    sx={{
                      width: 65,
                      bgcolor: "background.paper",
                      "& .MuiInputBase-input": {
                        fontFamily: brand.fonts.body,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
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
                    sx={{
                      width: 65,
                      bgcolor: "background.paper",
                      "& .MuiInputBase-input": {
                        fontFamily: brand.fonts.body,
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Audience Psychology Section */}
            <Box
              sx={{
                bgcolor: "background.default",
                border: "1px solid",
                borderRadius: `${brand.borderRadius}px`,
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
                    background: dividerGradient,
                    mr: 1,
                    borderRadius: 2,
                  }}
                />
                <Typography
                  variant="subtitle2"
                  fontWeight={500}
                  sx={{ fontFamily: brand.fonts.heading }}
                >
                  Audience Psychology
                </Typography>
              </Box>

              {/* Target Audience Persona */}
              <Box
                sx={{
                  mb: 1.5,
                  border: "1px solid",
                  borderRadius: `${brand.borderRadius}px`,
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
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{
                        height: 18,
                        width: 4,
                        background: dividerGradient,
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
                      fontFamily: brand.fonts.body,
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
                      { shouldDirty: true }
                    )
                  }
                  sx={{
                    bgcolor: "background.paper",
                    "& .MuiInputBase-input": {
                      fontFamily: brand.fonts.body,
                    },
                  }}
                />
              </Box>

              {/* Psychographics */}
              <Box
                sx={{
                  mb: 1.5,
                  border: "1px solid",
                  borderRadius: `${brand.borderRadius}px`,
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
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{
                        height: 18,
                        width: 4,
                        background: dividerGradient,
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
                      fontFamily: brand.fonts.body,
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
                      { shouldDirty: true }
                    )
                  }
                  sx={{
                    bgcolor: "background.paper",
                    "& .MuiInputBase-input": {
                      fontFamily: brand.fonts.body,
                    },
                  }}
                />
              </Box>

              {/* Pain Points & Aspirations Grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                  px: 1,
                  mb: 1.5,
                  width: "100%",
                }}
              >
                {/* Pain Points */}
                <Box
                  sx={{
                    p: 1,
                    border: "1px solid",
                    borderRadius: `${brand.borderRadius}px`,
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
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          height: 16,
                          width: 4,
                          background: dividerGradient,
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
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      Challenges
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Describe specific problems or frustrations of the audience"
                    value={audienceDetails.painPoints || ""}
                    onChange={(e) =>
                      form.setValue(
                        "audienceDetails.painPoints",
                        e.target.value,
                        {
                          shouldDirty: true,
                        }
                      )
                    }
                    sx={{
                      bgcolor: "background.paper",
                      "& .MuiInputBase-root": {
                        minHeight: "80px",
                      },
                      "& .MuiInputBase-input": {
                        fontFamily: brand.fonts.body,
                      },
                    }}
                  />
                </Box>

                {/* Aspirations */}
                <Box
                  sx={{
                    p: 1,
                    border: "1px solid",
                    borderRadius: `${brand.borderRadius}px`,
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
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          height: 16,
                          width: 4,
                          background: dividerGradient,
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
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      Goals
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Describe hopes, dreams, or desired future states of the audience"
                    value={audienceDetails.aspirations || ""}
                    onChange={(e) =>
                      form.setValue(
                        "audienceDetails.aspirations",
                        e.target.value,
                        {
                          shouldDirty: true,
                        }
                      )
                    }
                    sx={{
                      bgcolor: "background.paper",
                      "& .MuiInputBase-root": {
                        minHeight: "80px",
                      },
                      "& .MuiInputBase-input": {
                        fontFamily: brand.fonts.body,
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Interests & Activities (Collapsible) */}
              <Box sx={{ px: 2, mb: 2 }}>
                <Box
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: `${brand.borderRadius}px`,
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
                    onClick={() => togglePanel("interests")}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 500,
                        color: "text.secondary",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          height: 16,
                          width: 4,
                          background: dividerGradient,
                          mr: 0.5,
                          borderRadius: 2,
                        }}
                      />
                      Interests & Activities
                    </Typography>
                    <IconButton
                      size="small"
                      color="primary"
                      sx={{ color: "text.secondary" }}
                    >
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
                            { shouldDirty: true }
                          )
                        }
                        sx={{
                          bgcolor: "background.paper",
                          "& .MuiInputBase-input": {
                            fontFamily: brand.fonts.body,
                          },
                        }}
                      />
                    </Box>
                  </Collapse>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Right Column - Emotional Tone */}
        <Box sx={{ width: { xs: "100%", md: "50%" }, pl: { xs: 0, md: 1.5 } }}>
          <Paper
            elevation={0}
            sx={{
              p: 0,
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.default",
              border: 0,
              borderRadius: `${brand.borderRadius}px`,
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
                  background: dividerGradient,
                  mr: 1,
                  borderRadius: 2,
                }}
              />
              <Typography
                variant="subtitle2"
                fontWeight={500}
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Emotional Tone
              </Typography>
            </Box>

            {/* Currently selecting indicator */}
            <Box sx={{ px: 2, mb: 2, width: "100%", boxSizing: "border-box" }}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: "background.paper",
                  borderRadius: `${brand.borderRadius}px`,
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
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Currently selecting:
                  </Typography>
                  <Typography
                    variant="caption"
                    color="primary.main"
                    fontWeight={600}
                    sx={{ fontFamily: brand.fonts.body }}
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
                      bgcolor: "primary.main",
                      borderRadius: 5,
                      transition: "width 0.3s ease-in-out",
                      width: `${emotionArcProgress}%`,
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
                  borderRadius: `${brand.borderRadius}px`,
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
                  color="primary.main"
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
                    fontFamily: brand.fonts.heading,
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
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {(() => {
                    const emotionList =
                      audienceDetails.emotionalTone?.emotionList;
                    const latestEmotion =
                      emotionList && emotionList.length > 0
                        ? emotionList[emotionList.length - 1]
                        : null;

                    return latestEmotion
                      ? emotionSegments.find((e) => e.emotion === latestEmotion)
                          ?.description ||
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
                  fontFamily: brand.fonts.body,
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
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Subtle
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight="600"
                  sx={{ fontFamily: brand.fonts.body }}
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
                  color: "primary.main",
                  height: 8,
                  width: "100%",
                  boxSizing: "border-box",
                  "& .MuiSlider-track": {
                    border: "none",
                    height: 8,
                  },
                  "& .MuiSlider-rail": {
                    height: 8,
                    opacity: 0.5,
                    backgroundColor: theme.palette.divider,
                  },
                  "& .MuiSlider-thumb": {
                    width: 18,
                    height: 18,
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
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  textAlign: "center",
                  mt: 1,
                  color: "primary.main",
                  fontFamily: brand.fonts.body,
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

AudienceDetailsSection.displayName = "AudienceDetailsSection";

export default AudienceDetailsSection;
