import React, { useState, useRef, useEffect } from "react";
import { Box, useTheme, IconButton, Typography } from "@mui/material";
import { Controller, UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";
import InputField from "./InputField";
import { TrendingUp, Mic } from "lucide-react";

// Add proper type definitions for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface MustHavesSectionProps {
  form: UseFormReturn<FormValues>;
}

const MustHavesSection: React.FC<MustHavesSectionProps> = ({ form }) => {
  const theme = useTheme();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");

  useEffect(() => {
    // Initialize speech recognition only once
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;

      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event: any) => {
        console.log("Speech recognition result received");

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

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
      };

      // Add debugging
      recognition.onstart = () => {
        console.log("Speech recognition started successfully");
      };
    }

    return () => {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Error stopping speech recognition:", e);
        }
      }
    };
  }, [form]);

  // Speech recognition API
  const handleMicClick = () => {
    // Check if speech recognition is supported
    if (!recognitionRef.current) {
      alert(
        "Speech recognition is not supported in your browser. Please try Chrome or Edge."
      );
      return;
    }

    // If already listening, stop
    if (isListening) {
      console.log("Stopping speech recognition");
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping speech recognition:", e);
      }
      setIsListening(false);
      return;
    }

    try {
      console.log("Starting speech recognition");
      // Set initial value from form
      finalTranscriptRef.current = form.getValues("mustHaves") || "";

      // Start recognition directly - modern browsers will automatically request permission
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Speech recognition failed to start:", error);
      alert(
        "Failed to start speech recognition. Make sure you've granted microphone permissions."
      );
      setIsListening(false);
    }
  };

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
          <Typography variant="subtitle2">Must-Haves</Typography>
          <TrendingUp size={16} color={theme.palette.secondary.main} />
        </Box>
        <IconButton
          onClick={handleMicClick}
          size="small"
          sx={{
            color: isListening
              ? theme.palette.secondary.main
              : theme.palette.text.secondary,
            animation: isListening ? "pulse 1.5s infinite" : "none",
            "@keyframes pulse": {
              "0%": { opacity: 1, transform: "scale(1)" },
              "50%": { opacity: 0.8, transform: "scale(1.1)" },
              "100%": { opacity: 1, transform: "scale(1)" },
            },
            "&:hover": {
              bgcolor: "rgba(0, 0, 0, 0.04)",
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
                  borderBottom: `2px solid ${theme.palette.secondary.main}`,
                }),
              },
            }}
            {...field}
            value={field.value || ""}
          />
        )}
      />
    </Box>
  );
};

export default MustHavesSection;
