'use client';

import { useState, useMemo, useCallback, startTransition, Suspense } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  alpha,
  Fade,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Grid,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  Select,
  SelectChangeEvent,
  Skeleton,
  Stack,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  BarChart3 as Analytics,
  Download,
  Filter as FilterList,
  Search,
  Calendar as CalendarToday,
  FileText,
  Film,
  BarChart,
  ClipboardList as Assessment,
  RotateCcw as Refresh,
  AudioLines,
} from 'lucide-react';
import { getCurrentBrand } from '@/config/brandConfig';
import DiamondIcon from '@/components/common/DiamondIcon';
import { useAPICallHistory } from '@/hooks/useAPICallHistory';
import { APIHistoryItem } from '@/services/scriptService';

interface ApiUsageAnalyticsProps {
  userId?: string;
  defaultDays?: number;
  defaultPageSize?: number;
  className?: string;
  onExport?: (data: APIHistoryItem[]) => void;
}

// Helper function to get service icon
const getServiceIcon = (item: APIHistoryItem, getServiceType: (item: APIHistoryItem) => string) => {
  const serviceType = getServiceType(item);

  switch (serviceType) {
    case 'Image Generation':
      return Film;
    case 'Video Processing':
      return FileText;
    case 'Audio Processing':
      return AudioLines;
    case 'Image Editing':
    case 'Image Edit':
      return Film;
    case 'AI Analysis':
    case 'Text Analysis':
      return BarChart;
    case 'Script Generation':
    case 'Document Analysis':
      return Assessment;
    default:
      if (item.usageCategory === 'api') {
        switch (item.usageType) {
          case 'image_generation':
          case 'image_edit':
          case 'image_upscale':
            return Film;
          case 'video_generation':
            return FileText;
          case 'audio_generation':
          case 'tts':
            return Assessment;
          default:
            return Film;
        }
      } else if (item.usageCategory === 'llm') {
        if (item.analysisType === 'scriptGenerator') {
          return Assessment;
        }
        return BarChart;
      }
      return BarChart;
  }
};

// Helper function to get status color
const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
  switch (status) {
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    case 'partial':
      return 'warning';
    default:
      return 'default';
  }
};

// Loading Skeleton Component
const AnalyticsSkeleton = () => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Card
      sx={{
        borderRadius: `${brand.borderRadius * 4}px`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Skeleton variant="rectangular" width={300} height={60} sx={{ borderRadius: `${brand.borderRadius}px` }} />
          <Skeleton variant="rectangular" width={200} height={40} sx={{ borderRadius: `${brand.borderRadius}px` }} />
        </Box>
        <Skeleton variant="rectangular" width="100%" height={120} sx={{ mb: 2, borderRadius: `${brand.borderRadius}px` }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={60} sx={{ mb: 1, borderRadius: `${brand.borderRadius}px` }} />
        ))}
      </CardContent>
    </Card>
  );
};

// Summary Stats Component
const SummaryStats = ({ summary, formatCredits }: { summary: any; formatCredits: (val: number) => string }) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Grid
      container
      spacing={2}
      sx={{
        p: 2,
        borderRadius: `${brand.borderRadius}px`,
        bgcolor: alpha(theme.palette.primary.main, 0.05),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Grid size={3}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            color="primary.main"
            sx={{ fontFamily: brand.fonts.heading }}
          >
            {summary.totalAPICalls}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: brand.fonts.body }}>
            Total API Calls
          </Typography>
        </Box>
      </Grid>
      <Grid size={3}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            color="error.main"
            sx={{ fontFamily: brand.fonts.heading }}
          >
            -{formatCredits(summary.creditsUsed)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: brand.fonts.body }}>
            Credits Used
          </Typography>
        </Box>
      </Grid>
      <Grid size={3}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            color="success.main"
            sx={{ fontFamily: brand.fonts.heading }}
          >
            {summary.assetsGenerated}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: brand.fonts.body }}>
            Assets Generated
          </Typography>
        </Box>
      </Grid>
      <Grid size={3}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            color={
              summary.successRate > 95
                ? 'success.main'
                : summary.successRate > 85
                ? 'warning.main'
                : 'error.main'
            }
            sx={{ fontFamily: brand.fonts.heading }}
          >
            {summary.successRate}%
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: brand.fonts.body }}>
            Success Rate
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

