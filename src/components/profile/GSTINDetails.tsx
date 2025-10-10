// src/components/profile/GSTINDetails.tsx
"use client";

import { TextField, Box, Typography, Alert } from "@mui/material";
import { useState, useEffect } from "react";
import { getCurrentBrand } from "@/config/brandConfig";
import BusinessIcon from "@mui/icons-material/Business";

interface GSTINDetailsProps {
  gstin: string;
  companyName: string;
  onChange: (
    values: { gstin: string; companyName: string },
    isValid: boolean
  ) => void;
}

export default function GSTINDetails({
  gstin,
  companyName,
  onChange,
}: GSTINDetailsProps) {
  const brand = getCurrentBrand();
  const [gstinError, setGstinError] = useState<string>("");
  const [companyError, setCompanyError] = useState<string>("");

  const validateGSTIN = (gstinValue: string) => {
    if (!gstinValue) {
      setGstinError("");
      return true;
    }

    const gstinRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstinRegex.test(gstinValue)) {
      setGstinError("Invalid GSTIN format (e.g., 29ABCDE1234F1Z5)");
      return false;
    }

    const stateCode = parseInt(gstinValue.substr(0, 2));
    if (stateCode < 1 || stateCode > 37) {
      setGstinError("Invalid state code in GSTIN");
      return false;
    }

    setGstinError("");
    return true;
  };

  const validateCompanyName = (nameValue: string, gstinValue: string) => {
    if (gstinValue && !nameValue.trim()) {
      setCompanyError("Company name is required when GSTIN is provided");
      return false;
    }
    setCompanyError("");
    return true;
  };

  const validate = (gstinValue: string, nameValue: string) => {
    const isGstinValid = validateGSTIN(gstinValue);
    const isCompanyValid = validateCompanyName(nameValue, gstinValue);
    return isGstinValid && isCompanyValid;
  };

  const handleGSTINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGstin = e.target.value.toUpperCase();
    const isValid = validate(newGstin, companyName);
    onChange({ gstin: newGstin, companyName }, isValid);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const isValid = validate(gstin, newName);
    onChange({ gstin, companyName: newName }, isValid);
  };

  useEffect(() => {
    validate(gstin, companyName);
  }, [gstin, companyName]);

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <BusinessIcon sx={{ color: "primary.main" }} />
        <Typography
          variant="h6"
          sx={{
            fontFamily: brand.fonts.heading,
            color: "primary.main",
            fontWeight: 600,
          }}
        >
          Business Details
        </Typography>
      </Box>

      {gstin && !gstinError && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "& .MuiAlert-icon": {
              color: "primary.contrastText",
            },
          }}
        >
          GSTIN is valid and linked to your profile
        </Alert>
      )}

      {/* Using Box with grid display instead of Grid component */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 3,
        }}
      >
        <Box>
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
              },
            }}
          />
        </Box>
        <Box>
          <TextField
            fullWidth
            label={`Company Name${gstin ? " *" : " (Optional)"}`}
            value={companyName}
            onChange={handleCompanyChange}
            error={!!companyError}
            helperText={
              companyError ||
              (gstin ? "Required with GSTIN" : "Optional business name")
            }
            placeholder="Enter registered company name"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${brand.borderRadius}px`,
              },
            }}
          />
        </Box>
      </Box>

      {/* GSTIN Info Box */}
      {!gstin && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.default",
            border: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontFamily: brand.fonts.body,
              lineHeight: 1.6,
            }}
          >
            <strong>GSTIN Information:</strong> Goods and Services Tax
            Identification Number is required for business users in India. If
            you are using this platform for business purposes, please provide
            your valid GSTIN and registered company name.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
