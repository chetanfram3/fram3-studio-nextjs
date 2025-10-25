// src/components/videoGeneration/hooks/useVideoGeneration.ts

import { useState, useCallback } from "react";
import { customAlphabet } from "nanoid";
import { useScriptAnalysisCore } from "@/hooks/useScriptAnalysis";
import logger from "@/utils/logger";
import CustomToast from "@/components/common/CustomToast";
import { convertToPayload } from "@/utils/urlValidationUtils";
import type {
  VideoGenerationConfig,
  VideoGenerationResult,
  VideoGenerationError,
  UseVideoGenerationReturn,
} from "../types";
import type { CreditErrorResponse } from "@/types";

// Firebase-compatible ID generator
const firebaseIdGenerator = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  20
);

/**
 * useVideoGeneration - Hook for video generation logic
 *
 * Features:
 * - Handles both versioned and non-versioned modes
 * - Automatic API endpoint selection
 * - ID generation for non-versioned mode
 * - Comprehensive error handling (credit errors, generic errors)
 * - Retry logic
 * - State management
 *
 * @param config - Video generation configuration
 * @returns Video generation state and methods
 */
export function useVideoGeneration(
  config: VideoGenerationConfig
): UseVideoGenerationReturn {
  // ==========================================
  // STATE
  // ==========================================
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<VideoGenerationResult | null>(null);
  const [error, setError] = useState<VideoGenerationError | null>(null);
  const [creditError, setCreditError] = useState<CreditErrorResponse | null>(
    null
  );

  // ==========================================
  // HOOKS
  // ==========================================
  const { analyzeScriptCore } = useScriptAnalysisCore();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  const resetState = useCallback(() => {
    setIsGenerating(false);
    setResult(null);
    setError(null);
    setCreditError(null);
  }, []);

  const clearCreditError = useCallback(() => {
    setCreditError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const hasCreditError = useCallback(() => {
    return creditError !== null;
  }, [creditError]);

  const hasGenericError = useCallback(() => {
    return error !== null && creditError === null;
  }, [error, creditError]);

  // ==========================================
  // VALIDATION
  // ==========================================

  const validateConfig = useCallback((): boolean => {
    const { mode, scriptId, versionId, scriptContent, title, description } =
      config;

    // Validate based on mode
    if (mode === "versioned") {
      if (!scriptId || !versionId) {
        const errorMsg =
          "Versioned mode requires both scriptId and versionId";
        logger.error(errorMsg);
        setError({ message: errorMsg });
        CustomToast.error(errorMsg);
        return false;
      }
    } else if (mode === "non-versioned") {
      if (!scriptContent || scriptContent.trim().length === 0) {
        const errorMsg = "Script content cannot be empty";
        logger.error(errorMsg);
        setError({ message: errorMsg });
        CustomToast.error(errorMsg);
        return false;
      }
    }

    return true;
  }, [config]);

  // ==========================================
  // GENERATION
  // ==========================================

  const startGeneration = useCallback(async (): Promise<VideoGenerationResult | null> => {
    // Validate configuration
    if (!validateConfig()) {
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setCreditError(null);
    setResult(null);

    try {
      const {
        mode,
        scriptId,
        versionId,
        scriptContent,
        title = "Generated Script",
        description = "AI Generated Video Script",
        processingMode,
        aspectRatio,
        pauseBeforeSettings,
        modelTiers,
        urls,
      } = config;

      logger.info("Starting video generation:", {
        mode,
        scriptId,
        versionId,
        processingMode,
        aspectRatio,
        urlCount: urls.length,
      });

      // Convert URLs to API payload format
      const urlsPayload = convertToPayload(urls);

      // Prepare analysis options and parameters based on mode
      let analysisResult;

      if (mode === "versioned") {
        // Versioned mode: use existing script
        analysisResult = await analyzeScriptCore(
          {
            genScriptId: scriptId,
            currentVersionNumber: parseInt(versionId!, 10),
            scriptContent: scriptContent || "", // May not be needed for versioned
          },
          {
            processingMode,
            aspectRatio,
            pauseBeforeSettings,
            modelTiers,
            urls: urlsPayload,
          }
        );
      } else {
        // Non-versioned mode: create new script
        // Generate IDs for the new script
        const newScriptId = firebaseIdGenerator();
        const newVersionId = firebaseIdGenerator();

        logger.info("Generated IDs for new script:", {
          scriptId: newScriptId,
          versionId: newVersionId,
        });

        analysisResult = await analyzeScriptCore(
          {
            scriptContent: scriptContent!,
            title,
            description,
          },
          {
            processingMode,
            aspectRatio,
            pauseBeforeSettings,
            modelTiers,
            urls: urlsPayload,
          }
        );
      }

      // Check if analysis succeeded
      if (!analysisResult) {
        logger.error("Analysis returned null result");
        setError({
          message: "Video generation failed - no result returned",
        });
        return null;
      }

      // Success! Transform result
      const generationResult: VideoGenerationResult = {
        success: true,
        scriptId: analysisResult.scriptId,
        versionId: analysisResult.versionId,
        taskId: "taskId" in analysisResult ? analysisResult.taskId : undefined,
        jobId: "jobId" in analysisResult ? analysisResult.jobId : undefined,
      };

      logger.info("Video generation successful:", generationResult);
      setResult(generationResult);
      CustomToast.success("Video generation started successfully!");

      return generationResult;
    } catch (err: unknown) {
      logger.error("Video generation error:", err);

      // Type guards for error handling
      interface ApiError {
        response?: {
          status: number;
          data: CreditErrorResponse;
        };
      }

      interface PreCheckError extends Error {
        preCheckFailed: boolean;
        recommendation?: string;
      }

      const hasResponse = (e: unknown): e is ApiError => {
        return (
          typeof e === "object" &&
          e !== null &&
          "response" in e &&
          typeof (e as ApiError).response === "object"
        );
      };

      const isPreCheckError = (e: unknown): e is PreCheckError => {
        return e instanceof Error && "preCheckFailed" in e;
      };

      // Handle credit errors (402)
      if (hasResponse(err) && err.response?.status === 402) {
        const creditErrorData = err.response.data;
        setCreditError(creditErrorData);
        logger.warn("Credit error detected:", creditErrorData);
        // Don't show toast for credit errors - component will handle display
        return null;
      }

      // Handle pre-check errors
      if (isPreCheckError(err)) {
        const errorObj: VideoGenerationError = {
          message: "Video generation failed during pre-checks",
          isPreCheckFailed: true,
          recommendation:
            err.recommendation ||
            "Please check your script content and try again.",
        };
        setError(errorObj);
        CustomToast.error(errorObj.recommendation!);
        return null;
      }

      // Handle generic errors
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during video generation";

      setError({ message: errorMessage });
      CustomToast.error(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [config, validateConfig, analyzeScriptCore]);

  // ==========================================
  // RETRY
  // ==========================================

  const retryGeneration = useCallback(async (): Promise<VideoGenerationResult | null> => {
    logger.info("Retrying video generation");

    // Clear previous errors
    setError(null);
    setCreditError(null);

    // Retry with same configuration
    return await startGeneration();
  }, [startGeneration]);

  // ==========================================
  // RETURN
  // ==========================================

  return {
    isGenerating,
    result,
    error,
    creditError,
    startGeneration,
    retryGeneration,
    resetState,
    clearCreditError,
    clearError,
    hasCreditError,
    hasGenericError,
  };
}
