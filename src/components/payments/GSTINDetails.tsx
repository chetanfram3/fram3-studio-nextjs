"use client";

import { TextField, Box, Grid, Typography, useTheme } from "@mui/material";
import { useState, useEffect } from "react";
import { getCurrentBrand } from "@/config/brandConfig";

interface GSTINDetailsProps {
  gstin: string;
  companyName: string;
  onChange: (
    values: { gstin: string; companyName: string },
    isValid: boolean
  ) => void;
}

export function GSTINDetails({
  gstin,
  companyName,
  onChange,
}: GSTINDetailsProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const [gstinError, setGstinError] = useState<string>("");
  const [companyError, setCompanyError] = useState<string>("");

  const validateGSTIN = (gstinValue: string): boolean => {
    if (!gstinValue) {
      setGstinError("");
      return true;
    }

    const gstinRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstinRegex.test(gstinValue)) {
      setGstinError("Invalid GSTIN format");
      return false;
    }

    const stateCode = parseInt(gstinValue.substring(0, 2));
    if (stateCode < 1 || stateCode > 37) {
      setGstinError("Invalid state code");
      return false;
    }

    setGstinError("");
    return true;
  };

  const validateCompanyName = (
    nameValue: string,
    gstinValue: string
  ): boolean => {
    if (gstinValue && !nameValue.trim()) {
      setCompanyError("Company name is required when GSTIN is provided");
      return false;
    }
    setCompanyError("");
    return true;
  };

  const validate = (gstinValue: string, nameValue: string): boolean => {
    const isGstinValid = validateGSTIN(gstinValue);
    const isCompanyValid = validateCompanyName(nameValue, gstinValue);
    return isGstinValid && isCompanyValid;
  };

  const handleGSTINChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newGstin = e.target.value.toUpperCase();
    const isValid = validate(newGstin, companyName);
    onChange({ gstin: newGstin, companyName }, isValid);
  };

  const handleCompanyChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const newName = e.target.value;
    const isValid = validate(gstin, newName);
    onChange({ gstin, companyName: newName }, isValid);
  };

  useEffect(() => {
    validate(gstin, companyName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gstin, companyName]);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontFamily: brand.fonts.heading,
          color: theme.palette.text.primary,
        }}
      >
        Business Details
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="GSTIN (Optional)"
            value={gstin}
            onChange={handleGSTINChange}
            error={!!gstinError}
            helperText={gstinError || "Format: 29ABCDE1234F1Z5"}
            placeholder="29ABCDE1234F1Z5"
            inputProps={{
              maxLength: 15,
              style: { textTransform: "uppercase" },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${brand.borderRadius}px`,
                "& fieldset": {
                  borderColor: theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.primary.main,
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                },
                "&.Mui-error fieldset": {
                  borderColor: theme.palette.error.main,
                },
              },
              "& .MuiInputLabel-root": {
                color: theme.palette.text.secondary,
                fontFamily: brand.fonts.body,
                "&.Mui-focused": {
                  color: theme.palette.primary.main,
                },
                "&.Mui-error": {
                  color: theme.palette.error.main,
                },
              },
              "& .MuiInputBase-input": {
                fontFamily: brand.fonts.body,
                color: theme.palette.text.primary,
              },
              "& .MuiFormHelperText-root": {
                fontFamily: brand.fonts.body,
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={`Company Name${gstin ? " *" : " (Optional)"}`}
            value={companyName}
            onChange={handleCompanyChange}
            error={!!companyError}
            helperText={companyError}
            placeholder="Enter company name"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${brand.borderRadius}px`,
                "& fieldset": {
                  borderColor: theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.primary.main,
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                },
                "&.Mui-error fieldset": {
                  borderColor: theme.palette.error.main,
                },
              },
              "& .MuiInputLabel-root": {
                color: theme.palette.text.secondary,
                fontFamily: brand.fonts.body,
                "&.Mui-focused": {
                  color: theme.palette.primary.main,
                },
                "&.Mui-error": {
                  color: theme.palette.error.main,
                },
              },
              "& .MuiInputBase-input": {
                fontFamily: brand.fonts.body,
                color: theme.palette.text.primary,
              },
              "& .MuiFormHelperText-root": {
                fontFamily: brand.fonts.body,
              },
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

GSTINDetails.displayName = "GSTINDetails";
