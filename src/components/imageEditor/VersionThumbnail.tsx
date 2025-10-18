// src/components/imageEditor/VersionThumbnail.tsx
"use client";

import { useState, useCallback } from "react";
import { Box, Paper, IconButton, Typography, Skeleton, alpha } from "@mui/material";
import {
  Info as InfoIcon,
  CheckCircle as CurrentIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { ImageVersion } from "@/types/storyBoard/types";

interface VersionThumbnailProps {
  version: ImageVersion;
  isCurrentVersion: boolean;
  disabled: boolean;
  thumbnailWidth: number;
  thumbnailHeight: number;
  onThumbnailClick: (version: ImageVersion) => void;
  onInfoClick: (e: React.MouseEvent, version: ImageVersion) => void;
}

/**
 * Version Thumbnail Component with Dynamic Aspect Ratio
 * 
 * Features:
 * - Automatically detects image aspect ratio on load
 * - Supports 16:9, 9:16, 1:1, and any other ratio
 * - Smooth loading with skeleton
 * - Hover effects and animations
 * - Current version indicator
 */
export function VersionThumbnail({
  version,
  isCurrentVersion,
  disabled,
  thumbnailWidth,
  thumbnailHeight,
  onThumbnailClick,
  onInfoClick,
}: VersionThumbnailProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  
  // Dynamic aspect ratio state
  const [aspectRatio, setAspectRatio] = useState<string>("16/9");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  /**
   * Handle image load - detect and set aspect ratio
   */
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      // Calculate exact aspect ratio from natural dimensions
      const ratio = `${img.naturalWidth}/${img.naturalHeight}`;
      setAspectRatio(ratio);
    }
    setImageLoaded(true);
    setImageError(false);
  }, []);

  /**
   * Handle image error
   */
  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
    setAspectRatio("16/9"); // Fallback to default
  }, []);

  return (
    <Box
      sx={{
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Thumbnail Frame */}
      <Paper
        onClick={() => !disabled && onThumbnailClick(version)}
        elevation={isCurrentVersion ? 6 : 2}
        sx={{
          width: thumbnailWidth,
          // Use dynamic aspect ratio instead of fixed height
          aspectRatio: aspectRatio,
          borderRadius: `${brand.borderRadius / 2}px`,
          overflow: "hidden",
          cursor: disabled ? "default" : "pointer",
          border: 2,
          borderColor: isCurrentVersion
            ? "primary.main"
            : alpha(theme.palette.divider, 0.5),
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          boxShadow: isCurrentVersion
            ? `0 0 12px ${alpha(theme.palette.primary.main, 0.3)}`
            : undefined,
          "&:hover": disabled
            ? {}
            : {
                borderColor: "primary.main",
                transform: "scale(1.08) translateY(-2px)",
                zIndex: 10,
                boxShadow: `0 4px 16px ${alpha(
                  theme.palette.primary.main,
                  0.25
                )}`,
              },
        }}
      >
        {/* Loading Skeleton */}
        {!imageLoaded && !imageError && (
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

        {/* Error State */}
        {imageError && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: "error.main",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Failed
            </Typography>
          </Box>
        )}

        {/* Image */}
        {!imageError && (
          <Box
            component="img"
            src={
              version.thumbnailPath ||
              version.signedUrl ||
              "/placeHolder.webp"
            }
            alt={`V${version.version}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              top: 0,
              left: 0,
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.3s ease-in-out",
            }}
          />
        )}

        {/* Version Number Badge */}
        <Box
          sx={{
            position: "absolute",
            top: 4,
            left: 4,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: "blur(4px)",
            px: 0.75,
            py: 0.25,
            borderRadius: `${brand.borderRadius / 3}px`,
            lineHeight: 1,
            border: 1,
            borderColor: alpha(theme.palette.primary.main, 0.2),
            zIndex: 2,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: "0.65rem",
              color: isCurrentVersion ? "primary.main" : "text.primary",
            }}
          >
            V{version.version}
          </Typography>
        </Box>

        {/* Current Badge */}
        {isCurrentVersion && (
          <Box
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              p: 0.25,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 2px 6px ${alpha(theme.palette.primary.main, 0.4)}`,
              zIndex: 2,
            }}
          >
            <CurrentIcon sx={{ fontSize: 12 }} />
          </Box>
        )}

        {/* Info Button - Shows on hover */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: `linear-gradient(to top, ${alpha(
              theme.palette.background.paper,
              0.95
            )} 0%, transparent 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            transition: "opacity 0.2s ease-in-out",
            pt: 1,
            pb: 0.5,
            zIndex: 2,
            ".MuiPaper-root:hover &": {
              opacity: 1,
            },
          }}
        >
          <IconButton
            size="small"
            onClick={(e) => onInfoClick(e, version)}
            sx={{
              width: 20,
              height: 20,
              minWidth: 20,
              color: "primary.main",
              bgcolor: alpha(theme.palette.background.paper, 0.9),
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.2),
              "&:hover": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                borderColor: "primary.main",
              },
            }}
          >
            <InfoIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}