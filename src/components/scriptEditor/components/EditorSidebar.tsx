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
  useTheme,
} from "@mui/material";
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

const EditorSidebar: React.FC<EditorSidebarProps> = ({
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
}) => {
  const theme = useTheme();

  // Placeholder AI Assist functions
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
        bgcolor: alpha(theme.palette.background.paper, 0.6),
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
          },
          "& .MuiTabScrollButton-root": {
            width: 20,
            opacity: 0.8,
            color: "secondary.main",
          },
          "& .MuiTabScrollButton-root:hover": {
            opacity: 1,
            backgroundColor: alpha(theme.palette.secondary.main, 0.1),
          },
        }}
      >
        <Tab label="Format" value="styles" sx={{ fontSize: 12 }} />
        <Tab label="AI Assist" value="ai" sx={{ fontSize: 12 }} />
        <Tab label="Stats" value="stats" sx={{ fontSize: 12 }} />
        <Tab label="Context" value="context" sx={{ fontSize: 12 }} />
      </Tabs>

      <Box sx={{ p: 2, overflowY: "auto", flexGrow: 1 }}>
        {/* Format Tab */}
        {activeTab === "styles" && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: "secondary.main" }}
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
                    color: "inherit",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.2),
                      borderColor: alpha(theme.palette.secondary.dark, 0.3),
                      color: "secondary.main",
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
              sx={{ mb: 1, color: "secondary.main" }}
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
                  color: "inherit",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    borderColor: alpha(theme.palette.secondary.dark, 0.3),
                    color: "secondary.main",
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
                  color: "inherit",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    borderColor: alpha(theme.palette.secondary.dark, 0.3),
                    color: "secondary.main",
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
              sx={{ mb: 1, color: "secondary.main" }}
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
                  color: "inherit",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    borderColor: alpha(theme.palette.secondary.dark, 0.3),
                    color: "secondary.main",
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
                  color: "inherit",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    borderColor: alpha(theme.palette.secondary.dark, 0.3),
                    color: "secondary.main",
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
                  color: "inherit",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    borderColor: alpha(theme.palette.secondary.dark, 0.3),
                    color: "secondary.main",
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
                  color: "inherit",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    borderColor: alpha(theme.palette.secondary.dark, 0.3),
                    color: "secondary.main",
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
                  color: "inherit",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    borderColor: alpha(theme.palette.secondary.dark, 0.3),
                    color: "secondary.main",
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
              sx={{ mb: 1, color: "secondary.main" }}
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
                  color: "inherit",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    borderColor: alpha(theme.palette.secondary.dark, 0.3),
                    color: "secondary.main",
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
                  color: "inherit",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    borderColor: alpha(theme.palette.secondary.dark, 0.3),
                    color: "secondary.main",
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
              sx={{ mb: 2, color: "secondary.main" }}
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
              <Typography variant="body2">Word Count:</Typography>
              <Typography variant="body2" fontWeight={500}>
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
              <Typography variant="body2">Character Count:</Typography>
              <Typography variant="body2" fontWeight={500}>
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
              <Typography variant="body2">Script Health:</Typography>
              <Typography variant="body2" fontWeight={500}>
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
              <Typography variant="body2">Estimated Duration:</Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Timer
                  fontSize="small"
                  sx={{
                    mr: 0.5,
                    color: "text.secondary",
                    fontSize: 16,
                  }}
                />
                <Typography variant="body2" fontWeight={500}>
                  {scriptStats.duration} seconds
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: "secondary.main" }}
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
                  sx={{
                    mb: 0.5,
                    justifyContent: "flex-start",
                    bgcolor:
                      scriptVersion === version.version
                        ? theme.palette.secondary.main
                        : undefined,
                    color:
                      scriptVersion === version.version
                        ? theme.palette.secondary.contrastText
                        : undefined,
                  }}
                  onClick={() => handleVersionChange(version.version)}
                >
                  Version {version.version} - {version.date}
                </Button>
              ))}
            </Box>
          </Box>
        )}
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
};

export default EditorSidebar;
