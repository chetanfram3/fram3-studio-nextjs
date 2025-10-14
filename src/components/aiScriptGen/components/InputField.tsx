// src/components/aiScriptGen/components/InputField.tsx
"use client";

import {
  Box,
  Typography,
  TextField,
  type TextFieldProps,
  useTheme,
} from "@mui/material";
import { getCurrentBrand } from "@/config/brandConfig";
import { JSX } from "react";

interface InputFieldProps extends Omit<TextFieldProps, "variant"> {
  label: React.ReactNode;
  multiline?: boolean;
  rows?: number;
}

const InputField = ({
  label,
  placeholder,
  multiline = false,
  rows = 1,
  sx = {},
  ...props
}: InputFieldProps): JSX.Element => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box sx={sx}>
      <Typography
        variant="subtitle1"
        component="label"
        sx={{
          display: "block",
          mb: 1.5,
          fontWeight: 500,
          color: "text.primary",
          fontFamily: brand.fonts.heading,
        }}
      >
        {label}
      </Typography>

      <TextField
        fullWidth
        placeholder={placeholder}
        multiline={multiline}
        rows={rows}
        sx={{
          bgcolor: "background.default",
          "& .MuiOutlinedInput-root": {
            color: "text.primary",
            fontFamily: brand.fonts.body,
            "& fieldset": {
              borderColor: "divider",
            },
            "&:hover fieldset": {
              borderColor: "divider",
            },
            "&.Mui-focused fieldset": {
              borderColor: "primary.main",
            },
            "&.Mui-error fieldset": {
              borderColor: "error.main",
            },
          },
          "& .MuiInputBase-input": {
            fontFamily: brand.fonts.body,
          },
          "& .MuiInputBase-input::placeholder": {
            color: theme.palette.mode === "dark" ? "#666" : "#9E9E9E",
            opacity: 1,
          },
          "& .MuiFormHelperText-root": {
            fontFamily: brand.fonts.body,
            color: "text.secondary",
            "&.Mui-error": {
              color: "error.main",
            },
          },
        }}
        {...props}
      />
    </Box>
  );
};

InputField.displayName = "InputField";

export default InputField;
