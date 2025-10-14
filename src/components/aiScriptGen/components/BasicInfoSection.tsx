import React from "react";
import { Box, useTheme } from "@mui/material";
import { Controller, UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";
import InputField from "./InputField";

interface BasicInfoSectionProps {
  form: UseFormReturn<FormValues>;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ form }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      {/* Two-column layout with Project, Brand, Product in first column and Logline in second column */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "34% 66%" }, // First column takes 34%, second takes 66%
          gap: 3,
        }}
      >
        {/* First column: Project, Brand, Product */}
        <Box>
          {/* Project Name */}
          <Controller
            name="projectName"
            control={form.control}
            render={({ field, fieldState }) => (
              <InputField
                label="Project Name"
                placeholder="Enter project name"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={{
                  mb: 3,
                  "& .MuiFormLabel-root": {
                    color: "text.primary",
                  },
                }}
                {...field}
              />
            )}
          />

          {/* Brand Name */}
          <Controller
            name="brandName"
            control={form.control}
            render={({ field, fieldState }) => (
              <InputField
                label="Brand Name"
                placeholder="Enter brand name"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={{
                  mb: 3,
                  "& .MuiFormLabel-root": {
                    color: "text.primary",
                  },
                }}
                {...field}
              />
            )}
          />

          {/* Product Name */}
          <Controller
            name="productName"
            control={form.control}
            render={({ field, fieldState }) => (
              <InputField
                label="Product Name"
                placeholder="Enter product name"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={{
                  "& .MuiFormLabel-root": {
                    color: "text.primary",
                  },
                }}
                {...field}
              />
            )}
          />
        </Box>

        {/* Second column: Logline/Concept */}
        <Box>
          <Controller
            name="loglineConcept"
            control={form.control}
            render={({ field, fieldState }) => (
              <InputField
                label="Logline / Concept"
                placeholder="Describe the main concept of your commercial"
                multiline
                rows={12} // Make it taller to match the height of all three inputs in the first column
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={{
                  "& .MuiFormLabel-root": {
                    color: "text.primary",
                  },
                }}
                {...field}
              />
            )}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default BasicInfoSection;
