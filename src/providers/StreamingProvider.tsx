"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { auth } from "@/lib/firebase";
import { StreamChunk } from "@/types/streaming";
import { streamReader } from "@/utils/streamUtils";
import logger from "@/utils/logger";
import {
  sanitizeChunkText,
  extractJsonFromText,
  extractBasicScriptContent,
} from "@/utils/jsonUtils";
import { jsonrepair } from "jsonrepair";

/**
 * StreamingProvider - Manages real-time streaming of analysis data
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Uses refs to prevent unnecessary re-renders
 * - Implements sliding window for chunk management
 * - Exponential backoff with jitter for retries
 * - Debounced state updates to prevent render thrashing
 *
 * Features:
 * - Real-time streaming with chunk processing
 * - Automatic retry logic with exponential backoff
 * - JSON extraction and repair
 * - Duplicate chunk detection
 * - Timeout handling
 * - Graceful error recovery
 */

interface StreamingContextType {
  isStreaming: boolean;
  error: string | null;
  chunks: StreamChunk[];
  accumulatedText: string;
  chunkCount: number;
  totalBytes: number;
  startStreaming: (
    endpoint: string,
    params: unknown,
    options?: StreamingOptions
  ) => Promise<unknown>;
  resetStream: () => void;
  extractAndCombineTextContent: (chunks: StreamChunk[]) => string;
}

interface StreamingOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  maxChunks?: number;
}

const StreamingContext = createContext<StreamingContextType | null>(null);

