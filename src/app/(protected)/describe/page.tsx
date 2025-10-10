"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogContent,
  CircularProgress,
  keyframes,
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

// Content type tabs
const contentTabs = ["IMAGE", "VIDEO", "AUDIO", "TEXT"] as const;
type ContentType = (typeof contentTabs)[number];

// Options for each content type
const contentOptions: Record<ContentType, string[]> = {
  IMAGE: [
    "Product Mockup",
    "Storyboards",
    "Character Design",
    "Logo Creation",
    "Social Media Graphics",
    "Poster Design",
    "Infographics",
    "Brand Assets",
  ],
  VIDEO: [
    "Commercial",
    "Explainer Video",
    "Social Media Video",
    "Animation",
    "Tutorial",
    "Product Demo",
    "Brand Story",
    "Event Highlights",
  ],
  AUDIO: [
    "Podcast Intro",
    "Background Music",
    "Voiceover",
    "Sound Effects",
    "Jingle Creation",
    "Audio Logo",
    "Meditation Sounds",
    "Nature Sounds",
  ],
  TEXT: [
    "Blog Post",
    "Social Media Caption",
    "Email Newsletter",
    "Product Description",
    "Script Writing",
    "Story Creation",
    "Press Release",
    "Ad Copy",
  ],
};

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

      // Start animation after short delay
      const timer = setTimeout(() => {
        const animationInterval = setInterval(() => {
          setCount((prev) => {
            if (prev >= 100) {
              clearInterval(animationInterval);
              setIsAnimating(true);

              // Keep pulsating for 2 more seconds after reaching 100
              setTimeout(() => {
                setKeepPulsating(false);

                // Then complete after pulsating stops
                setTimeout(() => {
                  onComplete();
                }, 500);
              }, 2000);

              return 100;
            }
            return prev + 2; // Increment by 2 to reach 100 in ~2 seconds
          });
        }, 40); // Update every 40ms

        return () => clearInterval(animationInterval);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [open, onComplete]);

  // Get the correct brand color based on theme mode
  const primaryColor =
    theme.palette.mode === "dark"
      ? brand.colors.dark.primary
      : brand.colors.light.primary;

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
          border: `2px solid ${primaryColor}`,
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
            {/* Outer pulsating circles */}
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
                  fill={primaryColor}
                  opacity="0.2"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="25"
                  fill={primaryColor}
                  opacity="0.6"
                />
                <circle cx="40" cy="40" r="15" fill={primaryColor} />
              </svg>
            </Box>

            {/* $ Symbol in center */}
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
                  color: theme.palette.mode === "dark" ? "#0F0F0F" : "#FFFFFF",
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
            color: primaryColor,
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

  const primaryColor =
    theme.palette.mode === "dark"
      ? brand.colors.dark.primary
      : brand.colors.light.primary;

  useEffect(() => {
    if (!open) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Check if mouse is in bottom-left corner (within 100px from edges)
      if (e.clientX <= 100 && e.clientY >= window.innerHeight - 100) {
        setMouseInCorner(true);
        // Close overlay after a short delay
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
      {/* Arrow pointing to sidebar toggle */}
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
            border: `3px solid ${primaryColor}`,
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
            border: `2px solid ${primaryColor}`,
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
              borderTop: `12px solid ${primaryColor}`,
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                bgcolor: primaryColor,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: "1.5rem",
                  color: theme.palette.mode === "dark" ? "#0F0F0F" : "#FFFFFF",
                }}
              >
                <ViewSidebarOutlined />
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: primaryColor,
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
              color: primaryColor,
              filter: "drop-shadow(0 0 8px rgba(255, 213, 0, 0.5))",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Describe Idea Page - What would you like to create?
 * Now includes integrated onboarding dialog
 */
export default function DescribeIdeaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ContentType>("IMAGE");
  const [customPrompt, setCustomPrompt] = useState("");

  // Check if this is a first-time user from query params
  const isFirstTime = searchParams.get("firstTime") === "true";
  const [showCreditDialog, setShowCreditDialog] = useState(isFirstTime);
  const [showSidebarHint, setShowSidebarHint] = useState(false);

  useEffect(() => {
    if (isFirstTime) {
      logger.debug("First-time user detected, showing credit dialog", {
        userEmail: user?.email,
      });
    }
  }, [isFirstTime, user]);

  // Get primary color based on theme mode
  const primaryColor =
    theme.palette.mode === "dark"
      ? brand.colors.dark.primary
      : brand.colors.light.primary;

  const handleCreditLoadingComplete = async () => {
    logger.debug("Credit loading completed");

    try {
      // TODO: Save credits to Firestore/Backend if needed
      // await saveCreditsToBackend(user?.uid, 100);

      setShowCreditDialog(false);
      // Show sidebar hint for first-time users
      if (isFirstTime) {
        setTimeout(() => {
          setShowSidebarHint(true);
        }, 500);
      }
    } catch (error) {
      logger.error("Failed to save credits:", error);
      // Even if saving fails, close dialog and continue
      setShowCreditDialog(false);
    }
  };

  const handleSidebarHintClose = () => {
    setShowSidebarHint(false);
    logger.debug("Sidebar hint dismissed");
  };

  const handleOptionSelect = (option: string) => {
    logger.debug("Option selected", { type: activeTab, option });
    // TODO: Navigate to playground with selected option
    router.push(
      `/creative/playground?type=${activeTab.toLowerCase()}&option=${encodeURIComponent(option)}`
    );
  };

  const handleCustomPromptSubmit = () => {
    if (customPrompt.trim()) {
      logger.debug("Custom prompt submitted", {
        type: activeTab,
        prompt: customPrompt,
      });
      router.push(
        `/creative/playground?type=${activeTab.toLowerCase()}&prompt=${encodeURIComponent(customPrompt)}`
      );
    }
  };

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
                color: primaryColor,
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
                border: `1px solid ${theme.palette.divider}`,
                gap: 1,
              }}
            >
              {contentTabs.map((tab) => {
                const TabIcon = contentTypeIcons[tab];
                return (
                  <Button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    startIcon={<TabIcon />}
                    variant={activeTab === tab ? "contained" : "text"}
                    sx={{
                      px: 4,
                      py: 2,
                      borderRadius: `${brand.borderRadius}px`,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "1rem",
                      minWidth: 140,
                      ...(activeTab === tab
                        ? {
                            bgcolor: primaryColor,
                            color:
                              theme.palette.mode === "dark"
                                ? "#0F0F0F"
                                : "#FFFFFF",
                            "&:hover": {
                              bgcolor: primaryColor,
                              opacity: 0.9,
                            },
                          }
                        : {
                            color: "text.secondary",
                            "&:hover": {
                              bgcolor: "action.hover",
                              color: primaryColor,
                            },
                          }),
                    }}
                  >
                    {tab}
                  </Button>
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
                {contentOptions[activeTab].map((option) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={option}>
                    <Card
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: "background.paper",
                        height: "100%",
                        "&:hover": {
                          borderColor: primaryColor,
                          bgcolor: "action.hover",
                          transform: "translateY(-4px)",
                          boxShadow: theme.shadows[8],
                        },
                      }}
                      onClick={() => handleOptionSelect(option)}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <SparkleIcon
                            sx={{
                              color: primaryColor,
                              fontSize: "1.5rem",
                            }}
                          />
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: "text.primary",
                            }}
                          >
                            {option}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
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
              }}
            >
              Or describe your custom idea
            </Typography>
            <Box
              sx={{
                position: "relative",
                bgcolor: "background.paper",
                borderRadius: `${brand.borderRadius * 2}px`,
                border: `2px solid ${theme.palette.divider}`,
                p: 2,
                transition: "all 0.3s ease",
                "&:focus-within": {
                  borderColor: primaryColor,
                  boxShadow: `0 0 0 3px ${primaryColor}20`,
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
                    pr: 8, // Add padding right for the button
                    "& textarea::placeholder": {
                      color: "text.disabled",
                      opacity: 1,
                    },
                  },
                }}
              />
              <Button
                variant="contained"
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
                  bgcolor: primaryColor,
                  color: theme.palette.mode === "dark" ? "#0F0F0F" : "#FFFFFF",
                  borderRadius: `${brand.borderRadius}px`,
                  "&:hover": {
                    bgcolor: primaryColor,
                    opacity: 0.9,
                  },
                  "&:disabled": {
                    bgcolor: "action.disabledBackground",
                    color: "text.disabled",
                  },
                }}
              >
                <ArrowIcon />
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Credit Loading Dialog - Integrated */}
      <CreditLoadingDialog
        open={showCreditDialog}
        onComplete={handleCreditLoadingComplete}
      />
      <SidebarHintOverlay
        open={showSidebarHint}
        onClose={handleSidebarHintClose}
      />
    </>
  );
}
