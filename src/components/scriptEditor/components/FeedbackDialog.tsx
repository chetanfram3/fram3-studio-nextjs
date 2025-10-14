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
} from "@mui/material";
import {
  SentimentSatisfiedAlt,
  SentimentNeutral,
  SentimentDissatisfied,
  Mic,
  Upload,
  Refresh,
} from "@mui/icons-material";

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

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
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
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Script Feedback
        <Typography variant="body2" color="text.secondary">
          Share your thoughts to help improve the script
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Sentiment Selection */}
        <Typography variant="subtitle2" gutterBottom>
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
            sx={{ flex: 1 }}
          >
            Positive
          </Button>
          <Button
            variant={feedbackSentiment === "neutral" ? "contained" : "outlined"}
            color={feedbackSentiment === "neutral" ? "info" : "primary"}
            startIcon={<SentimentNeutral />}
            onClick={() => handleSentimentSelect("neutral")}
            sx={{ flex: 1 }}
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
            sx={{ flex: 1 }}
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
            <Typography variant="subtitle2">Detailed Feedback</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Mic />}
              color={isRecording ? "error" : "primary"}
              onClick={toggleVoiceRecording}
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
            <Typography variant="subtitle2">Reference Materials</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Upload />}
              onClick={handleAddReference}
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
                />
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Refresh />}
          onClick={handleSubmitFeedback}
        >
          Submit Feedback
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackDialog;
