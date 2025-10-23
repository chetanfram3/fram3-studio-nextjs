"use client";

import { Paper, Box, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { ScriptContent } from "./ScriptContent";
import { ScriptEditor } from "./ScriptEditor";

interface ScriptContentSectionProps {
  content: string;
  isEditing: boolean;
  isUpdating: boolean;
  editedContent: string;
  updateError: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: () => void;
  onContentChange: (content: string) => void;
}

/**
 * ScriptContentSection - Wrapper for script content display and editing
 *
 * Combines read and edit modes in a single container with proper theming
 */
export function ScriptContentSection({
  content,
  isEditing,
  isUpdating,
  editedContent,
  updateError,
  onEdit,
  onCancel,
  onUpdate,
  onContentChange,
}: ScriptContentSectionProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderTop: 4,
        borderColor: "primary.main",
        bgcolor: "background.paper",
        borderRadius: `${brand.borderRadius}px`,
        transition: theme.transitions.create(["box-shadow", "border-color"], {
          duration: theme.transitions.duration.standard,
        }),
        "&:hover": {
          boxShadow: theme.shadows[4],
        },
      }}
    >
      {updateError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {updateError}
        </Alert>
      )}

      {isEditing ? (
        <ScriptEditor
          content={editedContent}
          isUpdating={isUpdating}
          onCancel={onCancel}
          onUpdate={onUpdate}
          onContentChange={onContentChange}
        />
      ) : (
        <ScriptContent content={content} onEdit={onEdit} />
      )}
    </Paper>
  );
}
