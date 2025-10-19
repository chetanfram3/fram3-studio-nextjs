"use client";

// ImageEditOverlay.tsx - Fully theme-compliant and performance-optimized
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  IconButton,
  TextField,
  Button,
  Stack,
  Typography,
  Chip,
  Alert,
  Collapse,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  AutoAwesome as OptimizeIcon,
  Info as InfoIcon,
  ExpandLess as CollapseIcon,
} from "@mui/icons-material";
import { Plus as PlusIcon } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { ImageVersion } from "@/types/storyBoard/types";
import {
  useImageEditor,
  getOptimizedPrompt,
  getOptimizationInsights,
  type OptimizationResult,
  type EditImageParams,
  type OptimizePromptParams,
  type OptimisedEditImageResponse,
} from "../../hooks/useImageEditor";
import { useSubscription } from "@/hooks/auth/useSubscription";
import {
  ModelTierSelector,
  useModelTier,
  MODEL_TIERS,
} from "@/components/common/ModelTierSelector";

interface ImageEditOverlayProps {
  scriptId: string;
  versionId: string;
  type: "shots" | "keyVisual" | "actor" | "location";
  viewingVersion?: ImageVersion;

  // Shot-specific props
  sceneId?: number;
  shotId?: number;

  // Actor-specific props
  actorId?: number;
  actorVersionId?: number;

  // Location-specific props
  locationId?: number;
  locationVersionId?: number;
  promptType?: string;

  // Additional images support
  additionalImageUrls: string[];
  onAdditionalImagesUpdate: (urls: string[]) => void;
  additionalImagesMode: boolean;
  onAdditionalImagesModeToggle: () => void;

  // Callbacks
  onEditComplete: (result: OptimisedEditImageResponse) => void;
  onCancel: () => void;
  onDataRefresh?: () => void;
  onEditingStateChange?: (isEditing: boolean) => void;

  // State
  disabled?: boolean;
}

