// SceneCard.tsx - Ported to Next.js 15 with React 19 optimizations
"use client";

import { useState, useMemo, useCallback, startTransition } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowRight,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import { ShotThumbnail } from "./ShotThumbnail";
import type { Scene, Shot } from "@/types/storyBoard/types";
import logger from "@/utils/logger";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Props for SceneCard component
 */
interface SceneCardProps {
  scene?: Scene;
  selectedShot?: Shot | null;
  onShotSelect: (shot: Shot, sceneId: number) => void;
  selectedSceneId?: number | null;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";
}

/**
 * Grid columns configuration
 */
type GridColumns = {
  xs: string;
  sm: string;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * SceneCard Component
 *
 * Displays a scene with its shots in a collapsible card format.
 * Features:
 * - Expandable/collapsible shot grid
 * - Responsive grid layout based on aspect ratio
 * - Shot selection handling
 * - Scene information tooltip
 * - Theme-aware styling
 *
 * @component
 */
export function SceneCard({
  scene,
  selectedShot,
  onShotSelect,
  selectedSceneId,
  aspectRatio = "16:9",
}: SceneCardProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  // ==========================================
  // STATE
  // ==========================================
  const [isExpanded, setIsExpanded] = useState(true);

  // ==========================================
  // MEMOIZED VALUES
  // ==========================================

  // React 19: useMemo for flattened shots
  const allShots = useMemo(() => {
    if (!scene?.lines) return [];

    return scene.lines
      .flatMap((line) => line?.shots || [])
      .filter((shot): shot is Shot => Boolean(shot));
  }, [scene?.lines]);

  // React 19: useMemo for grid columns configuration
  const gridColumns = useMemo(() => {
    switch (aspectRatio) {
      case "9:16":
        return {
          xs: "repeat(3, 1fr)",
          sm: "repeat(4, 1fr)",
        } as const;
      case "1:1":
        return {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
        } as const;
      case "16:9":
      default:
        return {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
        } as const;
    }
  }, [aspectRatio]);

  // ==========================================
  // CALLBACKS
  // ==========================================

  // React 19: useCallback for scene toggle
  const handleSceneToggle = useCallback(() => {
    startTransition(() => {
      setIsExpanded((prev) => !prev);
      logger.debug(
        `Scene ${scene?.sceneId} ${isExpanded ? "collapsed" : "expanded"}`
      );
    });
  }, [scene?.sceneId, isExpanded]);

  // React 19: useCallback for shot selection
  const handleShotClick = useCallback(
    (shot: Shot) => {
      if (!scene) return;

      logger.debug("Shot selected", {
        sceneId: scene.sceneId,
        shotId: shot.shotId,
      });

      onShotSelect(shot, scene.sceneId);
    },
    [scene, onShotSelect]
  );

  // ==========================================
  // RENDER
  // ==========================================

  // Early return for no scene data
  if (!scene) {
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
        }}
      >
        <Typography
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          No scene data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mb: 3,
        bgcolor: "background.paper",
        borderRadius: `${brand.borderRadius}px`,
        border: 1,
        borderColor: "divider",
        p: 2,
        transition: theme.transitions.create(["box-shadow", "border-color"], {
          duration: theme.transitions.duration.short,
        }),
        "&:hover": {
          boxShadow: theme.shadows[2],
          borderColor: "primary.main",
        },
      }}
    >
      {/* Scene Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: isExpanded ? 2 : 0,
        }}
      >
        {/* Scene Title with Toggle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            transition: theme.transitions.create("opacity", {
              duration: theme.transitions.duration.short,
            }),
            "&:hover": {
              opacity: 0.8,
            },
          }}
          onClick={handleSceneToggle}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={`Toggle scene ${scene.sceneId} details`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSceneToggle();
            }
          }}
        >
          <IconButton
            size="small"
            sx={{
              p: 0.5,
              color: "primary.main",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
            aria-label={isExpanded ? "Collapse scene" : "Expand scene"}
          >
            {isExpanded ? (
              <KeyboardArrowDown sx={{ color: "primary.main" }} />
            ) : (
              <KeyboardArrowRight sx={{ color: "primary.main" }} />
            )}
          </IconButton>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: "primary.main",
              fontFamily: brand.fonts.heading,
            }}
          >
            Scene {scene.sceneId ?? "?"}
          </Typography>
          {allShots.length > 0 && (
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontFamily: brand.fonts.body,
                ml: 1,
              }}
            >
              ({allShots.length} {allShots.length === 1 ? "shot" : "shots"})
            </Typography>
          )}
        </Box>

        {/* Scene Info Tooltip */}
        <Tooltip
          title={scene.sceneTextContent || "No summary available"}
          arrow
          placement="left"
        >
          <IconButton
            size="small"
            sx={{
              color: "text.secondary",
              transition: theme.transitions.create("color", {
                duration: theme.transitions.duration.short,
              }),
              "&:hover": {
                color: "primary.main",
                bgcolor: "action.hover",
              },
            }}
            aria-label="Scene information"
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Shots Grid */}
      {isExpanded && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: gridColumns,
            gap: 1.5,
            pl: { xs: 2, sm: 4 },
            animation: "fadeIn 0.3s ease-in-out",
            "@keyframes fadeIn": {
              from: { opacity: 0, transform: "translateY(-10px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          {allShots.length > 0 ? (
            allShots.map((shot) => {
              const isSelected =
                selectedShot?.shotId === shot.shotId &&
                selectedSceneId === scene.sceneId;

              // Generate unique key
              const shotKey = `scene-${scene.sceneId}-shot-${shot.shotId || Date.now()}`;

              return (
                <ShotThumbnail
                  key={shotKey}
                  shot={shot}
                  isSelected={isSelected}
                  onClick={() => handleShotClick(shot)}
                  aspectRatio={aspectRatio}
                />
              );
            })
          ) : (
            <Box
              sx={{
                gridColumn: "1 / -1",
                py: 4,
                textAlign: "center",
                bgcolor: "action.hover",
                borderRadius: `${brand.borderRadius}px`,
                border: 1,
                borderColor: "divider",
                borderStyle: "dashed",
              }}
            >
              <Typography
                color="text.secondary"
                variant="body2"
                sx={{ fontFamily: brand.fonts.body }}
              >
                No shots available for this scene
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
