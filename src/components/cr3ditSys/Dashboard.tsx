'use client';

import { useMemo, startTransition, Suspense } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  LinearProgress,
  alpha,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Skeleton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  Film,
  BarChart3,
} from 'lucide-react';
import { getCurrentBrand } from '@/config/brandConfig';
import DiamondIcon from '@/components/common/DiamondIcon';
import type { QuickStats } from '@/services/scriptService';

// Types
interface DashboardProps {
  quickStats: QuickStats | null;
  quickStatsLoading: boolean;
  quickStatsError: Error | null;
  onManageCredits: () => void;
  onViewBilling: () => void;
  onManageSubscription: () => void;
  className?: string;
}

interface StatData {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  bgColor: string;
}

interface ActivityData {
  action: string;
  time: string;
  usageType?: string;
  provider?: string;
  status?: string;
}

// Fallback data for when API is unavailable
const fallbackStats: StatData[] = [
  {
    label: 'Credits Used Today',
    value: '47',
    icon: Zap,
    color: '#FFC107',
    bgColor: 'warning.main',
  },
  {
    label: 'Projects Active',
    value: '12',
    icon: TrendingUp,
    color: '#4CAF50',
    bgColor: 'success.main',
  },
  {
    label: 'Media Generated',
    value: '23',
    icon: Film,
    color: '#2196F3',
    bgColor: 'info.main',
  },
];

const fallbackActivity: ActivityData[] = [
  {
    action: 'Image generation completed',
    time: '2 min ago',
    usageType: undefined,
    provider: undefined,
    status: undefined,
  },
  {
    action: 'Text analysis finished',
    time: '1 hour ago',
    usageType: undefined,
    provider: undefined,
    status: undefined,
  },
  {
    action: 'Video processing started',
    time: '3 hours ago',
    usageType: undefined,
    provider: undefined,
    status: undefined,
  },
];

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}

