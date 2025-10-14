"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  startTransition,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Box,
  useTheme,
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
import { Upload, ChevronUp, ChevronDown, Database } from "lucide-react";
import logger from "@/utils/logger";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import AudienceDetailsSection from "./components/AudienceDetailsSection";
import { API_BASE_URL } from "@/config/constants";
import CustomToast from "@/components/common/CustomToast";
import ProgressIndicator from "./components/ProgressIndicator";

// Import components
import ScriptorLayout from "./ScriptorLayout";
import BasicInfoSection from "./components/BasicInfoSection";
import FormatCtaSection from "./components/FormatCtaSection";
import MustHavesSection from "./components/MustHavesSection";
import GenerateButton from "./components/GenerateButton";
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
import { getAuthToken } from "@/services/scriptService";
import { fetchGeneratedScript } from "@/services/scriptService";

// Import context
import {
  SectionVisibilityProvider,
  useSectionVisibility,
} from "./context/SectionVisibilityContext";

// Import types and utilities
import { formSchema } from "./types";
import type { FormValues } from "./types";
import type { GenerationMode } from "./components/GenerateButton";
import { formToApiPayload } from "./data/formToApiPayload";
import { defaultFormValues } from "./data/defaultFormValues";
import {
  saveFormToLocalStorage,
  exportFormValues,
  initializeFormValues,
} from "./utils/presetUtils";
import CreditErrorDisplay from "@/components/common/CreditErrorDisplay";

// Interfaces
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

interface CreditErrorData {
  message: string;
  error: {
    message: string;
    details: {
      code: string;
      required: number;
      available: number;
      reserved: number;
      shortfall: number;
      percentageAvailable: number;
      suggestion: string;
      estimation: unknown;
    };
  };
  response: {
    status: number;
    data: unknown;
  };
  scriptId?: string;
  versionId?: string;
  route?: string;
  note?: string;
}

// Utility function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// State management constants
const GENERATION_STATE_KEY = "activeScriptGeneration";

const saveGenerationState = (state: GenerationState): void => {
  sessionStorage.setItem(GENERATION_STATE_KEY, JSON.stringify(state));
};

const loadGenerationState = (): GenerationState | null => {
  const saved = sessionStorage.getItem(GENERATION_STATE_KEY);
  if (!saved) return null;

  try {
    const state = JSON.parse(saved) as GenerationState;
    const elapsed = Date.now() - state.startTime;
    if (elapsed > 5 * 60 * 1000) {
      sessionStorage.removeItem(GENERATION_STATE_KEY);
      return null;
    }
    return state;
  } catch {
    return null;
  }
};

// API Response Handler
const handleApiResponse = async <T = unknown,>(
  response: Response,
  defaultErrorMessage = "API request failed"
): Promise<T> => {
  const responseData = await response.json();

  if (!response.ok) {
    logger.debug("API Error Response:", {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
    });

    // Check for credit error
    if (
      response.status === 402 ||
      (response.status === 403 &&
        responseData.code === "INSUFFICIENT_CREDITS") ||
      responseData.code === "INSUFFICIENT_CREDITS"
    ) {
      logger.debug("Credit error detected, creating structured error");

      const required = responseData.details?.required || 1;
      const available = responseData.details?.available || 0;
      const shortfall = Math.max(0, required - available);
      const percentageAvailable = Math.min(
        Math.round((available / required) * 100),
        100
      );

      const creditError: CreditErrorData = {
        message:
          responseData.error ||
          "You don't have enough credits to generate this script.",
        error: {
          message: responseData.error || "Insufficient credits",
          details: {
            code: responseData.code || "INSUFFICIENT_CREDITS",
            required,
            available,
            reserved: responseData.details?.reserved || 0,
            shortfall,
            percentageAvailable,
            suggestion:
              shortfall > 0
                ? `Purchase ${shortfall.toLocaleString()} credits to continue with this operation.`
                : "Please purchase additional credits to continue.",
            estimation: responseData.details?.estimation || null,
          },
        },
        response: {
          status: response.status,
          data: responseData,
        },
      };

      const error = new Error(creditError.message);
      Object.assign(error, creditError);
      throw error;
    }

    const errorMessage =
      responseData.error?.message ||
      responseData.error ||
      responseData.message ||
      defaultErrorMessage;

    throw new Error(errorMessage);
  }

  return responseData as T;
};

