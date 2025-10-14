"use client";

import React from "react";
import { Stepper, Step, StepLabel } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

interface ScriptAnalysisStepperProps {
  activeStep: number;
  steps: ReadonlyArray<string>;
}

/**
 * ScriptAnalysisStepper
 *
 * Stepper component for analysis workflow.
 * Theme-aware with proper validation.
 */
const ScriptAnalysisStepper: React.FC<ScriptAnalysisStepperProps> = ({
  activeStep,
  steps,
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Validate inputs
  if (activeStep < 0 || activeStep >= steps.length) {
    console.warn(
      `Invalid activeStep: ${activeStep}. Should be between 0 and ${steps.length - 1}`
    );
  }

  // Ensure activeStep is within bounds
  const safeActiveStep = Math.max(0, Math.min(activeStep, steps.length - 1));

  return (
    <Stepper
      activeStep={safeActiveStep}
      sx={{
        mb: 4,
        "& .MuiStepIcon-root": {
          color: theme.palette.action.disabled,
          transition: theme.transitions.create(["color"], {
            duration: theme.transitions.duration.short,
          }),
          "&.Mui-active": {
            color: "primary.main",
          },
          "&.Mui-completed": {
            color: "primary.dark",
          },
        },
        "& .MuiStepLabel-label": {
          color: "text.primary",
          fontFamily: brand.fonts.body,
          "&.Mui-active": {
            color: "text.primary",
            fontWeight: 600,
          },
          "&.Mui-completed": {
            color: "text.primary",
          },
        },
        "& .MuiStepConnector-line": {
          borderColor:
            theme.palette.mode === "light"
              ? "rgba(0, 0, 0, 0.12)"
              : "rgba(255, 255, 255, 0.12)",
          transition: theme.transitions.create(["border-color"], {
            duration: theme.transitions.duration.short,
          }),
        },
      }}
    >
      {steps.map((label, index) => (
        <Step key={`${label}-${index}`}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

ScriptAnalysisStepper.displayName = "ScriptAnalysisStepper";

export default ScriptAnalysisStepper;