// Loading skeleton for stats cards
const StatsCardSkeleton = () => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Card
      sx={{
        borderRadius: `${brand.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.default',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton variant="rectangular" width={56} height={56} sx={{ borderRadius: `${brand.borderRadius}px` }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="80%" height={24} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Stats Card Component
const StatsCard = ({ stat }: { stat: StatData }) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const IconComponent = stat.icon;

  return (
    <Card
      sx={{
        borderRadius: `${brand.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.default',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: `${brand.borderRadius}px`,
              bgcolor: 'background.default',
              border: `1px solid ${alpha(stat.color, 0.2)}`,
            }}
          >
            <IconComponent size={28} color={stat.color} />
          </Box>
          <Box>
            <Typography
              variant="h3"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              {stat.value}
            </Typography>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              {stat.label}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Credit Usage Card Component
const CreditUsageCard = ({
  creditData,
  quickStats,
  onManageCredits,
}: {
  creditData: {
    current: number;
    max: number;
    percentage: number;
    resetsIn: string;
    dailyUsage: number;
  };
  quickStats: QuickStats | null;
  onManageCredits: () => void;
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: `${brand.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        bgcolor: 'background.default',
      }}
    >
      <CardHeader
        title={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              variant="h4"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Credit Usage
            </Typography>
            <Button
              variant="outlined"
              size="medium"
              endIcon={<ArrowRight size={20} />}
              onClick={onManageCredits}
              sx={{
                borderRadius: `${brand.borderRadius * 6}px`,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1.1rem',
                fontFamily: brand.fonts.body,
                border: `1px solid ${theme.palette.primary.main}`,
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderColor: 'primary.main',
                },
              }}
            >
              Manage Credits
            </Button>
          </Box>
        }
        sx={{ pb: 2 }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Current Period
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DiamondIcon size={18} sx={{ color: 'warning.main' }} />
              <Typography
                variant="body1"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                {creditData.current.toLocaleString()} /{' '}
                {creditData.max.toLocaleString()} credits ({creditData.percentage}%)
              </Typography>
            </Box>
          </Box>

          <LinearProgress
            variant="determinate"
            value={creditData.percentage}
            sx={{
              height: 10,
              borderRadius: `${brand.borderRadius}px`,
              bgcolor: alpha(theme.palette.warning.main, 0.2),
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(135deg, #FFC107 0%, #FFD740 100%)',
                borderRadius: `${brand.borderRadius}px`,
              },
            }}
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Resets in
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                {creditData.resetsIn}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Average daily usage
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="text.primary"
                sx={{ fontFamily: brand.fonts.heading }}
              >
                {quickStats?.averageDailyCredits || 0} credits
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Quick Actions Card Component
const QuickActionsCard = ({
  onViewBilling,
  onManageSubscription,
}: {
  onViewBilling: () => void;
  onManageSubscription: () => void;
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Card
      sx={{
        borderRadius: `${brand.borderRadius}px`,
        bgcolor: 'background.default',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        height: '100%',
      }}
    >
      <CardHeader
        title={
          <Typography
            variant="h4"
            fontWeight="bold"
            color="text.primary"
            sx={{ fontFamily: brand.fonts.heading }}
          >
            Quick Actions
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={2}>
          <Button
            variant="outlined"
            fullWidth
            onClick={onViewBilling}
            sx={{
              justifyContent: 'flex-start',
              borderRadius: `${brand.borderRadius * 6}px`,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1.1rem',
              fontFamily: brand.fonts.body,
              py: 1,
              border: `1px solid ${theme.palette.primary.main}`,
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderColor: 'primary.main',
              },
            }}
          >
            View Billing Details
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={onManageSubscription}
            sx={{
              justifyContent: 'flex-start',
              borderRadius: `${brand.borderRadius * 6}px`,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1.1rem',
              fontFamily: brand.fonts.body,
              py: 1,
              border: `1px solid ${theme.palette.primary.main}`,
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderColor: 'primary.main',
              },
            }}
          >
            Manage Subscription
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Recent Activity Card Component
const RecentActivityCard = ({
  activityData,
  quickStats,
}: {
  activityData: ActivityData[];
  quickStats: QuickStats | null;
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Card
      sx={{
        borderRadius: `${brand.borderRadius}px`,
        bgcolor: 'background.default',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        height: '100%',
      }}
    >
      <CardHeader
        title={
          <Typography
            variant="h4"
            fontWeight="bold"
            color="text.primary"
            sx={{ fontFamily: brand.fonts.heading }}
          >
            Recent Activity
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={1}>
          {activityData.map((activity, index) => (
            <Box key={index}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  py: 1,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    {activity.action}
                  </Typography>
                  {activity.status && (
                    <Chip
                      label={activity.status}
                      size="small"
                      color={activity.status === 'success' ? 'success' : 'default'}
                      sx={{
                        ml: 1,
                        height: 16,
                        fontSize: '0.6rem',
                        fontFamily: brand.fonts.body,
                      }}
                    />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 2, minWidth: 'fit-content', fontFamily: brand.fonts.body }}
                >
                  {activity.time}
                </Typography>
              </Box>
              {index < activityData.length - 1 && <Divider sx={{ opacity: 0.3 }} />}
            </Box>
          ))}
        </Stack>

        {quickStats && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Data updated: {new Date(quickStats.generatedAt).toLocaleString()} • Source:{' '}
              {quickStats.dataSource}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
export function Dashboard({
  quickStats,
  quickStatsLoading,
  quickStatsError,
  onManageCredits,
  onViewBilling,
  onManageSubscription,
  className,
}: DashboardProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Prepare stats data using real data when available
  const statsData = useMemo(() => {
    if (!quickStats) {
      return fallbackStats;
    }

    return [
      {
        label: 'Credits Used Today',
        value: quickStats.creditsUsedToday.toString(),
        icon: Zap,
        color: '#FFC107',
        bgColor: 'warning.main',
      },
      {
        label: 'Projects Active',
        value: quickStats.activeProjects.count.toString(),
        icon: TrendingUp,
        color: '#4CAF50',
        bgColor: 'success.main',
      },
      {
        label: 'Media Generated',
        value: quickStats.mediaGenerated14Days.total.toString(),
        icon: Film,
        color: '#2196F3',
        bgColor: 'info.main',
      },
    ];
  }, [quickStats]);

  // Generate recent activity from real API data
  const activityData = useMemo(() => {
    if (!quickStats?.recentActivity?.length) {
      return fallbackActivity;
    }

    return quickStats.recentActivity.slice(0, 3).map((activity) => {
      const timestamp = new Date(activity.timestamp);
      const timeAgo = getTimeAgo(timestamp);
      const activityText = `${activity.activity} (${activity.details.credits} credits)`;

      return {
        action: activityText,
        time: timeAgo,
        usageType: activity.details.usageType,
        status: activity.details.status,
      };
    });
  }, [quickStats]);

  // Credit usage data from real API or fallback
  const creditData = useMemo(() => {
    if (!quickStats) {
      return {
        current: 1247,
        max: 5000,
        percentage: 25,
        resetsIn: 'No Reset Plan',
        dailyUsage: 47,
      };
    }

    const currentMonth = quickStats.monthlyComparison.currentMonth.credits;
    const averageMonthly = quickStats.projectedUsage.projectedTotal;
    const percentage = Math.min(Math.round((currentMonth / averageMonthly) * 100), 100);

    return {
      current: currentMonth,
      max: averageMonthly,
      percentage,
      resetsIn: `${quickStats.projectedUsage.daysRemaining} days`,
      dailyUsage: quickStats.creditsUsedToday,
    };
  }, [quickStats]);

  // Show loading state
  if (quickStatsLoading) {
    return (
      <Container maxWidth="xl" className={className}>
        <Box
          sx={{
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Stack alignItems="center" spacing={3}>
            <Box
              sx={{
                p: 3,
                borderRadius: `${brand.borderRadius * 4}px`,
                background: 'linear-gradient(135deg, #FFC107 0%, #FFD740 100%)',
              }}
            >
              <DiamondIcon animate size={32} sx={{ color: '#8B4513' }} />
            </Box>
            <CircularProgress size={40} sx={{ color: 'warning.main' }} />
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Loading Dashboard...
            </Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className={className}>
      {/* Hero Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            fontFamily: brand.fonts.heading,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          Cr3ditSys
        </Typography>
        <Box
          sx={{
            width: 60,
            height: 2,
            bgcolor: 'primary.main',
            mx: 'auto',
            borderRadius: `${brand.borderRadius}px`,
          }}
        />
      </Box>

      {/* Error Alert */}
      {quickStatsError && (
        <Alert
          severity="warning"
          sx={{
            borderRadius: `${brand.borderRadius}px`,
            mb: 3,
            fontFamily: brand.fonts.body,
          }}
        >
          Unable to load latest usage statistics. Showing cached data.
        </Alert>
      )}

      {/* Stats Grid with Suspense */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsData.map((stat) => (
          <Grid size={{ xs: 12, md: 4 }} key={stat.label}>
            <Suspense fallback={<StatsCardSkeleton />}>
              <StatsCard stat={stat} />
            </Suspense>
          </Grid>
        ))}
      </Grid>

      {/* Credit Usage Card */}
      <Suspense
        fallback={
          <Card
            sx={{
              mb: 4,
              borderRadius: `${brand.borderRadius}px`,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent>
              <Skeleton variant="text" width="40%" height={40} />
              <Skeleton variant="rectangular" width="100%" height={100} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        }
      >
        <CreditUsageCard
          creditData={creditData}
          quickStats={quickStats}
          onManageCredits={onManageCredits}
        />
      </Suspense>

      {/* Bottom Section - Quick Actions & Recent Activity */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Suspense
            fallback={
              <Card
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <CardContent>
                  <Skeleton variant="text" width="40%" height={32} />
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Skeleton variant="rectangular" width="100%" height={48} />
                    <Skeleton variant="rectangular" width="100%" height={48} />
                  </Stack>
                </CardContent>
              </Card>
            }
          >
            <QuickActionsCard
              onViewBilling={onViewBilling}
              onManageSubscription={onManageSubscription}
            />
          </Suspense>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Suspense
            fallback={
              <Card
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <CardContent>
                  <Skeleton variant="text" width="40%" height={32} />
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} variant="rectangular" width="100%" height={40} />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            }
          >
            <RecentActivityCard activityData={activityData} quickStats={quickStats} />
          </Suspense>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;