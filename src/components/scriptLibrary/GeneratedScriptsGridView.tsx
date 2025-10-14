// components/GeneratedScriptsGridView.tsx
"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Stack,
  alpha,
  Grid,
  Skeleton,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  Visibility,
  PlayArrow,
  Edit,
  Assessment,
  Schedule,
  CheckCircle,
  Error as ErrorIcon,
  MoreVert,
  CalendarToday,
  Videocam,
  BusinessCenter,
  ShoppingBag,
  ArrowForward,
} from "@mui/icons-material";
import { Layers, Sparkles, Clock } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GridNavigation } from "@/components/analysisLibrary/GridNavigation";
import AnalysisSettingsModal from "@/components/common/AnalysisSettingsModal";
import {
  AspectRatio,
  ProcessingMode,
  ModelTierConfig,
} from "@/components/common/ProcessingModeSelector";

interface GeneratedScriptsGridViewProps {
  rows: Array<{
    id: string;
    scriptTitle?: string;
    projectName?: string;
    status: string;
    keyVisuals?: Array<{
      thumbnailPath?: string;
      analyzedScriptId: string;
      analyzedVersionId: string;
    }>;
    hasMultipleVersions?: boolean;
    versionCount?: number;
    currentVersion: number;
    brandName?: string;
    productName?: string;
    targetDuration?: number;
    createdAt?: string;
    analysisGenerated?: boolean;
    analyzedVersions?: Array<{
      analyzedScriptId: string;
      analyzedVersionId: string;
    }>;
  }>;
  loading: boolean;
  analyzeScript: (params: {
    genScriptId: string;
    versionNumber: number;
    processingMode: string;
    aspectRatio: string;
    pauseBefore: string[];
    modelTier: ModelTierConfig;
  }) => void;
  isAnalyzingScript: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  rowsPerPage: number;
  totalRows: number;
  onPageSizeChange: (pageSize: number) => void;
  sortField: string;
  sortOrder: string;
  onSortChange: (field: string, order: string) => void;
  isFavourite: boolean;
  onFavouriteChange: (isFavourite: boolean) => void;
}

export const GeneratedScriptsGridView: React.FC<
  GeneratedScriptsGridViewProps
