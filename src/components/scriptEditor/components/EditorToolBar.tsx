// src/modules/scripts/EditorToolbar.tsx
"use client";

import React from "react";
import { Box, Button, Divider, alpha, SxProps, Theme } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  StrikethroughS,
  FormatListBulleted,
  FormatListNumbered,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  Undo,
  Redo,
  TableChart,
  Add,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
  sx?: SxProps<Theme>;
}

/**
 * EditorToolbar - Toolbar for TipTap editor with formatting controls
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Simple functional component for auto-optimization
 * - Handler function auto-optimized by React 19 compiler
 *
 * Theme integration:
 * - Uses theme.palette for all colors (no hardcoded colors)
 * - Uses brand configuration for fonts
 * - Respects light/dark mode automatically
 * - Uses primary color for active states (not secondary)
 * - All buttons use consistent theme-aware styling
 *
 * Porting changes:
 * - Replaced all secondary color usage with primary
 * - Changed active button styling to use primary color
 * - Removed hardcoded alpha values
 * - Used theme colors for backgrounds
 * - Made all buttons theme-aware
 * - Added proper hover states
 */
export function EditorToolbar({ editor, sx }: EditorToolbarProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // EARLY RETURN
  // ==========================================
  if (!editor) return null;

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleFormatClick = (command: string, value?: string | number) => {
    if (!editor) return;
    switch (command) {
      case "toggleBold":
        editor.chain().focus().toggleBold().run();
        break;
      case "toggleItalic":
        editor.chain().focus().toggleItalic().run();
        break;
      case "toggleUnderline":
        editor.chain().focus().toggleUnderline().run();
        break;
      case "toggleStrike":
        editor.chain().focus().toggleStrike().run();
        break;
      case "toggleBulletList":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "toggleOrderedList":
        editor.chain().focus().toggleOrderedList().run();
        break;
      case "setTextAlign":
        if (value)
          editor
            .chain()
            .focus()
            .setTextAlign(value as string)
            .run();
        break;
      case "create-table":
        if (editor.isActive("paragraph")) {
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
        } else {
          // Just set the node directly and then insert table
          editor.commands.setNode("paragraph");
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
        }
        break;
      case "add-row":
        if (editor.isActive("table")) {
          editor.chain().focus().addRowAfter().run();
        }
        break;
      case "add-column":
        if (editor.isActive("table")) {
          editor.chain().focus().addColumnAfter().run();
        }
        break;
      case "undo":
        editor.chain().focus().undo().run();
        break;
      case "redo":
        editor.chain().focus().redo().run();
        break;
    }
  };

  // ==========================================
  // HELPER FUNCTION FOR BUTTON STYLES
  // ==========================================
  const getButtonStyles = (isActive: boolean) => ({
    minWidth: 0,
    px: 1,
    fontFamily: brand.fonts.body,
    ...(isActive
      ? {
          bgcolor: "primary.main",
          color: "primary.contrastText",
          borderColor: "primary.main",
          "&:hover": {
            bgcolor: "primary.dark",
            borderColor: "primary.dark",
          },
        }
      : {
          color: "text.primary",
          borderColor: "divider",
          "&:hover": {
            borderColor: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
        }),
  });

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        display: "flex",
        gap: 1,
        p: 1,
        bgcolor: "background.paper",
        width: "100%",
        overflowX: "auto",
        flexShrink: 0,
        ...sx,
      }}
    >
      {/* Text Formatting */}
      <Button
        variant={editor.isActive("bold") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("toggleBold")}
        sx={getButtonStyles(editor.isActive("bold"))}
      >
        <FormatBold />
      </Button>
      <Button
        variant={editor.isActive("italic") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("toggleItalic")}
        sx={getButtonStyles(editor.isActive("italic"))}
      >
        <FormatItalic />
      </Button>
      <Button
        variant={editor.isActive("underline") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("toggleUnderline")}
        sx={getButtonStyles(editor.isActive("underline"))}
      >
        <FormatUnderlined />
      </Button>
      <Button
        variant={editor.isActive("strike") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("toggleStrike")}
        sx={getButtonStyles(editor.isActive("strike"))}
      >
        <StrikethroughS />
      </Button>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Lists */}
      <Button
        variant={editor.isActive("bulletList") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("toggleBulletList")}
        sx={getButtonStyles(editor.isActive("bulletList"))}
      >
        <FormatListBulleted />
      </Button>
      <Button
        variant={editor.isActive("orderedList") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("toggleOrderedList")}
        sx={getButtonStyles(editor.isActive("orderedList"))}
      >
        <FormatListNumbered />
      </Button>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Text Alignment */}
      <Button
        variant={
          editor.isActive({ textAlign: "left" }) ? "contained" : "outlined"
        }
        size="small"
        onClick={() => handleFormatClick("setTextAlign", "left")}
        sx={getButtonStyles(editor.isActive({ textAlign: "left" }))}
      >
        <FormatAlignLeft />
      </Button>
      <Button
        variant={
          editor.isActive({ textAlign: "center" }) ? "contained" : "outlined"
        }
        size="small"
        onClick={() => handleFormatClick("setTextAlign", "center")}
        sx={getButtonStyles(editor.isActive({ textAlign: "center" }))}
      >
        <FormatAlignCenter />
      </Button>
      <Button
        variant={
          editor.isActive({ textAlign: "right" }) ? "contained" : "outlined"
        }
        size="small"
        onClick={() => handleFormatClick("setTextAlign", "right")}
        sx={getButtonStyles(editor.isActive({ textAlign: "right" }))}
      >
        <FormatAlignRight />
      </Button>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Table Controls */}
      <Button
        variant={editor.isActive("table") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("create-table")}
        sx={getButtonStyles(editor.isActive("table"))}
      >
        <TableChart />
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={() => handleFormatClick("add-row")}
        disabled={!editor.isActive("table")}
        sx={{
          minWidth: 0,
          px: 1,
          fontFamily: brand.fonts.body,
          color: "text.primary",
          borderColor: "divider",
          "&:hover:not(:disabled)": {
            borderColor: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
          "&:disabled": {
            color: "action.disabled",
            borderColor: "action.disabledBackground",
          },
        }}
      >
        <Add /> Row
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={() => handleFormatClick("add-column")}
        disabled={!editor.isActive("table")}
        sx={{
          minWidth: 0,
          px: 1,
          fontFamily: brand.fonts.body,
          color: "text.primary",
          borderColor: "divider",
          "&:hover:not(:disabled)": {
            borderColor: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
          "&:disabled": {
            color: "action.disabled",
            borderColor: "action.disabledBackground",
          },
        }}
      >
        <Add /> Column
      </Button>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Undo/Redo */}
      <Button
        variant="outlined"
        size="small"
        onClick={() => handleFormatClick("undo")}
        sx={{
          minWidth: 0,
          px: 1,
          fontFamily: brand.fonts.body,
          color: "text.primary",
          borderColor: "divider",
          "&:hover": {
            borderColor: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        <Undo fontSize="small" />
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={() => handleFormatClick("redo")}
        sx={{
          minWidth: 0,
          px: 1,
          fontFamily: brand.fonts.body,
          color: "text.primary",
          borderColor: "divider",
          "&:hover": {
            borderColor: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        <Redo fontSize="small" />
      </Button>
    </Box>
  );
}

export default EditorToolbar;
