"use client";

import React from "react";
import {
  Box,
  Button,
  Divider,
  alpha,
  useTheme,
  SxProps,
  Theme,
} from "@mui/material";
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
import { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
  sx?: SxProps<Theme>;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, sx }) => {
  const theme = useTheme();

  if (!editor) return null;

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

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        display: "flex",
        gap: 1,
        p: 1,
        bgcolor: (theme) => alpha(theme.palette.background.default, 0.3),
        width: "100%", // Ensure toolbar takes full available width
        overflowX: "auto", // Allow horizontal scrolling if content overflows
        flexShrink: 0, // Prevent shrinking
        ...sx, // Apply custom styles
      }}
    >
      <Button
        variant={editor.isActive("bold") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("toggleBold")}
        sx={{
          minWidth: 0,
          px: 1,
          backgroundColor: editor.isActive("bold")
            ? alpha(theme.palette.secondary.main, 0.8)
            : undefined,
          borderColor: editor.isActive("bold")
            ? theme.palette.secondary.main
            : undefined,
        }}
      >
        <FormatBold />
      </Button>
      <Button
        variant={editor.isActive("italic") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("toggleItalic")}
        sx={{
          minWidth: 0,
          px: 1,
          backgroundColor: editor.isActive("italic")
            ? alpha(theme.palette.secondary.main, 0.8)
            : undefined,
          borderColor: editor.isActive("italic")
            ? theme.palette.secondary.main
            : undefined,
        }}
      >
        <FormatItalic />
      </Button>
      <Button
        variant={editor.isActive("underline") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("toggleUnderline")}
        sx={{
          minWidth: 0,
          px: 1,
          backgroundColor: editor.isActive("underline")
            ? alpha(theme.palette.secondary.main, 0.8)
            : undefined,
          borderColor: editor.isActive("underline")
            ? theme.palette.secondary.main
            : undefined,
        }}
      >
        <FormatUnderlined />
      </Button>
      <Button
        variant={editor.isActive("strike") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("toggleStrike")}
        sx={{
          minWidth: 0,
          px: 1,
          backgroundColor: editor.isActive("strike")
            ? alpha(theme.palette.secondary.main, 0.8)
            : undefined,
          borderColor: editor.isActive("strike")
            ? theme.palette.secondary.main
            : undefined,
        }}
      >
        <StrikethroughS />
      </Button>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Button
        variant={editor.isActive("bulletList") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("toggleBulletList")}
        sx={{
          minWidth: 0,
          px: 1,
          backgroundColor: editor.isActive("bulletList")
            ? alpha(theme.palette.secondary.main, 0.8)
            : undefined,
          borderColor: editor.isActive("bulletList")
            ? theme.palette.secondary.main
            : undefined,
        }}
      >
        <FormatListBulleted />
      </Button>
      <Button
        variant={editor.isActive("orderedList") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("toggleOrderedList")}
        sx={{
          minWidth: 0,
          px: 1,
          backgroundColor: editor.isActive("orderedList")
            ? alpha(theme.palette.secondary.main, 0.8)
            : undefined,
          borderColor: editor.isActive("orderedList")
            ? theme.palette.secondary.main
            : undefined,
        }}
      >
        <FormatListNumbered />
      </Button>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Button
        variant={
          editor.isActive({ textAlign: "left" }) ? "contained" : "outlined"
        }
        size="small"
        onClick={() => handleFormatClick("setTextAlign", "left")}
        sx={{
          minWidth: 0,
          px: 1,
          backgroundColor: editor.isActive({ textAlign: "left" })
            ? alpha(theme.palette.secondary.main, 0.8)
            : undefined,
          borderColor: editor.isActive({ textAlign: "left" })
            ? theme.palette.secondary.main
            : undefined,
        }}
      >
        <FormatAlignLeft />
      </Button>
      <Button
        variant={
          editor.isActive({ textAlign: "center" }) ? "contained" : "outlined"
        }
        size="small"
        onClick={() => handleFormatClick("setTextAlign", "center")}
        sx={{
          minWidth: 0,
          px: 1,
          backgroundColor: editor.isActive({ textAlign: "center" })
            ? alpha(theme.palette.secondary.main, 0.8)
            : undefined,
          borderColor: editor.isActive({ textAlign: "center" })
            ? theme.palette.secondary.main
            : undefined,
        }}
      >
        <FormatAlignCenter />
      </Button>
      <Button
        variant={
          editor.isActive({ textAlign: "right" }) ? "contained" : "outlined"
        }
        size="small"
        onClick={() => handleFormatClick("setTextAlign", "right")}
        sx={{
          minWidth: 0,
          px: 1,
          backgroundColor: editor.isActive({ textAlign: "right" })
            ? alpha(theme.palette.secondary.main, 0.8)
            : undefined,
          borderColor: editor.isActive({ textAlign: "right" })
            ? theme.palette.secondary.main
            : undefined,
        }}
      >
        <FormatAlignRight />
      </Button>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Button
        variant={editor.isActive("table") ? "contained" : "outlined"}
        size="small"
        onClick={() => handleFormatClick("create-table")}
        sx={{
          minWidth: 0,
          px: 1,
          backgroundColor: editor.isActive("table")
            ? alpha(theme.palette.secondary.main, 0.8)
            : undefined,
          borderColor: editor.isActive("table")
            ? theme.palette.secondary.main
            : undefined,
        }}
      >
        <TableChart />
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={() => handleFormatClick("add-row")}
        sx={{ minWidth: 0, px: 1 }}
        disabled={!editor.isActive("table")}
      >
        <Add /> Row
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={() => handleFormatClick("add-column")}
        sx={{ minWidth: 0, px: 1 }}
        disabled={!editor.isActive("table")}
      >
        <Add /> Column
      </Button>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Button
        variant="outlined"
        size="small"
        onClick={() => handleFormatClick("undo")}
        sx={{ minWidth: 0, px: 1 }}
      >
        <Undo fontSize="small" />
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={() => handleFormatClick("redo")}
        sx={{ minWidth: 0, px: 1 }}
      >
        <Redo fontSize="small" />
      </Button>
    </Box>
  );
};

export default EditorToolbar;
