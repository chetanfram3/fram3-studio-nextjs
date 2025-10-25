"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Container,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import ScriptInput from "./ScriptInput";
import AnalysisDialogHeader from "./AnalysisDialogHeader";
import CustomToast from "@/components/common/CustomToast";
import { VideoGenerationWizard } from "@/components/common/videoGenerationWizard";

interface AnalysisComponentProps {
  onClose?: () => void;
}

/**
 * AnalysisComponent
 *
 * Simplified script analysis workflow using VideoGenerationWizard:
 * - Step 1: Enter Script (pre-wizard)
 * - Step 2: Open VideoGenerationWizard for URLs, Processing, and Generation
 *
 * Features:
 * - Consistent UX with other video generation flows
 * - Theme-aware styling
 * - Comprehensive error handling via wizard
 * - Single source of truth for video generation
 *
 * Code reduction: ~200 lines removed (83% reduction)
 */
const AnalysisComponent: React.FC<AnalysisComponentProps> = ({ onClose }) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  // Script input state (pre-wizard)
  const [script, setScript] = useState("");
  const [showWizard, setShowWizard] = useState(false);

  // Handle script input next
  const handleScriptNext = useCallback(() => {
    if (!script.trim()) {
      CustomToast("error", "Please enter a script before continuing");
      return;
    }
    setShowWizard(true);
  }, [script]);

  // Handle wizard completion
  const handleWizardComplete = useCallback(
    (result: any) => {
      CustomToast("success", "Analysis complete! Redirecting...");

      // Navigate to storyboard after short delay
      setTimeout(() => {
        router.push(`/story/${result.scriptId}/version/${result.versionId}/3`);
        if (onClose) {
          onClose();
        }
      }, 1000);
    },
    [router, onClose]
  );

  // Handle wizard cancel
  const handleWizardCancel = useCallback(() => {
    setShowWizard(false);
  }, []);

  // If wizard is showing, render only the wizard
  if (showWizard) {
    return (
      <VideoGenerationWizard
        open={showWizard}
        mode="non-versioned"
        scriptContent={script}
        title="Analyzed Script"
        description="Script from Analysis Dialog"
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
        redirectOnSuccess={false} // Handle redirect manually for toast timing
      />
    );
  }

  // Script input step (pre-wizard)
  return (
    <Box
      sx={{
        maxWidth: "xl",
        mx: "auto",
        p: 4,
      }}
    >
      <AnalysisDialogHeader />

      {/* Guidance text */}
      <Box
        sx={{
          mt: 3,
          mb: 3,
          p: 2.5,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor:
            theme.palette.mode === "light"
              ? "rgba(0, 0, 0, 0.02)"
              : "rgba(255, 255, 255, 0.02)",
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: "text.primary",
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
            mb: 1,
          }}
        >
          Enter Your Script
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontFamily: brand.fonts.body,
            lineHeight: 1.6,
          }}
        >
          Paste or type your script below. Once submitted, you'll be able to
          configure URLs, processing options, and quality settings before
          generating your video.
        </Typography>
      </Box>

      {/* Script input */}
      <Box sx={{ mb: 4 }}>
        <ScriptInput value={script} onChange={setScript} />
      </Box>

      {/* Action buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
          mt: 3,
        }}
      >
        <Box
          component="button"
          onClick={onClose}
          sx={{
            px: 3,
            py: 1.5,
            borderRadius: `${brand.borderRadius}px`,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: "transparent",
            color: "text.primary",
            fontFamily: brand.fonts.body,
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: theme.transitions.create(
              ["background-color", "border-color"],
              {
                duration: theme.transitions.duration.short,
              }
            ),
            "&:hover": {
              bgcolor: theme.palette.action.hover,
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          Cancel
        </Box>

        <Box
          component="button"
          onClick={handleScriptNext}
          disabled={!script.trim()}
          sx={{
            px: 3,
            py: 1.5,
            borderRadius: `${brand.borderRadius}px`,
            border: "none",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            fontFamily: brand.fonts.body,
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: theme.transitions.create(
              ["background-color", "transform"],
              {
                duration: theme.transitions.duration.short,
              }
            ),
            "&:hover:not(:disabled)": {
              bgcolor: "primary.dark",
              transform: "translateY(-1px)",
            },
            "&:disabled": {
              cursor: "not-allowed",
              opacity: 0.5,
              bgcolor: "action.disabledBackground",
              color: "action.disabled",
            },
          }}
        >
          Continue to Settings
        </Box>
      </Box>
    </Box>
  );
};

/**
 * AnalysisDialog
 *
 * Dialog wrapper for the enhanced multi-step analysis component.
 * Theme-aware with proper styling.
 */
export const AnalysisDialog: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "background.paper",
          backgroundImage: "none",
          borderRadius: `${brand.borderRadius}px`,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          bgcolor: "background.default",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            bgcolor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: theme.palette.divider,
            borderRadius: "4px",
            "&:hover": {
              bgcolor: theme.palette.action.hover,
            },
          },
        }}
      >
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <AnalysisComponent onClose={onClose} />
        </Container>
      </DialogContent>
    </Dialog>
  );
};

/**
 * AnalysisPage
 *
 * Standalone page wrapper for the enhanced multi-step analysis component.
 * Used for dedicated analysis pages without dialog wrapper.
 * Theme-aware with proper styling.
 */
export const AnalysisPage: React.FC = () => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <AnalysisComponent />
      </Container>
    </Box>
  );
};

export default AnalysisDialog;
