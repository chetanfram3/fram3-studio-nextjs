"use client";

import React, { useState, useMemo, useCallback, Suspense } from "react";
import {
  Box,
  Typography,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
  InputAdornment,
  TableSortLabel,
  Pagination,
  alpha,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Skeleton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Receipt,
  Visibility,
  Search,
  ArticleOutlined as FileText,
  Download,
  Cancel,
  CreditCard,
  Smartphone,
  AccountBalance,
  Wallet,
  CalendarMonth,
} from "@mui/icons-material";
import { ModernInvoicePreview } from "./ModernInvoicePreview";
import { getCurrentBrand } from "@/config/brandConfig";
import logger from "@/utils/logger";

// Import the invoice hooks and utilities
import {
  useInvoices,
  useCancelInvoice,
  useDownloadInvoice,
  useInvoiceFilters,
} from "@/hooks/useInvoices";
import { useInvoicePreview } from "@/hooks/useInvoicePreview";
import {
  formatCurrency,
  formatDate,
  FetchInvoicesParams,
  InvoiceListItem,
} from "@/services/invoiceService";

interface CustomInvoiceTableProps {
  onRefresh?: () => void;
  defaultStatus?: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  defaultLimit?: number;
  loading?: boolean;
}

type SortDirection = "asc" | "desc";
type SortField = keyof InvoiceListItem;

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
}

/**
 * CustomInvoiceTable - Displays a table of invoices with filtering, sorting, and actions
 * Optimized for React 19 with automatic memoization and Next.js 15 best practices
 */
