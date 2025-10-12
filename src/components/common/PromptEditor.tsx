"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  Alert,
  Chip,
  IconButton,
  Collapse,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Restore as RestoreIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import {
  editImagePrompt,
  editVideoPrompt,
  editActorImagePrompt,
  editLocationImagePrompt,
  getImagePromptHistory,
  getVideoPromptHistory,
  getActorImagePromptHistory,
  getLocationImagePromptHistory,
  type EditImagePromptParams,
  type EditVideoPromptParams,
  type EditActorImagePromptParams,
  type EditLocationImagePromptParams,
  type PromptHistoryResponse,
  type ActorPromptHistoryResponse,
  type LocationPromptHistoryResponse,
} from "@/services/scriptService";
import { formatTimestamp } from "@/utils/textUtils";

export type PromptType = "image" | "video" | "actor" | "location";

export interface PromptEditorProps {
  type: PromptType;
  prompt: string | null;
  originalPrompt?: string | null;
  sceneId?: number;
  shotId?: number;
  actorId?: number;
  actorVersionId?: number;
  locationId?: number;
  locationVersionId?: number;
  scriptId: string;
  versionId: string;
  onPromptUpdate?: (newPrompt: string, type: PromptType) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

type HistoryResponse =
  | PromptHistoryResponse
  | ActorPromptHistoryResponse
  | LocationPromptHistoryResponse;

/**
 * PromptEditor - Optimized prompt editing component
 *
 * Performance optimizations:
 * - Theme-aware styling (no hardcoded colors)
 * - React 19 compiler optimizations
 * - Strategic memoization for computed values
 * - Proper useCallback for handlers
 */
export function PromptEditor({
  type,
  prompt,
  originalPrompt,
  sceneId,
  shotId,
  actorId,
  actorVersionId,
  locationId,
  locationVersionId,
  scriptId,
  versionId,
  onPromptUpdate,
  onError,
  disabled = false,
}: PromptEditorProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE
  // ==========================================
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(prompt || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const hasOriginal = useMemo(() => Boolean(originalPrompt), [originalPrompt]);
  const isPromptAvailable = useMemo(() => Boolean(prompt), [prompt]);

  const isValidConfiguration = useMemo(() => {
    switch (type) {
      case "image":
      case "video":
        return sceneId !== undefined && shotId !== undefined;
      case "actor":
        return actorId !== undefined && actorVersionId !== undefined;
      case "location":
        return locationId !== undefined && locationVersionId !== undefined;
      default:
        return false;
    }
  }, [
    type,
    sceneId,
    shotId,
    actorId,
    actorVersionId,
    locationId,
    locationVersionId,
  ]);

  const promptDisplayName = useMemo(() => {
    switch (type) {
      case "image":
        return "Image";
      case "video":
        return "Video";
      case "actor":
        return "Actor Image";
      case "location":
        return "Location Image";
      default:
        return "Unknown";
    }
  }, [type]);

  const entityIdentifier = useMemo(() => {
    switch (type) {
      case "image":
      case "video":
        return `Scene ${sceneId}, Shot ${shotId}`;
      case "actor":
        return `Actor ${actorId} (v${actorVersionId})`;
      case "location":
        return `Location ${locationId} (v${locationVersionId})`;
      default:
        return "";
    }
  }, [
    type,
    sceneId,
    shotId,
    actorId,
    actorVersionId,
    locationId,
    locationVersionId,
  ]);

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    setHistoryData(null);
    setShowHistory(false);
  }, [
    type,
    sceneId,
    shotId,
    actorId,
    actorVersionId,
    locationId,
    locationVersionId,
  ]);

