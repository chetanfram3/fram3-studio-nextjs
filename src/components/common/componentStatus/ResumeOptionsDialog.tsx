"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  AlertTitle,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  styled,
  Slide,
  keyframes,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  CheckCircle,
  Pause,
  Play,
  X,
  Clock,
  Zap,
  BarChart3,
  Activity,
} from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";
import { ApprovalButtonsContainer } from "./ApprovalButton";
import { ANALYSIS_TITLES } from "@/config/analysisTypes";
import type { ResumeResponse } from "./TaskProgress";

// ============================================================================
// KEYFRAMES
// ============================================================================

const float = keyframes`
  0%, 100% { transform: translateY(0px) }
  50% { transform: translateY(-10px) }
`;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const ModernDialog = styled(Dialog)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    "& .MuiDialog-paper": {
      background: theme.palette.background.paper,
      borderRadius: `${brand.borderRadius}px`,
      border: `1px solid ${theme.palette.primary.main}`,
      boxShadow: theme.shadows[24],
      overflow: "hidden",
      position: "relative",
      backgroundImage: "none",
    },
  };
});

const ModernDialogTitle = styled(DialogTitle)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    padding: theme.spacing(4, 4, 2, 4),
    background: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    position: "relative",
    textAlign: "center",
    fontFamily: brand.fonts.heading,
  };
});

const ModernDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3, 4),
  background: theme.palette.background.paper,
  "&::-webkit-scrollbar": {
    width: 8,
  },
  "&::-webkit-scrollbar-track": {
    background: theme.palette.background.default,
    borderRadius: 4,
  },
  "&::-webkit-scrollbar-thumb": {
    background: theme.palette.divider,
    borderRadius: 4,
  },
}));

const ModernDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 4, 4, 4),
  background: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  gap: theme.spacing(2),
  justifyContent: "center",
}));

const GradientAvatar = styled(Box)<{
  size?: number;
  noMotion?: boolean;
}>(({ theme, size = 64, noMotion = false }) => {
  const brand = getCurrentBrand();
  return {
    background: theme.palette.primary.main,
    borderRadius: `${brand.borderRadius * 2}px`,
    width: size,
    height: size,
    margin: noMotion ? "0" : "0 auto 16px",
    boxShadow: theme.shadows[4],
    animation: noMotion ? "none" : `${float} 3s ease-in-out infinite`,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
});

const ModernButton = styled(Button)<{
  buttonVariant?: "primary" | "secondary" | "success" | "error" | "warning";
}>(({ theme, buttonVariant = "primary" }) => {
  const brand = getCurrentBrand();

  const getButtonStyles = () => {
    switch (buttonVariant) {
      case "success":
        return {
          background: theme.palette.success.main,
          color: theme.palette.success.contrastText,
          "&:hover": {
            background: theme.palette.success.dark,
            transform: "translateY(-1px)",
          },
        };
      case "error":
        return {
          background: theme.palette.error.main,
          color: theme.palette.error.contrastText,
          "&:hover": {
            background: theme.palette.error.dark,
            transform: "translateY(-1px)",
          },
        };
      case "warning":
        return {
          background: theme.palette.warning.main,
          color: theme.palette.warning.contrastText,
          "&:hover": {
            background: theme.palette.warning.dark,
            transform: "translateY(-1px)",
          },
        };
      case "secondary":
        return {
          background: "transparent",
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          "&:hover": {
            background: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            borderColor: theme.palette.primary.main,
            transform: "translateY(-1px)",
          },
        };
      default:
        return {
          background: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          "&:hover": {
            background: theme.palette.primary.dark,
            transform: "translateY(-1px)",
          },
        };
    }
  };

  return {
    borderRadius: `${brand.borderRadius}px`,
    fontWeight: 600,
    textTransform: "none",
    padding: "10px 20px",
    position: "relative",
    overflow: "hidden",
    minWidth: 120,
    transition: "all 0.2s ease",
    fontFamily: brand.fonts.body,
    "&:active": {
      transform: "translateY(0px)",
    },
    "&:disabled": {
      opacity: 0.6,
      transform: "none",
    },
    ...getButtonStyles(),
  };
});

const ModernCard = styled(Card)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    background: theme.palette.background.default,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: `${brand.borderRadius}px`,
    boxShadow: theme.shadows[2],
    position: "relative",
    overflow: "hidden",
    backgroundImage: "none",
  };
});

