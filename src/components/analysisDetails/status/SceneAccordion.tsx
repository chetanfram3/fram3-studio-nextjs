"use client";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Grid,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import StatusChip from "./StatusChip";
import type { SceneStatus } from "@/types/analysisStatus";

/**
 * SceneAccordion - Displays scenes and their shots in an expandable accordion
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Efficient rendering of nested scene/shot data
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - No hardcoded colors or spacing
 *
 * @param scenes - Array of scene status objects with optional shots
 */

interface SceneAccordionProps {
  scenes: SceneStatus[];
}

export default function SceneAccordion({ scenes }: SceneAccordionProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Handle cases where scenes might be undefined or empty
  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          No scene data available.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {scenes.map((scene, index) => {
        // Handle different scene structure types
        const sceneId = scene.sceneID || scene.sceneId || `scene-${index + 1}`;
        const shots = scene.shots || [];

        // If no shots array, treat the scene itself as a single item
        if (!Array.isArray(shots) || shots.length === 0) {
          return (
            <Accordion
              key={sceneId}
              sx={{
                mb: 1,
                bgcolor: "background.paper",
                borderRadius: `${brand.borderRadius}px`,
                "&:before": { display: "none" },
                border: 1,
                borderColor: "divider",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}
                sx={{
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    pr: 2,
                  }}
                >
                  <Typography
                    sx={{ fontFamily: brand.fonts.body, color: "text.primary" }}
                  >
                    Scene {sceneId}
                  </Typography>
                  <StatusChip status={scene.status || "Unknown"} />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ bgcolor: "background.paper" }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  No shot details available for this scene.
                </Typography>
                {scene.error && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{
                      mt: 0.5,
                      display: "block",
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    {scene.error}
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          );
        }

        return (
          <Accordion
            key={sceneId}
            sx={{
              mb: 1,
              bgcolor: "background.paper",
              borderRadius: `${brand.borderRadius}px`,
              "&:before": { display: "none" },
              border: 1,
              borderColor: "divider",
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}
              sx={{
                bgcolor: "background.paper",
              }}
            >
              <Typography
                sx={{ fontFamily: brand.fonts.body, color: "text.primary" }}
              >
                Scene {sceneId}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ bgcolor: "background.paper" }}>
              <Grid container spacing={2}>
                {shots.map((shot, shotIndex) => {
                  const shotNumber = shot.shotNumber || `shot-${shotIndex + 1}`;
                  const shotStatus = shot.status || "Unknown";

                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={shotNumber}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: 1,
                          border: 1,
                          borderColor: "divider",
                          borderRadius: `${brand.borderRadius * 0.5}px`,
                          bgcolor: "background.default",
                          transition: theme.transitions.create(
                            ["border-color"],
                            {
                              duration: theme.transitions.duration.shorter,
                            }
                          ),
                          "&:hover": {
                            borderColor: "primary.main",
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: brand.fonts.body,
                            color: "text.primary",
                          }}
                        >
                          Shot {shotNumber}
                        </Typography>
                        <StatusChip status={shotStatus} />
                      </Box>
                      {shot.error && shotStatus !== "Completed" && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{
                            mt: 0.5,
                            display: "block",
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          {shot.error}
                        </Typography>
                      )}
                    </Grid>
                  );
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
