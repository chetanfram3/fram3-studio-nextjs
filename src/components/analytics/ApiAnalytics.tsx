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
  AccessTime as AccessTimeIcon,
  Api as ApiIcon,
  CloudQueue as CloudIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Memory as MemoryIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";
import { Images, AudioLines, SquarePen, Film, Cpu } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

interface ApiStatsData {
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
}

interface ApiAnalyticsProps {
  apiStats: ApiStatsData;
}

const formatCredits = (credits: number): string => {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  } else if (credits > 10000) {
    return `${(credits / 1000).toFixed(1)}K`;
  }
  return credits.toString();
};

const formatDuration = (duration: number): string => {
  if (duration >= 60) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds.toFixed(1)}s`;
  }
  return `${duration.toFixed(1)}s`;
};

const formatRequestDuration = (duration: number): string => {
  if (duration >= 1000) {
    return `${(duration / 1000).toFixed(2)}s`;
  }
  return `${duration.toFixed(0)}ms`;
};

export default function ApiAnalytics({ apiStats }: ApiAnalyticsProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // COMPUTED DATA (Memoized for performance)
  // ==========================================

  // Provider data for charts
  const providerData = useMemo(
    () =>
      Object.entries(apiStats.providerBreakdown).map(([provider, stats]) => ({
        id: provider,
        label: provider.charAt(0).toUpperCase() + provider.slice(1),
        value: stats.requests,
        duration: stats.totalDuration,
        requestDuration: stats.totalRequestDuration,
        cost: stats.totalCost,
        credits: stats.totalCredits,
        avgDuration: stats.totalDuration / stats.requests,
        avgRequestDuration: stats.averageRequestDuration,
      })),
    [apiStats.providerBreakdown]
  );

  // API Type data for charts
  const apiTypeData = useMemo(
    () =>
      Object.entries(apiStats.apiTypeBreakdown).map(([apiType, stats]) => ({
        id: apiType,
        apiType: apiType.replace(/_/g, " ").toUpperCase(),
        requests: stats.requests,
        duration: stats.totalDuration,
        requestDuration: stats.totalRequestDuration,
        cost: stats.totalCost,
        credits: stats.totalCredits,
        avgDuration: stats.totalDuration / stats.requests,
        avgRequestDuration: stats.averageRequestDuration,
        providers: stats.providers.join(", "),
      })),
    [apiStats.apiTypeBreakdown]
  );

  // Analysis Type data for charts
  const analysisTypeData = useMemo(
    () =>
      Object.entries(apiStats.analysisTypeBreakdown).map(
        ([analysisType, stats]) => ({
          id: analysisType,
          analysisType:
            analysisType.charAt(0).toUpperCase() + analysisType.slice(1),
          requests: stats.requests,
          duration: stats.totalDuration,
          requestDuration: stats.totalRequestDuration,
          cost: stats.totalCost,
          credits: stats.totalCredits,
          avgDuration: stats.totalDuration / stats.requests,
          avgRequestDuration: stats.averageRequestDuration,
          apiTypes: stats.apiTypes.join(", "),
          providers: stats.providers.join(", "),
        })
      ),
    [apiStats.analysisTypeBreakdown]
  );

  // Pie chart colors using theme
  const pieColors = useMemo(
    () => [
      theme.palette.primary.main,
      alpha(theme.palette.primary.main, 0.8),
      alpha(theme.palette.primary.main, 0.6),
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
      alpha(theme.palette.primary.main, 0.4),
    ],
    [theme.palette]
  );

  // Table data for detailed breakdown
  const tableRows = useMemo(
    () =>
      Object.entries(apiStats.detailedBreakdown).map(
        ([_key, breakdown], index) => ({
          id: index,
          analysisType:
            breakdown.analysisType.charAt(0).toUpperCase() +
            breakdown.analysisType.slice(1),
          provider:
            breakdown.provider.charAt(0).toUpperCase() +
            breakdown.provider.slice(1),
          model: breakdown.model,
          apiType: breakdown.apiType.replace(/_/g, " ").toUpperCase(),
          requests: breakdown.requests,
          totalDuration: breakdown.totalDuration,
          averageDuration: breakdown.averageDuration,
          totalRequestDuration: breakdown.totalRequestDuration,
          averageRequestDuration: breakdown.averageRequestDuration,
          totalCost: breakdown.totalCost,
          totalCredits: breakdown.totalCredits,
          averageCost: breakdown.totalCost / breakdown.requests,
          averageCredits: Math.round(
            breakdown.totalCredits / breakdown.requests
          ),
        })
      ),
    [apiStats.detailedBreakdown]
  );

  // DataGrid columns
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "analysisType",
        headerName: "Analysis Type",
        width: 150,
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
        field: "provider",
        headerName: "Provider",
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              fontWeight: 600,
            }}
          />
        ),
      },
      {
        field: "model",
        headerName: "Model",
        width: 180,
        flex: 1,
      },
      {
        field: "apiType",
        headerName: "API Type",
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 500,
              borderColor: "primary.main",
              color: "text.primary",
            }}
          />
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
        field: "totalDuration",
        headerName: "Media Duration",
        width: 150,
        type: "number",
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "info.main" }}
          >
            {formatDuration(params.value as number)}
          </Typography>
        ),
      },
      {
        field: "totalRequestDuration",
        headerName: "Request Duration",
        width: 150,
        type: "number",
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "primary.main" }}
          >
            {formatRequestDuration(params.value as number)}
          </Typography>
        ),
      },
      {
        field: "averageDuration",
        headerName: "Avg Media",
        width: 130,
        type: "number",
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "warning.main" }}
          >
            {formatDuration(params.value as number)}
          </Typography>
        ),
      },
      {
        field: "averageRequestDuration",
        headerName: "Avg Request",
        width: 130,
        type: "number",
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "success.main" }}
          >
            {formatRequestDuration(params.value as number)}
          </Typography>
        ),
      },
      {
        field: "totalCredits",
        headerName: "Total Credits",
        width: 140,
        type: "number",
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "success.main" }}
          >
            {formatCredits(params.value as number)}
          </Typography>
        ),
      },
      {
        field: "averageCredits",
        headerName: "Avg Credits",
        width: 130,
        type: "number",
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "info.main" }}
          >
            {formatCredits(params.value as number)}
          </Typography>
        ),
      },
    ],
    [theme.palette]
  );

  // Helper function to get analysis type info
  const getAnalysisTypeInfo = (type: string) => {
    switch (type.toLowerCase()) {
      case "processscenesandshots":
        return {
          name: "Scenes & Shots",
          icon: Images,
          color: theme.palette.primary.main,
          bgColor: alpha(theme.palette.primary.main, 0.1),
        };
      case "audioprocessor":
        return {
          name: "Audio Processor",
          icon: AudioLines,
          color: theme.palette.primary.main,
          bgColor: alpha(theme.palette.primary.main, 0.1),
        };
      case "processlocationimages":
        return {
          name: "Location Images",
          icon: SquarePen,
          color: theme.palette.success.main,
          bgColor: alpha(theme.palette.success.main, 0.1),
        };
      case "processactorimages":
        return {
          name: "Actor Images",
          icon: Film,
          color: theme.palette.warning.main,
          bgColor: alpha(theme.palette.warning.main, 0.1),
        };
      case "keyvisualprocessor":
        return {
          name: "Key Visual",
          icon: Film,
          color: theme.palette.error.main,
          bgColor: alpha(theme.palette.error.main, 0.1),
        };
      default:
        return {
          name: type.charAt(0).toUpperCase() + type.slice(1),
          icon: Cpu,
          color: theme.palette.info.main,
          bgColor: alpha(theme.palette.info.main, 0.1),
        };
    }
  };

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
          Media Analytics Dashboard
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          Comprehensive analysis of API performance, provider usage, request
          timing, and costs
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
                  <ApiIcon sx={{ color: "primary.main" }} />
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
                    {apiStats.totalRequests}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Total API Requests
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
                  <AccessTimeIcon sx={{ color: "primary.main" }} />
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
                    {formatDuration(apiStats.totalDuration)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Total Media Duration
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
                  <SpeedIcon sx={{ color: "info.main" }} />
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
                    {formatRequestDuration(apiStats.totalRequestDuration)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Total Request Duration
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
                  <CloudIcon sx={{ color: "success.main" }} />
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
                    {Object.keys(apiStats.providerBreakdown).length}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Active Providers
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
                  <TrendingUpIcon sx={{ color: "warning.main" }} />
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
                    {formatRequestDuration(apiStats.averageRequestDuration)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Avg Request Duration
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
                  <MemoryIcon sx={{ color: "error.main" }} />
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
                    {formatDuration(
                      apiStats.totalDuration / apiStats.totalRequests
                    )}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Avg Media/Request
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
                    {formatCredits(apiStats.totalCredits)}
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

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.info.main,
                0.15
              )}, ${alpha(theme.palette.info.main, 0.05)})`,
              border: 1,
              borderColor: alpha(theme.palette.info.main, 0.3),
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                    bgcolor: alpha(theme.palette.info.main, 0.15),
                  }}
                >
                  <AccountBalanceIcon sx={{ color: "info.main" }} />
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
                    {formatCredits(
                      Math.round(apiStats.totalCredits / apiStats.totalRequests)
                    )}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Avg Credits/Request
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analysis Type Performance Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.entries(apiStats.analysisTypeBreakdown).map(
          ([analysisType, stats]) => {
            const typeInfo = getAnalysisTypeInfo(analysisType);
            const IconComponent = typeInfo.icon;

            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={analysisType}>
                <Card
                  sx={{
                    height: "100%",
                    background: `linear-gradient(135deg, ${typeInfo.bgColor}, ${alpha(
                      typeInfo.color,
                      0.05
                    )})`,
                    border: 1,
                    borderColor: alpha(typeInfo.color, 0.2),
                    borderRadius: `${brand.borderRadius}px`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: `${brand.borderRadius * 0.5}px`,
                          bgcolor: typeInfo.bgColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconComponent size={24} color={typeInfo.color} />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: typeInfo.color,
                          fontFamily: brand.fonts.heading,
                        }}
                      >
                        {typeInfo.name}
                      </Typography>
                    </Box>

                    <Stack spacing={2}>
                      {/* Total Requests */}
                      <Box
                        sx={{
                          textAlign: "center",
                          p: 2,
                          bgcolor: typeInfo.bgColor,
                          borderRadius: `${brand.borderRadius * 0.5}px`,
                        }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            color: typeInfo.color,
                            fontFamily: brand.fonts.heading,
                          }}
                        >
                          {stats.requests}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          Total Requests
                        </Typography>
                      </Box>

                      {/* Media Duration */}
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
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          Media Duration
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: "info.main",
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          {formatDuration(stats.totalDuration)}
                        </Typography>
                      </Box>

                      {/* Request Duration */}
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
                          Request Duration
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: "primary.main",
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          {formatRequestDuration(stats.totalRequestDuration)}
                        </Typography>
                      </Box>

                      {/* Average Request Duration */}
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
                          Avg Request Duration
                        </Typography>
                        <Chip
                          label={formatRequestDuration(
                            stats.averageRequestDuration
                          )}
                          size="small"
                          sx={{
                            bgcolor: theme.palette.warning.main,
                            color: theme.palette.warning.contrastText,
                            fontWeight: 600,
                            fontFamily: brand.fonts.body,
                          }}
                        />
                      </Box>

                      {/* Providers */}
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          borderRadius: `${brand.borderRadius * 0.5}px`,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          Providers Used
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          {stats.providers
                            .map(
                              (provider) =>
                                provider.charAt(0).toUpperCase() +
                                provider.slice(1)
                            )
                            .join(", ")}
                        </Typography>
                      </Box>

                      {/* API Types */}
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          borderRadius: `${brand.borderRadius * 0.5}px`,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          API Types
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          {stats.apiTypes
                            .map((type) =>
                              type.replace(/_/g, " ").toUpperCase()
                            )
                            .join(", ")}
                        </Typography>
                      </Box>

                      {/* Total Credits */}
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
                            color: "success.main",
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          {formatCredits(stats.totalCredits)}
                        </Typography>
                      </Box>

                      {/* Average Credits */}
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
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontFamily: brand.fonts.body }}
                        >
                          Avg Credits/Request
                        </Typography>
                        <Chip
                          label={formatCredits(
                            Math.round(stats.totalCredits / stats.requests)
                          )}
                          size="small"
                          sx={{
                            bgcolor: theme.palette.info.main,
                            color: theme.palette.info.contrastText,
                            fontWeight: 600,
                            fontFamily: brand.fonts.body,
                          }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          }
        )}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Request Distribution by Provider */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              height: 500,
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
              Request Distribution by Provider
            </Typography>
            <Box sx={{ width: "100%", height: "calc(100% - 40px)" }}>
              <PieChart
                series={[
                  {
                    data: providerData,
                    highlightScope: { fade: "global", highlight: "item" },
                    faded: {
                      innerRadius: 30,
                      additionalRadius: -30,
                      color: "gray",
                    },
                    valueFormatter: (value: { value: number }) =>
                      `${value.value} requests`,
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

        {/* Media Duration by API Type */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              height: 500,
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
              Media Duration by API Type
            </Typography>
            <Box sx={{ width: "100%", height: "calc(100% - 40px)" }}>
              <BarChart
                dataset={apiTypeData}
                xAxis={[
                  {
                    scaleType: "band",
                    dataKey: "apiType",
                    tickLabelStyle: {
                      angle: -45,
                      textAnchor: "end",
                      fontSize: 11,
                    },
                  },
                ]}
                yAxis={[
                  {
                    label: "Media Duration (s)",
                  },
                ]}
                series={[
                  {
                    dataKey: "duration",
                    label: "Total Media Duration",
                    color: theme.palette.primary.main,
                  },
                ]}
                width={undefined}
                height={420}
                margin={{ left: 80, right: 30, top: 40, bottom: 100 }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Second row of charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Media vs Request Duration Comparison */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              height: 550,
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
              Media vs Request Duration by Analysis Type
            </Typography>
            <Box sx={{ width: "100%", height: "calc(100% - 40px)" }}>
              <BarChart
                dataset={analysisTypeData}
                xAxis={[
                  {
                    scaleType: "band",
                    dataKey: "analysisType",
                    tickLabelStyle: {
                      angle: -45,
                      textAnchor: "end",
                      fontSize: 11,
                    },
                  },
                ]}
                yAxis={[
                  {
                    label: "Duration (s)",
                  },
                ]}
                series={[
                  {
                    dataKey: "duration",
                    label: "Media Duration",
                    color: theme.palette.info.main,
                  },
                  {
                    dataKey: "requestDuration",
                    label: "Request Duration",
                    color: theme.palette.primary.main,
                    valueFormatter: (value: number | null) =>
                      value !== null ? `${formatRequestDuration(value)}` : "",
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

        {/* Average Request Duration by Provider */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              height: 550,
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
              Average Request Duration by Provider
            </Typography>
            <Box sx={{ width: "100%", height: "calc(100% - 40px)" }}>
              <BarChart
                dataset={providerData}
                xAxis={[
                  {
                    scaleType: "band",
                    dataKey: "label",
                    tickLabelStyle: {
                      angle: -45,
                      textAnchor: "end",
                      fontSize: 11,
                    },
                  },
                ]}
                yAxis={[
                  {
                    label: "Avg Request Duration (ms)",
                  },
                ]}
                series={[
                  {
                    dataKey: "avgRequestDuration",
                    label: "Average Request Duration",
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

      {/* Credits Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Credits Distribution by Provider */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              height: 500,
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
              Credits Distribution by Provider
            </Typography>
            <Box sx={{ width: "100%", height: "calc(100% - 40px)" }}>
              <PieChart
                series={[
                  {
                    data: Object.entries(
                      apiStats.creditBreakdown.byProvider
                    ).map(([provider, data]) => ({
                      id: provider,
                      label:
                        provider.charAt(0).toUpperCase() + provider.slice(1),
                      value: data.credits,
                    })),
                    highlightScope: { fade: "global", highlight: "item" },
                    faded: {
                      innerRadius: 30,
                      additionalRadius: -30,
                      color: "gray",
                    },
                    valueFormatter: (value: { value: number }) =>
                      `${formatCredits(value.value)} Credits`,
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

        {/* Credits by API Type */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper
            sx={{
              p: 3,
              height: 500,
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
              Credits by API Type
            </Typography>
            <Box sx={{ width: "100%", height: "calc(100% - 40px)" }}>
              <BarChart
                dataset={Object.entries(apiStats.creditBreakdown.byApiType).map(
                  ([apiType, data]) => ({
                    apiType: apiType.replace(/_/g, " ").toUpperCase(),
                    credits: data.credits,
                    requests: data.requests,
                    avgCredits: data.credits / data.requests,
                  })
                )}
                xAxis={[
                  {
                    scaleType: "band",
                    dataKey: "apiType",
                    tickLabelStyle: {
                      angle: -45,
                      textAnchor: "end",
                      fontSize: 11,
                    },
                  },
                ]}
                yAxis={[
                  {
                    label: "Credits",
                    valueFormatter: (value: number | null) =>
                      value !== null ? formatCredits(value) : "",
                  },
                ]}
                series={[
                  {
                    dataKey: "credits",
                    label: "Total Credits",
                    color: theme.palette.success.main,
                    valueFormatter: (value: number | null) =>
                      value !== null ? formatCredits(value) : "",
                  },
                ]}
                width={undefined}
                height={420}
                margin={{ left: 80, right: 30, top: 40, bottom: 100 }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed API Breakdown Table */}
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
          Detailed Media API Breakdown
        </Typography>
        <Box sx={{ height: 700, width: "100%" }}>
          <DataGrid
            rows={tableRows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 15 },
              },
            }}
            pageSizeOptions={[15, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-root": {
                border: "none",
              },
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