const ModernAlert = styled(Alert)(({ theme, severity }) => {
  const brand = getCurrentBrand();

  const getColors = () => {
    switch (severity) {
      case "success":
        return {
          bg: theme.palette.success.main,
          border: theme.palette.success.main,
        };
      case "warning":
        return {
          bg: theme.palette.warning.main,
          border: theme.palette.warning.main,
        };
      case "error":
        return {
          bg: theme.palette.error.main,
          border: theme.palette.error.main,
        };
      default:
        return {
          bg: theme.palette.info.main,
          border: theme.palette.info.main,
        };
    }
  };

  const colors = getColors();

  return {
    background: theme.palette.background.default,
    border: `1px solid ${colors.border}`,
    borderRadius: `${brand.borderRadius}px`,
    boxShadow: "none",
    "& .MuiAlert-icon": {
      fontSize: "1.5rem",
    },
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: "4px",
      height: "100%",
      background: colors.bg,
    },
  };
});

const ModernChip = styled(Chip)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: `${brand.borderRadius}px`,
    fontWeight: 600,
    boxShadow: "none",
    "&:hover": {
      transform: "none",
      boxShadow: "none",
      backgroundColor: theme.palette.action.hover,
    },
    transition: "background-color 0.2s ease-in-out",
  };
});

const CloseButton = styled(IconButton)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    position: "absolute",
    top: theme.spacing(2),
    right: theme.spacing(2),
    background: "transparent",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: `${brand.borderRadius}px`,
    width: 36,
    height: 36,
    zIndex: 10,
    color: theme.palette.text.primary,
    "&:hover": {
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderColor: theme.palette.primary.main,
      transform: "scale(1.05)",
    },
    transition: "all 0.2s ease",
  };
});

const StatsContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