export function CustomInvoiceTable({
  onRefresh,
  defaultStatus,
  defaultLimit = 25,
  loading: externalLoading = false,
}: CustomInvoiceTableProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // State management
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<
    "pending" | "paid" | "failed" | "cancelled" | "refunded" | ""
  >(defaultStatus || "");
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  });

  // Filter utilities
  const { statusOptions, buildParams } = useInvoiceFilters();

  // Build query parameters - memoized for performance
  const queryParams: FetchInvoicesParams = useMemo(() => {
    // Type-safe status - empty string becomes undefined
    const validStatus = status === "" ? undefined : status;

    return buildParams({
      status: validStatus,
      sort: `${sortField}-${sortDirection}`,
      limit: defaultLimit,
      page: page,
    });
  }, [status, sortField, sortDirection, defaultLimit, page, buildParams]);

  // Fetch invoices using the hook
  const {
    invoices,
    pagination,
    isLoading: internalLoading,
    isError,
    error,
    formatInvoiceForDisplay,
    refresh: refreshInvoices,
  } = useInvoices(queryParams);

  // Use unified invoice preview hook
  const {
    invoice: selectedInvoice,
    previewOpen,
    loading: invoiceDetailsLoading,
    error: invoiceDetailsError,
    openPreview,
    closePreview,
  } = useInvoicePreview();

  // Mutations
  const cancelMutation = useCancelInvoice();
  const downloadMutation = useDownloadInvoice();

  // Combine external and internal loading states
  const isLoading = externalLoading || internalLoading;

  // Filter invoices by search term (client-side)
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;

    const term = searchTerm.toLowerCase();
    return invoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.package.name.toLowerCase().includes(term) ||
        invoice.invoiceId.toLowerCase().includes(term)
    );
  }, [invoices, searchTerm]);

  // Enhanced invoices with formatting
  const enhancedInvoices = useMemo(() => {
    return filteredInvoices.map(formatInvoiceForDisplay);
  }, [filteredInvoices, formatInvoiceForDisplay]);

  // Handle sorting (client-side for immediate feedback)
  const sortedInvoices = useMemo(() => {
    return [...enhancedInvoices].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      let comparison = 0;

      if (
        sortField === "createdAt" ||
        sortField === "paidAt" ||
        sortField === "dueDate"
      ) {
        const aDate = new Date(aValue as string);
        const bDate = new Date(bValue as string);
        comparison = aDate.getTime() - bDate.getTime();
      } else if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [enhancedInvoices, sortField, sortDirection]);

  // Handle sorting
  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortDirection("asc");
      return field;
    });
    setPage(1);
  }, []);

  // Handle row selection
  const handleSelectRow = useCallback((invoiceId: string) => {
    setSelectedRows((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(invoiceId)) {
        newSelected.delete(invoiceId);
      } else {
        newSelected.add(invoiceId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedRows((prev) => {
      if (prev.size === sortedInvoices.length) {
        return new Set();
      }
      return new Set(sortedInvoices.map((invoice) => invoice.invoiceId));
    });
  }, [sortedInvoices]);

  // Handle preview using unified hook
  const handlePreview = useCallback(
    (invoiceId: string) => {
      logger.debug("Opening invoice preview", { invoiceId });
      openPreview(invoiceId);
    },
    [openPreview]
  );

  // Handle download
  const handleDownload = useCallback(
    async (invoiceId: string) => {
      try {
        logger.info("Starting invoice download", { invoiceId });
        await downloadMutation.mutateAsync(invoiceId);
        setSnackbar({
          open: true,
          message: "Invoice download started",
          severity: "success",
        });
      } catch (err) {
        logger.error("Invoice download failed", { invoiceId, error: err });
        setSnackbar({
          open: true,
          message: `Download failed: ${(err as Error).message}`,
          severity: "error",
        });
      }
    },
    [downloadMutation]
  );

  // Handle cancel
  const handleCancel = useCallback(
    async (invoiceId: string) => {
      try {
        logger.info("Cancelling invoice", { invoiceId });
        await cancelMutation.mutateAsync({
          invoiceId,
          reason: "User cancelled from invoice table",
        });
        setSnackbar({
          open: true,
          message: "Invoice cancelled successfully",
          severity: "success",
        });
      } catch (err) {
        logger.error("Invoice cancellation failed", { invoiceId, error: err });
        setSnackbar({
          open: true,
          message: `Cancel failed: ${(err as Error).message}`,
          severity: "error",
        });
      }
    },
    [cancelMutation]
  );

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Handle refresh - combine internal and external refresh
  const handleRefresh = useCallback(async () => {
    try {
      logger.debug("Refreshing invoices");
      await refreshInvoices();
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      logger.error("Failed to refresh invoices", { error: err });
    }
  }, [refreshInvoices, onRefresh]);

  // Get payment method icon
  const getPaymentIcon = useCallback((invoice: InvoiceListItem) => {
    switch (invoice.paymentMethod) {
      case "card":
        return <CreditCard sx={{ fontSize: 16 }} />;
      case "upi":
        return <Smartphone sx={{ fontSize: 16 }} />;
      case "netbanking":
        return <AccountBalance sx={{ fontSize: 16 }} />;
      case "wallet":
        return <Wallet sx={{ fontSize: 16 }} />;
      case "emi":
        return <CalendarMonth sx={{ fontSize: 16 }} />;
      default:
        return <CreditCard sx={{ fontSize: 16 }} />;
    }
  }, []);

  // Get status chip color
  const getStatusColor = useCallback((invoiceStatus: string) => {
    switch (invoiceStatus) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      case "cancelled":
        return "default";
      case "refunded":
        return "info";
      default:
        return "default";
    }
  }, []);

  // Error state
  if (isError) {
    return (
      <Card
        sx={{
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
          boxShadow: theme.shadows[1],
          bgcolor: "background.paper",
        }}
      >
        <CardContent>
          <Alert
            severity="error"
            sx={{ borderRadius: `${brand.borderRadius}px` }}
          >
            <Typography variant="h6" color="text.primary" gutterBottom>
              Failed to load invoices
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {(error as Error)?.message || "An unexpected error occurred"}
            </Typography>
            <Button
              onClick={handleRefresh}
              color="primary"
              sx={{ mt: 2, fontFamily: brand.fonts.body }}
            >
              Try Again
            </Button>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!isLoading && sortedInvoices.length === 0 && !searchTerm && !status) {
    return (
      <Card
        sx={{
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
          boxShadow: theme.shadows[1],
          bgcolor: "background.paper",
          transition: theme.transitions.create(["box-shadow", "transform"], {
            duration: theme.transitions.duration.short,
          }),
        }}
      >
        <CardContent>
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                margin: "0 auto 16px",
                borderRadius: `${brand.borderRadius}px`,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Receipt
                sx={{ fontSize: 32, color: theme.palette.primary.contrastText }}
              />
            </Box>
            <Typography
              variant="h6"
              color="text.secondary"
              gutterBottom
              sx={{ fontFamily: brand.fonts.heading }}
            >
              No invoices found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your invoices will appear here when you make purchases
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      {/* Header with Search and Filters */}
      <Card
        sx={{
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
          boxShadow: theme.shadows[1],
          bgcolor: "background.paper",
          transition: theme.transitions.create(["box-shadow"], {
            duration: theme.transitions.duration.short,
          }),
          mb: 3,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: `${brand.borderRadius * 0.75}px`,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText
                  sx={{
                    color: theme.palette.primary.contrastText,
                    fontSize: 20,
                  }}
                />
              </Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Invoices & Receipts
              </Typography>
              {pagination && (
                <Chip
                  label={`${pagination.total} total`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>

            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={isLoading}
              sx={{
                borderRadius: `${brand.borderRadius * 0.75}px`,
                textTransform: "none",
                fontWeight: 600,
                fontFamily: brand.fonts.body,
                transition: theme.transitions.create(
                  ["border-color", "background"],
                  {
                    duration: theme.transitions.duration.short,
                  }
                ),
                borderColor: "divider",
                color: "text.primary",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderColor: "primary.main",
                },
              }}
            >
              {isLoading ? <CircularProgress size={20} /> : "Refresh"}
            </Button>
          </Box>

          {/* Filters Row */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <TextField
              size="small"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{
                minWidth: 200,
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${brand.borderRadius * 0.75}px`,
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                },
              }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                sx={{
                  borderRadius: `${brand.borderRadius * 0.75}px`,
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                }}
              >
                <MenuItem value="">All</MenuItem>
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card
        sx={{
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
          boxShadow: theme.shadows[1],
          bgcolor: "background.paper",
          transition: theme.transitions.create(["box-shadow", "transform"], {
            duration: theme.transitions.duration.short,
          }),
          "&:hover": {
            boxShadow: theme.shadows[4],
            transform: "translateY(-1px)",
          },
        }}
      >
        <TableContainer sx={{ borderRadius: `${brand.borderRadius}px` }}>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedRows.size > 0 &&
                      selectedRows.size < sortedInvoices.length
                    }
                    checked={
                      sortedInvoices.length > 0 &&
                      selectedRows.size === sortedInvoices.length
                    }
                    onChange={handleSelectAll}
                    sx={{
                      color: theme.palette.primary.main,
                      "&.Mui-checked": {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>
                  <TableSortLabel
                    active={sortField === "invoiceNumber"}
                    direction={
                      sortField === "invoiceNumber" ? sortDirection : "asc"
                    }
                    onClick={() => handleSort("invoiceNumber")}
                  >
                    Invoice #
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>
                  <TableSortLabel
                    active={sortField === "createdAt"}
                    direction={
                      sortField === "createdAt" ? sortDirection : "asc"
                    }
                    onClick={() => handleSort("createdAt")}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>
                  Package
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  <TableSortLabel
                    active={sortField === "amount"}
                    direction={sortField === "amount" ? sortDirection : "asc"}
                    onClick={() => handleSort("amount")}
                  >
                    Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>
                  Payment
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>
                  Status
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell padding="checkbox">
                        <Skeleton
                          variant="rectangular"
                          width={20}
                          height={20}
                        />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                    </TableRow>
                  ))
                : sortedInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.invoiceId}
                      hover
                      selected={selectedRows.has(invoice.invoiceId)}
                      sx={{
                        "&:hover": {
                          bgcolor: alpha(theme.palette.action.hover, 0.5),
                        },
                        "&.Mui-selected": {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedRows.has(invoice.invoiceId)}
                          onChange={() => handleSelectRow(invoice.invoiceId)}
                          sx={{
                            color: theme.palette.primary.main,
                            "&.Mui-checked": {
                              color: theme.palette.primary.main,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontFamily="monospace"
                          fontWeight="medium"
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            padding: "4px 8px",
                            borderRadius: 1,
                            display: "inline-block",
                            color: "text.primary",
                          }}
                        >
                          {invoice.invoiceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          color="text.primary"
                        >
                          {formatDate(invoice.createdAt)}
                        </Typography>
                        {invoice.paidAt && (
                          <Typography variant="caption" color="text.secondary">
                            Paid: {formatDate(invoice.paidAt)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            color="text.primary"
                            noWrap
                          >
                            {invoice.package.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {invoice.package.credits.toLocaleString()} credits
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="text.primary"
                        >
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.paymentMethod}
                          size="small"
                          icon={getPaymentIcon(invoice)}
                          sx={{
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status}
                          size="small"
                          color={
                            getStatusColor(invoice.status) as
                              | "success"
                              | "warning"
                              | "error"
                              | "default"
                              | "info"
                          }
                          sx={{
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Preview Invoice">
                            <IconButton
                              size="small"
                              onClick={() => handlePreview(invoice.invoiceId)}
                              color="primary"
                              sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                "&:hover": {
                                  bgcolor: alpha(
                                    theme.palette.primary.main,
                                    0.2
                                  ),
                                },
                              }}
                            >
                              <Visibility sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>

                          {invoice.status === "paid" && (
                            <Tooltip title="Download Invoice">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleDownload(invoice.invoiceId)
                                }
                                disabled={downloadMutation.isPending}
                                sx={{
                                  bgcolor: alpha(
                                    theme.palette.success.main,
                                    0.1
                                  ),
                                  color: theme.palette.success.main,
                                  "&:hover": {
                                    bgcolor: alpha(
                                      theme.palette.success.main,
                                      0.2
                                    ),
                                  },
                                }}
                              >
                                {downloadMutation.isPending ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <Download sx={{ fontSize: 16 }} />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}

                          {invoice.status === "pending" && (
                            <Tooltip title="Cancel Invoice">
                              <IconButton
                                size="small"
                                onClick={() => handleCancel(invoice.invoiceId)}
                                disabled={cancelMutation.isPending}
                                sx={{
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  color: theme.palette.error.main,
                                  "&:hover": {
                                    bgcolor: alpha(
                                      theme.palette.error.main,
                                      0.2
                                    ),
                                  },
                                }}
                              >
                                {cancelMutation.isPending ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <Cancel sx={{ fontSize: 16 }} />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer */}
        <Box
          sx={{
            p: 3,
            borderTop: 1,
            borderColor: alpha(theme.palette.divider, 0.5),
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            borderBottomLeftRadius: brand.borderRadius,
            borderBottomRightRadius: brand.borderRadius,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Showing {sortedInvoices.length} of {pagination?.total || 0} invoices
            {selectedRows.size > 0 && ` • ${selectedRows.size} selected`}
          </Typography>
          {pagination && pagination.total > defaultLimit && (
            <Pagination
              count={Math.ceil(pagination.total / defaultLimit)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
              size="small"
              sx={{
                "& .MuiPaginationItem-root": {
                  borderRadius: `${brand.borderRadius * 0.5}px`,
                  fontWeight: 600,
                },
                "& .Mui-selected": {
                  bgcolor: `${theme.palette.primary.main} !important`,
                  color: theme.palette.primary.contrastText,
                },
              }}
            />
          )}
        </Box>
      </Card>

      {/* Invoice Preview Dialog */}
      <Suspense fallback={null}>
        {selectedInvoice && (
          <ModernInvoicePreview
            invoice={selectedInvoice}
            open={previewOpen}
            onClose={closePreview}
            scale="large"
            loading={invoiceDetailsLoading}
            error={invoiceDetailsError || undefined}
          />
        )}
      </Suspense>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            borderRadius: `${brand.borderRadius * 0.75}px`,
            fontWeight: 600,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

CustomInvoiceTable.displayName = "CustomInvoiceTable";
