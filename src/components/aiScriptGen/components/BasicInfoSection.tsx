// src/components/aiScriptGen/components/BasicInfoSection.tsx
"use client";

import { Box } from "@mui/material";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { FormValues } from "../types";
import InputField from "./InputField";
import { JSX } from "react";

interface BasicInfoSectionProps {
  form: UseFormReturn<FormValues>;
}

const BasicInfoSection = ({ form }: BasicInfoSectionProps): JSX.Element => {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Two-column layout with Project, Brand, Product in first column and Logline in second column */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "34% 66%" },
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
                rows={12}
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

BasicInfoSection.displayName = "BasicInfoSection";

export default BasicInfoSection;
