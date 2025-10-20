// src/components/standalone/StandaloneImagesPage.tsx
"use client";

import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  InputAdornment,
  Chip,
  Paper,
  Alert,
  Snackbar,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { Search, FilterList, Add } from "@mui/icons-material";
import { useStandaloneImages } from "@/hooks/images/useStandaloneImages";
import StandaloneImagesGridView from "./StandaloneImagesGridView";
import type {
  ImageCategory,
  ListStandaloneImagesParams,
} from "@/types/image/types";
import { useRouter } from "next/navigation";

const IMAGE_CATEGORIES: ImageCategory[] = [
  "character",
  "environment",
  "prop",
  "concept",
  "background",
  "vehicle",
  "effect",
  "ui",
  "weapon",
  "costume",
  "creature",
  "architecture",
  "other",
];

export const StandaloneImagesPage: React.FC = () => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  // Local filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory | "">(
    ""
  );
  const [selectedStatus, setSelectedStatus] = useState<
    "Initialized" | "Completed" | ""
  >("");
  const [hasImageFilter, setHasImageFilter] = useState<boolean | "">("");
  const [sortField, setSortField] = useState<
    "createdAt" | "lastModifiedAt" | "title"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isFavourite, setIsFavourite] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  // Build query params
  const queryParams: ListStandaloneImagesParams = {
    page,
    limit: pageSize,
    sortField,
    sortOrder,
    ...(selectedCategory && { imageCategory: selectedCategory }),
    ...(selectedStatus && { status: selectedStatus }),
    ...(hasImageFilter !== "" && { hasImage: hasImageFilter }),
  };

  // Fetch images with TanStack Query
  const { data, isLoading, error, refetch } = useStandaloneImages(queryParams);

  // Extract data from query response
  const assets = data?.data.assets || [];
  const pagination = data?.data.pagination || null;
  const statistics = data?.data.statistics || null;

  // Handle filter changes
  const handleCategoryChange = (category: ImageCategory | "") => {
    setSelectedCategory(category);
    setPage(1); // Reset to first page
  };

  const handleStatusChange = (status: "Initialized" | "Completed" | "") => {
    setSelectedStatus(status);
    setPage(1);
  };

  const handleHasImageChange = (hasImage: boolean | "") => {
    setHasImageFilter(hasImage);
    setPage(1);
  };

  const handleSortChange = (field: string, order: string) => {
    setSortField(field as "createdAt" | "lastModifiedAt" | "title");
    setSortOrder(order as "asc" | "desc");
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleAssetUpdated = () => {
    setSnackbar({
      open: true,
      message: "Asset updated successfully!",
      severity: "success",
    });
    refetch();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedStatus("");
    setHasImageFilter("");
    setSearchQuery("");
    setPage(1);
  };

  const activeFilterCount = [
    selectedCategory,
    selectedStatus,
    hasImageFilter !== "",
  ].filter(Boolean).length;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Stack spacing={3} sx={{ mb: 4 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: brand.fonts.heading,
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                Standalone Images
              </Typography>
              {statistics && (
                <Typography variant="body2" color="text.secondary">
                  {statistics.totalAssets} total assets •{" "}
                  {statistics.assetsWithImages} with images
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              {activeFilterCount > 0 && (
                <Chip
                  label={`${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active`}
                  onDelete={clearFilters}
                  color="primary"
                  variant="outlined"
                />
              )}

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => router.push("/ai/image-editor")}
                sx={{
                  fontFamily: brand.fonts.body,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                }}
              >
                Add Image Collection
              </Button>
            </Stack>
          </Stack>

          {/* Filters */}
          <Paper
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${brand.borderRadius * 0.25}px`,
            }}
          >
            <Stack spacing={2}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <FilterList fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Filters
                </Typography>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                flexWrap="wrap"
              >
                {/* Search */}
                <TextField
                  size="small"
                  placeholder="Search by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ minWidth: 250 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Category Filter */}
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) =>
                      handleCategoryChange(e.target.value as ImageCategory | "")
                    }
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {IMAGE_CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Status Filter */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    onChange={(e) =>
                      handleStatusChange(
                        e.target.value as "Initialized" | "Completed" | ""
                      )
                    }
                    label="Status"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="Initialized">Initialized</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </Select>
                </FormControl>

                {/* Has Image Filter */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Has Image</InputLabel>
                  <Select
                    value={
                      hasImageFilter === "" ? "" : hasImageFilter.toString()
                    }
                    onChange={(e) =>
                      handleHasImageChange(
                        e.target.value === "" ? "" : e.target.value === "true"
                      )
                    }
                    label="Has Image"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">With Images</MenuItem>
                    <MenuItem value="false">Without Images</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </Paper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => refetch()}>
              {error.message}
            </Alert>
          )}
        </Stack>

        {/* Grid View */}
        <StandaloneImagesGridView
          assets={assets}
          loading={isLoading}
          currentPage={pagination?.currentPage || 1}
          totalPages={pagination?.totalPages || 1}
          onPageChange={handlePageChange}
          rowsPerPage={pagination?.pageSize || 20}
          totalRows={pagination?.totalCount || 0}
          onPageSizeChange={handlePageSizeChange}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          isFavourite={isFavourite}
          onFavouriteChange={setIsFavourite}
          onAssetUpdated={handleAssetUpdated}
        />

        {/* Snackbar */}
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

export default StandaloneImagesPage;
