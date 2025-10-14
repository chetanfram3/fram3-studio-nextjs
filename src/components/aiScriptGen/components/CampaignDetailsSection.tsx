import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Chip,
  Button,
  Paper,
  Divider,
} from "@mui/material";
import { Controller, UseFormReturn } from "react-hook-form";
import { Add } from "@mui/icons-material";
import { FormValues } from "../types";
import SectionCloseButton from "./SectionCloseButton";

interface Props {
  form: UseFormReturn<FormValues>;
}

const goals = ["Brand Awareness", "Lead Generation", "Sales", "Engagement"];

const CampaignDetailsSection: React.FC<Props> = ({ form }) => {
  const { control, watch, setValue } = form;
  const campaign = watch("campaignDetails") || {};
  const [newObjective, setNewObjective] = useState("");
  const [newKeyMessage, setNewKeyMessage] = useState("");

  const handleAddTag = (
    field: "objectives" | "keyMessages",
    value: string,
    setter: (val: string) => void
  ) => {
    if (!value.trim()) return;
    const current = campaign[field] || [];
    setValue(`campaignDetails.${field}`, [...current, value.trim()]);
    setter("");
  };

  const handleRemoveTag = (
    field: "objectives" | "keyMessages",
    index: number
  ) => {
    const current = campaign[field] || [];
    setValue(
      `campaignDetails.${field}`,
      current.filter((_: any, i: number) => i !== index)
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
          mb: 2,
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
            sx={{ mb: 1, display: "block" }}
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
            sx={{ mb: 1, display: "block" }}
          >
            Campaign Goal
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {goals.map((goal) => (
              <Button
                key={goal}
                variant={
                  campaign.campaignGoal === goal ? "contained" : "outlined"
                }
                size="small"
                onClick={() => setValue("campaignDetails.campaignGoal", goal)}
                sx={{
                  bgcolor:
                    campaign.campaignGoal === goal
                      ? "secondary.main"
                      : "transparent",
                  color:
                    campaign.campaignGoal === goal
                      ? "secondary.contrastText"
                      : "text.primary",
                  "&:hover": {
                    bgcolor:
                      campaign.campaignGoal === goal
                        ? "secondary.dark"
                        : "action.hover",
                  },
                  textTransform: "none",
                  fontSize: "0.75rem",
                  py: 0.5,
                }}
              >
                {goal}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Objectives & Key Messages */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          bgcolor: "background.default",
          borderRadius: 2,
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
            sx={{ mb: 1, display: "block" }}
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
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
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
                e.key === "Enter" &&
                handleAddTag("objectives", newObjective, setNewObjective)
              }
              sx={{
                bgcolor: "background.paper",
                "& .MuiOutlinedInput-root": {
                  color: "text.primary",
                },
              }}
            />
            <Button
              variant="contained"
              size="small"
              disabled={!newObjective.trim()}
              onClick={() =>
                handleAddTag("objectives", newObjective, setNewObjective)
              }
              sx={{ minWidth: 40 }}
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
            sx={{ mb: 1, display: "block" }}
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
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
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
                e.key === "Enter" &&
                handleAddTag("keyMessages", newKeyMessage, setNewKeyMessage)
              }
              sx={{
                bgcolor: "background.paper",
                "& .MuiOutlinedInput-root": {
                  color: "text.primary",
                },
              }}
            />
            <Button
              variant="contained"
              size="small"
              disabled={!newKeyMessage.trim()}
              onClick={() =>
                handleAddTag("keyMessages", newKeyMessage, setNewKeyMessage)
              }
              sx={{ minWidth: 40 }}
            >
              <Add fontSize="small" />
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Additional Campaign Details (Collapsible) */}
      <Box sx={{ mt: 3 }}>
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{ mb: 1, display: "block" }}
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
                },
              }}
            />
          )}
        />

        <Typography
          variant="caption"
          fontWeight={600}
          sx={{ mb: 1, mt: 3, display: "block" }}
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
                },
              }}
            />
          )}
        />
      </Box>
    </Paper>
  );
};

export default CampaignDetailsSection;
