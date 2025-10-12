"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  Avatar,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Stack,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  X as Close,
  Save as SaveIcon,
  Edit as EditIcon,
  Ban as CancelIcon,
  FileText,
} from "lucide-react";
import {
  ModelTierSelector,
  useModelTier,
  MODEL_TIERS,
  ModelTier,
} from "@/components/common/ModelTierSelector";
import { getCurrentBrand } from "@/config/brandConfig";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface PromptEditDialogProps {
  open: boolean;
  onClose: () => void;
  audioType: string;
  editedPrompt: string;
  onPromptChange: (prompt: string) => void;
  onSavePrompt: (modelTier: ModelTier) => void;
  onEditPromptOnly: (modelTier: ModelTier) => void;
  isAudioProcessorCompleted?: boolean;
  isProcessing: boolean;
  hasBeenEdited?: boolean;
  originalPrompt?: string | null;
  placeholder?: string;
}

interface AudioTypeInfo {
  name: string;
  gradient: string;
  placeholder: string;
}

// ===========================
// HELPER FUNCTIONS
// ===========================

const getAudioTypeInfo = (type: string): AudioTypeInfo => {
  switch (type.toLowerCase()) {
    case "dialogue":
      return {
        name: "Dialogue",
        gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
        placeholder: "Enter dialogue content...",
      };
    case "foley":
      return {
        name: "Foley",
        gradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
        placeholder: "Enter foley sound description...",
      };
    case "roomtone":
    case "room-tone":
      return {
        name: "Room Tone",
        gradient: "linear-gradient(135deg, #43e97b, #38f9d7)",
        placeholder: "Enter room tone description...",
      };
    case "music":
      return {
        name: "Music",
        gradient: "linear-gradient(135deg, #fa709a, #fee140)",
        placeholder: "Enter music description...",
      };
    default:
      return {
        name: type,
        gradient: "linear-gradient(135deg, #667eea, #764ba2)",
        placeholder: "Enter content...",
      };
  }
};

// ===========================
// MAIN COMPONENT
// ===========================

