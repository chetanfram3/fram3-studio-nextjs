// src/modules/scripts/FeedbackDialog.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  TextField,
  Chip,
  IconButton,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  SentimentSatisfiedAlt,
  SentimentNeutral,
  SentimentDissatisfied,
  Mic,
  Upload,
  Refresh,
  Close as CloseIcon,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";

type FeedbackSentiment = "positive" | "neutral" | "negative" | null;

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  feedback: string;
  setFeedback: (feedback: string) => void;
  feedbackSentiment: FeedbackSentiment;
  handleSentimentSelect: (sentiment: FeedbackSentiment) => void;
  isRecording: boolean;
  recordingTime: number;
  toggleVoiceRecording: () => void;
  handleAddReference: () => void;
  references: File[];
  handleRemoveReference: (index: number) => void;
  handleSubmitFeedback: () => void;
}

/**
 * FeedbackDialog - Modal dialog for collecting script feedback
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Simple functional component for auto-optimization
 * - All handlers auto-optimized by React 19 compiler
 *
 * Theme integration:
 * - Uses theme.palette for all colors (no hardcoded colors)
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - Uses primary color for main actions
 * - Follows Dialog pattern from MFADialog
 * - Success/info/error colors for sentiment buttons
 *
 * Porting changes:
 * - Added proper Dialog pattern with PaperProps
 * - Added theme-aware backdrop
 * - Added Close button in header
 * - Used brand fonts throughout
 * - Added proper border and shadow styling
 * - Made TextField theme-aware with proper focus states
 * - Improved button styling consistency
 */
export function FeedbackDialog({
  open,
  onClose,
  feedback,
  setFeedback,
  feedbackSentiment,
  handleSentimentSelect,
  isRecording,
  recordingTime,
  toggleVoiceRecording,
  handleAddReference,
  references,
  handleRemoveReference,
  handleSubmitFeedback,
}: FeedbackDialogProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "background.paper",
          backgroundImage: "none !important", // CRITICAL: Disable MUI's elevation overlay
          borderRadius: `${brand.borderRadius * 1.5}px`,
          border: 2,
          borderColor: "primary.main",
          boxShadow: theme.shadows[24],
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.8)"
              : "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          py: 2.5,
          px: 3,
          fontFamily: brand.fonts.heading,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "text.primary",
                fontFamily: brand.fonts.heading,
                mb: 0.5,
              }}
            >
              Script Feedback
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontFamily: brand.fonts.body,
              }}
            >
              Share your thoughts to help improve the script
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": {
                color: "text.primary",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          py: 3,
          px: 3,
          bgcolor: "background.paper",
        }}
      >
        {/* Sentiment Selection */}
        <Typography
          variant="subtitle2"
          gutterBottom
          sx={{
            color: "text.primary",
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
          }}
        >
          How do you feel about this script?
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Button
            variant={
              feedbackSentiment === "positive" ? "contained" : "outlined"
            }
            color={feedbackSentiment === "positive" ? "success" : "primary"}
            startIcon={<SentimentSatisfiedAlt />}
            onClick={() => handleSentimentSelect("positive")}
            sx={{
              flex: 1,
              fontFamily: brand.fonts.body,
              ...(feedbackSentiment !== "positive" && {
                color: "text.primary",
                borderColor: "divider",
                "&:hover": {
                  borderColor: "success.main",
                  bgcolor: alpha(theme.palette.success.main, 0.08),
                },
              }),
            }}
          >
            Positive
          </Button>
          <Button
            variant={feedbackSentiment === "neutral" ? "contained" : "outlined"}
            color={feedbackSentiment === "neutral" ? "info" : "primary"}
            startIcon={<SentimentNeutral />}
            onClick={() => handleSentimentSelect("neutral")}
            sx={{
              flex: 1,
              fontFamily: brand.fonts.body,
              ...(feedbackSentiment !== "neutral" && {
                color: "text.primary",
                borderColor: "divider",
                "&:hover": {
                  borderColor: "info.main",
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                },
              }),
            }}
          >
            Neutral
          </Button>
          <Button
            variant={
              feedbackSentiment === "negative" ? "contained" : "outlined"
            }
            color={feedbackSentiment === "negative" ? "error" : "primary"}
            startIcon={<SentimentDissatisfied />}
            onClick={() => handleSentimentSelect("negative")}
            sx={{
              flex: 1,
              fontFamily: brand.fonts.body,
              ...(feedbackSentiment !== "negative" && {
                color: "text.primary",
                borderColor: "divider",
                "&:hover": {
                  borderColor: "error.main",
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                },
              }),
            }}
          >
            Negative
          </Button>
        </Box>

        {/* Feedback Text Input with Voice Recording */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "text.primary",
                fontFamily: brand.fonts.heading,
                fontWeight: 600,
              }}
            >
              Detailed Feedback
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Mic />}
              color={isRecording ? "error" : "primary"}
              onClick={toggleVoiceRecording}
              sx={{
                fontFamily: brand.fonts.body,
                ...(isRecording && {
                  animation: "pulse 1.5s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": {
                      opacity: 1,
                    },
                    "50%": {
                      opacity: 0.7,
                    },
                  },
                }),
              }}
            >
              {isRecording
                ? `Recording ${recordingTime.toFixed(1)}s`
                : "Voice Note"}
            </Button>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What specific aspects would you like to improve?"
            variant="outlined"
            sx={{
              fontFamily: brand.fonts.body,
              "& .MuiOutlinedInput-root": {
                fontFamily: brand.fonts.body,
                "& fieldset": {
                  borderColor: "divider",
                },
                "&:hover fieldset": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                },
              },
              "& .MuiInputBase-input": {
                color: "text.primary",
              },
              "& .MuiInputBase-input::placeholder": {
                color: "text.secondary",
                opacity: 0.7,
              },
            }}
          />
        </Box>

        {/* Reference Attachments */}
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "text.primary",
                fontFamily: brand.fonts.heading,
                fontWeight: 600,
              }}
            >
              Reference Materials
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Upload />}
              onClick={handleAddReference}
              sx={{
                fontFamily: brand.fonts.body,
                color: "text.primary",
                borderColor: "divider",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              Upload
            </Button>
          </Box>

          {references.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
              {references.map((file, index) => (
                <Chip
                  key={index}
                  label={file.name}
                  onDelete={() => handleRemoveReference(index)}
                  variant="outlined"
                  sx={{
                    fontFamily: brand.fonts.body,
                    borderColor: "divider",
                    color: "text.primary",
                    "& .MuiChip-deleteIcon": {
                      color: "text.secondary",
                      "&:hover": {
                        color: "error.main",
                      },
                    },
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          gap: 2,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            fontFamily: brand.fonts.body,
            borderColor: "divider",
            color: "text.primary",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: "action.hover",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Refresh />}
          onClick={handleSubmitFeedback}
          sx={{
            fontFamily: brand.fonts.body,
            fontWeight: 600,
          }}
        >
          Submit Feedback
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FeedbackDialog;
