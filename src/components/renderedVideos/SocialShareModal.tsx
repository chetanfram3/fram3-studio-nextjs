"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Chip,
  Divider,
  TextField,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Share as ShareIcon,
  Launch as LaunchIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import type { RenderedVideo } from "@/types/renderedVideos/types";

// Platform icon components
const XIcon = () => (
  <Box
    sx={{
      width: 24,
      height: 24,
      bgcolor: "#000",
      borderRadius: 0.5,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: 12,
      fontWeight: "bold",
    }}
  >
    X
  </Box>
);

const FacebookIcon = () => (
  <Box
    sx={{
      width: 24,
      height: 24,
      bgcolor: "#1877F2",
      borderRadius: 0.5,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: 12,
      fontWeight: "bold",
    }}
  >
    f
  </Box>
);

const InstagramIcon = () => (
  <Box
    sx={{
      width: 24,
      height: 24,
      background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)",
      borderRadius: 0.5,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: 12,
      fontWeight: "bold",
    }}
  >
    IG
  </Box>
);

const WhatsAppIcon = () => (
  <Box
    sx={{
      width: 24,
      height: 24,
      bgcolor: "#25D366",
      borderRadius: 0.5,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: 12,
      fontWeight: "bold",
    }}
  >
    WA
  </Box>
);

interface SocialShareModalProps {
  open: boolean;
  onClose: () => void;
  video: RenderedVideo;
  videoUrl: string;
}

interface SharePlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
  shareUrl: string;
  description: string;
  features: string[];
}