// Table Row Component
const TableRow = ({
  item,
  index,
  getServiceType,
  formatCredits,
}: {
  item: APIHistoryItem;
  index: number;
  getServiceType: (item: APIHistoryItem) => string;
  formatCredits: (val: number) => string;
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const IconComponent = getServiceIcon(item, getServiceType);

  return (
    <Fade in={true} timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr',
          gap: 2,
          p: 2,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: index % 2 === 0 ? alpha(theme.palette.background.paper, 0.5) : 'transparent',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            transform: 'translateX(2px)',
            borderColor: alpha(theme.palette.primary.main, 0.1),
          },
          transition: 'all 0.2s ease',
          alignItems: 'center',
          border: '1px solid transparent',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday size={14} color={theme.palette.text.secondary} />
          <Box>
            <Typography
              variant="body2"
              fontWeight="medium"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              {new Date(item.dateTime).toLocaleDateString()}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              {new Date(item.dateTime).toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: `${brand.borderRadius}px`,
              bgcolor: alpha(theme.palette.info.main, 0.1),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}
          >
            <IconComponent size={14} color={theme.palette.info.main} />
          </Box>
          <Box>
            <Typography
              variant="body2"
              fontWeight="medium"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              {getServiceType(item)}
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="body2"
          fontWeight="600"
          color="text.primary"
          sx={{ textAlign: 'center', fontFamily: brand.fonts.body }}
        >
          {item.apiCalls}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
          <DiamondIcon size={12} sx={{ color: 'warning.main' }} />
          <Typography
            variant="body2"
            fontWeight="600"
            color="error.main"
            sx={{ fontFamily: brand.fonts.body }}
          >
            -{formatCredits(item.creditsUsed)}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          fontWeight="600"
          color="success.main"
          sx={{ textAlign: 'center', fontFamily: brand.fonts.body }}
        >
          {item.assetsGenerated}
        </Typography>

        <Box sx={{ textAlign: 'center' }}>
          <Chip
            label={item.status}
            size="small"
            color={getStatusColor(item.status)}
            sx={{
              textTransform: 'capitalize',
              fontWeight: 600,
              fontSize: '0.75rem',
              fontFamily: brand.fonts.body,
            }}
          />
        </Box>
      </Box>
    </Fade>
  );
};

