"use client";

import { useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Alert,
  IconButton,
  Container,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentBrand } from "@/config/brandConfig";
import { useStreaming } from "@/providers/StreamingProvider";
import StreamContent from "./StreamContent";
import {
  UNIFIED_ANALYSIS_ENDPOINT,
  ANALYSIS_TITLES,
  AnalysisType,
} from "@/config/analysisTypes";
import { auth } from "@/lib/firebase";
import { API_BASE_URL } from "@/config/constants";
import logger from "@/utils/logger";

/**
 * StreamingAnalysisView - Manual-trigger streaming analysis component
 *
 * DEBUG COMPONENT - API is called ONLY when user clicks "Start Analysis" button
 * - No automatic execution on mount
 * - No automatic retries on failure
 * - User has full manual control
 * - Clean navigation history (no intermediate loading pages)
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Uses refs to prevent unnecessary re-renders
 * - Single execution per button click
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 */

// Helper function to extract text content from chunks
const extractTextFromChunks = (chunks: unknown[]) => {
  return chunks
    .map((chunk) => {
      if (
        typeof chunk === "object" &&
        chunk !== null &&
        "candidates" in chunk &&
        Array.isArray((chunk as { candidates?: unknown[] }).candidates)
      ) {
        const candidates = (chunk as { candidates: unknown[] }).candidates;
        const firstCandidate = candidates[0];
        if (
          typeof firstCandidate === "object" &&
          firstCandidate !== null &&
          "content" in firstCandidate
        ) {
          const content = (
            firstCandidate as { content?: { parts?: Array<{ text?: string }> } }
          ).content;
          return content?.parts?.[0]?.text || "";
        }
      } else if (typeof chunk === "string") {
        return chunk;
      }
      return "";
    })
    .join("");
};

