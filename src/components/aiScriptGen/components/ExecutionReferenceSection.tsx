// src/components/aiScriptGen/components/ExecutionReferenceSection.tsx
"use client";

import { useState, useCallback, useMemo, JSX } from "react";
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
import { Controller, type UseFormReturn } from "react-hook-form";
import type { FormValues } from "../types";
import SectionCloseButton from "./SectionCloseButton";
import { getCurrentBrand } from "@/config/brandConfig";

interface ExecutionReferenceSectionProps {
  form: UseFormReturn<FormValues>;
}

interface ConstraintOption {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const ExecutionReferenceSection = ({
  form,
}: ExecutionReferenceSectionProps): JSX.Element => {
  const { control, setValue, watch } = form;
  const theme = useTheme();
  const brand = getCurrentBrand();

  // State
  const [newConstraint, setNewConstraint] = useState("");

  // Memoize static constraint options
  const commonConstraintsOptions: ConstraintOption[] = useMemo(
    () => [
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
      {
        label: "No dialogue",
        value: "no-dialogue",
        icon: <Music size={14} />,
      },
      {
        label: "Natural lighting",
        value: "natural-lighting",
        icon: <Sun size={14} />,
      },
    ],
    []
  );

  // Watch form values
  const constraints =
    watch("executionReference.productionConstraints.commonConstraints") || [];
  const customConstraints =
    watch("executionReference.productionConstraints.customConstraints") || [];

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
  const handleToggleCommon = useCallback(
    (value: string): void => {
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
    },
    [constraints, setValue]
  );

  const handleAddCustom = useCallback((): void => {
    if (newConstraint.trim()) {
      setValue("executionReference.productionConstraints.customConstraints", [
        ...customConstraints,
        newConstraint.trim(),
      ]);
      setNewConstraint("");
    }
  }, [newConstraint, customConstraints, setValue]);

  const handleRemoveCustom = useCallback(
    (index: number): void => {
      const updated = customConstraints.filter((_, i) => i !== index);
      setValue(
        "executionReference.productionConstraints.customConstraints",
        updated
      );
    },
    [customConstraints, setValue]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddCustom();
      }
    },
    [handleAddCustom]
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
      {/* Title */}
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
          borderRadius: `${brand.borderRadius}px`,
          borderColor: "divider",
          p: 2,
          bgcolor: "background.default",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
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
            variant="body2"
            fontWeight={600}
            sx={{ mb: 1, fontFamily: brand.fonts.heading }}
          >
            Production Constraints
          </Typography>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mb: 1,
            display: "block",
            fontFamily: brand.fonts.body,
          }}
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
          {commonConstraintsOptions.map((option) => {
            const isSelected = constraints.includes(option.value);
            return (
              <Button
                key={option.value}
                onClick={() => handleToggleCommon(option.value)}
                variant={isSelected ? "contained" : "outlined"}
                startIcon={option.icon}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  justifyContent: "flex-start",
                  bgcolor: isSelected
                    ? alpha(theme.palette.primary.main, 0.2)
                    : "transparent",
                  color: isSelected ? "primary.main" : "text.primary",
                  borderColor: isSelected
                    ? alpha(theme.palette.primary.dark, 0.3)
                    : "divider",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    bgcolor: isSelected ? "primary.main" : "action.hover",
                    color: isSelected ? "primary.contrastText" : "text.primary",
                  },
                }}
              >
                {option.label}
              </Button>
            );
          })}
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mb: 1,
            display: "block",
            fontFamily: brand.fonts.body,
          }}
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
            placeholder="Add custom constraint"
            value={newConstraint}
            onChange={(e) => setNewConstraint(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{
              bgcolor: "background.default",
              "& .MuiOutlinedInput-root": {
                color: "text.primary",
                fontFamily: brand.fonts.body,
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddCustom}
            sx={{
              minWidth: 40,
              fontFamily: brand.fonts.body,
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
          borderRadius: `${brand.borderRadius}px`,
          borderColor: "divider",
          p: 2,
          bgcolor: "background.default",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
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
            variant="body2"
            fontWeight={600}
            sx={{ mb: 1, fontFamily: brand.fonts.heading }}
          >
            Reference Files
          </Typography>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="center"
          sx={{
            mb: 1,
            display: "block",
            fontFamily: brand.fonts.body,
          }}
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

ExecutionReferenceSection.displayName = "ExecutionReferenceSection";

export default ExecutionReferenceSection;
