"use client";

import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { StreamChunk } from "@/types/streaming";

/**
 * MarkdownStream - Displays streaming markdown content with cursor
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Simple text accumulation pattern
 *
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts
 * - Respects light/dark mode automatically
 * - No hardcoded colors or spacing
 *
 * @param chunks - Array of stream chunks to display
 * @param isStreaming - Whether streaming is currently active
 */

interface MarkdownStreamProps {
  chunks: StreamChunk[];
  isStreaming: boolean;
}

export default function MarkdownStream({
  chunks,
  isStreaming,
}: MarkdownStreamProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!chunks.length) return;

    const newContent = chunks
      .map((chunk) => {
        // Handle simplified chunk format or Vertex AI response format
        if ("text" in chunk && typeof chunk.text === "string") {
          return chunk.text;
        }
        return chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
      })
      .join("");

    setContent(newContent);
  }, [chunks]);

  return (
    <Box sx={{ width: "100%", maxWidth: "100%" }}>
      <Box
        sx={{
          maxWidth: "100%",
          color: "text.primary",
        }}
      >
        <Typography
          component="div"
          sx={{
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: "1rem",
            lineHeight: 1.5,
            color: "text.primary",
            bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.100",
            p: 3,
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: "divider",
            overflow: "auto",
            maxHeight: "70vh",
          }}
        >
          {content}
          {isStreaming && (
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: "8px",
                height: "1em",
                bgcolor: "primary.main",
                ml: 0.5,
                verticalAlign: "middle",
                animation: "blink 1s step-end infinite",
                "@keyframes blink": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0 },
                },
              }}
            />
          )}
        </Typography>
      </Box>
    </Box>
  );
}
