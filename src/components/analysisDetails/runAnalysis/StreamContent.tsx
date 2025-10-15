"use client";

import { Box, Typography, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { StreamChunk } from "@/types/streaming";
import { useEffect, useState } from "react";
import { extractJsonFromText } from "@/utils/jsonUtils";
import { useStreaming } from "@/providers/StreamingProvider";
import logger from "@/utils/logger";

/**
 * StreamContent - Displays streaming analysis content with JSON parsing
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Debounced parsing to prevent excessive processing
 * - Uses accumulatedText from provider (already optimized)
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - No hardcoded colors or spacing
 *
 * Features:
 * - Multiple JSON parsing strategies
 * - Real-time content display
 * - Error handling and recovery
 * - Progress indicators
 */

interface StreamContentProps {
  chunks: StreamChunk[];
  isStreaming: boolean;
  analysisType?: string;
}

export default function StreamContent({
  isStreaming,
  analysisType,
}: StreamContentProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [parsedData, setParsedData] = useState<unknown>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [startTime] = useState<number>(Date.now());

  const { accumulatedText, chunkCount } = useStreaming();

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

  // Parse accumulated text with multiple strategies
  useEffect(() => {
    if (accumulatedText.length > 0) {
      setParseError(null);

      const shouldAttemptParsing =
        !isStreaming ||
        (accumulatedText.length > 1000 &&
          accumulatedText.includes("{") &&
          accumulatedText.includes("}") &&
          (() => {
            const openBraces = (accumulatedText.match(/\{/g) || []).length;
            const closeBraces = (accumulatedText.match(/\}/g) || []).length;
            return openBraces > 0 && closeBraces >= openBraces;
          })() &&
          (accumulatedText.trimEnd().endsWith("}") ||
            accumulatedText.trimEnd().endsWith('"}') ||
            !isStreaming));

      if (shouldAttemptParsing) {
        const timeoutId = setTimeout(
          () => {
            try {
              logger.debug("JSON parsing attempts starting", {
                contentLength: accumulatedText.length,
                containsBraces:
                  accumulatedText.includes("{") &&
                  accumulatedText.includes("}"),
              });

              let parsedResult: unknown = null;

              // Strategy 1: Try extractJsonFromText first
              try {
                parsedResult = extractJsonFromText(accumulatedText);
                logger.info("Strategy 1 SUCCESS: extractJsonFromText");
                setParsedData(parsedResult);
                setParseError(null);
                return;
              } catch {
                logger.debug("Strategy 1 failed");
              }

              // Strategy 2: Look for JSON in markdown code blocks
              const codeBlockMatch = accumulatedText.match(
                /```(?:json)?\s*([\s\S]*?)\s*```/
              );
              if (codeBlockMatch && codeBlockMatch[1]) {
                try {
                  const jsonContent = codeBlockMatch[1].trim();
                  parsedResult = JSON.parse(jsonContent);
                  logger.info("Strategy 2 SUCCESS: markdown code block");
                  setParsedData(parsedResult);
                  setParseError(null);
                  return;
                } catch {
                  logger.debug("Strategy 2 failed");
                }
              }

              // Strategy 3: Find JSON with "data" key
              const dataJsonRegex = /\{\s*"data"\s*:\s*\{/;
              const dataMatch = accumulatedText.match(dataJsonRegex);

              if (dataMatch) {
                const dataStartIndex = accumulatedText.indexOf(dataMatch[0]);
                let braceCount = 0;
                let jsonEndIndex = -1;

                for (let i = dataStartIndex; i < accumulatedText.length; i++) {
                  if (accumulatedText[i] === "{") braceCount++;
                  else if (accumulatedText[i] === "}") braceCount--;

                  if (braceCount === 0) {
                    jsonEndIndex = i;
                    break;
                  }
                }

                if (jsonEndIndex !== -1) {
                  try {
                    const jsonStr = accumulatedText.substring(
                      dataStartIndex,
                      jsonEndIndex + 1
                    );
                    parsedResult = JSON.parse(jsonStr);
                    logger.info("Strategy 3 SUCCESS: data key extraction");
                    setParsedData(parsedResult);
                    setParseError(null);
                    return;
                  } catch {
                    logger.debug("Strategy 3 failed");
                  }
                }
              }
            } catch (generalError) {
              if (!isStreaming) {
                logger.error("JSON parsing error:", generalError);
                setParseError((generalError as Error).message);
              }
            }
          },
          isStreaming ? 500 : 0
        );

        return () => clearTimeout(timeoutId);
      }
    }
  }, [accumulatedText, isStreaming]);

  const renderContent = () => {
    if (isStreaming && accumulatedText.length < 50) {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
          }}
        >
          <CircularProgress size={24} color="primary" sx={{ mr: 2 }} />
          <Typography variant="body2" sx={{ fontFamily: brand.fonts.body }}>
            Receiving data{isStreaming ? "..." : ""} ({chunkCount} chunks)
          </Typography>
        </Box>
      );
    }

    if (parsedData) {
      return JSON.stringify(parsedData, null, 2);
    }

    return accumulatedText;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {isStreaming && (
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            {analysisType ? `${analysisType} analysis` : "Processing"} in
            progress
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Time elapsed: {processingTime}s
          </Typography>
        </Box>
      )}

      {parseError && !isStreaming && (
        <Typography
          variant="caption"
          sx={{
            mb: 1,
            p: 1,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(211, 47, 47, 0.2)"
                : "error.light",
            color:
              theme.palette.mode === "dark"
                ? "error.light"
                : "error.contrastText",
            borderRadius: `${brand.borderRadius}px`,
            fontFamily: brand.fonts.body,
            border: 1,
            borderColor: "error.main",
          }}
        >
          JSON parsing error: {parseError}
        </Typography>
      )}

      <Box
        component="pre"
        sx={{
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          bgcolor: "background.paper",
          color: "text.primary",
          p: 3,
          borderRadius: `${brand.borderRadius}px`,
          overflow: "auto",
          maxHeight: "70vh",
          fontSize: "14px",
          lineHeight: 1.5,
          margin: 0,
          border: 1,
          borderColor: "divider",
        }}
      >
        {renderContent()}
      </Box>

      {isStreaming && (
        <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
          <CircularProgress size={16} color="primary" sx={{ mr: 1 }} />
          <Typography
            variant="caption"
            sx={{
              fontFamily: brand.fonts.body,
              color: "text.secondary",
            }}
          >
            Streaming in progress... ({chunkCount} chunks received)
          </Typography>
        </Box>
      )}
    </Box>
  );
}
