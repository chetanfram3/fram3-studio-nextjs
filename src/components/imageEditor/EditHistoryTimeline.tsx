// src/components/imageEditor/timeline/EditHistoryTimeline.tsx
"use client";

import {
  Box,
  Typography,
  Chip,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  Edit as EditIcon,
  AutoAwesome as GenerateIcon,
  ZoomIn as UpscaleIcon,
  Restore as RestoreIcon,
  History as HistoryIcon,
  ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { format } from "date-fns";
import { JSX } from "react";

interface EditHistoryEntry {
  timestamp: string;
  fromVersion: number;
  toVersion: number;
  editType: string;
  previousPath: string;
  newPath: string;
  prompt?: string | null;
  seed?: number | null;
  restoredFromVersion?: number;
}

interface EditHistoryTimelineProps {
  editHistory: EditHistoryEntry[];
  currentVersion: number;
  onVersionJump?: (version: number) => void;
  compact?: boolean;
}

interface EditTypeInfo {
  label: string;
  icon: JSX.Element;
  color: string;
}

/**
 * EditHistoryTimeline - Visual timeline of image edit history
 *
 * Features:
 * - Custom timeline (no @mui/lab dependency)
 * - Chronological timeline display
 * - Edit type badges
 * - Prompt display
 * - Jump to version
 * - Compact mode
 */
export function EditHistoryTimeline({
  editHistory,
  currentVersion,
  onVersionJump,
  compact = false,
}: EditHistoryTimelineProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  if (!editHistory || editHistory.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          color: "text.secondary",
          fontFamily: brand.fonts.body,
        }}
      >
        <HistoryIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
        <Typography variant="body2">No edit history available</Typography>
      </Box>
    );
  }

  const getEditTypeInfo = (editType: string): EditTypeInfo => {
    const types: Record<string, EditTypeInfo> = {
      text_to_image: {
        label: "Generated",
        icon: <GenerateIcon />,
        color: theme.palette.success.main,
      },
      flux_pro_kontext: {
        label: "Generated (Flux)",
        icon: <GenerateIcon />,
        color: theme.palette.success.main,
      },
      nano_banana_edit: {
        label: "Edited",
        icon: <EditIcon />,
        color: theme.palette.primary.main,
      },
      upscale_2x: {
        label: "Upscaled 2x",
        icon: <UpscaleIcon />,
        color: theme.palette.info.main,
      },
      version_restore: {
        label: "Restored",
        icon: <RestoreIcon />,
        color: theme.palette.warning.main,
      },
      batch_generation: {
        label: "Batch Generated",
        icon: <GenerateIcon />,
        color: theme.palette.success.main,
      },
    };

    return (
      types[editType] || {
        label: editType,
        icon: <EditIcon />,
        color: theme.palette.text.secondary,
      }
    );
  };

  const formatDate = (timestamp: string): string => {
    try {
      return format(new Date(timestamp), "MMM dd, HH:mm");
    } catch {
      return "Unknown";
    }
  };

  const formatTime = (timestamp: string): string => {
    try {
      return format(new Date(timestamp), "HH:mm:ss");
    } catch {
      return "--:--";
    }
  };

  // Sort by timestamp descending (newest first)
  const sortedHistory = [...editHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Box sx={{ position: "relative", py: 2 }}>
      {sortedHistory.map((entry, index) => {
        const editTypeInfo = getEditTypeInfo(entry.editType);
        const isCurrentVersion = entry.toVersion === currentVersion;
        const isLast = index === sortedHistory.length - 1;

        return (
          <Box
            key={`${entry.timestamp}-${index}`}
            sx={{
              position: "relative",
              display: "flex",
              gap: 2,
              pb: isLast ? 0 : 3,
            }}
          >
            {/* Timeline Line & Dot */}
            <Box
              sx={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 40,
              }}
            >
              {/* Top Connector Line */}
              {index > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: -24,
                    width: 2,
                    height: 24,
                    bgcolor: alpha(editTypeInfo.color, 0.3),
                  }}
                />
              )}

              {/* Dot */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: editTypeInfo.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  boxShadow: `0 0 0 4px ${alpha(editTypeInfo.color, 0.2)}`,
                  border: isCurrentVersion
                    ? `3px solid ${theme.palette.background.paper}`
                    : "none",
                  zIndex: 2,
                  flexShrink: 0,
                }}
              >
                {editTypeInfo.icon}
              </Box>

              {/* Bottom Connector Line */}
              {!isLast && (
                <Box
                  sx={{
                    width: 2,
                    flex: 1,
                    bgcolor: alpha(editTypeInfo.color, 0.3),
                    mt: 0.5,
                  }}
                />
              )}
            </Box>

            {/* Content Card */}
            <Box sx={{ flex: 1, pt: 0.5 }}>
              <Paper
                elevation={isCurrentVersion ? 4 : 1}
                sx={{
                  p: 2,
                  bgcolor: isCurrentVersion
                    ? alpha(theme.palette.primary.main, 0.05)
                    : "background.paper",
                  border: 2,
                  borderColor: isCurrentVersion
                    ? "primary.main"
                    : alpha(theme.palette.divider, 0.5),
                  borderRadius: `${brand.borderRadius}px`,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                <Stack spacing={1.5}>
                  {/* Header Row */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    gap={1}
                  >
                    {/* Left: Type & Current Badge */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={editTypeInfo.label}
                        size="small"
                        sx={{
                          bgcolor: alpha(editTypeInfo.color, 0.1),
                          color: editTypeInfo.color,
                          fontWeight: 700,
                          fontFamily: brand.fonts.body,
                          fontSize: "0.7rem",
                          border: `1px solid ${alpha(editTypeInfo.color, 0.3)}`,
                        }}
                      />
                      {isCurrentVersion && (
                        <Chip
                          label="Current"
                          size="small"
                          color="primary"
                          sx={{
                            fontWeight: 700,
                            fontFamily: brand.fonts.body,
                            fontSize: "0.7rem",
                          }}
                        />
                      )}
                    </Stack>

                    {/* Right: Version Flow */}
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip
                        label={`V${entry.fromVersion}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: "0.65rem",
                          height: 20,
                          fontFamily: brand.fonts.body,
                          borderColor: alpha(theme.palette.divider, 0.5),
                        }}
                      />
                      <ArrowIcon
                        sx={{
                          fontSize: 16,
                          color: "text.secondary",
                          mx: 0.25,
                        }}
                      />
                      <Chip
                        label={`V${entry.toVersion}`}
                        size="small"
                        color="primary"
                        sx={{
                          fontSize: "0.65rem",
                          height: 20,
                          fontWeight: 700,
                          fontFamily: brand.fonts.body,
                        }}
                      />
                    </Stack>
                  </Stack>

                  {/* Timestamp */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontFamily: brand.fonts.body,
                        fontSize: "0.7rem",
                      }}
                    >
                      {formatDate(entry.timestamp)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.disabled",
                        fontFamily: brand.fonts.body,
                        fontSize: "0.65rem",
                      }}
                    >
                      {formatTime(entry.timestamp)}
                    </Typography>
                  </Stack>

                  {/* Prompt */}
                  {entry.prompt && !compact && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.background.default, 0.5),
                        borderRadius: `${brand.borderRadius / 2}px`,
                        borderColor: alpha(theme.palette.divider, 0.5),
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.7rem",
                          lineHeight: 1.5,
                          color: "text.secondary",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {entry.prompt}
                      </Typography>
                    </Paper>
                  )}

                  {/* Restored From */}
                  {entry.restoredFromVersion && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.5,
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        borderRadius: `${brand.borderRadius / 2}px`,
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                      }}
                    >
                      <RestoreIcon
                        sx={{ fontSize: 14, color: "warning.main" }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "warning.main",
                          fontFamily: brand.fonts.body,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                        }}
                      >
                        Restored from version {entry.restoredFromVersion}
                      </Typography>
                    </Box>
                  )}

                  {/* Seed Info */}
                  {entry.seed && !compact && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.disabled",
                        fontFamily: brand.fonts.body,
                        fontSize: "0.65rem",
                      }}
                    >
                      Seed: {entry.seed}
                    </Typography>
                  )}

                  {/* Jump Button */}
                  {onVersionJump && !isCurrentVersion && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        pt: 0.5,
                      }}
                    >
                      <Tooltip title="Jump to this version" arrow>
                        <IconButton
                          size="small"
                          onClick={() => onVersionJump(entry.toVersion)}
                          sx={{
                            color: "primary.main",
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              borderColor: "primary.main",
                            },
                          }}
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