export function ImageEditOverlay({
  scriptId,
  versionId,
  type,
  viewingVersion,
  sceneId,
  shotId,
  actorId,
  actorVersionId,
  locationId,
  locationVersionId,
  promptType,
  additionalImageUrls,
  additionalImagesMode,
  onAdditionalImagesModeToggle,
  onEditComplete,
  onCancel,
  onDataRefresh,
  onEditingStateChange,
  disabled = false,
}: ImageEditOverlayProps) {
  // Theme and brand
  const theme = useTheme();
  const brand = getCurrentBrand();

  // State
  const { isAdmin } = useSubscription();
  const [editPrompt, setEditPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [optimizationData, setOptimizationData] =
    useState<OptimizationResult | null>(null);
  const [showOptimizationInsights, setShowOptimizationInsights] =
    useState(false);

  // Model tier state
  const { modelTier, setModelTier, getSelectedOption } = useModelTier(
    MODEL_TIERS.ULTRA
  );

  // Hook parameters - required by useImageEditor
  const hookParams = useMemo(() => {
    const baseParams = {
      scriptId,
      versionId,
      type,
    };

    if (type === "shots") {
      return { ...baseParams, sceneId, shotId };
    } else if (type === "actor") {
      return { ...baseParams, actorId, actorVersionId };
    } else if (type === "location") {
      return {
        ...baseParams,
        locationId,
        locationVersionId,
        promptType: promptType || "wideShotLocationSetPrompt",
      };
    }
    return baseParams;
  }, [
    scriptId,
    versionId,
    type,
    sceneId,
    shotId,
    actorId,
    actorVersionId,
    locationId,
    locationVersionId,
    promptType,
  ]);

  // Hooks
  const {
    optimizePromptAsync,
    optimisedEditImageAsync,
    isEditing,
    isOptimizing,
    isOptimisedEditing,
    error: imageEditorError,
    optimizeError,
    optimisedEditError,
    resetEditMutation,
    resetOptimizeMutation,
    resetOptimisedEditMutation,
  } = useImageEditor(hookParams);

  // Reset state when overlay opens/closes
  useEffect(() => {
    if (!disabled) {
      setEditPrompt("");
      setOriginalPrompt("");
      setOptimizationData(null);
      setShowOptimizationInsights(false);
      setModelTier(MODEL_TIERS.ULTRA);
      resetEditMutation();
      resetOptimizeMutation();
      resetOptimisedEditMutation();
    }
  }, [
    disabled,
    setModelTier,
    resetEditMutation,
    resetOptimizeMutation,
    resetOptimisedEditMutation,
  ]);

  useEffect(() => {
    if (onEditingStateChange) {
      onEditingStateChange(isEditing || isOptimisedEditing);
    }
  }, [isEditing, isOptimisedEditing, onEditingStateChange]);

  // Memoized selected tier option
  const selectedTierOption = useMemo(() => getSelectedOption(), [modelTier]);

  // Memoized optimization insights
  const optimizationInsights = useMemo(
    () => (optimizationData ? getOptimizationInsights(optimizationData) : null),
    [optimizationData]
  );

  // Handle prompt optimization (standalone)
  const handleOptimizePrompt = async () => {
    if (!scriptId || !versionId || !editPrompt.trim()) {
      return;
    }

    try {
      resetOptimizeMutation();
      setOriginalPrompt(editPrompt);

      const optimizeParams: OptimizePromptParams = {
        scriptId,
        versionId,
        type,
        textPrompt: editPrompt.trim(),
        sourceVersion: viewingVersion?.version,
        temperature: 0.1,
        topP: 0.8,
      };

      // Add type-specific parameters
      if (type === "shots") {
        if (!sceneId || !shotId) {
          throw new Error("Scene ID and Shot ID are required for shots");
        }
        optimizeParams.sceneId = sceneId;
        optimizeParams.shotId = shotId;
      } else if (type === "actor") {
        if (!actorId || !actorVersionId) {
          throw new Error(
            "Actor ID and Actor Version ID are required for actors"
          );
        }
        optimizeParams.actorId = actorId;
        optimizeParams.actorVersionId = actorVersionId;
      } else if (type === "location") {
        if (!locationId || !locationVersionId) {
          throw new Error(
            "Location ID and Location Version ID are required for locations"
          );
        }
        optimizeParams.locationId = locationId;
        optimizeParams.locationVersionId = locationVersionId;
        optimizeParams.promptType = promptType || "wideShotLocationSetPrompt";
      }

      const result = await optimizePromptAsync(optimizeParams);

      // Extract optimized prompt and update the input
      const optimizedPrompt = getOptimizedPrompt(result);
      if (optimizedPrompt) {
        setEditPrompt(optimizedPrompt);
        setOptimizationData(result);
      }
    } catch (error) {
      console.error("Error optimizing prompt:", error);
    }
  };

  // Handle edit submission with automatic optimization
  const handleEditSubmit = async () => {
    if (!scriptId || !versionId || !editPrompt.trim()) {
      return;
    }

    try {
      resetOptimisedEditMutation();
      setOriginalPrompt(editPrompt);

      const editParams: EditImageParams = {
        scriptId,
        versionId,
        type,
        sourceVersion: viewingVersion?.version,
        prompt: editPrompt.trim(),
        temperature: 0.1,
        topP: 0.8,
        ...(additionalImageUrls.length > 0 && { additionalImageUrls }),
        options: {
          modelTier: modelTier,
        },
      };

      // Add type-specific parameters
      if (type === "shots") {
        if (!sceneId || !shotId) {
          throw new Error("Scene ID and Shot ID are required for shots");
        }
        editParams.sceneId = sceneId;
        editParams.shotId = shotId;
      } else if (type === "actor") {
        if (!actorId || !actorVersionId) {
          throw new Error(
            "Actor ID and Actor Version ID are required for actors"
          );
        }
        editParams.actorId = actorId;
        editParams.actorVersionId = actorVersionId;
      } else if (type === "location") {
        if (!locationId || !locationVersionId) {
          throw new Error(
            "Location ID and Location Version ID are required for locations"
          );
        }
        editParams.locationId = locationId;
        editParams.locationVersionId = locationVersionId;
        editParams.promptType = promptType || "wideShotLocationSetPrompt";
      }

      const editResult = await optimisedEditImageAsync(editParams);

      // Store optimization data for insights
      if (editResult.optimizedPrompt && editResult.originalPrompt) {
        const optimizationResult: OptimizationResult = {
          optimization: {
            executed_prompt_details: {
              prompt_sent_to_api: editResult.optimizedPrompt,
              prompt_construction_strategy:
                "AI-optimized for visual improvement",
              prompt_token_count: 0,
            },
            edit_success_assessment: {
              agent_confidence_score: 0.9,
              potential_issues_flagged: [],
            },
            status: "success",
          },
          originalTextPrompt: editResult.originalPrompt,
          sourceVersion: editResult.sourceVersion,
          type: editResult.type,
        };
        setOptimizationData(optimizationResult);
        setEditPrompt(editResult.optimizedPrompt);
      }

      onEditComplete(editResult);

      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error("Error in optimised image edit:", error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditPrompt("");
    setOriginalPrompt("");
    setOptimizationData(null);
    setShowOptimizationInsights(false);
    setModelTier(MODEL_TIERS.ULTRA);
    resetEditMutation();
    resetOptimizeMutation();
    resetOptimisedEditMutation();
    onCancel();
  };

  const isProcessing = isOptimizing || isOptimisedEditing || isEditing;

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0, // ✅ Always full width
        display: "flex",
        justifyContent: "center",
        p: 3,
        pb: 7,
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "100%",
          transition: theme.transitions.create(["max-width"], {
            duration: theme.transitions.duration.standard,
          }),
          // 🆕 Move gradient background here (from outer Box)
          background: `linear-gradient(to top, ${theme.palette.background.paper}f0 0%, ${theme.palette.background.paper}b3 50%, transparent 100%)`,
          borderRadius: `${brand.borderRadius}px`,
          position: "relative",
        }}
      >
        <Stack spacing={2}>
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography
              variant="body2"
              color="text.primary"
              fontWeight="medium"
              component="div"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Edit Version {viewingVersion?.version}
              {/* Show additional images count */}
              {additionalImageUrls.length > 0 && (
                <Chip
                  label={`+${additionalImageUrls.length} images`}
                  size="small"
                  color="primary"
                  sx={{
                    ml: 1,
                    height: 20,
                    fontSize: "0.75rem",
                    fontFamily: brand.fonts.body,
                  }}
                />
              )}
              {/* Show selected model tier */}
              {selectedTierOption && (
                <Chip
                  label={selectedTierOption.label}
                  size="small"
                  sx={{
                    ml: 1,
                    height: 20,
                    fontSize: "0.75rem",
                    bgcolor: selectedTierOption.color,
                    color: theme.palette.getContrastText(
                      selectedTierOption.color
                    ),
                    fontFamily: brand.fonts.body,
                  }}
                />
              )}
            </Typography>
            <IconButton
              onClick={handleCancel}
              disabled={isProcessing}
              color="primary"
              sx={{ p: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Error Alerts */}
          {imageEditorError && (
            <Alert
              severity="error"
              sx={{
                mb: 1,
                borderRadius: `${brand.borderRadius}px`,
                "& .MuiAlert-message": {
                  fontFamily: brand.fonts.body,
                },
              }}
            >
              {imageEditorError.message}
            </Alert>
          )}

          {optimisedEditError && (
            <Alert
              severity="error"
              sx={{
                mb: 1,
                borderRadius: `${brand.borderRadius}px`,
                "& .MuiAlert-message": {
                  fontFamily: brand.fonts.body,
                },
              }}
            >
              {optimisedEditError.message}
            </Alert>
          )}

          {optimizeError && (
            <Alert
              severity="error"
              sx={{
                mb: 1,
                borderRadius: `${brand.borderRadius}px`,
                "& .MuiAlert-message": {
                  fontFamily: brand.fonts.body,
                },
              }}
            >
              {optimizeError.message}
            </Alert>
          )}

          {/* Multi-image editing info */}
          {additionalImageUrls.length > 0 && (
            <Alert
              severity="info"
              sx={{
                mb: 1,
                borderRadius: `${brand.borderRadius}px`,
                "& .MuiAlert-message": {
                  fontFamily: brand.fonts.body,
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Multi-image editing with {additionalImageUrls.length + 1} images
                total.
                {additionalImageUrls.length > 1
                  ? " Premium/Ultra users can use all images simultaneously."
                  : " Available for Pro+ users."}
              </Typography>
            </Alert>
          )}

          {/* Prompt Input */}
          <TextField
            multiline
            rows={2}
            fullWidth
            placeholder={
              additionalImageUrls.length > 0
                ? "Describe how to combine and edit these images..."
                : "Describe the changes you want to make..."
            }
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            variant="outlined"
            size="small"
            disabled={isProcessing || disabled}
            InputProps={{
              endAdornment: editPrompt.trim() && (
                <Stack direction="row" spacing={0.5} sx={{ mr: 1 }}>
                  {/* Optimization insights button */}
                  {optimizationData && (
                    <Tooltip title="View optimization insights">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setShowOptimizationInsights(!showOptimizationInsights)
                        }
                        disabled={disabled}
                        color="primary"
                        sx={{
                          opacity: 0.8,
                          "&:hover": { opacity: 1 },
                        }}
                      >
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* Optimize prompt button - standalone optimization */}
                  {isAdmin && (
                    <Tooltip title="Optimize this prompt with AI (preview only)">
                      <span>
                        <IconButton
                          size="small"
                          onClick={handleOptimizePrompt}
                          disabled={
                            isProcessing || !editPrompt.trim() || disabled
                          }
                          color="primary"
                          sx={{
                            opacity: 0.8,
                            "&:hover": { opacity: 1 },
                            "&:disabled": { opacity: 0.3 },
                          }}
                        >
                          {isOptimizing ? (
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                border: `2px solid ${theme.palette.divider}`,
                                borderTop: `2px solid ${theme.palette.primary.main}`,
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                "@keyframes spin": {
                                  "0%": { transform: "rotate(0deg)" },
                                  "100%": { transform: "rotate(360deg)" },
                                },
                              }}
                            />
                          ) : (
                            <OptimizeIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Stack>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: isProcessing
                  ? theme.palette.action.hover
                  : "transparent",
                backdropFilter: "blur(10px)",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: `${brand.borderRadius}px`,
                fontFamily: brand.fonts.body,
                "& fieldset": {
                  border: "none",
                },
                "&:hover fieldset": {
                  border: "none",
                },
                "&.Mui-focused": {
                  borderColor: "primary.main",
                },
                "& input, & textarea": {
                  color: "text.primary",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  fontFamily: brand.fonts.body,
                  "&::placeholder": {
                    color: "text.secondary",
                    opacity: 0.7,
                  },
                },
              },
            }}
          />

          {/* Optimization Insights Panel */}
          {optimizationData && showOptimizationInsights && (
            <Collapse in={showOptimizationInsights}>
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: theme.palette.action.hover,
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: `${brand.borderRadius}px`,
                }}
              >
                <Stack spacing={1.5}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography
                      variant="caption"
                      color="text.primary"
                      fontWeight="medium"
                      sx={{ fontFamily: brand.fonts.body }}
                    >
                      Optimization Insights
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setShowOptimizationInsights(false)}
                      color="primary"
                      sx={{ p: 0.5 }}
                    >
                      <CollapseIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  {optimizationInsights && (
                    <Stack spacing={1}>
                      {optimizationInsights.strategy && (
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontFamily: brand.fonts.body,
                            }}
                          >
                            Strategy:
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.primary"
                            sx={{ ml: 1, fontFamily: brand.fonts.body }}
                          >
                            {optimizationInsights.strategy}
                          </Typography>
                        </Box>
                      )}

                      {optimizationInsights.confidence !== undefined && (
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontFamily: brand.fonts.body,
                            }}
                          >
                            Confidence:
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.primary"
                            sx={{ ml: 1, fontFamily: brand.fonts.body }}
                          >
                            {Math.round(optimizationInsights.confidence * 100)}%
                          </Typography>
                        </Box>
                      )}

                      {optimizationInsights.tokenCount && (
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontFamily: brand.fonts.body,
                            }}
                          >
                            Tokens:
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.primary"
                            sx={{ ml: 1, fontFamily: brand.fonts.body }}
                          >
                            {optimizationInsights.tokenCount}
                          </Typography>
                        </Box>
                      )}

                      {optimizationInsights.potentialIssues &&
                        optimizationInsights.potentialIssues.length > 0 && (
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontFamily: brand.fonts.body,
                              }}
                            >
                              Potential Issues:
                            </Typography>
                            {optimizationInsights.potentialIssues.map(
                              (issue: string, index: number) => (
                                <Typography
                                  key={index}
                                  variant="caption"
                                  color="warning.main"
                                  sx={{
                                    display: "block",
                                    ml: 1,
                                    fontSize: "0.7rem",
                                    fontFamily: brand.fonts.body,
                                  }}
                                >
                                  • {issue}
                                </Typography>
                              )
                            )}
                          </Box>
                        )}

                      {originalPrompt && originalPrompt !== editPrompt && (
                        <Box>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => {
                              setEditPrompt(originalPrompt);
                              setOptimizationData(null);
                              setShowOptimizationInsights(false);
                            }}
                            disabled={disabled}
                            sx={{
                              fontSize: "0.7rem",
                              py: 0.5,
                              borderRadius: `${brand.borderRadius}px`,
                              fontFamily: brand.fonts.body,
                            }}
                          >
                            Revert to Original
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Collapse>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleEditSubmit}
              disabled={!editPrompt.trim() || isProcessing || disabled}
              size="small"
              startIcon={selectedTierOption?.icon || <OptimizeIcon />}
              sx={{
                minWidth: 100,
                borderRadius: `${brand.borderRadius}px`,
                fontFamily: brand.fonts.body,
                ...(selectedTierOption && {
                  bgcolor: selectedTierOption.color,
                  color: theme.palette.getContrastText(
                    selectedTierOption.color
                  ),
                  "&:hover": {
                    bgcolor: `${selectedTierOption.color}dd`,
                  },
                }),
              }}
            >
              {isOptimisedEditing
                ? `Creating with ${selectedTierOption?.label || "AI"}...`
                : isEditing
                  ? "Creating..."
                  : `Create with ${selectedTierOption?.label || "AI"}`}
            </Button>

            <Button
              variant="outlined"
              color="primary"
              onClick={handleCancel}
              disabled={isProcessing}
              size="small"
              sx={{
                bgcolor: "transparent",
                backdropFilter: "blur(10px)",
                borderRadius: `${brand.borderRadius}px`,
                fontFamily: brand.fonts.body,
              }}
            >
              Cancel
            </Button>

            {/* Additional Images Toggle Button */}
            <Button
              variant={additionalImagesMode ? "contained" : "outlined"}
              color="primary"
              onClick={onAdditionalImagesModeToggle}
              disabled={isProcessing || disabled}
              size="small"
              startIcon={<PlusIcon size={16} />}
              sx={{
                backdropFilter: "blur(10px)",
                borderRadius: `${brand.borderRadius}px`,
                fontFamily: brand.fonts.body,
              }}
            >
              Images ({additionalImageUrls.length})
            </Button>

            {/* Model Tier Selector */}
            <ModelTierSelector
              value={modelTier}
              onChange={setModelTier}
              disabled={isProcessing || disabled}
              showDescription={true}
              compact={true}
            />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