function AdScriptGeneratorContent() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialFormValues = initializeFormValues(defaultFormValues);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState(0);
  const { isVisible } = useSectionVisibility();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadSidebarOpen, setIsUploadSidebarOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [creditError, setCreditError] = useState<CreditErrorData | null>(null);

  // Setup form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialFormValues,
  });

  const hasCreditError = (): boolean => creditError !== null;

  const clearCreditError = (): void => {
    setCreditError(null);
  };

  const clearGenerationState = (): void => {
    sessionStorage.removeItem(GENERATION_STATE_KEY);
    setCreditError(null);
  };

  // Make toggleUploadSidebar accessible globally
  useEffect(() => {
    const globalWindow = window as typeof window & {
      toggleUploadSidebar?: () => void;
    };
    globalWindow.toggleUploadSidebar = toggleUploadSidebar;

    return () => {
      delete globalWindow.toggleUploadSidebar;
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

    checkActiveGeneration();
  }, []);

  // Add beforeunload warning when generating
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

  // Save form to localStorage on changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      saveFormToLocalStorage(value as FormValues);
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const files = event.target.files;
    if (files && files.length > 0) {
      CustomToast("success", `${files.length} file(s) uploaded successfully!`);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsFileUploadOpen(false);
  };

  const handleSubmitWithGrounding = async (
    mode: GenerationMode = "detailed"
  ): Promise<void> => {
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

        const maxAttempts = 60;
        let attempts = 0;

        while (!scriptCompleted && attempts < maxAttempts) {
          const isComplete = await checkScriptCompletion();

          if (isComplete) {
            logger.debug("Script generation completed!");
            break;
          }

          attempts++;

          if (attempts < maxAttempts) {
            await sleep(5000);
          }
        }

        if (!scriptCompleted && attempts >= maxAttempts) {
          throw new Error("Script generation timed out after 5 minutes");
        }
      };

      await Promise.all([simulateProgress(), pollForCompletion()]);

      if (scriptCompleted) {
        clearGenerationState();
        setGenerationPhase(4);
        await sleep(1000);

        CustomToast("success", "Script Generated Successfully!");

        setTimeout(() => {
          router.push(`/dashboard/scripts/generated/${genScriptId}`);
        }, 500);
      } else {
        throw new Error("Script generation did not complete");
      }
    } catch (error) {
      clearGenerationState();

      if (error instanceof Error) {
        const errorWithResponse = error as Error & {
          response?: { status: number };
        };

        if (errorWithResponse.response?.status) {
          const status = errorWithResponse.response.status;
          if (status === 402 || status === 403) {
            logger.debug("Setting credit error state");
            setCreditError(error as unknown as CreditErrorData);
            setGenerationPhase(0);
            setIsSubmitting(false);
            setIsGenerating(false);
            return;
          }
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
  };

  const resumeGeneration = async (state: GenerationState): Promise<void> => {
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
        router.push(`/dashboard/scripts/generated/${genScriptId}`);
        return;
      } else if (currentStatus.status === "failed") {
        clearGenerationState();
        throw new Error("Script generation failed");
      }

      let scriptCompleted = false;
      const remainingTime = 5 * 60 * 1000 - elapsed;
      const maxRemainingAttempts = Math.floor(remainingTime / 5000);

      let attempts = 0;
      while (!scriptCompleted && attempts < maxRemainingAttempts) {
        await sleep(5000);

        const result = await fetchGeneratedScript(genScriptId);

        if (result.status === "completed") {
          scriptCompleted = true;
          clearGenerationState();
          CustomToast("success", "Script Generated Successfully!");
          router.push(`/dashboard/scripts/generated/${genScriptId}`);
          break;
        } else if (result.status === "failed") {
          throw new Error("Script generation failed");
        }

        attempts++;

        const totalElapsed = Date.now() - startTime;
        const progress = Math.min((totalElapsed / (5 * 60 * 1000)) * 100, 95);
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
  };

  const onSubmit = (_data: FormValues): Promise<void> => {
    return Promise.resolve();
  };

  const handleLoadPreset = (preset: FormValues): void => {
    form.reset(preset);
    saveFormToLocalStorage(preset);
  };

  const handleExportForm = (): void => {
    exportFormValues(
      form.getValues(),
      `adscript-${form.getValues().projectName || "untitled"}.json`
    );
    CustomToast("success", "Form configuration exported successfully");
  };

  const toggleUploadSidebar = (): void => {
    if (isPresetsOpen) {
      setIsPresetsOpen(false);
    }
    setIsUploadSidebarOpen(!isUploadSidebarOpen);
  };

  const handleUploadComplete = (uploadData: UploadData): void => {
    logger.debug("Files uploaded successfully:", uploadData);

    const extractionNotes =
      uploadData.extractionNotes ||
      form.getValues().executionReference.referenceFiles.extractionNotes ||
      "";

    const updatedFormValues: FormValues = {
      ...form.getValues(),
      executionReference: {
        ...form.getValues().executionReference,
        referenceFiles: {
          ...form.getValues().executionReference.referenceFiles,
          extractionNotes,
          fileSessionId: uploadData.sessionId,
          filePaths: uploadData.files.map((file) => file.path),
          uploadedFiles: uploadData.files.map((file) => ({
            name: file.originalName,
            path: file.path,
          })),
        },
      },
    };

    form.reset(updatedFormValues);
    saveFormToLocalStorage(updatedFormValues);
    setIsUploadSidebarOpen(false);
    CustomToast("success", "Files uploaded and form updated successfully");
  };

  const handleClearForm = (): void => {
    form.reset(defaultFormValues);
    saveFormToLocalStorage(defaultFormValues);
    CustomToast("success", "Form has been cleared");
  };

  // Unified toggle component
  const UnifiedToggle = (): JSX.Element => {
    const [activeMode, setActiveMode] = useState<"presets" | "uploads">(
      isPresetsOpen ? "presets" : isUploadSidebarOpen ? "uploads" : "uploads"
    );

    useEffect(() => {
      if (isPresetsOpen) setActiveMode("presets");
      else if (isUploadSidebarOpen) setActiveMode("uploads");
    }, []);

    const toggleMode = (): void => {
      if (isPresetsOpen) setIsPresetsOpen(false);
      if (isUploadSidebarOpen) setIsUploadSidebarOpen(false);
      setActiveMode(activeMode === "presets" ? "uploads" : "presets");
    };

    const toggleSidebar = (): void => {
      if (activeMode === "presets") {
        if (isUploadSidebarOpen) setIsUploadSidebarOpen(false);
        setIsPresetsOpen(!isPresetsOpen);
      } else {
        if (isPresetsOpen) setIsPresetsOpen(false);
        setIsUploadSidebarOpen(!isUploadSidebarOpen);
      }
    };

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
            bgcolor: "background.default",
            borderRadius: `${brand.borderRadius}px 0 0 ${brand.borderRadius}px`,
            boxShadow: theme.shadows[8],
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
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
                height: "100%",
                borderRadius: 0,
                p: 1,
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              {activeMode === "presets" ? (
                <Database size={16} />
              ) : (
                <Upload size={16} />
              )}
            </IconButton>
          </Tooltip>

          <Button
            onClick={toggleSidebar}
            size="small"
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
              bgcolor: "primary.main",
              color: "primary.contrastText",
              px: 2,
              py: 0.75,
              fontWeight: 500,
              fontSize: "0.875rem",
              textTransform: "none",
              borderRadius: 0,
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.9),
              },
              minWidth: "135px",
              justifyContent: "space-between",
              transition: "all 0.2s",
              height: "38px",
            }}
          >
            {activeMode === "presets" ? "Form Presets" : "Upload Files"}
          </Button>
        </Box>
      </Box>
    );
  };

  const handleCreditRetry = async (): Promise<void> => {
    if (!creditError) return;
    clearCreditError();
    await handleSubmitWithGrounding("detailed");
  };

  const handlePurchaseCredits = (): void => {
    router.push("/credits/purchase");
  };

  const handleDismissCreditError = (): void => {
    clearCreditError();
  };

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
                sx={{ color: "text.primary" }}
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
                sx={{ color: "text.primary" }}
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
          PaperProps={{
            sx: {
              backgroundImage: "none !important",
              bgcolor: "background.paper",
              borderColor: "primary.main",
              borderWidth: 2,
              borderStyle: "solid",
              borderRadius: `${brand.borderRadius * 1.5}px`,
              boxShadow: theme.shadows[24],
            },
          }}
          BackdropProps={{
            sx: {
              bgcolor: isDarkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <DialogTitle sx={{ color: "text.primary" }}>
            Upload Reference Files
          </DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload size={16} />}
                sx={{
                  mb: 2,
                  borderColor: "primary.main",
                  color: "primary.main",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
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
            <Button onClick={() => setIsFileUploadOpen(false)} color="primary">
              Cancel
            </Button>
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
            onClick={(mode: GenerationMode) => {
              try {
                logger.debug("Generate button clicked with mode:", mode);
                logger.debug("Form values:", form.getValues());
                logger.debug("Form state:", form.formState);

                if (Object.keys(form.formState.errors).length > 0) {
                  logger.debug("Errors:", form.formState.errors);
                  logger.debug("Form is invalid");
                  CustomToast(
                    "warning",
                    "Please fix form errors before generating"
                  );
                } else {
                  logger.debug("Form is valid, submitting with mode:", mode);
                  handleSubmitWithGrounding(mode);
                }
              } catch (error) {
                logger.error("Error during form submission:", error);
              }
            }}
          />
        </Box>
      </Box>

      {/* Unified Toggle Menu */}
      <UnifiedToggle />

      {/* FormPresetsManager */}
      <FormPresetsManager
        isOpen={isPresetsOpen}
        isUploadSidebarOpen={isUploadSidebarOpen}
        onClose={() => setIsPresetsOpen(false)}
        currentFormValues={form.getValues()}
        onLoadPreset={handleLoadPreset}
        onExportForm={handleExportForm}
        onClearForm={handleClearForm}
      />

      {/* UploadSidebar */}
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
        open={hasCreditError() && !!creditError}
        onOpenChange={(open: boolean) => {
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
          color: "text.primary",
          bgcolor: isDarkMode ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(2px)",
        }}
      >
        <Fade
          in={isGenerating}
          timeout={{
            enter: 400,
            exit: 400,
          }}
        >
          <Box>
            <ProgressIndicator currentPhase={generationPhase} />
          </Box>
        </Fade>
      </Backdrop>
    </ScriptorLayout>
  );
}

// Wrap with SectionVisibilityProvider
export default function AdScriptGenerator() {
  return (
    <SectionVisibilityProvider>
      <AdScriptGeneratorContent />
    </SectionVisibilityProvider>
  );
}
