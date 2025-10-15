"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Paper,
  Grid,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";
import {
  DeleteOutline,
  Visibility,
  Token as TokenIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getCurrentBrand } from "@/config/brandConfig";
import { ANALYSIS_TITLES } from "@/config/analysisTypes";
import { deleteAnalysis, fetchAnalysisStatus } from "./api";

/**
 * CompletedAnalyses - Displays and manages completed script analyses
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Uses startTransition for non-urgent navigation updates
 * - React Query for efficient data fetching and caching
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - Uses theme transitions for smooth interactions
 * - No hardcoded colors or spacing
 *
 * @param scriptId - The ID of the script
 * @param versionId - The version ID of the script
 * @param completedAnalyses - Array of completed analysis type keys
 */

interface CompletedAnalysesProps {
  scriptId: string;
  versionId: string;
  completedAnalyses: string[];
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

interface AnalysisCardProps {
  analysisType: string;
  disabled?: boolean;
  onView: (type: string) => void;
  onDelete: (type: string) => void;
  canDelete: boolean;
  credits: number | null;
}

export default function CompletedAnalyses({
  scriptId,
  versionId,
  completedAnalyses,
}: CompletedAnalysesProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const { data: statusData } = useQuery({
    queryKey: ["analysisStatus", scriptId, versionId],
    queryFn: () => fetchAnalysisStatus(scriptId, versionId),
  });

  const legacyMappings: Record<string, string> = {
    actorProcessedImages: "processActorImages",
    locationProcessedImages: "processLocationImages",
    keyVisualProcessedImage: "keyVisualProcessor",
    processedImages: "processScenesAndShots",
  };

  const getFilteredAnalyses = (analyses: string[]) => {
    const filtered = new Set<string>();

    for (const analysis of analyses) {
      if (legacyMappings[analysis]) {
        const correctName = legacyMappings[analysis];
        if (analyses.includes(correctName)) {
          continue;
        }
      }

      const isCorrectNameWithLegacy =
        Object.values(legacyMappings).includes(analysis);
      if (isCorrectNameWithLegacy) {
        const legacyNames = Object.keys(legacyMappings).filter(
          (key) => legacyMappings[key] === analysis
        );
        const hasLegacyVersion = legacyNames.some((legacy) =>
          analyses.includes(legacy)
        );
        if (hasLegacyVersion) {
          filtered.add(analysis);
          continue;
        }
      }

      filtered.add(analysis);
    }

    return Array.from(filtered);
  };

  const filteredCompletedAnalyses = getFilteredAnalyses(completedAnalyses);

  const handleAnalysisClick = (analysisType: string) => {
    startTransition(() => {
      router.push(
        `/scripts/${scriptId}/version/${versionId}/analysis/view/${analysisType}`
      );
    });
  };

  const handleDeleteClick = (analysisType: string) => {
    setAnalysisToDelete(analysisType);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!analysisToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteAnalysis(
        scriptId,
        versionId,
        analysisToDelete
      );

      setSnackbar({
        open: true,
        message: result.message || "Analysis deleted successfully",
        severity: "success",
      });

      queryClient.invalidateQueries({
        queryKey: ["analysisStatus", scriptId, versionId],
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error instanceof Error ? error.message : "Failed to delete analysis",
        severity: "error",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAnalysisToDelete("");
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const nonDeletableTypes = ["moderation", "categories"];

  const canDeleteAnalysis = (analysisType: string) => {
    return !nonDeletableTypes.includes(analysisType);
  };

  const getCreditsForAnalysis = (analysisType: string): number | null => {
    if (!statusData?.statuses) return null;

    const status = statusData.statuses[analysisType];
    if (status) {
      return status.creditInfo?.creditsUsed || null;
    }

    const legacyName = Object.keys(legacyMappings).find(
      (key) => legacyMappings[key] === analysisType
    );
    if (legacyName && statusData.statuses[legacyName]) {
      return statusData.statuses[legacyName].creditInfo?.creditsUsed || null;
    }

    return null;
  };

  const AnalysisCard = ({
    analysisType,
    disabled = false,
    onView,
    onDelete,
    canDelete,
    credits,
  }: AnalysisCardProps) => {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 2,
          height: "100%",
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
          opacity: disabled ? 0.6 : 1,
          transition: theme.transitions.create(
            ["transform", "box-shadow", "border-color"],
            { duration: theme.transitions.duration.shorter }
          ),
          "&:hover": {
            transform: disabled ? "none" : "translateY(-2px)",
            boxShadow: disabled ? 1 : theme.shadows[3],
            borderColor: disabled ? "divider" : "primary.main",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              mb: 1,
              color: disabled ? "text.disabled" : "text.primary",
              fontFamily: brand.fonts.body,
            }}
          >
            {ANALYSIS_TITLES[analysisType as keyof typeof ANALYSIS_TITLES] ||
              analysisType}
          </Typography>

          {credits && (
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <TokenIcon
                sx={{ fontSize: 16, mr: 0.5, color: "primary.main" }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                }}
              >
                {credits} credits
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
            {!disabled && (
              <>
                <Tooltip title="View analysis">
                  <IconButton
                    size="small"
                    onClick={() => onView(analysisType)}
                    sx={{
                      color: "primary.main",
                      bgcolor: "action.hover",
                      borderRadius: `${brand.borderRadius * 0.5}px`,
                      transition: theme.transitions.create(
                        ["background-color", "transform"],
                        { duration: theme.transitions.duration.shorter }
                      ),
                      "&:hover": {
                        bgcolor: "action.selected",
                        transform: "scale(1.05)",
                      },
                    }}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>

                {canDelete && (
                  <Tooltip title="Delete analysis">
                    <IconButton
                      size="small"
                      onClick={() => onDelete(analysisType)}
                      sx={{
                        color: "error.main",
                        bgcolor: "action.hover",
                        borderRadius: `${brand.borderRadius * 0.5}px`,
                        transition: theme.transitions.create(
                          ["background-color", "transform"],
                          { duration: theme.transitions.duration.shorter }
                        ),
                        "&:hover": {
                          bgcolor: "action.selected",
                          transform: "scale(1.05)",
                        },
                      }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <>
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            mb: 1.5,
            fontWeight: 600,
            color: "text.primary",
            fontFamily: brand.fonts.heading,
          }}
        >
          Completed Analyses
        </Typography>

        <Grid container gap={2}>
          {filteredCompletedAnalyses.map((analysisType) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={analysisType}>
              <AnalysisCard
                analysisType={analysisType}
                onView={handleAnalysisClick}
                onDelete={handleDeleteClick}
                canDelete={canDeleteAnalysis(analysisType)}
                credits={getCreditsForAnalysis(analysisType)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            borderRadius: `${brand.borderRadius}px`,
            border: 2,
            borderColor: "primary.main",
          },
        }}
      >
        <DialogTitle
          sx={{ fontFamily: brand.fonts.heading, color: "text.primary" }}
        >
          Confirm Analysis Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{ fontFamily: brand.fonts.body, color: "text.secondary" }}
          >
            Are you sure you want to delete the &quot;
            {ANALYSIS_TITLES[
              analysisToDelete as keyof typeof ANALYSIS_TITLES
            ] || analysisToDelete}
            &quot; analysis? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
            sx={{
              color: "text.secondary",
              fontFamily: brand.fonts.body,
              borderRadius: `${brand.borderRadius}px`,
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={isDeleting}
            variant="contained"
            sx={{
              fontFamily: brand.fonts.body,
              borderRadius: `${brand.borderRadius}px`,
              transition: theme.transitions.create(
                ["background-color", "transform"],
                { duration: theme.transitions.duration.shorter }
              ),
              "&:hover": {
                transform: "translateY(-1px)",
              },
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            bgcolor: "background.paper",
            color: "text.primary",
            fontFamily: brand.fonts.body,
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor:
              snackbar.severity === "error" ? "error.main" : "success.main",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
