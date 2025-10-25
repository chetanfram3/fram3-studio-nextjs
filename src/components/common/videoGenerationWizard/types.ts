// src/components/videoGeneration/types.ts

import type { UrlEntry } from "@/types/urlManagerTypes";
import type {
  ProcessingMode,
  AspectRatio,
  ModelTierConfig,
} from "@/components/common/ProcessingModeSelector";
import type { CreditErrorResponse } from "@/types";

// ==========================================
// CORE TYPES
// ==========================================

/**
 * Video generation mode
 * - versioned: Use existing script with scriptId/versionId
 * - non-versioned: Create new script with content
 */
export type VideoGenerationMode = "versioned" | "non-versioned";

/**
 * Step identifier
 */
export type StepId = "urls" | "processing" | "review" | "progress";

/**
 * Wizard step definition
 */
export interface WizardStep {
  id: StepId;
  label: string;
  optional: boolean;
}

/**
 * Step configuration for enabling/disabling steps
 */
export interface StepConfiguration {
  id: StepId;
  enabled: boolean;
}

// ==========================================
// CONFIGURATION TYPES
// ==========================================

/**
 * Complete video generation configuration
 */
export interface VideoGenerationConfig {
  /** Generation mode */
  mode: VideoGenerationMode;

  /** Script ID (required for versioned mode) */
  scriptId?: string;

  /** Version ID (required for versioned mode) */
  versionId?: string;

  /** Script content (required for non-versioned mode) */
  scriptContent?: string;

  /** Script title (optional for non-versioned mode) */
  title?: string;

  /** Script description (optional for non-versioned mode) */
  description?: string;

  /** Processing mode */
  processingMode: ProcessingMode;

  /** Aspect ratio */
  aspectRatio: AspectRatio;

  /** Pause settings */
  pauseBeforeSettings: string[];

  /** Model tier configuration */
  modelTiers: ModelTierConfig;

  /** Reference URLs */
  urls: UrlEntry[];
}

// ==========================================
// RESULT TYPES
// ==========================================

/**
 * Video generation result (success)
 */
export interface VideoGenerationResult {
  success: true;
  scriptId: string;
  versionId: string;
  taskId?: string;
  jobId?: string;
}

/**
 * Video generation error (generic)
 */
export interface VideoGenerationError {
  message: string;
  isPreCheckFailed?: boolean;
  recommendation?: string;
}

// ==========================================
// HOOK RETURN TYPES
// ==========================================

/**
 * Return type for useVideoGeneration hook
 */
export interface UseVideoGenerationReturn {
  /** Whether generation is in progress */
  isGenerating: boolean;

  /** Generation result (if successful) */
  result: VideoGenerationResult | null;

  /** Generic error (if failed) */
  error: VideoGenerationError | null;

  /** Credit error (if insufficient credits) */
  creditError: CreditErrorResponse | null;

  /** Start video generation */
  startGeneration: () => Promise<VideoGenerationResult | null>;

  /** Retry failed generation */
  retryGeneration: () => Promise<VideoGenerationResult | null>;

  /** Reset all state */
  resetState: () => void;

  /** Clear credit error */
  clearCreditError: () => void;

  /** Clear generic error */
  clearError: () => void;

  /** Check if has credit error */
  hasCreditError: () => boolean;

  /** Check if has generic error */
  hasGenericError: () => boolean;
}

// ==========================================
// STEP COMPONENT PROPS
// ==========================================

/**
 * Props for UrlConfigurationStep
 */
export interface UrlConfigurationStepProps {
  urls: UrlEntry[];
  onUrlsChange: (urls: UrlEntry[]) => void;
  onNext: () => void;
  onCancel: () => void;
}

/**
 * Props for ProcessingOptionsStep
 */
export interface ProcessingOptionsStepProps {
  processingMode: ProcessingMode;
  aspectRatio: AspectRatio;
  pauseBeforeSettings: string[];
  modelTiers: ModelTierConfig;
  onProcessingOptionsChange: (
    mode: ProcessingMode,
    ratio: AspectRatio,
    pauseBefore: string[],
    modelTiers: ModelTierConfig
  ) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
  canGoBack: boolean;
}

/**
 * Props for ReviewStep
 */
export interface ReviewStepProps {
  config: VideoGenerationConfig;
  urls: UrlEntry[];
  processingMode: ProcessingMode;
  aspectRatio: AspectRatio;
  modelTiers: ModelTierConfig;
  onStartGeneration: () => void;
  onBack: () => void;
  onCancel: () => void;
}

/**
 * Props for ProgressStep
 */
export interface ProgressStepProps {
  isGenerating: boolean;
  result: VideoGenerationResult | null;
  error: VideoGenerationError | null;
  creditError: CreditErrorResponse | null;
  scriptContent: string;
  onRetry: () => Promise<VideoGenerationResult | null>;
  onClose: () => void;
  config: VideoGenerationConfig;
}

// ==========================================
// UTILITY TYPES
// ==========================================

/**
 * Processing mode display information
 */
export interface ProcessingModeInfo {
  mode: ProcessingMode;
  label: string;
  description: string;
}

/**
 * Model tier display information
 */
export interface ModelTierInfo {
  tier: number;
  label: string;
  color: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
