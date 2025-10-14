"use client";

import { useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Divider,
  useTheme,
} from "@mui/material";
import { getCurrentBrand } from "@/config/brandConfig";
import { Edit as EditIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import TokenDisplay from "@/components/common/TokenDisplay";
import logger from "@/utils/logger";

/**
 * Type-safe interface for ScriptContent props
 */
interface ScriptContentProps {
  content: string;
  isEditing: boolean;
  isUpdating: boolean;
  editedContent: string;
  updateError: Error | null;
  genScriptId?: string;
  genScriptVersionNumber?: number;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: () => void;
  onContentChange: (content: string) => void;
}

/**
 * ScriptContent Component
 *
 * Displays and allows editing of script content with token counting.
 * Supports navigation to generated script versions and inline editing.
 * Fully theme-aware and optimized for performance.
 *
 * @component
 */
export function ScriptContent({
  content,
  isEditing,
  isUpdating,
  editedContent,
  updateError,
  genScriptId,
  genScriptVersionNumber,
  onEdit,
  onCancel,
  onUpdate,
  onContentChange,
}: ScriptContentProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  // React 19: useCallback for edit handler with navigation logic
  const handleEdit = useCallback(() => {
    if (genScriptId && genScriptVersionNumber && genScriptVersionNumber > 0) {
      router.push(
        `/ai-script-editor/generated/${genScriptId}/${genScriptVersionNumber}`
      );
    } else {
      // Fall back to the original onEdit prop if conditions aren't met
      onEdit();
      logger.warn(
        "Cannot navigate: Invalid genScriptId or genScriptVersionNumber",
        {
          genScriptId,
          genScriptVersionNumber,
        }
      );
    }
  }, [genScriptId, genScriptVersionNumber, router, onEdit]);

  // React 19: useCallback for content change handler
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onContentChange(e.target.value);
    },
    [onContentChange]
  );

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
          variant="h4"
          color="primary.main"
          sx={{ fontFamily: brand.fonts.heading }}
        >
          Story Content
        </Typography>
        {!isEditing && (
          <Button
            startIcon={<EditIcon />}
            onClick={handleEdit}
            variant="outlined"
            color="primary"
            size="small"
            sx={{ fontFamily: brand.fonts.body }}
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
            onChange={handleContentChange}
            sx={{
              mb: 2,
              "& .MuiInputBase-root": {
                bgcolor: "background.paper",
                fontFamily: brand.fonts.body,
              },
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "primary.main",
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
              sx={{ fontFamily: brand.fonts.body }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={onUpdate}
              disabled={isUpdating || !editedContent.trim()}
              sx={{ fontFamily: brand.fonts.body }}
            >
              {isUpdating ? "Updating..." : "Update Script"}
            </Button>
          </Box>
          {updateError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography sx={{ fontFamily: brand.fonts.body }}>
                {updateError instanceof Error
                  ? updateError.message
                  : "Failed to update script"}
              </Typography>
            </Alert>
          )}
        </>
      ) : (
        <Box
          sx={{
            p: 2,
            bgcolor: "background.default",
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: "primary.main",
            whiteSpace: "pre-wrap",
            fontFamily: brand.fonts.body,
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "text.primary",
            minHeight: "200px",
            overflowY: "auto",
          }}
        >
          {content}
        </Box>
      )}
    </>
  );
}

ScriptContent.displayName = "ScriptContent";