  useEffect(() => {
    if (!isEditing) {
      setEditedPrompt(prompt || "");
    }
  }, [prompt, isEditing]);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditedPrompt(prompt || "");
  }, [prompt]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedPrompt(prompt || "");
    setSaveSuccess(false);
  }, [prompt]);

  const loadHistory = useCallback(async () => {
    if (!isValidConfiguration) {
      onError?.("Invalid configuration for loading history");
      return;
    }

    setIsLoadingHistory(true);
    try {
      let history: HistoryResponse;

      switch (type) {
        case "image":
          history = await getImagePromptHistory({
            scriptId,
            versionId,
            sceneId: sceneId!,
            shotId: shotId!,
          });
          break;

        case "video":
          history = await getVideoPromptHistory({
            scriptId,
            versionId,
            sceneId: sceneId!,
            shotId: shotId!,
          });
          break;

        case "actor":
          history = await getActorImagePromptHistory({
            scriptId,
            versionId,
            actorId: actorId!,
            actorVersionId: actorVersionId!,
          });
          break;

        case "location":
          history = await getLocationImagePromptHistory({
            scriptId,
            versionId,
            locationId: locationId!,
            locationVersionId: locationVersionId!,
          });
          break;

        default:
          throw new Error(`Unsupported prompt type: ${type}`);
      }

      setHistoryData(history);
    } catch (error: unknown) {
      console.error(`Error loading ${type} prompt history:`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to load ${type} prompt history`;
      onError?.(errorMessage);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [
    isValidConfiguration,
    type,
    scriptId,
    versionId,
    sceneId,
    shotId,
    actorId,
    actorVersionId,
    locationId,
    locationVersionId,
    onError,
  ]);

  const handleSave = useCallback(async () => {
    if (!editedPrompt.trim()) {
      onError?.("Prompt cannot be empty");
      return;
    }

    if (!isValidConfiguration) {
      onError?.("Invalid configuration for prompt type");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updatedPrompt = editedPrompt.trim();

      switch (type) {
        case "image":
          await editImagePrompt({
            scriptId,
            versionId,
            sceneId: sceneId!,
            shotId: shotId!,
            updatedPrompt,
          } as EditImagePromptParams);
          break;

        case "video":
          await editVideoPrompt({
            scriptId,
            versionId,
            sceneId: sceneId!,
            shotId: shotId!,
            updatedPrompt,
          } as EditVideoPromptParams);
          break;

        case "actor":
          await editActorImagePrompt({
            scriptId,
            versionId,
            actorId: actorId!,
            actorVersionId: actorVersionId!,
            updatedPrompt,
          } as EditActorImagePromptParams);
          break;

        case "location":
          await editLocationImagePrompt({
            scriptId,
            versionId,
            locationId: locationId!,
            locationVersionId: locationVersionId!,
            updatedPrompt,
          } as EditLocationImagePromptParams);
          break;

        default:
          throw new Error(`Unsupported prompt type: ${type}`);
      }

      setIsEditing(false);
      setSaveSuccess(true);
      onPromptUpdate?.(updatedPrompt, type);

      if (historyData) {
        await loadHistory();
      }
    } catch (error: unknown) {
      console.error(`Error saving ${type} prompt:`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to save ${type} prompt`;
      onError?.(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [
    editedPrompt,
    isValidConfiguration,
    type,
    scriptId,
    versionId,
    sceneId,
    shotId,
    actorId,
    actorVersionId,
    locationId,
    locationVersionId,
    historyData,
    onPromptUpdate,
    onError,
    loadHistory,
  ]);

  const handleShowHistory = useCallback(async () => {
    if (!showHistory && !historyData) {
      await loadHistory();
    }
    setShowHistory(!showHistory);
  }, [showHistory, historyData, loadHistory]);

  const handleRevertToOriginal = useCallback(() => {
    if (historyData?.originalPrompt) {
      setEditedPrompt(historyData.originalPrompt);
      if (!isEditing) {
        setIsEditing(true);
      }
    }
  }, [historyData, isEditing]);

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditedPrompt(e.target.value);
    },
    []
  );

  // ==========================================
  // EARLY RETURNS
  // ==========================================
  if (!isValidConfiguration) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: "background.default",
          border: "2px dashed",
          borderColor: "error.main",
          borderRadius: `${brand.borderRadius}px`,
        }}
      >
        <Typography variant="body2" color="error.main" align="center">
          Invalid configuration for {type} prompt editor
        </Typography>
      </Paper>
    );
  }

  if (!isPromptAvailable) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: "background.default",
          border: "2px dashed",
          borderColor: "divider",
          borderRadius: `${brand.borderRadius}px`,
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          No {promptDisplayName.toLowerCase()} prompt available - asset already
          exists
        </Typography>
      </Paper>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Stack spacing={2}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="h6"
            sx={{
              color: "primary.main",
              fontFamily: brand.fonts.heading,
            }}
          >
            {promptDisplayName} Prompt
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            ({entityIdentifier})
          </Typography>
          {hasOriginal && (
            <Chip
              size="small"
              label="Edited"
              color="warning"
              variant="outlined"
              sx={{ borderColor: "warning.main" }}
            />
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {hasOriginal && (
            <IconButton
              size="small"
              onClick={handleShowHistory}
              disabled={disabled}
              title="View history"
              sx={{
                color: "primary.main",
                "&:hover": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                },
              }}
            >
              {isLoadingHistory ? (
                <CircularProgress size={16} sx={{ color: "primary.main" }} />
              ) : showHistory ? (
                <ExpandLessIcon />
              ) : (
                <ExpandMoreIcon />
              )}
            </IconButton>
          )}

          {!isEditing ? (
            <IconButton
              size="small"
              onClick={handleEdit}
              disabled={disabled}
              color="primary"
              title="Edit prompt"
              sx={{
                "&:hover": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                },
              }}
            >
              <EditIcon />
            </IconButton>
          ) : (
            <>
              <IconButton
                size="small"
                onClick={handleCancel}
                disabled={isSaving}
                title="Cancel"
                sx={{
                  color: "error.main",
                  "&:hover": {
                    bgcolor: "error.main",
                    color: "error.contrastText",
                  },
                }}
              >
                <CancelIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleSave}
                disabled={isSaving || !editedPrompt.trim()}
                title="Save changes"
                sx={{
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                  },
                }}
              >
                {isSaving ? (
                  <CircularProgress size={16} sx={{ color: "primary.main" }} />
                ) : (
                  <SaveIcon />
                )}
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      {/* Success Message */}
      {saveSuccess && (
        <Alert
          severity="success"
          variant="outlined"
          sx={{
            borderColor: "success.main",
            bgcolor: "background.paper",
          }}
        >
          {promptDisplayName} prompt saved successfully!
        </Alert>
      )}

      {/* History Section */}
      <Collapse in={showHistory && Boolean(historyData)}>
        {historyData && (
          <Box
            sx={{
              bgcolor: "background.paper",
              p: 2,
              borderRadius: `${brand.borderRadius}px`,
              border: 1,
              borderColor: "divider",
            }}
          >
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                color: "primary.main",
                fontFamily: brand.fonts.heading,
              }}
            >
              Prompt History
            </Typography>

            {historyData.originalPrompt && (
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{
                      color: "primary.main",
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    Original Prompt:
                  </Typography>

                  <Button
                    size="small"
                    startIcon={<RestoreIcon />}
                    onClick={handleRevertToOriginal}
                    disabled={disabled || isEditing}
                    variant="outlined"
                    color="primary"
                    sx={{
                      borderColor: "primary.main",
                      "&:hover": {
                        borderColor: "primary.dark",
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                      },
                    }}
                  >
                    Revert
                  </Button>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    p: 1,
                    bgcolor: "background.default",
                    borderRadius: `${brand.borderRadius}px`,
                    border: 1,
                    borderColor: "divider",
                    fontSize: "0.875rem",
                    lineHeight: 1.4,
                    fontFamily: brand.fonts.body,
                    color: "text.primary",
                  }}
                >
                  {historyData.originalPrompt}
                </Typography>
              </Box>
            )}

            {historyData.lastEditedAt && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Last edited: {formatTimestamp(historyData.lastEditedAt)}
              </Typography>
            )}
          </Box>
        )}
      </Collapse>

      {/* Current Prompt Display/Editor */}
      {isEditing ? (
        <TextField
          multiline
          value={editedPrompt}
          onChange={handlePromptChange}
          placeholder={`Enter ${promptDisplayName.toLowerCase()} prompt...`}
          disabled={isSaving}
          fullWidth
          variant="outlined"
          helperText={`${editedPrompt.length} characters`}
          InputProps={{
            sx: {
              p: 2,
              fontSize: "0.875rem",
              lineHeight: 1.4,
              minHeight: "120px",
              alignItems: "flex-start",
              fontFamily: brand.fonts.body,
              color: "text.primary",
              "& textarea": {
                resize: "none",
                overflow: "auto !important",
                minHeight: "80px !important",
              },
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              minHeight: "120px",
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
          }}
        />
      ) : (
        <Typography
          variant="body2"
          sx={{
            p: 2,
            bgcolor: "background.paper",
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: "divider",
            fontSize: "0.875rem",
            lineHeight: 1.4,
            whiteSpace: "pre-wrap",
            minHeight: "60px",
            fontFamily: brand.fonts.body,
            color: "text.primary",
          }}
        >
          {prompt || "No prompt available"}
        </Typography>
      )}
    </Stack>
  );
}

PromptEditor.displayName = "PromptEditor";
