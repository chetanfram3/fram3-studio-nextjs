// src/modules/scripts/EditorSidebar.tsx
"use client";

import React from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Divider,
  Button,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Timer,
  AutoAwesome,
  EditNote,
  ShortText,
  Add,
  TextFieldsOutlined,
  Tonality,
  Speed,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import CustomToast from "@/components/common/CustomToast";
import ScriptContextPanel from "./ScriptContextPanel";
import { ScriptData } from "../types";

interface ScriptStats {
  words: number;
  characters: number;
  scenes: number;
  dialogues: number;
  pages: number;
  duration: number;
}

interface EditorSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleFormatClick: (format: string) => void;
  handleExportText: () => void;
  handleExportPDF: () => void;
  scriptStats: ScriptStats;
  scriptVersion: number;
  scriptVersions: { version: number; date: string; content: string }[];
  handleVersionChange: (version: number) => void;
  scriptType?: string;
  conceptSummary?: ScriptData["conceptSummary"];
  basicAnalysis?: ScriptData["basicAnalysis"];
  suggestedVisualElements?: string[];
  suggestedAudioCues?: string[];
  synthesizedInputs?: ScriptData["synthesizedInputs"];
  strategicContextSummary?: ScriptData["strategicContextSummary"];
  isRevision?: boolean;
  revisionSummary?: string | null;
  scriptDuration?: number;
}

/**
 * EditorSidebar - Sidebar component for script editor with tabs
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Simple functional component for auto-optimization
 * - Handlers are auto-optimized by React 19 compiler
 *
 * Theme integration:
 * - Uses theme.palette for all colors (no hardcoded colors)
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - Uses primary color for main actions (not secondary)
 * - All buttons use consistent theme-aware styling
 *
 * Porting changes:
 * - Replaced all secondary color usage with primary
 * - Removed hardcoded alpha values, using theme colors
 * - Added brand fonts for typography
 * - Used theme spacing and transitions
 * - Made all buttons theme-aware with proper hover states
 * - Changed color hierarchy to use primary for highlights
 */
