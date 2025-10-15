// src/modules/scripts/ScriptContextPanel.tsx
"use client";

import React from "react";
import {
  Box,
  Typography,
  Chip,
  Paper,
  alpha,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Movie,
  MusicNote,
  Lightbulb,
  Timer,
  CheckCircle,
  Warning,
  ExpandMore,
  Campaign,
  Notes,
  DesignServices,
  Help,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface ScriptContextPanelProps {
  conceptSummary?: {
    coreIdea?: string;
    emotionalArc?: string;
    narrativeStrategy?: string;
    keyVisualAuditoryMood?: string;
    productRole?: string;
  };
  suggestedVisualElements?: string[];
  suggestedAudioCues?: string[];
  basicAnalysis?: {
    wordCount?: number | null;
    estimatedCharacterCount?: number | null;
    brandNameMentioned?: boolean | null;
    ctaMentioned?: boolean | null;
    mandatoriesMentioned?: boolean | null;
  };
  synthesizedInputs?: {
    scriptConstraints?: {
      durationSec?: number | null;
      formatGuidance?: string | null;
      aspectRatio?: string | null;
      mustHaves?: string | null;
      mandatories?: string | null;
      productionLimits?: string[] | null;
    };
    ctaDetails?: {
      text?: string | null;
      urgencyLevel?: string | null;
      offerDetails?: string | null;
    };
    brandEssence?: string | null;
    coreProductBenefit?: string | null;
  };
  strategicContextSummary?: {
    inferredProductCategory?: string | null;
    inferredBrandArchetype?: string | null;
    keyEmotionalTargets?: string[];
    selectedNarrativeStructure?: string | null;
  };
  scriptDuration?: number;
  actualDuration?: number;
  mode?: string;
  isRevision?: boolean;
  revisionSummary?: string | null;
}

/**
 * ScriptContextPanel - Display script metadata and context information
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Simple functional component for auto-optimization
 * - Helper functions auto-optimized by compiler
 *
 * Theme integration:
 * - Uses theme.palette for all colors (no hardcoded colors)
 * - Uses brand configuration for fonts
 * - Respects light/dark mode automatically
 * - Uses primary color for main elements (not secondary)
 * - Semantic colors (success/warning/error/info) used appropriately
 *
 * Porting changes:
 * - Changed secondary color usage to primary
 * - Removed hardcoded alpha values, using theme colors
 * - Added brand fonts for all typography
 * - Made all chips and icons theme-aware
 * - Proper color usage following theme guide
 */
export function ScriptContextPanel({
  conceptSummary,
  suggestedVisualElements,
  suggestedAudioCues,
  basicAnalysis,
  synthesizedInputs,
  strategicContextSummary,
  scriptDuration,
  actualDuration,
  mode,
  isRevision,
  revisionSummary,
}: ScriptContextPanelProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  // Check if duration is within target range
  const targetDuration =
    synthesizedInputs?.scriptConstraints?.durationSec || scriptDuration;
  const durationDifference =
    actualDuration && targetDuration
      ? actualDuration - (targetDuration as number)
      : 0;

  const durationStatus = () => {
    if (!actualDuration || !targetDuration) return "unknown";
    const percentDiff =
      (Math.abs(durationDifference) / (targetDuration as number)) * 100;

    if (percentDiff <= 5) return "good";
    if (percentDiff <= 15) return "warning";
    return "error";
  };

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  // Render helper for requirement status
  const renderRequirementStatus = (isMet: boolean | null | undefined) => {
    if (isMet === null || isMet === undefined) return null;

    return isMet ? (
      <CheckCircle fontSize="small" color="success" />
    ) : (
      <Warning fontSize="small" color="warning" />
    );
  };

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 2 }}>
      {/* Script Type and Revision Info */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              mb: 0.5,
              color: "text.primary",
              fontFamily: brand.fonts.heading,
            }}
          >
            Script Context
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Chip
              label={mode || "TV Commercial"}
              size="small"
              color="primary"
              icon={<Movie fontSize="small" />}
              sx={{ fontFamily: brand.fonts.body }}
            />
            {isRevision && (
              <Chip
                label="Revision"
                size="small"
                color="info"
                icon={<Notes fontSize="small" />}
                sx={{ fontFamily: brand.fonts.body }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Revision Summary if applicable */}
      {isRevision && revisionSummary && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: alpha(theme.palette.info.main, 0.1),
            borderLeft: `3px solid ${theme.palette.info.main}`,
            borderRadius: `${brand.borderRadius}px`,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              mb: 0.5,
              color: "info.main",
              fontFamily: brand.fonts.heading,
              fontWeight: 600,
            }}
          >
            Revision Notes
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.primary",
              fontFamily: brand.fonts.body,
            }}
          >
            {revisionSummary}
          </Typography>
        </Paper>
      )}

      {/* Script Duration Panel */}
      <Accordion
        defaultExpanded={false}
        elevation={0}
        sx={{
          mb: 2,
          "&:before": { display: "none" },
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore sx={{ color: "primary.main" }} />}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Timer sx={{ mr: 1, color: "primary.main" }} />
            <Typography
              variant="subtitle2"
              sx={{
                color: "text.primary",
                fontFamily: brand.fonts.heading,
                fontWeight: 600,
              }}
            >
              Duration Analysis
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {targetDuration && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  Target Duration:
                </Typography>
                <Chip
                  label={`${targetDuration} seconds`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontFamily: brand.fonts.body,
                    borderColor: "divider",
                  }}
                />
              </Box>
            )}

            {actualDuration && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  Current Estimate:
                </Typography>
                <Chip
                  label={`${actualDuration} seconds`}
                  size="small"
                  color={
                    durationStatus() === "good"
                      ? "success"
                      : durationStatus() === "warning"
                        ? "warning"
                        : "error"
                  }
                  variant={durationStatus() === "good" ? "filled" : "outlined"}
                  sx={{ fontFamily: brand.fonts.body }}
                />
              </Box>
            )}

            {targetDuration && actualDuration && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  Difference:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    fontFamily: brand.fonts.body,
                    color:
                      durationStatus() === "good"
                        ? "success.main"
                        : durationStatus() === "warning"
                          ? "warning.main"
                          : "error.main",
                  }}
                >
                  {durationDifference > 0 ? "+" : ""}
                  {durationDifference} seconds
                </Typography>
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Concept Summary */}
      {conceptSummary && (
        <Accordion
          defaultExpanded={false}
          elevation={0}
          sx={{
            mb: 2,
            "&:before": { display: "none" },
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: "primary.main" }} />}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Lightbulb sx={{ mr: 1, color: "primary.main" }} />
              <Typography
                variant="subtitle2"
                sx={{
                  color: "text.primary",
                  fontFamily: brand.fonts.heading,
                  fontWeight: 600,
                }}
              >
                Concept Summary
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {conceptSummary.coreIdea && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="Core Idea"
                    secondary={conceptSummary.coreIdea}
                    primaryTypographyProps={{
                      variant: "caption",
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                    secondaryTypographyProps={{
                      variant: "body2",
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  />
                </ListItem>
              )}

              {conceptSummary.emotionalArc && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="Emotional Arc"
                    secondary={conceptSummary.emotionalArc}
                    primaryTypographyProps={{
                      variant: "caption",
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                    secondaryTypographyProps={{
                      variant: "body2",
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  />
                </ListItem>
              )}

              {conceptSummary.narrativeStrategy && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="Narrative Strategy"
                    secondary={conceptSummary.narrativeStrategy}
                    primaryTypographyProps={{
                      variant: "caption",
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                    secondaryTypographyProps={{
                      variant: "body2",
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  />
                </ListItem>
              )}

              {strategicContextSummary?.selectedNarrativeStructure && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="Narrative Structure"
                    secondary={
                      strategicContextSummary.selectedNarrativeStructure
                    }
                    primaryTypographyProps={{
                      variant: "caption",
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                    secondaryTypographyProps={{
                      variant: "body2",
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  />
                </ListItem>
              )}

              {conceptSummary.keyVisualAuditoryMood && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="Visual & Audio Mood"
                    secondary={conceptSummary.keyVisualAuditoryMood}
                    primaryTypographyProps={{
                      variant: "caption",
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                    secondaryTypographyProps={{
                      variant: "body2",
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  />
                </ListItem>
              )}

              {synthesizedInputs?.brandEssence && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="Brand Essence"
                    secondary={synthesizedInputs.brandEssence}
                    primaryTypographyProps={{
                      variant: "caption",
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                    secondaryTypographyProps={{
                      variant: "body2",
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  />
                </ListItem>
              )}

              {strategicContextSummary?.inferredBrandArchetype && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="Brand Archetype"
                    secondary={strategicContextSummary.inferredBrandArchetype}
                    primaryTypographyProps={{
                      variant: "caption",
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                    secondaryTypographyProps={{
                      variant: "body2",
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  />
                </ListItem>
              )}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Key Requirements */}
      {synthesizedInputs?.scriptConstraints && (
        <Accordion
          defaultExpanded={false}
          elevation={0}
          sx={{
            mb: 2,
            "&:before": { display: "none" },
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: "primary.main" }} />}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CheckCircle sx={{ mr: 1, color: "primary.main" }} />
              <Typography
                variant="subtitle2"
                sx={{
                  color: "text.primary",
                  fontFamily: brand.fonts.heading,
                  fontWeight: 600,
                }}
              >
                Requirements
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {/* Requirements Checklist */}
            <List dense disablePadding>
              {basicAnalysis?.brandNameMentioned !== undefined && (
                <ListItem
                  disableGutters
                  secondaryAction={renderRequirementStatus(
                    basicAnalysis.brandNameMentioned
                  )}
                >
                  <ListItemText
                    primary="Brand Name Mentioned"
                    primaryTypographyProps={{
                      variant: "body2",
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  />
                </ListItem>
              )}

              {basicAnalysis?.ctaMentioned !== undefined && (
                <ListItem
                  disableGutters
                  secondaryAction={renderRequirementStatus(
                    basicAnalysis.ctaMentioned
                  )}
                >
                  <ListItemText
                    primary="Call to Action Included"
                    primaryTypographyProps={{
                      variant: "body2",
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  />
                </ListItem>
              )}

              {basicAnalysis?.mandatoriesMentioned !== undefined && (
                <ListItem
                  disableGutters
                  secondaryAction={renderRequirementStatus(
                    basicAnalysis.mandatoriesMentioned
                  )}
                >
                  <ListItemText
                    primary="Legal/Mandatories Included"
                    primaryTypographyProps={{
                      variant: "body2",
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  />
                </ListItem>
              )}

              {/* Must-Haves Details */}
              {synthesizedInputs.scriptConstraints.mustHaves && (
                <ListItem disableGutters sx={{ display: "block", mt: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    Must-Haves:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    {synthesizedInputs.scriptConstraints.mustHaves}
                  </Typography>
                </ListItem>
              )}

              {/* Mandatories Details */}
              {synthesizedInputs.scriptConstraints.mandatories && (
                <ListItem disableGutters sx={{ display: "block", mt: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    Legal/Mandatories:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    {synthesizedInputs.scriptConstraints.mandatories}
                  </Typography>
                </ListItem>
              )}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Suggested Visual & Audio Elements */}
      {(suggestedVisualElements?.length || suggestedAudioCues?.length) && (
        <Accordion
          defaultExpanded={false}
          elevation={0}
          sx={{
            mb: 2,
            "&:before": { display: "none" },
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: "primary.main" }} />}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <DesignServices sx={{ mr: 1, color: "primary.main" }} />
              <Typography
                variant="subtitle2"
                sx={{
                  color: "text.primary",
                  fontFamily: brand.fonts.heading,
                  fontWeight: 600,
                }}
              >
                Creative Suggestions
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {/* Visual Elements */}
            {suggestedVisualElements && suggestedVisualElements?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "flex",
                    alignItems: "center",
                    mb: 1,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  <Movie fontSize="small" sx={{ mr: 0.5 }} /> Visual Elements
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {suggestedVisualElements.map((element, index) => (
                    <Chip
                      key={index}
                      label={element}
                      size="small"
                      variant="outlined"
                      sx={{
                        m: 0.5,
                        fontFamily: brand.fonts.body,
                        borderColor: "divider",
                        color: "text.primary",
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Audio Cues */}
            {suggestedAudioCues && suggestedAudioCues?.length > 0 && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "flex",
                    alignItems: "center",
                    mb: 1,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  <MusicNote fontSize="small" sx={{ mr: 0.5 }} /> Audio Cues
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {suggestedAudioCues.map((cue, index) => (
                    <Chip
                      key={index}
                      label={cue}
                      size="small"
                      variant="outlined"
                      sx={{
                        m: 0.5,
                        fontFamily: brand.fonts.body,
                        borderColor: "divider",
                        color: "text.primary",
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Call to Action Details */}
      {synthesizedInputs?.ctaDetails && (
        <Accordion
          defaultExpanded={false}
          elevation={0}
          sx={{
            mb: 2,
            "&:before": { display: "none" },
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: "primary.main" }} />}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Campaign sx={{ mr: 1, color: "primary.main" }} />
              <Typography
                variant="subtitle2"
                sx={{
                  color: "text.primary",
                  fontFamily: brand.fonts.heading,
                  fontWeight: 600,
                }}
              >
                Call to Action
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {synthesizedInputs.ctaDetails.text && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="CTA Text"
                    secondary={synthesizedInputs.ctaDetails.text}
                    primaryTypographyProps={{
                      variant: "caption",
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                    secondaryTypographyProps={{
                      variant: "body2",
                      fontWeight: 500,
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  />
                </ListItem>
              )}

              {synthesizedInputs.ctaDetails.urgencyLevel && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="Urgency Level"
                    secondary={synthesizedInputs.ctaDetails.urgencyLevel}
                    primaryTypographyProps={{
                      variant: "caption",
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                    secondaryTypographyProps={{
                      variant: "body2",
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  />
                </ListItem>
              )}

              {synthesizedInputs.ctaDetails.offerDetails && (
                <ListItem disableGutters>
                  <ListItemText
                    primary="Offer Details"
                    secondary={synthesizedInputs.ctaDetails.offerDetails}
                    primaryTypographyProps={{
                      variant: "caption",
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                    secondaryTypographyProps={{
                      variant: "body2",
                      color: "text.primary",
                      fontFamily: brand.fonts.body,
                    }}
                  />
                </ListItem>
              )}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Help/Info Panel */}
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Tooltip title="This panel shows context and metadata from the script generation process to help guide your editing">
          <IconButton
            size="small"
            color="info"
            sx={{
              "&:hover": {
                bgcolor: alpha(theme.palette.info.main, 0.08),
              },
            }}
          >
            <Help fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            color: "text.secondary",
            fontFamily: brand.fonts.body,
          }}
        >
          Use this context to guide your edits
        </Typography>
      </Box>
    </Box>
  );
}

export default ScriptContextPanel;
