"use client";

import * as React from "react";
import {
  Slider as MuiSlider,
  SliderProps as MuiSliderProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

// ✅ CORRECT: Based on FormatCtaSection.tsx working implementation
const StyledSlider = styled(MuiSlider)(({ theme }) => ({
  color: theme.palette.primary.main,
  height: 8,

  "& .MuiSlider-track": {
    border: "none",
    height: 8,
  },

  "& .MuiSlider-rail": {
    height: 8,
    opacity: 0.5,
    backgroundColor: theme.palette.divider,
  },

  "& .MuiSlider-thumb": {
    height: 18,
    width: 18,
    // ✅ CRITICAL: Always white border per guide
    border: "2px solid #FFFFFF",
    // ✅ CRITICAL: Use primary.main (not secondary)
    backgroundColor: theme.palette.primary.main,

    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
      // ✅ Use inherit per guide (no custom shadows)
      boxShadow: "inherit",
    },
  },

  "& .MuiSlider-mark": {
    backgroundColor: theme.palette.primary.main,
    height: 8,
    width: 8,
    borderRadius: "50%",
    marginTop: 0,
  },
}));

// ✅ Custom props interface to match Radix API
interface SliderProps extends Omit<MuiSliderProps, "onChange" | "value"> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
}

// ✅ PERFORMANCE: React 19 - No manual memo needed
export function Slider({ value, onValueChange, ...props }: SliderProps) {
  const handleChange = React.useCallback(
    (_event: Event, newValue: number | number[]) => {
      if (onValueChange) {
        const valueArray = Array.isArray(newValue) ? newValue : [newValue];
        onValueChange(valueArray);
      }
    },
    [onValueChange]
  );

  // Convert value array to single value for MUI
  const muiValue = value && value.length > 0 ? value[0] : undefined;

  return <StyledSlider {...props} value={muiValue} onChange={handleChange} />;
}

export default Slider;
