import { useState, useCallback } from 'react';
import { customAlphabet } from "nanoid";
import { analyzeScript } from "@/services/scriptService";
import { useAnalyzeGeneratedScript } from "@/hooks/scripts/useGenScript";
import { cleanText } from '@/utils/textUtils';
import CustomToast from "@/components/common/CustomToast";
import type { ScriptAnalysisResponse } from '@/types/analysis';
import type { ProcessingMode, AspectRatio, ModelTierConfig } from '@/components/common/ProcessingModeSelector';
import logger from '@/utils/logger';

export interface AnalysisParams {
  processingMode?: ProcessingMode;
  aspectRatio?: AspectRatio;
  pauseBeforeSettings?: string[];
  modelTiers?: ModelTierConfig;
  urls?: Array<{
    type: string;
    url: string;
    label?: string;
    customTypeLabel?: string;
  }>;
}

export interface AnalysisOptions {
  genScriptId?: string;
  currentVersionNumber?: number;
  scriptContent: string;
  title?: string;
  description?: string;
  urls?: Array<{
    type: string;
    url: string;
    label?: string;
    customTypeLabel?: string;
  }>;
}

// Match your existing AnalysisError interface
export interface AnalysisError {
  message: string;
  isPreCheckFailed?: boolean;
  recommendation?: string;
}

// Match your existing CreditError structure
export interface CreditError {
  code: string;
  message: string;
  details: {
    required: number;
    available: number;
    shortfall: number;
    percentageAvailable: string;
    suggestion: string;
    recommendedPackage: {
      recommended: string;
      reason: string;
      price: number;
      credits: number;
      bonus: number;
    };
  };
}

export interface CreditErrorResponse {
  error: CreditError;
  status: number;
  scriptId?: string;
  versionId?: string;
  route?: string;
  note?: string;
}

export interface AnalysisResults {
  scriptId: string;
  versionId: string;
}

// Alternative approach - create a union type or extract essential properties
export interface CoreAnalysisResult {
  success: boolean;
  scriptId: string;
  versionId: string;
  taskId?: string;
  jobId?: string;
}

export const useScriptAnalysisCore = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<ScriptAnalysisResponse | CoreAnalysisResult | null>(null);
  const [error, setError] = useState<AnalysisError | null>(null);
  const [creditError, setCreditError] = useState<CreditErrorResponse | null>(null);

  const { mutateAsync: analyzeGeneratedScriptAsync } = useAnalyzeGeneratedScript();

  const firebaseIdGenerator = customAlphabet(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    20
  );

  const resetState = useCallback(() => {
    setError(null);
    setCreditError(null);
    setAnalysisResults(null);
    setIsAnalyzing(false);
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

  // Helper function to get current error state (matching your existing pattern)
  const getCurrentErrorState = () => {
    if (creditError) {
      return {
        type: 'credit' as const,
        data: creditError
      };
    }

    if (error) {
      return {
        type: 'generic' as const,
        data: error
      };
    }

    return null;
  };

  const analyzeScriptCore = useCallback(async (
    options: AnalysisOptions,
    params: AnalysisParams = {}
  ) => {
    const {
      genScriptId,
      currentVersionNumber,
      scriptContent,
      title = "PlaceHolder Title",
      description = "PlaceHolder Description",
    } = options;

    const {
      processingMode = "normal",
      aspectRatio = "16:9",
      pauseBeforeSettings = [],
      modelTiers = {
        image: 4, // Default to ULTRA
        audio: 4, // Default to ULTRA  
        video: 4  // Default to ULTRA
      },
    } = params;
    const urls = params.urls || options.urls || [];
    setIsAnalyzing(true);
    setError(null);
    setCreditError(null);
    setAnalysisResults(null);

    try {
      const cleanedTitle = cleanText(title) || 'PlaceHolder Title';
      const cleanedDescription = cleanText(description) || 'PlaceHolder Description';
      const cleanedScript = cleanText(scriptContent);

      if (!genScriptId && !cleanedScript.trim()) {
        const errorMsg = 'Script content cannot be empty.';
        CustomToast("error", errorMsg);
        setError({ message: errorMsg });
        return null;
      }

      if (genScriptId && currentVersionNumber !== undefined) {
        // Use the generated script analysis endpoint
        const generatedScriptResult = await analyzeGeneratedScriptAsync({
          genScriptId,
          versionNumber: currentVersionNumber,
          processingMode,
          aspectRatio,
          pauseBefore: pauseBeforeSettings,
          modelTier: modelTiers,
          urls
        });

        // Store the core result directly - no type conversion needed
        setAnalysisResults(generatedScriptResult);
        return generatedScriptResult;
      } else {
        // Use the regular script analysis for non-generated scripts
        const scriptId = firebaseIdGenerator();
        const versionId = firebaseIdGenerator();

        const result = await analyzeScript({
          title: cleanedTitle,
          description: cleanedDescription,
          script: cleanedScript,
          scriptId,
          versionId,
          processingMode,
          aspectRatio,
          pauseBefore: pauseBeforeSettings,
          modelTier: modelTiers,
          urls
        });

        setAnalysisResults(result);
        return result;
      }
    } catch (err: unknown) {
      logger.error('Analysis error:', err);

      // Type guard for API errors with response
      interface ApiError {
        response?: {
          status: number;
          data: CreditErrorResponse;
        };
      }

      // Type guard for pre-check errors
      interface PreCheckError extends Error {
        preCheckFailed: boolean;
        recommendation?: string;
      }

      // Check if error has response property (API error)
      const hasResponse = (e: unknown): e is ApiError => {
        return (
          typeof e === 'object' &&
          e !== null &&
          'response' in e &&
          typeof (e as ApiError).response === 'object'
        );
      };

      // Check if error is a pre-check error
      const isPreCheckError = (e: unknown): e is PreCheckError => {
        return (
          e instanceof Error &&
          'preCheckFailed' in e
        );
      };

      // Handle credit errors first (most specific)
      if (hasResponse(err) && err.response?.status === 402) {
        const creditErrorData = err.response.data;
        setCreditError(creditErrorData);
        logger.warn('Credit error detected:', creditErrorData);
        return null; // Don't set generic error for credit issues
      }

      // Check if this is a preCheck failure
      if (isPreCheckError(err)) {
        const errorObj = {
          message: 'Script analysis failed during pre-checks',
          isPreCheckFailed: true,
          recommendation: err.recommendation || 'Please check your script content and try again.'
        };

        CustomToast.error(errorObj.recommendation);
        setError(errorObj);
      } else {
        // Handle generic errors
        const errorMessage = err instanceof Error ? err.message : 'Failed to analyze script';
        CustomToast.error(errorMessage);
        setError({
          message: errorMessage,
          isPreCheckFailed: false
        });
      }

      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeGeneratedScriptAsync, firebaseIdGenerator]);

  const retryAnalysis = useCallback(async (
    options: AnalysisOptions,
    params: AnalysisParams = {}
  ) => {
    // Clear any existing errors - match your existing logic
    setError(null);
    setCreditError(null);

    // Retry the analysis with the same parameters
    return await analyzeScriptCore(options, params);
  }, [analyzeScriptCore]);

  return {
    isAnalyzing,
    analysisResults,
    error,
    creditError,
    resetState,
    clearCreditError,
    clearError,
    hasCreditError,
    hasGenericError,
    getCurrentErrorState,
    analyzeScriptCore,
    retryAnalysis
  };
};