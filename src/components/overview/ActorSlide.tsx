"use client";

import { Box, Typography, IconButton, Skeleton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { NavigateBefore, NavigateNext } from "@mui/icons-material";
import { useState, useRef, useCallback, Suspense } from "react";
import { getCurrentBrand } from "@/config/brandConfig";
import NextImage from "next/image";
import type { Actor } from "@/types/overview/types";

// ===========================
// CONSTANTS
// ===========================

const DEFAULT_IMAGE = "/placeHolder.webp";
const MIN_SWIPE_DISTANCE = 50;

// ===========================
// TYPE DEFINITIONS
// ===========================

interface ActorSlideProps {
  actor?: Actor;
  onNext: () => void;
  onPrev: () => void;
  onImageClick: () => void;
  currentIndex: number;
  totalActors: number;
}

// ===========================
// OPTIMIZED IMAGE COMPONENT
// ===========================

interface OptimizedActorImageProps {
  src: string;
  alt: string;
  onImageClick: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

function OptimizedActorImage({
  src,
  alt,
  onImageClick,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: OptimizedActorImageProps) {
  const theme = useTheme();
  const isPlaceholder = src === DEFAULT_IMAGE;

  // Use regular img for placeholder, Next.js Image for actual images
  if (isPlaceholder) {
    return (
      <Box
        component="img"
        src={DEFAULT_IMAGE}
        alt={alt}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: theme.transitions.create(["transform", "opacity"], {
            duration: theme.transitions.duration.standard,
          }),
          opacity: 1,
          transform: "scale(1)",
          "&:hover": {
            transform: "scale(1.05)",
          },
        }}
      />
    );
  }

  // Use Next.js Image for optimized loading (works with signed URLs!)
  return (
    <NextImage
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      quality={85}
      style={{
        objectFit: "cover",
      }}
      className="actor-image"
    />
  );
}

// ===========================
// MAIN COMPONENT
// ===========================

export function ActorSlide({
  actor,
  onNext,
  onPrev,
  onImageClick,
  currentIndex,
  totalActors,
}: ActorSlideProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const touchRef = useRef<HTMLDivElement>(null);

  // ===========================
  // SWIPE GESTURE HANDLERS
  // ===========================

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    if (isLeftSwipe) onNext();
    if (isRightSwipe) onPrev();
  }, [touchStart, touchEnd, onNext, onPrev]);

  // ===========================
  // EMPTY STATE
  // ===========================

  if (!actor) {
    return (
      <Box
        sx={{
          borderRadius: `${brand.borderRadius}px`,
          overflow: "hidden",
          bgcolor: "background.default",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" color="text.secondary">
            No actor data available
          </Typography>
        </Box>
      </Box>
    );
  }

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <Box
      sx={{
        borderRadius: `${brand.borderRadius}px`,
        overflow: "hidden",
        bgcolor: "background.default",
        userSelect: "none",
      }}
    >
      {/* Header with title and navigation */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 1,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline" }}>
          <Typography
            variant="subtitle1"
            fontWeight="medium"
            color="text.primary"
          >
            Actors
          </Typography>
          <Typography
            variant="subtitle2"
            fontWeight="regular"
            color="text.secondary"
            sx={{ ml: 0.5 }}
          >
            ({currentIndex + 1}/{totalActors})
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={onPrev}
            size="small"
            aria-label="Previous actor"
            sx={{
              bgcolor: "background.default",
              transition: theme.transitions.create(
                ["background-color", "transform"],
                { duration: theme.transitions.duration.short }
              ),
              "&:hover": {
                bgcolor: "action.hover",
                transform: "scale(1.1)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <NavigateBefore />
          </IconButton>

          <IconButton
            onClick={onNext}
            size="small"
            aria-label="Next actor"
            sx={{
              bgcolor: "background.default",
              transition: theme.transitions.create(
                ["background-color", "transform"],
                { duration: theme.transitions.duration.short }
              ),
              "&:hover": {
                bgcolor: "action.hover",
                transform: "scale(1.1)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <NavigateNext />
          </IconButton>
        </Box>
      </Box>

      {/* Image with swipe and animation */}
      <Box
        ref={touchRef}
        sx={{
          position: "relative",
          aspectRatio: "16/9",
          cursor: "pointer",
          overflow: "hidden",
          // Add global styles for Next.js Image hover effect
          "& .actor-image": {
            transition: theme.transitions.create(["transform"], {
              duration: theme.transitions.duration.standard,
            }),
          },
          "&:hover .actor-image": {
            transform: "scale(1.05)",
          },
        }}
        onClick={onImageClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onImageClick();
          }
        }}
        aria-label={`View ${actor.actorName || "actor"} details`}
      >
        <Suspense fallback={<Skeleton variant="rectangular" height="100%" />}>
          <OptimizedActorImage
            src={actor.thumbnailPath || DEFAULT_IMAGE}
            alt={actor.actorName || "Actor image"}
            onImageClick={onImageClick}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
        </Suspense>
      </Box>
    </Box>
  );
}

export default ActorSlide;
