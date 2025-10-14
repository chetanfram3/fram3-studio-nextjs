"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  startTransition,
} from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Backdrop,
  Fade,
  Button,
  Tooltip,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Upload,
  ChevronUp,
  ChevronDown,
  Database,
  Upload as UploadIcon,
} from "lucide-react";
import logger from "@/utils/logger";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import AudienceDetailsSection from "./components/AudienceDetailsSection";
import { API_BASE_URL } from "@/config/constants";
import CustomToast from "@/components/common/CustomToast";
import ProgressIndicator from "./components/ProgressIndicator";
import ScriptorLayout from "./ScriptorLayout";
import BasicInfoSection from "./components/BasicInfoSection";
import FormatCtaSection from "./components/FormatCtaSection";
import MustHavesSection from "./components/MustHavesSection";
import GenerateButton from "./components/GenerateButton";
import type { GenerationMode } from "./components/GenerateButton";
import LocaleRegionSectionMUI from "./components/LocaleRegionSectionMUI";
import StoryDetailsSection from "./components/StoryDetailsSection";
import BrandDetailsSection from "./components/BrandDetailsSection";
import ProductDetailsSection from "./components/ProductDetailsSection";
import CampaignDetailsSection from "./components/CampaignDetailsSection";
import StyleToneSection from "./components/StyleToneSection";
import ExecutionReferenceSection from "./components/ExecutionReferenceSection";
import SectionToggleMenu from "./components/SectionToggleMenu";
import FormPresetsManager from "./components/FormPresetsManager";
import UploadSidebar from "./components/UploadSidebar";
import { getAuthToken, fetchGeneratedScript } from "@/services/scriptService";
import {
  SectionVisibilityProvider,
  useSectionVisibility,
} from "./context/SectionVisibilityContext";
import { formSchema } from "./types";
import type { FormValues } from "./types";
import { formToApiPayload } from "./data/formToApiPayload";
import { defaultFormValues } from "./data/defaultFormValues";
import {
  saveFormToLocalStorage,
  exportFormValues,
  initializeFormValues,
} from "./utils/presetUtils";
import CreditErrorDisplay from "@/components/common/CreditErrorDisplay";
import type { CreditErrorResponse, CreditError } from "@/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface GenerationState {
  genScriptId: string;
  startTime: number;
  mode: GenerationMode;
  formData: FormValues;
}

interface UploadData {
  sessionId: string;
  files: {
    originalName: string;
    path: string;
    bucketName?: string;
  }[];
  extractionNotes?: string;
}

interface ApiErrorResponse {
  error?: string | { message: string };
  message?: string;
  code?: string;
  details?: {
    required?: number;
    available?: number;
    reserved?: number;
    estimation?: Record<string, unknown>;
  };
}

interface CreditErrorWithMessage extends CreditErrorResponse {
  message: string;
  response?: {
    status: number;
    data: ApiErrorResponse;
  };
}

interface ExtendedCreditError extends Omit<CreditError, "details"> {
  details: CreditError["details"] & {
    estimation?: Record<string, unknown> | null;
  };
}

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const GENERATION_STATE_KEY = "activeScriptGeneration";
const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_ATTEMPTS = 60; // 5 minutes
const GENERATION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// STATE MANAGEMENT FUNCTIONS
// ============================================================================