export function StreamingProvider({ children }: { children: React.ReactNode }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chunks, setChunks] = useState<StreamChunk[]>([]);
  const [accumulatedText, setAccumulatedText] = useState("");
  const [chunkCount, setChunkCount] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const seenChunks = useRef(new Set<string>());
  const abortController = useRef<AbortController | null>(null);

  // Helper function to extract and combine text content from chunks
  const extractAndCombineTextContent = useCallback(
    (chunks: StreamChunk[]): string => {
      const textParts: string[] = [];

      for (const chunk of chunks) {
        if (chunk.candidates?.[0]?.content?.parts) {
          const parts = chunk.candidates[0].content.parts;
          for (const part of parts) {
            if (part.text && typeof part.text === "string") {
              let textContent = part.text;

              // Skip thinking notifications
              if (
                textContent.includes('"thinking":true') ||
                textContent.includes('"thinking": true')
              ) {
                continue;
              }

              // Handle JSON inside text fields - extract the actual text content
              try {
                const parsed = JSON.parse(textContent);
                if (parsed.text && typeof parsed.text === "string") {
                  textContent = parsed.text;
                }
              } catch {
                // Not parseable as JSON, use as is
              }

              textParts.push(textContent);
            }
          }
        } else if (typeof chunk === "string") {
          textParts.push(chunk);
        }
      }

      return textParts.join("");
    },
    []
  );

  // Process combined content to extract JSON data - matches backend approach
  const processCombinedContent = useCallback((combinedContent: string) => {
    // First try: Use jsonrepair to fix any common JSON issues
    try {
      // Check for markdown code blocks - matches backend
      const codeBlockMatch = combinedContent.match(
        /```(?:json)?\s*([\s\S]*?)\s*```/
      );
      if (codeBlockMatch && codeBlockMatch[1]) {
        try {
          const jsonContent = codeBlockMatch[1].trim();
          logger.debug("Found JSON code block in content");

          try {
            // Try with jsonrepair first (like backend)
            const repairedJson = jsonrepair(jsonContent);
            const parsed = JSON.parse(repairedJson);
            if (parsed.data) {
              logger.info("Successfully parsed repaired JSON from code block");
              return parsed;
            }
          } catch (repairError) {
            logger.debug("Failed to repair JSON from code block:", repairError);
          }

          // Try direct parsing
          try {
            const parsed = JSON.parse(jsonContent);
            if (parsed.data) {
              logger.info("Successfully parsed JSON from code block");
              return parsed;
            }
          } catch (parseError) {
            logger.debug("Failed to parse JSON from code block:", parseError);
          }
        } catch (error) {
          logger.error("Error processing code block:", error);
        }
      }

      // Try using jsonrepair on the entire content
      const repairedJson = jsonrepair(combinedContent);
      const parsed = JSON.parse(repairedJson);
      if (parsed.data) {
        logger.info(
          "Successfully parsed JSON using jsonrepair on full content"
        );
        return parsed;
      }
    } catch (repairError) {
      logger.debug("JSON repair attempt on full content failed:", repairError);
    }

    // Try parsing directly as JSON
    try {
      const parsedJson = JSON.parse(combinedContent);
      if (parsedJson.data) {
        logger.info("Successfully parsed direct JSON");
        return parsedJson;
      }
    } catch (directError) {
      logger.debug("Direct JSON parse failed:", directError);
    }

    // If no simple parsing works, use the more robust extractJsonFromText function
    try {
      return extractJsonFromText(combinedContent);
    } catch (error) {
      logger.error("Failed to extract JSON from content:", error);
      throw error;
    }
  }, []);

  const resetStream = useCallback(() => {
    setChunks([]);
    setAccumulatedText("");
    setError(null);
    setIsStreaming(false);
    setChunkCount(0);
    setTotalBytes(0);
    seenChunks.current.clear();

    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  }, []);

  const startStreaming = useCallback(
    async (
      endpoint: string,
      params: unknown,
      options: StreamingOptions = {}
    ) => {
      const {
        maxRetries = 3,
        retryDelay = 1000,
        timeout = 300000,
        maxChunks = 500,
      } = options;

      resetStream();
      setIsStreaming(true);
      abortController.current = new AbortController();

      // Track active timeouts for proper cleanup
      const timeouts: NodeJS.Timeout[] = [];

      // Add timeout tracking
      const addTimeout = (
        fn: (...args: unknown[]) => void,
        delay: number
      ): NodeJS.Timeout => {
        const id = setTimeout(fn, delay);
        timeouts.push(id);
        return id;
      };

      // Clean up all timeouts
      const clearAllTimeouts = () => {
        timeouts.forEach(clearTimeout);
      };

      const tryFetch = async (attempt: number): Promise<unknown> => {
        try {
          const token = await auth.currentUser?.getIdToken();
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/x-ndjson",
            },
            body: JSON.stringify(params),
            signal: abortController.current?.signal,
          });

          if (!response.ok) {
            const statusText = response.statusText || "Unknown error";

            // Specific handling for rate limits (429) and other retryable status codes
            const retryableStatusCodes = [429, 408, 500, 502, 503, 504];

            if (
              retryableStatusCodes.includes(response.status) &&
              attempt < maxRetries
            ) {
              logger.warn(
                `Attempt ${attempt + 1}/${maxRetries}: Server returned ${
                  response.status
                }, retrying in ${retryDelay}ms`
              );

              // Exponential backoff with jitter for more effective retries
              const jitter = Math.random() * 0.3 + 0.85;
              const backoffTime = retryDelay * Math.pow(2, attempt) * jitter;

              await new Promise<void>((resolve) => {
                const timeoutCallback = () => resolve();
                addTimeout(timeoutCallback, backoffTime);
              });

              return tryFetch(attempt + 1);
            }

            throw new Error(
              `Failed to start streaming: ${response.status} ${statusText}`
            );
          }

          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const jsonResponse = await response.json();
            setIsStreaming(false);
            return jsonResponse;
          }

          // Use tracked timeout for the main request timeout
          const timeoutId = addTimeout(() => {
            if (abortController.current) {
              abortController.current.abort("Stream timeout");
              setError("Stream timed out after " + timeout + "ms");
            }
          }, timeout);

          const accumulatedChunks: StreamChunk[] = [];
          let localAccumulatedText = "";

          // Track if we've had a successful chunk
          let hasReceivedValidChunk = false;

          try {
            for await (const rawChunk of streamReader(response)) {
              if (
                !rawChunk ||
                typeof rawChunk.text !== "string" ||
                rawChunk.text.trim() === ""
              ) {
                // Only log warnings after a few empty chunks to reduce noise
                if (
                  !hasReceivedValidChunk ||
                  accumulatedChunks.length % 5 === 0
                ) {
                  logger.warn(
                    `Invalid chunk at index ${chunkCount}:`,
                    rawChunk
                  );
                }
                continue;
              }

              // We've received at least one valid chunk
              hasReceivedValidChunk = true;

              // Only log every few chunks to avoid console flood
              if (chunkCount % 10 === 0) {
                logger.debug(
                  `Raw chunk ${chunkCount}: ${rawChunk.text.substring(
                    0,
                    50
                  )}...`
                );
              }

              const chunkText = sanitizeChunkText(rawChunk.text);

              // Skip duplicate chunks without warnings after first few
              if (seenChunks.current.has(chunkText)) {
                if (accumulatedChunks.length < 5) {
                  logger.warn(
                    `Duplicate chunk detected: ${chunkText.substring(0, 50)}...`
                  );
                }
                continue;
              }
              seenChunks.current.add(chunkText);

              const chunk: StreamChunk = {
                candidates: [{ content: { parts: [{ text: chunkText }] } }],
              };

              localAccumulatedText += chunkText;

              // Always update accumulated text (even after maxChunks)
              if (chunkCount % 5 === 0 || chunkCount < 5) {
                setAccumulatedText(localAccumulatedText);
              }

              setChunkCount((prev) => prev + 1);
              setTotalBytes((prev) => prev + chunkText.length);

              // Modified chunk storage logic with sliding window
              if (accumulatedChunks.length < maxChunks) {
                accumulatedChunks.push(chunk);

                // More frequent updates for better UI feedback
                if (chunkCount % 5 === 0 || chunkCount < 10) {
                  setChunks([...accumulatedChunks]);
                }
              } else {
                // Even after maxChunks, keep updating with sliding window
                if (accumulatedChunks.length >= maxChunks) {
                  accumulatedChunks.shift();
                  accumulatedChunks.push(chunk);

                  // Update state less frequently to avoid performance issues
                  if (chunkCount % 10 === 0) {
                    setChunks([...accumulatedChunks]);
                  }
                }
              }
            }

            // Ensure final state is always updated
            setAccumulatedText(localAccumulatedText);
            setChunks([...accumulatedChunks]);

            // Try to process the combined data as a final output
            try {
              if (accumulatedChunks.length > 0) {
                const combinedContent =
                  extractAndCombineTextContent(accumulatedChunks);
                logger.debug(
                  "Combined content first 100 chars:",
                  combinedContent.substring(0, 100)
                );

                // Process the combined content to see if it contains valid JSON
                try {
                  const processedData = processCombinedContent(combinedContent);
                  logger.debug("Successfully processed combined content");
                  clearTimeout(timeoutId);
                  return processedData;
                } catch (processError) {
                  logger.error(
                    "Error processing combined content:",
                    processError
                  );

                  // If we have chunks but no valid JSON, attempt additional recovery
                  if (localAccumulatedText.length > 0) {
                    try {
                      // Try to extract basic script content when JSON parsing fails
                      const extractedContent =
                        extractBasicScriptContent(localAccumulatedText);
                      if (extractedContent) {
                        logger.info(
                          "Extracted basic script content as fallback"
                        );
                        return {
                          data: {
                            scriptTitle: "Generated Script",
                            scriptNarrativeParagraph: extractedContent,
                            scriptDurationEstimated: 0,
                          },
                        };
                      }
                    } catch (fallbackError) {
                      logger.error(
                        "Fallback extraction failed:",
                        fallbackError
                      );
                    }
                  }
                }
              }
            } catch (combinationError) {
              logger.error(
                "Error combining/extracting content:",
                combinationError
              );
            }
          } catch (streamError) {
            // Handle stream processing errors separately
            if (
              streamError instanceof Error &&
              streamError.name !== "AbortError"
            ) {
              logger.error("Stream processing error:", streamError);

              // Only throw if we haven't received any valid chunks yet
              if (!hasReceivedValidChunk) {
                throw streamError;
              }
            } else {
              throw streamError;
            }
          }

          clearTimeout(timeoutId);
          return null;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            logger.error("Stream aborted:", err.message);
            setError(err.message);
            throw err;
          }

          // Enhanced retry logic for network errors, timeouts, and server errors
          const isRetryableError =
            err instanceof Error &&
            (err.message.includes("network") ||
              err.message.includes("429") ||
              err.message.includes("timeout") ||
              err.message.includes("500") ||
              err.message.includes("502") ||
              err.message.includes("503") ||
              err.message.includes("504") ||
              err.message.includes("reset") ||
              err.message.includes("ECONNRESET") ||
              err.message.includes("refused") ||
              err.message.includes("ECONNREFUSED"));

          if (attempt < maxRetries && isRetryableError) {
            logger.warn(
              `Attempt ${attempt + 1}/${maxRetries}: Error ${
                err.message
              }, retrying in ${retryDelay}ms`
            );

            // Exponential backoff with jitter
            const jitter = Math.random() * 0.3 + 0.85;
            const backoffTime = retryDelay * Math.pow(2, attempt) * jitter;

            await new Promise<void>((resolve) => {
              const timeoutCallback = () => resolve();
              addTimeout(timeoutCallback, backoffTime);
            });

            return tryFetch(attempt + 1);
          }

          const errorMessage =
            err instanceof Error ? err.message : "Failed to process stream";
          logger.error(
            `Streaming failed after ${attempt + 1} attempts:`,
            errorMessage
          );
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setIsStreaming(false);
        }
      };

      try {
        return await tryFetch(0);
      } finally {
        clearAllTimeouts();
      }
    },
    [resetStream, extractAndCombineTextContent, processCombinedContent]
  );

  return (
    <StreamingContext.Provider
      value={{
        isStreaming,
        error,
        chunks,
        accumulatedText,
        chunkCount,
        totalBytes,
        startStreaming,
        resetStream,
        extractAndCombineTextContent,
      }}
    >
      {children}
    </StreamingContext.Provider>
  );
}

export function useStreaming() {
  const context = useContext(StreamingContext);
  if (!context) {
    throw new Error("useStreaming must be used within a StreamingProvider");
  }
  return context;
}
