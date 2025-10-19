// src/components/imageEditor/VersionDetailsModal.tsx
"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Skeleton,
  alpha,
} from "@mui/material";
import {
  Close as CloseIcon,
  CheckCircle as CurrentIcon,
  Restore as RestoreIcon,
} from "@mui/icons-material";
import {
  Diamond as UltraIcon,
  Star as PremiumIcon,
  Circle as ProIcon,
  Zap as BasicIcon,
} from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { ImageVersion } from "@/types/storyBoard/types";
import { format } from "date-fns";
import { ImageMetadataPanel } from "./ImageMetadataPanel";
import { MODEL_TIERS } from "@/components/common/ModelTierSelector";

interface VersionDetailsModalProps {
  open: boolean;
  version: ImageVersion | null;
  isCurrent: boolean;
  onClose: () => void;
  onRestore?: (targetVersion: number) => void;
  onSelect: (version: ImageVersion) => void;
}

/**
 * Get model tier display information
 */
const getModelTierInfo = (modelTier: number, isDarkMode: boolean) => {
  switch (modelTier) {
    case MODEL_TIERS.BASIC:
      return {
        label: "Basic",
        color: isDarkMode ? "#9e9e9e" : "#78909c",
        icon: <BasicIcon size={12} />,
      };
    case MODEL_TIERS.PRO:
      return {
        label: "Pro",
        color: isDarkMode ? "#2196f3" : "#64b5f6",
        icon: <ProIcon size={12} />,
      };
    case MODEL_TIERS.PREMIUM:
      return {
        label: "Premium",
        color: isDarkMode ? "#ff9800" : "#ffb74d",
        icon: <PremiumIcon size={12} />,
      };
    case MODEL_TIERS.ULTRA:
      return {
        label: "Ultra",
        color: isDarkMode ? "#9c27b0" : "#ba68c8",
        icon: <UltraIcon size={12} />,
      };
    default:
      return null;
  }
};

/**
 * Version Details Modal with Dynamic Aspect Ratio
 *
 * Features:
 * - Details and Metadata tabs
 * - Dynamic aspect ratio image preview
 * - Restore version functionality
 * - Compact info display
 * - Model tier display
 */
