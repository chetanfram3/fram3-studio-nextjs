"use client";

import {
  Box,
  Typography,
  Tabs,
  Tab,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
} from "@mui/material";
import { ExpandMoreOutlined } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useState, useCallback, useMemo } from "react";
import type {
  ScriptMetrics as ScriptMetricsType,
  SceneAnalysis,
} from "@/types/market/types";

interface ScriptMetricsProps {
  scriptMetrics?: ScriptMetricsType;
}

export function ScriptMetrics({ scriptMetrics }: ScriptMetricsProps) {
  const [selectedTab, setSelectedTab] = useState("logline");
  const theme = useTheme();
  const brand = getCurrentBrand();

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: string) => {
      setSelectedTab(newValue);
    },
    []
  );

  // Memoize derived data
  const { analysisScores, sceneAnalysis, analysisScoresArray } = useMemo(() => {
    const scores = scriptMetrics?.scriptAnalysisScores || {};
    const scenes = scriptMetrics?.sceneAnalysis || [];
    const scoresArray = Object.entries(scores);

    return {
      analysisScores: scores,
      sceneAnalysis: scenes,
      analysisScoresArray: scoresArray,
    };
  }, [scriptMetrics]);

  if (!scriptMetrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.primary">
          No script metrics available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: `${brand.borderRadius}px`,
        bgcolor: "background.default",
        border: 1,
        borderColor: "divider",
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        color="text.primary"
        sx={{ fontFamily: brand.fonts.heading }}
      >
        Script Metrics
      </Typography>

      <Box
        sx={{
          borderRadius: `${brand.borderRadius * 0.5}px`,
          p: 0.5,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            backgroundColor: "background.paper",
            borderRadius: `${brand.borderRadius * 0.5}px`,
            minHeight: "36px",
            "& .MuiTabs-indicator": {
              display: "none",
            },
            "& .MuiTab-root": {
              flex: 1,
              fontSize: "0.875rem",
              fontWeight: 500,
              fontFamily: brand.fonts.body,
              color: "text.secondary",
              borderRadius: `${brand.borderRadius * 0.5}px`,
              transition: "color 0.3s, background-color 0.3s",
              textAlign: "center",
              minHeight: "36px",
            },
            "& .Mui-selected": {
              backgroundColor: "background.default",
              color: "primary.main",
            },
            "& .MuiTab-root:not(.Mui-selected):hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          <Tab value="logline" label="Logline" />
          <Tab value="analysis" label="Analysis" />
          <Tab value="scenes" label="Scenes" />
        </Tabs>
      </Box>

      {/* Logline Tab */}
      {selectedTab === "logline" && (
        <Box
          sx={{
            p: 3,
            bgcolor: "background.default",
            borderRadius: `${brand.borderRadius * 0.5}px`,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontStyle: "italic",
              fontSize: "1.25rem",
              color: "text.primary",
            }}
          >
            {scriptMetrics.logline || "No logline available"}
          </Typography>
        </Box>
      )}

      {/* Analysis Tab */}
      {selectedTab === "analysis" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          {analysisScoresArray.length > 0 ? (
            analysisScoresArray.map(([key, value]) => {
              const scoreValue = typeof value === "number" ? value : 0;
              return (
                <Box key={key}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.primary">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {scoreValue}%
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: "100%",
                      bgcolor: "action.hover",
                      borderRadius: `${brand.borderRadius * 0.5}px`,
                    }}
                  >
                    <Box
                      sx={{
                        height: 8,
                        width: `${scoreValue}%`,
                        bgcolor: "primary.main",
                        borderRadius: `${brand.borderRadius * 0.5}px`,
                        transition: theme.transitions.create("width"),
                      }}
                    />
                  </Box>
                </Box>
              );
            })
          ) : (
            <Typography color="text.primary">
              No analysis scores available
            </Typography>
          )}
        </Box>
      )}

      {/* Scenes Tab */}
      {selectedTab === "scenes" && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            bgcolor: "background.default",
            mt: 2,
          }}
        >
          {sceneAnalysis.length > 0 ? (
            sceneAnalysis.map((scene: SceneAnalysis) => (
              <Accordion
                key={scene?.sceneId || "unknown"}
                sx={{
                  bgcolor: "background.default",
                  borderRadius: `${brand.borderRadius * 0.5}px`,
                  "&:before": { display: "none" },
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreOutlined sx={{ color: "text.secondary" }} />
                  }
                  sx={{ bgcolor: "background.default" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle1" color="text.primary">
                      Scene {scene?.sceneId || "Unknown"}
                    </Typography>
                    <Chip
                      label={`${scene?.engagementScore ?? 0}%`}
                      sx={{
                        fontWeight: "medium",
                        fontSize: "0.75rem",
                        color: "primary.main",
                        bgcolor: "transparent",
                        border: 1,
                        borderColor: "primary.main",
                        borderRadius: `${brand.borderRadius * 2}px`,
                      }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "background.default" }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Emotional Impact
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {scene?.emotionalImpact || "No emotional impact data"}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: "1fr 1fr",
                      mb: 2,
                    }}
                  >
                    {[
                      { label: "Pacing", value: scene?.pacing ?? 0 },
                      {
                        label: "Visual Impact",
                        value: scene?.visualImpact ?? 0,
                      },
                      {
                        label: "Brand Alignment",
                        value: scene?.brandAlignment ?? 0,
                      },
                      {
                        label: "Product Placement",
                        value: scene?.productPlacement ?? 0,
                      },
                    ].map((metric) => (
                      <Box key={metric.label}>
                        <Typography variant="caption" color="text.secondary">
                          {metric.label}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              flex: 1,
                              bgcolor: "action.hover",
                              borderRadius: `${brand.borderRadius * 0.5}px`,
                            }}
                          >
                            <Box
                              sx={{
                                height: 4,
                                width: `${metric.value}%`,
                                bgcolor: "primary.main",
                                borderRadius: `${brand.borderRadius * 0.5}px`,
                              }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.primary">
                            {metric.value}%
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Strengths
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {scene?.strengths || "No strengths data"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Suggestions
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {scene?.suggestions || "No suggestions available"}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Typography color="text.primary">
              No scene analysis available
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

ScriptMetrics.displayName = "ScriptMetrics";
