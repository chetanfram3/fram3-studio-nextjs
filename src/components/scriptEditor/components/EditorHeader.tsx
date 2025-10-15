// components/scripts/EditorHeader.tsx
"use client";

import { useCallback, startTransition } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Chip,
  Button,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  ArrowCircleLeft,
  Edit,
  Check,
  AccessTime,
  Fullscreen,
  FullscreenExit,
  Save,
  MoreVert,
  PlayCircleOutline,
} from "@mui/icons-material";
import { FileStack } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";

interface EditorHeaderProps {
  title: string;
  scriptType: string;
  scriptVersion: number;
  lastSaved: string;
  isSaving: boolean;
  isFullScreen: boolean;
  showSidebar: boolean;
  isEditingTitle: boolean;
  titleInputRef: React.RefObject<HTMLInputElement>;
  setShowSidebar: (show: boolean) => void;
  handleTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTitleSubmit: () => void;
  handleTitleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  setIsEditingTitle: (isEditing: boolean) => void;
  toggleFullScreen: () => void;
  handleSave: () => void;
  handleCreateNewVersion: () => void;
  hasUnsavedChanges: boolean;
  analysisGenerated?: boolean;
  analyzedScriptId?: string;
  analyzedVersionId?: string;
}

export default function EditorHeader({
  title,
  scriptType,
  scriptVersion,
  lastSaved,
  isSaving,
  isFullScreen,
  showSidebar,
  isEditingTitle,
  titleInputRef,
  setShowSidebar,
  handleTitleChange,
  handleTitleSubmit,
  handleTitleKeyDown,
  setIsEditingTitle,
  toggleFullScreen,
  handleSave,
  handleCreateNewVersion,
  hasUnsavedChanges,
  analysisGenerated,
  analyzedScriptId,
  analyzedVersionId,
}: EditorHeaderProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();
  const router = useRouter();

  const handleViewAnalysis = useCallback(() => {
    if (analyzedScriptId && analyzedVersionId) {
      startTransition(() => {
        router.push(
          `/story/${analyzedScriptId}/version/${analyzedVersionId}/3`
        );
      });
    }
  }, [analyzedScriptId, analyzedVersionId, router]);

  const handleToggleSidebar = useCallback(() => {
    setShowSidebar(!showSidebar);
  }, [showSidebar, setShowSidebar]);

  const handleEditTitle = useCallback(() => {
    setIsEditingTitle(true);
  }, [setIsEditingTitle]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 1.5,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: "blur(8px)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* Toggle Sidebar Button */}
        <Tooltip title={showSidebar ? "Hide Sidebar" : "Show Sidebar"}>
          <IconButton
            size="small"
            onClick={handleToggleSidebar}
            sx={{
              color: "text.secondary",
              "&:hover": {
                color: "primary.main",
              },
            }}
          >
            <ArrowCircleLeft
              sx={{
                transform: !showSidebar ? "rotate(180deg)" : "none",
                transition: theme.transitions.create("transform", {
                  duration: theme.transitions.duration.standard,
                }),
              }}
            />
          </IconButton>
        </Tooltip>

        {/* Script Type */}
        <Chip
          label={scriptType}
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.primary.dark, 0.6),
            color: "primary.contrastText",
            fontWeight: 500,
            fontFamily: brand.fonts.body,
            borderRadius: `${brand.borderRadius * 0.5}px`,
          }}
        />

        {/* Editable Title */}
        <Box>
          {isEditingTitle ? (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TextField
                inputRef={titleInputRef}
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleSubmit}
                onKeyDown={handleTitleKeyDown}
                variant="outlined"
                size="small"
                sx={{
                  maxWidth: 300,
                  "& .MuiOutlinedInput-root": {
                    py: 0.5,
                    bgcolor: alpha(theme.palette.background.default, 0.4),
                    fontFamily: brand.fonts.body,
                    "& fieldset": {
                      borderColor: "primary.main",
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.dark",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "text.primary",
                  },
                }}
              />
              <IconButton
                size="small"
                onClick={handleTitleSubmit}
                sx={{
                  ml: 0.5,
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <Check fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                "&:hover .edit-icon": { opacity: 1 },
                "&:hover": {
                  "& .MuiTypography-root": {
                    color: "primary.main",
                  },
                },
              }}
              onClick={handleEditTitle}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 500,
                  fontFamily: brand.fonts.heading,
                  color: "text.primary",
                  transition: theme.transitions.create("color", {
                    duration: theme.transitions.duration.shortest,
                  }),
                }}
              >
                {title}
              </Typography>
              <Edit
                className="edit-icon"
                sx={{
                  ml: 1,
                  fontSize: 16,
                  opacity: 0,
                  transition: theme.transitions.create("opacity", {
                    duration: theme.transitions.duration.short,
                  }),
                  color: "text.secondary",
                }}
              />
            </Box>
          )}

          {/* Version information */}
          <Box
            sx={{ display: "flex", alignItems: "center", mt: 0.5, gap: 0.5 }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontFamily: brand.fonts.body,
              }}
            >
              Version {scriptVersion}
            </Typography>

            {/* Analysis status indicator */}
            {analysisGenerated && (
              <Tooltip title="View Analysis">
                <Chip
                  icon={<PlayCircleOutline sx={{ fontSize: 16 }} />}
                  label="Analyzed"
                  size="small"
                  onClick={handleViewAnalysis}
                  sx={{
                    height: 20,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: "success.main",
                    border: 1,
                    borderColor: alpha(theme.palette.success.main, 0.3),
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                    cursor: "pointer",
                    fontFamily: brand.fonts.body,
                    transition: theme.transitions.create(
                      ["background-color", "border-color"],
                      {
                        duration: theme.transitions.duration.short,
                      }
                    ),
                    "&:hover": {
                      bgcolor: alpha(theme.palette.success.main, 0.2),
                      borderColor: alpha(theme.palette.success.main, 0.5),
                    },
                    "& .MuiChip-icon": {
                      marginLeft: "4px",
                      color: "success.main",
                    },
                  }}
                />
              </Tooltip>
            )}

            <AccessTime
              sx={{ fontSize: 12, color: "text.secondary", ml: 0.5 }}
            />
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontFamily: brand.fonts.body,
              }}
            >
              Last saved: {lastSaved}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Save Button */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={isSaving}
          sx={{
            borderColor: isSaving ? "primary.dark" : "primary.main",
            color: isSaving ? "text.secondary" : "primary.main",
            fontFamily: brand.fonts.body,
            borderRadius: `${brand.borderRadius}px`,
            transition: theme.transitions.create(
              ["border-color", "color", "background-color"],
              {
                duration: theme.transitions.duration.short,
              }
            ),
            "&:hover": {
              borderColor: "primary.dark",
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
            "&.Mui-disabled": {
              borderColor: "divider",
              color: "text.disabled",
            },
          }}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>

        {/* New Version Button */}
        <Button
          variant="outlined"
          size="small"
          onClick={handleCreateNewVersion}
          startIcon={<FileStack size={16} />}
          disabled={!hasUnsavedChanges}
          sx={{
            borderColor: hasUnsavedChanges ? "primary.main" : "divider",
            color: hasUnsavedChanges ? "primary.main" : "text.disabled",
            fontFamily: brand.fonts.body,
            borderRadius: `${brand.borderRadius}px`,
            transition: theme.transitions.create(
              ["border-color", "color", "background-color"],
              {
                duration: theme.transitions.duration.short,
              }
            ),
            "&:hover": {
              borderColor: "primary.dark",
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
            "&.Mui-disabled": {
              borderColor: "divider",
              color: "text.disabled",
            },
          }}
        >
          New Version
        </Button>

        {/* Fullscreen Toggle */}
        <Tooltip title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
          <IconButton
            onClick={toggleFullScreen}
            sx={{
              color: "text.secondary",
              "&:hover": {
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            {isFullScreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Tooltip>

        {/* More Options */}
        <Tooltip title="More Options">
          <IconButton
            sx={{
              color: "text.secondary",
              "&:hover": {
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <MoreVert />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
