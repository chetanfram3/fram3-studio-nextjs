"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { styled } from "@mui/material/styles";

const SliderRoot = styled(SliderPrimitive.Root)({
  position: "relative",
  display: "flex",
  width: "100%",
  touchAction: "none",
  userSelect: "none",
  alignItems: "center",
});

// ✅ FIXED: Use theme colors properly - adapts to light/dark mode automatically
const SliderTrack = styled(SliderPrimitive.Track)(({ theme }) => ({
  position: "relative",
  height: "6px",
  width: "100%",
  flexGrow: 1,
  overflow: "hidden",
  borderRadius: "3px",
  // Use divider color which adapts to theme mode
  backgroundColor: theme.palette.divider,
}));

// ✅ FIXED: Use primary color (Gold in dark, Bronze in light)
const SliderRange = styled(SliderPrimitive.Range)(({ theme }) => ({
  position: "absolute",
  height: "100%",
  backgroundColor: theme.palette.primary.main,
}));

// ✅ FIXED: Use primary color for thumb
const SliderThumb = styled(SliderPrimitive.Thumb)(({ theme }) => ({
  display: "block",
  height: "16px",
  width: "16px",
  borderRadius: "50%",
  border: `2px solid ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.secondary.main,
  transition: "all 0.2s ease",
  "&:focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 3px ${theme.palette.primary.light}`,
  },
  "&:disabled": {
    pointerEvents: "none",
    opacity: 0.5,
  },
  "&:hover:not(:disabled)": {
    backgroundColor: theme.palette.primary.main,
    transform: "scale(1.1)",
  },
}));

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderRoot ref={ref} {...props}>
    <SliderTrack>
      <SliderRange />
    </SliderTrack>
    <SliderThumb />
  </SliderRoot>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