export default function StreamingAnalysisView() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const scriptId = (params?.scriptId as string) || "";
  const versionId = (params?.versionId as string) || "";
  const analysisType = (params?.analysisType as string) || "";

  const { startStreaming, isStreaming, error, chunks, resetStream } =
    useStreaming();

  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const isRequestInProgressRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check if chunks contain enough meaningful data
  const hasSignificantData = useCallback(() => {
    if (chunks.length > 5) return true;

    const content = extractTextFromChunks(chunks);
    return (
      content.length > 500 && content.includes("{") && content.includes("}")
    );
  }, [chunks]);

  // Start the analysis when user clicks the button
  const handleStartAnalysis = useCallback(async () => {
    if (!scriptId || !versionId || !analysisType) {
      logger.warn("Missing required parameters for analysis");
      return;
    }

    // Prevent multiple simultaneous requests
    if (isRequestInProgressRef.current) {
      logger.info("Request already in progress, skipping");
      return;
    }

    isRequestInProgressRef.current = true;
    setHasStarted(true);

    try {
      logger.info("Starting analysis", { scriptId, versionId, analysisType });

      resetStream();
      setIsAnalysisComplete(false);
      const now = Date.now();
      setStartTime(now);
      setProcessingTime(0);

      // Start the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setProcessingTime(Math.floor((Date.now() - now) / 1000));
      }, 1000);

      await startStreaming(
        `${API_BASE_URL}${UNIFIED_ANALYSIS_ENDPOINT}?stream=true`,
        {
          userId: auth.currentUser?.uid,
          scriptId,
          versionId,
          analysisType,
        }
      );

      logger.info("Analysis completed successfully");
    } catch (err) {
      logger.error("Analysis error:", err);

      // NO AUTOMATIC RETRY - User must manually retry via button
      // This is a debug component, so we want explicit control
    } finally {
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Small delay to prevent rapid re-execution
      setTimeout(() => {
        isRequestInProgressRef.current = false;
      }, 1000);
    }
  }, [scriptId, versionId, analysisType, startStreaming, resetStream]);

  // Handle retry - just calls the start function again
  const handleRetry = useCallback(() => {
    logger.info("Manual retry triggered by user");
    handleStartAnalysis();
  }, [handleStartAnalysis]);

  // Check for completion when streaming stops
  const checkCompletion = useCallback(() => {
    if (
      !isStreaming &&
      hasSignificantData() &&
      !isAnalysisComplete &&
      hasStarted
    ) {
      setIsAnalysisComplete(true);

      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      queryClient.invalidateQueries({
        queryKey: ["scriptDetails", scriptId, versionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["scriptAnalysis", scriptId, versionId],
      });

      if (chunks.length > 0) {
        // Auto-redirect after successful completion
        const redirectTimer = setTimeout(() => {
          router.push(
            `/scripts/${scriptId}/version/${versionId}/analysis/view/${analysisType}`
          );
        }, 2000);

        return () => clearTimeout(redirectTimer);
      }
    }
  }, [
    isStreaming,
    hasSignificantData,
    isAnalysisComplete,
    hasStarted,
    scriptId,
    versionId,
    analysisType,
    router,
    queryClient,
    chunks.length,
  ]);

  // Use effect only for checking completion, not for starting
  useState(() => {
    checkCompletion();
  });

  const handleBack = () => {
    router.push(`/scripts/${scriptId}/version/${versionId}`);
  };

  const handleViewResults = () => {
    router.push(
      `/scripts/${scriptId}/version/${versionId}/analysis/view/${analysisType}`
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <IconButton
          onClick={handleBack}
          sx={{
            color: "primary.main",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h4"
          sx={{
            color: "primary.main",
            fontFamily: brand.fonts.heading,
          }}
        >
          {analysisType && ANALYSIS_TITLES[analysisType as AnalysisType]}
        </Typography>

        {isStreaming && (
          <Box
            sx={{ display: "flex", alignItems: "center", ml: "auto", gap: 2 }}
          >
            <CircularProgress size={24} color="primary" />
            <Typography variant="body2" sx={{ fontFamily: brand.fonts.body }}>
              Time elapsed: {processingTime}s ({chunks.length} chunks)
            </Typography>
          </Box>
        )}
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
        }}
      >
        {/* Error State */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              bgcolor: "background.paper",
              color: "text.primary",
              borderRadius: `${brand.borderRadius}px`,
              borderLeft: 4,
              borderColor: "error.main",
              fontFamily: brand.fonts.body,
            }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleRetry}
                disabled={isRequestInProgressRef.current}
                sx={{
                  fontFamily: brand.fonts.body,
                }}
              >
                {isRequestInProgressRef.current ? "Retrying..." : "Retry"}
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Initial State - Show Start Button */}
        {!hasStarted && !error && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              py: 8,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: "text.primary",
                fontFamily: brand.fonts.heading,
                textAlign: "center",
              }}
            >
              Ready to Run Analysis
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                fontFamily: brand.fonts.body,
                textAlign: "center",
                maxWidth: 600,
              }}
            >
              Click the button below to start the {analysisType} analysis for
              this script version. This is a debug component - the analysis will
              only run when you manually trigger it.
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartAnalysis}
              disabled={isRequestInProgressRef.current}
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontFamily: brand.fonts.body,
                fontSize: "1.1rem",
                px: 4,
                py: 1.5,
                "&:hover": {
                  bgcolor: "primary.dark",
                  transform: "scale(1.05)",
                },
                "&:disabled": {
                  bgcolor: "action.disabledBackground",
                  color: "action.disabled",
                },
                transition: theme.transitions.create(
                  ["background-color", "transform"],
                  { duration: theme.transitions.duration.short }
                ),
              }}
            >
              Start Analysis
            </Button>

            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "info.main",
                color: "info.contrastText",
                borderRadius: `${brand.borderRadius}px`,
                maxWidth: 600,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: brand.fonts.body,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <strong>Debug Mode:</strong> No automatic retries. You have full
                control over when the analysis runs.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Loading State - Initializing */}
        {hasStarted && chunks.length === 0 && isStreaming && !error && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              py: 8,
            }}
          >
            <CircularProgress size={60} color="primary" />
            <Typography
              variant="h6"
              sx={{
                color: "text.secondary",
                fontFamily: brand.fonts.body,
              }}
            >
              Initializing analysis...
            </Typography>
          </Box>
        )}

        {/* Streaming Content */}
        {hasStarted && chunks.length > 0 && (
          <>
            <StreamContent
              chunks={chunks}
              isStreaming={isStreaming}
              analysisType={analysisType}
            />

            {isAnalysisComplete && (
              <Box
                sx={{
                  mt: 4,
                  pt: 3,
                  borderTop: 1,
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: "success.main",
                    fontWeight: 500,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  ✓ Analysis completed in {processingTime}s
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleViewResults}
                  sx={{
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    fontFamily: brand.fonts.body,
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  }}
                >
                  View Results
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}
