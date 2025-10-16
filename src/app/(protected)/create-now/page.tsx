"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  Tooltip,
  keyframes,
  Grid,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useAuthStore } from "@/store/authStore";
import {
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  Article as TextIcon,
  AutoAwesome as SparkleIcon,
  ArrowForward as ArrowIcon,
  KeyboardDoubleArrowDown as ShowIcon,
  ViewSidebarOutlined,
} from "@mui/icons-material";
import logger from "@/utils/logger";
import { completeOnboarding } from "@/services/userService";
import { auth } from "@/lib/firebase";
import {
  CREATIVE_CONSTANTS,
  getEnabledOptions,
  getAllEnabledContentTypes,
  type ContentType,
} from "@/config/creativeConstants";

// Pulsating animation keyframes
const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
`;

// Icon mapping for content types
const contentTypeIcons: Record<ContentType, typeof ImageIcon> = {
  IMAGE: ImageIcon,
  VIDEO: VideoIcon,
  AUDIO: AudioIcon,
  TEXT: TextIcon,
};

/**
 * Credit Loading Dialog Component
 * Animates from 0 to 100 credits with pulsating $ icon
 */
function CreditLoadingDialog({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: () => void;
}) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [keepPulsating, setKeepPulsating] = useState(true);

  useEffect(() => {
    if (open) {
      setCount(0);
      setIsAnimating(false);
      setKeepPulsating(true);

      const timer = setTimeout(() => {
        const animationInterval = setInterval(() => {
          setCount((prev) => {
            if (prev >= 100) {
              clearInterval(animationInterval);
              setIsAnimating(true);

              setTimeout(() => {
                setKeepPulsating(false);

                setTimeout(() => {
                  onComplete();
                }, 500);
              }, 2000);

              return 100;
            }
            return prev + 2;
          });
        }, 40);

        return () => clearInterval(animationInterval);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [open, onComplete]);

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius * 3}px`,
          backgroundImage: "none !important",
          border: 2,
          borderColor: "primary.main",
          boxShadow: theme.shadows[24],
          width: 360,
          maxWidth: 360,
        },
      }}
    >
      <DialogContent sx={{ textAlign: "center", p: 8 }}>
        {/* Pulsating $ Icon */}
        <Box
          sx={{
            mb: 6,
            transition: "all 0.5s ease",
            transform: isAnimating ? "scale(1.25)" : "scale(1)",
            animation: keepPulsating
              ? `${pulse} 1.5s ease-in-out infinite`
              : "none",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: 80,
              height: 80,
              mx: "auto",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill={theme.palette.primary.main}
                  opacity="0.2"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="25"
                  fill={theme.palette.primary.main}
                  opacity="0.6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="15"
                  fill={theme.palette.primary.main}
                />
              </svg>
            </Box>

            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: "1rem",
                  fontWeight: "bold",
                  color: theme.palette.primary.contrastText,
                }}
              >
                $
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Count Display */}
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            color: "primary.main",
            mb: 2,
            fontFamily: "monospace",
            fontSize: "3.5rem",
            fontVariantNumeric: "tabular-nums",
          }}
          aria-live="polite"
        >
          {count}
        </Typography>

        {/* Message */}
        <Typography
          variant="h6"
          sx={{
            color: "text.primary",
            mb: 1,
            fontWeight: 600,
            fontSize: "1.125rem",
            fontFamily: brand.fonts.heading,
          }}
        >
          Credits added to your account
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontSize: "0.875rem",
          }}
        >
          Start creating amazing content!
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Sidebar Hint Overlay Component
 * Shows after credit loading for first-time users
 */
function SidebarHintOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [mouseInCorner, setMouseInCorner] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 100 && e.clientY >= window.innerHeight - 100) {
        setMouseInCorner(true);
        setTimeout(() => {
          onClose();
        }, 500);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 1300,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-start",
        p: 4,
        cursor: "pointer",
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          position: "relative",
          ml: 8,
          mb: 8,
        }}
      >
        {/* Pulsating circle indicator */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: 3,
            borderColor: "primary.main",
            animation: `${pulse} 2s ease-in-out infinite`,
          }}
        />

        {/* Message card */}
        <Box
          sx={{
            position: "absolute",
            bottom: 80,
            left: -20,
            bgcolor: "background.paper",
            borderRadius: `${brand.borderRadius * 2}px`,
            border: 2,
            borderColor: "primary.main",
            p: 3,
            minWidth: 300,
            boxShadow: theme.shadows[24],
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: -12,
              left: 40,
              width: 0,
              height: 0,
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: `12px solid ${theme.palette.primary.main}`,
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                bgcolor: "primary.main",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.palette.primary.contrastText,
              }}
            >
              <ViewSidebarOutlined />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                fontFamily: brand.fonts.heading,
              }}
            >
              Open Sidebar
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mb: 1,
            }}
          >
            Move your mouse to the <strong>bottom-left corner</strong> to open
            the sidebar and explore more options.
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: "text.disabled",
              fontStyle: "italic",
            }}
          >
            Click anywhere to dismiss
          </Typography>
        </Box>

        {/* Animated arrow */}
        <Box
          sx={{
            position: "absolute",
            bottom: -5,
            left: 0,
            animation: "bounce 2s ease-in-out infinite",
            "@keyframes bounce": {
              "0%, 100%": {
                transform: "translateY(0) rotate(45deg)",
              },
              "50%": {
                transform: "translateY(-10px) rotate(45deg)",
              },
            },
          }}
        >
          <ShowIcon
            sx={{
              fontSize: "4rem",
              color: "primary.main",
              filter: `drop-shadow(0 0 8px ${theme.palette.primary.main}80)`,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Describe Idea Page - What would you like to create?
 * Now includes integrated onboarding dialog and creativeConstants
 */
export default function DescribeIdeaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { user } = useAuthStore();

  // Get all enabled content types
  const enabledContentTypes = getAllEnabledContentTypes();
  const [activeTab, setActiveTab] = useState<ContentType>(
    enabledContentTypes[0] || "IMAGE"
  );
  const [customPrompt, setCustomPrompt] = useState("");

  // Check if this is a first-time user from query params
  const isFirstTime = searchParams.get("firstTime") === "true";
  const [showCreditDialog, setShowCreditDialog] = useState(isFirstTime);
  const [showSidebarHint, setShowSidebarHint] = useState(false);
  const onboardingCompletedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      onboardingCompletedRef.current = false;
      logger.debug("User logged out, reset onboarding ref");
    }
  }, [user]);

  useEffect(() => {
    if (isFirstTime) {
      logger.debug("First-time user detected, showing credit dialog", {
        userEmail: user?.email,
      });
    }
  }, [isFirstTime, user]);

  const handleCreditLoadingComplete = async () => {
    if (onboardingCompletedRef.current) {
      logger.debug("Onboarding already completed, skipping");
      setShowCreditDialog(false);
      return;
    }

    if (!user) {
      logger.debug("User not authenticated, skipping onboarding");
      setShowCreditDialog(false);
      return;
    }

    logger.debug("Credit loading completed");
    onboardingCompletedRef.current = true;

    try {
      setShowCreditDialog(false);

      if (isFirstTime) {
        setTimeout(() => {
          setShowSidebarHint(true);
        }, 500);

        setTimeout(async () => {
          try {
            if (!auth.currentUser) {
              logger.debug("User logged out before onboarding API call");
              onboardingCompletedRef.current = false;
              return;
            }

            await completeOnboarding();
            logger.debug("Backend updated successfully");
          } catch (error) {
            logger.error("Failed to complete onboarding:", error);
            onboardingCompletedRef.current = false;
          }
        }, 600);
      }
    } catch (error) {
      logger.error("Error in credit loading complete flow:", error);
      onboardingCompletedRef.current = false;
      setShowCreditDialog(false);
    }
  };

  const handleSidebarHintClose = () => {
    setShowSidebarHint(false);
    logger.debug("Sidebar hint dismissed");
  };

  const handleOptionSelect = (optionKey: string) => {
    const option = getEnabledOptions(activeTab).find(
      (o) => o.key === optionKey
    );
    if (!option) return;

    logger.debug("Option selected", { type: activeTab, optionKey, option });
    router.push(
      `${option.path}?type=${activeTab.toLowerCase()}&key=${optionKey}`
    );
  };

  const handleCustomPromptSubmit = () => {
    if (customPrompt.trim()) {
      logger.debug("Custom prompt submitted", {
        type: activeTab,
        prompt: customPrompt,
      });
      router.push(
        `/creative/ai-script-generator?type=${activeTab.toLowerCase()}&prompt=${encodeURIComponent(customPrompt)}`
      );
    }
  };

  // Get enabled options for current tab
  const currentOptions = CREATIVE_CONSTANTS[activeTab]?.options || [];

  return (
    <>
      <Container maxWidth="xl">
        <Box sx={{ py: 6 }}>
          {/* Header Section */}
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                mb: 2,
                fontFamily: brand.fonts.heading,
              }}
            >
              What would you like to create?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "text.secondary",
                fontWeight: 400,
                fontFamily: brand.fonts.body,
              }}
            >
              Choose a category or describe your idea
            </Typography>
            {user && (
              <Chip
                label={`Welcome, ${user.displayName || user.email}!`}
                icon={<SparkleIcon />}
                sx={{
                  mt: 2,
                  bgcolor: "action.hover",
                  color: "text.primary",
                  fontWeight: 600,
                  fontFamily: brand.fonts.body,
                }}
              />
            )}
          </Box>

          {/* Tab Navigation */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 6,
            }}
          >
            <Box
              sx={{
                display: "flex",
                bgcolor: "background.paper",
                borderRadius: `${brand.borderRadius * 2}px`,
                p: 1,
                border: 1,
                borderColor: "divider",
                gap: 1,
              }}
            >
              {(Object.keys(CREATIVE_CONSTANTS) as ContentType[]).map((tab) => {
                const TabIcon = contentTypeIcons[tab];
                const isEnabled = CREATIVE_CONSTANTS[tab].isEnabled;
                return (
                  <Tooltip
                    key={tab}
                    title={!isEnabled ? "Coming Soon" : ""}
                    arrow
                  >
                    <span>
                      <Button
                        onClick={() => isEnabled && setActiveTab(tab)}
                        startIcon={<TabIcon />}
                        variant={activeTab === tab ? "contained" : "text"}
                        color={activeTab === tab ? "primary" : "inherit"}
                        disabled={!isEnabled}
                        sx={{
                          px: 4,
                          py: 2,
                          borderRadius: `${brand.borderRadius}px`,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "1rem",
                          minWidth: 140,
                          fontFamily: brand.fonts.body,
                          ...(activeTab === tab
                            ? {}
                            : {
                                color: isEnabled
                                  ? "text.secondary"
                                  : "text.disabled",
                                "&:hover": isEnabled
                                  ? {
                                      bgcolor: "action.hover",
                                      color: "primary.main",
                                    }
                                  : {},
                              }),
                        }}
                      >
                        {tab}
                      </Button>
                    </span>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>

          {/* Options Grid */}
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: "text.primary",
                mb: 3,
                textAlign: "center",
                fontFamily: brand.fonts.heading,
              }}
            >
              Popular {activeTab.toLowerCase()} options
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Grid
                container
                spacing={2}
                sx={{
                  maxWidth: 1200,
                  justifyContent: "center",
                }}
              >
                {currentOptions.map((option) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={option.key}>
                    <Tooltip
                      title={
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, mb: 0.5 }}
                          >
                            {option.title}
                          </Typography>
                          <Typography variant="caption">
                            {option.description}
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      <Card
                        sx={{
                          cursor: option.isEnabled ? "pointer" : "not-allowed",
                          transition: "all 0.3s ease",
                          border: 1,
                          borderColor: "divider",
                          bgcolor: "background.paper",
                          height: "100%",
                          opacity: option.isEnabled ? 1 : 0.5,
                          ...(option.isEnabled && {
                            "&:hover": {
                              borderColor: "primary.main",
                              bgcolor: "action.hover",
                              transform: "translateY(-4px)",
                              boxShadow: theme.shadows[8],
                            },
                          }),
                        }}
                        onClick={() =>
                          option.isEnabled && handleOptionSelect(option.key)
                        }
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <SparkleIcon
                              sx={{
                                color: option.isEnabled
                                  ? "primary.main"
                                  : "text.disabled",
                                fontSize: "1.5rem",
                              }}
                            />
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                color: option.isEnabled
                                  ? "text.primary"
                                  : "text.disabled",
                                fontFamily: brand.fonts.body,
                              }}
                            >
                              {option.value}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>

          {/* Custom Prompt Section */}
          <Box sx={{ maxWidth: 800, mx: "auto" }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: "text.primary",
                mb: 3,
                textAlign: "center",
                fontFamily: brand.fonts.heading,
              }}
            >
              Or describe your custom idea
            </Typography>
            <Box
              sx={{
                position: "relative",
                bgcolor: "background.paper",
                borderRadius: `${brand.borderRadius * 2}px`,
                border: 2,
                borderColor: "divider",
                p: 2,
                transition: "all 0.3s ease",
                "&:focus-within": {
                  borderColor: "primary.main",
                  boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`,
                },
              }}
            >
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder={`Describe your ${activeTab.toLowerCase()} creation in detail...`}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: "1.125rem",
                    color: "text.primary",
                    fontFamily: brand.fonts.body,
                    pr: 8,
                    "& textarea::placeholder": {
                      color: "text.disabled",
                      opacity: 1,
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleCustomPromptSubmit}
                disabled={!customPrompt.trim()}
                sx={{
                  position: "absolute",
                  right: 16,
                  top: 16,
                  minWidth: 44,
                  minHeight: 44,
                  width: 44,
                  height: 44,
                  p: 0,
                  borderRadius: `${brand.borderRadius}px`,
                }}
              >
                <ArrowIcon />
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Credit Loading Dialog */}
      <CreditLoadingDialog
        open={showCreditDialog}
        onComplete={handleCreditLoadingComplete}
      />

      {/* Sidebar Hint Overlay */}
      <SidebarHintOverlay
        open={showSidebarHint}
        onClose={handleSidebarHintClose}
      />
    </>
  );
}
