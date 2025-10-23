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
import type {
  AnalysisStatusResponse,
  StatusType,
  ShotStatus,
} from "@/types/analysisStatus";
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
  status: StatusType;
  data?: unknown;
  creditInfo?: unknown;
  error?: string;
}

interface SceneData {
  sceneId?: number;
  sceneID?: number;
  status: StatusType;
  shots?: unknown[];
}

interface ActorImageData {
  actorId: string;
  actorVersionId: string;
  status: StatusType;
}

interface LocationImageData {
  locationId: string;
  promptType: string;
  status: StatusType;
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

  const calculateProgress = (statuses: Record<string, StatusData>) => {
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
      const actorImages = status.data as ActorImageData[];
      return (
        <Box>
          {actorImages.map((item, index) => (
            <Box
              key={`actor-${item.actorId}-${item.actorVersionId}-${index}`}
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
      const locationImages = status.data as LocationImageData[];
      return (
        <Box>
          {locationImages.map((item, index) => (
            <Box
              key={`location-${item.locationId}-${item.promptType}-${index}`}
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
      const scenes = status.data as SceneData[];
      return (
        <Box>
          {scenes.map((scene, index) => (
            <Box
              key={`${scene.sceneId}-${index}`}
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

    if (type === "promptGenerator" || type === "processScenesAndShots") {
      const scenes = status.data as SceneData[];
      // Map to SceneStatus format with proper ShotStatus type
      const sceneStatuses = scenes.map((scene) => ({
        sceneID: scene.sceneID ?? scene.sceneId ?? 0,
        status: scene.status,
        shots: (scene.shots ?? []) as ShotStatus[],
      }));
      return (
        <Box>
          <SceneAccordion scenes={sceneStatuses} />
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="body2" color="text.secondary">
          {JSON.stringify(status.data, null, 2)}
        </Typography>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Alert severity="info" sx={{ borderRadius: `${brand.borderRadius}px` }}>
        Loading analysis status...
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: `${brand.borderRadius}px` }}>
        Failed to load analysis status.
      </Alert>
    );
  }

  if (!data?.statuses) {
    return (
      <Alert severity="info" sx={{ borderRadius: `${brand.borderRadius}px` }}>
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
                {/* ✅ FIXED: AccordionSummary - Only title, progress, and status chip */}
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
                    {/* Title */}
                    <Typography
                      sx={{
                        fontFamily: brand.fonts.body,
                        color: "text.primary",
                        flex: 1,
                      }}
                    >
                      {ANALYSIS_TITLES[type as keyof typeof ANALYSIS_TITLES] ||
                        type}
                    </Typography>

                    {/* Progress Calculator (only for prompt and image generators) */}
                    {(type === "promptGenerator" ||
                      type === "processScenesAndShots") &&
                    status.data &&
                    Array.isArray(status.data) ? (
                      <ProgressCalculator
                        scenes={(status.data as SceneData[]).map((scene) => ({
                          sceneID: scene.sceneID ?? scene.sceneId ?? 0,
                          status: scene.status,
                          shots: (scene.shots ?? []) as ShotStatus[],
                        }))}
                        title=""
                      />
                    ) : null}

                    {/* Status Chip */}
                    <StatusChip status={status.status} />
                  </Box>
                </AccordionSummary>

                {/* ✅ FIXED: AccordionDetails - Generator buttons moved here */}
                <AccordionDetails sx={{ bgcolor: "background.default" }}>
                  {/* Generator Buttons - Now OUTSIDE the button element */}
                  {type === "promptGenerator" &&
                  status.data &&
                  Array.isArray(status.data) ? (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        mb: 2,
                        justifyContent: "flex-end",
                      }}
                    >
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
                  ) : null}

                  {type === "processScenesAndShots" &&
                  status.data &&
                  Array.isArray(status.data) ? (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        mb: 2,
                        justifyContent: "flex-end",
                      }}
                    >
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
                  ) : null}

                  {/* Analysis Details */}
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
