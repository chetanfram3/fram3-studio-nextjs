// Gender Identity dropdown component with multiple selection support
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Popover,
  useTheme,
  alpha,
} from "@mui/material";
import { KeyboardArrowDown as ChevronDownIcon } from "@mui/icons-material";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";
import { demographicData } from "../data/demographicData";

interface GenderIdentityPickerProps {
  form: UseFormReturn<FormValues>;
}

const GenderIdentityPicker: React.FC<GenderIdentityPickerProps> = ({
  form,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);

  const audience = form.watch("audienceDetails") || {};
  const selectedGenders = audience.demographics.identity || [];
  const selectedGendersArray = Array.isArray(selectedGenders)
    ? selectedGenders
    : selectedGenders
    ? [selectedGenders]
    : [];

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggleGender = (genderId: string) => {
    // Toggle selection
    if (selectedGendersArray.includes(genderId)) {
      form.setValue(
        "audienceDetails.demographics.identity",
        selectedGendersArray.filter((id) => id !== genderId),
        { shouldDirty: true }
      );
    } else {
      form.setValue(
        "audienceDetails.demographics.identity",
        [...selectedGendersArray, genderId],
        { shouldDirty: true }
      );
    }
  };

  // Get selected gender labels
  const getSelectedLabels = () => {
    if (selectedGendersArray.length === 0) return "Select Gender";

    if (selectedGendersArray.length === 1) {
      const option = demographicData.genderOptions.find(
        (opt) => opt.id === selectedGendersArray[0]
      );
      return option ? option.label : "Select Gender";
    }

    return `${selectedGendersArray.length} Identities Selected`;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mb: 0.5,
          fontWeight: 500,
          color: "text.secondary",
        }}
      >
        Gender Identity (Multiple)
      </Typography>

      <Button
        fullWidth
        variant="outlined"
        endIcon={<ChevronDownIcon />}
        onClick={handleClick}
        sx={{
          justifyContent: "space-between",
          textTransform: "none",
          py: 0.75,
          bgcolor: "background.paper",
          borderColor: "divider",
          color: "text.primary",
          textAlign: "left",
        }}
      >
        {getSelectedLabels()}
      </Button>
      <Popover
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            width: anchorEl?.offsetWidth,
            backgroundColor: "background.default", // Dark background
            p: 1.5,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.1)",
            mt: 0.5,
          },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1,
            width: "100%",
          }}
        >
          {demographicData.genderOptions.map((option) => {
            const isSelected = selectedGendersArray.includes(option.id);

            return (
              <Box
                key={option.id}
                onClick={() => handleToggleGender(option.id)}
                sx={{
                  p: 1.2,
                  borderRadius: 1,
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: isSelected
                    ? alpha(theme.palette.secondary.main, 0.2)
                    : "#1e1e1e", // Darker gray for unselected
                  color: isSelected ? "secondary.main" : "text.primary",
                  fontWeight: isSelected ? 500 : 400,
                  border: `1px solid ${
                    isSelected
                      ? alpha(theme.palette.secondary.dark, 0.3)
                      : "rgba(255,255,255,0.1)"
                  }`, // Subtle border for unselected
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: isSelected ? "secondary.main" : "#262626", // Slightly lighter gray on hover
                    color: isSelected
                      ? "secondary.contrastText"
                      : "text.primary",
                  },
                  fontSize: "0.85rem",
                }}
              >
                {option.label}
              </Box>
            );
          })}
        </Box>
      </Popover>
    </Box>
  );
};

export default GenderIdentityPicker;