// Main Component
export function ApiUsageAnalytics({
  userId,
  defaultDays = 30,
  defaultPageSize = 10,
  className,
  onExport,
}: ApiUsageAnalyticsProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const [days, setDays] = useState(defaultDays);
  const [page, setPage] = useState(1);
  const [usageCategory, setUsageCategory] = useState<'llm' | 'api' | 'credit_operation' | undefined>(undefined);
  const [status, setStatus] = useState<'success' | 'failed' | 'partial' | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'timestamp' | 'credits'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);

  const {
    data,
    isLoading,
    error,
    summary,
    items,
    pagination,
    filters,
    getServiceType,
    formatTimestamp,
    formatCredits,
    refetch,
    currentParams,
  } = useAPICallHistory({
    userId,
    days,
    page,
    limit: defaultPageSize,
    usageCategory,
    status,
    sortBy,
    sortOrder,
  });

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter((item) => {
      const serviceType = getServiceType(item).toLowerCase();
      const date = formatTimestamp(item.dateTime).toLowerCase();
      const itemStatus = item.status.toLowerCase();
      const provider = item.provider?.toLowerCase() || '';

      return (
        serviceType.includes(lowerSearchTerm) ||
        date.includes(lowerSearchTerm) ||
        itemStatus.includes(lowerSearchTerm) ||
        provider.includes(lowerSearchTerm)
      );
    });
  }, [items, searchTerm, getServiceType, formatTimestamp]);

  const filteredSummary = useMemo(() => {
    if (!summary) return null;
    if (!searchTerm.trim()) return summary;

    const totalCalls = filteredItems.length;
    const totalCredits = filteredItems.reduce((sum, item) => sum + item.creditsUsed, 0);
    const totalAssets = filteredItems.reduce((sum, item) => sum + item.assetsGenerated, 0);
    const successCount = filteredItems.filter((item) => item.status === 'success').length;
    const successRate = totalCalls > 0 ? Math.round((successCount / totalCalls) * 100) : 0;

    return {
      ...summary,
      totalAPICalls: totalCalls,
      creditsUsed: totalCredits,
      assetsGenerated: totalAssets,
      successRate,
    };
  }, [summary, filteredItems, searchTerm]);

  const handleTimeRangeChange = useCallback((event: SelectChangeEvent<number>) => {
    const newDays = Number(event.target.value);
    startTransition(() => {
      setDays(newDays);
      setPage(1);
      setSearchTerm('');
    });
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    startTransition(() => {
      if (category === 'all') {
        setUsageCategory(undefined);
      } else {
        setUsageCategory(category as 'llm' | 'api' | 'credit_operation');
      }
      setPage(1);
      setFilterAnchor(null);
    });
  }, []);

  const handleStatusChange = useCallback((newStatus: string) => {
    startTransition(() => {
      if (newStatus === 'all') {
        setStatus(undefined);
      } else {
        setStatus(newStatus as 'success' | 'failed' | 'partial');
      }
      setPage(1);
    });
  }, []);

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    startTransition(() => {
      setPage(newPage);
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    startTransition(() => {
      setDays(defaultDays);
      setPage(1);
      setUsageCategory(undefined);
      setStatus(undefined);
      setSortBy('timestamp');
      setSortOrder('desc');
      setSearchTerm('');
    });
  }, [defaultDays]);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(filteredItems);
    } else {
      const csvContent = [
        [
          'Date & Time',
          'Service Type',
          'Usage Category',
          'Provider',
          'API Calls',
          'Credits Used',
          'Assets Generated',
          'Cost USD',
          'Status',
        ].join(','),
        ...filteredItems.map((item) =>
          [
            formatTimestamp(item.dateTime),
            getServiceType(item),
            item.usageCategory,
            item.provider || 'N/A',
            item.apiCalls,
            item.creditsUsed,
            item.assetsGenerated,
            item.costUSD.toFixed(4),
            item.status,
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-usage-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  }, [filteredItems, formatTimestamp, getServiceType, onExport]);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <Card
        sx={{
          borderRadius: `${brand.borderRadius * 4}px`,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
        className={className}
      >
        <CardContent sx={{ p: 3 }}>
          <Alert
            severity="error"
            action={
              <Button size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
            sx={{ borderRadius: `${brand.borderRadius}px`, fontFamily: brand.fonts.body }}
          >
            Failed to load API usage data: {error.message}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: `${brand.borderRadius * 4}px`,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.default',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-1px)',
        },
      }}
      className={className}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: `${brand.borderRadius}px`,
                bgcolor: 'primary.main',
              }}
            >
              <Analytics size={20} color={theme.palette.primary.contrastText} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                API Call History & Usage Analytics
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Detailed breakdown of your API usage with asset generation tracking
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh data">
              <IconButton
                onClick={() => refetch()}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: `${brand.borderRadius}px`,
                }}
              >
                <Refresh size={18} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Filter results">
              <IconButton
                onClick={(e) => setFilterAnchor(e.currentTarget)}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: `${brand.borderRadius}px`,
                }}
              >
                <FilterList size={18} />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              size="small"
              startIcon={<Download size={16} />}
              onClick={handleExport}
              disabled={filteredItems.length === 0}
              sx={{
                borderRadius: `${brand.borderRadius}px`,
                textTransform: 'none',
                fontWeight: 600,
                fontFamily: brand.fonts.body,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderColor: 'primary.main',
                },
              }}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Controls */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={days}
                onChange={handleTimeRangeChange}
                sx={{ borderRadius: `${brand.borderRadius}px`, fontFamily: brand.fonts.body }}
              >
                <MenuItem value={7}>Last 7 days</MenuItem>
                <MenuItem value={30}>Last 30 days</MenuItem>
                <MenuItem value={90}>Last 90 days</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Search services, dates, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} color={theme.palette.text.secondary} />
                  </InputAdornment>
                ),
              }}
              sx={{
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  borderRadius: `${brand.borderRadius}px`,
                  fontFamily: brand.fonts.body,
                },
              }}
            />

            {usageCategory && (
              <Chip
                label={`Category: ${usageCategory}`}
                onDelete={() => setUsageCategory(undefined)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontFamily: brand.fonts.body }}
              />
            )}

            {status && (
              <Chip
                label={`Status: ${status}`}
                onDelete={() => setStatus(undefined)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontFamily: brand.fonts.body }}
              />
            )}

            {searchTerm && (
              <Chip
                label={`Search: ${searchTerm}`}
                onDelete={() => setSearchTerm('')}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontFamily: brand.fonts.body }}
              />
            )}

            {(usageCategory || status || searchTerm || days !== defaultDays) && (
              <Button
                size="small"
                onClick={handleClearFilters}
                sx={{ textTransform: 'none', fontFamily: brand.fonts.body }}
              >
                Clear All Filters
              </Button>
            )}
          </Box>

          {filteredSummary && (
            <Suspense
              fallback={
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={120}
                  sx={{ borderRadius: `${brand.borderRadius}px` }}
                />
              }
            >
              <SummaryStats summary={filteredSummary} formatCredits={formatCredits} />
            </Suspense>
          )}
        </Box>

        {/* Table */}
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 800 }}>
            {/* Table Header */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr',
                gap: 2,
                p: 2,
                borderRadius: `${brand.borderRadius}px`,
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Date & Time
              </Typography>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Service Type
              </Typography>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                textAlign="center"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                API Calls
              </Typography>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                textAlign="center"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Credits Used
              </Typography>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                textAlign="center"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Assets Generated
              </Typography>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                textAlign="center"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Status
              </Typography>
            </Box>

            {/* Table Rows */}
            {filteredItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  color="text.primary"
                  sx={{ fontFamily: brand.fonts.heading }}
                >
                  No data found
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: brand.fonts.body }}>
                  {searchTerm || usageCategory || status
                    ? 'Try adjusting your search or filters'
                    : 'API usage data will appear here'}
                </Typography>
              </Box>
            ) : (
              <Suspense
                fallback={
                  <Stack spacing={1}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton
                        key={i}
                        variant="rectangular"
                        width="100%"
                        height={60}
                        sx={{ borderRadius: `${brand.borderRadius}px` }}
                      />
                    ))}
                  </Stack>
                }
              >
                {filteredItems.map((item, index) => (
                  <TableRow
                    key={`${item.dateTime}-${index}`}
                    item={item}
                    index={index}
                    getServiceType={getServiceType}
                    formatCredits={formatCredits}
                  />
                ))}
              </Suspense>
            )}
          </Box>
        </Box>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.currentPage}
              onChange={handlePageChange}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  fontFamily: brand.fonts.body,
                },
                '& .MuiPaginationItem-root.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
              }}
            />
          </Box>
        )}

        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
          slotProps={{
            paper: {
              sx: {
                borderRadius: `${brand.borderRadius}px`,
                border: `1px solid ${theme.palette.divider}`,
                mt: 1,
                minWidth: 200,
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 'bold', fontFamily: brand.fonts.heading, color: 'text.primary' }}
            >
              Filter by Category
            </Typography>
          </Box>
          <MenuItem onClick={() => handleCategoryChange('all')} sx={{ fontFamily: brand.fonts.body }}>
            All Categories
          </MenuItem>
          <MenuItem onClick={() => handleCategoryChange('api')} sx={{ fontFamily: brand.fonts.body }}>
            API Services
          </MenuItem>
          <MenuItem onClick={() => handleCategoryChange('llm')} sx={{ fontFamily: brand.fonts.body }}>
            LLM Services
          </MenuItem>
          <MenuItem onClick={() => handleCategoryChange('credit_operation')} sx={{ fontFamily: brand.fonts.body }}>
            Credit Operations
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ px: 2, py: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 'bold', fontFamily: brand.fonts.heading, color: 'text.primary' }}
            >
              Filter by Status
            </Typography>
          </Box>
          <MenuItem onClick={() => handleStatusChange('all')} sx={{ fontFamily: brand.fonts.body }}>
            All Status
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange('success')} sx={{ fontFamily: brand.fonts.body }}>
            Success
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange('failed')} sx={{ fontFamily: brand.fonts.body }}>
            Failed
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange('partial')} sx={{ fontFamily: brand.fonts.body }}>
            Partial
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
}

export default ApiUsageAnalytics;