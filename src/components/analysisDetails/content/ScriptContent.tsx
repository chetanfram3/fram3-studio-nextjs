"use client";

import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

interface ScriptContentProps {
  content: string;
  onEdit: () => void;
}

/**
 * ScriptContent - Displays script content in read mode
 */
export function ScriptContent({ content, onEdit }: ScriptContentProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: brand.fonts.heading,
            color: "text.primary",
          }}
        >
          Script Content
        </Typography>

        <Tooltip title="Edit script">
          <IconButton
            onClick={onEdit}
            sx={{
              color: "primary.main",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography
        component="pre"
        sx={{
          fontFamily: "monospace",
          fontSize: "0.875rem",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: "text.primary",
          bgcolor: "background.default",
          p: 2,
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
          maxHeight: "600px",
          overflow: "auto",
        }}
      >
        {content}
      </Typography>
    </Box>
  );
}