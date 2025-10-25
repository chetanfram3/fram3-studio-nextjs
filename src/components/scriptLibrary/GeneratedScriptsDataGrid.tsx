// components/GeneratedScriptsDataGrid.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  Typography,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  Visibility,
  PlayArrow,
  Edit,
  Assessment,
  AutoAwesome,
  Schedule,
  CheckCircle,
  Error as ErrorIcon,
  MoreVert,
} from "@mui/icons-material";
import { Layers } from "lucide-react";
import Image from "next/image";
import { useGenScriptsDataGrid } from "@/hooks/scripts/useGenScriptList";
import { VideoGenerationWizard } from "@/components/common/videoGenerationWizard";
import { useRouter } from "next/navigation";

// Constants for localStorage keys - Table specific
const TABLE_STORAGE_KEYS = {
  PAGE_SIZE: "generatedScripts.table.pageSize",
  PAGE: "generatedScripts.table.page",
  SORT_FIELD: "generatedScripts.table.sortField",
  SORT_ORDER: "generatedScripts.table.sortOrder",
} as const;

interface GeneratedScriptsDataGridProps {
  initialFilter?: {
    items: Array<{
      field: string;
      operator: string;
      value: unknown;
    }>;
  };
}

export const GeneratedScriptsDataGrid: React.FC<
  GeneratedScriptsDataGridProps
