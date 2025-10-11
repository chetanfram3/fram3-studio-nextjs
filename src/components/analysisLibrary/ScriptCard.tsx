"use client";

import { useState, useCallback } from "react";
import { Box, Typography, IconButton, Tooltip, Skeleton } from "@mui/material";
import {
  VisibilityOutlined as ViewIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
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
  const [isHovered, setIsHovered] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  // Function to detect image aspect ratio
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

  // Smart object-fit style based on aspect ratio
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
    transition: "transform 0.4s ease-in-out", // Smooth transition for zoom effect
    transform: isHovered ? "scale(1.08)" : "scale(1)", // Zoom effect on hover
  });

  return (
    <Box
      sx={{
        position: "relative",
        cursor: "pointer",
        border: (theme) =>
          isSelected ? `2px solid ${theme.palette.secondary.dark}` : "none",
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
          overflow: "hidden", // Important to contain the scaled image
          backgroundColor: "black", // Black background for object-fit: contain
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
          background: "rgba(0, 0, 0, 0.7)",
          color: "white",
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          {script.scriptTitle || "Untitled Script"}
        </Typography>
        <Typography
          variant="caption"
          color="grey.300"
          sx={{ display: "block" }}
        >
          v{script.versions[0]?.versionNumber || 1}
        </Typography>
        <Box
          sx={{ position: "absolute", bottom: 8, right: 0, display: "flex" }}
        >
          <Tooltip title="Version details">
            <IconButton
              color="secondary"
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
              color="secondary"
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
          backgroundColor: "black", // Black background for consistency
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
          background: "rgba(0, 0, 0, 0.7)",
        }}
      >
        {/* Title skeleton */}
        <Skeleton
          variant="text"
          width="70%"
          height={28}
          sx={{ mb: 1, bgcolor: "grey.300" }}
        />

        {/* Version number skeleton */}
        <Skeleton
          variant="text"
          width="30%"
          height={20}
          sx={{ mb: 2, bgcolor: "grey.300" }}
        />

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
            sx={{ bgcolor: "secondary.main" }}
          />
          <Skeleton
            variant="circular"
            width={24}
            height={24}
            sx={{ bgcolor: "secondary.main" }}
          />
        </Box>
      </Box>
    </Box>
  );
}
