"use client";

import { useState, useCallback } from "react";
import { Box, Typography, IconButton, Tooltip, Skeleton } from "@mui/material";
import {
  VisibilityOutlined as ViewIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { FavoriteButton } from "./FavouriteButton";
import type { Script } from "@/types";

interface ScriptCardProps {
  script: Script;
  isSelected: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  onInfoClick: () => void;
}

export function ScriptCard({
  script,
  isSelected,
  onSelect,
  onViewDetails,
  onInfoClick,
}: ScriptCardProps) {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  const detectImageAspectRatio = useCallback((imgElement: HTMLImageElement) => {
    if (imgElement.naturalWidth && imgElement.naturalHeight) {
      const ratio = imgElement.naturalWidth / imgElement.naturalHeight;
      setImageAspectRatio(ratio);
      console.log(
        "ScriptCard aspect ratio detected:",
        ratio,
        ratio >= 1 ? "landscape (cover)" : "portrait (contain)"
      );
    }
  }, []);

  const getImageStyle = () => ({
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit:
      imageAspectRatio !== null && imageAspectRatio >= 1
        ? "cover"
        : ("contain" as const),
    transition: "transform 0.4s ease-in-out",
    transform: isHovered ? "scale(1.08)" : "scale(1)",
  });

  return (
    <Box
      sx={{
        position: "relative",
        cursor: "pointer",
        // ✅ FIXED: Use primary color for selected border (Gold/Bronze)
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : "none",
        borderRadius: 2,
        overflow: "hidden",
        "&:hover": {
          transform: "scale(1.02)",
          transition: "transform 0.2s ease-in-out",
        },
      }}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box
        sx={{
          position: "relative",
          paddingTop: "56.25%", // 16:9 Aspect Ratio
          width: "100%",
          overflow: "hidden",
          // ✅ FIXED: Use theme background instead of hardcoded 'black'
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box
          component="img"
          src={script.thumbnailPath || "/placeHolder.webp"}
          alt={script.scriptTitle || "Untitled Script"}
          sx={getImageStyle()}
          onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
            detectImageAspectRatio(e.currentTarget);
          }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = "/placeHolder.webp";
          }}
        />
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          // ✅ FIXED: Use theme-aware gradient
          background:
            theme.palette.mode === "dark"
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(0, 0, 0, 0.6)",
          // ✅ FIXED: Use theme text color instead of hardcoded 'white'
          color: theme.palette.text.primary,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          {script.scriptTitle || "Untitled Script"}
        </Typography>
        <Typography
          variant="caption"
          // ✅ FIXED: Use theme secondary text color instead of hardcoded grey.300
          color="text.secondary"
          sx={{ display: "block" }}
        >
          v{script.versions[0]?.versionNumber || 1}
        </Typography>
        <Box
          sx={{ position: "absolute", bottom: 8, right: 0, display: "flex" }}
        >
          <Tooltip title="Version details">
            <IconButton
              // ✅ Use primary color (Gold/Bronze)
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onInfoClick();
              }}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Details">
            <IconButton
              // ✅ Use primary color (Gold/Bronze)
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <FavoriteButton
            scriptId={script.scriptId}
            initialFavorite={script.favourite || false}
          />
        </Box>
      </Box>
    </Box>
  );
}

export function SkeletonCard() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      {/* Aspect ratio container */}
      <Box
        sx={{
          position: "relative",
          paddingTop: "56.25%", // 16:9 Aspect Ratio
          width: "100%",
          // ✅ FIXED: Use theme background instead of hardcoded 'black'
          backgroundColor: theme.palette.background.default,
        }}
      >
        {/* Main image skeleton */}
        <Skeleton
          variant="rectangular"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
          animation="wave"
        />
      </Box>

      {/* Bottom overlay */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          // ✅ FIXED: Use theme-aware gradient
          background:
            theme.palette.mode === "dark"
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Title skeleton */}
        <Skeleton variant="text" width="70%" height={28} sx={{ mb: 1 }} />

        {/* Version number skeleton */}
        <Skeleton variant="text" width="30%" height={20} sx={{ mb: 2 }} />

        {/* Action buttons skeleton */}
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            display: "flex",
            gap: 1,
          }}
        >
          <Skeleton
            variant="circular"
            width={24}
            height={24}
            // ✅ Use primary color for skeleton
            sx={{ bgcolor: theme.palette.primary.main }}
          />
          <Skeleton
            variant="circular"
            width={24}
            height={24}
            // ✅ Use primary color for skeleton
            sx={{ bgcolor: theme.palette.primary.main }}
          />
        </Box>
      </Box>
    </Box>
  );
}