export function SocialShareModal({
  open,
  onClose,
  video,
  videoUrl,
}: SocialShareModalProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [includeMetadata, setIncludeMetadata] = useState(true);

  // Memoize file size formatter
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "Unknown";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }, []);

  // Memoize share data
  const shareData = useMemo(() => {
    const title = video.renderData.title || `Video Version ${video.version}`;
    const description = `Check out this amazing video! ${
      video.videoMetadata.resolution
    } • ${Math.floor(video.videoMetadata.duration)}s`;
    const hashtags = ["video", "content", "creative"];

    return {
      title,
      description,
      url: videoUrl,
      hashtags,
      metadata: {
        duration: Math.floor(video.videoMetadata.duration),
        resolution: video.videoMetadata.resolution,
        format: video.videoMetadata.format,
        size: formatFileSize(video.renderData.outputSizeInBytes),
      },
    };
  }, [video, videoUrl, formatFileSize]);

  // Memoize platforms array
  const platforms: SharePlatform[] = useMemo(
    () => [
      {
        id: "twitter",
        name: "X (Twitter)",
        icon: <XIcon />,
        color: "#000000",
        textColor: "#FFF",
        shareUrl: "",
        description: "Share with hashtags and video link",
        features: ["280 char limit", "Hashtags", "Video preview"],
      },
      {
        id: "facebook",
        name: "Facebook",
        icon: <FacebookIcon />,
        color: "#1877F2",
        textColor: "",
        shareUrl: "",
        description: "Rich video preview with metadata",
        features: ["Rich previews", "Video embedding", "Comments"],
      },
      {
        id: "instagram",
        name: "Instagram",
        icon: <InstagramIcon />,
        color: "#E4405F",
        textColor: "",
        shareUrl: "",
        description: "Copy link for Instagram Stories/Posts",
        features: ["Stories", "Posts", "Reels"],
      },
      {
        id: "whatsapp",
        name: "WhatsApp",
        icon: <WhatsAppIcon />,
        color: "#25D366",
        textColor: "",
        shareUrl: "",
        description: "Share via WhatsApp with video link",
        features: ["Direct messaging", "Groups", "Status"],
      },
    ],
    []
  );

  const generateShareContent = useCallback(
    (platformId: string) => {
      const baseMessage = customMessage || shareData.description;
      const hashtagString = shareData.hashtags
        .map((tag) => `#${tag}`)
        .join(" ");

      switch (platformId) {
        case "twitter":
          const twitterText = `${shareData.title}\n\n${baseMessage}\n\n${hashtagString}`;
          return {
            text:
              twitterText.substring(0, 250) +
              (twitterText.length > 250 ? "..." : ""),
            url: shareData.url,
          };

        case "facebook":
          return {
            text: `${shareData.title}\n\n${baseMessage}`,
            url: shareData.url,
          };

        case "instagram":
          return {
            text: `${shareData.title}\n\n${baseMessage}\n\n${hashtagString}\n\nLink: ${shareData.url}`,
            url: shareData.url,
          };

        case "whatsapp":
          return {
            text: `${shareData.title}\n\n${baseMessage}\n\nWatch here: ${shareData.url}`,
            url: shareData.url,
          };

        default:
          return { text: shareData.description, url: shareData.url };
      }
    },
    [customMessage, shareData]
  );

  const handleShare = useCallback(
    async (platformId: string) => {
      const content = generateShareContent(platformId);

      try {
        switch (platformId) {
          case "twitter":
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              content.text
            )}&url=${encodeURIComponent(content.url)}`;
            window.open(twitterUrl, "_blank", "width=550,height=420");
            break;

          case "facebook":
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              content.url
            )}&quote=${encodeURIComponent(content.text)}`;
            window.open(facebookUrl, "_blank", "width=580,height=400");
            break;

          case "instagram":
            await navigator.clipboard.writeText(content.text);
            setSnackbarMessage(
              "Content copied to clipboard! Open Instagram and paste in your story or post."
            );
            setSnackbarOpen(true);
            break;

          case "whatsapp":
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
              content.text
            )}`;
            window.open(whatsappUrl, "_blank");
            break;

          default:
            if (navigator.share) {
              await navigator.share({
                title: shareData.title,
                text: content.text,
                url: content.url,
              });
            } else {
              await navigator.clipboard.writeText(
                `${content.text}\n\n${content.url}`
              );
              setSnackbarMessage("Content copied to clipboard!");
              setSnackbarOpen(true);
            }
        }
      } catch (error) {
        console.error("Share failed:", error);
        setSnackbarMessage(
          "Share failed. Content copied to clipboard instead."
        );
        try {
          await navigator.clipboard.writeText(
            `${content.text}\n\n${content.url}`
          );
        } catch (copyError) {
          setSnackbarMessage("Share failed. Please try again.");
        }
        setSnackbarOpen(true);
      }
    },
    [generateShareContent, shareData.title]
  );

  const copyToClipboard = useCallback(
    async (platformId: string) => {
      const content = generateShareContent(platformId);
      try {
        await navigator.clipboard.writeText(
          `${content.text}\n\n${content.url}`
        );
        setSnackbarMessage(
          `${
            platforms.find((p) => p.id === platformId)?.name
          } content copied to clipboard!`
        );
        setSnackbarOpen(true);
      } catch (error) {
        setSnackbarMessage("Failed to copy to clipboard");
        setSnackbarOpen(true);
      }
    },
    [generateShareContent, platforms]
  );

  const copyDirectLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setSnackbarMessage("Video link copied to clipboard!");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Failed to copy link");
      setSnackbarOpen(true);
    }
  }, [videoUrl]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: isDarkMode
                ? "rgba(0, 0, 0, 0.85)"
                : "rgba(0, 0, 0, 0.7)",
            },
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: `${brand.borderRadius * 1.5}px`,
            bgcolor: "background.paper",
            backgroundImage: "none !important",
            border: 2,
            borderColor: "primary.main",
            boxShadow: theme.shadows[24],
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
            pt: 3,
            pb: 2,
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShareIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" fontWeight={600} color="primary.main">
              Share Video
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: 3, bgcolor: "background.paper" }}>
          {/* Video Info */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: "background.default",
              borderRadius: `${brand.borderRadius * 0.5}px`,
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={600}
              color="text.primary"
              gutterBottom
            >
              {shareData.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {shareData.description}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
              <Chip label={`${shareData.metadata.duration}s`} size="small" />
              <Chip label={shareData.metadata.resolution} size="small" />
              <Chip label={shareData.metadata.format} size="small" />
              <Chip label={shareData.metadata.size} size="small" />
            </Box>
          </Box>

          {/* Custom Message */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Custom Message (Optional)"
              placeholder="Add your own message to the share..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "primary.contrastText",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "primary.main",
                    },
                  }}
                />
              }
              label="Include video metadata in share"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Direct Link */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              color="text.primary"
              gutterBottom
            >
              Direct Link
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                fullWidth
                value={videoUrl}
                variant="outlined"
                size="small"
                InputProps={{
                  readOnly: true,
                  sx: { fontSize: "0.875rem" },
                }}
              />
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CopyIcon />}
                onClick={copyDirectLink}
                sx={{ whiteSpace: "nowrap" }}
              >
                Copy Link
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Social Platforms */}
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="text.primary"
            gutterBottom
          >
            Share on Social Media
          </Typography>

          <Grid container spacing={2}>
            {platforms.map((platform) => (
              <Grid key={platform.id} size={{ xs: 12, sm: 6 }}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                    "&:hover": {
                      boxShadow: theme.shadows[4],
                      borderColor: "primary.main",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      {platform.icon}
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        color="text.primary"
                      >
                        {platform.name}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, minHeight: 40 }}
                    >
                      {platform.description}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        mb: 2,
                      }}
                    >
                      {platform.features.map((feature) => (
                        <Chip
                          key={feature}
                          label={feature}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      ))}
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<LaunchIcon />}
                        onClick={() => handleShare(platform.id)}
                        sx={{
                          bgcolor: platform.color,
                          color: platform.textColor || "white",
                          "&:hover": {
                            bgcolor: platform.color,
                            filter: "brightness(0.9)",
                          },
                          flex: 1,
                        }}
                      >
                        Share
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<CopyIcon />}
                        onClick={() => copyToClipboard(platform.id)}
                      >
                        Copy
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "background.paper" }}>
          <Button onClick={onClose} variant="outlined" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

SocialShareModal.displayName = "SocialShareModal";
