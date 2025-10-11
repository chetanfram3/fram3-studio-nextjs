"use client";

// ImageEditOverlay.tsx - Updated with Model Tier Selector
import { useState, useEffect } from "react";
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
import { ImageVersion } from "@/types/storyBoard/types";
import {
  useImageEditor,
  getOptimizedPrompt,
  getOptimizationInsights,
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
  onEditComplete: (result: any) => void;
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
  onAdditionalImagesUpdate,
  additionalImagesMode,
  onAdditionalImagesModeToggle,
  onEditComplete,
  onCancel,
  onDataRefresh,
  onEditingStateChange,
  disabled = false,
}: ImageEditOverlayProps) {
  // State
  const { isAdmin } = useSubscription();
  const [editPrompt, setEditPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [showOptimizationInsights, setShowOptimizationInsights] =
    useState(false);

  // Model tier state
  const { modelTier, setModelTier, getSelectedOption } = useModelTier(
    MODEL_TIERS.ULTRA
  );

  // Hooks
  const {
    editImageAsync,
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
  } = useImageEditor();

  // Reset state when overlay opens/closes
  useEffect(() => {
    if (!disabled) {
      setEditPrompt("");
      setOriginalPrompt("");
      setOptimizationData(null);
      setShowOptimizationInsights(false);
      setModelTier(MODEL_TIERS.ULTRA); // Reset to default
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

  // Handle prompt optimization (standalone)
  const handleOptimizePrompt = async () => {
    if (!scriptId || !versionId || !editPrompt.trim()) {
      return;
    }

    try {
      resetOptimizeMutation();
      setOriginalPrompt(editPrompt); // Store original prompt

      const optimizeParams: any = {
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
      console.log("Optimization result:", result);

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
      setOriginalPrompt(editPrompt); // Store original prompt

      const editParams: any = {
        scriptId,
        versionId,
        type,
        sourceVersion: viewingVersion?.version,
        prompt: editPrompt.trim(),
        // Add optimization parameters
        temperature: 0.1,
        topP: 0.8,
        // Add additional images if provided
        ...(additionalImageUrls.length > 0 && { additionalImageUrls }),
        // Add model tier to options
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
      // keyVisual needs no additional params

      // Use optimised edit instead of regular edit
      const editResult = await optimisedEditImageAsync(editParams);
      console.log("Optimised edit completed successfully:", editResult);

      // Store optimization data for insights
      if (editResult.optimizedPrompt && editResult.originalPrompt) {
        setOptimizationData({
          optimization: {
            executed_prompt_details: {
              prompt_sent_to_api: editResult.optimizedPrompt,
              prompt_construction_strategy:
                "AI-optimized for visual improvement",
            },
            edit_success_assessment: {
              agent_confidence_score: 0.9, // Default high confidence for successful edits
              potential_issues_flagged: [],
            },
          },
          originalTextPrompt: editResult.originalPrompt,
          sourceVersion: editResult.sourceVersion,
          type: editResult.type,
        });
        // Update the prompt field to show the optimized version
        setEditPrompt(editResult.optimizedPrompt);
      }

      // Call completion callback
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
    setModelTier(MODEL_TIERS.ULTRA); // Reset to default
    resetEditMutation();
    resetOptimizeMutation();
    resetOptimisedEditMutation();
    onCancel();
  };

  const selectedTierOption = getSelectedOption();

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: additionalImagesMode ? "350px" : 0,
        background:
          "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)",
        p: 3,
        pb: 7,
        zIndex: 10,
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
            color="white"
            fontWeight="medium"
            component="div"
          >
            Edit Version {viewingVersion?.version}
            {/* Show additional images count */}
            {additionalImageUrls.length > 0 && (
              <Chip
                label={`+${additionalImageUrls.length} images`}
                size="small"
                color="secondary"
                sx={{ ml: 1, height: 20, fontSize: "0.75rem" }}
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
                  color: "white",
                }}
              />
            )}
          </Typography>
          <IconButton
            onClick={handleCancel}
            disabled={isEditing || isOptimizing || isOptimisedEditing}
            sx={{ color: "white", p: 0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Error Alerts */}
        {imageEditorError && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {imageEditorError.message}
          </Alert>
        )}

        {optimisedEditError && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {optimisedEditError.message}
          </Alert>
        )}

        {optimizeError && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {optimizeError.message}
          </Alert>
        )}

        {/* Multi-image editing info */}
        {additionalImageUrls.length > 0 && (
          <Alert severity="info" sx={{ mb: 1 }}>
            <Typography variant="caption">
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
          disabled={isOptimizing || isOptimisedEditing || disabled}
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
                      sx={{
                        color: "secondary.main",
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
                          isOptimizing ||
                          isOptimisedEditing ||
                          !editPrompt.trim() ||
                          disabled
                        }
                        sx={{
                          color: "secondary.main",
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
                              border: "2px solid rgba(255,255,255,0.3)",
                              borderTop: "2px solid",
                              borderTopColor: "secondary.main",
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
              bgcolor:
                isOptimizing || isOptimisedEditing
                  ? "rgba(255,255,255,0.05)"
                  : "transparent",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 1,
              "& fieldset": {
                border: "none",
              },
              "&:hover fieldset": {
                border: "none",
              },
              "&.Mui-focused fieldset": {
                border: "1px solid",
                borderColor: "secondary.main",
              },
              "& input, & textarea": {
                color: "secondary.main",
                fontSize: "0.875rem",
                fontWeight: 500,
                "&::placeholder": {
                  color: "rgba(255,255,255,0.7)",
                  opacity: 1,
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
                bgcolor: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 1,
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
                    color="white"
                    fontWeight="medium"
                  >
                    Optimization Insights
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setShowOptimizationInsights(false)}
                    sx={{ color: "white", p: 0.5 }}
                  >
                    <CollapseIcon fontSize="small" />
                  </IconButton>
                </Stack>

                {(() => {
                  const insights = getOptimizationInsights(optimizationData);
                  return (
                    <Stack spacing={1}>
                      {insights.strategy && (
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: "rgba(255,255,255,0.7)" }}
                          >
                            Strategy:
                          </Typography>
                          <Typography
                            variant="caption"
                            color="white"
                            sx={{ ml: 1 }}
                          >
                            {insights.strategy}
                          </Typography>
                        </Box>
                      )}

                      {insights.confidence !== undefined && (
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: "rgba(255,255,255,0.7)" }}
                          >
                            Confidence:
                          </Typography>
                          <Typography
                            variant="caption"
                            color="white"
                            sx={{ ml: 1 }}
                          >
                            {Math.round(insights.confidence * 100)}%
                          </Typography>
                        </Box>
                      )}

                      {insights.tokenCount && (
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: "rgba(255,255,255,0.7)" }}
                          >
                            Tokens:
                          </Typography>
                          <Typography
                            variant="caption"
                            color="white"
                            sx={{ ml: 1 }}
                          >
                            {insights.tokenCount}
                          </Typography>
                        </Box>
                      )}

                      {insights.potentialIssues &&
                        insights.potentialIssues.length > 0 && (
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              Potential Issues:
                            </Typography>
                            {insights.potentialIssues.map(
                              (issue: string, index: number) => (
                                <Typography
                                  key={index}
                                  variant="caption"
                                  color="warning.main"
                                  sx={{
                                    display: "block",
                                    ml: 1,
                                    fontSize: "0.7rem",
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
                            onClick={() => {
                              setEditPrompt(originalPrompt);
                              setOptimizationData(null);
                              setShowOptimizationInsights(false);
                            }}
                            disabled={disabled}
                            sx={{
                              color: "white",
                              borderColor: "rgba(255,255,255,0.3)",
                              fontSize: "0.7rem",
                              py: 0.5,
                              "&:hover": {
                                bgcolor: "rgba(255,255,255,0.1)",
                                borderColor: "white",
                              },
                            }}
                          >
                            Revert to Original
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  );
                })()}
              </Stack>
            </Box>
          </Collapse>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={handleEditSubmit}
            disabled={
              !editPrompt.trim() ||
              isEditing ||
              isOptimizing ||
              isOptimisedEditing ||
              disabled
            }
            size="small"
            startIcon={selectedTierOption?.icon || <OptimizeIcon />}
            sx={{
              minWidth: 100,
              bgcolor: selectedTierOption?.color || "secondary.main",
              "&:hover": {
                bgcolor: selectedTierOption?.color
                  ? `${selectedTierOption.color}dd`
                  : "secondary.dark",
              },
            }}
          >
            {isOptimisedEditing
              ? `Creating with ${selectedTierOption?.label || "AI"}...`
              : isEditing
                ? "Creating..."
                : additionalImageUrls.length > 0
                  ? `Create with ${selectedTierOption?.label || "AI"}`
                  : `Create with ${selectedTierOption?.label || "AI"}`}
          </Button>

          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isEditing || isOptimizing || isOptimisedEditing}
            size="small"
            sx={{
              color: "white",
              borderColor: "rgba(255,255,255,0.5)",
              bgcolor: "transparent",
              backdropFilter: "blur(10px)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.1)",
                borderColor: "white",
              },
            }}
          >
            Cancel
          </Button>

          {/* Additional Images Toggle Button */}
          <Button
            variant={additionalImagesMode ? "contained" : "outlined"}
            onClick={onAdditionalImagesModeToggle}
            disabled={
              isEditing || isOptimizing || isOptimisedEditing || disabled
            }
            size="small"
            startIcon={<PlusIcon size={16} />}
            sx={{
              color: additionalImagesMode ? "white" : "white",
              borderColor: "rgba(255,255,255,0.5)",
              bgcolor: additionalImagesMode ? "secondary.main" : "transparent",
              backdropFilter: "blur(10px)",
              "&:hover": {
                bgcolor: additionalImagesMode
                  ? "secondary.dark"
                  : "rgba(255,255,255,0.1)",
                borderColor: "white",
              },
            }}
          >
            Images ({additionalImageUrls.length})
          </Button>

          {/* Model Tier Selector */}
          <ModelTierSelector
            value={modelTier}
            onChange={setModelTier}
            disabled={isOptimizing || isOptimisedEditing || disabled}
            showDescription={true}
            compact={true}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
