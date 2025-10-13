"use client";

import { useState, useMemo } from "react";
import { Box, Tabs, Tab, Typography, Paper, alpha, Badge } from "@mui/material";
import {
  Token as TokenIcon,
  Api as ApiIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  CreditCard as CreditCardIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";
import { AnalysisInProgress } from "@/components/common/AnalysisInProgress";
import { useScriptDashboardAnalysis } from "@/hooks/scripts/useScriptDashboardAnalysis";
import Analytics from "./Analytics";
import ApiAnalytics from "./ApiAnalytics";

interface TabbedAnalyticsProps {
  scriptId: string;
  versionId: string;
}

interface TokenAnalyticsData {
  success: boolean;
  data: {
    userId: string;
    scriptId: string;
    versionId: string;
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCredits: number;
    totalCost: number;
    versionBreakdown: Record<
      string,
      {
        requests: number;
        totalTokens: number;
      }
    >;
    analysisTypeBreakdown: Record<
      string,
      {
        requests: number;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        credits: number;
        cost: number;
      }
    >;
    modelBreakdown: Record<
      string,
      {
        requests: number;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        credits: number;
        cost: number;
      }
    >;
    analysisModelMapping: Record<
      string,
      {
        analysisType: string;
        model: string;
        requests: number;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        location: string;
        credits: number;
        cost: number;
      }
    >;
    detailedAnalysisBreakdown: Record<
      string,
      {
        analysisType: string;
        totalRequests: number;
        totalTokens: number;
        modelUsage: Record<
          string,
          {
            requests: number;
            totalTokens: number;
            location: string;
            credits: number;
            cost: number;
          }
        >;
        averageTokensPerRequest: number;
        totalCredits: number;
        totalCost: number;
      }
    >;
    apiStats: {
      totalRequests: number;
      totalDuration: number;
      totalRequestDuration: number;
      averageRequestDuration: number;
      totalCredits: number;
      totalCost: number;
      totalCombinedCost: number;
      versionBreakdown: Record<
        string,
        {
          requests: number;
          totalDuration: number;
          totalRequestDuration: number;
          averageRequestDuration: number;
          totalCost: number;
          totalCredits: number;
        }
      >;
      analysisTypeBreakdown: Record<
        string,
        {
          requests: number;
          totalDuration: number;
          totalRequestDuration: number;
          averageRequestDuration: number;
          apiTypes: string[];
          providers: string[];
          totalCost: number;
          totalCredits: number;
        }
      >;
      providerBreakdown: Record<
        string,
        {
          requests: number;
          totalDuration: number;
          totalRequestDuration: number;
          averageRequestDuration: number;
          models: string[];
          apiTypes: string[];
          totalCost: number;
          totalCredits: number;
        }
      >;
      modelBreakdown: Record<
        string,
        {
          provider: string;
          model: string;
          apiType: string;
          requests: number;
          totalDuration: number;
          totalRequestDuration: number;
          averageRequestDuration: number;
          totalCost: number;
          totalCredits: number;
        }
      >;
      apiTypeBreakdown: Record<
        string,
        {
          requests: number;
          totalDuration: number;
          totalRequestDuration: number;
          averageRequestDuration: number;
          providers: string[];
          totalCost: number;
          totalCredits: number;
        }
      >;
      detailedBreakdown: Record<
        string,
        {
          analysisType: string;
          provider: string;
          model: string;
          apiType: string;
          requests: number;
          totalDuration: number;
          averageDuration: number;
          totalRequestDuration: number;
          averageRequestDuration: number;
          totalCost: number;
          totalCredits: number;
        }
      >;
      costBreakdown: {
        byProvider: Record<string, { cost: number; requests: number }>;
        byModel: Record<
          string,
          { provider: string; model: string; cost: number; requests: number }
        >;
        byApiType: Record<string, { cost: number; requests: number }>;
        byAnalysisType: Record<string, { cost: number; requests: number }>;
      };
      creditBreakdown: {
        totalCredits: number;
        byProvider: Record<
          string,
          { credits: number; cost: number; requests: number }
        >;
        byApiType: Record<
          string,
          { credits: number; cost: number; requests: number }
        >;
        byAnalysisType: Record<
          string,
          { credits: number; cost: number; requests: number }
        >;
      };
    };
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analytics-tab-${index}`,
    "aria-controls": `analytics-tabpanel-${index}`,
  };
}

const formatCredits = (credits: number): string => {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  } else if (credits > 10000) {
    return `${(credits / 1000).toFixed(1)}K`;
  }
  return credits.toString();
};

export default function TabbedAnalytics({
  scriptId,
  versionId,
}: TabbedAnalyticsProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE
  // ==========================================
  const [value, setValue] = useState(0);

  // ==========================================
  // DATA FETCHING
  // ==========================================
  const { data, isLoading, error } =
    useScriptDashboardAnalysis<TokenAnalyticsData>(
      scriptId,
      versionId,
      "tokenAnalytics"
    );

  // ==========================================
  // COMPUTED VALUES (Memoized)
  // ==========================================
  const hasApiStats = useMemo(() => {
    return data?.data?.apiStats && Object.keys(data.data.apiStats).length > 0;
  }, [data?.data?.apiStats]);

  const analytics = data?.data;

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // ==========================================
  // LOADING & ERROR STATES
  // ==========================================
  if (isLoading) {
    return <LoadingAnimation message="Loading analytics data..." />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          An error occurred while loading analytics data
        </Typography>
      </Box>
    );
  }

  if (!data || !data.success || !analytics) {
    return (
      <AnalysisInProgress message="Analytics data is not available. Please check back later." />
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, pb: 0 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: "primary.main",
            fontFamily: brand.fonts.heading,
          }}
        >
          Analytics Dashboard
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, fontFamily: brand.fonts.body }}
        >
          Comprehensive analysis of system performance, token usage, and API
          statistics
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ px: 3 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="analytics tabs"
          variant="fullWidth"
          sx={{
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
              bgcolor: "primary.main",
            },
            "& .MuiTab-root": {
              minHeight: 72,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 600,
              color: theme.palette.text.secondary,
              fontFamily: brand.fonts.body,
              transition: "all 0.3s ease",
              "&:hover": {
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
              "&.Mui-selected": {
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            },
          }}
        >
          <Tab
            icon={
              <Badge
                badgeContent={analytics.totalRequests}
                color="primary"
                max={999}
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    fontFamily: brand.fonts.body,
                  },
                }}
              >
                <TokenIcon sx={{ fontSize: 28 }} />
              </Badge>
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    fontFamily: brand.fonts.heading,
                  }}
                >
                  AI Analytics
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {formatCredits(analytics.totalCredits)} total credits
                </Typography>
              </Box>
            }
            {...a11yProps(0)}
            sx={{ flexDirection: "column", gap: 1 }}
          />
          <Tab
            icon={
              <Badge
                badgeContent={
                  hasApiStats ? analytics.apiStats.totalRequests : 0
                }
                color="primary"
                max={999}
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    fontFamily: brand.fonts.body,
                  },
                }}
              >
                <ApiIcon sx={{ fontSize: 28 }} />
              </Badge>
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    fontFamily: brand.fonts.heading,
                  }}
                >
                  Media
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {hasApiStats
                    ? `${formatCredits(
                        analytics.apiStats.totalCredits
                      )} total credits`
                    : "No API data available"}
                </Typography>
              </Box>
            }
            {...a11yProps(1)}
            sx={{ flexDirection: "column", gap: 1 }}
            disabled={!hasApiStats}
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={value} index={0}>
        <Analytics scriptId={scriptId} versionId={versionId} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        {hasApiStats ? (
          <ApiAnalytics apiStats={analytics.apiStats} />
        ) : (
          <Box sx={{ p: 3 }}>
            <AnalysisInProgress message="API analytics data is not available for this analysis." />
          </Box>
        )}
      </TabPanel>

      {/* Quick Stats Footer */}
      <Box
        sx={{
          p: 3,
          mt: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Paper
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: "blur(10px)",
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: `${brand.borderRadius}px`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TrendingUpIcon sx={{ color: "success.main" }} />
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Token Efficiency
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "success.main",
                  fontFamily: brand.fonts.heading,
                }}
              >
                {(
                  analytics.totalOutputTokens / analytics.totalInputTokens
                ).toFixed(3)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TokenIcon sx={{ color: "primary.main" }} />
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Avg Tokens/Request
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "primary.main",
                  fontFamily: brand.fonts.heading,
                }}
              >
                {Math.round(
                  analytics.totalTokens / analytics.totalRequests
                ).toLocaleString()}
              </Typography>
            </Box>
          </Box>

          {hasApiStats && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SpeedIcon sx={{ color: "primary.main" }} />
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Avg API Duration
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "primary.main",
                    fontFamily: brand.fonts.heading,
                  }}
                >
                  {(
                    analytics.apiStats.totalDuration /
                    analytics.apiStats.totalRequests
                  ).toFixed(2)}
                  s
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ApiIcon sx={{ color: "info.main" }} />
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Analysis Types
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "info.main",
                  fontFamily: brand.fonts.heading,
                }}
              >
                {Object.keys(analytics.analysisTypeBreakdown).length}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CreditCardIcon sx={{ color: "error.main" }} />
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Total Credits
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "error.main",
                  fontFamily: brand.fonts.heading,
                }}
              >
                {formatCredits(
                  analytics.totalCredits +
                    (hasApiStats ? analytics.apiStats.totalCredits : 0)
                )}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
