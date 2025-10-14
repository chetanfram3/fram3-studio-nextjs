"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Divider,
  Button,
  Chip,
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
interface ProductDetailsSectionProps {
  form: UseFormReturn<FormValues>;
}

type ArrayFieldKey = "keyFeatures" | "uniqueSellingProposition";

/**
 * ProductDetailsSection - Product configuration component
 *
 * Performance optimizations:
 * - React 19 compiler auto-optimizes (no manual memo needed)
 * - useCallback for event handlers
 * - useMemo for static array fields
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
export default function ProductDetailsSection({
  form,
}: ProductDetailsSectionProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // FORM STATE
  // ==========================================
  const { control, watch, setValue } = form;
  const product = watch("productDetails");

  // ==========================================
  // LOCAL STATE
  // ==========================================
  const [newFeature, setNewFeature] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

  // ==========================================
  // CONSTANTS (Memoized for stability)
  // ==========================================
  const arrayFields: ArrayFieldKey[] = useMemo(
    () => ["keyFeatures", "uniqueSellingProposition"],
    []
  );

  // ==========================================
  // EVENT HANDLERS (useCallback for stability)
  // ==========================================
  const handleAddItem = useCallback(
    (
      field: keyof FormValues["productDetails"],
      value: string,
      stateSetter: (v: string) => void
    ) => {
      if (!value.trim()) return;

      if (arrayFields.includes(field as ArrayFieldKey)) {
        const current = (product?.[field] as string[] | undefined) || [];
        setValue(`productDetails.${field}`, [...current, value.trim()]);
        stateSetter("");
      }
    },
    [arrayFields, product, setValue]
  );

  const handleRemoveItem = useCallback(
    (field: keyof FormValues["productDetails"], index: number) => {
      if (arrayFields.includes(field as ArrayFieldKey)) {
        const current = (product?.[field] as string[] | undefined) || [];
        setValue(
          `productDetails.${field}`,
          current.filter((_, i) => i !== index)
        );
      }
    },
    [arrayFields, product, setValue]
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
      {/* Section Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
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
          Product Details
        </Typography>
        <SectionCloseButton
          sectionId="product"
          sx={{ position: "absolute", right: 12 }}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Product Name and Specifications Row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              mb: 1,
              display: "block",
              textAlign: "center",
              color: "text.primary",
            }}
          >
            Product Name
          </Typography>
          <Controller
            name="productName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                size="small"
                placeholder="Enter product name"
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
            )}
          />
        </Box>

        <Box>
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              mb: 1,
              display: "block",
              textAlign: "center",
              color: "text.primary",
            }}
          >
            Product Specifications
          </Typography>
          <Controller
            name="productDetails.productSpecifications"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                minRows={3}
                size="small"
                placeholder="Enter product specifications"
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
            )}
          />
        </Box>
      </Box>

      {/* Features and Benefits Row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
        }}
      >
        {/* Key Features */}
        <Box
          sx={{
            p: 2,
            bgcolor: "background.default",
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              mb: 1,
              display: "block",
              textAlign: "center",
              color: "text.primary",
            }}
          >
            Key Features
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
            {((product?.keyFeatures as string[] | undefined) || []).map(
              (feature: string, index: number) => (
                <Chip
                  key={index}
                  label={feature}
                  onDelete={() => handleRemoveItem("keyFeatures", index)}
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
              placeholder="Add key feature"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddItem("keyFeatures", newFeature, setNewFeature);
                }
              }}
              sx={{
                bgcolor: "background.paper",
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
              size="small"
              disabled={!newFeature.trim()}
              onClick={() =>
                handleAddItem("keyFeatures", newFeature, setNewFeature)
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

        {/* Unique Selling Proposition */}
        <Box
          sx={{
            p: 2,
            bgcolor: "background.default",
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              mb: 1,
              display: "block",
              textAlign: "center",
              color: "text.primary",
            }}
          >
            Unique Selling Proposition
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
            {(
              (product?.uniqueSellingProposition as string[] | undefined) || []
            ).map((benefit: string, index: number) => (
              <Chip
                key={index}
                label={benefit}
                onDelete={() =>
                  handleRemoveItem("uniqueSellingProposition", index)
                }
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
            ))}
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add unique benefit"
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddItem(
                    "uniqueSellingProposition",
                    newBenefit,
                    setNewBenefit
                  );
                }
              }}
              sx={{
                bgcolor: "background.paper",
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
              size="small"
              disabled={!newBenefit.trim()}
              onClick={() =>
                handleAddItem(
                  "uniqueSellingProposition",
                  newBenefit,
                  setNewBenefit
                )
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
      </Box>
    </Paper>
  );
}

ProductDetailsSection.displayName = "ProductDetailsSection";