const AnalysisListContainer = styled(Box)(({ theme }) => {
  const brand = getCurrentBrand();
  return {
    background: theme.palette.background.paper,
    borderRadius: `${brand.borderRadius}px`,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "none",
    maxHeight: 200,
    overflowY: "auto",
    "&::-webkit-scrollbar": {
      width: 6,
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      background: theme.palette.divider,
      borderRadius: 3,
    },
  };
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ResumeOptionsDialogProps {
  scriptId: string;
  versionId: string;
  open: boolean;
  onClose: () => void;
  onSimpleResume: () => void;
  onConfigureResume: () => void;
  resumeResponse: ResumeResponse | null;
  isLoading: boolean;
  showImage: boolean;
  showVideo: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ResumeOptionsDialog: React.FC<ResumeOptionsDialogProps> = ({
  scriptId,
  versionId,
  open,
  onClose,
  onSimpleResume,
  resumeResponse,
  isLoading,
  showImage = true,
  showVideo = false,
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const getAnalysisTitle = (analysisType: string): string => {
    return (
      ANALYSIS_TITLES[analysisType as keyof typeof ANALYSIS_TITLES] ||
      analysisType
    );
  };

  const canResume = resumeResponse?.canResume ?? false;
  const hasAnalyses =
    (resumeResponse?.availablePausedAnalyses?.length ?? 0) > 0;

  return (
    <ModernDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slots={{
        transition: Slide,
      }}
      slotProps={{
        transition: { direction: "up" },
      }}
    >
      <ModernDialogTitle>
        <Tooltip title="Close">
          <CloseButton onClick={onClose} size="small">
            <X size={20} />
          </CloseButton>
        </Tooltip>

        <GradientAvatar size={64}>
          <Clock
            size={32}
            style={{
              color: theme.palette.primary.contrastText,
              zIndex: 2,
              position: "relative",
            }}
          />
        </GradientAvatar>

        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            color: theme.palette.text.primary,
            mb: 1,
            fontFamily: brand.fonts.heading,
          }}
        >
          Resume Paused Analysis
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          Continue your script analysis from where it left off
        </Typography>
      </ModernDialogTitle>

      <ModernDialogContent>
        {resumeResponse && (
          <Stack spacing={3}>
            {/* Enhanced Status Alert */}
            <ModernAlert
              severity={canResume ? "success" : "warning"}
              sx={{ pl: 3 }}
            >
              <AlertTitle sx={{ fontWeight: 700, fontSize: "1.1rem", mb: 1 }}>
                {canResume ? (
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <GradientAvatar size={24} noMotion={true}>
                      <Zap
                        size={12}
                        style={{
                          color: theme.palette.primary.contrastText,
                          zIndex: 2,
                          position: "relative",
                        }}
                      />
                    </GradientAvatar>
                    Ready to Resume
                  </Box>
                ) : (
                  "Approval Required"
                )}
              </AlertTitle>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {canResume
                  ? "All paused analyses are ready to continue processing. You can resume immediately."
                  : "Some analyses require your approval before they can be resumed. Please review the approval requirements below."}
              </Typography>
            </ModernAlert>

            {/* Enhanced Resume Statistics */}
            {resumeResponse.resumeInfo && (
              <ModernCard>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <GradientAvatar size={40} noMotion={true}>
                      <Activity
                        size={20}
                        style={{
                          color: theme.palette.primary.contrastText,
                          zIndex: 2,
                          position: "relative",
                        }}
                      />
                    </GradientAvatar>
                    <Typography
                      variant="h6"
                      fontWeight="700"
                      color="text.primary"
                      sx={{ fontFamily: brand.fonts.heading }}
                    >
                      Analysis Progress Overview
                    </Typography>
                  </Box>

                  <StatsContainer>
                    <Box sx={{ textAlign: "center" }}>
                      <ModernChip
                        icon={
                          <CheckCircle
                            size={18}
                            style={{ color: theme.palette.success.main }}
                          />
                        }
                        label={`${resumeResponse.resumeInfo.totalCompleted} Completed`}
                        sx={{
                          color: "success.main",
                          "& .MuiChip-icon": { color: "success.main" },
                        }}
                        size="medium"
                      />
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <ModernChip
                        icon={
                          <Pause
                            size={18}
                            style={{ color: theme.palette.warning.main }}
                          />
                        }
                        label={`${resumeResponse.resumeInfo.totalPaused} Paused`}
                        sx={{
                          color: "warning.main",
                          "& .MuiChip-icon": { color: "warning.main" },
                        }}
                        size="medium"
                      />
                    </Box>
                  </StatsContainer>
                </CardContent>
              </ModernCard>
            )}

            {/* Enhanced Paused Analyses List */}
            {hasAnalyses && (
              <ModernCard>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <GradientAvatar size={40} noMotion={true}>
                      <BarChart3
                        size={20}
                        style={{
                          color: theme.palette.primary.contrastText,
                          zIndex: 2,
                          position: "relative",
                        }}
                      />
                    </GradientAvatar>
                    <Typography
                      variant="h6"
                      fontWeight="700"
                      color="text.primary"
                      sx={{ fontFamily: brand.fonts.heading }}
                    >
                      Paused Analyses
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, lineHeight: 1.6 }}
                  >
                    {canResume
                      ? "The following analyses will be resumed automatically:"
                      : "Please review and approve the following analyses to continue:"}
                  </Typography>

                  <AnalysisListContainer>
                    <List dense sx={{ p: 1 }}>
                      {resumeResponse.availablePausedAnalyses?.map(
                        (analysis, index) => (
                          <React.Fragment key={analysis}>
                            <ListItem
                              sx={{
                                py: 1.5,
                                px: 2,
                                borderRadius: `${brand.borderRadius}px`,
                                "&:hover": {
                                  backgroundColor: theme.palette.action.hover,
                                },
                                transition: "all 0.2s ease-in-out",
                              }}
                            >
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: theme.palette.primary.main,
                                  mr: 2,
                                  flexShrink: 0,
                                }}
                              />
                              <ListItemText
                                primary={getAnalysisTitle(analysis)}
                                primaryTypographyProps={{
                                  fontWeight: 600,
                                  fontSize: "0.95rem",
                                }}
                              />
                            </ListItem>
                            {index <
                              (resumeResponse.availablePausedAnalyses?.length ??
                                0) -
                                1 && (
                              <Divider
                                sx={{
                                  ml: 4,
                                  mr: 2,
                                  borderColor: theme.palette.divider,
                                }}
                              />
                            )}
                          </React.Fragment>
                        )
                      ) ?? []}
                    </List>
                  </AnalysisListContainer>
                </CardContent>
              </ModernCard>
            )}
          </Stack>
        )}
      </ModernDialogContent>

      <ModernDialogActions>
        <ModernButton
          buttonVariant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </ModernButton>

        {canResume ? (
          <ModernButton
            buttonVariant="warning"
            onClick={onSimpleResume}
            startIcon={isLoading ? null : <Play size={18} />}
            disabled={isLoading}
            sx={{ minWidth: 160 }}
          >
            {isLoading ? "Resuming..." : "Resume Analysis"}
          </ModernButton>
        ) : (
          <ApprovalButtonsContainer
            scriptId={scriptId}
            versionId={versionId}
            showImageApproval={showImage}
            showVideoApproval={showVideo}
          />
        )}
      </ModernDialogActions>
    </ModernDialog>
  );
};

export default ResumeOptionsDialog;
