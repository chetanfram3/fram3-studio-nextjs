// src/components/analysisLibrary/ScriptCard.tsx
"use client";

import { useState, useCallback, Suspense, startTransition } from "react";
import { Box, Typography, IconButton, Tooltip, Skeleton } from "@mui/material";
import {
  VisibilityOutlined as ViewIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import NextImage from "next/image";
import { FavoriteButton } from "./FavouriteButton";
import type { Script } from "@/types";
import logger from "@/utils/logger";

interface ScriptCardProps {
  script: Script;
  isSelected: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  onInfoClick: () => void;
}

// ===========================
// OPTIMIZED IMAGE COMPONENT
// ===========================

interface OptimizedCardImageProps {
  src: string;
  alt: string;
  aspectRatio: number | null;
  isHovered: boolean;
  onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

function OptimizedCardImage({
  src,
  alt,
  aspectRatio,
  isHovered,
  onLoad,
}: OptimizedCardImageProps) {
  const getImageStyle = () => ({
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit:
      aspectRatio !== null && aspectRatio >= 1 ? "cover" : ("contain" as const),
    transition: "transform 0.4s ease-in-out",
    transform: isHovered ? "scale(1.08)" : "scale(1)",
  });

  // Use Next.js Image for local images
  return (
    <NextImage
      src={src}
      alt={alt}
      fill
      style={{
        objectFit:
          aspectRatio !== null && aspectRatio >= 1 ? "cover" : "contain",
        transition: "transform 0.4s ease-in-out",
        transform: isHovered ? "scale(1.08)" : "scale(1)",
      }}
      sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
      quality={85}
    />
  );
}

// ===========================
// MAIN SCRIPT CARD COMPONENT
// ===========================

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

  // Detect image aspect ratio
  const detectImageAspectRatio = useCallback((imgElement: HTMLImageElement) => {
    if (imgElement.naturalWidth && imgElement.naturalHeight) {
      const ratio = imgElement.naturalWidth / imgElement.naturalHeight;
      startTransition(() => {
        setImageAspectRatio(ratio);
      });
      logger.debug(
        "ScriptCard aspect ratio detected:",
        ratio,
        ratio >= 1 ? "landscape (cover)" : "portrait (contain)"
      );
    }
  }, []);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      detectImageAspectRatio(e.currentTarget);
    },
    [detectImageAspectRatio]
  );

  return (
    <Box
      sx={{
        position: "relative",
        cursor: "pointer",
        border: (theme) =>
          isSelected
            ? `2px solid ${theme.palette.primary.main}`
            : `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: "hidden",
        transition: "all 0.3s ease",
        bgcolor: "background.paper",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: isSelected
            ? `0 6px 20px ${theme.palette.primary.main}40`
            : theme.shadows[4],
        },
      }}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container with 16:9 aspect ratio */}
      <Box
        sx={{
          position: "relative",
          paddingTop: "56.25%", // 16:9 Aspect Ratio
          width: "100%",
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Suspense
          fallback={
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
          }
        >
          <OptimizedCardImage
            src={script.thumbnailPath || "/placeHolder.webp"}
            alt={script.scriptTitle || "Script thumbnail"}
            aspectRatio={imageAspectRatio}
            isHovered={isHovered}
            onLoad={handleImageLoad}
          />
        </Suspense>
      </Box>

      {/* Bottom overlay with title and actions */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)",
        }}
      >
        <Typography
          variant="body2"
          fontWeight="bold"
          color="white"
          sx={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {script.scriptTitle || "Untitled"}
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: "block", color: theme.palette.text.secondary }}
        >
          v{script.versions[0]?.versionNumber || 1}
        </Typography>

        {/* Action buttons */}
        <Box
          sx={{ position: "absolute", bottom: 8, right: 0, display: "flex" }}
        >
          <Tooltip title="Version details">
            <IconButton
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

// ===========================
// SKELETON CARD COMPONENT
// ===========================

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
            sx={{ bgcolor: theme.palette.primary.main }}
          />
          <Skeleton
            variant="circular"
            width={24}
            height={24}
            sx={{ bgcolor: theme.palette.primary.main }}
          />
        </Box>
      </Box>
    </Box>
  );
}