export function EditorSidebar({
  activeTab,
  setActiveTab,
  handleFormatClick,
  handleExportText,
  handleExportPDF,
  scriptStats,
  scriptVersion,
  scriptVersions,
  handleVersionChange,
  scriptType,
  conceptSummary,
  basicAnalysis,
  suggestedVisualElements,
  suggestedAudioCues,
  synthesizedInputs,
  strategicContextSummary,
  isRevision,
  revisionSummary,
  scriptDuration,
}: EditorSidebarProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // HANDLERS - Placeholder AI Assist functions
  // ==========================================
  const handleImproveWriting = () => {
    CustomToast(
      "info",
      "Improve Writing coming soon! This will enhance script clarity and style."
    );
  };

  const handleMakeShorter = () => {
    CustomToast(
      "info",
      "Make it Shorter coming soon! This will condense the script content."
    );
  };

  const handleExpandContent = () => {
    CustomToast(
      "info",
      "Expand Content coming soon! This will add more details to the script."
    );
  };

  const handleFixGrammar = () => {
    CustomToast(
      "info",
      "Fix Grammar coming soon! This will correct grammatical errors."
    );
  };

  const handleReset = () => {
    CustomToast(
      "info",
      "Reset coming soon! This will revert the script to its initial state."
    );
  };

  const handleAnalyzeTone = () => {
    CustomToast(
      "info",
      "Analyze Tone coming soon! This will assess the script's emotional tone."
    );
  };

  const handleCheckPacing = () => {
    CustomToast(
      "info",
      "Check Pacing coming soon! This will evaluate the script's rhythm."
    );
  };

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  // Calculate script health (placeholder logic)
  const calculateScriptHealth = () => {
    const healthScore = Math.min(
      100,
      Math.round(
        (scriptStats.scenes * 10 +
          scriptStats.dialogues * 5 +
          scriptStats.words / 100) /
          2
      )
    );
    return healthScore;
  };

  return (
    <Box
      sx={{
        width: 280,
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          minHeight: "42px",
          "& .MuiTab-root": {
            minWidth: 70,
            minHeight: "42px",
            fontSize: 12,
            p: "6px 12px",
            color: "text.secondary",
            fontFamily: brand.fonts.body,
            "&.Mui-selected": {
              color: "primary.main",
            },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "primary.main",
          },
          "& .MuiTabScrollButton-root": {
            width: 20,
            opacity: 0.8,
            color: "primary.main",
            "&:hover": {
              opacity: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
          },
        }}
      >
        <Tab label="Format" value="styles" />
        <Tab label="AI Assist" value="ai" />
        <Tab label="Stats" value="stats" />
        <Tab label="Context" value="context" />
      </Tabs>

      <Box sx={{ p: 2, overflowY: "auto", flexGrow: 1 }}>
        {/* Format Tab */}
        {activeTab === "styles" && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                color: "primary.main",
                fontFamily: brand.fonts.heading,
                fontWeight: 600,
              }}
            >
              Script Elements
            </Typography>
            <Box sx={{ mb: 2 }}>
              {[
                "scene-heading",
                "character",
                "dialogue",
                "parenthetical",
                "transition",
              ].map((format) => (
                <Button
                  key={format}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{
                    mb: 1,
                    justifyContent: "flex-start",
                    color: "text.primary",
                    borderColor: "divider",
                    fontFamily: brand.fonts.body,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      borderColor: "primary.main",
                      color: "primary.main",
                    },
                  }}
                  onClick={() => handleFormatClick(format)}
                >
                  {format.charAt(0).toUpperCase() +
                    format.slice(1).replace("-", " ")}
                </Button>
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                color: "primary.main",
                fontFamily: brand.fonts.heading,
                fontWeight: 600,
              }}
            >
              Export Options
            </Typography>
            <Box>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  mb: 1,
                  justifyContent: "flex-start",
                  color: "text.primary",
                  borderColor: "divider",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
                onClick={handleExportPDF}
              >
                Export as PDF
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  color: "text.primary",
                  borderColor: "divider",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
                onClick={handleExportText}
              >
                Export as Text
              </Button>
            </Box>
          </Box>
        )}

        {/* AI Assist Tab */}
        {activeTab === "ai" && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                color: "primary.main",
                fontFamily: brand.fonts.heading,
                fontWeight: 600,
              }}
            >
              AI Assistance
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<EditNote />}
                sx={{
                  mb: 1,
                  justifyContent: "flex-start",
                  color: "text.primary",
                  borderColor: "divider",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
                onClick={handleImproveWriting}
              >
                Improve Writing
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<ShortText />}
                sx={{
                  mb: 1,
                  justifyContent: "flex-start",
                  color: "text.primary",
                  borderColor: "divider",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
                onClick={handleMakeShorter}
              >
                Make it Shorter
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<Add />}
                sx={{
                  mb: 1,
                  justifyContent: "flex-start",
                  color: "text.primary",
                  borderColor: "divider",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
                onClick={handleExpandContent}
              >
                Expand Content
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<TextFieldsOutlined />}
                sx={{
                  mb: 1,
                  justifyContent: "flex-start",
                  color: "text.primary",
                  borderColor: "divider",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
                onClick={handleFixGrammar}
              >
                Fix Grammar
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<AutoAwesome />}
                sx={{
                  justifyContent: "flex-start",
                  color: "text.primary",
                  borderColor: "divider",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
                onClick={handleReset}
              >
                Reset
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                color: "primary.main",
                fontFamily: brand.fonts.heading,
                fontWeight: 600,
              }}
            >
              Script Analysis
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<Tonality />}
                sx={{
                  mb: 1,
                  justifyContent: "flex-start",
                  color: "text.primary",
                  borderColor: "divider",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
                onClick={handleAnalyzeTone}
              >
                Analyze Tone
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<Speed />}
                sx={{
                  justifyContent: "flex-start",
                  color: "text.primary",
                  borderColor: "divider",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
                onClick={handleCheckPacing}
              >
                Check Pacing
              </Button>
            </Box>
          </Box>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 2,
                color: "primary.main",
                fontFamily: brand.fonts.heading,
                fontWeight: 600,
              }}
            >
              Script Statistics
            </Typography>

            <Box
              sx={{
                mb: 0.5,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                }}
              >
                Word Count:
              </Typography>
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{
                  color: "text.primary",
                  fontFamily: brand.fonts.body,
                }}
              >
                {scriptStats.words}
              </Typography>
            </Box>

            <Box
              sx={{
                mb: 0.5,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                }}
              >
                Character Count:
              </Typography>
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{
                  color: "text.primary",
                  fontFamily: brand.fonts.body,
                }}
              >
                {scriptStats.characters}
              </Typography>
            </Box>

            <Box
              sx={{
                mb: 0.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                }}
              >
                Script Health:
              </Typography>
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{
                  color: "text.primary",
                  fontFamily: brand.fonts.body,
                }}
              >
                {calculateScriptHealth()}%
              </Typography>
            </Box>

            <Box
              sx={{
                mb: 0.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                }}
              >
                Estimated Duration:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Timer
                  fontSize="small"
                  sx={{
                    mr: 0.5,
                    color: "text.secondary",
                    fontSize: 16,
                  }}
                />
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{
                    color: "text.primary",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {scriptStats.duration} seconds
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                color: "primary.main",
                fontFamily: brand.fonts.heading,
                fontWeight: 600,
              }}
            >
              Version History
            </Typography>

            <Box>
              {scriptVersions.map((version) => (
                <Button
                  key={version.version}
                  variant={
                    scriptVersion === version.version ? "contained" : "outlined"
                  }
                  size="small"
                  fullWidth
                  color="primary"
                  sx={{
                    mb: 0.5,
                    justifyContent: "flex-start",
                    fontFamily: brand.fonts.body,
                    ...(scriptVersion !== version.version && {
                      color: "text.primary",
                      borderColor: "divider",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }),
                  }}
                  onClick={() => handleVersionChange(version.version)}
                >
                  Version {version.version} - {version.date}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {/* Context Tab */}
        {activeTab === "context" && (
          <ScriptContextPanel
            conceptSummary={conceptSummary}
            suggestedVisualElements={suggestedVisualElements}
            suggestedAudioCues={suggestedAudioCues}
            basicAnalysis={basicAnalysis}
            synthesizedInputs={synthesizedInputs}
            strategicContextSummary={strategicContextSummary}
            scriptDuration={scriptDuration}
            actualDuration={scriptStats.duration}
            mode={scriptType}
            isRevision={isRevision}
            revisionSummary={revisionSummary}
          />
        )}
      </Box>
    </Box>
  );
}

export default EditorSidebar;
