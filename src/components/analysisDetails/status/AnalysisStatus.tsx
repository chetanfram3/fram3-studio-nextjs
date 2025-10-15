"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import { getCurrentBrand } from "@/config/brandConfig";
import { fetchAnalysisStatus } from "./api";
import StatusChip from "./StatusChip";
import SceneAccordion from "./SceneAccordion";
import ProgressCalculator from "./SceneProgressCalculator";
import type { AnalysisStatusResponse } from "@/types/analysisStatus";
import {
  ANALYSIS_TITLES,
  ANALYSIS_DEPENDENCIES,
  AnalysisType,
} from "@/config/analysisTypes";
import PromptGeneratorButton from "./generators/PromptGeneratorButton";
import ImageGeneratorButton from "./generators/ImageGeneratorButton";
import AvailableAnalysis from "./AvailableAnalysis";
import CompletedAnalyses from "./CompletedAnalysis";
import logger from "@/utils/logger";

/**
 * AnalysisStatus - Displays the status of script analysis operations
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Uses React Query for efficient data fetching and caching
 * - Automatic refetch with configurable intervals
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - Uses theme transitions for smooth interactions
 * - No hardcoded colors or spacing
 *
 * @param scriptId - The ID of the script being analyzed
 * @param versionId - The version ID of the script
 */

interface AnalysisStatusProps {
  scriptId: string;
  versionId: string;
}

interface StatusData {
  status: string;
  data?: unknown;
  creditInfo?: unknown;
  error?: string;
}

interface SceneData {
  sceneId: number;
  status: string;
  shots?: unknown[];
}

interface ActorImageData {
  actorId: string;
  actorVersionId: string;
  status: string;
}

interface LocationImageData {
  locationId: string;
  promptType: string;
  status: string;
}

