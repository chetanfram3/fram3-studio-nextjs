"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Button,
  TextField,
  Chip,
  alpha,
  useTheme,
  Rating,
  CircularProgress,
  Fab,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  Close,
  Upload,
  CameraAlt,
  Check,
  ChevronRight,
  ExpandMore,
  Feedback as FeedbackIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useFeedback } from "@/hooks/scripts/useFeedback";
import type { FeedbackData } from "@/services/scriptService";
import { uploadFilesToGCS } from "@/services/uploadService";
import CustomToast from "@/components/common/CustomToast";
import {
  PAGE_TABS,
  PAGE_CONTEXTS,
  QUICK_TAGS,
  RATING_MESSAGES,
  type FeedbackPage,
  SECTION_QUESTIONS,
} from "@/config/feedbackConstants";
import { convertPathToPublicUrl } from "@/utils/imageUtils";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";

interface StandaloneFeedbackPanelProps {
  page: FeedbackPage;
  scriptId: string;
  versionId: string;
  onExpand?: () => void;
}

interface FileUploadInfo {
  file: File;
  publicUrl?: string;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
}

export default function StandaloneFeedbackPanel({
  page,
  scriptId,
  versionId,
  onExpand,
}: StandaloneFeedbackPanelProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  const [open, setOpen] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [fileUploadInfo, setFileUploadInfo] = useState<FileUploadInfo[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // State retention for each tab
  const [tabStates, setTabStates] = useState<
    Record<
      string,
      {
        rating: number | null;
        comment: string;
        email: string;
        fileUploadInfo: FileUploadInfo[];
      }
    >
  >({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const context = PAGE_CONTEXTS[page];
  const tabs = PAGE_TABS[page];
  const currentTab = tabs[activeTabIndex];
  const quickTags = QUICK_TAGS[page];

  // Get questions specific to the current tab
  // React 19 compiler auto-optimizes simple filters - no useMemo needed
  const currentTabQuestions = SECTION_QUESTIONS[page].filter((question) =>
    question.tabs.includes(currentTab)
  );

  // Use the custom feedback hook
  const {
    feedbackStatus,
    isLoading,
    submitFeedback,
    isSubmitting,
    extractTags,
    overallProgress,
    useTabFeedback,
    refetchStatus,
  } = useFeedback(scriptId, versionId);

  // Get feedback data for current tab
  const { data: tabFeedbackData, refetch: refetchTabData } = useTabFeedback(
    page,
    currentTab
  );

  // Save current tab state - memoized
  const saveCurrentTabState = useCallback(() => {
    const tabKey = `${page}.${currentTab}`;
    setTabStates((prev) => ({
      ...prev,
      [tabKey]: {
        rating,
        comment,
        email,
        fileUploadInfo,
      },
    }));
  }, [page, currentTab, rating, comment, email, fileUploadInfo]);

  // Check if a tab is completed - memoized
  const isTabCompleted = useCallback(
    (tabName: string) => {
      if (!feedbackStatus) return false;
      const tabKey = `${page}.${tabName}`;
      return feedbackStatus.completedTabs?.includes(tabKey) || false;
    },
    [feedbackStatus, page]
  );

  // Reset form when switching tabs
  useEffect(() => {
    const tabKey = `${page}.${currentTab}`;

    if (isTabCompleted(currentTab)) {
      return;
    }

    if (tabStates[tabKey]) {
      const savedState = tabStates[tabKey];
      setRating(savedState.rating);
      setComment(savedState.comment);
      setEmail(savedState.email);
      setFileUploadInfo(savedState.fileUploadInfo);
    } else {
      setRating(null);
      setComment("");
      setEmail("");
      setFileUploadInfo([]);
    }
  }, [currentTab, tabStates, page, isTabCompleted]);

  // Auto-move to next incomplete tab when current tab is completed
  useEffect(() => {
    if (feedbackStatus && currentTab && open) {
      const tabKey = `${page}.${currentTab}`;
      const isCurrentCompleted =
        feedbackStatus.completedTabs?.includes(tabKey) || false;

      if (isCurrentCompleted) {
        const nextIncompleteIndex = tabs.findIndex((tab, index) => {
          if (index <= activeTabIndex) return false;
          return !isTabCompleted(tab);
        });

        if (nextIncompleteIndex !== -1) {
          setTimeout(() => setActiveTabIndex(nextIncompleteIndex), 1500);
        }
      }
    }
  }, [
    feedbackStatus,
    currentTab,
    page,
    tabs,
    activeTabIndex,
    open,
    isTabCompleted,
  ]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    const newFileInfo: FileUploadInfo[] = newFiles.map((file) => ({
      file,
      status: "idle" as const,
      progress: 0,
    }));
    setFileUploadInfo((prev) => [...prev, ...newFileInfo]);
  };

  const handleScreenshot = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        CustomToast("error", "Screen capture is not supported in your browser");
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: "screen",
        } as MediaTrackConstraints,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach((track) => track.stop());

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `screenshot-${Date.now()}.png`, {
            type: "image/png",
          });
          const newFileInfo: FileUploadInfo = {
            file,
            status: "idle",
            progress: 0,
          };
          setFileUploadInfo((prev) => [...prev, newFileInfo]);
          CustomToast("success", "Screenshot captured");
        } else {
          CustomToast("error", "Failed to capture screenshot");
        }
      }, "image/png");
    } catch (error: unknown) {
      console.error("Screenshot capture failed:", error);

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          CustomToast("error", "Screen capture permission denied");
        } else if (error.name === "NotSupportedError") {
          CustomToast("error", "Screen capture is not supported");
        } else {
          CustomToast("error", "Failed to capture screenshot");
        }
      }
    }
  };

  const uploadFiles = async (): Promise<FileUploadInfo[] | false> => {
    if (fileUploadInfo.length === 0) return [];

    setIsUploadingFiles(true);
    setUploadProgress(0);

    try {
      setFileUploadInfo((prev) =>
        prev.map((info) => ({
          ...info,
          status: "uploading" as const,
          progress: 0,
        }))
      );

      const filesToUpload = fileUploadInfo.map((info) => info.file);

      const result = await uploadFilesToGCS(filesToUpload, {
        onProgress: (progressInfo) => {
          setUploadProgress(progressInfo.progress);
        },
      });

      const updatedFileInfo = fileUploadInfo.map((info, index) => {
        const uploadResult = result.files[index];

        if (uploadResult && uploadResult.success && uploadResult.path) {
          const publicUrl = convertPathToPublicUrl(uploadResult.path);

          return {
            ...info,
            publicUrl,
            status: "success" as const,
            progress: 100,
          };
        } else {
          return {
            ...info,
            status: "error" as const,
            progress: 0,
          };
        }
      });

      setFileUploadInfo(updatedFileInfo);

      const allSuccessful = updatedFileInfo.every(
        (info) => info.status === "success"
      );

      if (!allSuccessful) {
        CustomToast("error", "Some files failed to upload");
      }

      return updatedFileInfo;
    } catch (error) {
      console.error("File upload error:", error);
      CustomToast("error", "Failed to upload files");

      setFileUploadInfo((prev) =>
        prev.map((info) => ({
          ...info,
          status: "error" as const,
          progress: 0,
        }))
      );

      return false;
    } finally {
      setIsUploadingFiles(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !rating) return;

    try {
      let uploadedFileInfo = fileUploadInfo;

      if (fileUploadInfo.length > 0) {
        const uploadResult = await uploadFiles();

        if (uploadResult === false) {
          CustomToast("error", "Please retry file upload before submitting");
          return;
        }

        if (Array.isArray(uploadResult)) {
          uploadedFileInfo = uploadResult;
        }
      }

      const tags = extractTags(comment);
      tags.push(`@${page}`, `#${currentTab}`);

      const uploads = uploadedFileInfo
        .filter((info) => info.status === "success" && info.publicUrl)
        .map((info) => ({
          fileId: `upload_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          fileName: info.file.name,
          fileType: info.file.type,
          fileSize: info.file.size,
          fileUrl: info.publicUrl!,
        }));

      const feedbackData: FeedbackData = {
        rating: rating || 0,
        comment,
        tags: [...new Set(tags)],
        uploads,
      };

      await submitFeedback({
        page,
        tab: currentTab,
        feedbackData,
        isFinalSubmission: false,
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      const tabKey = `${page}.${currentTab}`;
      setTabStates((prev) => {
        const newStates = { ...prev };
        delete newStates[tabKey];
        return newStates;
      });

      setRating(null);
      setComment("");
      setEmail("");
      setFileUploadInfo([]);

      refetchTabData();
      if (refetchStatus) {
        refetchStatus();
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      CustomToast("error", "Failed to submit feedback. Please try again.");

      saveCurrentTabState();

      if (fileUploadInfo.length > 0) {
        setFileUploadInfo((prev) =>
          prev.map((info) =>
            info.status === "uploading"
              ? { ...info, status: "success" as const }
              : info
          )
        );
      }
    }
  };

  const insertTag = (tag: string) => {
    setComment((prev) => {
      const newComment = prev.trim();
      return newComment ? `${newComment} ${tag}` : tag;
    });
  };

  const handleTabChange = (index: number) => {
    saveCurrentTabState();
    setActiveTabIndex(index);
  };

  const isCurrentTabCompleted = isTabCompleted(currentTab);

  return (
    <>
      {/* Floating Action Button - ✅ FIXED: Use primary color */}
      <Tooltip title="Provide Feedback" placement="left">
        <Fab
          color="primary"
          aria-label="provide feedback"
          onClick={handleOpen}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1200,
            // ✅ FIXED: Use theme primary color for gradient
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
            "&:hover": {
              background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
              transform: "scale(1.05)",
            },
            boxShadow: `0 3px 5px 2px ${alpha(theme.palette.primary.main, 0.3)}`,
            transition: "all 0.3s ease-in-out",
          }}
        >
          <FeedbackIcon />
        </Fab>
      </Tooltip>

      {/* Feedback Dialog - ✅ FIXED: Theme-compliant styling */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              elevation: 0,
              // ✅ FIXED: Use theme background
              backgroundColor: "background.paper",
              backgroundImage: "none !important",
              // ✅ FIXED: Use primary color for border
              border: 2,
              borderColor: "primary.main",
              borderRadius: `${brand.borderRadius * 1.5}px`,
              maxWidth: 600,
              boxShadow: theme.shadows[24],
            },
          },
          backdrop: {
            sx: {
              // ✅ FIXED: Theme-aware backdrop
              backgroundColor: isDarkMode
                ? "rgba(0, 0, 0, 0.85)"
                : "rgba(0, 0, 0, 0.7)",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            pb: 1,
            borderBottom: 1,
            borderColor: "divider",
            // ✅ FIXED: Use theme background
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              component="div"
              // ✅ FIXED: Use primary color
              color="primary.main"
              sx={{
                fontWeight: 600,
                fontFamily: brand.fonts.heading,
              }}
            >
              {context.title}
            </Typography>
            {overallProgress && (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Progress: {overallProgress.completedTabs}/
                  {overallProgress.totalTabs}
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: 4,
                    bgcolor: alpha(theme.palette.divider, 0.2),
                    borderRadius: `${brand.borderRadius}px`,
                    overflow: "hidden",
                    minWidth: 200,
                  }}
                >
                  <Box
                    sx={{
                      width: `${overallProgress.completionPercentage}%`,
                      height: "100%",
                      // ✅ FIXED: Use primary color
                      bgcolor: "primary.main",
                      transition: "width 0.3s ease",
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              gap: 1,
            }}
          >
            {onExpand && (
              <IconButton
                onClick={onExpand}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <ExpandMore />
              </IconButton>
            )}
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: "text.secondary",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: 2, bgcolor: "background.paper" }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              {/* ✅ FIXED: Use primary color */}
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <>
              {/* Tab Navigation - ✅ FIXED: Theme-compliant colors */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  mb: 2,
                  p: 0.5,
                  bgcolor: "transparent",
                  borderRadius: `${brand.borderRadius}px`,
                  justifyContent: "center",
                  overflowX: "auto",
                  "&::-webkit-scrollbar": {
                    height: 4,
                  },
                  "&::-webkit-scrollbar-track": {
                    bgcolor: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    bgcolor: alpha(theme.palette.divider, 0.3),
                    borderRadius: `${brand.borderRadius}px`,
                  },
                }}
              >
                {tabs.map((tab, index) => (
                  <Box
                    key={tab}
                    sx={{
                      position: "relative",
                      padding: activeTabIndex === index ? "3px" : "0px",
                      borderRadius: `${brand.borderRadius}px`,
                      // ✅ FIXED: Use primary color
                      background:
                        activeTabIndex === index
                          ? theme.palette.primary.main
                          : "transparent",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                    }}
                  >
                    <Button
                      onClick={() => handleTabChange(index)}
                      disabled={isTabCompleted(tab) && index !== activeTabIndex}
                      size="small"
                      sx={{
                        position: "relative",
                        minWidth: "auto",
                        px: 2,
                        py: 0.75,
                        textTransform: "capitalize",
                        fontSize: "0.813rem",
                        borderRadius: `${brand.borderRadius}px`,
                        whiteSpace: "nowrap",
                        fontFamily: brand.fonts.body,
                        bgcolor:
                          activeTabIndex === index
                            ? "background.paper"
                            : "transparent",
                        // ✅ FIXED: Use theme colors
                        color:
                          activeTabIndex === index
                            ? "primary.main"
                            : isTabCompleted(tab)
                              ? "success.main"
                              : "text.secondary",
                        "&:hover": {
                          bgcolor:
                            activeTabIndex === index
                              ? "background.paper"
                              : alpha(theme.palette.primary.main, 0.08),
                          color:
                            activeTabIndex === index
                              ? "primary.dark"
                              : "primary.main",
                        },
                        "&:disabled": {
                          color: "success.main",
                          opacity: 0.7,
                        },
                      }}
                      endIcon={
                        isTabCompleted(tab) ? (
                          <Check sx={{ fontSize: 14 }} />
                        ) : null
                      }
                    >
                      {tab}
                    </Button>
                  </Box>
                ))}
              </Box>

              {isCurrentTabCompleted ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    <Check sx={{ fontSize: 40, color: "success.main" }} />
                  </Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontFamily: brand.fonts.heading }}
                  >
                    Feedback Completed!
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, fontFamily: brand.fonts.body }}
                  >
                    Thank you for your feedback on {currentTab}.
                  </Typography>

                  {feedbackStatus?.pages?.[page] === "completed" ? (
                    <Box
                      sx={{
                        mt: 3,
                        p: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        borderRadius: `${brand.borderRadius}px`,
                        border: 1,
                        borderColor: alpha(theme.palette.success.main, 0.2),
                      }}
                    >
                      <Typography
                        variant="body1"
                        color="success.main"
                        sx={{
                          fontWeight: 500,
                          fontFamily: brand.fonts.heading,
                        }}
                      >
                        All {page} feedback completed!
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, fontFamily: brand.fonts.body }}
                      >
                        You&apos;ve provided feedback for all tabs in the {page}{" "}
                        section.
                        {feedbackStatus.pendingTabs.length > 0 && (
                          <> Switch to another section to continue.</>
                        )}
                      </Typography>
                    </Box>
                  ) : (
                    feedbackStatus?.nextTab?.startsWith(page) && (
                      <Button
                        onClick={() => {
                          const [, nextTab] =
                            feedbackStatus.nextTab!.split(".");
                          const nextIndex = tabs.indexOf(nextTab);
                          if (nextIndex !== -1) setActiveTabIndex(nextIndex);
                        }}
                        variant="outlined"
                        // ✅ FIXED: Use primary color
                        color="primary"
                        endIcon={<ChevronRight />}
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        Next Tab
                      </Button>
                    )
                  )}
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Current Tab Indicator */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    Providing feedback for: <strong>{currentTab}</strong>
                  </Typography>

                  {/* Tab-Specific Questions */}
                  {currentTabQuestions.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      {currentTabQuestions.map((question, index) => (
                        <Box
                          key={index}
                          sx={{
                            mb: 2,
                            p: 2,
                            border: 1,
                            borderColor: alpha(theme.palette.divider, 0.2),
                            borderRadius: `${brand.borderRadius}px`,
                            bgcolor: alpha(theme.palette.background.paper, 0.5),
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              mb: 1,
                              color: "text.primary",
                              fontFamily: brand.fonts.heading,
                            }}
                          >
                            {question.label}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 2,
                              lineHeight: 1.5,
                              fontFamily: brand.fonts.body,
                            }}
                          >
                            {question.placeholder}
                          </Typography>
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
                          >
                            {question.exampleTags.map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                onClick={() => insertTag(tag)}
                                sx={{
                                  bgcolor: alpha(theme.palette.info.main, 0.1),
                                  color: "info.main",
                                  fontSize: "0.7rem",
                                  fontFamily: brand.fonts.body,
                                  border: 1,
                                  borderColor: alpha(
                                    theme.palette.info.main,
                                    0.3
                                  ),
                                  borderRadius: `${brand.borderRadius}px`,
                                  cursor: "pointer",
                                  "&:hover": {
                                    bgcolor: alpha(
                                      theme.palette.info.main,
                                      0.2
                                    ),
                                    borderColor: "info.main",
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Star Rating - ✅ FIXED: Use primary color */}
                  <Box sx={{ textAlign: "center" }}>
                    <Rating
                      value={rating}
                      onChange={(_, newValue) => setRating(newValue)}
                      size="large"
                      sx={{
                        fontSize: "3rem",
                        "& .MuiRating-iconFilled": {
                          color: "primary.main",
                        },
                        "& .MuiRating-iconHover": {
                          color: "primary.light",
                        },
                      }}
                    />
                    {rating && (
                      <Typography
                        variant="body1"
                        // ✅ FIXED: Use primary color
                        color="primary.main"
                        sx={{
                          mt: 1,
                          fontWeight: 500,
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        {RATING_MESSAGES[rating]}
                      </Typography>
                    )}
                  </Box>

                  {/* Comment Input - ✅ FIXED: Use primary color */}
                  <TextField
                    multiline
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={context.placeholder}
                    fullWidth
                    variant="outlined"
                    sx={{
                      fontFamily: brand.fonts.body,
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                        },
                        "&:hover fieldset": {
                          borderColor: alpha(theme.palette.primary.main, 0.5),
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  />

                  {/* Quick Tags - ✅ FIXED: Theme-compliant colors */}
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        display: "block",
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      Quick tags:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {quickTags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          onClick={() => insertTag(tag)}
                          size="small"
                          sx={{
                            bgcolor: tag.startsWith("@")
                              ? alpha(theme.palette.info.main, 0.1)
                              : alpha(theme.palette.success.main, 0.1),
                            color: tag.startsWith("@")
                              ? "info.main"
                              : "success.main",
                            border: 1,
                            borderColor: tag.startsWith("@")
                              ? alpha(theme.palette.info.main, 0.3)
                              : alpha(theme.palette.success.main, 0.3),
                            borderRadius: `${brand.borderRadius}px`,
                            fontFamily: brand.fonts.body,
                            "&:hover": {
                              bgcolor: tag.startsWith("@")
                                ? alpha(theme.palette.info.main, 0.2)
                                : alpha(theme.palette.success.main, 0.2),
                            },
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Media Upload - ✅ FIXED: Use primary color */}
                  <Box
                    sx={{ display: "flex", justifyContent: "center", gap: 3 }}
                  >
                    <Box
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                        cursor: "pointer",
                        "&:hover": { opacity: 0.8 },
                      }}
                    >
                      <IconButton
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: "primary.main",
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                          },
                        }}
                      >
                        <Upload />
                      </IconButton>
                      <Typography
                        variant="caption"
                        color="primary"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        Upload
                      </Typography>
                    </Box>

                    <Box
                      onClick={handleScreenshot}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                        cursor: "pointer",
                        "&:hover": { opacity: 0.8 },
                      }}
                    >
                      <IconButton
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: "primary.main",
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                          },
                        }}
                      >
                        <CameraAlt />
                      </IconButton>
                      <Typography
                        variant="caption"
                        color="primary"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        Screenshot
                      </Typography>
                    </Box>
                  </Box>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />

                  {fileUploadInfo.length > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="primary.main"
                        align="center"
                        display="block"
                        mb={1}
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        {fileUploadInfo.length} file(s) selected
                      </Typography>
                      {isUploadingFiles && (
                        <LinearProgress
                          variant="determinate"
                          value={uploadProgress}
                          // ✅ FIXED: Use primary color
                          color="primary"
                          sx={{
                            height: 6,
                            borderRadius: `${brand.borderRadius}px`,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            "& .MuiLinearProgress-bar": {
                              bgcolor: "primary.main",
                            },
                          }}
                        />
                      )}
                    </Box>
                  )}

                  {/* Submit Button - ✅ FIXED: Use primary color */}
                  <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={isSubmitting || !rating || isUploadingFiles}
                    sx={{
                      mt: 1,
                      fontFamily: brand.fonts.body,
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    }}
                  >
                    {isUploadingFiles
                      ? "Uploading files..."
                      : isSubmitting
                        ? "Submitting..."
                        : "Submit"}
                  </Button>
                </Box>
              )}
            </>
          )}
        </DialogContent>

        {/* Success Animation */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: alpha(theme.palette.background.default, 0.9),
                borderRadius:
                  typeof theme.shape.borderRadius === "number"
                    ? theme.shape.borderRadius * 2
                    : 16,
              }}
            >
              <Box
                sx={{
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  borderRadius: "50%",
                  p: 4,
                }}
              >
                <Check sx={{ fontSize: 60, color: "success.main" }} />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>
    </>
  );
}
