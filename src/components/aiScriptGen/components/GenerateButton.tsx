// src/modules/scripts/components/GenerateButton.tsx
import React, { useState } from "react";
import {
  Button,
  Box,
  CircularProgress,
  useTheme,
  Tooltip,
  Typography,
  Slider,
  Chip,
  alpha,
  Collapse,
  IconButton,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { ChevronDown } from "lucide-react";

// Define generation mode types
export type GenerationMode = "fast" | "moderate" | "detailed";

// Map generation modes to their values for slider
const GENERATION_MODES: {
  [key: number]: {
    value: GenerationMode;
    label: string;
    description: string;
  };
} = {
  0: {
    value: "fast",
    label: "Fast",
    description: "Quicker generation with basic details",
  },
  1: {
    value: "moderate",
    label: "Moderate",
    description: "Balanced speed and quality",
  },
  2: {
    value: "detailed",
    label: "Detailed",
    description: "Higher quality with more extensive details",
  },
};

interface GenerateButtonProps {
  isLoading: boolean;
  onClick?: (mode: GenerationMode) => void;
  fullWidth?: boolean;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({
  isLoading,
  onClick,
  fullWidth = true,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [sliderValue, setSliderValue] = useState<number>(2); // Default to moderate
  const currentMode = GENERATION_MODES[sliderValue].value;

  const handleButtonClick = () => {
    if (onClick) {
      onClick(currentMode);
    }
  };

  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    const numericValue = Array.isArray(newValue) ? newValue[0] : newValue;
    setSliderValue(numericValue);
  };

  // Handle accordion toggle and prevent event propagation
  const toggleAccordion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: fullWidth ? "100%" : "auto",
        my: 2,
      }}
    >
      {/* Mode Selector Accordion */}
      <Box
        sx={{
          width: "100%",
          mb: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          overflow: "hidden",
        }}
      >
        {/* Accordion Header */}
        <Box
          onClick={toggleAccordion}
          sx={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 1.5,
            borderBottom: expanded ? 1 : 0,
            borderBottomColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              Generation Mode
            </Typography>
            <Chip
              label={GENERATION_MODES[sliderValue].label}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.secondary.main, 0.2),
                color: "secondary.main",
                fontSize: "0.8rem",
                height: 20,
                fontWeight: 500,
              }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip
              title="Select generation quality. More detailed modes may take longer to generate."
              placement="top"
              arrow
            >
              <InfoOutlinedIcon
                fontSize="small"
                sx={{
                  color: theme.palette.text.secondary,
                  cursor: "help",
                  mr: 1,
                  fontSize: 16,
                }}
              />
            </Tooltip>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
            >
              <ChevronDown
                size={18}
                style={{
                  transition: "transform 0.2s ease",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </IconButton>
          </Box>
        </Box>

        {/* Collapsible Content */}
        <Collapse in={expanded}>
          <Box sx={{ px: 2, py: 2 }}>
            {/* Mode labels for slider */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 0.5,
                px: 1,
              }}
            >
              <Typography variant="caption">Fast</Typography>
              <Typography variant="caption">Detailed</Typography>
            </Box>

            {/* Enhanced Slider */}
            <Slider
              value={sliderValue}
              onChange={handleSliderChange}
              step={null}
              min={0}
              max={2}
              marks={[
                { value: 0, label: "" },
                { value: 1, label: "" },
                { value: 2, label: "" },
              ]}
              sx={{
                color: "secondary.main",
                height: 8,
                "& .MuiSlider-track": {
                  border: "none",
                  height: 8,
                },
                "& .MuiSlider-rail": {
                  height: 8,
                  opacity: 0.5,
                  backgroundColor: "#333333",
                },
                "& .MuiSlider-thumb": {
                  height: 18,
                  width: 18,
                  border: "2px solid white",
                  backgroundColor: "secondary.main",
                  "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
                    boxShadow: "inherit",
                  },
                },
                "& .MuiSlider-mark": {
                  backgroundColor: "secondary.main",
                  height: 8,
                  width: 8,
                  borderRadius: "50%",
                  marginTop: 0,
                },
              }}
            />

            {/* Mode Description */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              {GENERATION_MODES[sliderValue].description}
            </Typography>
          </Box>
        </Collapse>
      </Box>

      <Button
        fullWidth={fullWidth}
        variant="contained"
        disabled={isLoading}
        onClick={handleButtonClick}
        sx={{
          bgcolor: "secondary.main",
          color: "secondary.contrastText",
          py: 1.5,
          fontWeight: 600,
          "&:hover": {
            bgcolor: "secondary.dark",
          },
          "&.Mui-disabled": {
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 215, 0, 0.3)"
                : "rgba(255, 215, 0, 0.5)",
            color:
              theme.palette.mode === "dark"
                ? "rgba(0, 0, 0, 0.7)"
                : "rgba(0, 0, 0, 0.5)",
          },
          borderRadius: 1,
          textTransform: "none",
          fontSize: "1rem",
          minWidth: "200px",
        }}
        startIcon={
          isLoading ? <CircularProgress size={20} color="inherit" /> : null
        }
      >
        {isLoading ? "Generating..." : "Generate"}
      </Button>
    </Box>
  );
};

export default GenerateButton;
