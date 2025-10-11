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

const SliderTrack = styled(SliderPrimitive.Track)(({ theme }) => ({
  position: "relative",
  height: "6px",
  width: "100%",
  flexGrow: 1,
  overflow: "hidden",
  borderRadius: "3px",
  backgroundColor: theme.palette.grey[800],
}));

const SliderRange = styled(SliderPrimitive.Range)(({ theme }) => ({
  position: "absolute",
  height: "100%",
  backgroundColor: theme.palette.secondary.main,
}));

const SliderThumb = styled(SliderPrimitive.Thumb)(({ theme }) => ({
  display: "block",
  height: "16px",
  width: "16px",
  borderRadius: "50%",
  border: `2px solid ${theme.palette.secondary.main}`,
  backgroundColor: theme.palette.secondary.main,
  transition: "background-color 0.2s ease, border-color 0.2s ease",
  "&:focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 3px ${theme.palette.secondary.light}`,
  },
  "&:disabled": {
    pointerEvents: "none",
    opacity: 0.5,
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
