import React, { useState } from "react";
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
import { FormValues } from "../types";
import SectionCloseButton from "./SectionCloseButton";

interface ProductDetailsSectionProps {
  form: UseFormReturn<FormValues>;
}

const ProductDetailsSection: React.FC<ProductDetailsSectionProps> = ({
  form,
}) => {
  const { control, watch, setValue } = form;
  const product = watch("productDetails");

  const [newFeature, setNewFeature] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

  // Array fields in the product object
  const arrayFields: (keyof FormValues["productDetails"])[] = [
    "keyFeatures",
    "uniqueSellingProposition",
  ];

  const handleAddItem = (
    field: keyof FormValues["productDetails"],
    value: string,
    stateSetter: (v: string) => void
  ) => {
    if (!value.trim()) return;

    // Only process if it's an array field
    if (arrayFields.includes(field)) {
      const current = (product?.[field] as string[]) || [];
      setValue(`productDetails.${field}`, [...current, value.trim()] as any);
      stateSetter("");
    }
  };

  const handleRemoveItem = (
    field: keyof FormValues["productDetails"],
    index: number
  ) => {
    // Only process if it's an array field
    if (arrayFields.includes(field)) {
      const current = (product?.[field] as string[]) || [];
      setValue(
        `productDetails.${field}`,
        current.filter((_, i) => i !== index) as any
      );
    }
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
      {/* Section Header */}
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
            sx={{ mb: 1, display: "block", textAlign: "center" }}
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
            sx={{ mb: 1, display: "block", textAlign: "center" }}
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
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{ mb: 1, display: "block", textAlign: "center" }}
          >
            Key Features
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
            {((product?.keyFeatures as string[]) || []).map(
              (feature, index) => (
                <Chip
                  key={index}
                  label={feature}
                  onDelete={() => handleRemoveItem("keyFeatures", index)}
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
                "& .MuiOutlinedInput-root": { color: "text.primary" },
              }}
            />
            <Button
              variant="contained"
              size="small"
              disabled={!newFeature.trim()}
              onClick={() =>
                handleAddItem("keyFeatures", newFeature, setNewFeature)
              }
              sx={{
                minWidth: 40,
                bgcolor: "secondary.main",
                "&:hover": { bgcolor: "secondary.dark" },
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
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{ mb: 1, display: "block", textAlign: "center" }}
          >
            Unique Selling Proposition
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
            {((product?.uniqueSellingProposition as string[]) || []).map(
              (benefit, index) => (
                <Chip
                  key={index}
                  label={benefit}
                  onDelete={() =>
                    handleRemoveItem("uniqueSellingProposition", index)
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
                "& .MuiOutlinedInput-root": { color: "text.primary" },
              }}
            />
            <Button
              variant="contained"
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
                bgcolor: "secondary.main",
                "&:hover": { bgcolor: "secondary.dark" },
              }}
            >
              <Add fontSize="small" />
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ProductDetailsSection;