export default function AnalysisStatus({
  scriptId,
  versionId,
}: AnalysisStatusProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [expanded, setExpanded] = useState<string | false>(false);
  const [isRefreshData, setIsRefreshData] = useState(true);
  const [completedAnalyses, setCompletedAnalyses] = useState<string[]>([]);
  const [fullyCompletedAnalyses, setFullyCompletedAnalyses] = useState<
    string[]
  >([]);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["analysisStatus", scriptId, versionId],
    queryFn: () => {
      logger.debug("Fetching analysis status", { scriptId, versionId });
      return fetchAnalysisStatus(scriptId, versionId);
    },
    refetchInterval: isRefreshData ? 5000 : false,
    enabled: Boolean(scriptId && versionId),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const calculateProgress = (statuses: AnalysisStatusResponse["statuses"]) => {
    const total = Object.keys(statuses).length;
    const completed = Object.values(statuses).filter(
      (status) => status.status === "Completed"
    ).length;
    return (completed / total) * 100;
  };

  const isAnalysisDisabled = (analysisType: AnalysisType): boolean => {
    const dependencies = ANALYSIS_DEPENDENCIES[analysisType];
    return (
      Array.isArray(dependencies) &&
      dependencies.some((dep) => !fullyCompletedAnalyses?.includes(dep))
    );
  };

  useEffect(() => {
    if (data?.statuses) {
      const isPromptGeneratorIncomplete =
        data.statuses.promptGenerator?.status === "Incomplete";

      const allStatusesCompleted = Object.values(data.statuses).every(
        (status) => status.status === "Completed"
      );

      const allCompletedExceptprocessedImages =
        Object.entries(data.statuses)
          .filter(
            ([key]) =>
              key !== "processedImages" && key !== "processScenesAndShots"
          )
          .every(([, status]) => status.status === "Completed") &&
        (data.statuses.processedImages?.status === "NotStarted" ||
          data.statuses.processScenesAndShots?.status === "NotStarted");

      const completed = Object.entries(data.statuses)
        .filter(
          ([, status]) =>
            status.status === "Completed" || status.status === "InProgress"
        )
        .map(([key]) => key);
      setCompletedAnalyses(completed);

      const fullyCompleted = Object.entries(data.statuses)
        .filter(([, status]) => status.status === "Completed")
        .map(([key]) => key);
      setFullyCompletedAnalyses(fullyCompleted);

      if (
        isPromptGeneratorIncomplete ||
        allStatusesCompleted ||
        allCompletedExceptprocessedImages
      ) {
        setIsRefreshData(false);
      } else {
        setIsRefreshData(true);
      }
    }
  }, [data]);

  const handleAccordionChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const renderAnalysisDetails = (type: string, status: StatusData) => {
    if (!status.data) {
      return (
        <Typography
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          No detailed status information available.
        </Typography>
      );
    }

    if (type === "processActorImages" || type === "actorProcessedImages") {
      return (
        <Box>
          {(status.data as ActorImageData[]).map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Actor {item.actorId} (Version {item.actorVersionId})
              </Typography>
              <StatusChip status={item.status} />
            </Box>
          ))}
        </Box>
      );
    }

    if (
      type === "processLocationImages" ||
      type === "locationProcessedImages"
    ) {
      return (
        <Box>
          {(status.data as LocationImageData[]).map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Location {item.locationId} ({item.promptType})
              </Typography>
              <StatusChip status={item.status} />
            </Box>
          ))}
        </Box>
      );
    }

    if (
      type === "shotMapper" ||
      type === "actorAnalysis" ||
      type === "locationMapper"
    ) {
      return (
        <Box>
          {(status.data as SceneData[]).map((scene) => (
            <Box
              key={scene.sceneId}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Scene {scene.sceneId}
              </Typography>
              <StatusChip status={scene.status} />
            </Box>
          ))}
        </Box>
      );
    }

    if (
      Array.isArray(status.data) &&
      status.data.length > 0 &&
      (status.data[0] as SceneData).shots
    ) {
      return <SceneAccordion scenes={status.data as SceneData[]} />;
    }

    return (
      <Typography color="text.secondary" sx={{ fontFamily: brand.fonts.body }}>
        Data structure not recognized for display.
      </Typography>
    );
  };

  if (isLoading) {
    logger.debug("Loading analysis status", {
      scriptId,
      versionId,
      isRefreshData,
    });
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontFamily: brand.fonts.heading,
            color: "text.primary",
            fontWeight: 600,
          }}
        >
          Analysis Status
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            fontFamily: brand.fonts.body,
          }}
        >
          Script: {scriptId} | Version: {versionId}
        </Typography>
        <LinearProgress
          sx={{
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.default",
            "& .MuiLinearProgress-bar": {
              bgcolor: "primary.main",
            },
          }}
        />
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderRadius: `${brand.borderRadius}px`,
          borderLeft: 4,
          borderColor: "error.main",
          fontFamily: brand.fonts.body,
        }}
      >
        Failed to fetch analysis status. Please try again.
      </Alert>
    );
  }

  if (!data?.statuses) {
    return (
      <Alert
        severity="info"
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderRadius: `${brand.borderRadius}px`,
          borderLeft: 4,
          borderColor: "primary.main",
          fontFamily: brand.fonts.body,
        }}
      >
        No analysis status information available.
      </Alert>
    );
  }

  const legacyMappings: Record<string, string> = {
    actorProcessedImages: "processActorImages",
    locationProcessedImages: "processLocationImages",
    keyVisualProcessedImage: "keyVisualProcessor",
    processedImages: "processScenesAndShots",
  };

  const getFilteredStatuses = (statuses: Record<string, StatusData>) => {
    const filtered: Record<string, StatusData> = {};
    const legacyAliases = Object.keys(legacyMappings);

    for (const [analysisType, status] of Object.entries(statuses)) {
      if (!legacyAliases.includes(analysisType)) {
        filtered[analysisType] = status;
      }
    }

    for (const [analysisType, status] of Object.entries(statuses)) {
      if (legacyAliases.includes(analysisType)) {
        const correctName = legacyMappings[analysisType];
        if (!filtered[correctName]) {
          filtered[analysisType] = status;
        }
      }
    }

    return filtered;
  };

  const filteredStatuses = getFilteredStatuses(data.statuses);
  const progress = calculateProgress(filteredStatuses);

  const getProgressColor = () => {
    if (progress === 100) return "success.light";
    if (progress >= 75) return "warning.light";
    if (progress >= 25) return "warning.main";
    return "error.light";
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 1,
        bgcolor: "background.paper",
        borderRadius: `${brand.borderRadius}px`,
        border: 1,
        borderColor: "divider",
        transition: theme.transitions.create(["box-shadow"], {
          duration: theme.transitions.duration.standard,
        }),
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: brand.fonts.heading,
            color: "text.primary",
            fontWeight: 600,
          }}
        >
          Status
        </Typography>
        <Tooltip title="Refresh Status">
          <IconButton
            onClick={() => refetch()}
            sx={{
              color: "primary.main",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ mb: 2 }}>
        <CompletedAnalyses
          scriptId={scriptId}
          versionId={versionId}
          completedAnalyses={completedAnalyses}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Overall Progress
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.default",
            "& .MuiLinearProgress-bar": {
              bgcolor: getProgressColor(),
              borderRadius: `${brand.borderRadius}px`,
            },
          }}
        />
      </Box>

      <Accordion
        sx={{
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          "&:before": { display: "none" },
          border: 1,
          borderColor: "divider",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}
          sx={{
            bgcolor: "background.paper",
            borderRadius: `${brand.borderRadius}px`,
          }}
        >
          <Typography
            sx={{ fontFamily: brand.fonts.body, color: "text.primary" }}
          >
            Details
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ bgcolor: "background.paper" }}>
          {Object.entries(filteredStatuses).map(([type, statusData]) => {
            const status = statusData as StatusData;

            return (
              <Accordion
                key={type}
                expanded={expanded === type}
                onChange={handleAccordionChange(type)}
                sx={{
                  mb: 1,
                  bgcolor: "background.default",
                  borderRadius: `${brand.borderRadius * 0.5}px`,
                  "&:before": { display: "none" },
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreIcon sx={{ color: "text.secondary" }} />
                  }
                  sx={{
                    bgcolor: "background.default",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      pr: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: brand.fonts.body,
                        color: "text.primary",
                      }}
                    >
                      {ANALYSIS_TITLES[type as keyof typeof ANALYSIS_TITLES] ||
                        type}
                    </Typography>

                    {type === "promptGenerator" && status.data && (
                      <>
                        <ProgressCalculator
                          scenes={status.data as SceneData[]}
                          title=""
                        />
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <PromptGeneratorButton
                            scriptId={scriptId}
                            versionId={versionId}
                            onStatusChange={(success) => {
                              if (success) setIsRefreshData(true);
                            }}
                            disabled={
                              !(
                                status.status === "Incomplete" ||
                                status.status === "NotStarted"
                              ) || isAnalysisDisabled(type as AnalysisType)
                            }
                          />
                        </Box>
                      </>
                    )}

                    {type === "processScenesAndShots" && status.data && (
                      <>
                        <ProgressCalculator
                          scenes={status.data as SceneData[]}
                          title=""
                        />
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <ImageGeneratorButton
                            scriptId={scriptId}
                            versionId={versionId}
                            onStatusChange={(success) => {
                              if (success) setIsRefreshData(true);
                            }}
                            disabled={
                              !(
                                status.status === "Incomplete" ||
                                status.status === "NotStarted"
                              ) || isAnalysisDisabled(type as AnalysisType)
                            }
                          />
                        </Box>
                      </>
                    )}

                    <StatusChip status={status.status} />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "background.default" }}>
                  {renderAnalysisDetails(type, status)}
                </AccordionDetails>
              </Accordion>
            );
          })}
          <AvailableAnalysis
            scriptId={scriptId}
            versionId={versionId}
            completedAnalyses={completedAnalyses}
          />
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