export function PromptEditDialog({
  open,
  onClose,
  audioType,
  editedPrompt,
  onPromptChange,
  onSavePrompt,
  onEditPromptOnly,
  isAudioProcessorCompleted,
  isProcessing,
  hasBeenEdited = false,
  originalPrompt,
  placeholder,
}: PromptEditDialogProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Model tier state
  const { modelTier, setModelTier, getSelectedOption } = useModelTier(
    MODEL_TIERS.ULTRA
  );

  const audioInfo = getAudioTypeInfo(audioType);
  const finalPlaceholder = placeholder || audioInfo.placeholder;
  const selectedTierOption = getSelectedOption();

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleSavePrompt = () => {
    onSavePrompt(modelTier);
  };

  // ===========================
  // EFFECTS
  // ===========================

  // Reset model tier when dialog closes
  useEffect(() => {
    if (!open) {
      setModelTier(MODEL_TIERS.ULTRA);
    }
  }, [open, setModelTier]);

  // ===========================
  // RENDER
  // ===========================

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: theme.shadows[12],
            maxHeight: "90vh",
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                background: audioInfo.gradient,
                borderRadius: `${brand.borderRadius}px`,
                width: 32,
                height: 32,
                boxShadow: theme.shadows[2],
              }}
            >
              <EditIcon size={16} style={{ color: "white" }} />
            </Avatar>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "text.primary",
                  }}
                >
                  Edit {audioInfo.name}
                </Typography>
                {selectedTierOption && (
                  <Chip
                    label={selectedTierOption.label}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "0.75rem",
                      bgcolor: selectedTierOption.color,
                      color: "white",
                      borderRadius: `${brand.borderRadius / 2}px`,
                    }}
                  />
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Modify content and regenerate audio
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              p: 0.5,
              transition: theme.transitions.create(
                ["background-color", "transform"],
                {
                  duration: theme.transitions.duration.short,
                }
              ),
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            <Close size={20} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3, bgcolor: "background.default" }}>
          {/* Prompt Input */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1.5,
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              Content
            </Typography>
            <TextField
              autoFocus
              multiline
              rows={6}
              fullWidth
              value={editedPrompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={finalPlaceholder}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${brand.borderRadius}px`,
                  bgcolor: "background.paper",
                  "& fieldset": {
                    borderColor: "divider",
                  },
                  "&:hover fieldset": {
                    borderColor: "primary.light",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                    borderWidth: 2,
                  },
                },
                "& .MuiInputBase-input": {
                  fontSize: "0.95rem",
                  lineHeight: 1.5,
                },
              }}
            />
          </Box>

          {/* Model Tier Selector */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1.5,
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              Audio Quality
            </Typography>
            <ModelTierSelector
              value={modelTier}
              onChange={setModelTier}
              disabled={isProcessing}
              showDescription={true}
              compact={false}
            />
          </Box>

          {/* Original Prompt Info */}
          {hasBeenEdited && originalPrompt && (
            <Box
              sx={{
                p: 2,
                borderRadius: `${brand.borderRadius}px`,
                bgcolor: "info.light",
                border: 1,
                borderColor: "info.main",
                position: "relative",
                mb: 3,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 3,
                  height: "100%",
                  bgcolor: "info.main",
                  borderRadius: `0 ${brand.borderRadius}px ${brand.borderRadius}px 0`,
                },
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <FileText
                  size={16}
                  style={{ color: theme.palette.info.main }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "info.main",
                  }}
                >
                  Original Content
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  pl: 1,
                  color: "text.secondary",
                }}
              >
                &quot;{originalPrompt}&quot;
              </Typography>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              onClick={onClose}
              variant="outlined"
              color="inherit"
              disabled={isProcessing}
              startIcon={<CancelIcon size={16} />}
              sx={{
                borderRadius: `${brand.borderRadius}px`,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                px: 2,
                py: 1,
                transition: theme.transitions.create(["transform"], {
                  duration: theme.transitions.duration.short,
                }),
                "&:hover": {
                  transform: "translateY(-1px)",
                },
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={() => onEditPromptOnly(modelTier)}
              variant="outlined"
              disabled={isProcessing || !editedPrompt.trim()}
              sx={{
                borderRadius: `${brand.borderRadius}px`,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                px: 2,
                py: 1,
                borderColor: "primary.main",
                color: "primary.main",
                transition: theme.transitions.create(
                  ["transform", "background-color"],
                  {
                    duration: theme.transitions.duration.short,
                  }
                ),
                "&:hover": {
                  transform: "translateY(-1px)",
                  bgcolor: "action.hover",
                  borderColor: "primary.dark",
                },
              }}
            >
              Save Content Only
            </Button>

            <Button
              onClick={handleSavePrompt}
              variant="contained"
              disabled={
                isProcessing ||
                !editedPrompt.trim() ||
                !isAudioProcessorCompleted
              }
              startIcon={
                isProcessing ? (
                  <CircularProgress size={16} sx={{ color: "inherit" }} />
                ) : (
                  selectedTierOption?.icon || <SaveIcon size={16} />
                )
              }
              sx={{
                borderRadius: `${brand.borderRadius}px`,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                px: 2.5,
                py: 1,
                minWidth: 120,
                background: selectedTierOption?.color
                  ? `linear-gradient(135deg, ${selectedTierOption.color}, ${selectedTierOption.color}dd)`
                  : "linear-gradient(135deg, #667eea, #764ba2)",
                color: "white",
                boxShadow: theme.shadows[4],
                transition: theme.transitions.create(
                  ["transform", "box-shadow"],
                  {
                    duration: theme.transitions.duration.short,
                  }
                ),
                "&:hover": {
                  background: selectedTierOption?.color
                    ? `linear-gradient(135deg, ${selectedTierOption.color}dd, ${selectedTierOption.color}bb)`
                    : "linear-gradient(135deg, #5a6fd8, #6a4190)",
                  transform: "translateY(-1px)",
                  boxShadow: theme.shadows[6],
                },
                "&:disabled": {
                  bgcolor: "action.disabledBackground",
                  color: "text.disabled",
                  transform: "none",
                },
              }}
            >
              {isProcessing
                ? "Processing..."
                : `Save & Regenerate with ${selectedTierOption?.label || "AI"}`}
            </Button>
          </Box>

          {/* Processing Indicator */}
          {isProcessing && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                mt: 2,
                p: 2,
                bgcolor: "primary.light",
                borderRadius: `${brand.borderRadius}px`,
                border: 1,
                borderColor: "primary.main",
              }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2" color="primary.main">
                Updating {audioInfo.name.toLowerCase()} content and regenerating
                audio with {selectedTierOption?.label || "AI"}...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default PromptEditDialog;
