"use client";

import React, { useMemo, useCallback, useState } from "react";
import { TextField, Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import TokenCounter from "./TokenCounter";
import { MAX_TOKENS, MIN_TOKENS } from "@/config/analysis";
import { getTokenStatus } from "@/utils/tokenization";

interface ScriptInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * ScriptInput
 *
 * Script input field with token counter and validation.
 * Only shows errors after user interaction (touched state).
 */
const ScriptInput: React.FC<ScriptInputProps> = React.memo(
  ({ value, onChange }) => {
    const theme = useTheme();
    const brand = getCurrentBrand();

    // Track if field has been touched
    const [touched, setTouched] = useState(false);

    // Calculate token status
    const tokenStatus = useMemo(
      () => getTokenStatus(value, MAX_TOKENS, MIN_TOKENS),
      [value]
    );

    const { isExceeded, isBelowMinimum } = tokenStatus;

    // Only show errors if field has been touched
    const hasError = touched && (isExceeded || isBelowMinimum);

    // Handle input change
    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(event.target.value);
        // Mark as touched on first input
        if (!touched) {
          setTouched(true);
        }
      },
      [onChange, touched]
    );

    // Handle blur event - mark as touched
    const handleBlur = useCallback(() => {
      setTouched(true);
    }, []);

    // Get helper text - only if touched
    const getHelperText = useCallback((): string => {
      if (!touched) return "";
      if (isExceeded)
        return `Script exceeds maximum limit of ${MAX_TOKENS} tokens`;
      if (isBelowMinimum)
        return `Script requires minimum of ${MIN_TOKENS} tokens`;
      return "";
    }, [isExceeded, isBelowMinimum, touched]);

    return (
      <Box>
        {/* Title */}
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={{
            color: "text.primary",
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
          }}
        >
          Enter Your Script
        </Typography>

        {/* Text Field */}
        <TextField
          fullWidth
          multiline
          rows={12}
          label="Type/Paste your script here"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          error={hasError}
          helperText={getHelperText()}
          inputProps={{
            "aria-label": "Script input",
            "aria-invalid": hasError,
            "aria-describedby": "script-token-counter",
          }}
          sx={{
            mb: 2,
            "& .MuiInputBase-root": {
              backgroundColor: "background.paper",
              fontFamily: brand.fonts.body,
            },
            "& .MuiOutlinedInput-root": {
              transition: theme.transitions.create(
                ["border-color", "box-shadow"],
                {
                  duration: theme.transitions.duration.short,
                }
              ),
              "& fieldset": {
                borderColor: hasError ? "error.main" : theme.palette.divider,
              },
              "&:hover fieldset": {
                borderColor: hasError ? "error.main" : "primary.main",
              },
              "&.Mui-focused fieldset": {
                borderColor: hasError ? "error.main" : "primary.main",
              },
            },
            "& .MuiFormHelperText-root": {
              color: hasError ? "error.main" : "text.secondary",
              fontFamily: brand.fonts.body,
            },
            "& .MuiInputBase-input": {
              color: "text.primary",
            },
            "& .MuiInputLabel-root": {
              color: "text.secondary",
              fontFamily: brand.fonts.body,
              "&.Mui-focused": {
                color: hasError ? "error.main" : "primary.main",
              },
              "&.Mui-error": {
                color: "error.main",
              },
            },
          }}
        />

        {/* Token Counter - pass touched state */}
        <Box id="script-token-counter">
          <TokenCounter
            text={value}
            maxTokens={MAX_TOKENS}
            minTokens={MIN_TOKENS}
            isError={hasError}
            showErrors={touched}
          />
        </Box>
      </Box>
    );
  }
);

ScriptInput.displayName = "ScriptInput";

export default ScriptInput;
