// src/components/standalone/StandaloneImagesGridView.tsx
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
  TextField,
  Button,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  Edit,
  Save,
  Close,
  Image as ImageIcon,
  Category,
  LocalOffer,
  Folder,
} from "@mui/icons-material";
import { Layers } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GridNavigation } from "@/components/analysisLibrary/GridNavigation";
import type {
  StandaloneImageAsset,
  UpdateStandaloneMetadataRequest,
  ImageCategory,
} from "@/types/image/types";
import { useUpdateStandaloneMetadata } from "@/hooks/images/useUpdateStandaloneMetadata";

interface StandaloneImagesGridViewProps {
  assets: StandaloneImageAsset[];
  loading: boolean;
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
  onAssetUpdated?: () => void;
}

interface EditingAsset {
  assetId: string;
  title: string;
  description: string;
  tags: string[];
  projectName: string;
}

export const StandaloneImagesGridView: React.FC<
  StandaloneImagesGridViewProps
> = ({
  assets,
  loading,
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
  onAssetUpdated,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const brand = getCurrentBrand();
  const { mutate: updateMetadata, isPending: updating } =
    useUpdateStandaloneMetadata({
      onSuccess: () => {
        onAssetUpdated?.();
      },
    });

  const [editingAsset, setEditingAsset] = useState<EditingAsset | null>(null);

  const handleEditClick = (asset: StandaloneImageAsset) => {
    setEditingAsset({
      assetId: asset.assetId,
      title: asset.title,
      description: asset.description || "",
      tags: asset.tags,
      projectName: asset.projectName || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingAsset(null);
  };

  const handleSaveEdit = async () => {
    if (!editingAsset) return;

    const updates: UpdateStandaloneMetadataRequest = {
      assetId: editingAsset.assetId,
      title: editingAsset.title,
      description: editingAsset.description || null,
      tags: editingAsset.tags,
      projectName: editingAsset.projectName || null,
    };

    updateMetadata(updates, {
      onSuccess: () => {
        setEditingAsset(null);
      },
    });
  };

  const handleAssetClick = (asset: StandaloneImageAsset) => {
    // Navigate to image detail view
    router.push(`/standalone/${asset.assetId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "success";
      case "Initialized":
        return "warning";
      default:
        return "default";
    }
  };

  const getCategoryIcon = (category: string | null) => {
    if (!category) return <Category fontSize="small" />;

    const iconMap: Record<string, React.ReactNode> = {
      character: <Category fontSize="small" />,
      environment: <Layers size={16} />,
      prop: <ImageIcon fontSize="small" />,
      concept: <ImageIcon fontSize="small" />,
    };

    return iconMap[category] || <Category fontSize="small" />;
  };

  // Render loading skeletons
  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[...Array(rowsPerPage)].map((_, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
              <Skeleton
                variant="rectangular"
                height={320}
                sx={{
                  borderRadius: `${brand.borderRadius * 0.25}px`,
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {assets.map((asset) => {
          const isEditing = editingAsset?.assetId === asset.assetId;

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={asset.assetId}>
              <Box
                onClick={() => !isEditing && handleAssetClick(asset)}
                sx={{
                  height: "100%",
                  borderRadius: `${brand.borderRadius * 0.25}px`,
                  overflow: "hidden",
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: "background.paper",
                  cursor: isEditing ? "default" : "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": !isEditing
                    ? {
                        transform: "translateY(-4px)",
                        boxShadow: `0 8px 24px ${alpha(
                          theme.palette.primary.main,
                          0.12
                        )}`,
                        borderColor: theme.palette.primary.main,
                      }
                    : {},
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Image Preview */}
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    paddingTop: "75%", // 4:3 aspect ratio
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    overflow: "hidden",
                  }}
                >
                  {asset.hasImage && asset.thumbnailPath ? (
                    <Image
                      src={asset.thumbnailPath}
                      alt={asset.title || "Standalone image asset"}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={false}
                    />
                  ) : (
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
                    >
                      <ImageIcon
                        sx={{
                          fontSize: 64,
                          color: alpha(theme.palette.text.secondary, 0.3),
                        }}
                      />
                    </Box>
                  )}

                  {/* Status Badge */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                    }}
                  >
                    <Chip
                      label={asset.status}
                      color={getStatusColor(asset.status)}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        height: 24,
                      }}
                    />
                  </Box>

                  {/* Version Badge */}
                  {asset.totalVersions > 1 && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                      }}
                    >
                      <Chip
                        icon={<Layers size={14} />}
                        label={`v${asset.currentVersion}/${asset.totalVersions}`}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.background.paper, 0.95),
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          height: 24,
                        }}
                      />
                    </Box>
                  )}
                </Box>

                {/* Content */}
                <Box
                  sx={{
                    p: 2,
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {isEditing ? (
                    // Edit Mode
                    <Stack spacing={1.5}>
                      <TextField
                        size="small"
                        label="Title"
                        value={editingAsset.title}
                        onChange={(e) =>
                          setEditingAsset({
                            ...editingAsset,
                            title: e.target.value,
                          })
                        }
                        fullWidth
                        inputProps={{ maxLength: 200 }}
                      />
                      <TextField
                        size="small"
                        label="Description"
                        value={editingAsset.description}
                        onChange={(e) =>
                          setEditingAsset({
                            ...editingAsset,
                            description: e.target.value,
                          })
                        }
                        fullWidth
                        multiline
                        rows={2}
                        inputProps={{ maxLength: 2000 }}
                      />
                      <TextField
                        size="small"
                        label="Tags (comma-separated)"
                        value={editingAsset.tags.join(", ")}
                        onChange={(e) =>
                          setEditingAsset({
                            ...editingAsset,
                            tags: e.target.value
                              .split(",")
                              .map((t) => t.trim())
                              .filter((t) => t),
                          })
                        }
                        fullWidth
                      />
                      <TextField
                        size="small"
                        label="Project Name"
                        value={editingAsset.projectName}
                        onChange={(e) =>
                          setEditingAsset({
                            ...editingAsset,
                            projectName: e.target.value,
                          })
                        }
                        fullWidth
                        inputProps={{ maxLength: 100 }}
                      />
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSaveEdit}
                          disabled={updating}
                          fullWidth
                        >
                          Save
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Close />}
                          onClick={handleCancelEdit}
                          disabled={updating}
                          fullWidth
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Stack>
                  ) : (
                    // View Mode
                    <>
                      <Stack spacing={1} sx={{ mb: 2, flexGrow: 1 }}>
                        {/* Title */}
                        <Tooltip title={asset.title}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: brand.fonts.heading,
                              fontWeight: 600,
                              fontSize: "1rem",
                              lineHeight: 1.3,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {asset.title}
                          </Typography>
                        </Tooltip>

                        {/* Description */}
                        {asset.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontSize: "0.875rem",
                            }}
                          >
                            {asset.description}
                          </Typography>
                        )}

                        {/* Category */}
                        {asset.imageCategory && (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            {getCategoryIcon(asset.imageCategory)}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ textTransform: "capitalize" }}
                            >
                              {asset.imageCategory}
                            </Typography>
                          </Stack>
                        )}

                        {/* Project Name */}
                        {asset.projectName && (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <Folder fontSize="small" />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {asset.projectName}
                            </Typography>
                          </Stack>
                        )}

                        {/* Tags */}
                        {asset.tags.length > 0 && (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            flexWrap="wrap"
                            gap={0.5}
                          >
                            {asset.tags.slice(0, 3).map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                size="small"
                                icon={
                                  <LocalOffer sx={{ fontSize: "0.75rem" }} />
                                }
                                sx={{
                                  height: 20,
                                  fontSize: "0.7rem",
                                  "& .MuiChip-icon": {
                                    fontSize: "0.75rem",
                                  },
                                }}
                              />
                            ))}
                            {asset.tags.length > 3 && (
                              <Chip
                                label={`+${asset.tags.length - 3}`}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.7rem",
                                }}
                              />
                            )}
                          </Stack>
                        )}
                      </Stack>

                      {/* Action Buttons */}
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(asset);
                          }}
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
                      </Stack>
                    </>
                  )}
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Grid Navigation */}
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
    </Box>
  );
};

export default StandaloneImagesGridView;
