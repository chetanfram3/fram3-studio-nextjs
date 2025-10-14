// src/components/common/AnalysisSettingsModal.tsx
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import ProcessingModeSelector, {
  ProcessingMode,
  AspectRatio,
  ModelTierConfig,
} from "./ProcessingModeSelector";

interface AnalysisSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (settings: {
    processingMode: ProcessingMode;
    aspectRatio: AspectRatio;
    pauseBefore: string[];
    modelTiers: ModelTierConfig;
  }) => void;
  scriptTitle?: string;
  isAnalyzing?: boolean;
}

export const AnalysisSettingsModal: React.FC<AnalysisSettingsModalProps> = ({
  open,
  onClose,
  onConfirm,
  scriptTitle,
  isAnalyzing = false,
}) => {
  const theme = useTheme();
  const [processingMode, setProcessingMode] =
    useState<ProcessingMode>("normal");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [pauseBeforeSettings, setPauseBeforeSettings] = useState<string[]>([]);
  const [modelTiers, setModelTiers] = useState<ModelTierConfig>({
    image: 4,
    audio: 4,
    video: 4,
  });

  const handleProcessingModeChange = (
    mode: ProcessingMode,
    ratio: AspectRatio,
    pauseBefore: string[],
    modelTiers: ModelTierConfig
  ) => {
    setProcessingMode(mode);
    setAspectRatio(ratio);
    setPauseBeforeSettings(pauseBefore);
    setModelTiers(modelTiers);
  };

  const handleConfirm = () => {
    onConfirm({
      processingMode,
      aspectRatio,
      pauseBefore: pauseBeforeSettings,
      modelTiers,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          // Force background.default with higher specificity
          backgroundColor: theme.palette.background.default,
          backgroundImage: "none", // Remove any gradient that might be applied
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 1,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: alpha(theme.palette.common.black, 0.8), // Darker backdrop
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.common.white, 0.02)
              : alpha(theme.palette.common.black, 0.02),
        }}
      >
        <Box>
          <Typography variant="h6" component="div" color="secondary.main">
            Analysis Settings
          </Typography>
          {scriptTitle && (
            <Typography variant="body2" color="secondary.dark" sx={{ mt: 0.5 }}>
              {scriptTitle}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            "&:hover": {
              bgcolor: alpha(theme.palette.action.active, 0.08),
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          pt: 2,
          bgcolor: "transparent", // Let parent background show through
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure how your script should be analyzed. These settings will
            determine the depth of analysis and output format.
          </Typography>

          <ProcessingModeSelector
            onChange={handleProcessingModeChange}
            initialMode={processingMode}
            initialAspectRatio={aspectRatio}
            initialGenerateImages={true}
            initialGenerateAudio={true}
            initialGenerateVideo={true}
            defaultExpanded={true}
          />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.common.white, 0.02)
              : alpha(theme.palette.common.black, 0.02),
        }}
      >
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="secondary"
          disabled={isAnalyzing}
        >
          {isAnalyzing ? "Analyzing..." : "Start Analysis"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnalysisSettingsModal;
