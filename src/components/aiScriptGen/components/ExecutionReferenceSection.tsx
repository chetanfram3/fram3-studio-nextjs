import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Chip,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import {
  MapPin,
  Clapperboard,
  ShoppingCart,
  DollarSign,
  Music,
  Sun,
  Plus,
} from "lucide-react";
import { Controller, UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";
import SectionCloseButton from "./SectionCloseButton";

interface ExecutionReferenceSectionProps {
  form: UseFormReturn<FormValues>;
}

const commonConstraintsOptions = [
  {
    label: "Single location",
    value: "single-location",
    icon: <MapPin size={14} />,
  },
  {
    label: "No complex VFX",
    value: "no-vfx",
    icon: <Clapperboard size={14} />,
  },
  {
    label: "Stock footage only",
    value: "stock-footage",
    icon: <ShoppingCart size={14} />,
  },
  {
    label: "Limited budget",
    value: "low-budget",
    icon: <DollarSign size={14} />,
  },
  { label: "No dialogue", value: "no-dialogue", icon: <Music size={14} /> },
  {
    label: "Natural lighting",
    value: "natural-lighting",
    icon: <Sun size={14} />,
  },
];

const ExecutionReferenceSection: React.FC<ExecutionReferenceSectionProps> = ({
  form,
}) => {
  const { control, setValue, watch } = form;
  const theme = useTheme();

  const constraints =
    watch("executionReference.productionConstraints.commonConstraints") || [];
  const customConstraints =
    watch("executionReference.productionConstraints.customConstraints") || [];
  const extractionNotes =
    watch("executionReference.referenceFiles.extractionNotes") || "";

  const [newConstraint, setNewConstraint] = useState("");

  const handleToggleCommon = (value: string) => {
    const current = [...constraints];
    if (current.includes(value)) {
      setValue(
        "executionReference.productionConstraints.commonConstraints",
        current.filter((c) => c !== value)
      );
    } else {
      setValue("executionReference.productionConstraints.commonConstraints", [
        ...current,
        value,
      ]);
    }
  };

  const handleAddCustom = () => {
    if (newConstraint.trim()) {
      setValue("executionReference.productionConstraints.customConstraints", [
        ...customConstraints,
        newConstraint.trim(),
      ]);
      setNewConstraint("");
    }
  };

  const handleRemoveCustom = (index: number) => {
    const updated = customConstraints.filter((_, i) => i !== index);
    setValue(
      "executionReference.productionConstraints.customConstraints",
      updated
    );
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        position: "relative",
      }}
    >
      {/* Title */}
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
          Execution & Reference
        </Typography>
        <SectionCloseButton
          sectionId="execution"
          sx={{ position: "absolute", right: 12 }}
        />
      </Box>

      {/* Constraints */}
      <Box
        sx={{
          mb: 1.5,
          border: "1px solid",
          borderRadius: 1,
          borderColor: "divider",
          p: 2,
          bgcolor: theme.palette.background.default,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
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
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Production Constraints
          </Typography>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: "block" }}
        >
          Common Constraints
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            mb: 2,
          }}
        >
          {commonConstraintsOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => handleToggleCommon(option.value)}
              variant={
                constraints.includes(option.value) ? "contained" : "outlined"
              }
              startIcon={option.icon}
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                justifyContent: "flex-start",
                bgcolor: constraints.includes(option.value)
                  ? alpha(theme.palette.secondary.main, 0.2)
                  : "transparent",
                color: constraints.includes(option.value)
                  ? "secondary.main"
                  : "text.primary",
                borderColor: constraints.includes(option.value)
                  ? alpha(theme.palette.secondary.dark, 0.3)
                  : "divider",
                "&:hover": {
                  bgcolor: constraints.includes(option.value)
                    ? "secondary.main"
                    : "action.hover",
                  color: constraints.includes(option.value)
                    ? "secondary.contrastText"
                    : "text.primary",
                },
              }}
            >
              {option.label}
            </Button>
          ))}
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: "block" }}
        >
          Custom Constraints
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          {customConstraints.map((constraint, index) => (
            <Chip
              key={index}
              label={constraint}
              onDelete={() => handleRemoveCustom(index)}
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
            placeholder="Add custom constraint"
            value={newConstraint}
            onChange={(e) => setNewConstraint(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddCustom();
            }}
            sx={{
              bgcolor: "background.default",
              "& .MuiOutlinedInput-root": {
                color: "text.primary",
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleAddCustom}
            sx={{
              minWidth: 40,
              bgcolor: "secondary.main",
              "&:hover": { bgcolor: "secondary.dark" },
            }}
          >
            <Plus size={18} />
          </Button>
        </Box>
      </Box>

      {/* Reference Section */}
      <Box
        sx={{
          mb: 1.5,
          border: "1px solid",
          borderRadius: 1,
          borderColor: "divider",
          p: 2,
          bgcolor: theme.palette.background.default,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
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
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Reference Files
          </Typography>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          textAlign={"center"}
          sx={{ mb: 1, display: "block" }}
        >
          Extraction Notes
        </Typography>
        <Controller
          name="executionReference.referenceFiles.extractionNotes"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              multiline
              minRows={3}
              placeholder="Describe what should be extracted from reference materials"
              fullWidth
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

export default ExecutionReferenceSection;
