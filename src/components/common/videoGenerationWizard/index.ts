// src/components/videoGeneration/index.ts

// Main component
export { VideoGenerationWizard } from "./VideoGenerationWizard";
export type { VideoGenerationWizardProps } from "./VideoGenerationWizard";

// Step components
export { UrlConfigurationStep } from "./steps/UrlConfigurationStep";
export { ProcessingOptionsStep } from "./steps/ProcessingOptionsStep";
export { ReviewStep } from "./steps/ReviewStep";
export { ProgressStep } from "./steps/ProgressStep";

// Hook
export { useVideoGeneration } from "./hooks/useVideoGeneration";

// Types
export type {
  VideoGenerationMode,
  VideoGenerationConfig,
  VideoGenerationResult,
  VideoGenerationError,
  WizardStep,
  StepConfiguration,
  StepId,
  UseVideoGenerationReturn,
  UrlConfigurationStepProps,
  ProcessingOptionsStepProps,
  ReviewStepProps,
  ProgressStepProps,
  ProcessingModeInfo,
  ModelTierInfo,
  ValidationResult,
} from "./types";
