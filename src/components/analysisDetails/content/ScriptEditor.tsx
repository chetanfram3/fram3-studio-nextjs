"use client";

import { Box, Typography, TextField, Button, Stack } from "@mui/material";
import { Save as SaveIcon, Cancel as CancelIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

interface ScriptEditorProps {
  content: string;
  isUpdating: boolean;
  onCancel: () => void;
  onUpdate: () => void;
  onContentChange: (content: string) => void;
}

/**
 * ScriptEditor - Edits script content
 */
export function ScriptEditor({
  content,
  isUpdating,
  onCancel,
  onUpdate,
  onContentChange,
}: ScriptEditorProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontFamily: brand.fonts.heading,
          color: "text.primary",
        }}
      >
        Edit Script Content
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={15}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        disabled={isUpdating}
        sx={{
          mb: 2,
          "& .MuiInputBase-root": {
            fontFamily: "monospace",
            fontSize: "0.875rem",
            lineHeight: 1.6,
          },
        }}
      />

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          disabled={isUpdating}
          sx={{
            borderColor: "divider",
            color: "text.secondary",
            "&:hover": {
              borderColor: "text.primary",
              bgcolor: "action.hover",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={onUpdate}
          disabled={isUpdating || !content.trim()}
          sx={{
            bgcolor: "primary.main",
            "&:hover": {
              bgcolor: "primary.dark",
            },
          }}
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </Stack>
    </Box>
  );
}
