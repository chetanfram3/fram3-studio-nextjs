// src/components/analysisLibrary/ScriptCard.tsx
"use client";

import { useState, useCallback, Suspense, startTransition } from "react";
import { Box, Typography, IconButton, Tooltip, Skeleton } from "@mui/material";
import {
  VisibilityOutlined as ViewIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";
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
          // ✅ Theme-aware gradient overlay
          background: (theme) =>
            theme.palette.mode === "dark"
              ? // Dark mode: Darker overlay for contrast
                `linear-gradient(to top, ${alpha(
                  theme.palette.background.default,
                  0.95
                )} 0%, ${alpha(
                  theme.palette.background.default,
                  0.85
                )} 50%, transparent 100%)`
              : // Light mode: Lighter overlay with better readability
                `linear-gradient(to top, ${alpha(
                  theme.palette.background.paper,
                  0.98
                )} 0%, ${alpha(
                  theme.palette.background.paper,
                  0.92
                )} 50%, ${alpha(
                  theme.palette.background.paper,
                  0.7
                )} 70%, transparent 100%)`,
        }}
      >
        <Typography
          variant="body2"
          fontWeight="bold"
          // ✅ Use theme text color instead of hardcoded white
          sx={{
            color: "text.primary",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 1px 2px rgba(0, 0, 0, 0.5)"
                : "0 1px 2px rgba(255, 255, 255, 0.8)",
          }}
        >
          {script.scriptTitle || "Untitled"}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: "text.secondary",
          }}
        >
          v{script.versions[0]?.versionNumber || 1}
        </Typography>

        {/* Action buttons remain the same */}
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

      {/* Bottom overlay for skeleton - THEME AWARE */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          // ✅ Theme-aware background
          background: (theme) =>
            theme.palette.mode === "dark"
              ? alpha(theme.palette.background.default, 0.9)
              : alpha(theme.palette.background.paper, 0.95),
        }}
      >
        {/* Title skeleton */}
        <Skeleton
          variant="text"
          width="70%"
          height={28}
          sx={{
            mb: 1,
            // ✅ Theme-aware skeleton color
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? alpha(theme.palette.primary.main, 0.2)
                : alpha(theme.palette.grey[400], 0.3),
          }}
        />

        {/* Version number skeleton */}
        <Skeleton
          variant="text"
          width="30%"
          height={20}
          sx={{
            mb: 2,
            // ✅ Theme-aware skeleton color
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? alpha(theme.palette.primary.main, 0.2)
                : alpha(theme.palette.grey[400], 0.3),
          }}
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
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.3),
            }}
          />
          <Skeleton
            variant="circular"
            width={24}
            height={24}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.3),
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
