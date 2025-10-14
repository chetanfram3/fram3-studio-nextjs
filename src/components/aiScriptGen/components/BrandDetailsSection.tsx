import React, { useState } from "react";
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
import { Controller, UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";
import SectionCloseButton from "./SectionCloseButton";

interface BrandDetailsSectionProps {
  form: UseFormReturn<FormValues>;
}

const voiceOptions = [
  "Professional",
  "Playful",
  "Authoritative",
  "Friendly",
  "Casual",
  "Formal",
];

const strategyOptions = [
  "Highlight superior features",
  "Ignore competitors completely",
  "Address competitor weakness subtly",
  "Position as premium alternative",
  "Position as value alternative",
];

const BrandDetailsSection: React.FC<BrandDetailsSectionProps> = ({ form }) => {
  const { control, watch, setValue } = form;

  const [activeTab, setActiveTab] = useState(0);
  const [newValue, setNewValue] = useState("");
  const [newTone, setNewTone] = useState("");

  const vision = watch("brandDetails.identity.visionStatement");
  const mission = watch("brandDetails.identity.missionStatement");
  const values = watch("brandDetails.brandValues") || [];
  const selectedVoice = watch("brandDetails.voiceAndTone.brandVoice");
  const toneKeywords = watch("brandDetails.voiceAndTone.toneKeywords") || [];
  const competitorNotes = watch(
    "brandDetails.competitiveAnalysis.competitorNotes"
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedStrategy = watch(
    "brandDetails.competitiveAnalysis.competitiveStrategy"
  );

  const handleAddValue = () => {
    if (!newValue.trim()) return;
    setValue("brandDetails.brandValues", [...values, newValue.trim()]);
    setNewValue("");
  };

  const handleAddTone = () => {
    if (!newTone.trim()) return;
    setValue("brandDetails.voiceAndTone.toneKeywords", [
      ...toneKeywords,
      newTone.trim(),
    ]);
    setNewTone("");
  };

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 1,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
      }}
    >
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
            background: (theme) =>
              `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
            mr: 2,
            borderRadius: 2,
          }}
        />
        <Typography variant="h5" fontWeight={600}>
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
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
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
              background: (theme) =>
                `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
              mr: 1,
              borderRadius: 2,
            }}
          />
          <Typography variant="subtitle1" fontWeight={600}>
            Brand Identity
          </Typography>
        </Box>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          textColor="secondary"
          indicatorColor="secondary"
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
                sx={{ mt: 2 }}
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
                sx={{ mt: 2 }}
              />
            )}
          />
        )}

        <Typography
          variant="subtitle1"
          fontWeight={600}
          textAlign={"center"}
          sx={{ mt: 3, display: "block" }}
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
          />
          <Button
            onClick={handleAddValue}
            variant="contained"
            sx={{
              bgcolor: "secondary.main",
              "&:hover": { bgcolor: "secondary.dark" },
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
              onDelete={() => {
                const newValues = [...values];
                newValues.splice(index, 1);
                setValue("brandDetails.brandValues", newValues);
              }}
              sx={{
                bgcolor: "secondary.main",
                color: "secondary.contrastText",
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Voice & Tone */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
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
              background: (theme) =>
                `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
              mr: 1,
              borderRadius: 2,
            }}
          />
          <Typography variant="subtitle1" fontWeight={600}>
            Voice & Tone
          </Typography>
        </Box>

        <Typography
          variant="subtitle2"
          fontWeight={600}
          textAlign={"center"}
          sx={{ mb: 1, display: "block" }}
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
          {voiceOptions.map((option) => (
            <Button
              key={option}
              variant={selectedVoice === option ? "contained" : "outlined"}
              onClick={() =>
                setValue("brandDetails.voiceAndTone.brandVoice", option)
              }
              sx={{
                bgcolor:
                  selectedVoice === option
                    ? (theme) => alpha(theme.palette.secondary.main, 0.2)
                    : "background.paper",
                borderColor:
                  selectedVoice === option
                    ? (theme) => alpha(theme.palette.secondary.dark, 0.3)
                    : "divider",
                color:
                  selectedVoice === option ? "secondary.main" : "text.primary",
                "&:hover": {
                  bgcolor:
                    selectedVoice === option
                      ? "secondary.main"
                      : "action.hover",
                  color:
                    selectedVoice === option
                      ? "secondary.contrastText"
                      : "text.primary",
                },
                textTransform: "none",
                py: 0.8,
                fontSize: "0.95rem",
              }}
            >
              {option}
            </Button>
          ))}
        </Box>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          textAlign={"center"}
          sx={{ mb: 1, display: "block" }}
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
          />
          <Button
            onClick={handleAddTone}
            variant="contained"
            sx={{
              bgcolor: "secondary.main",
              "&:hover": { bgcolor: "secondary.dark" },
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
              onDelete={() => {
                const newKeywords = [...toneKeywords];
                newKeywords.splice(index, 1);
                setValue("brandDetails.voiceAndTone.toneKeywords", newKeywords);
              }}
              sx={{
                bgcolor: "secondary.main",
                color: "secondary.contrastText",
              }}
            />
          ))}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
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
                background: (theme) =>
                  `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                mr: 1,
                borderRadius: 2,
              }}
            />
            <Typography variant="subtitle1" fontWeight={600}>
              Competitive Analysis
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{ ml: 1, color: "text.secondary" }}
          >
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </IconButton>
        </Box>

        <Collapse in={isExpanded}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            textAlign={"center"}
            sx={{ mb: 1, display: "block" }}
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
              />
            )}
          />

          <Typography
            variant="subtitle1"
            textAlign={"center"}
            fontWeight={600}
            sx={{ mt: 2, mb: 1, display: "block" }}
          >
            Competitive Strategy
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {strategyOptions.map((option) => (
              <Button
                key={option}
                fullWidth
                variant={selectedStrategy === option ? "contained" : "outlined"}
                onClick={() =>
                  setValue(
                    "brandDetails.competitiveAnalysis.competitiveStrategy",
                    option
                  )
                }
                sx={{
                  textTransform: "none",
                  justifyContent: "flex-start",
                  bgcolor:
                    selectedStrategy === option
                      ? (theme) => alpha(theme.palette.secondary.main, 0.2)
                      : "background.paper",
                  borderColor:
                    selectedStrategy === option
                      ? (theme) => alpha(theme.palette.secondary.dark, 0.3)
                      : "divider",
                  color:
                    selectedStrategy === option
                      ? "secondary.main"
                      : "text.primary",
                  "&:hover": {
                    bgcolor:
                      selectedStrategy === option
                        ? "secondary.main"
                        : "action.hover",
                    color:
                      selectedStrategy === option
                        ? "secondary.contrastText"
                        : "text.primary",
                  },
                  py: 0.5,
                  fontSize: "1rem",
                }}
              >
                {option}
              </Button>
            ))}
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

export default BrandDetailsSection;