> = ({
  rows,
  loading,
  analyzeScript,
  isAnalyzingScript,
  currentPage,
  totalPages,
  onPageChange,
  rowsPerPage,
  totalRows,
  onPageSizeChange,
  sortField,
  sortOrder,
  onSortChange,
  isFavourite,
  onFavouriteChange,
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<(typeof rows)[0] | null>(
    null
  );

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        color: "warning" as const,
        icon: <Schedule sx={{ fontSize: 14 }} />,
        label: "Pending",
        bgColor: alpha(theme.palette.warning.main, 0.1),
        textColor: theme.palette.warning.dark,
      },
      processing: {
        color: "info" as const,
        icon: <Sparkles size={14} />,
        label: "Processing",
        bgColor: alpha(theme.palette.info.main, 0.1),
        textColor: theme.palette.info.dark,
      },
      completed: {
        color: "success" as const,
        icon: <CheckCircle sx={{ fontSize: 14 }} />,
        label: "Completed",
        bgColor: alpha(theme.palette.success.main, 0.1),
        textColor: theme.palette.success.dark,
      },
      failed: {
        color: "error" as const,
        icon: <ErrorIcon sx={{ fontSize: 14 }} />,
        label: "Failed",
        bgColor: alpha(theme.palette.error.main, 0.1),
        textColor: theme.palette.error.dark,
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const handleAnalyze = (row: (typeof rows)[0]) => {
    setSelectedScript(row);
    setAnalysisModalOpen(true);
  };

  const handleAnalysisConfirm = (settings: {
    processingMode: ProcessingMode;
    aspectRatio: AspectRatio;
    pauseBefore: string[];
    modelTiers: ModelTierConfig;
  }) => {
    if (selectedScript) {
      analyzeScript({
        genScriptId: selectedScript.id,
        versionNumber: selectedScript.currentVersion,
        processingMode: settings.processingMode,
        aspectRatio: settings.aspectRatio,
        pauseBefore: settings.pauseBefore,
        modelTier: settings.modelTiers,
      });
      setAnalysisModalOpen(false);
      setSelectedScript(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";

      const month = date.toLocaleString("en-US", { month: "short" });
      const day = date.getDate();
      const year = date.getFullYear();

      return `${month} ${day}, ${year}`;
    } catch {
      return "-";
    }
  };

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[...Array(rowsPerPage)].map((_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Box
                sx={{
                  height: "100%",
                  bgcolor: "background.paper",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: `${brand.borderRadius * 0.5}px`,
                  overflow: "hidden",
                }}
              >
                <Skeleton variant="rectangular" height={200} />
                <Box sx={{ p: 2 }}>
                  <Skeleton
                    variant="text"
                    sx={{ fontSize: "1.25rem", mb: 1 }}
                  />
                  <Skeleton variant="text" width="60%" sx={{ mb: 2 }} />
                  <Stack spacing={1}>
                    <Skeleton variant="rounded" width="100%" height={32} />
                    <Skeleton variant="rounded" width="80%" height={24} />
                  </Stack>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 4, opacity: 0.5 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            sx={{ borderRadius: `${brand.borderRadius * 0.25}px` }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {rows.map((row) => {
          const hasKeyVisual = row.keyVisuals && row.keyVisuals.length > 0;
          const latestKeyVisual =
            hasKeyVisual && row.keyVisuals
              ? row.keyVisuals[row.keyVisuals.length - 1]
              : null;
          const thumbnailUrl = latestKeyVisual?.thumbnailPath || null;
          const statusConfig = getStatusConfig(row.status);

          return (
            <Grid key={row.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Box
                component="article"
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  bgcolor: "background.default",
                  border: `1px solid ${theme.palette.primary.light}`,
                  borderRadius: `${brand.borderRadius * 0.25}px`,
                  overflow: "hidden",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? `0 12px 24px ${alpha(theme.palette.primary.dark, 0.3)}`
                        : `0 12px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                    borderColor: theme.palette.primary.dark,
                    "& .card-overlay": {
                      opacity: 1,
                    },
                    "& .view-button": {
                      transform: "translateX(0)",
                      opacity: 1,
                    },
                  },
                }}
              >
                {/* Thumbnail Section */}
                <Box
                  sx={{
                    position: "relative",
                    paddingTop: "56.25%", // 16:9 aspect ratio
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => {
                      if (latestKeyVisual) {
                        router.push(
                          `/story/${latestKeyVisual.analyzedScriptId}/version/${latestKeyVisual.analyzedVersionId}/3`
                        );
                      }
                    }}
                  >
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={row.scriptTitle || "Script thumbnail"}
                        fill
                        sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        style={{
                          objectFit: "cover",
                        }}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgdmlld0JveD0iMCAwIDQwMCAyMjUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMjUiIGZpbGw9IiNlMGUwZTAiLz48L3N2Zz4="
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "background.default",
                        }}
                      >
                        <Videocam
                          sx={{
                            fontSize: 64,
                            color: "primary.main",
                            opacity: 0.6,
                          }}
                        />
                      </Box>
                    )}
                  </Box>

                  {/* Overlay gradient */}
                  <Box
                    className="card-overlay"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "60%",
                      background: `linear-gradient(to top, ${alpha(
                        theme.palette.common.black,
                        0.8
                      )}, transparent)`,
                      opacity: 0,
                      transition: "opacity 0.3s ease",
                    }}
                  />

                  {/* Status Badge */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: `${brand.borderRadius * 0.25}px`,
                      bgcolor: statusConfig.bgColor,
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    {statusConfig.icon}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: statusConfig.textColor,
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      {statusConfig.label}
                    </Typography>
                  </Box>

                  {/* Version Badge */}
                  {row.hasMultipleVersions && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.5,
                        borderRadius: `${brand.borderRadius * 0.25}px`,
                        bgcolor: alpha(theme.palette.background.default, 0.9),
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Layers size={14} />
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        {row.versionCount}
                      </Typography>
                    </Box>
                  )}

                  {/* View button on hover */}
                  {hasKeyVisual && (
                    <Button
                      className="view-button"
                      variant="contained"
                      color="primary"
                      size="small"
                      endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                      onClick={() => {
                        if (latestKeyVisual) {
                          router.push(
                            `/story/${latestKeyVisual.analyzedScriptId}/version/${latestKeyVisual.analyzedVersionId}/3`
                          );
                        }
                      }}
                      sx={{
                        position: "absolute",
                        bottom: 16,
                        right: 16,
                        transform: "translateX(20px)",
                        opacity: 0,
                        transition: "all 0.3s ease",
                        fontFamily: brand.fonts.heading,
                      }}
                    >
                      View
                    </Button>
                  )}
                </Box>

                {/* Content Section */}
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: 2.5,
                  }}
                >
                  {/* Title and Project */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        mb: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        lineHeight: 1.3,
                        fontSize: "1.1rem",
                        fontFamily: brand.fonts.heading,
                      }}
                    >
                      {row.scriptTitle || "Untitled Script"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      {row.projectName}
                    </Typography>
                  </Box>

                  {/* Tags */}
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
                  >
                    <Chip
                      icon={<BusinessCenter sx={{ fontSize: 14 }} />}
                      label={row.brandName}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: "primary.main",
                        fontWeight: 500,
                        fontSize: "0.75rem",
                        fontFamily: brand.fonts.body,
                        "& .MuiChip-icon": {
                          color: "primary.main",
                        },
                      }}
                    />
                    <Chip
                      icon={<ShoppingBag sx={{ fontSize: 14 }} />}
                      label={row.productName}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: "primary.main",
                        fontWeight: 500,
                        fontSize: "0.75rem",
                        fontFamily: brand.fonts.body,
                        "& .MuiChip-icon": {
                          color: "primary.main",
                        },
                      }}
                    />
                  </Stack>

                  {/* Metadata */}
                  <Stack spacing={1} sx={{ mt: "auto" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Clock size={14} color={theme.palette.text.secondary} />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          {row.targetDuration
                            ? `${row.targetDuration}s`
                            : "No duration"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <CalendarToday
                          sx={{
                            fontSize: 14,
                            color: "text.secondary",
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          {formatDate(row.createdAt)}
                        </Typography>
                      </Box>
                    </Box>

                    {row.analysisGenerated && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          p: 1,
                          borderRadius: `${brand.borderRadius * 0.25}px`,
                          bgcolor: alpha(theme.palette.success.main, 0.08),
                        }}
                      >
                        <Assessment
                          sx={{
                            fontSize: 16,
                            color: "success.main",
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: "success.main",
                            fontWeight: 600,
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          {row.analyzedVersions?.length || 0} analysis completed
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  {/* Actions */}
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<Edit sx={{ fontSize: 16 }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/scripts/generated/${row.id}`);
                      }}
                      sx={{
                        flex: 1,
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      Edit
                    </Button>
                    {row.status === "completed" && !row.analysisGenerated ? (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<PlayArrow sx={{ fontSize: 16 }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyze(row);
                        }}
                        disabled={isAnalyzingScript}
                        sx={{
                          flex: 1,
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        Analyze
                      </Button>
                    ) : row.analysisGenerated ? (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<Visibility sx={{ fontSize: 16 }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            row.analyzedVersions &&
                            row.analyzedVersions.length > 0
                          ) {
                            const latestAnalyzed =
                              row.analyzedVersions[
                                row.analyzedVersions.length - 1
                              ];
                            router.push(
                              `/dashboard/story/${latestAnalyzed.analyzedScriptId}/version/${latestAnalyzed.analyzedVersionId}/3`
                            );
                          }
                        }}
                        sx={{
                          flex: 1,
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        View
                      </Button>
                    ) : null}
                    <IconButton
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        color: "text.secondary",
                        "&:hover": {
                          color: "text.primary",
                          bgcolor: alpha(theme.palette.action.active, 0.08),
                        },
                      }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* GridNavigation */}
      <GridNavigation
        isLoading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalRows}
        pageSize={rowsPerPage}
        sortField={sortField}
        sortOrder={sortOrder}
        isFavourite={isFavourite}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onSortChange={onSortChange}
        onFavouriteChange={onFavouriteChange}
      />
      <AnalysisSettingsModal
        open={analysisModalOpen}
        onClose={() => {
          setAnalysisModalOpen(false);
          setSelectedScript(null);
        }}
        onConfirm={handleAnalysisConfirm}
        scriptTitle={selectedScript?.scriptTitle}
        isAnalyzing={isAnalyzingScript}
      />
    </Box>
  );
};

export default GeneratedScriptsGridView;