> = ({ initialFilter }) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  // Load saved preferences from localStorage for table view
  const savedTablePageSize = localStorage.getItem(TABLE_STORAGE_KEYS.PAGE_SIZE);
  const savedTablePage = localStorage.getItem(TABLE_STORAGE_KEYS.PAGE);
  const savedTableSortField = localStorage.getItem(
    TABLE_STORAGE_KEYS.SORT_FIELD
  );
  const savedTableSortOrder = localStorage.getItem(
    TABLE_STORAGE_KEYS.SORT_ORDER
  );

  // Initialize with saved values
  const [initialPageSize] = useState<number>(() => {
    return savedTablePageSize ? parseInt(savedTablePageSize, 10) : 10;
  });

  const [initialPage] = useState<number>(() => {
    return savedTablePage ? parseInt(savedTablePage, 10) : 0;
  });
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<{
    id: string;
    currentVersion: number;
    scriptTitle?: string;
  } | null>(null);

  const {
    // Data Grid props
    rows,
    rowCount,
    loading,
    error,
    paginationMode,
    paginationModel,
    onPaginationModelChange,
    pageSizeOptions,
    sortingMode,
    sortModel,
    onSortModelChange,
    filterMode,
    filterModel,
    onFilterModelChange,
    disableRowSelectionOnClick,
    autoHeight,
    density,
    analyzeScript,
    isAnalyzingScript,
  } = useGenScriptsDataGrid({
    initialPageSize,
    initialPage,
    initialSortField: savedTableSortField || "createdAt",
    initialSortOrder: (savedTableSortOrder as "asc" | "desc") || "desc",
    includeVersions: false,
    includeAnalysisDetails: false,
  });

  // Save pagination state for table view
  useEffect(() => {
    localStorage.setItem(
      TABLE_STORAGE_KEYS.PAGE_SIZE,
      paginationModel.pageSize.toString()
    );
    localStorage.setItem(
      TABLE_STORAGE_KEYS.PAGE,
      paginationModel.page.toString()
    );
  }, [paginationModel]);

  // Save sort state for table view
  useEffect(() => {
    if (sortModel && sortModel.length > 0) {
      localStorage.setItem(TABLE_STORAGE_KEYS.SORT_FIELD, sortModel[0].field);
      localStorage.setItem(
        TABLE_STORAGE_KEYS.SORT_ORDER,
        sortModel[0].sort || "desc"
      );
    }
  }, [sortModel]);

  // Apply initial filter when component mounts
  useEffect(() => {
    if (initialFilter && initialFilter.items.length > 0) {
      // Create a minimal api object that satisfies the type requirement
      const mockDetails = {
        api: {} as never,
      };

      onFilterModelChange(
        {
          items: initialFilter.items,
        },
        mockDetails
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount

  // Column definitions
  const columns: GridColDef[] = [
    {
      field: "scriptTitle",
      headerName: "Script Title",
      flex: 2,
      minWidth: 280,
      renderCell: (params: GridRenderCellParams) => {
        const hasKeyVisual =
          params.row.keyVisuals && params.row.keyVisuals.length > 0;
        const latestKeyVisual = hasKeyVisual
          ? params.row.keyVisuals[params.row.keyVisuals.length - 1]
          : null;
        const thumbnailUrl = latestKeyVisual?.thumbnailPath || null;

        const handleThumbnailClick = () => {
          if (latestKeyVisual) {
            router.push(
              `/story/${latestKeyVisual.analyzedScriptId}/version/${latestKeyVisual.analyzedVersionId}/3`
            );
          }
        };

        return (
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ py: 1, width: "100%" }}
          >
            <Tooltip
              title={
                thumbnailUrl ? (
                  <Box
                    sx={{
                      position: "relative",
                      width: 320,
                      height: 180,
                      bgcolor: "black",
                      borderRadius: `${brand.borderRadius * 0.25}px`,
                      overflow: "hidden",
                      boxShadow: theme.shadows[20],
                    }}
                  >
                    <Image
                      src={thumbnailUrl}
                      alt={params.value || "Script thumbnail"}
                      fill
                      sizes="320px"
                      style={{
                        objectFit: "contain",
                      }}
                      priority={false}
                    />
                  </Box>
                ) : (
                  ""
                )
              }
              placement="right"
              enterDelay={300}
              leaveDelay={100}
              disableInteractive={false}
              PopperProps={{
                sx: {
                  "& .MuiTooltip-tooltip": {
                    bgcolor: "transparent",
                    maxWidth: "none",
                    padding: 0,
                  },
                },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: 64,
                  height: 36,
                  flexShrink: 0,
                  cursor: hasKeyVisual ? "pointer" : "default",
                  "&:hover": hasKeyVisual
                    ? {
                        "& .thumbnail-container": {
                          transform: "scale(1.05)",
                          boxShadow: theme.shadows[4],
                        },
                      }
                    : {},
                }}
                onClick={hasKeyVisual ? handleThumbnailClick : undefined}
              >
                <Box
                  className="thumbnail-container"
                  sx={{
                    width: 64,
                    height: 36,
                    borderRadius: `${brand.borderRadius * 0.125}px`,
                    overflow: "hidden",
                    position: "relative",
                    transition: "all 0.2s ease",
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  {thumbnailUrl ? (
                    <Image
                      src={thumbnailUrl}
                      alt={params.value || "Script thumbnail"}
                      fill
                      sizes="64px"
                      style={{
                        objectFit: "cover",
                      }}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCA2NCAzNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iMzYiIGZpbGw9IiNlMGUwZTAiLz48L3N2Zz4="
                    />
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ fontSize: "0.6rem" }}
                      >
                        No Image
                      </Typography>
                    </Box>
                  )}
                </Box>
                {params.row.keyVisuals && params.row.keyVisuals.length > 1 && (
                  <Chip
                    label={params.row.keyVisuals.length}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      height: 20,
                      minWidth: 20,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      "& .MuiChip-label": {
                        px: 0.5,
                      },
                    }}
                  />
                )}
              </Box>
            </Tooltip>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: brand.fonts.body,
                }}
              >
                {params.value || "Untitled Script"}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  display: "block",
                  fontFamily: brand.fonts.body,
                }}
              >
                {params.row.projectName}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      field: "brandName",
      headerName: "Brand",
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, fontFamily: brand.fonts.body }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "productName",
      headerName: "Product",
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, fontFamily: brand.fonts.body }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const statusConfig = {
          pending: {
            color: "warning" as const,
            icon: <Schedule sx={{ fontSize: 16 }} />,
            label: "Pending",
          },
          processing: {
            color: "info" as const,
            icon: <AutoAwesome sx={{ fontSize: 16 }} />,
            label: "Processing",
          },
          completed: {
            color: "success" as const,
            icon: <CheckCircle sx={{ fontSize: 16 }} />,
            label: "Completed",
          },
          failed: {
            color: "error" as const,
            icon: <ErrorIcon sx={{ fontSize: 16 }} />,
            label: "Failed",
          },
        };

        const config = statusConfig[params.value as keyof typeof statusConfig];

        return (
          <Chip
            label={config?.label || params.value}
            color={config?.color || "default"}
            size="small"
            icon={config?.icon}
            sx={{
              fontWeight: 600,
              fontFamily: brand.fonts.body,
              "& .MuiChip-icon": {
                ml: 0.5,
              },
            }}
          />
        );
      },
    },
    {
      field: "versionCount",
      headerName: "Versions",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`v${params.row.currentVersion}`}
              size="small"
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                fontWeight: 600,
                fontSize: "0.75rem",
                fontFamily: brand.fonts.body,
              }}
            />
            {params.row.hasMultipleVersions && (
              <Tooltip title={`${params.value} total versions`}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Layers size={16} color={theme.palette.text.secondary} />
                </Box>
              </Tooltip>
            )}
          </Stack>
        </Box>
      ),
    },
    {
      field: "analysisGenerated",
      headerName: "Analysis",
      width: 140,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) {
          return (
            <Chip
              label="Not Analyzed"
              size="small"
              variant="outlined"
              sx={{
                borderColor: alpha(theme.palette.text.secondary, 0.3),
                color: "text.secondary",
                fontFamily: brand.fonts.body,
              }}
            />
          );
        }

        const analyzedCount = params.row.analyzedVersions?.length || 0;
        return (
          <Tooltip title={`${analyzedCount} version(s) analyzed`}>
            <Chip
              label={`${analyzedCount} Analyzed`}
              color="primary"
              size="small"
              icon={<Assessment sx={{ fontSize: 16 }} />}
              sx={{
                fontWeight: 600,
                fontFamily: brand.fonts.body,
                "& .MuiChip-icon": {
                  ml: 0.5,
                },
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      field: "targetDuration",
      headerName: "Duration",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => {
        const value = params.row?.targetDuration;
        return (
          <Chip
            label={value ? `${value}s` : "-"}
            size="small"
            variant="outlined"
            sx={{
              borderColor: theme.palette.divider,
              fontSize: "0.75rem",
              fontFamily: brand.fonts.body,
            }}
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 160,
      renderCell: (params: GridRenderCellParams) => {
        const value = params.row?.createdAt;
        if (!value)
          return (
            <Typography variant="body2" sx={{ fontFamily: brand.fonts.body }}>
              -
            </Typography>
          );

        try {
          // Parse the ISO string to create a Date object
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return (
              <Typography variant="body2" sx={{ fontFamily: brand.fonts.body }}>
                -
              </Typography>
            );
          }

          // Get local time components
          const year = date.getFullYear();
          const month = date.toLocaleString("en-US", { month: "short" });
          const day = date.getDate();
          const hours = date.getHours().toString().padStart(2, "0");
          const minutes = date.getMinutes().toString().padStart(2, "0");

          const formattedDate = `${month} ${day}, ${year}`;
          const formattedTime = `${hours}:${minutes}`;

          return (
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, fontFamily: brand.fonts.body }}
              >
                {formattedDate}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontFamily: brand.fonts.body }}
              >
                {formattedTime}
              </Typography>
            </Box>
          );
        } catch (error) {
          console.error("Date formatting error:", error);
          return (
            <Typography variant="body2" sx={{ fontFamily: brand.fonts.body }}>
              -
            </Typography>
          );
        }
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          {params.row.analysisGenerated &&
            params.row.analyzedVersions?.length > 0 && (
              <Tooltip title="View Analyzed Script">
                <IconButton
                  size="small"
                  onClick={() => {
                    const latestAnalyzed =
                      params.row.analyzedVersions[
                        params.row.analyzedVersions.length - 1
                      ];
                    router.push(
                      `/story/${latestAnalyzed.analyzedScriptId}/version/${latestAnalyzed.analyzedVersionId}/3`
                    );
                  }}
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "primary.main",
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          <Tooltip title="Edit Script">
            <IconButton
              size="small"
              onClick={() =>
                router.push(`/ai-script-editor/generated/${params.row.id}`)
              }
              sx={{
                color: "text.secondary",
                "&:hover": {
                  color: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === "completed" &&
            !params.row.analysisGenerated && (
              <Tooltip title="Run Analysis">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleAnalyze(params.row)}
                  disabled={isAnalyzingScript}
                  sx={{
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <PlayArrow fontSize="small" sx={{ color: "primary.dark" }} />
                </IconButton>
              </Tooltip>
            )}
          <Tooltip title="More Options">
            <IconButton
              size="small"
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
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // Handlers
  const handleAnalyze = useCallback((row: unknown) => {
    setSelectedScript(
      row as { id: string; currentVersion: number; scriptTitle?: string }
    );
    setWizardOpen(true); // Changed from setAnalysisModalOpen
  }, []);

  const handleWizardComplete = useCallback(() => {
    setWizardOpen(false);
    setSelectedScript(null);
  }, []);

  const handleWizardCancel = useCallback(() => {
    setWizardOpen(false);
    setSelectedScript(null);
  }, []);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: `${brand.borderRadius * 0.25}px`,
            bgcolor: alpha(theme.palette.error.main, 0.05),
            border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
          }}
        >
          {error}
        </Alert>
      )}

      {/* Data Grid */}
      <Box
        sx={{
          height: 800,
          "& .MuiDataGrid-root": {
            border: "none",
            borderRadius: `${brand.borderRadius * 0.25}px`,
          },
          "& .MuiDataGrid-main": {
            borderRadius: `${brand.borderRadius * 0.25}px`,
          },
          "& .MuiDataGrid-columnHeaders": {
            bgcolor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            borderTopLeftRadius: `${brand.borderRadius * 0.25}px`,
            borderTopRightRadius: `${brand.borderRadius * 0.25}px`,
            overflow: "hidden",
            "& .MuiDataGrid-columnHeader": {
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              "&:focus": {
                outline: "none",
              },
              "&:focus-within": {
                outline: "none",
              },
            },
            "& .MuiDataGrid-columnHeader:first-of-type": {
              borderTopLeftRadius: `${brand.borderRadius * 0.25}px`,
            },
            "& .MuiDataGrid-columnHeader:last-of-type": {
              borderTopRightRadius: `${brand.borderRadius * 0.25}px`,
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 700,
              color: theme.palette.primary.contrastText,
              fontSize: "0.875rem",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              fontFamily: brand.fonts.heading,
            },
            "& .MuiDataGrid-iconButtonContainer": {
              color: theme.palette.primary.contrastText,
            },
            "& .MuiDataGrid-sortIcon": {
              color: theme.palette.primary.contrastText,
              opacity: 0.7,
            },
            "& .MuiDataGrid-menuIcon": {
              color: theme.palette.primary.contrastText,
            },
          },
          "& .MuiDataGrid-cell": {
            borderBottom: `1px solid ${theme.palette.divider}`,
            "&:focus": {
              outline: "none",
            },
          },
          "& .MuiDataGrid-row": {
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              cursor: "pointer",
            },
            "&.Mui-selected": {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
              },
            },
            "&:nth-of-type(even)": {
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
            },
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            "& .MuiTablePagination-root": {
              color: "text.primary",
              "& .MuiTablePagination-selectLabel": {
                fontWeight: 500,
                fontFamily: brand.fonts.body,
              },
              "& .MuiTablePagination-displayedRows": {
                fontWeight: 500,
                fontFamily: brand.fonts.body,
              },
            },
            "& .MuiTablePagination-actions": {
              "& .MuiIconButton-root": {
                color: "primary.main",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
                "&.Mui-disabled": {
                  color: alpha(theme.palette.text.secondary, 0.3),
                },
              },
            },
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: "background.default",
          },
          "& .MuiDataGrid-overlay": {
            backgroundColor: alpha(theme.palette.background.default, 0.9),
            backdropFilter: "blur(4px)",
          },
          // Loading overlay
          "& .MuiCircularProgress-root": {
            color: "primary.main",
          },
          // Scrollbar styling
          "& .MuiDataGrid-virtualScroller::-webkit-scrollbar": {
            width: 8,
            height: 8,
          },
          "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track": {
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: `${brand.borderRadius * 0.25}px`,
          },
          "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb": {
            bgcolor: alpha(theme.palette.primary.main, 0.3),
            borderRadius: `${brand.borderRadius * 0.25}px`,
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.5),
            },
          },
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          // Pagination
          paginationMode={paginationMode}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          pageSizeOptions={pageSizeOptions}
          // Sorting
          sortingMode={sortingMode}
          sortModel={sortModel}
          onSortModelChange={onSortModelChange}
          // Filtering
          filterMode={filterMode}
          filterModel={filterModel}
          onFilterModelChange={onFilterModelChange}
          // Other props
          disableRowSelectionOnClick={disableRowSelectionOnClick}
          autoHeight={autoHeight}
          density={density}
          // Custom slots
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
        />
      </Box>

      {selectedScript && (
        <VideoGenerationWizard
          open={wizardOpen}
          mode="versioned"
          scriptId={selectedScript.id}
          versionId={selectedScript.currentVersion.toString()}
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
          redirectOnSuccess={true}
        />
      )}
    </Box>
  );
};

export default GeneratedScriptsDataGrid;
