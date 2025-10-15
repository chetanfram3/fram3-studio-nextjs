"use client";

import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Edit as EditIcon } from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";
import TokenDisplay from "@/components/common/TokenDisplay";

/**
 * ScriptContent - Displays and edits script content
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - No manual useCallback/useMemo unless necessary
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - No hardcoded colors or spacing
 *
 * @param content - The current script content
 * @param isEditing - Whether editing mode is active
 * @param isUpdating - Whether an update is in progress
 * @param editedContent - The edited content (when in edit mode)
 * @param updateError - Any error from the update operation
 * @param onEdit - Handler to enter edit mode
 * @param onCancel - Handler to cancel editing
 * @param onUpdate - Handler to save updates
 * @param onContentChange - Handler for content changes
 */

interface ScriptContentProps {
  content: string;
  isEditing: boolean;
  isUpdating: boolean;
  editedContent: string;
  updateError: unknown;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: () => void;
  onContentChange: (content: string) => void;
}

export default function ScriptContent({
  content,
  isEditing,
  isUpdating,
  editedContent,
  updateError,
  onEdit,
  onCancel,
  onUpdate,
  onContentChange,
}: ScriptContentProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "primary.main",
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
          }}
        >
          Script Content
        </Typography>
        {!isEditing && (
          <Button
            startIcon={<EditIcon />}
            onClick={onEdit}
            variant="outlined"
            color="primary"
            size="small"
            sx={{
              fontFamily: brand.fonts.body,
            }}
          >
            Edit Script
          </Button>
        )}
      </Box>
      <Divider sx={{ mb: 2 }} />

      {isEditing ? (
        <>
          <TextField
            fullWidth
            multiline
            rows={12}
            value={editedContent}
            onChange={(e) => onContentChange(e.target.value)}
            sx={{
              mb: 2,
              "& .MuiInputBase-root": {
                bgcolor: "background.paper",
                fontFamily: brand.fonts.body,
              },
              "& .MuiInputBase-input": {
                color: "text.primary",
              },
            }}
          />
          <TokenDisplay text={editedContent} maxTokens={2000} />
          <Box
            sx={{ mt: 2, display: "flex", gap: 2, justifyContent: "flex-end" }}
          >
            <Button
              onClick={onCancel}
              disabled={isUpdating}
              variant="outlined"
              color="primary"
              sx={{
                fontFamily: brand.fonts.body,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={onUpdate}
              disabled={isUpdating || !editedContent.trim()}
              sx={{
                fontFamily: brand.fonts.body,
              }}
            >
              {isUpdating ? "Updating..." : "Update Script"}
            </Button>
          </Box>
          {updateError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {updateError instanceof Error
                ? updateError.message
                : "Failed to update script"}
            </Alert>
          )}
        </>
      ) : (
        <Box
          sx={{
            p: 2,
            bgcolor: "background.paper",
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: "primary.main",
            whiteSpace: "pre-wrap",
            fontFamily: brand.fonts.body,
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "text.primary",
            minHeight: "200px",
            maxHeight: "500px",
            overflowY: "auto",
          }}
        >
          {content}
        </Box>
      )}
    </>
  );
}
