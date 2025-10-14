// src/components/aiScriptGen/components/CampaignDetailsSection.tsx
"use client";

import { useState, useCallback, useMemo, JSX } from "react";
import {
  Box,
  Typography,
  TextField,
  Chip,
  Button,
  Paper,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Add } from "@mui/icons-material";
import type { FormValues } from "../types";
import SectionCloseButton from "./SectionCloseButton";
import { getCurrentBrand } from "@/config/brandConfig";

interface CampaignDetailsSectionProps {
  form: UseFormReturn<FormValues>;
}

type CampaignField = "objectives" | "keyMessages";

const CampaignDetailsSection = ({
  form,
}: CampaignDetailsSectionProps): JSX.Element => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { control, watch, setValue } = form;

  // State
  const [newObjective, setNewObjective] = useState("");
  const [newKeyMessage, setNewKeyMessage] = useState("");

  // Memoize static goal options
  const goals = useMemo(
    () => ["Brand Awareness", "Lead Generation", "Sales", "Engagement"],
    []
  );

  // Watch form values
  const campaign = watch("campaignDetails") || {};

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
  const handleAddTag = useCallback(
    (
      field: CampaignField,
      value: string,
      setter: (val: string) => void
    ): void => {
      if (!value.trim()) return;
      const current = campaign[field] || [];
      setValue(`campaignDetails.${field}`, [...current, value.trim()]);
      setter("");
    },
    [campaign, setValue]
  );

  const handleRemoveTag = useCallback(
    (field: CampaignField, index: number): void => {
      const current = campaign[field] || [];
      setValue(
        `campaignDetails.${field}`,
        current.filter((_: string, i: number) => i !== index)
      );
    },
    [campaign, setValue]
  );

  const handleGoalSelect = useCallback(
    (goal: string): void => {
      setValue("campaignDetails.campaignGoal", goal);
    },
    [setValue]
  );

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLDivElement>,
      field: CampaignField,
      value: string,
      setter: (val: string) => void
    ): void => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag(field, value, setter);
      }
    },
    [handleAddTag]
  );

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
          mb: 2,
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
          Campaign Details
        </Typography>
        <SectionCloseButton
          sectionId="campaign"
          sx={{ position: "absolute", right: 12 }}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        {/* Campaign Name */}
        <Box>
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              mb: 1,
              display: "block",
              fontFamily: brand.fonts.body,
            }}
          >
            Campaign Name
          </Typography>
          <Controller
            name="campaignDetails.campaignName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                placeholder="Enter campaign name"
                size="small"
                sx={{
                  bgcolor: "background.default",
                  "& .MuiOutlinedInput-root": {
                    color: "text.primary",
                    fontFamily: brand.fonts.body,
                  },
                }}
              />
            )}
          />
        </Box>

        {/* Campaign Goal */}
        <Box>
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              mb: 1,
              display: "block",
              fontFamily: brand.fonts.body,
            }}
          >
            Campaign Goal
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {goals.map((goal) => {
              const isSelected = campaign.campaignGoal === goal;
              return (
                <Button
                  key={goal}
                  variant={isSelected ? "contained" : "outlined"}
                  size="small"
                  onClick={() => handleGoalSelect(goal)}
                  sx={{
                    bgcolor: isSelected
                      ? alpha(theme.palette.primary.main, 0.2)
                      : "transparent",
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
                    textTransform: "none",
                    fontSize: "0.75rem",
                    py: 0.5,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {goal}
                </Button>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Objectives & Key Messages */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          bgcolor: "background.default",
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        {/* Objectives */}
        <Box>
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              mb: 1,
              display: "block",
              fontFamily: brand.fonts.body,
            }}
          >
            Objectives
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
            {(campaign.objectives || []).map((item: string, i: number) => (
              <Chip
                key={i}
                label={item}
                onDelete={() => handleRemoveTag("objectives", i)}
                size="small"
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
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add objective"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              onKeyDown={(e) =>
                handleKeyDown(e, "objectives", newObjective, setNewObjective)
              }
              sx={{
                bgcolor: "background.paper",
                "& .MuiOutlinedInput-root": {
                  color: "text.primary",
                  fontFamily: brand.fonts.body,
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={!newObjective.trim()}
              onClick={() =>
                handleAddTag("objectives", newObjective, setNewObjective)
              }
              sx={{
                minWidth: 40,
                fontFamily: brand.fonts.body,
              }}
            >
              <Add fontSize="small" />
            </Button>
          </Box>
        </Box>

        {/* Key Messages */}
        <Box>
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              mb: 1,
              display: "block",
              fontFamily: brand.fonts.body,
            }}
          >
            Key Messages
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
            {(campaign.keyMessages || []).map((item: string, i: number) => (
              <Chip
                key={i}
                label={item}
                onDelete={() => handleRemoveTag("keyMessages", i)}
                size="small"
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
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add key message"
              value={newKeyMessage}
              onChange={(e) => setNewKeyMessage(e.target.value)}
              onKeyDown={(e) =>
                handleKeyDown(e, "keyMessages", newKeyMessage, setNewKeyMessage)
              }
              sx={{
                bgcolor: "background.paper",
                "& .MuiOutlinedInput-root": {
                  color: "text.primary",
                  fontFamily: brand.fonts.body,
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={!newKeyMessage.trim()}
              onClick={() =>
                handleAddTag("keyMessages", newKeyMessage, setNewKeyMessage)
              }
              sx={{
                minWidth: 40,
                fontFamily: brand.fonts.body,
              }}
            >
              <Add fontSize="small" />
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Additional Campaign Details */}
      <Box sx={{ mt: 3 }}>
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{
            mb: 1,
            display: "block",
            fontFamily: brand.fonts.body,
          }}
        >
          Offer / Promotion Details
        </Typography>
        <Controller
          name="campaignDetails.additionalDetails.offerPromotionDetails"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              minRows={2}
              placeholder="Enter offer, discount, deadline etc."
              sx={{
                bgcolor: "background.default",
                "& .MuiOutlinedInput-root": {
                  color: "text.primary",
                  fontFamily: brand.fonts.body,
                },
              }}
            />
          )}
        />

        <Typography
          variant="caption"
          fontWeight={600}
          sx={{
            mb: 1,
            mt: 3,
            display: "block",
            fontFamily: brand.fonts.body,
          }}
        >
          Mandatories / Legal Disclaimers
        </Typography>
        <Controller
          name="campaignDetails.additionalDetails.mandatoriesLegalDisclaimers"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              minRows={2}
              placeholder="Logos, legal lines, audio cues etc."
              sx={{
                bgcolor: "background.default",
                "& .MuiOutlinedInput-root": {
                  color: "text.primary",
                  fontFamily: brand.fonts.body,
                },
              }}
            />
          )}
        />
      </Box>
    </Paper>
  );
};

CampaignDetailsSection.displayName = "CampaignDetailsSection";

export default CampaignDetailsSection;
