"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Box, IconButton, Typography, keyframes } from "@mui/material";
import { Controller, UseFormReturn } from "react-hook-form";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { TrendingUp, Mic } from "lucide-react";
import type { FormValues } from "../types";
import InputField from "./InputField";
import logger from "@/utils/logger";

// ==========================================
// TYPE DEFINITIONS
// ==========================================
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface MustHavesSectionProps {
  form: UseFormReturn<FormValues>;
}

// ==========================================
// ANIMATIONS
// ==========================================
const pulse = keyframes`
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
`;

/**
 * MustHavesSection - Must-haves input with speech recognition
 *
 * Performance optimizations:
 * - React 19 compiler auto-optimizes (no manual memo needed)
 * - useCallback for event handlers
 * - Proper cleanup in useEffect
 * - Theme-aware styling (no hardcoded colors)
 *
 * Porting standards:
 * - 100% type safe (no any types)
 * - Uses theme palette for all colors (primary instead of secondary)
 * - Uses brand config for fonts
 * - No hardcoded colors or spacing
 * - Follows MUI v7 patterns
 */
export default function MustHavesSection({ form }: MustHavesSectionProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE & REFS
  // ==========================================
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    // Initialize speech recognition only once
    const SpeechRecognitionAPI =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      const recognition = recognitionRef.current;

      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        logger.debug("Speech recognition result received");

        // Start with existing final transcript
        const existingText = finalTranscriptRef.current;

        // Process all results in the current event
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            // Add to the final transcript
            finalTranscriptRef.current = existingText
              ? `${existingText} ${transcript}`.trim()
              : transcript.trim();
          } else {
            // Track as interim result
            interimText = transcript;
          }
        }

        // Combine final and interim for display
        const displayText = interimText
          ? `${finalTranscriptRef.current} ${interimText}`.trim()
          : finalTranscriptRef.current;

        // Update form value with current text
        form.setValue("mustHaves", displayText);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        logger.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        logger.debug("Speech recognition ended");
        setIsListening(false);
      };

      recognition.onstart = () => {
        logger.debug("Speech recognition started successfully");
      };
    }

    return () => {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          logger.error("Error stopping speech recognition:", e);
        }
      }
    };
  }, [form, isListening]);

  // ==========================================
  // EVENT HANDLERS (useCallback for stability)
  // ==========================================
  const handleMicClick = useCallback(() => {
    // Check if speech recognition is supported
    if (!recognitionRef.current) {
      alert(
        "Speech recognition is not supported in your browser. Please try Chrome or Edge."
      );
      return;
    }

    // If already listening, stop
    if (isListening) {
      logger.debug("Stopping speech recognition");
      try {
        recognitionRef.current.stop();
      } catch (e) {
        logger.error("Error stopping speech recognition:", e);
      }
      setIsListening(false);
      return;
    }

    try {
      logger.debug("Starting speech recognition");
      // Set initial value from form
      finalTranscriptRef.current = form.getValues("mustHaves") || "";

      // Start recognition
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      logger.error("Speech recognition failed to start:", error);
      alert(
        "Failed to start speech recognition. Make sure you have granted microphone permissions."
      );
      setIsListening(false);
    }
  }, [isListening, form]);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Box sx={{ position: "relative" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: "text.primary",
              fontFamily: brand.fonts.body,
            }}
          >
            Must-Haves
          </Typography>
          <TrendingUp size={16} color={theme.palette.primary.main} />
        </Box>
        <IconButton
          onClick={handleMicClick}
          size="small"
          sx={{
            color: isListening ? "primary.main" : "text.secondary",
            animation: isListening ? `${pulse} 1.5s infinite` : "none",
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
          title={
            isListening
              ? "Click to stop speech recognition"
              : "Click to start speech recognition"
          }
        >
          <Mic size={18} />
        </IconButton>
      </Box>

      <Controller
        name="mustHaves"
        control={form.control}
        render={({ field, fieldState }) => (
          <InputField
            label={undefined}
            placeholder="Enter any essential notes or requirements (or click mic to speak)"
            multiline
            rows={4}
            error={!!fieldState.error}
            helperText={
              fieldState.error?.message ||
              (isListening
                ? "Listening... Click mic icon to stop"
                : "Click the mic icon to start speech recognition")
            }
            sx={{
              "& .MuiFormLabel-root": {
                color: "text.primary",
              },
              "& .MuiInputBase-input": {
                ...(isListening && {
                  borderBottom: `2px solid ${theme.palette.primary.main}`,
                }),
              },
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                },
              },
            }}
            {...field}
            value={field.value || ""}
          />
        )}
      />
    </Box>
  );
}

MustHavesSection.displayName = "MustHavesSection";