const saveGenerationState = (state: GenerationState): void => {
  try {
    sessionStorage.setItem(GENERATION_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    logger.error("Failed to save generation state:", error);
  }
};

const loadGenerationState = (): GenerationState | null => {
  try {
    const saved = sessionStorage.getItem(GENERATION_STATE_KEY);
    if (!saved) return null;

    const state = JSON.parse(saved) as GenerationState;
    const elapsed = Date.now() - state.startTime;

    if (elapsed > GENERATION_TIMEOUT) {
      sessionStorage.removeItem(GENERATION_STATE_KEY);
      return null;
    }

    return state;
  } catch (error) {
    logger.error("Failed to load generation state:", error);
    return null;
  }
};

const clearGenerationState = (): void => {
  try {
    sessionStorage.removeItem(GENERATION_STATE_KEY);
  } catch (error) {
    logger.error("Failed to clear generation state:", error);
  }
};

// ============================================================================
// API ERROR HANDLER
// ============================================================================

const handleApiResponse = async <T = unknown,>(
  response: Response,
  defaultErrorMessage = "API request failed"
): Promise<T> => {
  const responseData = (await response.json()) as ApiErrorResponse;

  if (!response.ok) {
    logger.debug("API Error Response:", {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
    });

    // Check for credit errors
    const isCreditError =
      response.status === 402 ||
      (response.status === 403 &&
        responseData.code === "INSUFFICIENT_CREDITS") ||
      responseData.code === "INSUFFICIENT_CREDITS";

    if (isCreditError) {
      logger.debug("Credit error detected, creating structured error");

      const required = responseData.details?.required || 1;
      const available = responseData.details?.available || 0;
      const shortfall = Math.max(0, required - available);
      const percentageAvailable = String(
        Math.min(Math.round((available / required) * 100), 100)
      );

      // Create the extended credit error matching CreditError structure
      const extendedError: ExtendedCreditError = {
        code: responseData.code || "INSUFFICIENT_CREDITS",
        message:
          (typeof responseData.error === "string"
            ? responseData.error
            : responseData.error?.message) || "Insufficient credits",
        details: {
          required,
          available,
          shortfall,
          percentageAvailable,
          suggestion:
            shortfall > 0
              ? `Purchase ${shortfall.toLocaleString()} credits to continue with this operation.`
              : "Please purchase additional credits to continue.",
          recommendedPackage: {
            recommended: "starter",
            reason: "Best value for your needs",
            price: 0,
            credits: shortfall,
            bonus: 0,
          },
          estimation: responseData.details?.estimation || null,
        },
      };

      const creditError: CreditErrorWithMessage = {
        message: extendedError.message,
        error: extendedError,
        response: {
          status: response.status,
          data: responseData,
        },
        status: response.status,
        scriptId: "",
        versionId: "",
        route: "",
        note: "",
      };

      const error = new Error(creditError.message);
      Object.assign(error, creditError);
      throw error;
    }

    // Handle other errors
    const errorMessage =
      (typeof responseData.error === "string"
        ? responseData.error
        : responseData.error?.message) ||
      responseData.message ||
      defaultErrorMessage;

    throw new Error(errorMessage);
  }

  return responseData as T;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function AdScriptGeneratorContent() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState(0);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [isUploadSidebarOpen, setIsUploadSidebarOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [creditError, setCreditError] = useState<CreditErrorWithMessage | null>(
    null
  );

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { isVisible } = useSectionVisibility();
  const initialFormValues = useMemo(
    () => initializeFormValues(defaultFormValues),
    []
  );

  // Setup form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: initialFormValues,
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Make toggleUploadSidebar globally accessible
  useEffect(() => {
    if (typeof window !== "undefined") {
      (
        window as Window & { toggleUploadSidebar?: () => void }
      ).toggleUploadSidebar = toggleUploadSidebar;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as Window & { toggleUploadSidebar?: () => void })
          .toggleUploadSidebar;
      }
    };
  }, []);

  // Check for active generation on mount
  useEffect(() => {
    const checkActiveGeneration = async (): Promise<void> => {
      const savedState = loadGenerationState();
      if (!savedState) return;

      form.reset(savedState.formData);

      const shouldContinue = window.confirm(
        "You have an active script generation in progress. Would you like to continue checking its status?"
      );

      if (shouldContinue) {
        await resumeGeneration(savedState);
      } else {
        clearGenerationState();
      }
    };

    void checkActiveGeneration();
  }, []);

  // Warn before leaving during generation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (isGenerating) {
        e.preventDefault();
        e.returnValue =
          "Script generation is in progress. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isGenerating]);

  // Auto-save form to localStorage
  useEffect(() => {
    const subscription = form.watch((value) => {
      saveFormToLocalStorage(value as FormValues);
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const files = event.target.files;
      if (files && files.length > 0) {
        CustomToast(
          "success",
          `${files.length} file(s) uploaded successfully!`
        );
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsFileUploadOpen(false);
    },
    []
  );

  const handleSubmitWithGrounding = useCallback(
    async (mode: GenerationMode = "detailed"): Promise<void> => {
      logger.debug("Script generation started with mode:", mode);

      setIsGenerating(true);
      setIsSubmitting(true);
      setGenerationPhase(0);

      const values = form.getValues();
      const apiPayload = formToApiPayload(values);

      try {
        CustomToast("info", "Starting script generation...");
        const token = await getAuthToken();

        const initiateResponse = await fetch(
          `${API_BASE_URL}/scripts/generate-script?processingMode=${mode}&grounding=true`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(apiPayload),
          }
        );

        const responseData = await handleApiResponse<{ genScriptId: string }>(
          initiateResponse,
          "Failed to start script generation"
        );

        const { genScriptId } = responseData;

        if (!genScriptId) {
          throw new Error("No script ID received from server");
        }

        saveGenerationState({
          genScriptId,
          startTime: Date.now(),
          mode,
          formData: values,
        });

        logger.debug("Received genScriptId:", genScriptId);

        let scriptCompleted = false;

        const checkScriptCompletion = async (): Promise<boolean> => {
          try {
            const result = await fetchGeneratedScript(genScriptId);

            if (result.status === "completed") {
              scriptCompleted = true;
              return true;
            } else if (result.status === "failed") {
              throw new Error("Script generation failed on server");
            }

            return false;
          } catch (error) {
            logger.debug("Script not ready yet:", error);
            return false;
          }
        };

        const simulateProgress = async (): Promise<void> => {
          const phases = [
            { phase: 0, duration: 5000, description: "Initializing" },
            { phase: 1, duration: 30000, description: "Analyzing Context" },
            { phase: 2, duration: 24000, description: "Evaluating Concepts" },
            { phase: 3, duration: 30000, description: "Drafting Script" },
            { phase: 4, duration: 16000, description: "Running QA Checks" },
          ];

          for (const step of phases) {
            if (scriptCompleted) break;

            setGenerationPhase(step.phase);
            logger.debug(`Progress: ${step.description}`);

            const checkInterval = 2500;
            const checks = Math.ceil(step.duration / checkInterval);

            for (let i = 0; i < checks && !scriptCompleted; i++) {
              await sleep(
                Math.min(checkInterval, step.duration - i * checkInterval)
              );
            }
          }
        };

        const pollForCompletion = async (): Promise<void> => {
          await sleep(2000);

          let attempts = 0;

          while (!scriptCompleted && attempts < MAX_POLLING_ATTEMPTS) {
            const isComplete = await checkScriptCompletion();

            if (isComplete) {
              logger.debug("Script generation completed!");
              break;
            }

            attempts++;

            if (attempts < MAX_POLLING_ATTEMPTS) {
              await sleep(POLLING_INTERVAL);
            }
          }

          if (!scriptCompleted && attempts >= MAX_POLLING_ATTEMPTS) {
            throw new Error("Script generation timed out after 5 minutes");
          }
        };

        await Promise.all([simulateProgress(), pollForCompletion()]);

        if (scriptCompleted) {
          clearGenerationState();
          setGenerationPhase(4);
          await sleep(1000);

          CustomToast("success", "Script Generated Successfully!");

          startTransition(() => {
            router.push(`/dashboard/scripts/generated/${genScriptId}`);
          });
        } else {
          throw new Error("Script generation did not complete");
        }
      } catch (error) {
        clearGenerationState();

        if (error instanceof Error && "response" in error) {
          const errorWithResponse = error as Error & {
            response?: { status?: number };
          };
          const status = errorWithResponse.response?.status;

          if (status === 402 || status === 403) {
            logger.debug("Setting credit error state");
            setCreditError(error as unknown as CreditErrorWithMessage);
            setGenerationPhase(0);
            setIsSubmitting(false);
            setIsGenerating(false);
            return;
          }
        }

        const errorMessage =
          error instanceof Error ? error.message : "Failed to generate script";
        logger.error("Script generation error:", errorMessage);

        CustomToast("error", errorMessage);
        setGenerationPhase(0);
      } finally {
        setIsSubmitting(false);
        setIsGenerating(false);
      }
    },
    [form, router]
  );

  const resumeGeneration = useCallback(
    async (state: GenerationState): Promise<void> => {
      const { genScriptId, startTime } = state;
      const elapsed = Date.now() - startTime;

      setIsGenerating(true);
      setIsSubmitting(true);

      const estimatedPhase = Math.min(Math.floor(elapsed / 7000), 4);
      setGenerationPhase(estimatedPhase);

      try {
        const currentStatus = await fetchGeneratedScript(genScriptId);

        if (currentStatus.status === "completed") {
          clearGenerationState();
          CustomToast("success", "Your script is ready!");
          startTransition(() => {
            router.push(`/dashboard/scripts/generated/${genScriptId}`);
          });
          return;
        } else if (currentStatus.status === "failed") {
          clearGenerationState();
          throw new Error("Script generation failed");
        }

        let scriptCompleted = false;
        const remainingTime = GENERATION_TIMEOUT - elapsed;
        const maxRemainingAttempts = Math.floor(
          remainingTime / POLLING_INTERVAL
        );

        let attempts = 0;
        while (!scriptCompleted && attempts < maxRemainingAttempts) {
          await sleep(POLLING_INTERVAL);

          const result = await fetchGeneratedScript(genScriptId);

          if (result.status === "completed") {
            scriptCompleted = true;
            clearGenerationState();
            CustomToast("success", "Script Generated Successfully!");
            startTransition(() => {
              router.push(`/dashboard/scripts/generated/${genScriptId}`);
            });
            break;
          } else if (result.status === "failed") {
            throw new Error("Script generation failed");
          }

          attempts++;

          const totalElapsed = Date.now() - startTime;
          const progress = Math.min(
            (totalElapsed / GENERATION_TIMEOUT) * 100,
            95
          );
          const phase = Math.min(Math.floor(progress / 20), 4);
          setGenerationPhase(phase);
        }

        if (!scriptCompleted) {
          throw new Error("Script generation timed out");
        }
      } catch (error) {
        clearGenerationState();
        const errorMessage =
          error instanceof Error ? error.message : "Failed to generate script";
        CustomToast("error", errorMessage);
      } finally {
        setIsSubmitting(false);
        setIsGenerating(false);
      }
    },
    [router]
  );

  const onSubmit = useCallback((data: FormValues): void => {
    // This is intentionally empty - actual submission is handled by Generate button
    logger.debug("Form submitted:", data);
  }, []);

  const handleLoadPreset = useCallback(
    (preset: FormValues): void => {
      form.reset(preset);
      saveFormToLocalStorage(preset);
    },
    [form]
  );

  const handleExportForm = useCallback((): void => {
    const values = form.getValues();
    exportFormValues(
      values,
      `adscript-${values.projectName || "untitled"}.json`
    );
    CustomToast("success", "Form configuration exported successfully");
  }, [form]);

  const toggleUploadSidebar = useCallback((): void => {
    if (isPresetsOpen) {
      setIsPresetsOpen(false);
    }
    setIsUploadSidebarOpen(!isUploadSidebarOpen);
  }, [isPresetsOpen, isUploadSidebarOpen]);

  const handleUploadComplete = useCallback(
    (uploadData: UploadData): void => {
      logger.debug("Files uploaded successfully:", uploadData);

      const currentValues = form.getValues();
      const extractionNotes =
        uploadData.extractionNotes ||
        currentValues.executionReference.referenceFiles.extractionNotes ||
        "";

      const updatedFormValues: FormValues = {
        ...currentValues,
        executionReference: {
          ...currentValues.executionReference,
          referenceFiles: {
            extractionNotes,
            filePaths: uploadData.files.map((file) => file.path),
          },
        },
      };

      form.reset(updatedFormValues);
      saveFormToLocalStorage(updatedFormValues);
      setIsUploadSidebarOpen(false);

      CustomToast("success", "Files uploaded and form updated successfully");
    },
    [form]
  );

  const handleClearForm = useCallback((): void => {
    form.reset(defaultFormValues);
    saveFormToLocalStorage(defaultFormValues);
    CustomToast("success", "Form has been cleared");
  }, [form]);

  const handleCreditRetry = useCallback(async (): Promise<void> => {
    if (!creditError) return;
    setCreditError(null);
    await handleSubmitWithGrounding("detailed");
  }, [creditError, handleSubmitWithGrounding]);

  const handlePurchaseCredits = useCallback((): void => {
    startTransition(() => {
      router.push("/credits/purchase");
    });
  }, [router]);

  const handleDismissCreditError = useCallback((): void => {
    setCreditError(null);
  }, []);

  // ============================================================================
  // UNIFIED TOGGLE COMPONENT
  // ============================================================================

  const UnifiedToggle = useMemo(() => {
    const Component = () => {
      const [activeMode, setActiveMode] = useState<"presets" | "uploads">(
        isPresetsOpen ? "presets" : isUploadSidebarOpen ? "uploads" : "uploads"
      );

      useEffect(() => {
        if (isPresetsOpen) setActiveMode("presets");
        else if (isUploadSidebarOpen) setActiveMode("uploads");
      }, []);

      const toggleMode = useCallback((): void => {
        if (isPresetsOpen) setIsPresetsOpen(false);
        if (isUploadSidebarOpen) setIsUploadSidebarOpen(false);
        setActiveMode(activeMode === "presets" ? "uploads" : "presets");
      }, [activeMode]);

      const toggleSidebar = useCallback((): void => {
        if (activeMode === "presets") {
          if (isUploadSidebarOpen) setIsUploadSidebarOpen(false);
          setIsPresetsOpen(!isPresetsOpen);
        } else {
          if (isPresetsOpen) setIsPresetsOpen(false);
          setIsUploadSidebarOpen(!isUploadSidebarOpen);
        }
      }, [activeMode]);

      return (
        <Box
          sx={{
            position: "fixed",
            right: 0,
            top: "28%",
            zIndex: theme.zIndex.drawer - 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            pointerEvents: "auto",
          }}
        >
          <Box
            sx={{
              mb: 1,
              mr: 1,
              bgcolor: "background.paper", // ✅ FIXED: Use background.paper for elevated surfaces
              borderRadius: `${brand.borderRadius}px 0 0 ${brand.borderRadius}px`, // ✅ FIXED: Use brand radius
              boxShadow: theme.shadows[3],
              borderLeft: 1,
              borderTop: 1,
              borderBottom: 1,
              borderRight: "none",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 0,
              pointerEvents: "auto",
              position: "relative",
              zIndex: theme.zIndex.drawer + 2,
              transition: "transform 0.2s ease-in-out",
              "&:hover": {
                transform: "translateX(-2px)",
              },
              overflow: "hidden",
            }}
          >
            <Tooltip
              title={
                activeMode === "presets"
                  ? "Switch to Upload Files"
                  : "Switch to Form Presets"
              }
            >
              <IconButton
                onClick={toggleMode}
                size="small"
                color="primary" // ✅ FIXED: Changed from secondary to primary
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1), // ✅ FIXED: Use primary
                  height: "100%",
                  borderRadius: 0,
                  p: 1,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.2), // ✅ FIXED: Use primary
                  },
                }}
              >
                {activeMode === "presets" ? (
                  <Database size={16} />
                ) : (
                  <UploadIcon size={16} />
                )}
              </IconButton>
            </Tooltip>

            <Button
              onClick={toggleSidebar}
              size="small"
              color="primary" // ✅ FIXED: Changed from secondary to primary
              variant="contained" // ✅ ADDED: Explicit variant
              endIcon={
                <ChevronDown
                  size={14}
                  style={{
                    transform:
                      (activeMode === "presets" && isPresetsOpen) ||
                      (activeMode === "uploads" && isUploadSidebarOpen)
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s",
                  }}
                />
              }
              sx={{
                px: 2,
                py: 0.75,
                fontWeight: 500,
                fontSize: "0.875rem",
                textTransform: "none",
                borderRadius: 0,
                minWidth: "135px",
                justifyContent: "space-between",
                transition: "all 0.2s",
                height: "38px",
                fontFamily: brand.fonts.body, // ✅ ADDED: Use brand fonts
                // Remove custom bgcolor/color - let color="primary" handle it
                "&:hover": {
                  bgcolor: "primary.dark", // ✅ FIXED: Use primary.dark
                },
              }}
            >
              {activeMode === "presets" ? "Form Presets" : "Upload Files"}
            </Button>
          </Box>
        </Box>
      );
    };

    return Component;
  }, [isPresetsOpen, isUploadSidebarOpen, theme]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <ScriptorLayout>
      <Box component="form" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Basic Information */}
        <Box sx={{ mb: 4 }}>
          <BasicInfoSection form={form} />
        </Box>

        {/* Format & Call to Action */}
        {isVisible("formatCallToAction") && (
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                py: 1,
                borderBottom: 1,
                borderColor: "divider",
              }}
              onClick={() =>
                form.setValue(
                  "ui.formatCallToActionExpanded",
                  !form.getValues("ui.formatCallToActionExpanded")
                )
              }
            >
              <Typography
                variant="subtitle1"
                fontWeight="medium"
                sx={{ color: "text.primary", fontFamily: brand.fonts.heading }}
              >
                Format & Call to Action
              </Typography>

              <IconButton size="small" sx={{ color: "text.primary" }}>
                {form.watch("ui.formatCallToActionExpanded") ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </IconButton>
            </Box>

            {form.watch("ui.formatCallToActionExpanded") && (
              <Box sx={{ mt: 2 }}>
                <FormatCtaSection form={form} />
              </Box>
            )}
          </Box>
        )}

        {/* Locale / Region & Language */}
        {isVisible("localeRegion") && (
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                py: 1,
                borderBottom: 1,
                borderColor: "divider",
              }}
              onClick={() =>
                form.setValue(
                  "ui.localeRegionExpanded",
                  !form.getValues("ui.localeRegionExpanded")
                )
              }
            >
              <Typography
                variant="subtitle1"
                fontWeight="medium"
                sx={{ color: "text.primary", fontFamily: brand.fonts.heading }}
              >
                Locale / Region & Language
              </Typography>

              <IconButton size="small" sx={{ color: "text.primary" }}>
                {form.watch("ui.localeRegionExpanded") ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </IconButton>
            </Box>

            {form.watch("ui.localeRegionExpanded") && (
              <Box sx={{ mt: 2 }}>
                <LocaleRegionSectionMUI form={form} />
              </Box>
            )}
          </Box>
        )}

        {/* Must-Haves */}
        <Box sx={{ mt: 2 }}>
          <MustHavesSection form={form} />
        </Box>

        {/* Optional Sections */}
        {isVisible("audience") && (
          <Box sx={{ mb: 4 }}>
            <AudienceDetailsSection form={form} />
          </Box>
        )}

        {isVisible("story") && (
          <Box sx={{ mb: 4 }}>
            <StoryDetailsSection form={form} />
          </Box>
        )}

        {isVisible("brand") && (
          <Box sx={{ mb: 4 }}>
            <BrandDetailsSection form={form} />
          </Box>
        )}

        {isVisible("product") && (
          <Box sx={{ mb: 4 }}>
            <ProductDetailsSection form={form} />
          </Box>
        )}

        {isVisible("campaign") && (
          <Box sx={{ mb: 4 }}>
            <CampaignDetailsSection form={form} />
          </Box>
        )}

        {isVisible("style") && (
          <Box sx={{ mb: 4 }}>
            <StyleToneSection form={form} />
          </Box>
        )}

        {isVisible("execution") && (
          <Box sx={{ mb: 4 }}>
            <ExecutionReferenceSection form={form} />
          </Box>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          multiple
          onChange={handleFileChange}
        />

        {/* File Upload Dialog */}
        <Dialog
          open={isFileUploadOpen}
          onClose={() => setIsFileUploadOpen(false)}
        >
          <DialogTitle>Upload Reference Files</DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload size={16} />}
                sx={{ mb: 2 }}
              >
                Select Files
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleFileChange}
                />
              </Button>
              <Typography variant="body2" color="text.secondary">
                Drag and drop files here or click to browse
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsFileUploadOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Section Toggle Menu */}
        <SectionToggleMenu />

        {/* Generate Button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            my: 4,
            width: "100%",
          }}
        >
          <GenerateButton
            isLoading={isSubmitting || isGenerating}
            fullWidth={true}
            onClick={(mode) => {
              try {
                logger.debug("Generate button clicked with mode:", mode);

                if (Object.keys(form.formState.errors).length > 0) {
                  logger.debug("Form errors:", form.formState.errors);
                  CustomToast(
                    "warning",
                    "Please fix form errors before generating"
                  );
                } else {
                  logger.debug("Form is valid, submitting with mode:", mode);
                  void handleSubmitWithGrounding(mode);
                }
              } catch (error) {
                logger.error("Error during form submission:", error);
              }
            }}
          />
        </Box>
      </Box>

      {/* Unified Toggle */}
      <UnifiedToggle />

      {/* Form Presets Manager */}
      <FormPresetsManager
        isOpen={isPresetsOpen}
        isUploadSidebarOpen={isUploadSidebarOpen}
        onClose={() => setIsPresetsOpen(false)}
        currentFormValues={form.getValues()}
        onLoadPreset={handleLoadPreset}
        onExportForm={handleExportForm}
        onClearForm={handleClearForm}
      />

      {/* Upload Sidebar */}
      <UploadSidebar
        isOpen={isUploadSidebarOpen}
        isPresetsOpen={isPresetsOpen}
        onToggle={() => setIsUploadSidebarOpen(!isUploadSidebarOpen)}
        onClose={() => setIsUploadSidebarOpen(false)}
        maxTotalSize={4}
        onUploadComplete={handleUploadComplete}
      />

      {/* Credit Error Display */}
      <CreditErrorDisplay
        open={!!creditError}
        onOpenChange={(open) => {
          if (!open) {
            handleDismissCreditError();
          }
        }}
        creditError={creditError || undefined}
        onRetry={handleCreditRetry}
      />

      {/* Progress Indicator */}
      <Backdrop
        open={isGenerating}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          color: "#fff",
          backgroundColor: alpha(theme.palette.background.default, 0.5),
          backdropFilter: "blur(2px)",
        }}
      >
        <Fade in={isGenerating} timeout={{ enter: 400, exit: 400 }}>
          <Box>
            <ProgressIndicator currentPhase={generationPhase} />
          </Box>
        </Fade>
      </Backdrop>
    </ScriptorLayout>
  );
}

// ============================================================================
// EXPORT WITH PROVIDER
// ============================================================================

export default function AdScriptGenerator() {
  return (
    <SectionVisibilityProvider>
      <AdScriptGeneratorContent />
    </SectionVisibilityProvider>
  );
}
