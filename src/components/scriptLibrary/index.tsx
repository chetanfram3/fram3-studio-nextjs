// components/GeneratedScriptsPage/index.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Skeleton,
  Alert,
  Snackbar,
  alpha,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  AutoAwesome,
  Add,
  Analytics,
  Refresh,
  ViewList,
  GridView,
} from "@mui/icons-material";
import { Activity, Clock, FileText } from "lucide-react";
import {
  GridCallbackDetails,
  GridFilterModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { GeneratedScriptsDataGrid } from "./GeneratedScriptsDataGrid";
import { GeneratedScriptsGridView } from "./GeneratedScriptsGridView";
import { useGenScriptsDataGrid } from "@/hooks/scripts/useGenScriptList";
import { useRouter } from "next/navigation";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  loading?: boolean;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  loading,
  subtitle,
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Card
      sx={{
        height: "100%",
        bgcolor: "background.default",
        border: `2px solid ${theme.palette.divider}`,
        borderRadius: `${brand.borderRadius * 0.25}px`,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow:
            theme.palette.mode === "dark"
              ? `0 8px 24px ${alpha(theme.palette.common.black, 0.3)}`
              : `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`,
          borderColor: alpha(theme.palette.primary.main, 0.2),
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: `${brand.borderRadius * 0.5}px`,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.1
                )}, ${alpha(theme.palette.primary.light, 0.05)})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
            {trend !== undefined && !loading && (
              <Chip
                size="small"
                label={`${trend > 0 ? "+" : ""}${trend}%`}
                sx={{
                  height: 24,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  fontFamily: brand.fonts.body,
                  bgcolor:
                    trend > 0
                      ? alpha(theme.palette.success.main, 0.1)
                      : alpha(theme.palette.error.main, 0.1),
                  color:
                    trend > 0
                      ? theme.palette.success.main
                      : theme.palette.error.main,
                  "& .MuiChip-label": {
                    px: 1,
                  },
                }}
              />
            )}
          </Box>

          <Box>
            {loading ? (
              <>
                <Skeleton variant="text" width={80} height={36} />
                <Skeleton variant="text" width={120} height={20} />
              </>
            ) : (
              <>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    lineHeight: 1,
                    mb: 0.5,
                    fontFamily: brand.fonts.heading,
                  }}
                >
                  {value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 500,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {title}
                </Typography>
                {subtitle && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.disabled",
                      display: "block",
                      mt: 0.5,
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Constants for localStorage keys
const STORAGE_KEYS = {
  VIEW_MODE: "generatedScripts.viewMode",
  GRID_PAGE_SIZE: "generatedScripts.gridPageSize",
  GRID_PAGE: "generatedScripts.gridPage",
  SORT_FIELD: "generatedScripts.sortField",
  SORT_ORDER: "generatedScripts.sortOrder",
} as const;

const GeneratedScriptsPage: React.FC = () => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  // Load saved preferences from localStorage
  const savedViewMode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as
    | "table"
    | "grid"
    | null;
  const savedGridPageSize = localStorage.getItem(STORAGE_KEYS.GRID_PAGE_SIZE);
  const savedGridPage = localStorage.getItem(STORAGE_KEYS.GRID_PAGE);
  const savedSortField = localStorage.getItem(STORAGE_KEYS.SORT_FIELD);
  const savedSortOrder = localStorage.getItem(STORAGE_KEYS.SORT_ORDER);

  const [viewMode, setViewMode] = useState<"table" | "grid">(
    savedViewMode || "table"
  );
  const [sortField, setSortField] = useState<string>(
    savedSortField || "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<string>(savedSortOrder || "desc");
  const [isFavourite, setIsFavourite] = useState<boolean>(false);
  const [initialPageSize] = useState<number>(() => {
    if (viewMode === "grid" && savedGridPageSize) {
      return parseInt(savedGridPageSize, 10);
    }
    return viewMode === "grid" ? 12 : 10;
  });
  const [initialPage] = useState<number>(() => {
    if (viewMode === "grid" && savedGridPage) {
      return parseInt(savedGridPage, 10);
    }
    return 0;
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const {
    summary,
    isLoadingSummary,
    summaryError,
    refreshAll,
    // Data Grid props
    rows,
    rowCount,
    loading,
    paginationModel,
    onPaginationModelChange,
    sortModel,
    onSortModelChange,
    filterModel,
    onFilterModelChange,
    analyzeScript,
    isAnalyzingScript,
  } = useGenScriptsDataGrid({
    initialPageSize,
    initialPage,
    includeVersions: false,
    includeAnalysisDetails: false,
  });

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  // Save pagination state for grid view
  useEffect(() => {
    if (viewMode === "grid") {
      localStorage.setItem(
        STORAGE_KEYS.GRID_PAGE_SIZE,
        paginationModel.pageSize.toString()
      );
      localStorage.setItem(
        STORAGE_KEYS.GRID_PAGE,
        paginationModel.page.toString()
      );
    }
  }, [viewMode, paginationModel]);

  // Save sort preferences
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SORT_FIELD, sortField);
    localStorage.setItem(STORAGE_KEYS.SORT_ORDER, sortOrder);
  }, [sortField, sortOrder]);

  // Initialize sort model on mount
  useEffect(() => {
    if (savedSortField && savedSortOrder) {
      const fieldMap: Record<string, string> = {
        title: "scriptTitle",
        createdAt: "createdAt",
      };
      const actualField = fieldMap[savedSortField] || savedSortField;

      const details: GridCallbackDetails = {
        api: {} as never,
      };

      const newSortModel: GridSortModel = [
        { field: actualField, sort: savedSortOrder as "asc" | "desc" },
      ];
      onSortModelChange(newSortModel, details);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  const stats = React.useMemo(() => {
    if (!summary) return null;

    const completionRate =
      summary.totalScripts > 0
        ? Math.round(
            (summary.scriptsByStatus.completed / summary.totalScripts) * 100
          )
        : 0;

    const analysisRate =
      summary.totalScripts > 0
        ? Math.round((summary.analyzedScripts / summary.totalScripts) * 100)
        : 0;

    return {
      total: summary.totalScripts,
      analyzed: summary.analyzedScripts,
      analyzedVersions: summary.analyzedVersions || 0,
      totalVersions: summary.totalVersions || 0,
      pending: summary.scriptsByStatus.pending,
      completed: summary.scriptsByStatus.completed,
      failed: summary.scriptsByStatus.failed,
      avgVersions: summary.averageVersionsPerScript,
      completionRate,
      analysisRate,
    };
  }, [summary]);

  // Show notifications for background processes
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { type, message } = event.detail;
      setSnackbar({
        open: true,
        message,
        severity: type === "error" ? "error" : "success",
      });
    };

    window.addEventListener(
      "scriptNotification",
      handleNotification as EventListener
    );
    return () => {
      window.removeEventListener(
        "scriptNotification",
        handleNotification as EventListener
      );
    };
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleGenerateNew = () => {
    router.push("/ai-script-generator");
  };

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: "table" | "grid" | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);

      // When switching to grid mode, try to restore saved page size and page
      if (newMode === "grid") {
        const savedPageSize = localStorage.getItem(STORAGE_KEYS.GRID_PAGE_SIZE);
        const savedPage = localStorage.getItem(STORAGE_KEYS.GRID_PAGE);

        onPaginationModelChange({
          page: savedPage ? parseInt(savedPage, 10) : 0,
          pageSize: savedPageSize ? parseInt(savedPageSize, 10) : 12,
        });
      } else {
        // Reset to default for table view
        onPaginationModelChange({
          page: 0,
          pageSize: 10,
        });
      }
    }
  };

  const handleSortChange = (field: string, order: string) => {
    // Map UI field names to actual data field names if needed
    const fieldMap: Record<string, string> = {
      title: "scriptTitle",
      createdAt: "createdAt",
    };
    const actualField = fieldMap[field] || field;

    setSortField(field);
    setSortOrder(order);

    // Create a mock details object for the callback
    const details: GridCallbackDetails = {
      api: {} as never,
    };

    // Update the sort model for the data grid
    const newSortModel: GridSortModel = [
      { field: actualField, sort: order as "asc" | "desc" },
    ];
    onSortModelChange(newSortModel, details);
  };

  const handleFavouriteChange = (favourite: boolean) => {
    setIsFavourite(favourite);

    // Create a mock details object for the callback
    const details: GridCallbackDetails = {
      api: {} as never,
    };

    // Update filter model to include/exclude favourites
    const newFilterModel: GridFilterModel = {
      items: favourite
        ? [{ field: "isFavourite", operator: "equals", value: true }]
        : [],
    };
    onFilterModelChange(newFilterModel, details);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    onPaginationModelChange({
      page: 0, // Reset to first page when changing page size
      pageSize: newPageSize,
    });
  };

  if (summaryError) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: `${brand.borderRadius * 0.25}px`,
            bgcolor: alpha(theme.palette.error.main, 0.05),
            border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
          }}
        >
          Failed to load page data. Please try refreshing the page.
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pb: 4,
      }}
    >
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 1 }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: `${brand.borderRadius * 0.25}px`,
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AutoAwesome
                    sx={{
                      color: theme.palette.primary.contrastText,
                      fontSize: 28,
                    }}
                  />
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: "text.primary",
                      lineHeight: 1.2,
                      fontFamily: brand.fonts.heading,
                    }}
                  >
                    Generated Scripts
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      mt: 0.5,
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    Manage and analyze your AI-generated scripts
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              {/* View Mode Toggle */}
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.background.default, 0.8),
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: `${brand.borderRadius * 0.25}px`,
                  "& .MuiToggleButton-root": {
                    px: 2,
                    py: 1,
                    border: "none",
                    color: "text.secondary",
                    fontFamily: brand.fonts.body,
                    borderRadius: `${brand.borderRadius * 0.25}px`,
                    "&.Mui-selected": {
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      "&:hover": {
                        bgcolor: theme.palette.primary.dark,
                      },
                    },
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    },
                  },
                }}
              >
                <ToggleButton value="table" aria-label="table view">
                  <ViewList sx={{ mr: 1, fontSize: 20 }} />
                  Table
                </ToggleButton>
                <ToggleButton value="grid" aria-label="grid view">
                  <GridView sx={{ mr: 1, fontSize: 20 }} />
                  Grid
                </ToggleButton>
              </ToggleButtonGroup>

              <Tooltip title="Refresh data">
                <IconButton
                  onClick={refreshAll}
                  sx={{
                    bgcolor: alpha(theme.palette.background.default, 0.8),
                    border: `1px solid ${theme.palette.divider}`,
                    "&:hover": {
                      bgcolor: "background.default",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={handleGenerateNew}
                sx={{
                  fontWeight: 600,
                  px: 3,
                  fontFamily: brand.fonts.heading,
                }}
              >
                Generate New Script
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Scripts"
              value={stats?.total || 0}
              icon={<FileText size={24} color={theme.palette.primary.main} />}
              loading={isLoadingSummary}
              subtitle="All generated scripts"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Scripts with Analysis"
              value={stats?.analyzed || 0}
              icon={
                <Analytics
                  sx={{ fontSize: 24, color: theme.palette.success.main }}
                />
              }
              loading={isLoadingSummary}
              trend={stats?.analysisRate}
              subtitle={`${stats?.analyzedVersions || 0} versions analyzed`}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Versions"
              value={stats?.totalVersions || 0}
              icon={<Activity size={24} color={theme.palette.info.main} />}
              loading={isLoadingSummary}
              subtitle={`Avg ${stats?.avgVersions || "0"} per script`}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="In Progress"
              value={stats?.pending || 0}
              icon={<Clock size={24} color={theme.palette.warning.main} />}
              loading={isLoadingSummary}
              subtitle="Awaiting completion"
            />
          </Grid>
        </Grid>

        {/* Progress Overview */}
        {stats && stats.total > 0 && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={12}>
              <Card
                sx={{
                  bgcolor: "background.default",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: `${brand.borderRadius * 0.25}px`,
                  overflow: "hidden",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          mb: 3,
                          fontFamily: brand.fonts.heading,
                        }}
                      >
                        Progress Overview
                      </Typography>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                fontFamily: brand.fonts.body,
                              }}
                            >
                              Completion Rate
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: "success.main",
                                fontFamily: brand.fonts.body,
                              }}
                            >
                              {stats.completionRate}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={stats.completionRate}
                            sx={{
                              height: 8,
                              borderRadius: `${brand.borderRadius * 0.5}px`,
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              "& .MuiLinearProgress-bar": {
                                borderRadius: `${brand.borderRadius * 0.5}px`,
                                background: `linear-gradient(90deg, ${theme.palette.success.light}, ${theme.palette.success.main})`,
                              },
                            }}
                          />
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                fontFamily: brand.fonts.body,
                              }}
                            >
                              Analysis Coverage
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: "primary.main",
                                fontFamily: brand.fonts.body,
                              }}
                            >
                              {stats.analysisRate}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={stats.analysisRate}
                            sx={{
                              height: 8,
                              borderRadius: `${brand.borderRadius * 0.5}px`,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              "& .MuiLinearProgress-bar": {
                                borderRadius: `${brand.borderRadius * 0.5}px`,
                                background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                              },
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Data Display - Table or Grid */}
        {viewMode === "table" ? (
          <Paper
            sx={{
              bgcolor: "background.default",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${brand.borderRadius * 0.25}px`,
              overflow: "hidden",
            }}
          >
            <GeneratedScriptsDataGrid />
          </Paper>
        ) : (
          <Box>
            <GeneratedScriptsGridView
              rows={rows}
              loading={loading}
              analyzeScript={analyzeScript}
              isAnalyzingScript={isAnalyzingScript}
              currentPage={paginationModel.page + 1} // Convert from 0-based to 1-based
              totalPages={Math.ceil(rowCount / paginationModel.pageSize)}
              onPageChange={(page) => {
                onPaginationModelChange({
                  page: page - 1, // Convert from 1-based to 0-based
                  pageSize: paginationModel.pageSize,
                });
              }}
              rowsPerPage={paginationModel.pageSize}
              totalRows={rowCount}
              onPageSizeChange={handlePageSizeChange}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              isFavourite={isFavourite}
              onFavouriteChange={handleFavouriteChange}
            />
          </Box>
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: "100%",
              borderRadius: `${brand.borderRadius * 0.25}px`,
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default GeneratedScriptsPage;
