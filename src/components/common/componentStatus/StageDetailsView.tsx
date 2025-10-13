"use client";

import { useState, useMemo, useCallback } from "react";
import { Box, Typography, IconButton, Chip, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { InfoOutlined as InfoIcon } from "@mui/icons-material";
import { getStatusColor, getStatusText } from "@/utils/pipelineUtils";

// Import stage icons
import HistoryEduIcon from "@mui/icons-material/FindInPageOutlined";
import CopyrightOutlinedIcon from "@mui/icons-material/CopyrightOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import FindInPageOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import GraphicEqOutlinedIcon from "@mui/icons-material/GraphicEqOutlined";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/CropOriginalOutlined";
import VideoCameraBackOutlinedIcon from "@mui/icons-material/CameraOutlined";

/**
 * Stage icon mapping
 * Maps stage keys to their corresponding Material-UI icons
 */
const STAGE_ICONS = {
  stage1: HistoryEduIcon,
  stage2: CopyrightOutlinedIcon,
  stage3: TipsAndUpdatesOutlinedIcon,
  stage4: FindInPageOutlinedIcon,
  stage5: PersonSearchOutlinedIcon,
  stage6: LocationOnOutlinedIcon,
  stage7: GraphicEqOutlinedIcon,
  stage8: RemoveRedEyeOutlinedIcon,
  stage9: ViewInArOutlinedIcon,
  stage10: VideoCameraBackOutlinedIcon,
} as const;

/**
 * Type-safe interfaces
 */
interface StageInfo {
  progress: number;
  status: number;
  analyses?: Record<string, AnalysisInfo>;
}

interface AnalysisInfo {
  status: number;
}

interface StageDefinition {
  name: string;
  types?: string[];
  detailedInfo?: string;
}

interface TaskInfo {
  status: string;
  // Add other task properties as needed
}

interface StageDetailsViewProps {
  DYNAMIC_STAGES: Record<string, StageDefinition>;
  FALLBACK_STAGES: Record<string, StageDefinition>;
  stageData: Record<string, StageInfo>;
  taskInfo: TaskInfo;
  getStageProgress: (stageKey: string, stageIndex: number) => number;
  getStageCompletionStatus: (stageKey: string) => boolean;
}

/**
 * StageDetailsView Component
 *
 * Displays detailed view of processing stages with interactive agent icons,
 * progress indicators, and analysis type information.
 * Fully theme-aware, supports light/dark modes and all brands (FRAM3, ACME, TechCo).
 *
 * @component
 */
export function StageDetailsView({
  DYNAMIC_STAGES,
  FALLBACK_STAGES,
  stageData,
  taskInfo,
  getStageProgress,
  getStageCompletionStatus,
}: StageDetailsViewProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // React 19: useMemo for stage keys to avoid recalculation
  const stageKeys = useMemo(
    () => Object.keys(DYNAMIC_STAGES),
    [DYNAMIC_STAGES]
  );

  // React 19: useCallback for click handler (passed to multiple children)
  const handleAgentClick = useCallback((stageKey: string) => {
    setSelectedAgent(stageKey);
  }, []);

  /**
   * Renders an individual agent icon with status and progress
   */
  const renderAgentIcon = useCallback(
    (stageKey: string) => {
      const Icon = STAGE_ICONS[stageKey as keyof typeof STAGE_ICONS];
      const stageInfo = stageData[stageKey] || { progress: 0, status: -2 };

      // Use the completion status from props
      const isCompleted = getStageCompletionStatus(stageKey);
      const stageProgress = getStageProgress(
        stageKey,
        stageKeys.indexOf(stageKey)
      );

      // Use the same color logic as StageSimpleView
      const baseStatusColor = getStatusColor(stageInfo.status);
      const statusColor = isCompleted
        ? theme.palette.success.main
        : baseStatusColor;

      const stageName = DYNAMIC_STAGES[stageKey]?.name || "";

      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            bgcolor: "background.default",
            gap: 1,
            cursor: "pointer",
          }}
          onClick={() => handleAgentClick(stageKey)}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: 2,
              borderColor: statusColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "background.default",
              position: "relative",
              transition: theme.transitions.create("transform", {
                duration: theme.transitions.duration.shorter,
                easing: theme.transitions.easing.easeInOut,
              }),
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            <Icon sx={{ fontSize: 32, color: statusColor }} />
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: "primary.main",
              fontFamily: brand.fonts.body,
            }}
          >
            {stageName}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: statusColor,
              fontFamily: brand.fonts.body,
            }}
          >
            {isCompleted ? "Completed" : getStatusText(stageInfo.status)}
          </Typography>
          <Box
            sx={{
              width: "80%",
              height: 4,
              borderRadius: `${brand.borderRadius}px`,
              bgcolor: "background.paper",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${stageProgress}%`,
                height: "100%",
                bgcolor: statusColor,
                borderRadius: `${brand.borderRadius}px`,
                transition: theme.transitions.create("width", {
                  duration: theme.transitions.duration.standard,
                  easing: theme.transitions.easing.easeInOut,
                }),
              }}
            />
          </Box>
        </Box>
      );
    },
    [
      stageData,
      getStageCompletionStatus,
      getStageProgress,
      stageKeys,
      theme,
      brand,
      DYNAMIC_STAGES,
      handleAgentClick,
    ]
  );

  // React 19: useMemo for selected stage data
  const selectedStageData = useMemo(() => {
    if (!selectedAgent) return null;

    return {
      name: DYNAMIC_STAGES[selectedAgent]?.name || "",
      detailedInfo: FALLBACK_STAGES[selectedAgent]?.detailedInfo || "",
      types: DYNAMIC_STAGES[selectedAgent]?.types || [],
      analyses: stageData[selectedAgent]?.analyses || {},
    };
  }, [selectedAgent, DYNAMIC_STAGES, FALLBACK_STAGES, stageData]);

  /**
   * Gets the chip color based on analysis status
   */
  const getChipColor = useCallback(
    (status: number): "success" | "warning" | "error" | "default" => {
      if (status === 1) return "success";
      if (status === 0) return "warning";
      if (status === -1) return "error";
      return "default";
    },
    []
  );

  return (
    <Box>
      {/* Dynamic Grid Layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          mb: 6,
        }}
      >
        {/* Row 1 */}
        <Box sx={{ gridColumn: "1 / span 1", textAlign: "center" }}>
          {renderAgentIcon("stage1")}
        </Box>
        <Box sx={{ gridColumn: "4 / span 1", textAlign: "center" }}>
          {renderAgentIcon("stage5")}
        </Box>

        {/* Row 2 */}
        <Box sx={{ gridColumn: "1 / span 1", textAlign: "center" }}>
          {renderAgentIcon("stage2")}
        </Box>
        <Box sx={{ gridColumn: "2 / span 1", textAlign: "center" }}>
          {renderAgentIcon("stage3")}
        </Box>
        <Box sx={{ gridColumn: "3 / span 1", textAlign: "center" }}>
          {renderAgentIcon("stage4")}
        </Box>
        <Box sx={{ gridColumn: "4 / span 1", textAlign: "center" }}>
          {renderAgentIcon("stage6")}
        </Box>
        <Box sx={{ gridColumn: "5 / span 1", textAlign: "center" }}>
          {renderAgentIcon("stage8")}
        </Box>
        <Box sx={{ gridColumn: "6 / span 1", textAlign: "center" }}>
          {renderAgentIcon("stage9")}
        </Box>
        <Box sx={{ gridColumn: "7 / span 1", textAlign: "center" }}>
          {renderAgentIcon("stage10")}
        </Box>

        {/* Row 3 */}
        <Box sx={{ gridColumn: "4 / span 1", textAlign: "center" }}>
          {renderAgentIcon("stage7")}
        </Box>
      </Box>

      {/* Stage details with analysis types */}
      {selectedAgent && selectedStageData && (
        <Box
          sx={{
            mt: 6,
            p: 4,
            bgcolor: "background.default",
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontFamily: brand.fonts.heading }}
            >
              {selectedStageData.name}
            </Typography>

            <Tooltip title="View detailed analysis information">
              <IconButton size="small" color="primary">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
            sx={{ fontFamily: brand.fonts.body }}
          >
            {selectedStageData.detailedInfo}
          </Typography>

          {/* Analysis types in this stage */}
          {selectedStageData.types.length > 0 && (
            <Box mt={3}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontFamily: brand.fonts.heading }}
              >
                Analyses in this stage:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {selectedStageData.types.map((type: string) => {
                  const analysisStatus =
                    selectedStageData.analyses[type]?.status ?? -2;
                  return (
                    <Chip
                      key={type}
                      label={type}
                      color={getChipColor(analysisStatus)}
                      size="small"
                      sx={{
                        fontFamily: brand.fonts.body,
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

StageDetailsView.displayName = "StageDetailsView";
