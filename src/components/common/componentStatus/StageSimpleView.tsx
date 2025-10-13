"use client";

import {
  Box,
  Typography,
  Tooltip,
  CircularProgress,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useMemo } from "react";
import { getCurrentBrand } from "@/config/brandConfig";
import { getStatusColor } from "@/utils/pipelineUtils";

/**
 * Props for StageSimpleView component
 * Type-safe interface with no 'any' types
 */
interface StageData {
  progress: number;
  status: number;
}

interface StageDefinition {
  name: string;
  // Add other stage properties as needed
}

interface TaskInfo {
  status: string;
  // Add other task properties as needed
}

interface StageSimpleViewProps {
  DYNAMIC_STAGES: Record<string, StageDefinition>;
  stageData: Record<string, StageData>;
  taskInfo: TaskInfo;
  getStageProgress: (stageKey: string, stageIndex: number) => number;
  getStageCompletionStatus: (stageKey: string) => boolean;
  overallProgress: number;
  getProgressColor: () => string;
}

/**
 * StageSimpleView Component
 *
 * Displays a simplified view of processing stages with progress indicators.
 * Fully theme-aware, supports light/dark modes and all brands (FRAM3, ACME, TechCo).
 *
 * @component
 */
export function StageSimpleView({
  DYNAMIC_STAGES,
  stageData,
  taskInfo,
  getStageProgress,
  getStageCompletionStatus,
  overallProgress,
  getProgressColor,
}: StageSimpleViewProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // React 19: useMemo for expensive computation - converting color name to value
  const progressColor = useMemo(() => {
    const colorName = getProgressColor();
    switch (colorName) {
      case "success":
        return theme.palette.success.main;
      case "error":
        return theme.palette.error.main;
      case "primary":
        return theme.palette.primary.main;
      default:
        return theme.palette.secondary.main;
    }
  }, [getProgressColor, theme.palette]);

  // React 19: useMemo for stage entries to avoid recalculation on every render
  const stageEntries = useMemo(
    () => Object.entries(DYNAMIC_STAGES),
    [DYNAMIC_STAGES]
  );

  const stageCount = stageEntries.length;
  const segmentWidth = 100 / stageCount;

  return (
    <Box
      sx={{
        mb: 4,
        position: "relative",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.divider,
          0.02
        )} 0%, ${alpha(theme.palette.divider, 0.01)} 50%, transparent 100%)`,
        borderRadius: `${brand.borderRadius}px`,
        p: 3,
        border: 1,
        borderColor: alpha(theme.palette.divider, 0.1),
        "&:hover": {
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.divider,
            0.03
          )} 0%, ${alpha(theme.palette.divider, 0.01)} 50%, transparent 100%)`,
          borderColor: alpha(theme.palette.primary.main, 0.2),
        },
        transition: theme.transitions.create(["background", "border-color"], {
          duration: theme.transitions.duration.standard,
        }),
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontFamily: brand.fonts.heading,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 0.5,
            }}
          >
            AVIA Progress
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontWeight: 500,
              fontFamily: brand.fonts.body,
            }}
          >
            Processing stages: {stageCount} total
          </Typography>
        </Box>
        {taskInfo?.status !== "active" && (
          <Box sx={{ textAlign: "right" }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontFamily: brand.fonts.heading,
                background: `linear-gradient(45deg, ${progressColor}, ${alpha(
                  progressColor,
                  0.7
                )})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1,
              }}
            >
              {overallProgress}%
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Complete
            </Typography>
          </Box>
        )}
      </Stack>

      {/* Progress Bar with Segments */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            position: "relative",
            height: 12,
            bgcolor: alpha(theme.palette.divider, 0.1),
            borderRadius: `${brand.borderRadius}px`,
            overflow: "hidden",
            border: 1,
            borderColor: alpha(theme.palette.divider, 0.2),
            boxShadow: `inset 0 2px 4px ${alpha(theme.palette.divider, 0.15)}`,
          }}
        >
          {/* Background segments for each stage */}
          {stageEntries.map((_, index) => (
            <Box
              key={`segment-${index}`}
              sx={{
                position: "absolute",
                left: `${index * segmentWidth}%`,
                top: 0,
                height: "100%",
                width: `${segmentWidth}%`,
                borderRight:
                  index < stageCount - 1
                    ? `1px solid ${alpha(theme.palette.divider, 0.3)}`
                    : "none",
                bgcolor: "transparent",
              }}
            />
          ))}

          {/* Animated progress fill */}
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${overallProgress}%`,
              background: `linear-gradient(90deg, ${progressColor}, ${alpha(
                progressColor,
                0.8
              )})`,
              borderRadius: `${brand.borderRadius}px`,
              transition: theme.transitions.create("width", {
                duration: theme.transitions.duration.complex,
                easing: theme.transitions.easing.easeInOut,
              }),
              boxShadow: `0 0 10px ${alpha(progressColor, 0.3)}`,
              "&::after": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                animation:
                  overallProgress > 0 && overallProgress < 100
                    ? "shimmer 2s infinite"
                    : "none",
                "@keyframes shimmer": {
                  "0%": { transform: "translateX(-100%)" },
                  "100%": { transform: "translateX(100%)" },
                },
              },
            }}
          />
        </Box>
      </Box>

      {/* Stage Numbers with Circular Progress */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(stageCount, 10)}, 1fr)`,
          gap: 2,
          alignItems: "center",
        }}
      >
        {stageEntries.map(([stageKey], index) => {
          const stageNumber = index + 1;
          const isCompleted = getStageCompletionStatus(stageKey);
          const stageProgress = getStageProgress(stageKey, index);
          const stageInfo = stageData[stageKey] || {
            progress: 0,
            status: -2,
          };

          // Use the same color logic as StageDetailsView
          const baseStatusColor = getStatusColor(stageInfo.status);
          const statusColor = isCompleted
            ? theme.palette.success.main
            : baseStatusColor;

          return (
            <Tooltip
              key={stageKey}
              title={
                <Box sx={{ textAlign: "center", p: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      fontFamily: brand.fonts.body,
                      display: "block",
                    }}
                  >
                    Stage {stageNumber}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      opacity: 0.9,
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    {stageProgress}% complete
                  </Typography>
                </Box>
              }
              arrow
              placement="top"
            >
              <Box
                sx={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "default",
                  transition: theme.transitions.create("transform", {
                    duration: theme.transitions.duration.shorter,
                    easing: theme.transitions.easing.easeInOut,
                  }),
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                {/* Circular Progress Container */}
                <Box
                  sx={{
                    position: "relative",
                    width: 48,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Background Circle */}
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={48}
                    thickness={3}
                    sx={{
                      position: "absolute",
                      color: alpha(theme.palette.divider, 0.2),
                      zIndex: 1,
                    }}
                  />

                  {/* Progress Circle - Uses primary color */}
                  <CircularProgress
                    variant="determinate"
                    value={stageProgress}
                    size={48}
                    thickness={3}
                    color="primary"
                    sx={{
                      position: "absolute",
                      color: statusColor,
                      zIndex: 2,
                      transition: theme.transitions.create("color"),
                      "& .MuiCircularProgress-circle": {
                        strokeLinecap: "round",
                        filter: `drop-shadow(0 0 4px ${alpha(
                          statusColor,
                          0.3
                        )})`,
                      },
                    }}
                  />

                  {/* Center Content */}
                  <Box
                    sx={{
                      position: "absolute",
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      bgcolor: "background.default",
                      border: 2,
                      borderColor: statusColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 3,
                      transition: theme.transitions.create([
                        "border-color",
                        "box-shadow",
                      ]),
                      boxShadow: `0 2px 8px ${alpha(statusColor, 0.2)}`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        fontFamily: brand.fonts.body,
                        color: statusColor,
                        lineHeight: 1,
                      }}
                    >
                      {stageNumber}
                    </Typography>
                  </Box>
                </Box>

                {/* Stage Progress Text */}
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    fontWeight: 600,
                    fontFamily: brand.fonts.body,
                    color: statusColor,
                    fontSize: "0.7rem",
                    textAlign: "center",
                    minHeight: "1.2em",
                  }}
                >
                  {stageProgress}%
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

StageSimpleView.displayName = "StageSimpleView";
