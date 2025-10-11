"use client";

import {
  Box,
  Typography,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery,
  Menu,
  Divider,
} from "@mui/material";
import { useState } from "react";
import {
  SortOutlined as SortIcon,
  ArrowUpwardOutlined as AscIcon,
  ArrowDownwardOutlined as DescIcon,
  CalendarTodayOutlined as DateIcon,
  TitleOutlined as TitleIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreIcon,
  FilterListOutlined as FilterIcon,
} from "@mui/icons-material";

interface GridNavigationProps {
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  sortField: string;
  sortOrder: string;
  isFavourite: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (field: string, order: string) => void;
  onFavouriteChange: (isFavourite: boolean) => void;
}

export function GridNavigation({
  isLoading = false,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  sortField,
  sortOrder,
  isFavourite,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onFavouriteChange,
}: GridNavigationProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [pageSizeMenuAnchor, setPageSizeMenuAnchor] =
    useState<null | HTMLElement>(null);

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("-");
    onSortChange(field, order);
    setSortMenuAnchor(null);
  };

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalCount);
  const endItem = Math.min(currentPage * pageSize, totalCount);

  const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortMenuAnchor(null);
  };

  const handlePageSizeMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPageSizeMenuAnchor(event.currentTarget);
  };

  const handlePageSizeMenuClose = () => {
    setPageSizeMenuAnchor(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "stretch" : "center",
        gap: isMobile ? 2 : 0,
        mt: 2,
        p: isMobile ? 1.5 : 2,
        bgcolor: "background.paper",
        borderRadius: 1.5,
        boxShadow: 2,
        opacity: isLoading ? 0.7 : 1,
        pointerEvents: isLoading ? "none" : "auto",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: 3,
        },
      }}
    >
      {/* Top Section: Sorting Controls and Info */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: isMobile ? "space-between" : "flex-start",
          width: isMobile ? "100%" : "auto",
          gap: 2,
        }}
      >
        {/* Mobile: Compact controls */}
        {isMobile ? (
          <>
            <Box sx={{ display: "flex", gap: 1 }}>
              {/* Sort Menu Button */}
              <IconButton
                onClick={handleSortMenuOpen}
                size="small"
                sx={{
                  // ✅ Use primary color (Gold/Bronze)
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                <FilterIcon fontSize="small" />
              </IconButton>

              {/* Page Size Menu Button */}
              <IconButton
                onClick={handlePageSizeMenuOpen}
                size="small"
                sx={{
                  // ✅ Use primary color (Gold/Bronze)
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                <MoreIcon fontSize="small" />
              </IconButton>

              {/* Favourite Toggle */}
              <IconButton
                onClick={() => onFavouriteChange(!isFavourite)}
                size="small"
                sx={{
                  color: isFavourite
                    ? theme.palette.primary.main
                    : "text.secondary",
                  bgcolor: isFavourite
                    ? alpha(theme.palette.primary.main, 0.1)
                    : "transparent",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                {isFavourite ? (
                  <StarIcon fontSize="small" />
                ) : (
                  <StarBorderIcon fontSize="small" />
                )}
              </IconButton>
            </Box>

            <Typography variant="caption" color="text.secondary">
              {startItem}-{endItem} of {totalCount}
            </Typography>
          </>
        ) : (
          <>
            {/* Desktop: Full controls */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Show:
              </Typography>
              <Select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                size="small"
                sx={{
                  minWidth: 80,
                  "& .MuiOutlinedInput-notchedOutline": {
                    // ✅ Use primary color (Gold/Bronze)
                    borderColor: theme.palette.primary.main,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.primary.dark,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                {[4, 8, 12, 16, 20].map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Divider orientation="vertical" flexItem />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Sort by:
              </Typography>

              {/* Sort by Date */}
              <Tooltip
                title={`Sort by Date ${sortField === "createdAt" && sortOrder === "asc" ? "descending" : "ascending"}`}
              >
                <IconButton
                  onClick={() =>
                    handleSortChange(
                      `createdAt-${sortField === "createdAt" && sortOrder === "asc" ? "desc" : "asc"}`
                    )
                  }
                  sx={{
                    borderRadius: 1,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  <DateIcon
                    sx={{
                      fontSize: "1.2rem",
                      // ✅ Use primary color when active (Gold/Bronze)
                      color:
                        sortField === "createdAt"
                          ? theme.palette.primary.main
                          : "inherit",
                    }}
                  />
                  {sortField === "createdAt" &&
                    (sortOrder === "asc" ? (
                      <AscIcon
                        sx={{
                          fontSize: "1rem",
                          ml: 0.5,
                          color: theme.palette.primary.main,
                        }}
                      />
                    ) : (
                      <DescIcon
                        sx={{
                          fontSize: "1rem",
                          ml: 0.5,
                          color: theme.palette.primary.main,
                        }}
                      />
                    ))}
                </IconButton>
              </Tooltip>

              {/* Sort by Title */}
              <Tooltip
                title={`Sort by Title ${sortField === "title" && sortOrder === "asc" ? "descending" : "ascending"}`}
              >
                <IconButton
                  onClick={() =>
                    handleSortChange(
                      `title-${sortField === "title" && sortOrder === "asc" ? "desc" : "asc"}`
                    )
                  }
                  sx={{
                    borderRadius: 1,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  <TitleIcon
                    sx={{
                      fontSize: "1.2rem",
                      // ✅ Use primary color when active (Gold/Bronze)
                      color:
                        sortField === "title"
                          ? theme.palette.primary.main
                          : "inherit",
                    }}
                  />
                  {sortField === "title" &&
                    (sortOrder === "asc" ? (
                      <AscIcon
                        sx={{
                          fontSize: "1rem",
                          ml: 0.5,
                          color: theme.palette.primary.main,
                        }}
                      />
                    ) : (
                      <DescIcon
                        sx={{
                          fontSize: "1rem",
                          ml: 0.5,
                          color: theme.palette.primary.main,
                        }}
                      />
                    ))}
                </IconButton>
              </Tooltip>

              {/* Sort by Favourite */}
              <Tooltip title="Toggle Favourite">
                <IconButton
                  onClick={() => onFavouriteChange(!isFavourite)}
                  sx={{
                    borderRadius: 1,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  {isFavourite ? (
                    <StarIcon
                      sx={{
                        // ✅ Use primary color (Gold/Bronze)
                        color: theme.palette.primary.main,
                        fontSize: "1.2rem",
                        filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
                      }}
                    />
                  ) : (
                    <StarBorderIcon
                      sx={{
                        fontSize: "1.2rem",
                        color: "text.secondary",
                      }}
                    />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </>
        )}
      </Box>

      {isMobile && <Divider sx={{ width: "100%" }} />}

      {/* Bottom Section: Pagination */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: isMobile ? "center" : "flex-end",
          width: isMobile ? "100%" : "auto",
          gap: 2,
          mt: isMobile ? 1 : 0,
        }}
      >
        {!isMobile && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            {startItem}-{endItem} of {totalCount}
          </Typography>
        )}

        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(_, page) => onPageChange(page)}
          // ✅ Use primary color (Gold/Bronze)
          color="primary"
          size={isMobile ? "small" : "medium"}
          showFirstButton={!isMobile}
          showLastButton={!isMobile}
          siblingCount={isMobile ? 0 : 1}
          boundaryCount={isMobile ? 0 : 1}
          disabled={isLoading}
          sx={{
            "& .MuiPaginationItem-root": {
              fontWeight: 500,
              borderRadius: 0.8,
              mx: isMobile ? 0.1 : 0.25,
              fontSize: isMobile ? "0.75rem" : "inherit",
              minWidth: isMobile ? 24 : 32,
              height: isMobile ? 24 : 32,
              transition: "all 0.2s ease",
              "&:hover": {
                // ✅ Use primary color hover (Gold/Bronze)
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.dark,
              },
            },
            "& .Mui-selected": {
              // ✅ Use primary color for selected (Gold/Bronze)
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              fontWeight: 600,
              "&:hover": {
                bgcolor: theme.palette.primary.dark,
              },
            },
            "& .MuiPaginationItem-ellipsis": {
              color: "text.secondary",
            },
          }}
        />
      </Box>

      {/* Mobile Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleSortMenuClose}
        slotProps={{
          paper: {
            elevation: 2,
            sx: {
              mt: 1.5,
              minWidth: 180,
              borderRadius: 1,
              boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
            },
          },
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ px: 2, py: 1, fontWeight: 600, color: "text.secondary" }}
        >
          Sort By
        </Typography>
        <Divider sx={{ mb: 1 }} />

        <MenuItem
          onClick={() =>
            handleSortChange(
              `createdAt-${sortField === "createdAt" && sortOrder === "asc" ? "desc" : "asc"}`
            )
          }
          sx={{
            py: 1.5,
            // ✅ Use primary color when active (Gold/Bronze)
            color:
              sortField === "createdAt"
                ? theme.palette.primary.main
                : "inherit",
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
          }}
        >
          <DateIcon sx={{ mr: 1, fontSize: "1.1rem" }} />
          <Typography variant="body2">Date</Typography>
          {sortField === "createdAt" && (
            <Box sx={{ ml: "auto" }}>
              {sortOrder === "asc" ? (
                <AscIcon sx={{ fontSize: "1rem" }} />
              ) : (
                <DescIcon sx={{ fontSize: "1rem" }} />
              )}
            </Box>
          )}
        </MenuItem>

        <MenuItem
          onClick={() =>
            handleSortChange(
              `title-${sortField === "title" && sortOrder === "asc" ? "desc" : "asc"}`
            )
          }
          sx={{
            py: 1.5,
            // ✅ Use primary color when active (Gold/Bronze)
            color:
              sortField === "title" ? theme.palette.primary.main : "inherit",
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
          }}
        >
          <TitleIcon sx={{ mr: 1, fontSize: "1.1rem" }} />
          <Typography variant="body2">Title</Typography>
          {sortField === "title" && (
            <Box sx={{ ml: "auto" }}>
              {sortOrder === "asc" ? (
                <AscIcon sx={{ fontSize: "1rem" }} />
              ) : (
                <DescIcon sx={{ fontSize: "1rem" }} />
              )}
            </Box>
          )}
        </MenuItem>
      </Menu>

      {/* Mobile Page Size Menu */}
      <Menu
        anchorEl={pageSizeMenuAnchor}
        open={Boolean(pageSizeMenuAnchor)}
        onClose={handlePageSizeMenuClose}
        slotProps={{
          paper: {
            elevation: 2,
            sx: {
              mt: 1.5,
              minWidth: 120,
              borderRadius: 1,
              boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
            },
          },
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ px: 2, py: 1, fontWeight: 600, color: "text.secondary" }}
        >
          Items Per Page
        </Typography>
        <Divider sx={{ mb: 1 }} />

        {[4, 8, 12, 16, 20].map((size) => (
          <MenuItem
            key={size}
            onClick={() => {
              onPageSizeChange(size);
              handlePageSizeMenuClose();
            }}
            selected={pageSize === size}
            sx={{
              py: 1.5,
              // ✅ Use primary color when selected (Gold/Bronze)
              color: pageSize === size ? theme.palette.primary.main : "inherit",
              fontWeight: pageSize === size ? 600 : 400,
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            <Typography variant="body2">{size} items</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