export function VersionDetailsModal({
  open,
  version,
  isCurrent,
  onClose,
  onRestore,
  onSelect,
}: VersionDetailsModalProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const isDarkMode = theme.palette.mode === "dark";
  const [selectedTab, setSelectedTab] = useState(0);

  // Dynamic aspect ratio for modal image
  const [modalAspectRatio, setModalAspectRatio] = useState<string>("16/9");
  const [modalImageLoaded, setModalImageLoaded] = useState(false);

  // Get model tier info
  const modelTierInfo = version?.modelTier
    ? getModelTierInfo(version.modelTier, isDarkMode)
    : null;

  /**
   * Handle modal image load
   */
  const handleModalImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.naturalWidth && img.naturalHeight) {
        const ratio = `${img.naturalWidth}/${img.naturalHeight}`;
        setModalAspectRatio(ratio);
      }
      setModalImageLoaded(true);
    },
    []
  );

  /**
   * Reset state when modal closes
   */
  const handleClose = useCallback(() => {
    setSelectedTab(0);
    setModalAspectRatio("16/9");
    setModalImageLoaded(false);
    onClose();
  }, [onClose]);

  /**
   * Format date helper
   */
  const formatDate = (date: string | { _seconds: number } | undefined) => {
    if (!date) return "Unknown date";
    if (typeof date === "string") {
      try {
        return format(new Date(date), "PPpp");
      } catch {
        return "Invalid date";
      }
    }
    if (typeof date === "object" && "_seconds" in date) {
      try {
        return format(new Date(date._seconds * 1000), "PPpp");
      } catch {
        return "Invalid date";
      }
    }
    return "Unknown date";
  };

  /**
   * Get generation type label
   */
  const getGenerationTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      text_to_image: "Text to Image",
      flux_pro_kontext: "Image Edit",
      nano_banana_edit: "Image Edit",
      upscale_2x: "2x Upscale",
      batch_generation: "Batch Generation",
      manual_upload: "User Added Image"
    };
    return type ? labels[type] || type : "Unknown";
  };

  if (!version) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${brand.borderRadius}px`,
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: brand.fonts.heading,
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ fontFamily: brand.fonts.heading }}>
            Version {version.version}
          </Typography>
          {version.isCurrent && (
            <Chip
              label="Current"
              color="primary"
              size="small"
              icon={<CurrentIcon />}
            />
          )}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            px: 2,
          }}
        >
          <Tab label="Details" sx={{ fontFamily: brand.fonts.body }} />
          <Tab label="Metadata" sx={{ fontFamily: brand.fonts.body }} />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ p: 2 }}>
          {/* Tab 0: Details */}
          {selectedTab === 0 && (
            <Stack spacing={2}>
              {/* Dynamic Aspect Ratio Image Preview */}
              <Box
                sx={{
                  width: "100%",
                  aspectRatio: modalAspectRatio,
                  borderRadius: `${brand.borderRadius}px`,
                  overflow: "hidden",
                  bgcolor: "background.default",
                  position: "relative",
                  cursor: "pointer",
                }}
              >
                {/* Loading skeleton */}
                {!modalImageLoaded && (
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height="100%"
                    animation="wave"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }}
                  />
                )}

                {/* Image */}
                <Box
                  component="img"
                  src={
                    version.thumbnailPath ||
                    version.signedUrl ||
                    "/placeHolder.webp"
                  }
                  alt={`Version ${version.version}`}
                  onLoad={handleModalImageLoad}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    opacity: modalImageLoaded ? 1 : 0,
                    transition: "opacity 0.3s ease-in-out, transform 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                    },
                  }}
                />
              </Box>

              {/* Compact Info Grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 1,
                  fontSize: "0.875rem",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Version:
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {version.version}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip
                  label={version.isCurrent ? "Current" : "Archived"}
                  size="small"
                  color={version.isCurrent ? "primary" : "default"}
                  sx={{ height: 20, width: "fit-content" }}
                />

                {version.generationType && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Type:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {getGenerationTypeLabel(version.generationType)}
                    </Typography>
                  </>
                )}

                {modelTierInfo && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Model:
                    </Typography>
                    <Chip
                      icon={modelTierInfo.icon}
                      label={modelTierInfo.label}
                      size="small"
                      sx={{
                        height: 20,
                        width: "fit-content",
                        fontFamily: brand.fonts.body,
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        bgcolor: alpha(modelTierInfo.color, 0.2),
                        color: modelTierInfo.color,
                        border: 1,
                        borderColor: alpha(modelTierInfo.color, 0.3),
                        "& .MuiChip-icon": {
                          color: modelTierInfo.color,
                        },
                      }}
                    />
                  </>
                )}

                {version.aspectRatio && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Ratio:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {version.aspectRatio}
                    </Typography>
                  </>
                )}

                {version.seed !== null && version.seed !== undefined && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Seed:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {version.seed}
                    </Typography>
                  </>
                )}

                <Typography variant="body2" color="text.secondary">
                  {version.isCurrent ? "Last Edited" : "Archived"}:
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatDate(
                    version.isCurrent
                      ? version.lastEditedAt
                      : (version as any).archivedAt ||
                          version.lastEditedAt ||
                          "Unknown date"
                  )}
                </Typography>
              </Box>

              {/* Prompt - Compact */}
              {version.prompt && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                  >
                    Prompt
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      borderRadius: `${brand.borderRadius}px`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontFamily: "monospace",
                        lineHeight: 1.4,
                      }}
                    >
                      {version.prompt}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Stack>
          )}

          {/* Tab 1: Metadata */}
          {selectedTab === 1 && (
            <ImageMetadataPanel
              metadata={version?.imageMetadata || null}
              compact={false}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 1.5, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" size="small">
          Close
        </Button>
        {!version.isCurrent && onRestore && (
          <Button
            onClick={() => {
              onRestore(version.version);
              handleClose();
            }}
            variant="contained"
            size="small"
            startIcon={<RestoreIcon />}
          >
            Restore
          </Button>
        )}
        {!version.isCurrent && (
          <Button
            onClick={() => {
              onSelect(version);
              handleClose();
            }}
            variant="contained"
            color="primary"
            size="small"
          >
            View
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
