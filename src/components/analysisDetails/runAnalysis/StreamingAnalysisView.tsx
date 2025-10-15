"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
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
 * StreamingAnalysisView - Displays real-time streaming analysis results
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Uses refs to prevent unnecessary re-renders
 * - Implements exponential backoff for retries
 * - Debounces simultaneous requests
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - No hardcoded colors or spacing
 *
 * Navigation:
 * - Uses Next.js 15 router for navigation
 * - Handles route params from Next.js App Router
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
  const retryCountRef = useRef(0);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const isRequestInProgressRef = useRef(false);
  const hasStartedRef = useRef(false);

  // Function to check if chunks contain enough meaningful data
  const hasSignificantData = useCallback(() => {
    if (chunks.length > 5) return true;

    const content = extractTextFromChunks(chunks);
    return (
      content.length > 500 && content.includes("{") && content.includes("}")
    );
  }, [chunks]);

  // Update timer during streaming
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isStreaming) {
      timer = setInterval(() => {
        setProcessingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isStreaming, startTime]);

  // Memoized function with stable dependencies
  const fetchAnalysis = useCallback(async () => {
    if (!scriptId || !versionId || !analysisType) {
      return;
    }

    // Prevent multiple simultaneous requests
    if (isRequestInProgressRef.current) {
      return;
    }

    // Enforce maximum retry limit
    if (retryCountRef.current >= 3) {
      logger.error("Maximum retry attempts reached");
      return;
    }

    isRequestInProgressRef.current = true;

    try {
      resetStream();
      setIsAnalysisComplete(false);
      setStartTime(Date.now());
      setProcessingTime(0);

      await startStreaming(
        `${API_BASE_URL}${UNIFIED_ANALYSIS_ENDPOINT}?stream=true`,
        {
          userId: auth.currentUser?.uid,
          scriptId,
          versionId,
          analysisType,
        }
      );

      hasStartedRef.current = true;
      retryCountRef.current = 0;
    } catch (err) {
      logger.error("Analysis error:", err);

      const isRetryableError =
        err instanceof Error &&
        (err.message.includes("network") ||
          err.message.includes("timeout") ||
          err.message.includes("500") ||
          err.message.includes("502") ||
          err.message.includes("503") ||
          err.message.includes("504"));

      if (isRetryableError && retryCountRef.current < 2) {
        retryCountRef.current += 1;
        const backoffTime = 2000 * Math.pow(2, retryCountRef.current - 1);

        setTimeout(() => {
          isRequestInProgressRef.current = false;
          fetchAnalysis();
        }, backoffTime);
      } else {
        hasStartedRef.current = false;
      }
    } finally {
      setTimeout(() => {
        isRequestInProgressRef.current = false;
      }, 1000);
    }
  }, [scriptId, versionId, analysisType, startStreaming, resetStream]);

  // Initial effect with proper cleanup and single execution
  useEffect(() => {
    if (!hasStartedRef.current && scriptId && versionId && analysisType) {
      fetchAnalysis();
    }

    return () => {
      resetStream();
      isRequestInProgressRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to handle streaming completion
  useEffect(() => {
    if (!isStreaming && hasSignificantData() && !isAnalysisComplete) {
      setIsAnalysisComplete(true);

      queryClient.invalidateQueries({
        queryKey: ["scriptDetails", scriptId, versionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["scriptAnalysis", scriptId, versionId],
      });

      if (chunks.length > 0) {
        const timer = setTimeout(() => {
          router.push(
            `/scripts/${scriptId}/version/${versionId}/analysis/view/${analysisType}`
          );
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [
    isStreaming,
    hasSignificantData,
    isAnalysisComplete,
    scriptId,
    versionId,
    analysisType,
    router,
    queryClient,
    chunks.length,
  ]);

  const handleBack = () => {
    router.push(`/dashboard/scripts/${scriptId}/version/${versionId}`);
  };

  const handleRetry = () => {
    retryCountRef.current = 0;
    hasStartedRef.current = false;
    isRequestInProgressRef.current = false;
    setIsAnalysisComplete(false);
    fetchAnalysis();
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
        {error ? (
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
            {retryCountRef.current > 0 &&
              ` (Attempt ${retryCountRef.current + 1}/3)`}
          </Alert>
        ) : chunks.length === 0 && isStreaming ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 6,
            }}
          >
            <CircularProgress size={40} color="primary" sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ fontFamily: brand.fonts.heading }}>
              Starting analysis...
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
                fontFamily: brand.fonts.body,
              }}
            >
              This may take a minute or two depending on the complexity of your
              script.
            </Typography>
          </Box>
        ) : (
          <StreamContent
            chunks={chunks}
            isStreaming={isStreaming}
            analysisType={analysisType}
          />
        )}

        {isAnalysisComplete && chunks.length > 0 && (
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleViewResults}
              sx={{
                fontFamily: brand.fonts.body,
                borderRadius: `${brand.borderRadius}px`,
                transition: theme.transitions.create(["transform"], {
                  duration: theme.transitions.duration.shorter,
                }),
                "&:hover": {
                  transform: "translateY(-1px)",
                },
              }}
            >
              View Results
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
