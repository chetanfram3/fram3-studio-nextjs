"use client";

import { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Paper,
  alpha,
  Grid,
} from "@mui/material";
import { PieChart, BarChart } from "@mui/x-charts";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Token as TokenIcon,
  CreditCard as CreditCardIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";
import { AnalysisInProgress } from "@/components/common/AnalysisInProgress";
import { useScriptDashboardAnalysis } from "@/hooks/scripts/useScriptDashboardAnalysis";
import { ANALYSIS_TITLES, type AnalysisType } from "@/config/analysisTypes";

interface AnalyticsProps {
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

export default function Analytics({ scriptId, versionId }: AnalyticsProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

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

  if (!data || !data.success) {
    return (
      <AnalysisInProgress message="Analytics data is not available. Please check back later." />
    );
  }

  const analytics = data.data;

  // ==========================================
  // COMPUTED DATA (Memoized for performance)
  // ==========================================

  // Model data for charts
  const modelData = useMemo(
    () =>
      Object.entries(analytics.modelBreakdown).map(([model, stats]) => ({
        id: model.replace("gemini-", "").replace(/-(preview|001|\d{5})/g, ""),
        label: model
          .replace("gemini-", "")
          .replace(/-(preview|001|\d{5})/g, ""),
        value: stats.totalTokens,
        requests: stats.requests,
        inputTokens: stats.inputTokens,
        outputTokens: stats.outputTokens,
      })),
    [analytics.modelBreakdown]
  );

  // Analysis type data
  const analysisTypeData = useMemo(
    () =>
      Object.entries(analytics.analysisTypeBreakdown)
        .map(([type, stats]) => ({
          id: type,
          type: ANALYSIS_TITLES[type as AnalysisType] || type,
          requests: stats.requests,
          totalTokens: stats.totalTokens,
          inputTokens: stats.inputTokens,
          outputTokens: stats.outputTokens,
          efficiency:
            Math.round((stats.outputTokens / stats.inputTokens) * 100) / 100,
        }))
        .sort((a, b) => b.totalTokens - a.totalTokens),
    [analytics.analysisTypeBreakdown]
  );

  // Location data
  const locationChartData = useMemo(() => {
    const locationData = Object.values(analytics.analysisModelMapping).reduce(
      (acc, item) => {
        const location = item.location;
        if (!acc[location]) {
          acc[location] = { location, requests: 0, tokens: 0 };
        }
        acc[location].requests += item.requests;
        acc[location].tokens += item.totalTokens;
        return acc;
      },
      {} as Record<
        string,
        { location: string; requests: number; tokens: number }
      >
    );

    return Object.values(locationData).map((item, index) => ({
      id: index,
      location: item.location,
      requests: item.requests,
      tokens: item.tokens,
    }));
  }, [analytics.analysisModelMapping]);

  // Model comparison data
  const modelComparisonData = useMemo(
    () =>
      Object.entries(analytics.modelBreakdown).map(([model, stats]) => ({
        model: model
          .replace("gemini-", "")
          .replace(/-(preview|001|\d{5})/g, ""),
        inputTokens: stats.inputTokens,
        outputTokens: stats.outputTokens,
        efficiency: Number((stats.outputTokens / stats.inputTokens).toFixed(3)),
      })),
    [analytics.modelBreakdown]
  );

  // Pie chart colors using theme
  const pieColors = useMemo(
    () => [
      theme.palette.primary.main,
      alpha(theme.palette.primary.main, 0.8),
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
    ],
    [theme.palette]
  );

  // Table rows for detailed breakdown
  const tableRows = useMemo(
    () =>
      Object.entries(analytics.detailedAnalysisBreakdown).map(
        ([_key, analysis], index) => {
          const analysisStats =
            analytics.analysisTypeBreakdown[analysis.analysisType];

          return {
            id: index,
            analysisType:
              ANALYSIS_TITLES[analysis.analysisType as AnalysisType] ||
              analysis.analysisType,
            originalAnalysisType: analysis.analysisType,
            requests: analysis.totalRequests,
            inputTokens: analysisStats?.inputTokens || 0,
            outputTokens: analysisStats?.outputTokens || 0,
            totalTokens: analysis.totalTokens,
            avgTokensPerRequest: analysis.averageTokensPerRequest,
            efficiency: analysisStats
              ? (
                  analysisStats.outputTokens / analysisStats.inputTokens
                ).toFixed(3)
              : "0.000",
            cost: analysis.totalCost,
            credits: analysis.totalCredits,
            models: Object.keys(analysis.modelUsage)
              .map((model) =>
                model
                  .replace("gemini-", "")
                  .replace(/-(preview|001|\d{5})/g, "")
              )
              .join(", "),
            locations: [
              ...new Set(
                Object.values(analysis.modelUsage).map((m) => m.location)
              ),
            ].join(", "),
          };
        }
      ),
    [analytics.detailedAnalysisBreakdown, analytics.analysisTypeBreakdown]
  );

  // DataGrid columns
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "analysisType",
        headerName: "Analysis Type",
        width: 200,
        flex: 1,
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "primary.main" }}
          >
            {params.value}
          </Typography>
        ),
      },
      {
        field: "requests",
        headerName: "Requests",
        width: 100,
        type: "number",
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: "inputTokens",
        headerName: "Input Tokens",
        width: 130,
        type: "number",
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "info.main" }}
          >
            {(params.value as number).toLocaleString()}
          </Typography>
        ),
      },
      {
        field: "outputTokens",
        headerName: "Output Tokens",
        width: 130,
        type: "number",
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "success.main" }}
          >
            {(params.value as number).toLocaleString()}
          </Typography>
        ),
      },
      {
        field: "totalTokens",
        headerName: "Total Tokens",
        width: 130,
        type: "number",
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {(params.value as number).toLocaleString()}
          </Typography>
        ),
      },
      {
        field: "credits",
        headerName: "Credits",
        width: 120,
        type: "number",
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "warning.main" }}
          >
            {formatCredits(params.value as number)}
          </Typography>
        ),
      },
      {
        field: "efficiency",
        headerName: "Efficiency",
        width: 100,
        type: "number",
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            sx={{
              bgcolor: theme.palette.warning.main,
              color: theme.palette.warning.contrastText,
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
          />
        ),
      },
      {
        field: "avgTokensPerRequest",
        headerName: "Avg/Request",
        width: 120,
        type: "number",
        renderCell: (params) => (
          <Typography variant="body2">
            {Math.round(params.value as number).toLocaleString()}
          </Typography>
        ),
      },
      { field: "models", headerName: "Models Used", width: 200, flex: 1 },
      { field: "locations", headerName: "Locations", width: 200, flex: 1 },
    ],
    [theme.palette]
  );

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: "primary.main",
            fontFamily: brand.fonts.heading,
          }}
        >
          Token Analytics Dashboard
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          Comprehensive analysis of token usage, model performance, and system
          efficiency
        </Typography>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.1
              )}, ${alpha(theme.palette.primary.main, 0.05)})`,
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.2),
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  <TokenIcon sx={{ color: "primary.main" }} />
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      fontFamily: brand.fonts.heading,
                    }}
                  >
                    {analytics.totalTokens.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Total Tokens
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.1
              )}, ${alpha(theme.palette.primary.main, 0.05)})`,
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.2),
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  <SpeedIcon sx={{ color: "primary.main" }} />
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      fontFamily: brand.fonts.heading,
                    }}
                  >
                    {analytics.totalRequests}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Total Requests
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.info.main,
                0.1
              )}, ${alpha(theme.palette.info.main, 0.05)})`,
              border: 1,
              borderColor: alpha(theme.palette.info.main, 0.2),
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                  }}
                >
                  <MemoryIcon sx={{ color: "info.main" }} />
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: "info.main",
                      fontFamily: brand.fonts.heading,
                    }}
                  >
                    {analytics.totalInputTokens.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Total Input Tokens
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.success.main,
                0.1
              )}, ${alpha(theme.palette.success.main, 0.05)})`,
              border: 1,
              borderColor: alpha(theme.palette.success.main, 0.2),
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                  }}
                >
                  <TrendingUpIcon sx={{ color: "success.main" }} />
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: "success.main",
                      fontFamily: brand.fonts.heading,
                    }}
                  >
                    {analytics.totalOutputTokens.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Total Output Tokens
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.warning.main,
                0.1
              )}, ${alpha(theme.palette.warning.main, 0.05)})`,
              border: 1,
              borderColor: alpha(theme.palette.warning.main, 0.2),
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                  }}
                >
                  <SpeedIcon sx={{ color: "warning.main" }} />
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: "warning.main",
                      fontFamily: brand.fonts.heading,
                    }}
                  >
                    {Math.round(
                      analytics.totalTokens / analytics.totalRequests
                    ).toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Avg Tokens/Request
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.error.main,
                0.1
              )}, ${alpha(theme.palette.error.main, 0.05)})`,
              border: 1,
              borderColor: alpha(theme.palette.error.main, 0.2),
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                  }}
                >
                  <PsychologyIcon sx={{ color: "error.main" }} />
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: "error.main",
                      fontFamily: brand.fonts.heading,
                    }}
                  >
                    {(
                      analytics.totalOutputTokens / analytics.totalInputTokens
                    ).toFixed(3)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Overall Efficiency
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.success.main,
                0.15
              )}, ${alpha(theme.palette.success.main, 0.05)})`,
              border: 1,
              borderColor: alpha(theme.palette.success.main, 0.3),
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                  }}
                >
                  <CreditCardIcon sx={{ color: "success.main" }} />
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: "success.main",
                      fontFamily: brand.fonts.heading,
                    }}
                  >
                    {formatCredits(analytics.totalCredits)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Total Credits
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Input/Output Token Breakdown per Model */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.entries(analytics.modelBreakdown).map(([model, stats]) => {
          return (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={model}>
              <Card
                sx={{
                  height: "100%",
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.05
                  )}, ${alpha(theme.palette.primary.main, 0.02)})`,
                  border: 1,
                  borderColor: alpha(theme.palette.divider, 0.1),
                  borderRadius: `${brand.borderRadius}px`,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: "primary.main",
                      fontFamily: brand.fonts.heading,
                    }}
                  >
                    {model
                      .replace("gemini-", "")
                      .replace(/-(preview|001|\d{5})/g, "")}
                  </Typography>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: `${brand.borderRadius * 0.5}px`,
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: "primary.main",
                          fontFamily: brand.fonts.heading,
                        }}
                      >
                        {stats.totalTokens.toLocaleString()}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        Total Tokens
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1.5,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        borderRadius: `${brand.borderRadius * 0.5}px`,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            bgcolor: theme.palette.info.main,
                            borderRadius: "50%",
                          }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          Input Tokens
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: "info.main",
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        {stats.inputTokens.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1.5,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        borderRadius: `${brand.borderRadius * 0.5}px`,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            bgcolor: theme.palette.success.main,
                            borderRadius: "50%",
                          }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          Output Tokens
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: "success.main",
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        {stats.outputTokens.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1.5,
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        borderRadius: `${brand.borderRadius * 0.5}px`,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            bgcolor: theme.palette.error.main,
                            borderRadius: "50%",
                          }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          Total Credits
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: "error.main",
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        {formatCredits(stats.credits)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1.5,
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        borderRadius: `${brand.borderRadius * 0.5}px`,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        Output/Input Ratio
                      </Typography>
                      <Chip
                        label={`${(
                          stats.outputTokens / stats.inputTokens
                        ).toFixed(3)}`}
                        size="small"
                        sx={{
                          bgcolor: theme.palette.warning.main,
                          color: theme.palette.warning.contrastText,
                          fontWeight: 600,
                          fontFamily: brand.fonts.body,
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: `${brand.borderRadius * 0.5}px`,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        Requests
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: "primary.main",
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        {stats.requests}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* All Analysis Types by Token Usage */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={12}>
          <Paper
            sx={{
              p: 3,
              height: 600,
              width: "100%",
              borderRadius: `${brand.borderRadius}px`,
              bgcolor: "background.paper",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                fontFamily: brand.fonts.heading,
                color: "text.primary",
              }}
            >
              All Analysis Types by Token Usage
            </Typography>
            <Box sx={{ width: "100%", height: "calc(100% - 40px)" }}>
              <BarChart
                dataset={analysisTypeData}
                xAxis={[
                  {
                    scaleType: "band",
                    dataKey: "type",
                    tickLabelStyle: {
                      angle: -45,
                      textAnchor: "end",
                      fontSize: 11,
                    },
                  },
                ]}
                yAxis={[
                  {
                    label: "Tokens (K)",
                    valueFormatter: (value: number) =>
                      `${(value / 1000).toFixed(0)}K`,
                  },
                ]}
                series={[
                  {
                    dataKey: "inputTokens",
                    label: "Input Tokens",
                    color: theme.palette.info.main,
                    stack: "tokens",
                  },
                  {
                    dataKey: "outputTokens",
                    label: "Output Tokens",
                    color: theme.palette.success.main,
                    stack: "tokens",
                  },
                ]}
                width={undefined}
                height={520}
                margin={{ left: 80, right: 30, top: 40, bottom: 120 }}
                slotProps={{
                  legend: {
                    direction: "horizontal",
                    position: { vertical: "top", horizontal: "center" },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              height: 500,
              width: "100%",
              borderRadius: `${brand.borderRadius}px`,
              bgcolor: "background.paper",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                fontFamily: brand.fonts.heading,
                color: "text.primary",
              }}
            >
              Total Token Distribution by Model
            </Typography>
            <Box sx={{ width: "100%", height: "calc(100% - 40px)" }}>
              <PieChart
                series={[
                  {
                    data: modelData,
                    highlightScope: { fade: "global", highlight: "item" },
                    faded: {
                      innerRadius: 30,
                      additionalRadius: -30,
                      color: "gray",
                    },
                    valueFormatter: (value: { value: number }) =>
                      `${value.value.toLocaleString()} tokens`,
                  },
                ]}
                colors={pieColors}
                width={undefined}
                height={420}
                slotProps={{
                  legend: {
                    direction: "horizontal",
                    position: { vertical: "bottom", horizontal: "center" },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              height: 500,
              width: "100%",
              borderRadius: `${brand.borderRadius}px`,
              bgcolor: "background.paper",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                fontFamily: brand.fonts.heading,
                color: "text.primary",
              }}
            >
              Geographic Distribution
            </Typography>
            <Box sx={{ width: "100%", height: "calc(100% - 40px)" }}>
              <BarChart
                dataset={locationChartData}
                xAxis={[
                  {
                    scaleType: "band",
                    dataKey: "location",
                    tickLabelStyle: {
                      angle: -45,
                      textAnchor: "end",
                      fontSize: 11,
                    },
                  },
                ]}
                yAxis={[{ label: "Requests" }]}
                series={[
                  {
                    dataKey: "requests",
                    label: "Requests",
                    color: theme.palette.primary.main,
                  },
                ]}
                width={undefined}
                height={420}
                margin={{ left: 60, right: 30, top: 40, bottom: 100 }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Second row of charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              height: 550,
              width: "100%",
              borderRadius: `${brand.borderRadius}px`,
              bgcolor: "background.paper",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                fontFamily: brand.fonts.heading,
                color: "text.primary",
              }}
            >
              Input vs Output Tokens Breakdown by Model
            </Typography>
            <Box sx={{ width: "100%", height: "calc(100% - 40px)" }}>
              <BarChart
                dataset={modelComparisonData}
                xAxis={[
                  {
                    scaleType: "band",
                    dataKey: "model",
                    tickLabelStyle: {
                      angle: -45,
                      textAnchor: "end",
                      fontSize: 11,
                    },
                  },
                ]}
                yAxis={[
                  {
                    label: "Tokens (K)",
                    valueFormatter: (value: number) =>
                      `${(value / 1000).toFixed(0)}K`,
                  },
                ]}
                series={[
                  {
                    dataKey: "inputTokens",
                    label: "Input Tokens",
                    color: theme.palette.info.main,
                  },
                  {
                    dataKey: "outputTokens",
                    label: "Output Tokens",
                    color: theme.palette.success.main,
                  },
                ]}
                width={undefined}
                height={490}
                margin={{ left: 80, right: 30, top: 40, bottom: 120 }}
                slotProps={{
                  legend: {
                    direction: "horizontal",
                    position: { vertical: "top", horizontal: "center" },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              height: 550,
              width: "100%",
              borderRadius: `${brand.borderRadius}px`,
              bgcolor: "background.paper",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
                fontFamily: brand.fonts.heading,
                color: "text.primary",
              }}
            >
              Token Efficiency by Model (Output/Input Ratio)
            </Typography>
            <Box sx={{ width: "100%", height: "calc(100% - 40px)" }}>
              <BarChart
                dataset={modelComparisonData}
                xAxis={[
                  {
                    scaleType: "band",
                    dataKey: "model",
                    tickLabelStyle: {
                      angle: -45,
                      textAnchor: "end",
                      fontSize: 11,
                    },
                  },
                ]}
                yAxis={[{ label: "Efficiency Ratio" }]}
                series={[
                  {
                    dataKey: "efficiency",
                    label: "Efficiency Ratio",
                    color: theme.palette.warning.main,
                  },
                ]}
                width={undefined}
                height={490}
                margin={{ left: 80, right: 30, top: 40, bottom: 120 }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Model Performance Summary Table */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 600,
            fontFamily: brand.fonts.heading,
            color: "text.primary",
          }}
        >
          Model Performance Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid size={12}>
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }}
                  >
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontFamily: brand.fonts.heading,
                      }}
                    >
                      Model
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontFamily: brand.fonts.heading,
                      }}
                    >
                      Requests
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontFamily: brand.fonts.heading,
                      }}
                    >
                      Input Tokens
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontFamily: brand.fonts.heading,
                      }}
                    >
                      Output Tokens
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontFamily: brand.fonts.heading,
                      }}
                    >
                      Total Tokens
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontFamily: brand.fonts.heading,
                      }}
                    >
                      Credits
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontFamily: brand.fonts.heading,
                      }}
                    >
                      Efficiency
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontFamily: brand.fonts.heading,
                      }}
                    >
                      Avg/Request
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.modelBreakdown).map(
                    ([model, stats], index) => {
                      return (
                        <tr
                          key={model}
                          style={{
                            backgroundColor:
                              index % 2 === 0
                                ? "transparent"
                                : alpha(theme.palette.action.hover, 0.05),
                            borderBottom: `1px solid ${alpha(
                              theme.palette.divider,
                              0.1
                            )}`,
                          }}
                        >
                          <td
                            style={{
                              padding: "12px",
                              fontWeight: 600,
                              color: theme.palette.primary.main,
                              fontFamily: brand.fonts.body,
                            }}
                          >
                            {model
                              .replace("gemini-", "")
                              .replace(/-(preview|001|\d{5})/g, "")}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              fontFamily: brand.fonts.body,
                            }}
                          >
                            {stats.requests}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              color: theme.palette.info.main,
                              fontWeight: 600,
                              fontFamily: brand.fonts.body,
                            }}
                          >
                            {stats.inputTokens.toLocaleString()}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              color: theme.palette.success.main,
                              fontWeight: 600,
                              fontFamily: brand.fonts.body,
                            }}
                          >
                            {stats.outputTokens.toLocaleString()}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              fontWeight: 600,
                              fontFamily: brand.fonts.body,
                            }}
                          >
                            {stats.totalTokens.toLocaleString()}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              fontFamily: brand.fonts.body,
                            }}
                          >
                            <div
                              style={{
                                color: theme.palette.warning.main,
                                fontWeight: 600,
                              }}
                            >
                              {formatCredits(stats.credits)}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              fontFamily: brand.fonts.body,
                            }}
                          >
                            {(stats.outputTokens / stats.inputTokens).toFixed(
                              3
                            )}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              fontFamily: brand.fonts.body,
                            }}
                          >
                            {Math.round(
                              stats.totalTokens / stats.requests
                            ).toLocaleString()}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Detailed Analysis Table */}
      <Paper
        sx={{
          p: 3,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 600,
            fontFamily: brand.fonts.heading,
            color: "text.primary",
          }}
        >
          Detailed Analysis Breakdown
        </Typography>
        <Box sx={{ height: 700, width: "100%" }}>
          <DataGrid
            rows={tableRows}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { pageSize: 15 } },
            }}
            pageSizeOptions={[15, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-root": { border: "none" },
              "& .MuiDataGrid-cell": {
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                fontSize: "0.875rem",
              },
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderBottom: `2px solid ${theme.palette.primary.main}`,
                fontWeight: 600,
                fontSize: "0.875rem",
              },
              "& .MuiDataGrid-row:hover": {
                bgcolor: alpha(theme.palette.action.hover, 0.1),
              },
              "& .MuiDataGrid-row": {
                "&:nth-of-type(even)": {
                  bgcolor: alpha(theme.palette.action.hover, 0.02),
                },
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
